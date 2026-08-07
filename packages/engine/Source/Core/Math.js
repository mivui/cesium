import MersenneTwister from "mersenne-twister";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 数学函数。
 *
 * @exports CesiumMath
 * @alias Math
 */
const CesiumMath = {};

/**
 * 0.1
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON1 = 0.1;

/**
 * 0.01
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON2 = 0.01;

/**
 * 0.001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON3 = 0.001;

/**
 * 0.0001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON4 = 0.0001;

/**
 * 0.00001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON5 = 0.00001;

/**
 * 0.000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON6 = 0.000001;

/**
 * 0.0000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON7 = 0.0000001;

/**
 * 0.00000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON8 = 0.00000001;

/**
 * 0.000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON9 = 0.000000001;

/**
 * 0.0000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON10 = 0.0000000001;

/**
 * 0.00000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON11 = 0.00000000001;

/**
 * 0.000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON12 = 0.000000000001;

/**
 * 0.0000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON13 = 0.0000000000001;

/**
 * 0.00000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON14 = 0.00000000000001;

/**
 * 0.000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON15 = 0.000000000000001;

/**
 * 0.0000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON16 = 0.0000000000000001;

/**
 * 0.00000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON17 = 0.00000000000000001;

/**
 * 0.000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON18 = 0.000000000000000001;

/**
 * 0.0000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON19 = 0.0000000000000000001;

/**
 * 0.00000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON20 = 0.00000000000000000001;

/**
 * 0.000000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON21 = 0.000000000000000000001;

/**
 * 根据 WGS84 模型定义的地球引力参数（立方米/秒平方）：3.986004418e14
 * @type {number}
 * @constant
 */
CesiumMath.GRAVITATIONALPARAMETER = 3.986004418e14;

/**
 * 太阳半径（米）：6.955e8
 * @type {number}
 * @constant
 */
CesiumMath.SOLAR_RADIUS = 6.955e8;

/**
 * 月球的平均半径，根据 "IAU/IAG 行星和卫星地图坐标及自转元素工作组报告：2000"，
 * 天体力学 82: 83-110, 2002。
 * @type {number}
 * @constant
 */
CesiumMath.LUNAR_RADIUS = 1737400.0;

/**
 * 64 * 1024
 * @type {number}
 * @constant
 */
CesiumMath.SIXTY_FOUR_KILOBYTES = 64 * 1024;

/**
 * 4 * 1024 * 1024 * 1024
 * @type {number}
 * @constant
 */
CesiumMath.FOUR_GIGABYTES = 4 * 1024 * 1024 * 1024;

/**
 * 返回值的符号；如果值为正返回 1，如果值为负返回 -1，或者如果值为 0 返回 0。
 *
 * @function
 * @param {number} value 要返回符号的值。
 * @returns {number} value 的符号。
 */
CesiumMath.sign =
  Math.sign ??
  function sign(value) {
    value = +value; // coerce to number
    if (value === 0 || value !== value) {
      // zero or NaN
      return value;
    }
    return value > 0 ? 1 : -1;
  };

/**
 * 如果给定值为正或零，返回 1.0；如果为负，返回 -1.0。
 * 这与 {@link CesiumMath#sign} 类似，但当输入值为 0.0 时返回 1.0 而不是 0.0。
 * @param {number} value 要返回符号的值。
 * @returns {number} value 的符号。
 */
CesiumMath.signNotZero = function (value) {
  return value < 0.0 ? -1.0 : 1.0;
};

/**
 * 将范围 [-1.0, 1.0] 内的标量值转换为范围 [0, rangeMaximum] 内的 SNORM。
 * @param {number} value 范围 [-1.0, 1.0] 内的标量值
 * @param {number} [rangeMaximum=255] 映射范围中的最大值，默认为 255。
 * @returns {number} SNORM 值，其中 0 映射到 -1.0，rangeMaximum 映射到 1.0。
 *
 * @see CesiumMath.fromSNorm
 */
CesiumMath.toSNorm = function (value, rangeMaximum) {
  rangeMaximum = rangeMaximum ?? 255;
  return Math.round(
    (CesiumMath.clamp(value, -1.0, 1.0) * 0.5 + 0.5) * rangeMaximum,
  );
};

/**
 * 将范围 [0, rangeMaximum] 内的 SNORM 值转换为范围 [-1.0, 1.0] 内的标量。
 * @param {number} value 范围 [0, rangeMaximum] 内的 SNORM 值
 * @param {number} [rangeMaximum=255] SNORM 范围中的最大值，默认为 255。
 * @returns {number} 范围 [-1.0, 1.0] 内的标量。
 *
 * @see CesiumMath.toSNorm
 */
CesiumMath.fromSNorm = function (value, rangeMaximum) {
  rangeMaximum = rangeMaximum ?? 255;
  return (
    (CesiumMath.clamp(value, 0.0, rangeMaximum) / rangeMaximum) * 2.0 - 1.0
  );
};

/**
 * 将范围 [rangeMinimum, rangeMaximum] 内的标量值转换为范围 [0.0, 1.0] 内的标量。
 * @param {number} value 范围 [rangeMinimum, rangeMaximum] 内的标量值
 * @param {number} rangeMinimum 映射范围中的最小值。
 * @param {number} rangeMaximum 映射范围中的最大值。
 * @returns {number} 标量值，其中 rangeMinimum 映射到 0.0，rangeMaximum 映射到 1.0。
 */
CesiumMath.normalize = function (value, rangeMinimum, rangeMaximum) {
  rangeMaximum = Math.max(rangeMaximum - rangeMinimum, 0.0);
  return rangeMaximum === 0.0
    ? 0.0
    : CesiumMath.clamp((value - rangeMinimum) / rangeMaximum, 0.0, 1.0);
};

/**
 * 返回一个数的双曲正弦。
 * <em>value</em> 的双曲正弦定义为
 * (<em>e<sup>x</sup>&nbsp;-&nbsp;e<sup>-x</sup></em>)/2.0
 * 其中 <i>e</i> 是欧拉数，约等于 2.71828183。
 *
 * <p>特殊情况：
 *   <ul>
 *     <li>如果参数是 NaN，则结果是 NaN。</li>
 *
 *     <li>如果参数是无穷大，则结果是与参数符号相同的无穷大。</li>
 *
 *     <li>如果参数是零，则结果是与参数符号相同的零。</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {number} value 要返回双曲正弦的数。
 * @returns {number} <code>value</code> 的双曲正弦。
 */
CesiumMath.sinh =
  Math.sinh ??
  function sinh(value) {
    return (Math.exp(value) - Math.exp(-value)) / 2.0;
  };

/**
 * 返回一个数的双曲余弦。
 * <strong>value</strong> 的双曲余弦定义为
 * (<em>e<sup>x</sup>&nbsp;+&nbsp;e<sup>-x</sup></em>)/2.0
 * 其中 <i>e</i> 是欧拉数，约等于 2.71828183。
 *
 * <p>特殊情况：
 *   <ul>
 *     <li>如果参数是 NaN，则结果是 NaN。</li>
 *
 *     <li>如果参数是无穷大，则结果是正无穷大。</li>
 *
 *     <li>如果参数是零，则结果是 1.0。</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {number} value 要返回双曲余弦的数。
 * @returns {number} <code>value</code> 的双曲余弦。
 */
CesiumMath.cosh =
  Math.cosh ??
  function cosh(value) {
    return (Math.exp(value) + Math.exp(-value)) / 2.0;
  };

/**
 * 计算两个值的线性插值。
 *
 * @param {number} p 要插值的起始值。
 * @param {number} q 要插值的结束值。
 * @param {number} time 插值时间，通常在 <code>[0.0, 1.0]</code> 范围内。
 * @returns {number} 线性插值后的值。
 *
 * @example
 * const n = Cesium.Math.lerp(0.0, 2.0, 0.5); // 返回 1.0
 */
CesiumMath.lerp = function (p, q, time) {
  return (1.0 - time) * p + time * q;
};

/** @typedef {Object} SmoothDampResult
 * @property {number} value The new value after applying the smooth damp.
 * @property {number} velocity The updated current velocity.
 */

/**
 * Gradually changes a value towards a target value over time. The smoothing function uses a spring-damping algorithm based on Game Programming Gems 4 Chapter 1.10.
 * @param {number} p The current value.
 * @param {number} q The target value.
 * @param {number} velocity The current velocity.
 * @param {number} [deltaTime=0.0] The time since the last call to this function. Value must be greater than or equal to 0.0.
 * @param {number} [maximumSpeed=Number.POSITIVE_INFINITY] Optionally allows clamping to the specified maximum speed.
 * @param {number} [smoothTime=0.0001] Approximately the time it will take to reach the target. A smaller value will reach the target faster. This value must be greater than or equal to 0.0001.
 * @param {SmoothDampResult} [result] An object to store the result. If not provided, a new object will be created and returned.
 * @returns {SmoothDampResult} An object containing the new value and the updated current velocity.
 */
CesiumMath.smoothDamp = function (
  p,
  q,
  velocity,
  deltaTime = 0.0,
  maximumSpeed = Number.POSITIVE_INFINITY,
  smoothTime = 0.0001,
  result = {},
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("p", p);
  Check.typeOf.number("q", q);
  Check.typeOf.number("velocity", velocity);
  Check.typeOf.number.greaterThanOrEquals("deltaTime", deltaTime, 0.0);
  Check.typeOf.number.greaterThanOrEquals("maximumSpeed", maximumSpeed, 0.0);
  Check.typeOf.number.greaterThanOrEquals("smoothTime", smoothTime, 0.0001);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  // As a fallback, prevent crashes even if smoothTime is too small
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2.0 / smoothTime;

  const x = omega * deltaTime;
  const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);

  const maxChange = maximumSpeed * smoothTime;
  let change = p - q;
  change = CesiumMath.clamp(change, -maxChange, maxChange);

  const target = p - change;

  const temp = (velocity + omega * change) * deltaTime;

  velocity = (velocity - omega * temp) * exp;

  result.value = target + (change + temp) * exp;
  result.velocity = velocity;

  return result;
};

/**
 * 圆周率 pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI = Math.PI;

/**
 * 1/pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.ONE_OVER_PI = 1.0 / Math.PI;

/**
 * pi/2
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_TWO = Math.PI / 2.0;

/**
 * pi/3
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_THREE = Math.PI / 3.0;

/**
 * pi/4
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_FOUR = Math.PI / 4.0;

/**
 * pi/6
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_SIX = Math.PI / 6.0;

/**
 * 3pi/2
 *
 * @type {number}
 * @constant
 */
CesiumMath.THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;

/**
 * 2pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.TWO_PI = 2.0 * Math.PI;

/**
 * 1/2pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.ONE_OVER_TWO_PI = 1.0 / (2.0 * Math.PI);

/**
 * 一度包含的弧度数。
 *
 * @type {number}
 * @constant
 */
CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;

/**
 * 一弧度包含的度数。
 *
 * @type {number}
 * @constant
 */
CesiumMath.DEGREES_PER_RADIAN = 180.0 / Math.PI;

/**
 * 一角秒包含的弧度数。
 *
 * @type {number}
 * @constant
 */
CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600.0;

/**
 * 将度数转换为弧度。
 * @param {number} degrees 要转换的角度，单位为度。
 * @returns {number} 对应的弧度值。
 */
CesiumMath.toRadians = function (degrees) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(degrees)) {
    throw new DeveloperError("degrees is required.");
  }
  //>>includeEnd('debug');
  return degrees * CesiumMath.RADIANS_PER_DEGREE;
};

/**
 * 将弧度转换为度数。
 * @param {number} radians 要转换的角度，单位为弧度。
 * @returns {number} 对应的角度值，单位为度。
 */
CesiumMath.toDegrees = function (radians) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(radians)) {
    throw new DeveloperError("radians is required.");
  }
  //>>includeEnd('debug');
  return radians * CesiumMath.DEGREES_PER_RADIAN;
};

/**
 * 将以弧度为单位的经度值转换为范围 [<code>-Math.PI</code>, <code>Math.PI</code>)。
 *
 * @param {number} angle 要转换的经度值，单位为弧度。
 * @returns {number} 等效的经度值，范围在 [<code>-Math.PI</code>, <code>Math.PI</code>) 内。
 *
 * @example
 * // 将 270 度转换为 -90 度经度
 * const longitude = Cesium.Math.convertLongitudeRange(Cesium.Math.toRadians(270.0));
 */
CesiumMath.convertLongitudeRange = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  const twoPi = CesiumMath.TWO_PI;

  const simplified = angle - Math.floor(angle / twoPi) * twoPi;

  if (simplified < -Math.PI) {
    return simplified + twoPi;
  }
  if (simplified >= Math.PI) {
    return simplified - twoPi;
  }

  return simplified;
};

/**
 * 方便函数，将以弧度为单位的纬度值钳制到范围 [<code>-Math.PI/2</code>, <code>Math.PI/2</code>)。
 * 在用于需要正确范围的对象之前，用于清理数据。
 *
 * @param {number} angle 要钳制的纬度值，单位为弧度。
 * @returns {number} 钳制后的纬度值，范围在 [<code>-Math.PI/2</code>, <code>Math.PI/2</code>) 内。
 *
 * @example
 * // 将 108 度纬度钳制到 90 度纬度
 * const latitude = Cesium.Math.clampToLatitudeRange(Cesium.Math.toRadians(108.0));
 */
CesiumMath.clampToLatitudeRange = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');

  return CesiumMath.clamp(
    angle,
    -1 * CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO,
  );
};

/**
 * 生成一个等效于提供角度的、在 -Pi <= angle <= Pi 范围内的角度。
 *
 * @param {number} angle 角度，单位为弧度。
 * @returns {number} 范围在 [<code>-CesiumMath.PI</code>, <code>CesiumMath.PI</code>] 内的角度。
 */
CesiumMath.negativePiToPi = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  if (angle >= -CesiumMath.PI && angle <= CesiumMath.PI) {
    // Early exit if the input is already inside the range. This avoids
    // unnecessary math which could introduce floating point error.
    return angle;
  }
  return CesiumMath.zeroToTwoPi(angle + CesiumMath.PI) - CesiumMath.PI;
};

/**
 * 生成一个等效于提供角度的、在 0 <= angle <= 2Pi 范围内的角度。
 *
 * @param {number} angle 角度，单位为弧度。
 * @returns {number} 范围在 [0, <code>CesiumMath.TWO_PI</code>] 内的角度。
 */
CesiumMath.zeroToTwoPi = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  if (angle >= 0 && angle <= CesiumMath.TWO_PI) {
    // Early exit if the input is already inside the range. This avoids
    // unnecessary math which could introduce floating point error.
    return angle;
  }
  const mod = CesiumMath.mod(angle, CesiumMath.TWO_PI);
  if (
    Math.abs(mod) < CesiumMath.EPSILON14 &&
    Math.abs(angle) > CesiumMath.EPSILON14
  ) {
    return CesiumMath.TWO_PI;
  }
  return mod;
};

/**
 * 也适用于负被除数的取模运算。
 *
 * @param {number} m 被除数。
 * @param {number} n 除数。
 * @returns {number} 余数。
 */
CesiumMath.mod = function (m, n) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(m)) {
    throw new DeveloperError("m is required.");
  }
  if (!defined(n)) {
    throw new DeveloperError("n is required.");
  }
  if (n === 0.0) {
    throw new DeveloperError("divisor cannot be 0.");
  }
  //>>includeEnd('debug');
  if (CesiumMath.sign(m) === CesiumMath.sign(n) && Math.abs(m) < Math.abs(n)) {
    // Early exit if the input does not need to be modded. This avoids
    // unnecessary math which could introduce floating point error.
    return m;
  }

  return ((m % n) + n) % n;
};

/**
 * 使用绝对或相对容差测试确定两个值是否相等。这对于
 * 避免直接比较浮点值时因舍入误差引起的问题很有用。首先
 * 使用绝对容差测试比较值。如果失败，则执行相对容差测试。
 * 如果不确定左右值的大小，请使用此测试。
 *
 * @param {number} left 要比较的第一个值。
 * @param {number} right 要比较的另一个值。
 * @param {number} [relativeEpsilon=0] 相对容差测试中 <code>left</code> 和 <code>right</code> 之间的最大包容增量。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 绝对容差测试中 <code>left</code> 和 <code>right</code> 之间的最大包容增量。
 * @returns {boolean} 如果值在 epsilon 范围内相等，则为 <code>true</code>；否则为 <code>false</code>。
 *
 * @example
 * const a = Cesium.Math.equalsEpsilon(0.0, 0.01, Cesium.Math.EPSILON2); // true
 * const b = Cesium.Math.equalsEpsilon(0.0, 0.1, Cesium.Math.EPSILON2);  // false
 * const c = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON7); // true
 * const d = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON9); // false
 */
CesiumMath.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("left is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("right is required.");
  }
  //>>includeEnd('debug');

  relativeEpsilon = relativeEpsilon ?? 0.0;
  absoluteEpsilon = absoluteEpsilon ?? relativeEpsilon;
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
};

/**
 * 确定左值是否小于右值。如果两个值在
 * <code>absoluteEpsilon</code> 范围内，则认为它们相等，此函数返回 false。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 用于比较的绝对 epsilon。
 * @returns {boolean} 如果 <code>left</code> 小于 <code>right</code> 超过
 *          <code>absoluteEpsilon<code>，则返回 <code>true</code>。如果 <code>left</code> 较大或两个
 *          值几乎相等，则返回 <code>false</code>。
 */
CesiumMath.lessThan = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right < -absoluteEpsilon;
};

/**
 * 确定左值是否小于或等于右值。如果两个值在
 * <code>absoluteEpsilon</code> 范围内，则认为它们相等，此函数返回 true。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 用于比较的绝对 epsilon。
 * @returns {boolean} 如果 <code>left</code> 小于 <code>right</code> 或两个
 *          值几乎相等，则返回 <code>true</code>。
 */
CesiumMath.lessThanOrEquals = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right < absoluteEpsilon;
};

/**
 * 确定左值是否大于右值。如果两个值在
 * <code>absoluteEpsilon</code> 范围内，则认为它们相等，此函数返回 false。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 用于比较的绝对 epsilon。
 * @returns {boolean} 如果 <code>left</code> 大于 <code>right</code> 超过
 *          <code>absoluteEpsilon<code>，则返回 <code>true</code>。如果 <code>left</code> 较小或两个
 *          值几乎相等，则返回 <code>false</code>。
 */
CesiumMath.greaterThan = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right > absoluteEpsilon;
};

/**
 * 确定左值是否大于或等于右值。如果两个值在
 * <code>absoluteEpsilon</code> 范围内，则认为它们相等，此函数返回 true。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 用于比较的绝对 epsilon。
 * @returns {boolean} 如果 <code>left</code> 大于 <code>right</code> 或两个
 *          值几乎相等，则返回 <code>true</code>。
 */
CesiumMath.greaterThanOrEquals = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right > -absoluteEpsilon;
};

const factorials = [1];

/**
 * 计算所提供数字的阶乘。
 *
 * @param {number} n 要计算阶乘的数字。
 * @returns {number} 所提供数字的阶乘，如果数字小于 0 则返回 undefined。
 *
 * @exception {DeveloperError} 需要大于或等于 0 的数字。
 *
 *
 * @example
 * //计算 7!，等于 5040
 * const computedFactorial = Cesium.Math.factorial(7);
 *
 * @see {@link http://en.wikipedia.org/wiki/Factorial|维基百科上的阶乘}
 */
CesiumMath.factorial = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0) {
    throw new DeveloperError(
      "A number greater than or equal to 0 is required.",
    );
  }
  //>>includeEnd('debug');

  const length = factorials.length;
  if (n >= length) {
    let sum = factorials[length - 1];
    for (let i = length; i <= n; i++) {
      const next = sum * i;
      factorials.push(next);
      sum = next;
    }
  }
  return factorials[n];
};

/**
 * 如果数字超过最大值，则递增一个数字并回绕到最小值。
 *
 * @param {number} [n] 要递增的数字。
 * @param {number} [maximumValue] 回绕到最小值之前的最大递增值。
 * @param {number} [minimumValue=0.0] 超过最大值后重置到的数字。
 * @returns {number} 递增后的数字。
 *
 * @exception {DeveloperError} 最大值必须大于最小值。
 *
 * @example
 * const n = Cesium.Math.incrementWrap(5, 10, 0); // 返回 6
 * const m = Cesium.Math.incrementWrap(10, 10, 0); // 返回 0
 */
CesiumMath.incrementWrap = function (n, maximumValue, minimumValue) {
  minimumValue = minimumValue ?? 0.0;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(n)) {
    throw new DeveloperError("n is required.");
  }
  if (maximumValue <= minimumValue) {
    throw new DeveloperError("maximumValue must be greater than minimumValue.");
  }
  //>>includeEnd('debug');

  ++n;
  if (n > maximumValue) {
    n = minimumValue;
  }
  return n;
};

/**
 * 确定非负整数是否为 2 的幂。
 * 由于 Javascript 中 32 位按位运算符的限制，允许的最大输入为 (2^32)-1。
 *
 * @param {number} n 要测试的整数，范围 [0, (2^32)-1]。
 * @returns {boolean} 如果数字是 2 的幂，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 需要 0 到 (2^32)-1 之间的数字。
 *
 * @example
 * const t = Cesium.Math.isPowerOfTwo(16); // true
 * const f = Cesium.Math.isPowerOfTwo(20); // false
 */
CesiumMath.isPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError("A number between 0 and (2^32)-1 is required.");
  }
  //>>includeEnd('debug');

  return n !== 0 && (n & (n - 1)) === 0;
};

/**
 * 计算大于或等于所提供非负整数的下一个 2 的幂整数。
 * 由于 Javascript 中 32 位按位运算符的限制，允许的最大输入为 2^31。
 *
 * @param {number} n 要测试的整数，范围 [0, 2^31]。
 * @returns {number} 下一个 2 的幂整数。
 *
 * @exception {DeveloperError} 需要 0 到 2^31 之间的数字。
 *
 * @example
 * const n = Cesium.Math.nextPowerOfTwo(29); // 32
 * const m = Cesium.Math.nextPowerOfTwo(32); // 32
 */
CesiumMath.nextPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 2147483648) {
    throw new DeveloperError("A number between 0 and 2^31 is required.");
  }
  //>>includeEnd('debug');

  // From http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
  --n;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  ++n;

  return n;
};

/**
 * 计算小于或等于所提供非负整数的上一个 2 的幂整数。
 * 由于 Javascript 中 32 位按位运算符的限制，允许的最大输入为 (2^32)-1。
 *
 * @param {number} n 要测试的整数，范围 [0, (2^32)-1]。
 * @returns {number} 上一个 2 的幂整数。
 *
 * @exception {DeveloperError} 需要 0 到 (2^32)-1 之间的数字。
 *
 * @example
 * const n = Cesium.Math.previousPowerOfTwo(29); // 16
 * const m = Cesium.Math.previousPowerOfTwo(32); // 32
 */
CesiumMath.previousPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError("A number between 0 and (2^32)-1 is required.");
  }
  //>>includeEnd('debug');

  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n |= n >> 32;

  // The previous bitwise operations implicitly convert to signed 32-bit. Use `>>>` to convert to unsigned
  n = (n >>> 0) - (n >>> 1);

  return n;
};

/**
 * 将值约束在两个值之间。
 *
 * @param {number} value 要钳制的值。
 * @param {number} min 最小值。
 * @param {number} max 最大值。
 * @returns {number} 钳制后的值，使得 min <= result <= max。
 */
CesiumMath.clamp = function (value, min, max) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  Check.typeOf.number("min", min);
  Check.typeOf.number("max", max);
  //>>includeEnd('debug');

  return value < min ? min : value > max ? max : value;
};

let randomNumberGenerator = new MersenneTwister();

/**
 * 设置 {@link CesiumMath#nextRandomNumber} 中随机数生成器使用的种子。
 *
 * @param {number} seed 用作种子的整数。
 */
CesiumMath.setRandomNumberSeed = function (seed) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(seed)) {
    throw new DeveloperError("seed is required.");
  }
  //>>includeEnd('debug');

  randomNumberGenerator = new MersenneTwister(seed);
};

/**
 * 使用 Mersenne Twister 算法生成范围 [0.0, 1.0) 内的随机浮点数。
 *
 * @returns {number} 范围 [0.0, 1.0) 内的随机数。
 *
 * @see CesiumMath.setRandomNumberSeed
 * @see {@link http://en.wikipedia.org/wiki/Mersenne_twister|维基百科上的梅森旋转算法}
 */
CesiumMath.nextRandomNumber = function () {
  return randomNumberGenerator.random();
};

/**
 * 在两个数字之间生成随机数。
 *
 * @param {number} min 最小值。
 * @param {number} max 最大值。
 * @returns {number} min 和 max 之间的随机数。
 */
CesiumMath.randomBetween = function (min, max) {
  return CesiumMath.nextRandomNumber() * (max - min) + min;
};

/**
 * 计算 <code>Math.acos(value)</code>，但首先将 <code>value</code> 钳制到范围 [-1.0, 1.0]
 * 以便该函数永远不会返回 NaN。
 *
 * @param {number} value 要计算 acos 的值。
 * @returns {number} 如果值在范围 [-1.0, 1.0] 内，则为值的 acos；如果值超出范围，则为 -1.0 或 1.0 的 acos（取较近者）。
 */
CesiumMath.acosClamped = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');
  return Math.acos(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * 计算 <code>Math.asin(value)</code>，但首先将 <code>value</code> 钳制到范围 [-1.0, 1.0]
 * 以便该函数永远不会返回 NaN。
 *
 * @param {number} value 要计算 asin 的值。
 * @returns {number} 如果值在范围 [-1.0, 1.0] 内，则为值的 asin；如果值超出范围，则为 -1.0 或 1.0 的 asin（取较近者）。
 */
CesiumMath.asinClamped = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');
  return Math.asin(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * 根据圆的半径和两点之间的夹角求两点之间的弦长。
 *
 * @param {number} angle 两点之间的夹角。
 * @param {number} radius 圆的半径。
 * @returns {number} 弦长。
 */
CesiumMath.chordLength = function (angle, radius) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  if (!defined(radius)) {
    throw new DeveloperError("radius is required.");
  }
  //>>includeEnd('debug');
  return 2.0 * radius * Math.sin(angle * 0.5);
};

/**
 * 求数字相对于底数的对数。
 *
 * @param {number} number 数字。
 * @param {number} base 底数。
 * @returns {number} 结果。
 */
CesiumMath.logBase = function (number, base) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(number)) {
    throw new DeveloperError("number is required.");
  }
  if (!defined(base)) {
    throw new DeveloperError("base is required.");
  }
  //>>includeEnd('debug');
  return Math.log(number) / Math.log(base);
};

/**
 * 求数字的立方根。
 * 如果未提供 <code>number</code>，则返回 NaN。
 *
 * @function
 * @param {number} [number] 数字。
 * @returns {number} 结果。
 */
CesiumMath.cbrt =
  Math.cbrt ??
  function cbrt(number) {
    const result = Math.pow(Math.abs(number), 1.0 / 3.0);
    return number < 0.0 ? -result : result;
  };

/**
 * 求数字的以 2 为底的对数。
 *
 * @function
 * @param {number} number 数字。
 * @returns {number} 结果。
 */
CesiumMath.log2 =
  Math.log2 ??
  function log2(number) {
    return Math.log(number) * Math.LOG2E;
  };

/**
 * 计算给定距离处的雾影响。用于剔除。
 * 匹配 `fog.glsl` 中的方程
 * @private
 */
CesiumMath.fog = function (distanceToCamera, density) {
  const scalar = distanceToCamera * density;
  return 1.0 - Math.exp(-(scalar * scalar));
};

/**
 * 为范围 [-1, 1] 内的输入计算 Atan 的快速近似值。
 *
 * 基于 Michal Drobot 在 ShaderFastLibs 中的近似，
 * 进而基于 "Efficient approximations for the arctangent function,"
 * Rajan, S. Sichun Wang Inkol, R. Joyal, A., 2006 年 5 月。
 * 根据 MIT 许可从 ShaderFastLibs 改编。
 *
 * @param {number} x 范围 [-1, 1] 内的输入数字
 * @returns {number} atan(x) 的近似值
 */
CesiumMath.fastApproximateAtan = function (x) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("x", x);
  //>>includeEnd('debug');

  return x * (-0.1784 * Math.abs(x) - 0.0663 * x * x + 1.0301);
};

/**
 * 为任意输入标量计算 Atan2(x, y) 的快速近似值。
 *
 * 范围缩减数学基于 nvidia 的 cg 参考实现：http://developer.download.nvidia.com/cg/atan2.html
 *
 * @param {number} x 如果 y 为零则不为零的输入数字。
 * @param {number} y 如果 x 为零则不为零的输入数字。
 * @returns {number} atan2(x, y) 的近似值
 */
CesiumMath.fastApproximateAtan2 = function (x, y) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("x", x);
  Check.typeOf.number("y", y);
  //>>includeEnd('debug');

  // atan approximations are usually only reliable over [-1, 1]
  // So reduce the range by flipping whether x or y is on top based on which is bigger.
  let opposite;
  let t = Math.abs(x); // t used as swap and atan result.
  opposite = Math.abs(y);
  const adjacent = Math.max(t, opposite);
  opposite = Math.min(t, opposite);

  const oppositeOverAdjacent = opposite / adjacent;
  //>>includeStart('debug', pragmas.debug);
  if (isNaN(oppositeOverAdjacent)) {
    throw new DeveloperError("either x or y must be nonzero");
  }
  //>>includeEnd('debug');
  t = CesiumMath.fastApproximateAtan(oppositeOverAdjacent);

  // Undo range reduction
  t = Math.abs(y) > Math.abs(x) ? CesiumMath.PI_OVER_TWO - t : t;
  t = x < 0.0 ? CesiumMath.PI - t : t;
  t = y < 0.0 ? -t : t;
  return t;
};

export default CesiumMath;
