// @ts-check

import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Rectangle from "./Rectangle.js";
import WebMercatorProjection from "./WebMercatorProjection.js";

/** @import MapProjection from "./MapProjection.js"; */
/** @import TilingScheme from "./TilingScheme.js"; */

const southwestScratch = new Cartographic();
const northeastScratch = new Cartographic();

const southwestCartesianScratch = new Cartesian3();
const northeastCartesianScratch = new Cartesian3();

/**
 * 用于参考{@link WebMercatorProjection}的几何图形的瓦片方案，EPSG:3857。这是
 * Google Maps、Microsoft Bing Maps和大多数ESRI ArcGIS Online使用的瓦片方案。
 *
 * @implements {TilingScheme}
 */
class WebMercatorTilingScheme {
  /**
   * @type {Cartesian2}
   * @private
   */
  _rectangleSouthwestInMeters;

  /**
   * @type {Cartesian2}
   * @private
   */
  _rectangleNortheastInMeters;

  /**
   * @param {object} [options] 具有以下属性的对象：
   * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 要分割表面的椭球体。默认为默认椭球体。
   * @param {number} [options.numberOfLevelZeroTilesX=1] 瓦片树层级0中X方向的瓦片数量。
   * @param {number} [options.numberOfLevelZeroTilesY=1] 瓦片树层级0中Y方向的瓦片数量。
   * @param {Cartesian2} [options.rectangleSouthwestInMeters] 瓦片方案覆盖的矩形的西南角，以米为单位。如果未指定此参数或rectangleNortheastInMeters，则经度方向覆盖整个地球，纬度方向覆盖相等距离，形成正方形投影。
   * @param {Cartesian2} [options.rectangleNortheastInMeters] 瓦片方案覆盖的矩形的东北角，以米为单位。如果未指定此参数或rectangleSouthwestInMeters，则经度方向覆盖整个地球，纬度方向覆盖相等距离，形成正方形投影。
   */
  constructor(options) {
    options = options ?? Frozen.EMPTY_OBJECT;

    this._ellipsoid = options.ellipsoid ?? Ellipsoid.default;
    this._numberOfLevelZeroTilesX = options.numberOfLevelZeroTilesX ?? 1;
    this._numberOfLevelZeroTilesY = options.numberOfLevelZeroTilesY ?? 1;

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

    let { x, y } = this._rectangleSouthwestInMeters;
    Cartesian3.fromElements(x, y, 0, southwestCartesianScratch);
    this._projection.unproject(southwestCartesianScratch, southwestScratch);

    ({ x, y } = this._rectangleNortheastInMeters);
    Cartesian3.fromElements(x, y, 0, northeastCartesianScratch);
    this._projection.unproject(northeastCartesianScratch, northeastScratch);

    this._rectangle = new Rectangle(
      southwestScratch.longitude,
      southwestScratch.latitude,
      northeastScratch.longitude,
      northeastScratch.latitude,
    );
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
    const xTiles = this.getNumberOfXTilesAtLevel(level);
    const yTiles = this.getNumberOfYTilesAtLevel(level);

    const xTileWidth =
      (this._rectangleNortheastInMeters.x -
        this._rectangleSouthwestInMeters.x) /
      xTiles;
    const west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
    const east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;

    const yTileHeight =
      (this._rectangleNortheastInMeters.y -
        this._rectangleSouthwestInMeters.y) /
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
    const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

    const projection = this._projection;
    const southwest = projection.unproject(
      new Cartesian3(nativeRectangle.west, nativeRectangle.south),
    );
    const northeast = projection.unproject(
      new Cartesian3(nativeRectangle.east, nativeRectangle.north),
    );

    nativeRectangle.west = southwest.longitude;
    nativeRectangle.south = southwest.latitude;
    nativeRectangle.east = northeast.longitude;
    nativeRectangle.north = northeast.latitude;
    return nativeRectangle;
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
  }
}

export default WebMercatorTilingScheme;
