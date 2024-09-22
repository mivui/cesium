import DeveloperError from "./DeveloperError.js";

/**
 * 静态接口，用于类型，可以将其值存储为 packed
 * 元素。 这些方法和属性应为
 * 在构造函数上定义。
 *
 * @interface Packable
 *
 * @see PackableForInterpolation
 */
const Packable = {
  /**
   * 用于将对象打包到数组中的元素数量。
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
   * @returns {object} 修改后的结果参数或者一个新的 Object 实例（如果未提供）。
   */
  unpack: DeveloperError.throwInstantiationError,
};
export default Packable;
