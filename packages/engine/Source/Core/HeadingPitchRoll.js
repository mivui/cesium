import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 以航向、俯仰和滚动表示的旋转。heading 是围绕
 * 负 Z 轴。Pitch 是绕负 y 轴的旋转。Roll 是旋转
 * 正 x 轴。
 * @alias HeadingPitchRoll
 * @constructor
 *
 * @param {number} [heading=0.0] 以弧度为单位的航向分量。
 * @param {number} [pitch=0.0] 以弧度为单位的音高分量。
 * @param {number} [roll=0.0] 以弧度为单位的滚动分量。
 */
function HeadingPitchRoll(heading, pitch, roll) {
  /**
   * 获取或设置heading.
   * @type {number}
   * @default 0.0
   */
  this.heading = defaultValue(heading, 0.0);
  /**
   * 获取或设置pitch.
   * @type {number}
   * @default 0.0
   */
  this.pitch = defaultValue(pitch, 0.0);
  /**
   * 获取或设置roll.
   * @type {number}
   * @default 0.0
   */
  this.roll = defaultValue(roll, 0.0);
}

/**
 * 从四元数开始计算航向、俯仰和滚动（见 http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles ）
 *
 * @param {Quaternion} quaternion  从中检索航向、俯仰和滚动的四元数，全部以弧度表示。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如果未提供，则创建并返回一个新实例。
 * @returns {HeadingPitchRoll} 修改后的结果参数或新的 HeadingPitchRoll 实例（如果未提供）。
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
 * 从以度为单位给出的角度返回一个新的 HeadingPitchRoll 实例。
 *
 * @param {number} 以度为单位的标题
 * @param {number} 以度为单位调整音高
 * @param {number} 以度为单位滚动航向
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如果未提供，则创建并返回一个新实例。
 * @returns {HeadingPitchRoll} 一个新的 HeadingPitchRoll 实例
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
 * 复制HeadingPitchRoll 实例。
 *
 * @param {HeadingPitchRoll} headingPitchRoll 要复制的 HeadingPitchRoll 中。
 * @param {HeadingPitchRoll} [result] 要在其上存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数 或者一个新的 HeadingPitchRoll 实例（如果未提供）。（如果 headingPitchRoll 未定义，则返回 undefined）
 */
HeadingPitchRoll.clone = function (headingPitchRoll, result) {
  if (!defined(headingPitchRoll)) {
    return undefined;
  }
  if (!defined(result)) {
    return new HeadingPitchRoll(
      headingPitchRoll.heading,
      headingPitchRoll.pitch,
      headingPitchRoll.roll
    );
  }
  result.heading = headingPitchRoll.heading;
  result.pitch = headingPitchRoll.pitch;
  result.roll = headingPitchRoll.roll;
  return result;
};

/**
 * 对提供的 HeadingPitchRolls 组件进行比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {HeadingPitchRoll} [left] 第一个HeadingPitchRoll.
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
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
 * 对提供的 HeadingPitchRolls 组件进行比较，并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [left] 第一个HeadingPitchRoll.
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
HeadingPitchRoll.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.heading,
        right.heading,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        left.pitch,
        right.pitch,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        left.roll,
        right.roll,
        relativeEpsilon,
        absoluteEpsilon
      ))
  );
};

/**
 * 复制HeadingPitchRoll instance.
 *
 * @param {HeadingPitchRoll} [result] 要在其上存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数 or a new HeadingPitchRoll instance if one was not provided.
 */
HeadingPitchRoll.prototype.clone = function (result) {
  return HeadingPitchRoll.clone(this, result);
};

/**
 * 将此 HeadingPitchRoll 与提供的 HeadingPitchRoll 组件进行比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {HeadingPitchRoll} [right] 右边 HeadingPitchRoll.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
HeadingPitchRoll.prototype.equals = function (right) {
  return HeadingPitchRoll.equals(this, right);
};

/**
 * 将此 HeadingPitchRoll 与提供的 HeadingPitchRoll 组件进行比较，并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [right] 右边 HeadingPitchRoll.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，否则 <code>false</code>。
 */
HeadingPitchRoll.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return HeadingPitchRoll.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon
  );
};

/**
 * 创建一个字符串，表示此 HeadingPitchRoll，格式为 '（heading， pitch， roll）'，以弧度为单位。
 *
 * @returns {string} 一个字符串，表示提供的 HeadingPitchRoll，格式为 '（heading， pitch， roll）'。
 */
HeadingPitchRoll.prototype.toString = function () {
  return `(${this.heading}, ${this.pitch}, ${this.roll})`;
};
export default HeadingPitchRoll;
