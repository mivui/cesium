import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 表示从提供的原点沿给定方向无限延伸的射线。
 * @alias Ray
 * @constructor
 *
 * @param {Cartesian3} [origin=Cartesian3.ZERO] The origin of the ray.
 * @param {Cartesian3} [direction=Cartesian3.ZERO] The direction of the ray.
 */
function Ray(origin, direction) {
  direction = Cartesian3.clone(defaultValue(direction, Cartesian3.ZERO));
  if (!Cartesian3.equals(direction, Cartesian3.ZERO)) {
    Cartesian3.normalize(direction, direction);
  }

  /**
   * 射线的原点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.origin = Cartesian3.clone(defaultValue(origin, Cartesian3.ZERO));

  /**
   * 光线的方向。
   * @type {Cartesian3}
   */
  this.direction = direction;
}

/**
 * 复制Ray实例。
 *
 * @param {Ray} ray 要复制的光线。
 * @param {Ray} [result] 要在其上存储结果的对象。
 * @returns {Ray} 修改后的结果参数或者新的 Ray 实例（如果未提供）。（如果 ray 未定义，则返回 undefined）
 */
Ray.clone = function (ray, result) {
  if (!defined(ray)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Ray(ray.origin, ray.direction);
  }
  result.origin = Cartesian3.clone(ray.origin);
  result.direction = Cartesian3.clone(ray.direction);
  return result;
};

/**
 * 计算沿射线的点，由 r（t） = o + t*d，
 * 其中 o 是射线的原点，d 是方向。
 *
 * @param {Ray} ray 射线。
 * @param {number} t 一个标量值。
 * @param {Cartesian3} [result] 将存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数,或者如果未提供任何实例，则为新实例。
 *
 * @example
 * //Get the first intersection point of a ray and an ellipsoid.
 * const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
 * const point = Cesium.Ray.getPoint(ray, intersection.start);
 */
Ray.getPoint = function (ray, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("ray", ray);
  Check.typeOf.number("t", t);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  result = Cartesian3.multiplyByScalar(ray.direction, t, result);
  return Cartesian3.add(ray.origin, result, result);
};
export default Ray;
