import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 通过从地形提供程序请求瓦片、采样和插值，为一组{@link Cartographic}位置发起地形高度查询。插值
 * 匹配用于渲染指定层级地形的三角形。查询
 * 是异步进行的，因此此函数返回一个Promise，在查询完成时
 * 解析。每个点的高度都会被就地修改。如果无法确定高度，
 * 因为该位置在指定层级没有可用的地形数据，
 * 或者发生其他错误，高度将被设置为undefined。作为
 * {@link Cartographic}类型的典型特征，提供的高度是参考椭球体
 * （如{@link Ellipsoid.WGS84}）以上的高度，而不是平均海平面以上的海拔。换句话说，
 * 如果在海洋中采样，它不一定为0.0。此函数需要
 * 地形细节层级作为输入，如果您需要尽可能精确地
 * 获取地形海拔（即使用最大细节层级），请使用{@link sampleTerrainMostDetailed}。
 *
 * @function sampleTerrain
 *
 * @param {TerrainProvider} terrainProvider 要从中查询高度的地形提供程序。
 * @param {number} level 要从中查询地形高度的地形细节层级。
 * @param {Cartographic[]} positions 要用地形高度更新的位置。
 * @param {boolean} [rejectOnTileFail=false] 如果为true，对于任何失败的地形瓦片请求，Promise将被拒绝。如果为false，返回的高度将为undefined。
 * @returns {Promise<Cartographic[]>} 当地形查询完成时，解析为提供的位置列表的Promise。
 *
 * @see sampleTerrainMostDetailed
 *
 * @example
 * // 查询两个Cartographic位置的地形高度
 * const terrainProvider = await Cesium.createWorldTerrainAsync();
 * const positions = [
 *     Cesium.Cartographic.fromDegrees(86.925145, 27.988257),
 *     Cesium.Cartographic.fromDegrees(87.0, 28.0)
 * ];
 * const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions);
 * // positions[0].height和positions[1].height已被更新。
 * // updatedPositions只是positions的引用。
 *
 * // 要处理瓦片错误，请为rejectOnTileFail参数传递true。
 * try {
 *    const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions, true);
 * } catch (error) {
 *   // 发生瓦片请求错误。
 * }
 */
async function sampleTerrain(
  terrainProvider,
  level,
  positions,
  rejectOnTileFail,
) {
  if (!defined(rejectOnTileFail)) {
    rejectOnTileFail = false;
  }
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrainProvider", terrainProvider);
  Check.typeOf.number("level", level);
  Check.typeOf.bool("rejectOnTileFail", rejectOnTileFail);
  Check.defined("positions", positions);
  //>>includeEnd('debug');

  return doSampling(terrainProvider, level, positions, rejectOnTileFail);
}

/**
 * @param {object[]} tileRequests 变异的请求列表，将尝试第一个请求
 * @param {Array<Promise<void>>} results 将结果Promise放入其中的列表
 * @param {boolean} rejectOnTileFail 如果为true，Promise将被拒绝。如果为false，返回的高度将为undefined。
 * @returns {boolean} 如果请求已发出，我们可以立即尝试下一个项目，则为true，
 *  如果我们被节流并应在重试前等待一段时间，则为false。
 *
 * @private
 */
function attemptConsumeNextQueueItem(tileRequests, results, rejectOnTileFail) {
  const tileRequest = tileRequests[0];
  const requestPromise = tileRequest.terrainProvider.requestTileGeometry(
    tileRequest.x,
    tileRequest.y,
    tileRequest.level,
  );

  if (!requestPromise) {
    // getting back undefined instead of a promise indicates we should retry a bit later
    return false;
  }

  let promise;

  if (rejectOnTileFail) {
    promise = requestPromise.then(createInterpolateFunction(tileRequest));
  } else {
    promise = requestPromise
      .then(createInterpolateFunction(tileRequest))
      .catch(createMarkFailedFunction(tileRequest));
  }

  // remove the request we've just done from the queue
  //  and add its promise result to the result list
  tileRequests.shift();
  results.push(promise);

  // indicate we should synchronously attempt the next request as well
  return true;
}

/**
 * 将window.setTimeout包装在Promise中
 * @param {number} ms 等待的毫秒数
 * @private
 */
function delay(ms) {
  return new Promise(function (res) {
    setTimeout(res, ms);
  });
}

/**
 * 递归地使用所有tileRequests，直到列表被清空
 *  并且每个结果的Promise都已被放入结果列表
 * @param {object[]} tileRequests 要发出的请求列表
 * @param {Array<Promise<void>>} results 将所有结果Promise放入其中的列表
 * @param {boolean} rejectOnTileFail 如果为true，Promise将被拒绝。如果为false，返回的高度将为undefined。
 * @returns {Promise<void>} 一旦所有请求都已启动就解析的Promise
 *
 * @private
 */
function drainTileRequestQueue(tileRequests, results, rejectOnTileFail) {
  // nothing left to do
  if (!tileRequests.length) {
    return Promise.resolve();
  }

  // consume an item from the queue, which will
  //  mutate the request and result lists, and return true if we should
  //  immediately attempt to consume the next item as well
  const success = attemptConsumeNextQueueItem(
    tileRequests,
    results,
    rejectOnTileFail,
  );
  if (success) {
    return drainTileRequestQueue(tileRequests, results, rejectOnTileFail);
  }

  // wait a small fixed amount of time first, before retrying the same request again
  return delay(100).then(() => {
    return drainTileRequestQueue(tileRequests, results, rejectOnTileFail);
  });
}

function doSampling(terrainProvider, level, positions, rejectOnTileFail) {
  const tilingScheme = terrainProvider.tilingScheme;

  let i;

  // Sort points into a set of tiles
  const tileRequests = []; // Result will be an Array as it's easier to work with
  const tileRequestSet = {}; // A unique set
  for (i = 0; i < positions.length; ++i) {
    const xy = tilingScheme.positionToTileXY(positions[i], level);
    if (!defined(xy)) {
      continue;
    }

    const key = xy.toString();

    if (!tileRequestSet.hasOwnProperty(key)) {
      // When tile is requested for the first time
      const value = {
        x: xy.x,
        y: xy.y,
        level: level,
        tilingScheme: tilingScheme,
        terrainProvider: terrainProvider,
        positions: [],
      };
      tileRequestSet[key] = value;
      tileRequests.push(value);
    }

    // Now append to array of points for the tile
    tileRequestSet[key].positions.push(positions[i]);
  }

  // create our list of result promises to be filled
  const tilePromises = [];
  return drainTileRequestQueue(
    tileRequests,
    tilePromises,
    rejectOnTileFail,
  ).then(function () {
    // now all the required requests have been started
    //  we just wait for them all to finish
    return Promise.all(tilePromises).then(function () {
      return positions;
    });
  });
}

/**
 * 在给定的{@link TerrainData}上调用{@link TerrainData#interpolateHeight}，用于给定的{@link Cartographic}，并且
 *  如果返回值不是undefined，将分配height属性。
 *
 * 如果返回值为false，则建议您应先调用{@link TerrainData#createMesh}。
 * @param {Cartographic} position 要插值并将高度值分配给的位置
 * @param {TerrainData} terrainData 地形数据
 * @param {Rectangle} rectangle 矩形区域
 * @returns {boolean} 如果高度实际被插值并分配则为true
 * @private
 */
function interpolateAndAssignHeight(position, terrainData, rectangle) {
  const height = terrainData.interpolateHeight(
    rectangle,
    position.longitude,
    position.latitude,
  );
  if (height === undefined) {
    // if height comes back as undefined, it may implicitly mean the terrain data
    //  requires us to call TerrainData.createMesh() first (ArcGIS requires this in particular)
    //  so we'll return false and do that next!
    return false;
  }
  position.height = height;
  return true;
}

function createInterpolateFunction(tileRequest) {
  const tilePositions = tileRequest.positions;
  const rectangle = tileRequest.tilingScheme.tileXYToRectangle(
    tileRequest.x,
    tileRequest.y,
    tileRequest.level,
  );
  return function (terrainData) {
    let isMeshRequired = false;
    for (let i = 0; i < tilePositions.length; ++i) {
      const position = tilePositions[i];
      const isHeightAssigned = interpolateAndAssignHeight(
        position,
        terrainData,
        rectangle,
      );
      // we've found a position which returned undefined - hinting to us
      //  that we probably need to create a mesh for this terrain data.
      // so break out of this loop and create the mesh - then we'll interpolate all the heights again
      if (!isHeightAssigned) {
        isMeshRequired = true;
        break;
      }
    }

    if (!isMeshRequired) {
      // all position heights were interpolated - we don't need the mesh
      return Promise.resolve();
    }

    // create the mesh - and interpolate all the positions again
    // note: terrain exaggeration is not passed in - we are only interested in the raw data
    return terrainData
      .createMesh({
        tilingScheme: tileRequest.tilingScheme,
        x: tileRequest.x,
        y: tileRequest.y,
        level: tileRequest.level,
        // don't throttle this mesh creation because we've asked to sample these points;
        //  so sample them! We don't care how many tiles that is!
        throttle: false,
      })
      .then(function () {
        // mesh has been created - so go through every position (maybe again)
        //  and re-interpolate the heights - presumably using the mesh this time
        for (let i = 0; i < tilePositions.length; ++i) {
          const position = tilePositions[i];
          // if it doesn't work this time - that's fine, we tried.
          interpolateAndAssignHeight(position, terrainData, rectangle);
        }
      });
  };
}

function createMarkFailedFunction(tileRequest) {
  const tilePositions = tileRequest.positions;
  return function () {
    for (let i = 0; i < tilePositions.length; ++i) {
      const position = tilePositions[i];
      position.height = undefined;
    }
  };
}

export default sampleTerrain;
