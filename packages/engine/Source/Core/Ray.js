import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 表示一条从指定原点沿指定方向无限延伸的射线。
 */
class Ray {
  /**
   * @param {Cartesian3} [origin=Cartesian3.ZERO] 射线的原点。
   * @param {Cartesian3} [direction=Cartesian3.ZERO] 射线的方向。
   */
  constructor(origin, direction) {
    direction = Cartesian3.clone(direction ?? Cartesian3.ZERO);
    if (!Cartesian3.equals(direction, Cartesian3.ZERO)) {
      Cartesian3.normalize(direction, direction);
    }

    /**
     * 射线的原点。
     * @type {Cartesian3}
     * @default {@link Cartesian3.ZERO}
     */
    this.origin = Cartesian3.clone(origin ?? Cartesian3.ZERO);

    /**
     * 射线的方向。
     * @type {Cartesian3}
     */
    this.direction = direction;
  }

  /**
   * 复制射线实例。
   *
   * @param {Ray} ray 要复制的射线。
   * @param {Ray} [result] 存储结果的对象。
   * @returns {Ray} 修改后的结果参数，如果未提供则返回新的射线实例。（如果射线未定义则返回undefined）
   */
  static clone(ray, result) {
    if (!defined(ray)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Ray(ray.origin, ray.direction);
    }
    result.origin = Cartesian3.clone(ray.origin);
    result.direction = Cartesian3.clone(ray.direction);
    return result;
  }

  /**
   * 计算射线沿r(t) = o + t*d的点，
   * 其中o是射线的原点，d是方向。
   *
   * @param {Ray} ray 射线。
   * @param {number} t 标量值。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新实例。
   *
   * @example
   * //获取射线与椭球的第一个交点。
   * const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
   * const point = Cesium.Ray.getPoint(ray, intersection.start);
   */
  static getPoint(ray, t, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("ray", ray);
    Check.typeOf.number("t", t);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian3();
    }

    result = Cartesian3.multiplyByScalar(ray.direction, t, result);
    return Cartesian3.add(ray.origin, result, result);
  }
}

export default Ray;
