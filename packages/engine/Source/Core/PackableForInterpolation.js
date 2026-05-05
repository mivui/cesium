import DeveloperError from "./DeveloperError.js";

/**
 * {@link Packable}类型的静态接口，这些类型以其打包值的不同表示形式进行插值。这些方法和属性应在构造函数上定义。
 *
 * @namespace PackableForInterpolation
 *
 * @see Packable
 */
const PackableForInterpolation = {
  /**
   * 以其可插值形式将对象存储到数组中所需的元素数量。
   * @type {number}
   */
  packedInterpolationLength: undefined,

  /**
   * 将打包数组转换为适合插值的形式。
   * @function
   *
   * @param {number[]} packedArray 打包数组。
   * @param {number} [startingIndex=0] 要转换的第一个元素的索引。
   * @param {number} [lastIndex=packedArray.length] 要转换的最后一个元素的索引。
   * @param {number[]} [result] 用于存储结果的对象。
   */
  convertPackedArrayForInterpolation: DeveloperError.throwInstantiationError,

  /**
   * 从使用{@link PackableForInterpolation.convertPackedArrayForInterpolation}转换的打包数组中检索实例。
   * @function
   *
   * @param {number[]} array 之前为插值打包的数组。
   * @param {number[]} sourceArray 原始打包数组。
   * @param {number} [startingIndex=0] 用于转换数组的startingIndex。
   * @param {number} [lastIndex=packedArray.length] 用于转换数组的lastIndex。
   * @param {object} [result] 用于存储结果的对象。
   * @returns {object} 修改后的result参数，如果未提供则返回一个新的Object实例。
   */
  unpackInterpolationResult: DeveloperError.throwInstantiationError,
};
export default PackableForInterpolation;
