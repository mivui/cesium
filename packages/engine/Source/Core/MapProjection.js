import DeveloperError from "./DeveloperError.js";

/**
 * 定义大地椭球体坐标 （{@link Cartographic}） 如何投影到
 * 平面地图，如 Cesium 的 2D 和 Columbus View 模式。
 *
 * @alias MapProjection
 * @constructor
 * @abstract
 *
 * @see GeographicProjection
 * @see WebMercatorProjection
 */
function MapProjection() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(MapProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}。
   *
   * @memberof MapProjection.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 将 {@link Cartographic} 坐标（以弧度为单位）投影到特定于投影的地图坐标（以米为单位）。
 *
 * @memberof MapProjection
 * @function
 *
 * @param {Cartographic} cartographic 要投影的坐标。
 * @param {Cartesian3} [result] 要将结果复制到的实例。 如果该参数为
 * undefined，则创建并返回一个新实例。
 * @returns {Cartesian3} 投影坐标。 如果 result 参数不是 undefined，则
 * 坐标将复制到那里，并返回该实例。 否则，新实例为
 * created 并返回。
 */
MapProjection.prototype.project = DeveloperError.throwInstantiationError;

/**
 * 取消投影特定地图 {@link Cartesian3} 坐标（以米为单位）到 {@link Cartographic}
 * 坐标，以弧度为单位。
 *
 * @memberof MapProjection
 * @function
 *
 * @param {Cartesian3} cartesian 高度 （z） 取消投影的笛卡尔位置，以米为单位。
 * @param {Cartographic} [result] 要将结果复制到其中的实例。 如果该参数为
 * undefined，则创建并返回一个新实例。
 * @returns {Cartographic} 未投影的坐标。 如果 result 参数不是 undefined，则
 * 坐标将复制到那里，并返回该实例。 否则，新实例为
 * created 并返回。
 */
MapProjection.prototype.unproject = DeveloperError.throwInstantiationError;
export default MapProjection;
