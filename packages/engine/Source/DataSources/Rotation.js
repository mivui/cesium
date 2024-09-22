import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";

/**
 * 表示始终对值进行插值的 {@link Packable} 数字
 * 朝向最短的旋转角度。此对象永远不会直接使用
 * 而是传递给 {@link SampledProperty} 的构造函数
 * 来表示二维旋转角度。
 *
 * @interface Rotation
 *
 *
 * @example
 * const time1 = Cesium.JulianDate.fromIso8601('2010-05-07T00:00:00');
 * const time2 = Cesium.JulianDate.fromIso8601('2010-05-07T00:01:00');
 * const time3 = Cesium.JulianDate.fromIso8601('2010-05-07T00:02:00');
 *
 * const property = new Cesium.SampledProperty(Cesium.Rotation);
 * property.addSample(time1, 0);
 * property.addSample(time3, Cesium.Math.toRadians(350));
 *
 * //Getting the value at time2 will equal 355 degrees instead
 * //of 175 degrees (which is what you get if you construct
 * //a SampledProperty(Number) instead.  Note, the actual
 * //return value is in radians, not degrees.
 * property.getValue(time2);
 *
 * @see PackableForInterpolation
 */
const Rotation = {
  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  packedLength: 1,

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Rotation} value 要打包的值。
   * @param {number[]} array 要装入的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
   *
   * @returns {number[]} 被装入的数组
   */
  pack: function (value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
      throw new DeveloperError("value is required");
    }

    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);
    array[startingIndex] = value;

    return array;
  },

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
   * @param {Rotation} [result] 要在其中存储结果的对象。
   * @returns {Rotation} 修改后的结果参数或新的 Rotation 实例（如果未提供）。
   */
  unpack: function (array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);
    return array[startingIndex];
  },

  /**
   * 将打包数组转换为适合插值的形式。
   *
   * @param {number[]} packedArray 打包数组。
   * @param {number} [startingIndex=0] 要转换的第一个元素的索引。
   * @param {number} [lastIndex=packedArray.length] 最后一个要转换的元素的索引。
   * @param {number[]} [result] 要在其中存储结果的对象。
   */
  convertPackedArrayForInterpolation: function (
    packedArray,
    startingIndex,
    lastIndex,
    result
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(packedArray)) {
      throw new DeveloperError("packedArray is required");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = [];
    }

    startingIndex = defaultValue(startingIndex, 0);
    lastIndex = defaultValue(lastIndex, packedArray.length);

    let previousValue;
    for (let i = 0, len = lastIndex - startingIndex + 1; i < len; i++) {
      const value = packedArray[startingIndex + i];
      if (i === 0 || Math.abs(previousValue - value) < Math.PI) {
        result[i] = value;
      } else {
        result[i] = value - CesiumMath.TWO_PI;
      }
      previousValue = value;
    }
  },

  /**
   * 从使用 {@link Rotation.convertPackedArrayForInterpolation} 转换的打包数组中检索实例。
   *
   * @param {number[]} array 先前打包用于插值的数组。
   * @param {number[]} sourceArray 原始打包数组。
   * @param {number} [firstIndex=0] 用于转换数组的 firstIndex。
   * @param {number} [lastIndex=packedArray.length] 用于转换数组的 lastIndex。
   * @param {Rotation} [result] 要在其中存储结果的对象。
   * @returns {Rotation} 修改后的结果参数或新的 Rotation 实例（如果未提供）。
   */
  unpackInterpolationResult: function (
    array,
    sourceArray,
    firstIndex,
    lastIndex,
    result
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    if (!defined(sourceArray)) {
      throw new DeveloperError("sourceArray is required");
    }
    //>>includeEnd('debug');

    result = array[0];
    if (result < 0) {
      return result + CesiumMath.TWO_PI;
    }
    return result;
  },
};
export default Rotation;
