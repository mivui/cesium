import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 通过以下方式对 {@link Cartographic} 位置数组启动地形高度查询
 * 向地形提供商请求瓦片、采样和插值。 插值
 * 匹配用于在指定级别渲染地形的三角形。 查询
 * 异步发生，因此此函数返回一个 Promise，该 Promise 在
 * 查询完成。 每个点高度都已就地修改。 如果高度不能
 * 确定，因为该位置的指定标高没有可用的地形数据，
 * 或发生其他错误时，高度将设置为 undefined。 作为典型的
 * {@link Cartographic} 类型，则提供的高度是高于参考椭球体的高度
 *（例如 {@link Ellipsoid.WGS84}），而不是高于平均海平面的高度。 在其他
 * 单词，如果在 Ocean 中采样，它不一定是 0.0。此函数需要
 * 地形细节级别作为输入，如果您需要精确获取地形的高度
 * 尽可能 （即具有最高级别的细节） 使用 {@link sampleTerrainMostDetailed}。
 *
 * @function sampleTerrain
 *
 * @param {TerrainProvider} terrainProvider 从中查询高度的 terrain 提供程序。
 * @param {number} level 从中查询地形高度的地形细节级别。
 * @param {Cartographic[]} positions 要随地形高度更新的位置。
 * @param {boolean} [rejectOnTileFail=false] 如果为 true，则对于任何失败的地形瓦片请求，承诺都将被拒绝。如果为 false，则返回的高度将是 undefined。
 * @returns {Promise<Cartographic[]>} 当 terrain 查询完成时，解析为提供的位置列表的 Promise。
 *
 * @see sampleTerrainMostDetailed
 *
 * @example
 * // Query the terrain height of two Cartographic positions
 * const terrainProvider = await Cesium.createWorldTerrainAsync();
 * const positions = [
 *     Cesium.Cartographic.fromDegrees(86.925145, 27.988257),
 *     Cesium.Cartographic.fromDegrees(87.0, 28.0)
 * ];
 * const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions);
 * // positions[0].height and positions[1].height have been updated.
 * // updatedPositions is just a reference to positions.
 *
 * // To handle tile errors, pass true for the rejectOnTileFail parameter.
 * try {
 *    const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions, true);
 * } catch (error) {
 *   // A tile request error occurred.
 * }
 */
async function sampleTerrain(
  terrainProvider,
  level,
  positions,
  rejectOnTileFail
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
 * @param {object[]} tileRequests 更改后的请求列表，将尝试第一个请求
 * @param {Array<Promise<void>>} results 将结果 promise 放入的列表
 * @param {boolean} rejectOnTileFail 如果为 true，则 Promise 将被拒绝。 如果为 false，则返回的高度将是 undefined。
 * @returns {boolean} true，如果请求已发出，并且我们可以立即尝试下一项，
 * 或 false（如果我们受到限制，应该等待一段时间再重试）。
 *
 * @private
 */
function attemptConsumeNextQueueItem(tileRequests, results, rejectOnTileFail) {
  const tileRequest = tileRequests[0];
  const requestPromise = tileRequest.terrainProvider.requestTileGeometry(
    tileRequest.x,
    tileRequest.y,
    tileRequest.level
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
 * 将 window.setTimeout 包装在 Promise 中
 * @param {number} ms
 * @private
 */
function delay(ms) {
  return new Promise(function (res) {
    setTimeout(res, ms);
  });
}

/**
 * 递归地使用所有 tileRequest，直到列表被清空
 * 并且每个结果的 Promise 已放入结果列表中
 * @param {object[]} tileRequests 需要发出的请求列表
 * @param {Array<Promise<void>>} results 将所有结果 Promise 放入的列表
 * @param {boolean} rejectOnTileFail 如果为 true，则 Promise 将被拒绝。 如果为 false，则返回的高度将是 undefined。
 * @returns {Promise<void>} 一个 Promise，在所有请求都启动后 resolved
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
    rejectOnTileFail
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
    rejectOnTileFail
  ).then(function () {
    // now all the required requests have been started
    //  we just wait for them all to finish
    return Promise.all(tilePromises).then(function () {
      return positions;
    });
  });
}

/**
 * 对给定的 {@link Cartographic} 的给定 {@link TerrainData} 调用 {@link TerrainData#interpolateHeight}，并且
 * 如果返回值不是 undefined，则将分配 height 属性。
 *
 * 如果返回值为 false;它建议你应该先调用 {@link TerrainData#createMesh}。
 * @param {Cartographic} position 要为其插值并分配高度值的位置
 * @param {TerrainData} terrainData
 * @param {Rectangle} rectangle
 * @returns {boolean} 如果高度实际上是插值和分配的
 * @private
 */
function interpolateAndAssignHeight(position, terrainData, rectangle) {
  const height = terrainData.interpolateHeight(
    rectangle,
    position.longitude,
    position.latitude
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
    tileRequest.level
  );
  return function (terrainData) {
    let isMeshRequired = false;
    for (let i = 0; i < tilePositions.length; ++i) {
      const position = tilePositions[i];
      const isHeightAssigned = interpolateAndAssignHeight(
        position,
        terrainData,
        rectangle
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
