import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 表示在眼空间中近距和远距处标量值的下界和上界。
 * @alias NearFarScalar
 * @constructor
 *
 * @param {number} [near=0.0] 相机范围的下界。
 * @param {number} [nearValue=0.0] 相机范围下界处的值。
 * @param {number} [far=1.0] 相机范围的上界。
 * @param {number} [farValue=0.0] 相机范围上界处的值。
 *
 * @see Packable
 */
function NearFarScalar(near, nearValue, far, farValue) {
  /**
   * 相机范围的下界。
   * @type {number}
   * @default 0.0
   */
  this.near = near ?? 0.0;
  /**
   * 相机范围下界处的值。
   * @type {number}
   * @default 0.0
   */
  this.nearValue = nearValue ?? 0.0;
  /**
   * 相机范围的上界。
   * @type {number}
   * @default 1.0
   */
  this.far = far ?? 1.0;
  /**
   * 相机范围上界处的值。
   * @type {number}
   * @default 0.0
   */
  this.farValue = farValue ?? 0.0;
}

/**
 * 复制一个NearFarScalar实例。
 *
 * @param {NearFarScalar} nearFarScalar 要复制的NearFarScalar。
 * @param {NearFarScalar} [result] 用于存储结果的对象。
 * @returns {NearFarScalar} 修改后的result参数，如果未提供则返回新的NearFarScalar实例。（如果nearFarScalar未定义则返回undefined）
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
      nearFarScalar.farValue,
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
 * @param {number[]} array 要打包到的数组。
 * @param {number} [startingIndex=0] 数组中开始打包元素的索引。
 *
 * @returns {number[]} 被打包到的数组。
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

  startingIndex = startingIndex ?? 0;

  array[startingIndex++] = value.near;
  array[startingIndex++] = value.nearValue;
  array[startingIndex++] = value.far;
  array[startingIndex] = value.farValue;

  return array;
};

/**
 * 从打包的数组中检索实例。
 *
 * @param {number[]} array 打包的数组。
 * @param {number} [startingIndex=0] 要解包的元素起始索引。
 * @param {NearFarScalar} [result] 用于存储结果的对象。
 * @returns {NearFarScalar} 修改后的result参数，如果未提供则返回新的NearFarScalar实例。
 */
NearFarScalar.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

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
 * 比较提供的NearFarScalar，如果相等则返回<code>true</code>，否则返回<code>false</code>。
 *
 * @param {NearFarScalar} [left] 第一个NearFarScalar。
 * @param {NearFarScalar} [right] 第二个NearFarScalar。
 * @returns {boolean} 如果left和right相等则返回<code>true</code>；否则返回<code>false</code>。
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
 * 复制此实例。
 *
 * @param {NearFarScalar} [result] 用于存储结果的对象。
 * @returns {NearFarScalar} 修改后的result参数，如果未提供则返回新的NearFarScalar实例。
 */
NearFarScalar.prototype.clone = function (result) {
  return NearFarScalar.clone(this, result);
};

/**
 * 将此实例与提供的NearFarScalar进行比较，如果相等则返回<code>true</code>，否则返回<code>false</code>。
 *
 * @param {NearFarScalar} [right] 右侧的NearFarScalar。
 * @returns {boolean} 如果相等则返回<code>true</code>；否则返回<code>false</code>。
 */
NearFarScalar.prototype.equals = function (right) {
  return NearFarScalar.equals(this, right);
};
export default NearFarScalar;
