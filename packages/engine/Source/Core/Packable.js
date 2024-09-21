import DeveloperError from "./DeveloperError.js";

/**
 * Static interface for types which can store their values as packed
 * elements in an array.  These methods and properties are expected to be
 * defined on a constructor function.
 *
 * @interface Packable
 *
 * @see PackableForInterpolation
 */
const Packable = {
  /**
   * The number of elements used to pack the object into an array.
   * @type {number}
   */
  packedLength: undefined,

  /**
   * 将提供的实例存储到提供的数组中。
   * @function
   *
   * @param {*} value 要打包的值。
   * @param {number[]} array 要装入的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
   */
  pack: DeveloperError.throwInstantiationError,

  /**
   * 从打包数组中检索实例。
   * @function
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
   * @param {object} [result] 要在其中存储结果的对象。
   * @returns {object} The modified result parameter or a new Object instance if one was not provided.
   */
  unpack: DeveloperError.throwInstantiationError,
};
export default Packable;
