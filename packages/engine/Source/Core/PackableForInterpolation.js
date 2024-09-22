import DeveloperError from "./DeveloperError.js";

/**
 * 用于 {@link Packable} 类型的静态接口，这些类型在
 * 与其打包值不同的表示形式。 这些方法和
 * 应在构造函数上定义属性。
 *
 * @namespace PackableForInterpolation
 *
 * @see Packable
 */
const PackableForInterpolation = {
  /**
   * 用于将对象以可插值形式存储到数组中的元素数。
   * @type {number}
   */
  packedInterpolationLength: undefined,

  /**
   * 将打包数组转换为适合插值的形式。
   * @function
   *
   * @param {number[]} packedArray 打包数组。
   * @param {number} [startingIndex=0] The index of the first element to be converted.
   * @param {number} [lastIndex=packedArray.length] The index of the last element to be converted.
   * @param {number[]} [result] 要在其中存储结果的对象。
   */
  convertPackedArrayForInterpolation: DeveloperError.throwInstantiationError,

  /**
   * 从使用 {@link PackableForInterpolation.convertPackedArrayForInterpolation}.
   * @function
   *
   * @param {number[]} array 先前打包用于插值的数组。
   * @param {number[]} sourceArray 原始打包数组。
   * @param {number} [startingIndex=0] 用于转换数组的 startingIndex。
   * @param {number} [lastIndex=packedArray.length] 用于转换数组的 lastIndex。
   * @param {object} [result] 要在其中存储结果的对象。
   * @returns {object} 修改后的结果参数或者一个新的 Object 实例（如果未提供）。
   */
  unpackInterpolationResult: DeveloperError.throwInstantiationError,
};
export default PackableForInterpolation;
