// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";

/** @import MapProjection from "./MapProjection.js"; */

/**
 * 一种简单的地图投影，经度和纬度通过乘以{@link Ellipsoid#maximumRadius}线性映射到X和Y。这种投影通常被称为地理投影、等距圆柱投影或普拉特卡雷投影。使用WGS84椭球时，也被称为EPSG:4326。
 *
 * @see WebMercatorProjection
 *
 * @implements MapProjection
 */
class GeographicProjection {
/**
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球。
 */
  constructor(ellipsoid) {
    this._ellipsoid = ellipsoid ?? Ellipsoid.default;
    this._semimajorAxis = this._ellipsoid.maximumRadius;
    this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
  }

/**
 * 获取{@link Ellipsoid}。
 *
 * @type {Ellipsoid}
 * @readonly
 */
  get ellipsoid() {
    return this._ellipsoid;
  }

/**
 * 将一组以弧度表示的{@link Cartographic}坐标投影为以米表示的地图坐标。
 * X和Y分别是经度和纬度乘以椭球的最大半径。Z是未修改的高度。
 *
 * @param {Cartographic} cartographic 要投影的坐标。
 * @param {Cartesian3} [result] 用于复制结果的实例。如果此参数未定义，则创建并返回一个新实例。
 * @returns {Cartesian3} 投影后的坐标。如果result参数已定义，则坐标会被复制到该实例并返回。否则，创建并返回一个新实例。
 */
  project(cartographic, result) {
    // Actually this is the special case of equidistant cylindrical called the plate carree
    const semimajorAxis = this._semimajorAxis;
    const x = cartographic.longitude * semimajorAxis;
    const y = cartographic.latitude * semimajorAxis;
    const z = cartographic.height;

    if (!defined(result)) {
      return new Cartesian3(x, y, z);
    }

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

/**
 * 将一组以米表示的投影后{@link Cartesian3}坐标反投影为以弧度表示的{@link Cartographic}坐标。
 * 经度和纬度分别是X和Y坐标除以椭球的最大半径。高度是未修改的Z坐标。
 *
 * @param {Cartesian3} cartesian 要反投影的笛卡尔位置，高度（z）以米为单位。
 * @param {Cartographic} [result] 用于复制结果的实例。如果此参数未定义，则创建并返回一个新实例。
 * @returns {Cartographic} 反投影后的坐标。如果result参数已定义，则坐标会被复制到该实例并返回。否则，创建并返回一个新实例。
 */
  unproject(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(cartesian)) {
      throw new DeveloperError("cartesian is required");
    }
    //>>includeEnd('debug');

    const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
    const longitude = cartesian.x * oneOverEarthSemimajorAxis;
    const latitude = cartesian.y * oneOverEarthSemimajorAxis;
    const height = cartesian.z;

    if (!defined(result)) {
      return new Cartographic(longitude, latitude, height);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
}

export default GeographicProjection;
