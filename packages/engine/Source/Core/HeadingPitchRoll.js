import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 以航向、俯仰和横滚表示的旋转。航向是绕负z轴的旋转。俯仰是绕负y轴的旋转。横滚是绕正x轴的旋转。
 * @alias HeadingPitchRoll
 * @constructor
 *
 * @param {number} [heading=0.0] 航向分量，以弧度表示。
 * @param {number} [pitch=0.0] 俯仰分量，以弧度表示。
 * @param {number} [roll=0.0] 横滚分量，以弧度表示。
 */
function HeadingPitchRoll(heading, pitch, roll) {
  /**
   * 获取或设置航向。
   * @type {number}
   * @default 0.0
   */
  this.heading = heading ?? 0.0;
  /**
   * 获取或设置俯仰。
   * @type {number}
   * @default 0.0
   */
  this.pitch = pitch ?? 0.0;
  /**
   * 获取或设置横滚。
   * @type {number}
   * @default 0.0
   */
  this.roll = roll ?? 0.0;
}

/**
 * 从四元数计算航向、俯仰和横滚（参见 http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles ）
 *
 * @param {Quaternion} quaternion 用于获取航向、俯仰和横滚的四元数，均以弧度表示。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如未提供，则创建并返回新实例。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如未提供则返回新的 HeadingPitchRoll 实例。
 */
HeadingPitchRoll.fromQuaternion = function (quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(quaternion)) {
    throw new DeveloperError("quaternion is required");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new HeadingPitchRoll();
  }
  const test = 2 * (quaternion.w * quaternion.y - quaternion.z * quaternion.x);
  const denominatorRoll =
    1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y);
  const numeratorRoll =
    2 * (quaternion.w * quaternion.x + quaternion.y * quaternion.z);
  const denominatorHeading =
    1 - 2 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z);
  const numeratorHeading =
    2 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y);
  result.heading = -Math.atan2(numeratorHeading, denominatorHeading);
  result.roll = Math.atan2(numeratorRoll, denominatorRoll);
  result.pitch = -CesiumMath.asinClamped(test);
  return result;
};

/**
 * 从以度为单位的角度返回新的 HeadingPitchRoll 实例。
 *
 * @param {number} heading 航向，以度为单位
 * @param {number} pitch 俯仰，以度为单位
 * @param {number} roll 横滚，以度为单位
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如未提供，则创建并返回新实例。
 * @returns {HeadingPitchRoll} 新的 HeadingPitchRoll 实例
 */
HeadingPitchRoll.fromDegrees = function (heading, pitch, roll, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(heading)) {
    throw new DeveloperError("heading is required");
  }
  if (!defined(pitch)) {
    throw new DeveloperError("pitch is required");
  }
  if (!defined(roll)) {
    throw new DeveloperError("roll is required");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new HeadingPitchRoll();
  }
  result.heading = heading * CesiumMath.RADIANS_PER_DEGREE;
  result.pitch = pitch * CesiumMath.RADIANS_PER_DEGREE;
  result.roll = roll * CesiumMath.RADIANS_PER_DEGREE;
  return result;
};

/**
 * 复制一个 HeadingPitchRoll 实例。
 *
 * @param {HeadingPitchRoll} headingPitchRoll 要复制的 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如未提供则返回新的 HeadingPitchRoll 实例。（如果 headingPitchRoll 未定义则返回 undefined）
 */
HeadingPitchRoll.clone = function (headingPitchRoll, result) {
  if (!defined(headingPitchRoll)) {
    return undefined;
  }
  if (!defined(result)) {
    return new HeadingPitchRoll(
      headingPitchRoll.heading,
      headingPitchRoll.pitch,
      headingPitchRoll.roll,
    );
  }
  result.heading = headingPitchRoll.heading;
  result.pitch = headingPitchRoll.pitch;
  result.roll = headingPitchRoll.roll;
  return result;
};

/**
 * 逐分量比较提供的 HeadingPitchRoll 值，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [left] 第一个 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
HeadingPitchRoll.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.heading === right.heading &&
      left.pitch === right.pitch &&
      left.roll === right.roll)
  );
};

/**
 * 逐分量比较提供的 HeadingPitchRoll 值，如果通过绝对或相对容差测试则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [left] 第一个 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll。
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对 epsilon 容差。
 * @returns {boolean} 如果左右值在提供的 epsilon 范围内则返回 <code>true</code>，否则返回 <code>false</code>。
 */
HeadingPitchRoll.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.heading,
        right.heading,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.pitch,
        right.pitch,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.roll,
        right.roll,
        relativeEpsilon,
        absoluteEpsilon,
      ))
  );
};

/**
 * Duplicates this HeadingPitchRoll instance.
 *
 * @param {HeadingPitchRoll} [result] The object onto which to store the result.
 * @returns {HeadingPitchRoll} The modified result parameter or a new HeadingPitchRoll instance if one was not provided.
 */
HeadingPitchRoll.prototype.clone = function (result) {
  return HeadingPitchRoll.clone(this, result);
};

/**
 * Compares this HeadingPitchRoll against the provided HeadingPitchRoll componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {HeadingPitchRoll} [right] The right hand side HeadingPitchRoll.
 * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
 */
HeadingPitchRoll.prototype.equals = function (right) {
  return HeadingPitchRoll.equals(this, right);
};

/**
 * Compares this HeadingPitchRoll against the provided HeadingPitchRoll componentwise and returns
 * <code>true</code> if they pass an absolute or relative tolerance test,
 * <code>false</code> otherwise.
 *
 * @param {HeadingPitchRoll} [right] The right hand side HeadingPitchRoll.
 * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
 * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
 * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
 */
HeadingPitchRoll.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return HeadingPitchRoll.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon,
  );
};

/**
 * Creates a string representing this HeadingPitchRoll in the format '(heading, pitch, roll)' in radians.
 *
 * @returns {string} A string representing the provided HeadingPitchRoll in the format '(heading, pitch, roll)'.
 */
HeadingPitchRoll.prototype.toString = function () {
  return `(${this.heading}, ${this.pitch}, ${this.roll})`;
};
export default HeadingPitchRoll;
