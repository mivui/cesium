// @ts-check

import DeveloperError from "./DeveloperError.js";

/** @import Cartesian3 from "./Cartesian3.js"; */
/** @import Cartographic from "./Cartographic.js"; */
/** @import Ellipsoid from "./Ellipsoid.js"; */

/**
 * 定义大地椭球坐标（{@link Cartographic}）如何投影到平面地图，如Cesium的2D和Columbus View模式。
 *
 * @see GeographicProjection
 * @see WebMercatorProjection
 *
 * @interface
 */
class MapProjection {
  /**
   * 获取{@link Ellipsoid}。
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid;

  /**
   * 将弧度制的{@link Cartographic}坐标投影到特定投影的地图坐标（以米为单位）。
   *
   * @param {Cartographic} cartographic 要投影的坐标。
   * @param {Cartesian3} [result] 用于复制结果的实例。如果此参数
   *        未定义，则创建并返回一个新实例。
   * @returns {Cartesian3} 投影后的坐标。如果result参数未定义，则
   *         坐标将复制到该处并返回该实例。否则，将创建并返回一个新实例。
   */
  project(cartographic, result) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 将特定投影的地图{@link Cartesian3}坐标（以米为单位）反投影到{@link Cartographic}坐标（以弧度为单位）。
   *
   * @param {Cartesian3} cartesian 要反投影的笛卡尔位置，高度（z）以米为单位。
   * @param {Cartographic} [result] 用于复制结果的实例。如果此参数
   *        未定义，则创建并返回一个新实例。
   * @returns {Cartographic} 反投影后的坐标。如果result参数未定义，则
   *         坐标将复制到该处并返回该实例。否则，将创建并返回一个新实例。
   */
  unproject(cartesian, result) {
    DeveloperError.throwInstantiationError();
  }
}

export default MapProjection;
