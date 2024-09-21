import BoundingSphere from "./BoundingSphere.js";
import buildModuleUrl from "./buildModuleUrl.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";

const scratchDiagonalCartesianNE = new Cartesian3();
const scratchDiagonalCartesianSW = new Cartesian3();
const scratchDiagonalCartographic = new Cartographic();
const scratchCenterCartesian = new Cartesian3();
const scratchSurfaceCartesian = new Cartesian3();

const scratchBoundingSphere = new BoundingSphere();
const tilingScheme = new GeographicTilingScheme();
const scratchCorners = [
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
];
const scratchTileXY = new Cartesian2();

/**
 * 用于近似地形高度的函数集合
 * @private
 */
const ApproximateTerrainHeights = {};

/**
 * 初始化最小和最大地形高度
 * @return {Promise<void>}
 */
ApproximateTerrainHeights.initialize = function () {
  let initPromise = ApproximateTerrainHeights._initPromise;
  if (defined(initPromise)) {
    return initPromise;
  }
  initPromise = Resource.fetchJson(
    buildModuleUrl("Assets/approximateTerrainHeights.json")
  ).then(function (json) {
    ApproximateTerrainHeights._terrainHeights = json;
  });
  ApproximateTerrainHeights._initPromise = initPromise;

  return initPromise;
};

/**
 * 计算给定矩形的最小和最大地形高度
 * @param {Rectangle} rectangle 边界矩形
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default]  ellipsoid
 * @return {{minimumTerrainHeight: number, maximumTerrainHeight: number}}
 */
ApproximateTerrainHeights.getMinimumMaximumHeights = function (
  rectangle,
  ellipsoid
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("rectangle", rectangle);
  if (!defined(ApproximateTerrainHeights._terrainHeights)) {
    throw new DeveloperError(
      "You must call ApproximateTerrainHeights.initialize and wait for the promise to resolve before using this function"
    );
  }
  //>>includeEnd('debug');
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

  const xyLevel = getTileXYLevel(rectangle);

  // Get the terrain min/max for that tile
  let minTerrainHeight = ApproximateTerrainHeights._defaultMinTerrainHeight;
  let maxTerrainHeight = ApproximateTerrainHeights._defaultMaxTerrainHeight;
  if (defined(xyLevel)) {
    const key = `${xyLevel.level}-${xyLevel.x}-${xyLevel.y}`;
    const heights = ApproximateTerrainHeights._terrainHeights[key];
    if (defined(heights)) {
      minTerrainHeight = heights[0];
      maxTerrainHeight = heights[1];
    }

    // Compute min by taking the center of the NE->SW diagonal and finding distance to the surface
    ellipsoid.cartographicToCartesian(
      Rectangle.northeast(rectangle, scratchDiagonalCartographic),
      scratchDiagonalCartesianNE
    );
    ellipsoid.cartographicToCartesian(
      Rectangle.southwest(rectangle, scratchDiagonalCartographic),
      scratchDiagonalCartesianSW
    );

    Cartesian3.midpoint(
      scratchDiagonalCartesianSW,
      scratchDiagonalCartesianNE,
      scratchCenterCartesian
    );
    const surfacePosition = ellipsoid.scaleToGeodeticSurface(
      scratchCenterCartesian,
      scratchSurfaceCartesian
    );
    if (defined(surfacePosition)) {
      const distance = Cartesian3.distance(
        scratchCenterCartesian,
        surfacePosition
      );
      minTerrainHeight = Math.min(minTerrainHeight, -distance);
    } else {
      minTerrainHeight = ApproximateTerrainHeights._defaultMinTerrainHeight;
    }
  }

  minTerrainHeight = Math.max(
    ApproximateTerrainHeights._defaultMinTerrainHeight,
    minTerrainHeight
  );

  return {
    minimumTerrainHeight: minTerrainHeight,
    maximumTerrainHeight: maxTerrainHeight,
  };
};

/**
 * 根据矩形中的贴图高度计算边界球
 * @param {Rectangle} rectangle 边界矩形
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default]  ellipsoid
 * @return {BoundingSphere} 结果边界球
 */
ApproximateTerrainHeights.getBoundingSphere = function (rectangle, ellipsoid) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("rectangle", rectangle);
  if (!defined(ApproximateTerrainHeights._terrainHeights)) {
    throw new DeveloperError(
      "You must call ApproximateTerrainHeights.initialize and wait for the promise to resolve before using this function"
    );
  }
  //>>includeEnd('debug');
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

  const xyLevel = getTileXYLevel(rectangle);

  // Get the terrain max for that tile
  let maxTerrainHeight = ApproximateTerrainHeights._defaultMaxTerrainHeight;
  if (defined(xyLevel)) {
    const key = `${xyLevel.level}-${xyLevel.x}-${xyLevel.y}`;
    const heights = ApproximateTerrainHeights._terrainHeights[key];
    if (defined(heights)) {
      maxTerrainHeight = heights[1];
    }
  }

  const result = BoundingSphere.fromRectangle3D(rectangle, ellipsoid, 0.0);
  BoundingSphere.fromRectangle3D(
    rectangle,
    ellipsoid,
    maxTerrainHeight,
    scratchBoundingSphere
  );

  return BoundingSphere.union(result, scratchBoundingSphere, result);
};

function getTileXYLevel(rectangle) {
  Cartographic.fromRadians(
    rectangle.east,
    rectangle.north,
    0.0,
    scratchCorners[0]
  );
  Cartographic.fromRadians(
    rectangle.west,
    rectangle.north,
    0.0,
    scratchCorners[1]
  );
  Cartographic.fromRadians(
    rectangle.east,
    rectangle.south,
    0.0,
    scratchCorners[2]
  );
  Cartographic.fromRadians(
    rectangle.west,
    rectangle.south,
    0.0,
    scratchCorners[3]
  );

  // Determine which tile the bounding rectangle is in
  let lastLevelX = 0,
    lastLevelY = 0;
  let currentX = 0,
    currentY = 0;
  const maxLevel = ApproximateTerrainHeights._terrainHeightsMaxLevel;
  let i;
  for (i = 0; i <= maxLevel; ++i) {
    let failed = false;
    for (let j = 0; j < 4; ++j) {
      const corner = scratchCorners[j];
      tilingScheme.positionToTileXY(corner, i, scratchTileXY);
      if (j === 0) {
        currentX = scratchTileXY.x;
        currentY = scratchTileXY.y;
      } else if (currentX !== scratchTileXY.x || currentY !== scratchTileXY.y) {
        failed = true;
        break;
      }
    }

    if (failed) {
      break;
    }

    lastLevelX = currentX;
    lastLevelY = currentY;
  }

  if (i === 0) {
    return undefined;
  }

  return {
    x: lastLevelX,
    y: lastLevelY,
    level: i > maxLevel ? maxLevel : i - 1,
  };
}

ApproximateTerrainHeights._terrainHeightsMaxLevel = 6;
ApproximateTerrainHeights._defaultMaxTerrainHeight = 9000.0;
ApproximateTerrainHeights._defaultMinTerrainHeight = -100000.0;
ApproximateTerrainHeights._terrainHeights = undefined;
ApproximateTerrainHeights._initPromise = undefined;

Object.defineProperties(ApproximateTerrainHeights, {
  /**
   * 确定地形高度是否初始化并准备使用。要初始化地形高度，
   * 调用 {@link estimateterrainheights #initialize} 并等待返回的promise解决。
   * @type {boolean}
   * @readonly
   * @memberof ApproximateTerrainHeights
   */
  initialized: {
    get: function () {
      return defined(ApproximateTerrainHeights._terrainHeights);
    },
  },
});
export default ApproximateTerrainHeights;
