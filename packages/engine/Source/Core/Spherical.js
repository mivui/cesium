import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 一组曲线3维坐标。
 *
 * @alias Spherical
 * @constructor
 *
 * @param {number} [clock=0.0] 位于xy平面内的角坐标，从正x轴测量向正y轴。
 * @param {number} [cone=0.0] 从正z轴测量向负z轴的角坐标。
 * @param {number} [magnitude=1.0] 从原点测量的线性坐标。
 */
function Spherical(clock, cone, magnitude) {
  /**
   * 时钟分量。
   * @type {number}
   * @default 0.0
   */
  this.clock = clock ?? 0.0;
  /**
   * 锥体分量。
   * @type {number}
   * @default 0.0
   */
  this.cone = cone ?? 0.0;
  /**
   * 幅度分量。
   * @type {number}
   * @default 1.0
   */
  this.magnitude = magnitude ?? 1.0;
}

/**
 * 将提供的Cartesian3转换为球坐标。
 *
 * @param {Cartesian3} cartesian3 要转换为球坐标的Cartesian3。
 * @param {Spherical} [result] 存储结果的对象，如果未定义则创建新实例。
 * @returns {Spherical} 修改后的结果参数，如果未提供则返回新实例。
 */
Spherical.fromCartesian3 = function (cartesian3, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian3", cartesian3);
  //>>includeEnd('debug');

  const x = cartesian3.x;
  const y = cartesian3.y;
  const z = cartesian3.z;
  const radialSquared = x * x + y * y;

  if (!defined(result)) {
    result = new Spherical();
  }

  result.clock = Math.atan2(y, x);
  result.cone = Math.atan2(Math.sqrt(radialSquared), z);
  result.magnitude = Math.sqrt(radialSquared + z * z);
  return result;
};

/**
 * 创建球坐标的副本。
 *
 * @param {Spherical} spherical 要克隆的球坐标。
 * @param {Spherical} [result] 存储结果的对象，如果未定义则创建新实例。
 * @returns {Spherical} 修改后的结果参数，如果结果为undefined则返回新实例。（如果spherical未定义则返回undefined）
 */
Spherical.clone = function (spherical, result) {
  if (!defined(spherical)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Spherical(spherical.clock, spherical.cone, spherical.magnitude);
  }

  result.clock = spherical.clock;
  result.cone = spherical.cone;
  result.magnitude = spherical.magnitude;
  return result;
};

/**
 * 计算提供的球坐标的归一化版本。
 *
 * @param {Spherical} spherical 要归一化的球坐标。
 * @param {Spherical} [result] 存储结果的对象，如果未定义则创建新实例。
 * @returns {Spherical} 修改后的结果参数，如果结果为undefined则返回新实例。
 */
Spherical.normalize = function (spherical, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("spherical", spherical);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Spherical(spherical.clock, spherical.cone, 1.0);
  }

  result.clock = spherical.clock;
  result.cone = spherical.cone;
  result.magnitude = 1.0;
  return result;
};

/**
 * 如果第一个球坐标等于第二个球坐标则返回true，否则返回false。
 *
 * @param {Spherical} [left] 第一个要比较的球坐标。
 * @param {Spherical} [right] 第二个要比较的球坐标。
 * @returns {boolean} 如果第一个球坐标等于第二个则返回true，否则返回false。
 */
Spherical.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.clock === right.clock &&
      left.cone === right.cone &&
      left.magnitude === right.magnitude)
  );
};

/**
 * Returns true if the first spherical is within the provided epsilon of the second spherical, false otherwise.
 *
 * @param {Spherical} left The first Spherical to be compared.
 * @param {Spherical} right The second Spherical to be compared.
 * @param {number} [epsilon=0.0] The epsilon to compare against.
 * @returns {boolean} true if the first spherical is within the provided epsilon of the second spherical, false otherwise.
 */
Spherical.equalsEpsilon = function (left, right, epsilon) {
  epsilon = epsilon ?? 0.0;
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.clock - right.clock) <= epsilon &&
      Math.abs(left.cone - right.cone) <= epsilon &&
      Math.abs(left.magnitude - right.magnitude) <= epsilon)
  );
};

/**
 * Returns true if this spherical is equal to the provided spherical, false otherwise.
 *
 * @param {Spherical} [other] The Spherical to be compared.
 * @returns {boolean} true if this spherical is equal to the provided spherical, false otherwise.
 */
Spherical.prototype.equals = function (other) {
  return Spherical.equals(this, other);
};

/**
 * Creates a duplicate of this Spherical.
 *
 * @param {Spherical} [result] The object to store the result into, if undefined a new instance will be created.
 * @returns {Spherical} The modified result parameter or a new instance if result was undefined.
 */
Spherical.prototype.clone = function (result) {
  return Spherical.clone(this, result);
};

/**
 * Returns true if this spherical is within the provided epsilon of the provided spherical, false otherwise.
 *
 * @param {Spherical} other The Spherical to be compared.
 * @param {number} epsilon The epsilon to compare against.
 * @returns {boolean} true if this spherical is within the provided epsilon of the provided spherical, false otherwise.
 */
Spherical.prototype.equalsEpsilon = function (other, epsilon) {
  return Spherical.equalsEpsilon(this, other, epsilon);
};

/**
 * Returns a string representing this instance in the format (clock, cone, magnitude).
 *
 * @returns {string} A string representing this instance.
 */
Spherical.prototype.toString = function () {
  return `(${this.clock}, ${this.cone}, ${this.magnitude})`;
};
export default Spherical;
