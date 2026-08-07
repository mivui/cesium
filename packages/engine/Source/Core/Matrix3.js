// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/** @import Quaternion from "./Quaternion.js"; */
/** @import HeadingPitchRoll from "./HeadingPitchRoll.js"; */

/**
 * @typedef {object} EigenDecompositionResult
 * @property {Matrix3} [unitary] 酉矩阵
 * @property {Matrix3} [diagonal] 对角矩阵
 */

/**
 * 3x3 矩阵，可按列主序数组进行索引。
 * 构造函数参数采用行主序以便于代码阅读。
 *
 * @implements {ArrayLike<number>}
 *
 * @see Matrix3.fromArray
 * @see Matrix3.fromColumnMajorArray
 * @see Matrix3.fromRowMajorArray
 * @see Matrix3.fromQuaternion
 * @see Matrix3.fromHeadingPitchRoll
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.fromCrossProduct
 * @see Matrix3.fromRotationX
 * @see Matrix3.fromRotationY
 * @see Matrix3.fromRotationZ
 * @see Matrix2
 * @see Matrix4
 */
// @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
class Matrix3 {
  /**
   * @param {number} [column0Row0=0.0] 第 0 列第 0 行的值。
   * @param {number} [column1Row0=0.0] 第 1 列第 0 行的值。
   * @param {number} [column2Row0=0.0] 第 2 列第 0 行的值。
   * @param {number} [column0Row1=0.0] 第 0 列第 1 行的值。
   * @param {number} [column1Row1=0.0] 第 1 列第 1 行的值。
   * @param {number} [column2Row1=0.0] 第 2 列第 1 行的值。
   * @param {number} [column0Row2=0.0] 第 0 列第 2 行的值。
   * @param {number} [column1Row2=0.0] 第 1 列第 2 行的值。
   * @param {number} [column2Row2=0.0] 第 2 列第 2 行的值。
   */
  constructor(
    column0Row0,
    column1Row0,
    column2Row0,
    column0Row1,
    column1Row1,
    column2Row1,
    column0Row2,
    column1Row2,
    column2Row2,
  ) {
    this[0] = column0Row0 ?? 0.0;
    this[1] = column0Row1 ?? 0.0;
    this[2] = column0Row2 ?? 0.0;
    this[3] = column1Row0 ?? 0.0;
    this[4] = column1Row1 ?? 0.0;
    this[5] = column1Row2 ?? 0.0;
    this[6] = column2Row0 ?? 0.0;
    this[7] = column2Row1 ?? 0.0;
    this[8] = column2Row2 ?? 0.0;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Matrix3} value 要打包的值。
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
    array[startingIndex++] = value[4];
    array[startingIndex++] = value[5];
    array[startingIndex++] = value[6];
    array[startingIndex++] = value[7];
    array[startingIndex] = value[8];

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包的数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Matrix3} [result] 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Matrix3();
    }

    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    result[4] = array[startingIndex++];
    result[5] = array[startingIndex++];
    result[6] = array[startingIndex++];
    result[7] = array[startingIndex++];
    result[8] = array[startingIndex];
    return result;
  }

  /**
   * 将 Matrix3 数组展平为组件数组。组件
   * 按列主序存储。
   *
   * @param {Matrix3[]} array 要打包的矩阵数组。
   * @param {number[]} [result] 用于存储结果的数组。如果是类型化数组，则必须有 array.length * 9 个组件，否则会抛出 {@link DeveloperError}。如果是普通数组，则会被调整为 (array.length * 9) 个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 9;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): Requires conditional TypedArray types.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "如果 result 是类型化数组，则必须恰好有 array.length * 9 个元素",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Matrix3.pack(array[i], result, i * 9);
    }

    return result;
  }

  /**
   * 将列主序矩阵组件数组解包为 Matrix3 数组。
   *
   * @param {number[]} array 要解包的组件数组。
   * @param {Matrix3[]} [result] 用于存储结果的数组。
   * @returns {Matrix3[]} 解包后的数组。
   */
  static unpackArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 9);
    if (array.length % 9 !== 0) {
      throw new DeveloperError("数组长度必须是 9 的倍数。");
    }
    //>>includeEnd('debug');

    const length = array.length;
    if (!defined(result)) {
      result = new Array(length / 9);
    } else {
      result.length = length / 9;
    }

    for (let i = 0; i < length; i += 9) {
      const index = i / 9;
      result[index] = Matrix3.unpack(array, i, result[index]);
    }
    return result;
  }

  /**
   * 复制 Matrix3 实例。
   *
   * @param {Matrix3} matrix 要复制的矩阵。
   * @param {Matrix3} [result] 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。（如果 matrix 为 undefined 则返回 undefined）
   */
  static clone(matrix, result) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix3(
        matrix[0],
        matrix[3],
        matrix[6],
        matrix[1],
        matrix[4],
        matrix[7],
        matrix[2],
        matrix[5],
        matrix[8],
      );
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    return result;
  }

  /**
   * 从列主序数组创建 Matrix3 实例。
   *
   * @param {number[]} values 列主序数组。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   */
  static fromColumnMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    return Matrix3.clone(values, result);
  }

  /**
   * 从行主序数组创建 Matrix3 实例。
   * 结果矩阵将按列主序存储。
   *
   * @param {number[]} values 行主序数组。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   */
  static fromRowMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix3(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
      );
    }
    result[0] = values[0];
    result[1] = values[3];
    result[2] = values[6];
    result[3] = values[1];
    result[4] = values[4];
    result[5] = values[7];
    result[6] = values[2];
    result[7] = values[5];
    result[8] = values[8];
    return result;
  }

  /**
   * 从提供的四元数计算 3x3 旋转矩阵。
   *
   * @param {Quaternion} quaternion 要使用的四元数。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 此四元数对应的 3x3 旋转矩阵。
   */
  static fromQuaternion(quaternion, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("quaternion", quaternion);
    //>>includeEnd('debug');

    const x2 = quaternion.x * quaternion.x;
    const xy = quaternion.x * quaternion.y;
    const xz = quaternion.x * quaternion.z;
    const xw = quaternion.x * quaternion.w;
    const y2 = quaternion.y * quaternion.y;
    const yz = quaternion.y * quaternion.z;
    const yw = quaternion.y * quaternion.w;
    const z2 = quaternion.z * quaternion.z;
    const zw = quaternion.z * quaternion.w;
    const w2 = quaternion.w * quaternion.w;

    const m00 = x2 - y2 - z2 + w2;
    const m01 = 2.0 * (xy - zw);
    const m02 = 2.0 * (xz + yw);

    const m10 = 2.0 * (xy + zw);
    const m11 = -x2 + y2 - z2 + w2;
    const m12 = 2.0 * (yz - xw);

    const m20 = 2.0 * (xz - yw);
    const m21 = 2.0 * (yz + xw);
    const m22 = -x2 - y2 + z2 + w2;

    if (!defined(result)) {
      return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    result[0] = m00;
    result[1] = m10;
    result[2] = m20;
    result[3] = m01;
    result[4] = m11;
    result[5] = m21;
    result[6] = m02;
    result[7] = m12;
    result[8] = m22;
    return result;
  }

  /**
   * 从提供的 headingPitchRoll 计算 3x3 旋转矩阵。（参见 http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles ）
   *
   * @param {HeadingPitchRoll} headingPitchRoll 要使用的 headingPitchRoll。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 此 headingPitchRoll 对应的 3x3 旋转矩阵。
   */
  static fromHeadingPitchRoll(headingPitchRoll, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("headingPitchRoll", headingPitchRoll);
    //>>includeEnd('debug');

    const cosTheta = Math.cos(-headingPitchRoll.pitch);
    const cosPsi = Math.cos(-headingPitchRoll.heading);
    const cosPhi = Math.cos(headingPitchRoll.roll);
    const sinTheta = Math.sin(-headingPitchRoll.pitch);
    const sinPsi = Math.sin(-headingPitchRoll.heading);
    const sinPhi = Math.sin(headingPitchRoll.roll);

    const m00 = cosTheta * cosPsi;
    const m01 = -cosPhi * sinPsi + sinPhi * sinTheta * cosPsi;
    const m02 = sinPhi * sinPsi + cosPhi * sinTheta * cosPsi;

    const m10 = cosTheta * sinPsi;
    const m11 = cosPhi * cosPsi + sinPhi * sinTheta * sinPsi;
    const m12 = -sinPhi * cosPsi + cosPhi * sinTheta * sinPsi;

    const m20 = -sinTheta;
    const m21 = sinPhi * cosTheta;
    const m22 = cosPhi * cosTheta;

    if (!defined(result)) {
      return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    result[0] = m00;
    result[1] = m10;
    result[2] = m20;
    result[3] = m01;
    result[4] = m11;
    result[5] = m21;
    result[6] = m02;
    result[7] = m12;
    result[8] = m22;
    return result;
  }

  /**
   * 计算表示非均匀缩放的 Matrix3 实例。
   *
   * @param {Cartesian3} scale x、y 和 z 缩放因子。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 创建
   * //   [7.0, 0.0, 0.0]
   * //   [0.0, 8.0, 0.0]
   * //   [0.0, 0.0, 9.0]
   * const m = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix3(
        scale.x,
        0.0,
        0.0,
        0.0,
        scale.y,
        0.0,
        0.0,
        0.0,
        scale.z,
      );
    }

    result[0] = scale.x;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = scale.y;
    result[5] = 0.0;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = scale.z;
    return result;
  }

  /**
   * 计算表示均匀缩放的 Matrix3 实例。
   *
   * @param {number} scale 均匀缩放因子。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 创建
   * //   [2.0, 0.0, 0.0]
   * //   [0.0, 2.0, 0.0]
   * //   [0.0, 0.0, 2.0]
   * const m = Cesium.Matrix3.fromUniformScale(2.0);
   */
  static fromUniformScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix3(scale, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, scale);
    }

    result[0] = scale;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = scale;
    result[5] = 0.0;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = scale;
    return result;
  }

  /**
   * 计算表示 Cartesian3 向量叉积等效矩阵的 Matrix3 实例。
   *
   * @param {Cartesian3} vector 叉积运算左侧的向量。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 创建
   * //   [0.0, -9.0,  8.0]
   * //   [9.0,  0.0, -7.0]
   * //   [-8.0, 7.0,  0.0]
   * const m = Cesium.Matrix3.fromCrossProduct(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromCrossProduct(vector, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("vector", vector);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix3(
        0.0,
        -vector.z,
        vector.y,
        vector.z,
        0.0,
        -vector.x,
        -vector.y,
        vector.x,
        0.0,
      );
    }

    result[0] = 0.0;
    result[1] = vector.z;
    result[2] = -vector.y;
    result[3] = -vector.z;
    result[4] = 0.0;
    result[5] = vector.x;
    result[6] = vector.y;
    result[7] = -vector.x;
    result[8] = 0.0;
    return result;
  }

  /**
   * 创建绕 x 轴的旋转矩阵。
   *
   * @param {number} angle 旋转角度（弧度）。正角度为逆时针方向。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 将点绕 x 轴逆时针旋转 45 度。
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationX(angle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("angle", angle);
    //>>includeEnd('debug');

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    if (!defined(result)) {
      return new Matrix3(
        1.0,
        0.0,
        0.0,
        0.0,
        cosAngle,
        -sinAngle,
        0.0,
        sinAngle,
        cosAngle,
      );
    }

    result[0] = 1.0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = cosAngle;
    result[5] = sinAngle;
    result[6] = 0.0;
    result[7] = -sinAngle;
    result[8] = cosAngle;

    return result;
  }

  /**
   * 创建绕 y 轴的旋转矩阵。
   *
   * @param {number} angle 旋转角度（弧度）。正角度为逆时针方向。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 将点绕 y 轴逆时针旋转 45 度。
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationY(angle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("angle", angle);
    //>>includeEnd('debug');

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    if (!defined(result)) {
      return new Matrix3(
        cosAngle,
        0.0,
        sinAngle,
        0.0,
        1.0,
        0.0,
        -sinAngle,
        0.0,
        cosAngle,
      );
    }

    result[0] = cosAngle;
    result[1] = 0.0;
    result[2] = -sinAngle;
    result[3] = 0.0;
    result[4] = 1.0;
    result[5] = 0.0;
    result[6] = sinAngle;
    result[7] = 0.0;
    result[8] = cosAngle;

    return result;
  }

  /**
   * 创建绕 z 轴的旋转矩阵。
   *
   * @param {number} angle 旋转角度（弧度）。正角度为逆时针方向。
   * @param {Matrix3} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   *
   * @example
   * // 将点绕 z 轴逆时针旋转 45 度。
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationZ(angle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("angle", angle);
    //>>includeEnd('debug');

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    if (!defined(result)) {
      return new Matrix3(
        cosAngle,
        -sinAngle,
        0.0,
        sinAngle,
        cosAngle,
        0.0,
        0.0,
        0.0,
        1.0,
      );
    }

    result[0] = cosAngle;
    result[1] = sinAngle;
    result[2] = 0.0;
    result[3] = -sinAngle;
    result[4] = cosAngle;
    result[5] = 0.0;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 1.0;

    return result;
  }

  /**
   * 从提供的 Matrix3 实例创建数组。
   * 数组将按列主序排列。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number[]} [result] 用于存储结果的数组。
   * @returns {number[]} 修改后的数组参数，如果未提供则返回新数组实例。
   */
  static toArray(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return [
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8],
      ];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    return result;
  }

  /**
   * 计算提供的行和列处的数组索引。
   *
   * @param {number} column 列的从零开始索引。
   * @param {number} row 行的从零开始索引。
   * @returns {number} 提供的行和列处的元素索引。
   *
   * @exception {DeveloperError} row 必须为 0、1 或 2。
   * @exception {DeveloperError} column 必须为 0、1 或 2。
   *
   * @example
   * const myMatrix = new Cesium.Matrix3();
   * const column1Row0Index = Cesium.Matrix3.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index]
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column, row) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check.typeOf.number.lessThanOrEquals("row", row, 2);
    Check.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check.typeOf.number.lessThanOrEquals("column", column, 2);
    //>>includeEnd('debug');

    return column * 3 + row;
  }

  /**
   * 以 Cartesian3 实例的形式检索提供的列的矩阵副本。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number} index 要检索的列的从零开始索引。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1 或 2。
   */
  static getColumn(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 2);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const startIndex = index * 3;

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[startIndex];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[startIndex + 1];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const z = matrix[startIndex + 2];

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 计算新矩阵，将提供矩阵中的指定列替换为提供的 Cartesian3 实例。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number} index 要设置的列的从零开始索引。
   * @param {Cartesian3} cartesian 其值将分配给指定列的 Cartesian。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1 或 2。
   */
  static setColumn(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 2);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix3.clone(matrix, result);
    const startIndex = index * 3;

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 1] = cartesian.y;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 2] = cartesian.z;

    return result;
  }

  /**
   * 以 Cartesian3 实例的形式检索提供的行的矩阵副本。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number} index 要检索的行的从零开始索引。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1 或 2。
   */
  static getRow(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 2);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[index];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[index + 3];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const z = matrix[index + 6];

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 计算新矩阵，将提供矩阵中的指定行替换为提供的 Cartesian3 实例。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number} index 要设置的行的从零开始索引。
   * @param {Cartesian3} cartesian 其值将分配给指定行的 Cartesian。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1 或 2。
   */
  static setRow(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 2);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix3.clone(matrix, result);

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 3] = cartesian.y;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 6] = cartesian.z;

    return result;
  }

  /**
   * 计算新矩阵，用提供的缩放替换缩放。
   * 此方法假设矩阵为仿射变换。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {Cartesian3} scale 替换提供矩阵缩放的缩放。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @see Matrix3.setUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.getScale
   */
  static setScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix3.getScale(matrix, scaleScratch1);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;
    const scaleRatioZ = scale.z / existingScale.z;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3] * scaleRatioY;
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioZ;
    result[7] = matrix[7] * scaleRatioZ;
    result[8] = matrix[8] * scaleRatioZ;

    return result;
  }

  /**
   * 计算新矩阵，用提供的均匀缩放替换缩放。
   * 此方法假设矩阵为仿射变换。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @param {number} scale 替换提供矩阵缩放的均匀缩放。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @see Matrix3.setScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.getScale
   */
  static setUniformScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix3.getScale(matrix, scaleScratch2);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;
    const scaleRatioZ = scale / existingScale.z;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3] * scaleRatioY;
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioZ;
    result[7] = matrix[7] * scaleRatioZ;
    result[8] = matrix[8] * scaleRatioZ;

    return result;
  }

  /**
   * 提取非均匀缩放，假设矩阵为仿射变换。
   *
   * @param {Matrix3} matrix 矩阵。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   *
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   */
  static getScale(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Cartesian3.magnitude(
      Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn),
    );
    result.y = Cartesian3.magnitude(
      Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn),
    );
    result.z = Cartesian3.magnitude(
      Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn),
    );
    return result;
  }

  /**
   * 计算最大缩放，假设矩阵为仿射变换。
   * 最大缩放是列向量的最大长度。
   *
   * @param {Matrix3} matrix 矩阵。
   * @returns {number} 最大缩放。
   */
  static getMaximumScale(matrix) {
    Matrix3.getScale(matrix, scaleScratch3);
    return Cartesian3.maximumComponent(scaleScratch3);
  }

  /**
   * 设置旋转，假设矩阵为仿射变换。
   *
   * @param {Matrix3} matrix 矩阵。
   * @param {Matrix3} rotation 旋转矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @see Matrix3.getRotation
   */
  static setRotation(matrix, rotation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix3.getScale(matrix, scaleScratch4);

    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.x;
    result[3] = rotation[3] * scale.y;
    result[4] = rotation[4] * scale.y;
    result[5] = rotation[5] * scale.y;
    result[6] = rotation[6] * scale.z;
    result[7] = rotation[7] * scale.z;
    result[8] = rotation[8] * scale.z;

    return result;
  }

  /**
   * 提取旋转矩阵，假设矩阵为仿射变换。
   *
   * @param {Matrix3} matrix 矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @see Matrix3.setRotation
   */
  static getRotation(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix3.getScale(matrix, scaleScratch5);

    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.x;
    result[3] = matrix[3] / scale.y;
    result[4] = matrix[4] / scale.y;
    result[5] = matrix[5] / scale.y;
    result[6] = matrix[6] / scale.z;
    result[7] = matrix[7] / scale.z;
    result[8] = matrix[8] / scale.z;

    return result;
  }

  /**
   * 计算两个矩阵的乘积。
   *
   * @param {Matrix3} left 第一个矩阵。
   * @param {Matrix3} right 第二个矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   */
  static multiply(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 =
      left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
    const column0Row1 =
      left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
    const column0Row2 =
      left[2] * right[0] + left[5] * right[1] + left[8] * right[2];

    const column1Row0 =
      left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
    const column1Row1 =
      left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
    const column1Row2 =
      left[2] * right[3] + left[5] * right[4] + left[8] * right[5];

    const column2Row0 =
      left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
    const column2Row1 =
      left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
    const column2Row2 =
      left[2] * right[6] + left[5] * right[7] + left[8] * right[8];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column1Row0;
    result[4] = column1Row1;
    result[5] = column1Row2;
    result[6] = column2Row0;
    result[7] = column2Row1;
    result[8] = column2Row2;
    return result;
  }

  /**
   * 计算两个矩阵的和。
   *
   * @param {Matrix3} left 第一个矩阵。
   * @param {Matrix3} right 第二个矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
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
    result[4] = left[4] + right[4];
    result[5] = left[5] + right[5];
    result[6] = left[6] + right[6];
    result[7] = left[7] + right[7];
    result[8] = left[8] + right[8];
    return result;
  }

  /**
   * 计算两个矩阵的差。
   *
   * @param {Matrix3} left 第一个矩阵。
   * @param {Matrix3} right 第二个矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
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
    result[4] = left[4] - right[4];
    result[5] = left[5] - right[5];
    result[6] = left[6] - right[6];
    result[7] = left[7] - right[7];
    result[8] = left[8] - right[8];
    return result;
  }

  /**
   * 计算矩阵与列向量的乘积。
   *
   * @param {Matrix3} matrix 矩阵。
   * @param {Cartesian3} cartesian 列向量。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static multiplyByVector(matrix, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;

    const x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
    const y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
    const z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 计算矩阵与标量的乘积。
   *
   * @param {Matrix3} matrix 矩阵。
   * @param {number} scalar 要乘的数。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
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
    result[4] = matrix[4] * scalar;
    result[5] = matrix[5] * scalar;
    result[6] = matrix[6] * scalar;
    result[7] = matrix[7] * scalar;
    result[8] = matrix[8] * scalar;
    return result;
  }

  /**
   * 计算矩阵与（非均匀）缩放的乘积，如同缩放是一个缩放矩阵。
   *
   * @param {Matrix3} matrix 左侧的矩阵。
   * @param {Cartesian3} scale 右侧的非均匀缩放。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   *
   * @example
   * // 替代 Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromScale(scale), m);
   * Cesium.Matrix3.multiplyByScale(m, scale, m);
   *
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   * @see Matrix3.getScale
   */
  static multiplyByScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0] * scale.x;
    result[1] = matrix[1] * scale.x;
    result[2] = matrix[2] * scale.x;
    result[3] = matrix[3] * scale.y;
    result[4] = matrix[4] * scale.y;
    result[5] = matrix[5] * scale.y;
    result[6] = matrix[6] * scale.z;
    result[7] = matrix[7] * scale.z;
    result[8] = matrix[8] * scale.z;

    return result;
  }

  /**
   * 计算矩阵与均匀缩放的乘积，如同缩放是一个缩放矩阵。
   *
   * @param {Matrix3} matrix 左侧的矩阵。
   * @param {number} scale 右侧的均匀缩放。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @example
   * // 替代 Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromUniformScale(scale), m);
   * Cesium.Matrix3.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix3.multiplyByScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   * @see Matrix3.getScale
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
    result[4] = matrix[4] * scale;
    result[5] = matrix[5] * scale;
    result[6] = matrix[6] * scale;
    result[7] = matrix[7] * scale;
    result[8] = matrix[8] * scale;

    return result;
  }

  /**
   * 创建提供矩阵的取反副本。
   *
   * @param {Matrix3} matrix 要取反的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
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
    result[4] = -matrix[4];
    result[5] = -matrix[5];
    result[6] = -matrix[6];
    result[7] = -matrix[7];
    result[8] = -matrix[8];
    return result;
  }

  /**
   * 计算提供矩阵的转置。
   *
   * @param {Matrix3} matrix 要转置的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   */
  static transpose(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = matrix[0];
    const column0Row1 = matrix[3];
    const column0Row2 = matrix[6];
    const column1Row0 = matrix[1];
    const column1Row1 = matrix[4];
    const column1Row2 = matrix[7];
    const column2Row0 = matrix[2];
    const column2Row1 = matrix[5];
    const column2Row2 = matrix[8];

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column1Row0;
    result[4] = column1Row1;
    result[5] = column1Row2;
    result[6] = column2Row0;
    result[7] = column2Row1;
    result[8] = column2Row2;
    return result;
  }

  /**
   * 计算对称矩阵的特征向量和特征值。
   * <p>
   * 返回对角矩阵和酉矩阵，使得：
   * <code>matrix = 酉矩阵 * 对角矩阵 * transpose(酉矩阵)</code>
   * </p>
   * <p>
   * 对角矩阵对角线上的值是特征值。酉矩阵的列是对应的特征向量。
   * </p>
   *
   * @param {Matrix3} matrix 要分解为对角矩阵和酉矩阵的矩阵。期望是对称矩阵。
   * @param {EigenDecompositionResult} [result] 具有 unitary 和 diagonal 属性的对象，分别是用于存储结果的矩阵。
   * @returns {EigenDecompositionResult} 具有 unitary 和 diagonal 属性的对象，分别是酉矩阵和对角矩阵。
   *
   * @example
   * const a = //... 对称矩阵
   * const result = {
   *     unitary : new Cesium.Matrix3(),
   *     diagonal : new Cesium.Matrix3()
   * };
   * Cesium.Matrix3.computeEigenDecomposition(a, result);
   *
   * const unitaryTranspose = Cesium.Matrix3.transpose(result.unitary, new Cesium.Matrix3());
   * const b = Cesium.Matrix3.multiply(result.unitary, result.diagonal, new Cesium.Matrix3());
   * Cesium.Matrix3.multiply(b, unitaryTranspose, b); // b 现在等于 a
   *
   * const lambda = Cesium.Matrix3.getColumn(result.diagonal, 0, new Cesium.Cartesian3()).x;  // 第一个特征值
   * const v = Cesium.Matrix3.getColumn(result.unitary, 0, new Cesium.Cartesian3());          // 第一个特征向量
   * const c = Cesium.Cartesian3.multiplyByScalar(v, lambda, new Cesium.Cartesian3());        // 等于 Cesium.Matrix3.multiplyByVector(a, v)
   */
  static computeEigenDecomposition(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    //>>includeEnd('debug');

    // 此例程基于 Golub 和 Van Loan 的《矩阵计算》第 3 版，
    // 第 8.4.3 节 经典雅可比算法（The Classical Jacobi Algorithm）

    const tolerance = CesiumMath.EPSILON20;
    const maxSweeps = 10;

    let count = 0;
    let sweep = 0;

    if (!defined(result)) {
      result = {};
    }

    const unitaryMatrix = (result.unitary = Matrix3.clone(
      Matrix3.IDENTITY,
      result.unitary,
    ));
    const diagMatrix = (result.diagonal = Matrix3.clone(
      matrix,
      result.diagonal,
    ));

    const epsilon = tolerance * computeFrobeniusNorm(diagMatrix);

    while (
      sweep < maxSweeps &&
      offDiagonalFrobeniusNorm(diagMatrix) > epsilon
    ) {
      shurDecomposition(diagMatrix, jMatrix);
      Matrix3.transpose(jMatrix, jMatrixTranspose);
      Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
      Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
      Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);

      if (++count > 2) {
        ++sweep;
        count = 0;
      }
    }

    return result;
  }

  /**
   * 计算一个矩阵，其中包含提供矩阵元素的绝对（无符号）值。
   *
   * @param {Matrix3} matrix 带有带符号元素的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
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
    result[4] = Math.abs(matrix[4]);
    result[5] = Math.abs(matrix[5]);
    result[6] = Math.abs(matrix[6]);
    result[7] = Math.abs(matrix[7]);
    result[8] = Math.abs(matrix[8]);

    return result;
  }

  /**
   * 计算提供矩阵的行列式。
   *
   * @param {Matrix3} matrix 要使用的矩阵。
   * @returns {number} 矩阵行列式的值。
   */
  static determinant(matrix) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    //>>includeEnd('debug');

    const m11 = matrix[0];
    const m21 = matrix[3];
    const m31 = matrix[6];
    const m12 = matrix[1];
    const m22 = matrix[4];
    const m32 = matrix[7];
    const m13 = matrix[2];
    const m23 = matrix[5];
    const m33 = matrix[8];

    return (
      m11 * (m22 * m33 - m23 * m32) +
      m12 * (m23 * m31 - m21 * m33) +
      m13 * (m21 * m32 - m22 * m31)
    );
  }

  /**
   * 计算提供矩阵的逆矩阵。
   *
   * @param {Matrix3} matrix 要求逆的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @exception {DeveloperError} 矩阵不可逆。
   */
  static inverse(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const m11 = matrix[0];
    const m21 = matrix[1];
    const m31 = matrix[2];
    const m12 = matrix[3];
    const m22 = matrix[4];
    const m32 = matrix[5];
    const m13 = matrix[6];
    const m23 = matrix[7];
    const m33 = matrix[8];

    const determinant = Matrix3.determinant(matrix);

    //>>includeStart('debug', pragmas.debug);
    if (Math.abs(determinant) <= CesiumMath.EPSILON15) {
      throw new DeveloperError("矩阵不可逆");
    }
    //>>includeEnd('debug');

    result[0] = m22 * m33 - m23 * m32;
    result[1] = m23 * m31 - m21 * m33;
    result[2] = m21 * m32 - m22 * m31;
    result[3] = m13 * m32 - m12 * m33;
    result[4] = m11 * m33 - m13 * m31;
    result[5] = m12 * m31 - m11 * m32;
    result[6] = m12 * m23 - m13 * m22;
    result[7] = m13 * m21 - m11 * m23;
    result[8] = m11 * m22 - m12 * m21;

    const scale = 1.0 / determinant;
    return Matrix3.multiplyByScalar(result, scale, result);
  }

  /**
   * 计算矩阵的逆矩阵的转置。
   *
   * @param {Matrix3} matrix 要转置并求逆的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   */
  static inverseTranspose(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    return Matrix3.inverse(
      Matrix3.transpose(matrix, scratchTransposeMatrix),
      result,
    );
  }

  /**
   * 逐分量比较提供的矩阵，如果相等则返回
   * <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix3} [left] 第一个矩阵。
   * @param {Matrix3} [right] 第二个矩阵。
   * @returns {boolean} 如果 left 和 right 相等则为 <code>true</code>，否则为 <code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[3] === right[3] &&
        left[4] === right[4] &&
        left[5] === right[5] &&
        left[6] === right[6] &&
        left[7] === right[7] &&
        left[8] === right[8])
    );
  }

  /**
   * 逐分量比较提供的矩阵，如果它们在提供的 epsilon 范围内则返回
   * <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix3} [left] 第一个矩阵。
   * @param {Matrix3} [right] 第二个矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果 left 和 right 在提供的 epsilon 范围内则为 <code>true</code>，否则为 <code>false</code>。
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
        Math.abs(left[3] - right[3]) <= epsilon &&
        Math.abs(left[4] - right[4]) <= epsilon &&
        Math.abs(left[5] - right[5]) <= epsilon &&
        Math.abs(left[6] - right[6]) <= epsilon &&
        Math.abs(left[7] - right[7]) <= epsilon &&
        Math.abs(left[8] - right[8]) <= epsilon)
    );
  }

  /**
   * 获取集合中的项目数量。
   *
   * @type {number}
   */
  get length() {
    return Matrix3.packedLength;
  }

  /**
   * 复制提供的 Matrix3 实例。
   *
   * @param {Matrix3} [result] 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
   */
  clone(result) {
    return Matrix3.clone(this, result);
  }

  /**
   * 逐分量比较此矩阵与提供的矩阵，如果
   * 相等则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix3} [right] 右侧矩阵。
   * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
   */
  equals(right) {
    return Matrix3.equals(this, right);
  }

  /**
   * 比较提供的矩阵和数组，从给定的数组偏移量开始。
   *
   * @param {Matrix3} matrix
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(matrix, array, offset) {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3] &&
      matrix[4] === array[offset + 4] &&
      matrix[5] === array[offset + 5] &&
      matrix[6] === array[offset + 6] &&
      matrix[7] === array[offset + 7] &&
      matrix[8] === array[offset + 8]
    );
  }

  /**
   * 逐分量比较此矩阵与提供的矩阵，如果
   * 它们在提供的 epsilon 范围内则返回 <code>true</code>，
   * 否则返回 <code>false</code>。
   *
   * @param {Matrix3} [right] 右侧矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果它们在提供的 epsilon 范围内则为 <code>true</code>，否则为 <code>false</code>。
   */
  equalsEpsilon(right, epsilon) {
    return Matrix3.equalsEpsilon(this, right, epsilon);
  }

  /**
   * 创建表示此矩阵的字符串，每行位于
   * 单独的一行，格式为 '(column0, column1, column2)'。
   *
   * @returns {string} 表示此矩阵的字符串，每行位于单独的一行，格式为 '(column0, column1, column2)'。
   */
  toString() {
    return (
      `(${this[0]}, ${this[3]}, ${this[6]})\n` +
      `(${this[1]}, ${this[4]}, ${this[7]})\n` +
      `(${this[2]}, ${this[5]}, ${this[8]})`
    );
  }
}

/**
 * 将对象打包到数组中时使用的元素数量。
 * @type {number}
 */
Matrix3.packedLength = 9;

/**
 * 从数组中 9 个连续元素创建 Matrix3。
 *
 * @function
 * @param {number[]} array 数组，其 9 个连续元素对应矩阵的位置。假设为列主序。
 * @param {number} [startingIndex=0] 数组中第一个元素的偏移量，对应矩阵的第一列第一行位置。
 * @param {Matrix3} [result] 用于存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数，如果未提供则返回新的 Matrix3 实例。
 *
 * @example
 * // 创建 Matrix3:
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 *
 * const v = [1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m = Cesium.Matrix3.fromArray(v);
 *
 * // 使用数组中的偏移量创建相同的 Matrix3
 * const v2 = [0.0, 0.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m2 = Cesium.Matrix3.fromArray(v2, 2);
 */
Matrix3.fromArray = Matrix3.unpack;

/**
 * 初始化为单位矩阵的不可变 Matrix3 实例。
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0),
);

/**
 * 初始化为零矩阵的不可变 Matrix3 实例。
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.ZERO = Object.freeze(
  new Matrix3(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
);

/**
 * Matrix3 中第 0 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW0 = 0;

/**
 * Matrix3 中第 0 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW1 = 1;

/**
 * Matrix3 中第 0 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW2 = 2;

/**
 * Matrix3 中第 1 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW0 = 3;

/**
 * Matrix3 中第 1 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW1 = 4;

/**
 * Matrix3 中第 1 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW2 = 5;

/**
 * Matrix3 中第 2 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW0 = 6;

/**
 * Matrix3 中第 2 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW1 = 7;

/**
 * Matrix3 中第 2 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW2 = 8;

const scaleScratch1 = new Cartesian3();
const scaleScratch2 = new Cartesian3();
const scratchColumn = new Cartesian3();
const scaleScratch3 = new Cartesian3();
const scaleScratch4 = new Cartesian3();
const scaleScratch5 = new Cartesian3();

const jMatrix = new Matrix3();
const jMatrixTranspose = new Matrix3();
const scratchTransposeMatrix = new Matrix3();

/**
 * @param {Matrix3} matrix
 * @ignore
 */
function computeFrobeniusNorm(matrix) {
  let norm = 0.0;
  for (let i = 0; i < 9; ++i) {
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

const rowVal = [1, 0, 0];
const colVal = [2, 2, 1];

/**
 * @param {Matrix3} matrix
 * @ignore
 */
function offDiagonalFrobeniusNorm(matrix) {
  // 计算"非对角线"弗罗贝尼乌斯范数。
  // 假设矩阵是对称的。

  let norm = 0.0;
  for (let i = 0; i < 3; ++i) {
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}

/**
 * 此例程基于 Golub 和 Van Loan 的《矩阵计算》第 3 版，
 * 第 8.4.2 节 2x2 对称舒尔分解（The 2by2 Symmetric Schur Decomposition）。
 *
 * 该例程接受一个假设为对称的矩阵，
 * 找到最大的非对角线项，然后创建
 * 一个可用于帮助缩减它的矩阵（result）
 *
 * @param {Matrix3} matrix
 * @param {Matrix3} result
 * @ignore
 */
function shurDecomposition(matrix, result) {
  const tolerance = CesiumMath.EPSILON15;

  let maxDiagonal = 0.0;
  let rotAxis = 1;

  // 基于矩阵的最大对角线查找主元（rotAxis）
  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(
      // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
      matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])],
    );
    if (temp > maxDiagonal) {
      rotAxis = i;
      maxDiagonal = temp;
    }
  }

  let c = 1.0;
  let s = 0.0;

  const p = rowVal[rotAxis];
  const q = colVal[rotAxis];

  // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
  if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const qq = matrix[Matrix3.getElementIndex(q, q)];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const pp = matrix[Matrix3.getElementIndex(p, p)];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const qp = matrix[Matrix3.getElementIndex(q, p)];

    const tau = (qq - pp) / 2.0 / qp;
    let t;

    if (tau < 0.0) {
      t = -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
    } else {
      t = 1.0 / (tau + Math.sqrt(1.0 + tau * tau));
    }

    c = 1.0 / Math.sqrt(1.0 + t * t);
    s = t * c;
  }

  result = Matrix3.clone(Matrix3.IDENTITY, result);

  // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
  result[Matrix3.getElementIndex(p, p)] = result[
    Matrix3.getElementIndex(q, q)
  ] = c;
  // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
  result[Matrix3.getElementIndex(q, p)] = s;
  // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
  result[Matrix3.getElementIndex(p, q)] = -s;

  return result;
}

export default Matrix3;
