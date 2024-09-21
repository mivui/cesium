import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";

/**
 * 引用简单 {@link GeographicProjection} 的几何图形的平铺方案，其中
 * 经度和纬度直接映射到 X 和 Y。 这种投影通常
 * 称为地理、等距矩形、等距圆柱形或板状圆柱体。
 *
 * @alias GeographicTilingScheme
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 其表面正在平铺的椭球体。默认为
 * 默认椭球体。
 * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] 切片方案覆盖的矩形（以弧度为单位）。
 * @param {number} [options.numberOfLevelZeroTilesX=2] 在零级
 * 瓦片树。
 * @param {number} [options.numberOfLevelZeroTilesY=1] 在零级
 * 瓦片树。
 */
function GeographicTilingScheme(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
  this._projection = new GeographicProjection(this._ellipsoid);
  this._numberOfLevelZeroTilesX = defaultValue(
    options.numberOfLevelZeroTilesX,
    2
  );
  this._numberOfLevelZeroTilesY = defaultValue(
    options.numberOfLevelZeroTilesY,
    1
  );
}

Object.defineProperties(GeographicTilingScheme.prototype, {
  /**
   * 获取此平铺方案平铺的椭球体。
   * @memberof GeographicTilingScheme.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取此平铺方案覆盖的矩形（以弧度为单位）。
   * @memberof GeographicTilingScheme.prototype
   * @type {Rectangle}
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * 获取此切片方案使用的地图投影。
   * @memberof GeographicTilingScheme.prototype
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
GeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function (level) {
  return this._numberOfLevelZeroTilesX << level;
};

/**
 * 获取指定细节级别 Y 方向的平铺总数。
 *
 * @param {number} level 细节级别。
 * @returns {number} 给定级别上 Y 方向的图块数量。
 */
GeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function (level) {
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
GeographicTilingScheme.prototype.rectangleToNativeRectangle = function (
  rectangle,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("rectangle", rectangle);
  //>>includeEnd('debug');

  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(rectangle.east);
  const north = CesiumMath.toDegrees(rectangle.north);

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
GeographicTilingScheme.prototype.tileXYToNativeRectangle = function (
  x,
  y,
  level,
  result
) {
  const rectangleRadians = this.tileXYToRectangle(x, y, level, result);
  rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
  rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
  rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
  rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
  return rectangleRadians;
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
GeographicTilingScheme.prototype.tileXYToRectangle = function (
  x,
  y,
  level,
  result
) {
  const rectangle = this._rectangle;

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth = rectangle.width / xTiles;
  const west = x * xTileWidth + rectangle.west;
  const east = (x + 1) * xTileWidth + rectangle.west;

  const yTileHeight = rectangle.height / yTiles;
  const north = rectangle.north - y * yTileHeight;
  const south = rectangle.north - (y + 1) * yTileHeight;

  if (!defined(result)) {
    result = new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * 计算包含
 * 给定的制图位置。
 *
 * @param {Cartographic} 位置 位置。
 * @param {number} level 瓦片细节级别。 零是最不详细的。
 * @param {Cartesian2} [result] 要将结果复制到的实例，如果是新实例，则为 undefined
 * 应创建。
 * @returns {Cartesian2} 指定的 'result'，或包含图块 x、y 坐标的新对象
 * 如果 'result' 未定义。
 */
GeographicTilingScheme.prototype.positionToTileXY = function (
  position,
  level,
  result
) {
  const rectangle = this._rectangle;
  if (!Rectangle.contains(rectangle, position)) {
    // outside the bounds of the tiling scheme
    return undefined;
  }

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth = rectangle.width / xTiles;
  const yTileHeight = rectangle.height / yTiles;

  let longitude = position.longitude;
  if (rectangle.east < rectangle.west) {
    longitude += CesiumMath.TWO_PI;
  }

  let xTileCoordinate = ((longitude - rectangle.west) / xTileWidth) | 0;
  if (xTileCoordinate >= xTiles) {
    xTileCoordinate = xTiles - 1;
  }

  let yTileCoordinate =
    ((rectangle.north - position.latitude) / yTileHeight) | 0;
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
export default GeographicTilingScheme;
