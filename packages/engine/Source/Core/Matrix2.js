// @ts-check

import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个 2x2 矩阵，可作为列主序数组进行索引。
 * 构造函数参数按行主序排列，以提高代码可读性。
 *
 * @implements {ArrayLike<number>}
 *
 * @see Matrix2.fromArray
 * @see Matrix2.fromColumnMajorArray
 * @see Matrix2.fromRowMajorArray
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.fromRotation
 * @see Matrix3
 * @see Matrix4
 */
// @ts-expect-error TODO(tsd-jsdoc): 需要索引签名支持。
class Matrix2 {
  /**
   * @param {number} [column0Row0=0.0] 第 0 列，第 0 行的值。
   * @param {number} [column1Row0=0.0] 第 1 列，第 0 行的值。
   * @param {number} [column0Row1=0.0] 第 0 列，第 1 行的值。
   * @param {number} [column1Row1=0.0] 第 1 列，第 1 行的值。
   */
  constructor(column0Row0, column1Row0, column0Row1, column1Row1) {
    this[0] = column0Row0 ?? 0.0;
    this[1] = column0Row1 ?? 0.0;
    this[2] = column1Row0 ?? 0.0;
    this[3] = column1Row1 ?? 0.0;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Matrix2} value 要打包的值。
   * @param {number[]} array 要打包到的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组索引。
   *
   * @returns {number[]} 被打包到的数组
   */
  static pack(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    array[startingIndex++] = value[0];
    array[startingIndex++] = value[1];
    array[startingIndex++] = value[2];
    array[startingIndex++] = value[3];

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包的数组。
   * @param {number} [startingIndex=0] 要解包的元素的起始索引。
   * @param {Matrix2} [result] 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Matrix2();
    }

    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    return result;
  }

  /**
   * 将 Matrix2 数组扁平化为组件数组。组件
   * 按列主序存储。
   *
   * @param {Matrix2[]} array 要打包的矩阵数组。
   * @param {number[]} [result] 用于存储结果的数组。如果是类型化数组，则必须具有 array.length * 4 个组件，否则将抛出 {@link DeveloperError}。如果是常规数组，它将调整为具有 (array.length * 4) 个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 4;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): Requires conditional TypedArray types.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "If result is a typed array, it must have exactly array.length * 4 elements",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Matrix2.pack(array[i], result, i * 4);
    }

    return result;
  }

  /**
   * 将列主序矩阵组件数组解包到 Matrix2 数组中。
   *
   * @param {number[]} array 要解包的组件数组。
   * @param {Matrix2[]} [result] 用于存储结果的数组。
   * @returns {Matrix2[]} 解包后的数组。
   */
  static unpackArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 4);
    if (array.length % 4 !== 0) {
      throw new DeveloperError("array length must be a multiple of 4.");
    }
    //>>includeEnd('debug');

    const length = array.length;
    if (!defined(result)) {
      result = new Array(length / 4);
    } else {
      result.length = length / 4;
    }

    for (let i = 0; i < length; i += 4) {
      const index = i / 4;
      result[index] = Matrix2.unpack(array, i, result[index]);
    }
    return result;
  }

  /**
   * 复制 Matrix2 实例。
   *
   * @param {Matrix2} matrix 要复制的矩阵。
   * @param {Matrix2} [result] 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。（如果 matrix 为 undefined，则返回 undefined）
   */
  static clone(matrix, result) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix2(matrix[0], matrix[2], matrix[1], matrix[3]);
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    return result;
  }

  /**
   * 从列主序数组创建 Matrix2 实例。
   *
   * @param {number[]} values 列主序数组。
   * @param {Matrix2} [result] 用于存储结果的对象，如果为 undefined，将创建新实例。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   */
  static fromColumnMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    return Matrix2.clone(values, result);
  }

  /**
   * 从行主序数组创建 Matrix2 实例。
   * 生成的矩阵将按列主序排列。
   *
   * @param {number[]} values 行主序数组。
   * @param {Matrix2} [result] 用于存储结果的对象，如果为 undefined，将创建新实例。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   */
  static fromRowMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(values[0], values[1], values[2], values[3]);
    }
    result[0] = values[0];
    result[1] = values[2];
    result[2] = values[1];
    result[3] = values[3];
    return result;
  }

  /**
   * 计算表示非均匀缩放的 Matrix2 实例。
   *
   * @param {Cartesian2} scale x 和 y 缩放因子。
   * @param {Matrix2} [result] 用于存储结果的对象，如果为 undefined，将创建新实例。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   *
   * @example
   * // 创建
   * //   [7.0, 0.0]
   * //   [0.0, 8.0]
   * const m = Cesium.Matrix2.fromScale(new Cesium.Cartesian2(7.0, 8.0));
   */
  static fromScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(scale.x, 0.0, 0.0, scale.y);
    }

    result[0] = scale.x;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = scale.y;
    return result;
  }

  /**
   * 计算表示均匀缩放的 Matrix2 实例。
   *
   * @param {number} scale 均匀缩放因子。
   * @param {Matrix2} [result] 用于存储结果的对象，如果为 undefined，将创建新实例。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   *
   * @example
   * // 创建
   * //   [2.0, 0.0]
   * //   [0.0, 2.0]
   * const m = Cesium.Matrix2.fromUniformScale(2.0);
   */
  static fromUniformScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix2(scale, 0.0, 0.0, scale);
    }

    result[0] = scale;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = scale;
    return result;
  }

  /**
   * 创建旋转矩阵。
   *
   * @param {number} angle 旋转角度，以弧度为单位。正角度为逆时针方向。
   * @param {Matrix2} [result] 用于存储结果的对象，如果为 undefined，将创建新实例。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   *
   * @example
   * // 将点逆时针旋转 45 度。
   * const p = new Cesium.Cartesian2(5, 6);
   * const m = Cesium.Matrix2.fromRotation(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix2.multiplyByVector(m, p, new Cesium.Cartesian2());
   */
  static fromRotation(angle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("angle", angle);
    //>>includeEnd('debug');

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    if (!defined(result)) {
      return new Matrix2(cosAngle, -sinAngle, sinAngle, cosAngle);
    }
    result[0] = cosAngle;
    result[1] = sinAngle;
    result[2] = -sinAngle;
    result[3] = cosAngle;
    return result;
  }

  /**
   * 从提供的 Matrix2 实例创建数组。
   * 数组将按列主序排列。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number[]} [result] 用于存储结果的数组。
   * @returns {number[]} 修改后的数组参数，如果未提供，则为新的数组实例。
   */
  static toArray(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return [matrix[0], matrix[1], matrix[2], matrix[3]];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    return result;
  }

  /**
   * 计算提供的行和列处的数组元素的索引。
   *
   * @param {number} row 行的从零开始的索引。
   * @param {number} column 列的从零开始的索引。
   * @returns {number} 提供的行和列处的元素索引。
   *
   * @exception {DeveloperError} row 必须为 0 或 1。
   * @exception {DeveloperError} column 必须为 0 或 1。
   *
   * @example
   * const myMatrix = new Cesium.Matrix2();
   * const column1Row0Index = Cesium.Matrix2.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index]
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column, row) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check.typeOf.number.lessThanOrEquals("row", row, 1);

    Check.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check.typeOf.number.lessThanOrEquals("column", column, 1);
    //>>includeEnd('debug');

    return column * 2 + row;
  }

  /**
   * 检索所提供矩阵列的副本（作为 Cartesian2 实例）。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number} index 要检索的列的从零开始的索引。
   * @param {Cartesian2} result 用于存储结果的对象。
   * @returns {Cartesian2} 修改后的 result 参数。
   *
   * @exception {DeveloperError} index 必须为 0 或 1。
   */
  static getColumn(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const startIndex = index * 2;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[startIndex];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[startIndex + 1];

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * 计算一个新矩阵，用提供的 Cartesian2 实例替换所提供矩阵中的指定列。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number} index 要设置的列的从零开始的索引。
   * @param {Cartesian2} cartesian 其值将分配给指定列的 Cartesian。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @exception {DeveloperError} index 必须为 0 或 1。
   */
  static setColumn(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix2.clone(matrix, result);
    const startIndex = index * 2;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 1] = cartesian.y;
    return result;
  }

  /**
   * 检索所提供矩阵行的副本（作为 Cartesian2 实例）。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number} index 要检索的行的从零开始的索引。
   * @param {Cartesian2} result 用于存储结果的对象。
   * @returns {Cartesian2} 修改后的 result 参数。
   *
   * @exception {DeveloperError} index 必须为 0 或 1。
   */
  static getRow(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[index];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[index + 2];

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * 计算一个新矩阵，用提供的 Cartesian2 实例替换所提供矩阵中的指定行。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number} index 要设置的行的从零开始的索引。
   * @param {Cartesian2} cartesian 其值将分配给指定行的 Cartesian。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @exception {DeveloperError} index 必须为 0 或 1。
   */
  static setRow(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 1);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix2.clone(matrix, result);
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 2] = cartesian.y;
    return result;
  }

  /**
   * 计算一个新矩阵，用提供的缩放因子替换缩放。
   * 假设矩阵是仿射变换。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {Cartesian2} scale 替换所提供矩阵缩放的缩放因子。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @see Matrix2.setUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.getScale
   */
  static setScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix2.getScale(matrix, scaleScratch1);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioY;
    result[3] = matrix[3] * scaleRatioY;

    return result;
  }

  /**
   * 计算一个新矩阵，用提供的均匀缩放因子替换缩放。
   * 假设矩阵是仿射变换。
   *
   * @param {Matrix2} matrix 要使用的矩阵。
   * @param {number} scale 替换所提供矩阵缩放的均匀缩放因子。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @see Matrix2.setScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.getScale
   */
  static setUniformScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix2.getScale(matrix, scaleScratch2);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioY;
    result[3] = matrix[3] * scaleRatioY;

    return result;
  }

  /**
   * 假设矩阵是仿射变换，提取非均匀缩放。
   *
   * @param {Matrix2} matrix 矩阵。
   * @param {Cartesian2} result 用于存储结果的对象。
   * @returns {Cartesian2} 修改后的 result 参数。
   *
   * @see Matrix2.multiplyByScale
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   */
  static getScale(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Cartesian2.magnitude(
      Cartesian2.fromElements(matrix[0], matrix[1], scratchColumn),
    );
    result.y = Cartesian2.magnitude(
      Cartesian2.fromElements(matrix[2], matrix[3], scratchColumn),
    );
    return result;
  }

  /**
   * 计算最大缩放，假设矩阵是仿射变换。
   * 最大缩放是列向量的最大长度。
   *
   * @param {Matrix2} matrix 矩阵。
   * @returns {number} 最大缩放。
   */
  static getMaximumScale(matrix) {
    Matrix2.getScale(matrix, scaleScratch3);
    return Cartesian2.maximumComponent(scaleScratch3);
  }

  /**
   * 假设矩阵是仿射变换，设置旋转。
   *
   * @param {Matrix2} matrix 矩阵。
   * @param {Matrix2} rotation 旋转矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @see Matrix2.fromRotation
   * @see Matrix2.getRotation
   */
  static setRotation(matrix, rotation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix2.getScale(matrix, scaleScratch4);

    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.y;
    result[3] = rotation[3] * scale.y;

    return result;
  }

  /**
   * 假设矩阵是仿射变换，提取旋转矩阵。
   *
   * @param {Matrix2} matrix 矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @see Matrix2.setRotation
   * @see Matrix2.fromRotation
   */
  static getRotation(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix2.getScale(matrix, scaleScratch5);

    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.y;
    result[3] = matrix[3] / scale.y;

    return result;
  }

  /**
   * 计算两个矩阵的乘积。
   *
   * @param {Matrix2} left 第一个矩阵。
   * @param {Matrix2} right 第二个矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static multiply(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = left[0] * right[0] + left[2] * right[1];
    const column1Row0 = left[0] * right[2] + left[2] * right[3];
    const column0Row1 = left[1] * right[0] + left[3] * right[1];
    const column1Row1 = left[1] * right[2] + left[3] * right[3];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column1Row0;
    result[3] = column1Row1;
    return result;
  }

  /**
   * 计算两个矩阵的和。
   *
   * @param {Matrix2} left 第一个矩阵。
   * @param {Matrix2} right 第二个矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static add(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = left[0] + right[0];
    result[1] = left[1] + right[1];
    result[2] = left[2] + right[2];
    result[3] = left[3] + right[3];
    return result;
  }

  /**
   * 计算两个矩阵的差。
   *
   * @param {Matrix2} left 第一个矩阵。
   * @param {Matrix2} right 第二个矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static subtract(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = left[0] - right[0];
    result[1] = left[1] - right[1];
    result[2] = left[2] - right[2];
    result[3] = left[3] - right[3];
    return result;
  }

  /**
   * 计算矩阵和列向量的乘积。
   *
   * @param {Matrix2} matrix 矩阵。
   * @param {Cartesian2} cartesian 列向量。
   * @param {Cartesian2} result 用于存储结果的对象。
   * @returns {Cartesian2} 修改后的 result 参数。
   */
  static multiplyByVector(matrix, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const x = matrix[0] * cartesian.x + matrix[2] * cartesian.y;
    const y = matrix[1] * cartesian.x + matrix[3] * cartesian.y;

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * 计算矩阵和标量的乘积。
   *
   * @param {Matrix2} matrix 矩阵。
   * @param {number} scalar 要相乘的数字。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static multiplyByScalar(matrix, scalar, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scalar;
    result[1] = matrix[1] * scalar;
    result[2] = matrix[2] * scalar;
    result[3] = matrix[3] * scalar;
    return result;
  }

  /**
   * 计算矩阵与（非均匀）缩放的乘积，就像缩放是缩放矩阵一样。
   *
   * @param {Matrix2} matrix 左侧的矩阵。
   * @param {Cartesian2} scale 右侧的非均匀缩放。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   *
   * @example
   * // 代替 Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromScale(scale), m);
   * Cesium.Matrix2.multiplyByScale(m, scale, m);
   *
   * @see Matrix2.multiplyByUniformScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   * @see Matrix2.getScale
   */
  static multiplyByScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scale.x;
    result[1] = matrix[1] * scale.x;
    result[2] = matrix[2] * scale.y;
    result[3] = matrix[3] * scale.y;

    return result;
  }

  /**
   * 计算矩阵与均匀缩放的乘积，就像缩放是缩放矩阵一样。
   *
   * @param {Matrix2} matrix 左侧的矩阵。
   * @param {number} scale 右侧的均匀缩放。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   *
   * @example
   * // 代替 Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromUniformScale(scale), m);
   * Cesium.Matrix2.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix2.multiplyByScale
   * @see Matrix2.fromScale
   * @see Matrix2.fromUniformScale
   * @see Matrix2.setScale
   * @see Matrix2.setUniformScale
   * @see Matrix2.getScale
   */
  static multiplyByUniformScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scale;
    result[1] = matrix[1] * scale;
    result[2] = matrix[2] * scale;
    result[3] = matrix[3] * scale;

    return result;
  }

  /**
   * 创建所提供矩阵的负副本。
   *
   * @param {Matrix2} matrix 要取负的矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static negate(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = -matrix[0];
    result[1] = -matrix[1];
    result[2] = -matrix[2];
    result[3] = -matrix[3];
    return result;
  }

  /**
   * 计算所提供矩阵的转置。
   *
   * @param {Matrix2} matrix 要转置的矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static transpose(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = matrix[0];
    const column0Row1 = matrix[2];
    const column1Row0 = matrix[1];
    const column1Row1 = matrix[3];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column1Row0;
    result[3] = column1Row1;
    return result;
  }

  /**
   * 计算一个矩阵，其中包含所提供矩阵元素的绝对值（无符号）。
   *
   * @param {Matrix2} matrix 带有带符号元素的矩阵。
   * @param {Matrix2} result 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数。
   */
  static abs(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = Math.abs(matrix[0]);
    result[1] = Math.abs(matrix[1]);
    result[2] = Math.abs(matrix[2]);
    result[3] = Math.abs(matrix[3]);

    return result;
  }

  /**
   * 逐分量比较提供的矩阵，
   * 如果它们相等则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix2} [left] 第一个矩阵。
   * @param {Matrix2} [right] 第二个矩阵。
   * @returns {boolean} 如果 left 和 right 相等，则返回 <code>true</code>，否则返回 <code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[3] === right[3])
    );
  }

  /**
   * 从给定数组偏移量开始比较提供的矩阵和数组。
   *
   * @param {Matrix2} matrix 矩阵
   * @param {number[]} array 数组
   * @param {number} offset 偏移量
   * @private
   */
  static equalsArray(matrix, array, offset) {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3]
    );
  }

  /**
   * 逐分量比较提供的矩阵，
   * 如果它们在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix2} [left] 第一个矩阵。
   * @param {Matrix2} [right] 第二个矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果 left 和 right 在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left[0] - right[0]) <= epsilon &&
        Math.abs(left[1] - right[1]) <= epsilon &&
        Math.abs(left[2] - right[2]) <= epsilon &&
        Math.abs(left[3] - right[3]) <= epsilon)
    );
  }

  /**
   * 获取集合中的项目数量。
   *
   * @type {number}
   */
  get length() {
    return Matrix2.packedLength;
  }

  /**
   * 复制所提供的的 Matrix2 实例。
   *
   * @param {Matrix2} [result] 用于存储结果的对象。
   * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
   */
  clone(result) {
    return Matrix2.clone(this, result);
  }

  /**
   * 将此矩阵与提供的矩阵逐分量比较，
   * 如果它们相等则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix2} [right] 右侧的矩阵。
   * @returns {boolean} 如果它们相等，则返回 <code>true</code>，否则返回 <code>false</code>。
   */
  equals(right) {
    return Matrix2.equals(this, right);
  }

  /**
   * 将此矩阵与提供的矩阵逐分量比较，
   * 如果它们在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix2} [right] 右侧的矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果它们在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
   */
  equalsEpsilon(right, epsilon) {
    return Matrix2.equalsEpsilon(this, right, epsilon);
  }

  /**
   * 创建一个表示此矩阵的字符串，每行
   * 在单独的行上，格式为 '(column0, column1)'。
   *
   * @returns {string} 一个表示所提供矩阵的字符串，每行在单独的行上，格式为 '(column0, column1)'。
   */
  toString() {
    return `(${this[0]}, ${this[2]})\n` + `(${this[1]}, ${this[3]})`;
  }
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Matrix2.packedLength = 4;

/**
 * 从数组中的 4 个连续元素创建 Matrix2。
 *
 * @function
 * @param {number[]} array 数组，其中 4 个连续元素对应于矩阵的位置。假设按列主序排列。
 * @param {number} [startingIndex=0] 数组中第一个元素的偏移量，对应于矩阵中的第一列第一行位置。
 * @param {Matrix2} [result] 用于存储结果的对象。
 * @returns {Matrix2} 修改后的 result 参数，如果未提供，则为新的 Matrix2 实例。
 *
 * @example
 * // 创建 Matrix2：
 * // [1.0, 2.0]
 * // [1.0, 2.0]
 *
 * const v = [1.0, 1.0, 2.0, 2.0];
 * const m = Cesium.Matrix2.fromArray(v);
 *
 * // 使用数组偏移量创建相同的 Matrix2
 * const v2 = [0.0, 0.0, 1.0, 1.0, 2.0, 2.0];
 * const m2 = Cesium.Matrix2.fromArray(v2, 2);
 */
Matrix2.fromArray = Matrix2.unpack;

/**
 * 初始化为单位矩阵的不可变 Matrix2 实例。
 *
 * @type {Matrix2}
 * @constant
 */
Matrix2.IDENTITY = Object.freeze(new Matrix2(1.0, 0.0, 0.0, 1.0));

/**
 * 初始化为零矩阵的不可变 Matrix2 实例。
 *
 * @type {Matrix2}
 * @constant
 */
Matrix2.ZERO = Object.freeze(new Matrix2(0.0, 0.0, 0.0, 0.0));

/**
 * Matrix2 中第 0 列，第 0 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN0ROW0] = 5.0; // 设置第 0 列，第 0 行为 5.0
 */
Matrix2.COLUMN0ROW0 = 0;

/**
 * Matrix2 中第 0 列，第 1 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN0ROW1] = 5.0; // 设置第 0 列，第 1 行为 5.0
 */
Matrix2.COLUMN0ROW1 = 1;

/**
 * Matrix2 中第 1 列，第 0 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN1ROW0] = 5.0; // 设置第 1 列，第 0 行为 5.0
 */
Matrix2.COLUMN1ROW0 = 2;

/**
 * Matrix2 中第 1 列，第 1 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN1ROW1] = 5.0; // 设置第 1 列，第 1 行为 5.0
 */
Matrix2.COLUMN1ROW1 = 3;

const scaleScratch1 = new Cartesian2();
const scaleScratch2 = new Cartesian2();
const scratchColumn = new Cartesian2();
const scaleScratch3 = new Cartesian2();
const scaleScratch4 = new Cartesian2();
const scaleScratch5 = new Cartesian2();

export default Matrix2;
