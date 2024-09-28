import Cartesian2 from "./Cartesian2.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Rectangle from "./Rectangle.js";
import WebMercatorProjection from "./WebMercatorProjection.js";

/**
 * 引用 {@link WebMercatorProjection} 的几何图形的平铺方案，EPSG：3857。 这是
 * Google 地图、Microsoft Bing 地图和大多数 ESRI ArcGIS Online 使用的切片方案。
 *
 * @alias WebMercatorTilingScheme
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 其表面正在平铺的椭球体。默认为
 * 默认椭球体。
 * @param {number} [options.numberOfLevelZeroTilesX=1] 在零级
 * 瓦片树。
 * @param {number} [options.numberOfLevelZeroTilesY=1] 在零级
 * 瓦片树。
 * @param {Cartesian2} [options.rectangleSouthwestInMeters] 矩形的西南角被
 * 平铺方案，以米为单位。 如果未指定此参数或 rectangleNortheastInMeters，则整个
 * 地球仪在经度方向上覆盖，在纬度上覆盖相等的距离
 * 方向，从而产生方形投影。
 * @param {Cartesian2} [options.rectangleNortheastInMeters] 矩形的东北角被
 * 平铺方案，以米为单位。 如果未指定此参数或 rectangleSouthwestInMeters，则整个
 * 地球仪在经度方向上覆盖，在纬度上覆盖相等的距离
 * 方向，从而产生方形投影。
 */
function WebMercatorTilingScheme(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._numberOfLevelZeroTilesX = defaultValue(
    options.numberOfLevelZeroTilesX,
    1,
  );
  this._numberOfLevelZeroTilesY = defaultValue(
    options.numberOfLevelZeroTilesY,
    1,
  );

  this._projection = new WebMercatorProjection(this._ellipsoid);

  if (
    defined(options.rectangleSouthwestInMeters) &&
    defined(options.rectangleNortheastInMeters)
  ) {
    this._rectangleSouthwestInMeters = options.rectangleSouthwestInMeters;
    this._rectangleNortheastInMeters = options.rectangleNortheastInMeters;
  } else {
    const semimajorAxisTimesPi = this._ellipsoid.maximumRadius * Math.PI;
    this._rectangleSouthwestInMeters = new Cartesian2(
      -semimajorAxisTimesPi,
      -semimajorAxisTimesPi,
    );
    this._rectangleNortheastInMeters = new Cartesian2(
      semimajorAxisTimesPi,
      semimajorAxisTimesPi,
    );
  }

  const southwest = this._projection.unproject(
    this._rectangleSouthwestInMeters,
  );
  const northeast = this._projection.unproject(
    this._rectangleNortheastInMeters,
  );
  this._rectangle = new Rectangle(
    southwest.longitude,
    southwest.latitude,
    northeast.longitude,
    northeast.latitude,
  );
}

Object.defineProperties(WebMercatorTilingScheme.prototype, {
  /**
   * 获取此平铺方案平铺的椭球体。
   * @memberof WebMercatorTilingScheme.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取此平铺方案覆盖的矩形（以弧度为单位）。
   * @memberof WebMercatorTilingScheme.prototype
   * @type {Rectangle}
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * 获取此切片方案使用的地图投影。
   * @memberof WebMercatorTilingScheme.prototype
   * @type {MapProjection}
   */
  projection: {
    get: function () {
      return this._projection;
    },
  },
});

/**
 * 获取指定细节级别 X 方向的图块总数。
 *
 * @param {number} level 细节级别。
 * @returns {number} 给定级别 X 方向的图块数量。
 */
WebMercatorTilingScheme.prototype.getNumberOfXTilesAtLevel = function (level) {
  return this._numberOfLevelZeroTilesX << level;
};

/**
 * 获取指定细节级别 Y 方向的平铺总数。
 *
 * @param {number} level 细节级别。
 * @returns {number} 给定级别上 Y 方向的图块数量。
 */
WebMercatorTilingScheme.prototype.getNumberOfYTilesAtLevel = function (level) {
  return this._numberOfLevelZeroTilesY << level;
};

/**
 * 将以大地弧度中指定的矩形转换为本地坐标系
 * 的 Package。
 *
 * @param {Rectangle} rectangle 要转换的矩形。
 * @param {Rectangle} [result] 要将结果复制到的实例，如果是新实例，则为 undefined
 * 应创建。
 * @returns {Rectangle} 指定的 'result'，或者包含 'result' 的原生矩形的新对象
 * 未定义。
 */
WebMercatorTilingScheme.prototype.rectangleToNativeRectangle = function (
  rectangle,
  result,
) {
  const projection = this._projection;
  const southwest = projection.project(Rectangle.southwest(rectangle));
  const northeast = projection.project(Rectangle.northeast(rectangle));

  if (!defined(result)) {
    return new Rectangle(southwest.x, southwest.y, northeast.x, northeast.y);
  }

  result.west = southwest.x;
  result.south = southwest.y;
  result.east = northeast.x;
  result.north = northeast.y;
  return result;
};

/**
 * 将图块 x、y 坐标和标高转换为以本机坐标表示的矩形
 * 的平铺方案。
 *
 * @param {number} x 瓦片的整数 x 坐标。
 * @param {number} y 瓦片的整数 y 坐标。
 * @param {number} level 瓦片细节级别。 零是最不详细的。
 * @param {object} [result] 要将结果复制到的实例，如果是新实例，则为 undefined
 * 应创建。
 * @returns {Rectangle} 指定的 'result'，或包含矩形的新对象
 * 如果 'result' 未定义。
 */
WebMercatorTilingScheme.prototype.tileXYToNativeRectangle = function (
  x,
  y,
  level,
  result,
) {
  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth =
    (this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x) /
    xTiles;
  const west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
  const east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;

  const yTileHeight =
    (this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y) /
    yTiles;
  const north = this._rectangleNortheastInMeters.y - y * yTileHeight;
  const south = this._rectangleNortheastInMeters.y - (y + 1) * yTileHeight;

  if (!defined(result)) {
    return new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * 将平铺 x、y 坐标和级别转换为以弧度为单位的制图矩形。
 *
 * @param {number} x 瓦片的整数 x 坐标。
 * @param {number} y 瓦片的整数 y 坐标。
 * @param {number} level 瓦片细节级别。 零是最不详细的。
 * @param {object} [result] 要将结果复制到的实例，如果是新实例，则为 undefined
 * 应创建。
 * @returns {Rectangle} 指定的 'result'，或包含矩形的新对象
 * 如果 'result' 未定义。
 */
WebMercatorTilingScheme.prototype.tileXYToRectangle = function (
  x,
  y,
  level,
  result,
) {
  const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

  const projection = this._projection;
  const southwest = projection.unproject(
    new Cartesian2(nativeRectangle.west, nativeRectangle.south),
  );
  const northeast = projection.unproject(
    new Cartesian2(nativeRectangle.east, nativeRectangle.north),
  );

  nativeRectangle.west = southwest.longitude;
  nativeRectangle.south = southwest.latitude;
  nativeRectangle.east = northeast.longitude;
  nativeRectangle.north = northeast.latitude;
  return nativeRectangle;
};

/**
 * 计算包含
 * 给定的制图位置。
 *
 * @param {Cartographic} position 位置。
 * @param {number} level 瓦片细节级别。 零是最不详细的。
 * @param {Cartesian2} [result] 要将结果复制到的实例，如果是新实例，则为 undefined
 * 应创建。
 * @returns {Cartesian2} 指定的 'result'，或包含图块 x、y 坐标的新对象
 * 如果 'result' 未定义。
 */
WebMercatorTilingScheme.prototype.positionToTileXY = function (
  position,
  level,
  result,
) {
  const rectangle = this._rectangle;
  if (!Rectangle.contains(rectangle, position)) {
    // outside the bounds of the tiling scheme
    return undefined;
  }

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const overallWidth =
    this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x;
  const xTileWidth = overallWidth / xTiles;
  const overallHeight =
    this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y;
  const yTileHeight = overallHeight / yTiles;

  const projection = this._projection;

  const webMercatorPosition = projection.project(position);
  const distanceFromWest =
    webMercatorPosition.x - this._rectangleSouthwestInMeters.x;
  const distanceFromNorth =
    this._rectangleNortheastInMeters.y - webMercatorPosition.y;

  let xTileCoordinate = (distanceFromWest / xTileWidth) | 0;
  if (xTileCoordinate >= xTiles) {
    xTileCoordinate = xTiles - 1;
  }
  let yTileCoordinate = (distanceFromNorth / yTileHeight) | 0;
  if (yTileCoordinate >= yTiles) {
    yTileCoordinate = yTiles - 1;
  }

  if (!defined(result)) {
    return new Cartesian2(xTileCoordinate, yTileCoordinate);
  }

  result.x = xTileCoordinate;
  result.y = yTileCoordinate;
  return result;
};
export default WebMercatorTilingScheme;
