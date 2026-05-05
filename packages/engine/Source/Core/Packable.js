import DeveloperError from "./DeveloperError.js";

/**
 * 可将值存储为数组中的打包元素的类型的静态接口。这些方法和属性应在构造函数上定义。
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
   * @param {number[]} array 要打包到的数组。
   * @param {number} [startingIndex=0] 数组中开始打包元素的索引。
   */
  pack: DeveloperError.throwInstantiationError,

  /**
   * 从打包的数组中检索实例。
   * @function
   *
   * @param {number[]} array 打包的数组。
   * @param {number} [startingIndex=0] 要解包的元素起始索引。
   * @param {object} [result] 用于存储结果的对象。
   * @returns {object} 修改后的result参数，如果未提供则返回一个新的Object实例。
   */
  unpack: DeveloperError.throwInstantiationError,
};
export default Packable;
