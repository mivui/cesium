import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 一组曲线 3 维坐标。
 *
 * @alias Spherical
 * @constructor
 *
 * @param {number} [clock=0.0] 位于 xy 平面上从正 x 轴到正 y 轴测量的角度坐标。
 * @param {number} [cone=0.0] 从正 z 轴到负 z 轴测量的角度坐标。
 * @param {number} [magnitude=1.0] 从原点开始测量的线性坐标。
 */
function Spherical(clock, cone, magnitude) {
  /**
   * 时钟组件。
   * @type {number}
   * @default 0.0
   */
  this.clock = defaultValue(clock, 0.0);
  /**
   * 锥体组件。
   * @type {number}
   * @default 0.0
   */
  this.cone = defaultValue(cone, 0.0);
  /**
   * 幅度分量。
   * @type {number}
   * @default 1.0
   */
  this.magnitude = defaultValue(magnitude, 1.0);
}

/**
 * 将提供的 Cartesian3 转换为 Spherical 坐标。
 *
 * @param {Cartesian3} cartesian3 笛卡尔3 转换为球面。
 * @param {Spherical} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Spherical} 修改后的结果参数,或者一个新实例（如果未提供）。
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
 * 创建 Spherical 的副本。
 *
 * @param {Spherical} spherical 要克隆的球形。
 * @param {Spherical} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Spherical} 修改后的结果参数或者如果 result 未定义，则为新实例。（如果 spherical 未定义，则返回 undefined）
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
 * 计算提供的球形的归一化版本。
 *
 * @param {Spherical} spherical 要归一化的球面。
 * @param {Spherical} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，如果 result 未定义，则为新实例。
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
 * 如果第一个球面等于第二个球面，则返回 true，否则返回 false。
 *
 * @param {Spherical} left 第一个要比较的球面。
 * @param {Spherical} right 要比较的第二个球面。
 * @returns {boolean} true，如果第一个球面等于第二个球面，则为 false，否则。
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
 * 如果第一个球面位于第二个球面提供的 epsilon 内，则返回 true，否则返回 false。
 *
 * @param {Spherical} left 第一个要比较的球面。
 * @param {Spherical} right 要比较的第二个球面。
 * @param {number} [epsilon=0.0] 要比较的 epsilon。
 * @returns {boolean} true，如果第一个球面在第二个球面提供的 epsilon 内，则为 false，否则。
 */
Spherical.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0.0);
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
 * 如果此球面等于提供的球面，则返回 true，否则返回 false。
 *
 * @param {Spherical} other 要比较的球形。
 * @returns {boolean} true，如果此球面等于提供的球面，则为 false，否则。
 */
Spherical.prototype.equals = function (other) {
  return Spherical.equals(this, other);
};

/**
 * 创建此 Spherical 的副本。
 *
 * @param {Spherical} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，如果 result 未定义，则为新实例。
 */
Spherical.prototype.clone = function (result) {
  return Spherical.clone(this, result);
};

/**
 * 如果此球面位于提供的球面的 epsilon 内，则返回 true，否则返回 false。
 *
 * @param {Spherical} other 要比较的球形。
 * @param {number} epsilon 要比较的 epsilon。
 * 如果此球面位于提供的球面的 epsilon 内，则@returns {boolean} true， false 否则。
 */
Spherical.prototype.equalsEpsilon = function (other, epsilon) {
  return Spherical.equalsEpsilon(this, other, epsilon);
};

/**
 * 返回一个字符串，以 （clock， cone， magnitude） 格式表示此实例。
 *
 * @returns {string} 表示此实例的字符串。
 */
Spherical.prototype.toString = function () {
  return `(${this.clock}, ${this.cone}, ${this.magnitude})`;
};
export default Spherical;
