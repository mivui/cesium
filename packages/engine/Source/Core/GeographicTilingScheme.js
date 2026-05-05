// @ts-check

import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";

/** @import Cartographic from "./Cartographic.js"; */
/** @import MapProjection from "./MapProjection.js"; */
/** @import TilingScheme from "./TilingScheme.js"; */

/**
 * 用于参考简单{@link GeographicProjection}的几何图形的瓦片方案，其中
 * 经度和纬度直接映射到X和Y。此投影通常
 * 称为地理投影、等距圆柱投影或平板卡雷投影。
 *
 * @implements {TilingScheme}
 */
class GeographicTilingScheme {
  /**
   * @param {object} [options] 具有以下属性的对象：
   * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 要分割表面的椭球体。默认为
   * 默认椭球体。
   * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] 瓦片方案覆盖的矩形，以弧度表示。
   * @param {number} [options.numberOfLevelZeroTilesX=2] 瓦片树层级0中X方向的瓦片数量。
   * @param {number} [options.numberOfLevelZeroTilesY=1] 瓦片树层级0中Y方向的瓦片数量。
   */
  constructor(options) {
    options = options ?? Frozen.EMPTY_OBJECT;

    this._ellipsoid = options.ellipsoid ?? Ellipsoid.default;
    this._rectangle = options.rectangle ?? Rectangle.MAX_VALUE;
    this._projection = new GeographicProjection(this._ellipsoid);
    this._numberOfLevelZeroTilesX = options.numberOfLevelZeroTilesX ?? 2;
    this._numberOfLevelZeroTilesY = options.numberOfLevelZeroTilesY ?? 1;
  }

  /**
   * 获取被此瓦片方案分割的椭球体。
   * @type {Ellipsoid}
   */
  get ellipsoid() {
    return this._ellipsoid;
  }

  /**
   * 获取此瓦片方案覆盖的矩形（以弧度表示）。
   * @type {Rectangle}
   */
  get rectangle() {
    return this._rectangle;
  }

  /**
   * 获取此瓦片方案使用的地图投影。
   * @type {MapProjection}
   */
  get projection() {
    return this._projection;
  }

  /**
   * 获取指定细节层级中X方向的瓦片总数。
   *
   * @param {number} level 细节层级。
   * @returns {number} 给定层级中X方向的瓦片数量。
   */
  getNumberOfXTilesAtLevel(level) {
    return this._numberOfLevelZeroTilesX << level;
  }

  /**
   * 获取指定细节层级中Y方向的瓦片总数。
   *
   * @param {number} level 细节层级。
   * @returns {number} 给定层级中Y方向的瓦片数量。
   */
  getNumberOfYTilesAtLevel(level) {
    return this._numberOfLevelZeroTilesY << level;
  }

  /**
   * 将大地弧度指定的矩形转换为此瓦片方案的本地坐标系。
   *
   * @param {Rectangle} rectangle 要转换的矩形。
   * @param {Rectangle} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Rectangle} 指定的'result'，如果'result'为undefined，则为包含本地矩形的新对象。
   */
  rectangleToNativeRectangle(rectangle, result) {
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
  }

  /**
   * 将瓦片x、y坐标和层级转换为以瓦片方案本地坐标表示的矩形。
   *
   * @param {number} x 瓦片的整数x坐标。
   * @param {number} y 瓦片的整数y坐标。
   * @param {number} level 瓦片的细节层级。0是最不详细的。
   * @param {Rectangle} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Rectangle} 指定的'result'，如果'result'为undefined，则为包含矩形的新对象。
   */
  tileXYToNativeRectangle(x, y, level, result) {
    const rectangleRadians = this.tileXYToRectangle(x, y, level, result);
    rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
    rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
    rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
    rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
    return rectangleRadians;
  }

  /**
   * 将瓦片x、y坐标和层级转换为弧度的大地测量矩形。
   *
   * @param {number} x 瓦片的整数x坐标。
   * @param {number} y 瓦片的整数y坐标。
   * @param {number} level 瓦片的细节层级。0是最不详细的。
   * @param {Rectangle} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Rectangle} 指定的'result'，如果'result'为undefined，则为包含矩形的新对象。
   */
  tileXYToRectangle(x, y, level, result) {
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
  }

  /**
   * 计算包含给定大地坐标位置的瓦片的瓦片x、y坐标。
   *
   * @param {Cartographic} position 位置。
   * @param {number} level 瓦片的细节层级。0是最不详细的。
   * @param {Cartesian2} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Cartesian2} 指定的'result'，如果'result'为undefined，则为包含瓦片x、y坐标的新对象。
   */
  positionToTileXY(position, level, result) {
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
  }
}

export default GeographicTilingScheme;
