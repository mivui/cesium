// @ts-check

import DeveloperError from "./DeveloperError.js";

/** @import Cartesian2 from "./Cartesian2.js"; */
/** @import Cartographic from "./Cartographic.js"; */
/** @import Ellipsoid from "./Ellipsoid.js"; */
/** @import MapProjection from "./MapProjection.js"; */
/** @import Rectangle from "./Rectangle.js"; */

/**
 * 椭球表面几何或影像的瓦片方案。在细节层级0（最粗糙、细节最少的层级），
 * 瓦片数量是可配置的。在细节层级1，每个层级0的瓦片有四个子瓦片，每个方向两个。
 * 在细节层级2，每个层级1的瓦片有四个子瓦片，每个方向两个。
 * 这对于几何或影像源中存在的多个层级继续下去。
 *
 * @interface
 *
 * @see WebMercatorTilingScheme
 * @see GeographicTilingScheme
 */
class TilingScheme {
  /**
   * 获取被瓦片方案分割的椭球体。
   * @type {Ellipsoid}
   */
  ellipsoid;

  /**
   * 获取此瓦片方案覆盖的矩形（以弧度表示）。
   * @type {Rectangle}
   */
  rectangle;

  /**
   * 获取瓦片方案使用的地图投影。
   * @type {MapProjection}
   */
  projection;

  /**
   * @param {object} options 选项对象
   */
  constructor(options) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "This type should not be instantiated directly.  Instead, use WebMercatorTilingScheme or GeographicTilingScheme.",
    );
    //>>includeEnd('debug');
  }

  /**
   * 获取指定细节层级中X方向的瓦片总数。
   *
   * @param {number} level 细节层级。
   * @returns {number} 给定层级中X方向的瓦片数量。
   */
  getNumberOfXTilesAtLevel(level) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 获取指定细节层级中Y方向的瓦片总数。
   *
   * @param {number} level 细节层级。
   * @returns {number} 给定层级中Y方向的瓦片数量。
   */
  getNumberOfYTilesAtLevel(level) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 将大地弧度指定的矩形转换为此瓦片方案的本地坐标系。
   *
   * @param {Rectangle} rectangle 要转换的矩形。
   * @param {Rectangle} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Rectangle} 指定的'result'，如果'result'为undefined，则为包含本地矩形的新对象。
   */
  rectangleToNativeRectangle(rectangle, result) {
    DeveloperError.throwInstantiationError();
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
    DeveloperError.throwInstantiationError();
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
    DeveloperError.throwInstantiationError();
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
    DeveloperError.throwInstantiationError();
  }
}

export default TilingScheme;
