import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * Represents a scalar value's lower and upper bound at a near distance and far distance in eye space.
 * @alias NearFarScalar
 * @constructor
 *
 * @param {number} [near=0.0] The lower bound of the camera range.
 * @param {number} [nearValue=0.0] The value at the lower bound of the camera range.
 * @param {number} [far=1.0] The upper bound of the camera range.
 * @param {number} [farValue=0.0] The value at the upper bound of the camera range.
 *
 * @see Packable
 */
function NearFarScalar(near, nearValue, far, farValue) {
  /**
   * The lower bound of the camera range.
   * @type {number}
   * @default 0.0
   */
  this.near = defaultValue(near, 0.0);
  /**
   * The value at the lower bound of the camera range.
   * @type {number}
   * @default 0.0
   */
  this.nearValue = defaultValue(nearValue, 0.0);
  /**
   * The upper bound of the camera range.
   * @type {number}
   * @default 1.0
   */
  this.far = defaultValue(far, 1.0);
  /**
   * The value at the upper bound of the camera range.
   * @type {number}
   * @default 0.0
   */
  this.farValue = defaultValue(farValue, 0.0);
}

/**
 * 复制NearFarScalar instance.
 *
 * @param {NearFarScalar} nearFarScalar The NearFarScalar to duplicate.
 * @param {NearFarScalar} [result] 要在其上存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数 or a new NearFarScalar instance if one was not provided. (Returns undefined if nearFarScalar is undefined)
 */
NearFarScalar.clone = function (nearFarScalar, result) {
  if (!defined(nearFarScalar)) {
    return undefined;
  }

  if (!defined(result)) {
    return new NearFarScalar(
      nearFarScalar.near,
      nearFarScalar.nearValue,
      nearFarScalar.far,
      nearFarScalar.farValue
    );
  }

  result.near = nearFarScalar.near;
  result.nearValue = nearFarScalar.nearValue;
  result.far = nearFarScalar.far;
  result.farValue = nearFarScalar.farValue;
  return result;
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
NearFarScalar.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {NearFarScalar} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
NearFarScalar.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.near;
  array[startingIndex++] = value.nearValue;
  array[startingIndex++] = value.far;
  array[startingIndex] = value.farValue;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {NearFarScalar} [result] 要在其中存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数 or a new NearFarScalar instance if one was not provided.
 */
NearFarScalar.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new NearFarScalar();
  }
  result.near = array[startingIndex++];
  result.nearValue = array[startingIndex++];
  result.far = array[startingIndex++];
  result.farValue = array[startingIndex];
  return result;
};

/**
 * Compares the provided NearFarScalar and returns <code>true</code> if they are equal,
 * <code>false</code> 否则。
 *
 * @param {NearFarScalar} [left] 第一个NearFarScalar.
 * @param {NearFarScalar} [right] 第二个 NearFarScalar.
 * @returns {boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
 */
NearFarScalar.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.near === right.near &&
      left.nearValue === right.nearValue &&
      left.far === right.far &&
      left.farValue === right.farValue)
  );
};

/**
 * 复制instance.
 *
 * @param {NearFarScalar} [result] 要在其上存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数 or a new NearFarScalar instance if one was not provided.
 */
NearFarScalar.prototype.clone = function (result) {
  return NearFarScalar.clone(this, result);
};

/**
 * Compares this instance to the provided NearFarScalar and returns <code>true</code> if they are equal,
 * <code>false</code> 否则。
 *
 * @param {NearFarScalar} [right] 右边 NearFarScalar.
 * @returns {boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
 */
NearFarScalar.prototype.equals = function (right) {
  return NearFarScalar.equals(this, right);
};
export default NearFarScalar;
