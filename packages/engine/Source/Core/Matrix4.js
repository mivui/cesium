// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import RuntimeError from "./RuntimeError.js";

/** @import Quaternion from "./Quaternion.js"; */
/** @import TranslationRotationScale from "./TranslationRotationScale.js"; */
/** @import Camera from "../Scene/Camera.js"; */

/**
 * @typedef {object} Viewport
 * @property {number} [x] x 坐标
 * @property {number} [y] y 坐标
 * @property {number} [width] 宽度
 * @property {number} [height] 高度
 */

/**
 * 4x4 矩阵，可按列主序数组进行索引。
 * 构造函数参数采用行主序以便于代码阅读。
 *
 * @implements {ArrayLike<number>}
 *
 * @see Matrix4.fromArray
 * @see Matrix4.fromColumnMajorArray
 * @see Matrix4.fromRowMajorArray
 * @see Matrix4.fromRotationTranslation
 * @see Matrix4.fromTranslationQuaternionRotationScale
 * @see Matrix4.fromTranslationRotationScale
 * @see Matrix4.fromTranslation
 * @see Matrix4.fromScale
 * @see Matrix4.fromUniformScale
 * @see Matrix4.fromRotation
 * @see Matrix4.fromCamera
 * @see Matrix4.computePerspectiveFieldOfView
 * @see Matrix4.computeOrthographicOffCenter
 * @see Matrix4.computePerspectiveOffCenter
 * @see Matrix4.computeInfinitePerspectiveOffCenter
 * @see Matrix4.computeViewportTransformation
 * @see Matrix4.computeView
 * @see Matrix2
 * @see Matrix3
 * @see Packable
 */
// @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
class Matrix4 {
  /**
   * @param {number} [column0Row0=0.0] 第 0 列第 0 行的值。
   * @param {number} [column1Row0=0.0] 第 1 列第 0 行的值。
   * @param {number} [column2Row0=0.0] 第 2 列第 0 行的值。
   * @param {number} [column3Row0=0.0] 第 3 列第 0 行的值。
   * @param {number} [column0Row1=0.0] 第 0 列第 1 行的值。
   * @param {number} [column1Row1=0.0] 第 1 列第 1 行的值。
   * @param {number} [column2Row1=0.0] 第 2 列第 1 行的值。
   * @param {number} [column3Row1=0.0] 第 3 列第 1 行的值。
   * @param {number} [column0Row2=0.0] 第 0 列第 2 行的值。
   * @param {number} [column1Row2=0.0] 第 1 列第 2 行的值。
   * @param {number} [column2Row2=0.0] 第 2 列第 2 行的值。
   * @param {number} [column3Row2=0.0] 第 3 列第 2 行的值。
   * @param {number} [column0Row3=0.0] 第 0 列第 3 行的值。
   * @param {number} [column1Row3=0.0] 第 1 列第 3 行的值。
   * @param {number} [column2Row3=0.0] 第 2 列第 3 行的值。
   * @param {number} [column3Row3=0.0] 第 3 列第 3 行的值。
   */
  constructor(
    column0Row0,
    column1Row0,
    column2Row0,
    column3Row0,
    column0Row1,
    column1Row1,
    column2Row1,
    column3Row1,
    column0Row2,
    column1Row2,
    column2Row2,
    column3Row2,
    column0Row3,
    column1Row3,
    column2Row3,
    column3Row3,
  ) {
    this[0] = column0Row0 ?? 0.0;
    this[1] = column0Row1 ?? 0.0;
    this[2] = column0Row2 ?? 0.0;
    this[3] = column0Row3 ?? 0.0;
    this[4] = column1Row0 ?? 0.0;
    this[5] = column1Row1 ?? 0.0;
    this[6] = column1Row2 ?? 0.0;
    this[7] = column1Row3 ?? 0.0;
    this[8] = column2Row0 ?? 0.0;
    this[9] = column2Row1 ?? 0.0;
    this[10] = column2Row2 ?? 0.0;
    this[11] = column2Row3 ?? 0.0;
    this[12] = column3Row0 ?? 0.0;
    this[13] = column3Row1 ?? 0.0;
    this[14] = column3Row2 ?? 0.0;
    this[15] = column3Row3 ?? 0.0;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Matrix4} value 要打包的值。
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
    array[startingIndex++] = value[8];
    array[startingIndex++] = value[9];
    array[startingIndex++] = value[10];
    array[startingIndex++] = value[11];
    array[startingIndex++] = value[12];
    array[startingIndex++] = value[13];
    array[startingIndex++] = value[14];
    array[startingIndex] = value[15];

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包的数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Matrix4} [result] 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Matrix4();
    }

    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    result[4] = array[startingIndex++];
    result[5] = array[startingIndex++];
    result[6] = array[startingIndex++];
    result[7] = array[startingIndex++];
    result[8] = array[startingIndex++];
    result[9] = array[startingIndex++];
    result[10] = array[startingIndex++];
    result[11] = array[startingIndex++];
    result[12] = array[startingIndex++];
    result[13] = array[startingIndex++];
    result[14] = array[startingIndex++];
    result[15] = array[startingIndex];
    return result;
  }

  /**
   * 将 Matrix4 数组展平为组件数组。组件
   * 按列主序存储。
   *
   * @param {Matrix4[]} array 要打包的矩阵数组。
   * @param {number[]} [result] 用于存储结果的数组。如果是类型化数组，则必须有 array.length * 16 个组件，否则会抛出 {@link DeveloperError}。如果是普通数组，则会被调整为 (array.length * 16) 个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 16;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): Requires conditional TypedArray types.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "如果 result 是类型化数组，则必须恰好有 array.length * 16 个元素",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Matrix4.pack(array[i], result, i * 16);
    }

    return result;
  }

  /**
   * 将列主序矩阵组件数组解包为 Matrix4 数组。
   *
   * @param {number[]} array 要解包的组件数组。
   * @param {Matrix4[]} [result] 用于存储结果的数组。
   * @returns {Matrix4[]} 解包后的数组。
   */
  static unpackArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 16);
    if (array.length % 16 !== 0) {
      throw new DeveloperError("数组长度必须是 16 的倍数。");
    }
    //>>includeEnd('debug');

    const length = array.length;
    if (!defined(result)) {
      result = new Array(length / 16);
    } else {
      result.length = length / 16;
    }

    for (let i = 0; i < length; i += 16) {
      const index = i / 16;
      result[index] = Matrix4.unpack(array, i, result[index]);
    }
    return result;
  }

  /**
   * 复制 Matrix4 实例。
   *
   * @param {Matrix4} matrix 要复制的矩阵。
   * @param {Matrix4} [result] 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。（如果 matrix 为 undefined 则返回 undefined）
   */
  static clone(matrix, result) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix4(
        matrix[0],
        matrix[4],
        matrix[8],
        matrix[12],
        matrix[1],
        matrix[5],
        matrix[9],
        matrix[13],
        matrix[2],
        matrix[6],
        matrix[10],
        matrix[14],
        matrix[3],
        matrix[7],
        matrix[11],
        matrix[15],
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
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }

  /**
   * 从列主序数组计算 Matrix4 实例。
   *
   * @param {number[]} values 列主序数组。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromColumnMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    return Matrix4.clone(values, result);
  }

  /**
   * 从行主序数组计算 Matrix4 实例。
   * 结果矩阵将按列主序存储。
   *
   * @param {number[]} values 行主序数组。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromRowMajorArray(values, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("values", values);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix4(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
        values[9],
        values[10],
        values[11],
        values[12],
        values[13],
        values[14],
        values[15],
      );
    }
    result[0] = values[0];
    result[1] = values[4];
    result[2] = values[8];
    result[3] = values[12];
    result[4] = values[1];
    result[5] = values[5];
    result[6] = values[9];
    result[7] = values[13];
    result[8] = values[2];
    result[9] = values[6];
    result[10] = values[10];
    result[11] = values[14];
    result[12] = values[3];
    result[13] = values[7];
    result[14] = values[11];
    result[15] = values[15];
    return result;
  }

  /**
   * 从表示旋转的 Matrix3 实例和表示平移的 Cartesian3 实例计算 Matrix4 实例。
   *
   * @param {Matrix3} rotation 矩阵的左上部分，表示旋转。
   * @param {Cartesian3} [translation=Cartesian3.ZERO] 矩阵的右上部分，表示平移。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromRotationTranslation(rotation, translation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rotation", rotation);
    //>>includeEnd('debug');

    translation = translation ?? Cartesian3.ZERO;

    if (!defined(result)) {
      return new Matrix4(
        rotation[0],
        rotation[3],
        rotation[6],
        translation.x,
        rotation[1],
        rotation[4],
        rotation[7],
        translation.y,
        rotation[2],
        rotation[5],
        rotation[8],
        translation.z,
        0.0,
        0.0,
        0.0,
        1.0,
      );
    }

    result[0] = rotation[0];
    result[1] = rotation[1];
    result[2] = rotation[2];
    result[3] = 0.0;
    result[4] = rotation[3];
    result[5] = rotation[4];
    result[6] = rotation[5];
    result[7] = 0.0;
    result[8] = rotation[6];
    result[9] = rotation[7];
    result[10] = rotation[8];
    result[11] = 0.0;
    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = 1.0;
    return result;
  }

  /**
   * 从平移、旋转和缩放（TRS）表示计算 Matrix4 实例，其中旋转用四元数表示。
   *
   * @param {Cartesian3} translation 平移变换。
   * @param {Quaternion} rotation 旋转变换。
   * @param {Cartesian3} scale 非均匀缩放变换。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   *
   * @example
   * const result = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
   *   new Cesium.Cartesian3(1.0, 2.0, 3.0), // 平移
   *   Cesium.Quaternion.IDENTITY,           // 旋转
   *   new Cesium.Cartesian3(7.0, 8.0, 9.0), // 缩放
   *   result);
   */
  static fromTranslationQuaternionRotationScale(
    translation,
    rotation,
    scale,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("translation", translation);
    Check.typeOf.object("rotation", rotation);
    Check.typeOf.object("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Matrix4();
    }

    const scaleX = scale.x;
    const scaleY = scale.y;
    const scaleZ = scale.z;

    const x2 = rotation.x * rotation.x;
    const xy = rotation.x * rotation.y;
    const xz = rotation.x * rotation.z;
    const xw = rotation.x * rotation.w;
    const y2 = rotation.y * rotation.y;
    const yz = rotation.y * rotation.z;
    const yw = rotation.y * rotation.w;
    const z2 = rotation.z * rotation.z;
    const zw = rotation.z * rotation.w;
    const w2 = rotation.w * rotation.w;

    const m00 = x2 - y2 - z2 + w2;
    const m01 = 2.0 * (xy - zw);
    const m02 = 2.0 * (xz + yw);

    const m10 = 2.0 * (xy + zw);
    const m11 = -x2 + y2 - z2 + w2;
    const m12 = 2.0 * (yz - xw);

    const m20 = 2.0 * (xz - yw);
    const m21 = 2.0 * (yz + xw);
    const m22 = -x2 - y2 + z2 + w2;

    result[0] = m00 * scaleX;
    result[1] = m10 * scaleX;
    result[2] = m20 * scaleX;
    result[3] = 0.0;
    result[4] = m01 * scaleY;
    result[5] = m11 * scaleY;
    result[6] = m21 * scaleY;
    result[7] = 0.0;
    result[8] = m02 * scaleZ;
    result[9] = m12 * scaleZ;
    result[10] = m22 * scaleZ;
    result[11] = 0.0;
    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = 1.0;

    return result;
  }

  /**
   * 从 {@link TranslationRotationScale} 实例创建 Matrix4 实例。
   *
   * @param {TranslationRotationScale} translationRotationScale 该实例。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromTranslationRotationScale(translationRotationScale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("translationRotationScale", translationRotationScale);
    //>>includeEnd('debug');

    return Matrix4.fromTranslationQuaternionRotationScale(
      translationRotationScale.translation,
      translationRotationScale.rotation,
      translationRotationScale.scale,
      result,
    );
  }

  /**
   * 从表示平移的 Cartesian3 创建 Matrix4 实例。
   *
   * @param {Cartesian3} translation 矩阵的右上部分，表示平移。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   *
   * @see Matrix4.multiplyByTranslation
   */
  static fromTranslation(translation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("translation", translation);
    //>>includeEnd('debug');

    return Matrix4.fromRotationTranslation(
      Matrix3.IDENTITY,
      translation,
      result,
    );
  }

  /**
   * 计算表示非均匀缩放的 Matrix4 实例。
   *
   * @param {Cartesian3} scale x、y 和 z 缩放因子。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   *
   * @example
   * // 创建
   * //   [7.0, 0.0, 0.0, 0.0]
   * //   [0.0, 8.0, 0.0, 0.0]
   * //   [0.0, 0.0, 9.0, 0.0]
   * //   [0.0, 0.0, 0.0, 1.0]
   * const m = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix4(
        scale.x,
        0.0,
        0.0,
        0.0,
        0.0,
        scale.y,
        0.0,
        0.0,
        0.0,
        0.0,
        scale.z,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0,
      );
    }

    result[0] = scale.x;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = scale.y;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = scale.z;
    result[11] = 0.0;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = 0.0;
    result[15] = 1.0;
    return result;
  }

  /**
   * 计算表示均匀缩放的 Matrix4 实例。
   *
   * @param {number} scale 均匀缩放因子。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   *
   * @example
   * // 创建
   * //   [2.0, 0.0, 0.0, 0.0]
   * //   [0.0, 2.0, 0.0, 0.0]
   * //   [0.0, 0.0, 2.0, 0.0]
   * //   [0.0, 0.0, 0.0, 1.0]
   * const m = Cesium.Matrix4.fromUniformScale(2.0);
   */
  static fromUniformScale(scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("scale", scale);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Matrix4(
        scale,
        0.0,
        0.0,
        0.0,
        0.0,
        scale,
        0.0,
        0.0,
        0.0,
        0.0,
        scale,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0,
      );
    }

    result[0] = scale;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = scale;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = scale;
    result[11] = 0.0;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = 0.0;
    result[15] = 1.0;
    return result;
  }

  /**
   * 创建旋转矩阵。
   *
   * @param {Matrix3} rotation 旋转矩阵。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromRotation(rotation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rotation", rotation);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Matrix4();
    }
    result[0] = rotation[0];
    result[1] = rotation[1];
    result[2] = rotation[2];
    result[3] = 0.0;

    result[4] = rotation[3];
    result[5] = rotation[4];
    result[6] = rotation[5];
    result[7] = 0.0;

    result[8] = rotation[6];
    result[9] = rotation[7];
    result[10] = rotation[8];
    result[11] = 0.0;

    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = 0.0;
    result[15] = 1.0;

    return result;
  }

  /**
   * 从 Camera 计算 Matrix4 实例。
   *
   * @param {Camera} camera 要使用的相机。
   * @param {Matrix4} [result] 用于存储结果的对象，如果未定义则创建新实例。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  static fromCamera(camera, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("camera", camera);
    //>>includeEnd('debug');

    const position = camera.position;
    const direction = camera.direction;
    const up = camera.up;

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("camera.position", position);
    Check.typeOf.object("camera.direction", direction);
    Check.typeOf.object("camera.up", up);
    //>>includeEnd('debug');

    Cartesian3.normalize(direction, fromCameraF);
    Cartesian3.normalize(
      Cartesian3.cross(fromCameraF, up, fromCameraR),
      fromCameraR,
    );
    Cartesian3.normalize(
      Cartesian3.cross(fromCameraR, fromCameraF, fromCameraU),
      fromCameraU,
    );

    const sX = fromCameraR.x;
    const sY = fromCameraR.y;
    const sZ = fromCameraR.z;
    const fX = fromCameraF.x;
    const fY = fromCameraF.y;
    const fZ = fromCameraF.z;
    const uX = fromCameraU.x;
    const uY = fromCameraU.y;
    const uZ = fromCameraU.z;
    const positionX = position.x;
    const positionY = position.y;
    const positionZ = position.z;
    const t0 = sX * -positionX + sY * -positionY + sZ * -positionZ;
    const t1 = uX * -positionX + uY * -positionY + uZ * -positionZ;
    const t2 = fX * positionX + fY * positionY + fZ * positionZ;

    // 此注释下方的代码是优化版本
    // 注释掉的行。
    // 我们不是创建两个矩阵然后相乘，
    // 而是在创建时直接将乘法嵌入。
    // const rotation = new Matrix4(
    //                 sX,  sY,  sZ, 0.0,
    //                 uX,  uY,  uZ, 0.0,
    //                -fX, -fY, -fZ, 0.0,
    //                 0.0,  0.0,  0.0, 1.0);
    // const translation = new Matrix4(
    //                 1.0, 0.0, 0.0, -position.x,
    //                 0.0, 1.0, 0.0, -position.y,
    //                 0.0, 0.0, 1.0, -position.z,
    //                 0.0, 0.0, 0.0, 1.0);
    // return rotation.multiply(translation);
    if (!defined(result)) {
      return new Matrix4(
        sX,
        sY,
        sZ,
        t0,
        uX,
        uY,
        uZ,
        t1,
        -fX,
        -fY,
        -fZ,
        t2,
        0.0,
        0.0,
        0.0,
        1.0,
      );
    }
    result[0] = sX;
    result[1] = uX;
    result[2] = -fX;
    result[3] = 0.0;
    result[4] = sY;
    result[5] = uY;
    result[6] = -fY;
    result[7] = 0.0;
    result[8] = sZ;
    result[9] = uZ;
    result[10] = -fZ;
    result[11] = 0.0;
    result[12] = t0;
    result[13] = t1;
    result[14] = t2;
    result[15] = 1.0;
    return result;
  }

  /**
   * 计算表示透视变换矩阵的 Matrix4 实例。
   *
   * @param {number} fovY 沿 Y 轴的视野（弧度）。
   * @param {number} aspectRatio 宽高比。
   * @param {number} near 到近平面的距离（米）。
   * @param {number} far 到远平面的距离（米）。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @exception {DeveloperError} fovY 必须在 (0, PI] 范围内。
   * @exception {DeveloperError} aspectRatio 必须大于零。
   * @exception {DeveloperError} near 必须大于零。
   * @exception {DeveloperError} far 必须大于零。
   */
  static computePerspectiveFieldOfView(fovY, aspectRatio, near, far, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThan("fovY", fovY, 0.0);
    Check.typeOf.number.lessThan("fovY", fovY, Math.PI);
    Check.typeOf.number.greaterThan("near", near, 0.0);
    Check.typeOf.number.greaterThan("far", far, 0.0);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const bottom = Math.tan(fovY * 0.5);

    const column1Row1 = 1.0 / bottom;
    const column0Row0 = column1Row1 / aspectRatio;
    const column2Row2 = (far + near) / (near - far);
    const column3Row2 = (2.0 * far * near) / (near - far);

    result[0] = column0Row0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = column1Row1;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = column2Row2;
    result[11] = -1.0;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = column3Row2;
    result[15] = 0.0;
    return result;
  }

  /**
   * 计算表示正交变换矩阵的 Matrix4 实例。
   *
   * @param {number} left 相机左侧可见区域的米数。
   * @param {number} right 相机右侧可见区域的米数。
   * @param {number} bottom 相机下方可见区域的米数。
   * @param {number} top 相机上方可见区域的米数。
   * @param {number} near 到近平面的距离（米）。
   * @param {number} far 到远平面的距离（米）。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static computeOrthographicOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    far,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("left", left);
    Check.typeOf.number("right", right);
    Check.typeOf.number("bottom", bottom);
    Check.typeOf.number("top", top);
    Check.typeOf.number("near", near);
    Check.typeOf.number("far", far);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    let a = 1.0 / (right - left);
    let b = 1.0 / (top - bottom);
    let c = 1.0 / (far - near);

    const tx = -(right + left) * a;
    const ty = -(top + bottom) * b;
    const tz = -(far + near) * c;
    a *= 2.0;
    b *= 2.0;
    c *= -2.0;

    result[0] = a;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = b;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = c;
    result[11] = 0.0;
    result[12] = tx;
    result[13] = ty;
    result[14] = tz;
    result[15] = 1.0;
    return result;
  }

  /**
   * 计算表示偏移中心透视变换的 Matrix4 实例。
   *
   * @param {number} left 相机左侧可见区域的米数。
   * @param {number} right 相机右侧可见区域的米数。
   * @param {number} bottom 相机下方可见区域的米数。
   * @param {number} top 相机上方可见区域的米数。
   * @param {number} near 到近平面的距离（米）。
   * @param {number} far 到远平面的距离（米）。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static computePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    far,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("left", left);
    Check.typeOf.number("right", right);
    Check.typeOf.number("bottom", bottom);
    Check.typeOf.number("top", top);
    Check.typeOf.number("near", near);
    Check.typeOf.number("far", far);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = (2.0 * near) / (right - left);
    const column1Row1 = (2.0 * near) / (top - bottom);
    const column2Row0 = (right + left) / (right - left);
    const column2Row1 = (top + bottom) / (top - bottom);
    const column2Row2 = -(far + near) / (far - near);
    const column2Row3 = -1.0;
    const column3Row2 = (-2.0 * far * near) / (far - near);

    result[0] = column0Row0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = column1Row1;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = column3Row2;
    result[15] = 0.0;
    return result;
  }

  /**
   * 计算表示无限偏移中心透视变换的 Matrix4 实例。
   *
   * @param {number} left 相机左侧可见区域的米数。
   * @param {number} right 相机右侧可见区域的米数。
   * @param {number} bottom 相机下方可见区域的米数。
   * @param {number} top 相机上方可见区域的米数。
   * @param {number} near 到近平面的距离（米）。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static computeInfinitePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("left", left);
    Check.typeOf.number("right", right);
    Check.typeOf.number("bottom", bottom);
    Check.typeOf.number("top", top);
    Check.typeOf.number("near", near);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const column0Row0 = (2.0 * near) / (right - left);
    const column1Row1 = (2.0 * near) / (top - bottom);
    const column2Row0 = (right + left) / (right - left);
    const column2Row1 = (top + bottom) / (top - bottom);
    const column2Row2 = -1.0;
    const column2Row3 = -1.0;
    const column3Row2 = -2.0 * near;

    result[0] = column0Row0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = column1Row1;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = column3Row2;
    result[15] = 0.0;
    return result;
  }

  /**
   * 计算从归一化设备坐标变换到窗口坐标的 Matrix4 实例。
   *
   * @param {Viewport} [viewport = { x : 0.0, y : 0.0, width : 0.0, height : 0.0 }] 视口角点，如示例 1 所示。
   * @param {number} [nearDepthRange=0.0] 窗口坐标中的近平面距离。
   * @param {number} [farDepthRange=1.0] 窗口坐标中的远平面距离。
   * @param {Matrix4} [result] 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 使用显式视口和深度范围创建视口变换。
   * const m = Cesium.Matrix4.computeViewportTransformation({
   *     x : 0.0,
   *     y : 0.0,
   *     width : 1024.0,
   *     height : 768.0
   * }, 0.0, 1.0, new Cesium.Matrix4());
   */
  static computeViewportTransformation(
    viewport,
    nearDepthRange,
    farDepthRange,
    result,
  ) {
    if (!defined(result)) {
      result = new Matrix4();
    }

    viewport = viewport ?? Frozen.EMPTY_OBJECT;
    const x = viewport.x ?? 0.0;
    const y = viewport.y ?? 0.0;
    const width = viewport.width ?? 0.0;
    const height = viewport.height ?? 0.0;
    nearDepthRange = nearDepthRange ?? 0.0;
    farDepthRange = farDepthRange ?? 1.0;

    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const halfDepth = (farDepthRange - nearDepthRange) * 0.5;

    const column0Row0 = halfWidth;
    const column1Row1 = halfHeight;
    const column2Row2 = halfDepth;
    const column3Row0 = x + halfWidth;
    const column3Row1 = y + halfHeight;
    const column3Row2 = nearDepthRange + halfDepth;
    const column3Row3 = 1.0;

    result[0] = column0Row0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = column1Row1;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = column2Row2;
    result[11] = 0.0;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = column3Row3;

    return result;
  }

  /**
   * 计算从世界空间变换到视图空间的 Matrix4 实例。
   *
   * @param {Cartesian3} position 相机位置。
   * @param {Cartesian3} direction 前方向。
   * @param {Cartesian3} up 上方向。
   * @param {Cartesian3} right 右方向。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static computeView(position, direction, up, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("position", position);
    Check.typeOf.object("direction", direction);
    Check.typeOf.object("up", up);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = right.x;
    result[1] = up.x;
    result[2] = -direction.x;
    result[3] = 0.0;
    result[4] = right.y;
    result[5] = up.y;
    result[6] = -direction.y;
    result[7] = 0.0;
    result[8] = right.z;
    result[9] = up.z;
    result[10] = -direction.z;
    result[11] = 0.0;
    result[12] = -Cartesian3.dot(right, position);
    result[13] = -Cartesian3.dot(up, position);
    result[14] = Cartesian3.dot(direction, position);
    result[15] = 1.0;
    return result;
  }

  /**
   * 从提供的 Matrix4 实例计算数组。
   * 数组将按列主序排列。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number[]} [result] 用于存储结果的数组。
   * @returns {number[]} 修改后的数组参数，如果未提供则返回新数组实例。
   *
   * @example
   * // 从 Matrix4 实例创建数组
   * // m = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   * const a = Cesium.Matrix4.toArray(m);
   *
   * // m 保持不变
   * // 创建 a = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0]
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
        matrix[9],
        matrix[10],
        matrix[11],
        matrix[12],
        matrix[13],
        matrix[14],
        matrix[15],
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
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }

  /**
   * 计算提供的行和列处的数组索引。
   *
   * @param {number} row 行的从零开始索引。
   * @param {number} column 列的从零开始索引。
   * @returns {number} 提供的行和列处的元素索引。
   *
   * @exception {DeveloperError} row 必须为 0、1、2 或 3。
   * @exception {DeveloperError} column 必须为 0、1、2 或 3。
   *
   * @example
   * const myMatrix = new Cesium.Matrix4();
   * const column1Row0Index = Cesium.Matrix4.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index];
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column, row) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check.typeOf.number.lessThanOrEquals("row", row, 3);

    Check.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check.typeOf.number.lessThanOrEquals("column", column, 3);
    //>>includeEnd('debug');

    return column * 4 + row;
  }

  /**
   * 以 Cartesian4 实例的形式检索提供的列的矩阵副本。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number} index 要检索的列的从零开始索引。
   * @param {Cartesian4} result 用于存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1、2 或 3。
   *
   * @example
   * // 返回包含指定列值的 Cartesian4 实例
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * // 示例 1: 创建 Cartesian 实例
   * const a = Cesium.Matrix4.getColumn(m, 2, new Cesium.Cartesian4());
   *
   * @example
   * // 示例 2: 为 Cartesian 实例设置值
   * const a = new Cesium.Cartesian4();
   * Cesium.Matrix4.getColumn(m, 2, a);
   *
   * // a.x = 12.0; a.y = 16.0; a.z = 20.0; a.w = 24.0;
   */
  static getColumn(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 3);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const startIndex = index * 4;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[startIndex];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[startIndex + 1];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const z = matrix[startIndex + 2];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const w = matrix[startIndex + 3];

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  /**
   * 计算新矩阵，将提供矩阵中的指定列替换为提供的 Cartesian4 实例。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number} index 要设置的列的从零开始索引。
   * @param {Cartesian4} cartesian 其值将分配给指定列的 Cartesian。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1、2 或 3。
   *
   * @example
   * // 从 Cartesian4 实例创建具有新列值的新 Matrix4 实例
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.setColumn(m, 2, new Cesium.Cartesian4(99.0, 98.0, 97.0, 96.0), new Cesium.Matrix4());
   *
   * // m 保持不变
   * // a = [10.0, 11.0, 99.0, 13.0]
   * //     [14.0, 15.0, 98.0, 17.0]
   * //     [18.0, 19.0, 97.0, 21.0]
   * //     [22.0, 23.0, 96.0, 25.0]
   */
  static setColumn(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 3);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix4.clone(matrix, result);
    const startIndex = index * 4;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 1] = cartesian.y;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 2] = cartesian.z;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[startIndex + 3] = cartesian.w;
    return result;
  }

  /**
   * 以 Cartesian4 实例的形式检索提供的行的矩阵副本。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number} index 要检索的行的从零开始索引。
   * @param {Cartesian4} result 用于存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1、2 或 3。
   *
   * @example
   * // 返回包含指定行值的 Cartesian4 实例
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * // 示例 1: 返回 Cartesian 实例
   * const a = Cesium.Matrix4.getRow(m, 2, new Cesium.Cartesian4());
   *
   * @example
   * // 示例 2: 为 Cartesian 实例设置值
   * const a = new Cesium.Cartesian4();
   * Cesium.Matrix4.getRow(m, 2, a);
   *
   * // a.x = 18.0; a.y = 19.0; a.z = 20.0; a.w = 21.0;
   */
  static getRow(matrix, index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 3);

    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const x = matrix[index];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const y = matrix[index + 4];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const z = matrix[index + 8];
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    const w = matrix[index + 12];

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  /**
   * 计算新矩阵，将提供矩阵中的指定行替换为提供的 Cartesian4 实例。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number} index 要设置的行的从零开始索引。
   * @param {Cartesian4} cartesian 其值将分配给指定行的 Cartesian。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @exception {DeveloperError} index 必须为 0、1、2 或 3。
   *
   * @example
   * // 从 Cartesian4 实例创建具有新行值的新 Matrix4 实例
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.setRow(m, 2, new Cesium.Cartesian4(99.0, 98.0, 97.0, 96.0), new Cesium.Matrix4());
   *
   * // m 保持不变
   * // a = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [99.0, 98.0, 97.0, 96.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   */
  static setRow(matrix, index, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);

    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThanOrEquals("index", index, 3);

    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result = Matrix4.clone(matrix, result);
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index] = cartesian.x;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 4] = cartesian.y;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 8] = cartesian.z;
    // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
    result[index + 12] = cartesian.w;
    return result;
  }

  /**
   * 计算新矩阵，将提供矩阵最右列中的平移替换为提供的平移。
   * 此方法假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {Cartesian3} translation 替换提供矩阵平移的平移。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static setTranslation(matrix, translation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("translation", translation);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];

    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];

    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];

    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = matrix[15];

    return result;
  }

  /**
   * 计算新矩阵，用提供的缩放替换缩放。
   * 此方法假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {Cartesian3} scale 替换提供矩阵缩放的缩放。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @see Matrix4.setUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.getScale
   */
  static setScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix4.getScale(matrix, scaleScratch1);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;
    const scaleRatioZ = scale.z / existingScale.z;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3];

    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioY;
    result[7] = matrix[7];

    result[8] = matrix[8] * scaleRatioZ;
    result[9] = matrix[9] * scaleRatioZ;
    result[10] = matrix[10] * scaleRatioZ;
    result[11] = matrix[11];

    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];

    return result;
  }

  /**
   * 计算新矩阵，用提供的均匀缩放替换缩放。
   * 此方法假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {number} scale 替换提供矩阵缩放的均匀缩放。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @see Matrix4.setScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.getScale
   */
  static setUniformScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.number("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const existingScale = Matrix4.getScale(matrix, scaleScratch2);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;
    const scaleRatioZ = scale / existingScale.z;

    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3];

    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioY;
    result[7] = matrix[7];

    result[8] = matrix[8] * scaleRatioZ;
    result[9] = matrix[9] * scaleRatioZ;
    result[10] = matrix[10] * scaleRatioZ;
    result[11] = matrix[11];

    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];

    return result;
  }

  /**
   * 提取非均匀缩放，假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数
   *
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
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
      Cartesian3.fromElements(matrix[4], matrix[5], matrix[6], scratchColumn),
    );
    result.z = Cartesian3.magnitude(
      Cartesian3.fromElements(matrix[8], matrix[9], matrix[10], scratchColumn),
    );
    return result;
  }

  /**
   * 计算最大缩放，假设矩阵为仿射变换。
   * 最大缩放是左上角 3x3 矩阵中列向量的最大长度。
   *
   * @param {Matrix4} matrix 矩阵。
   * @returns {number} 最大缩放。
   */
  static getMaximumScale(matrix) {
    Matrix4.getScale(matrix, scaleScratch3);
    return Cartesian3.maximumComponent(scaleScratch3);
  }

  /**
   * 设置旋转，假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Matrix3} rotation 旋转矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @see Matrix4.fromRotation
   * @see Matrix4.getRotation
   */
  static setRotation(matrix, rotation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix4.getScale(matrix, scaleScratch4);

    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.x;
    result[3] = matrix[3];

    result[4] = rotation[3] * scale.y;
    result[5] = rotation[4] * scale.y;
    result[6] = rotation[5] * scale.y;
    result[7] = matrix[7];

    result[8] = rotation[6] * scale.z;
    result[9] = rotation[7] * scale.z;
    result[10] = rotation[8] * scale.z;
    result[11] = matrix[11];

    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];

    return result;
  }

  /**
   * 提取旋转矩阵，假设矩阵为仿射变换。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @see Matrix4.setRotation
   * @see Matrix4.fromRotation
   */
  static getRotation(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scale = Matrix4.getScale(matrix, scaleScratch5);

    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.x;

    result[3] = matrix[4] / scale.y;
    result[4] = matrix[5] / scale.y;
    result[5] = matrix[6] / scale.y;

    result[6] = matrix[8] / scale.z;
    result[7] = matrix[9] / scale.z;
    result[8] = matrix[10] / scale.z;

    return result;
  }

  /**
   * 计算两个矩阵的乘积。
   *
   * @param {Matrix4} left 第一个矩阵。
   * @param {Matrix4} right 第二个矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static multiply(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const left0 = left[0];
    const left1 = left[1];
    const left2 = left[2];
    const left3 = left[3];
    const left4 = left[4];
    const left5 = left[5];
    const left6 = left[6];
    const left7 = left[7];
    const left8 = left[8];
    const left9 = left[9];
    const left10 = left[10];
    const left11 = left[11];
    const left12 = left[12];
    const left13 = left[13];
    const left14 = left[14];
    const left15 = left[15];

    const right0 = right[0];
    const right1 = right[1];
    const right2 = right[2];
    const right3 = right[3];
    const right4 = right[4];
    const right5 = right[5];
    const right6 = right[6];
    const right7 = right[7];
    const right8 = right[8];
    const right9 = right[9];
    const right10 = right[10];
    const right11 = right[11];
    const right12 = right[12];
    const right13 = right[13];
    const right14 = right[14];
    const right15 = right[15];

    const column0Row0 =
      left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
    const column0Row1 =
      left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
    const column0Row2 =
      left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
    const column0Row3 =
      left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;

    const column1Row0 =
      left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
    const column1Row1 =
      left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
    const column1Row2 =
      left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
    const column1Row3 =
      left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;

    const column2Row0 =
      left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
    const column2Row1 =
      left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
    const column2Row2 =
      left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
    const column2Row3 =
      left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;

    const column3Row0 =
      left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
    const column3Row1 =
      left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
    const column3Row2 =
      left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
    const column3Row3 =
      left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column0Row3;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = column1Row3;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = column3Row3;
    return result;
  }

  /**
   * 计算两个矩阵的和。
   *
   * @param {Matrix4} left 第一个矩阵。
   * @param {Matrix4} right 第二个矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
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
    result[9] = left[9] + right[9];
    result[10] = left[10] + right[10];
    result[11] = left[11] + right[11];
    result[12] = left[12] + right[12];
    result[13] = left[13] + right[13];
    result[14] = left[14] + right[14];
    result[15] = left[15] + right[15];
    return result;
  }

  /**
   * 计算两个矩阵的差。
   *
   * @param {Matrix4} left 第一个矩阵。
   * @param {Matrix4} right 第二个矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
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
    result[9] = left[9] - right[9];
    result[10] = left[10] - right[10];
    result[11] = left[11] - right[11];
    result[12] = left[12] - right[12];
    result[13] = left[13] - right[13];
    result[14] = left[14] - right[14];
    result[15] = left[15] - right[15];
    return result;
  }

  /**
   * 计算两个矩阵的乘积，假设矩阵为仿射变换矩阵，
   * 其中左上角 3x3 元素为任意矩阵，
   * 第四列的前三个元素为平移。
   * 底行假定为 [0, 0, 0, 1]。
   * 不验证矩阵是否符合该形式。
   * 此方法比使用 {@link Matrix4.multiply} 计算通用 4x4
   * 矩阵的乘积更快。
   *
   * @param {Matrix4} left 第一个矩阵。
   * @param {Matrix4} right 第二个矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * const m1 = new Cesium.Matrix4(1.0, 6.0, 7.0, 0.0, 2.0, 5.0, 8.0, 0.0, 3.0, 4.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0);
   * const m2 = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3(1.0, 1.0, 1.0));
   * const m3 = Cesium.Matrix4.multiplyTransformation(m1, m2, new Cesium.Matrix4());
   */
  static multiplyTransformation(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const left0 = left[0];
    const left1 = left[1];
    const left2 = left[2];
    const left4 = left[4];
    const left5 = left[5];
    const left6 = left[6];
    const left8 = left[8];
    const left9 = left[9];
    const left10 = left[10];
    const left12 = left[12];
    const left13 = left[13];
    const left14 = left[14];

    const right0 = right[0];
    const right1 = right[1];
    const right2 = right[2];
    const right4 = right[4];
    const right5 = right[5];
    const right6 = right[6];
    const right8 = right[8];
    const right9 = right[9];
    const right10 = right[10];
    const right12 = right[12];
    const right13 = right[13];
    const right14 = right[14];

    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;

    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;

    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;

    const column3Row0 =
      left0 * right12 + left4 * right13 + left8 * right14 + left12;
    const column3Row1 =
      left1 * right12 + left5 * right13 + left9 * right14 + left13;
    const column3Row2 =
      left2 * right12 + left6 * right13 + left10 * right14 + left14;

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = 0.0;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = 0.0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = 0.0;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = 1.0;
    return result;
  }

  /**
   * 将变换矩阵（底行为 <code>[0.0, 0.0, 0.0, 1.0]</code>）
   * 与 3x3 旋转矩阵相乘。这是对
   * <code>Matrix4.multiply(m, Matrix4.fromRotationTranslation(rotation), m);</code> 的优化，减少了分配和算术运算。
   *
   * @param {Matrix4} matrix 左侧的矩阵。
   * @param {Matrix3} rotation 右侧的 3x3 旋转矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 替代 Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromRotationTranslation(rotation), m);
   * Cesium.Matrix4.multiplyByMatrix3(m, rotation, m);
   */
  static multiplyByMatrix3(matrix, rotation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("rotation", rotation);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const left0 = matrix[0];
    const left1 = matrix[1];
    const left2 = matrix[2];
    const left4 = matrix[4];
    const left5 = matrix[5];
    const left6 = matrix[6];
    const left8 = matrix[8];
    const left9 = matrix[9];
    const left10 = matrix[10];

    const right0 = rotation[0];
    const right1 = rotation[1];
    const right2 = rotation[2];
    const right4 = rotation[3];
    const right5 = rotation[4];
    const right6 = rotation[5];
    const right8 = rotation[6];
    const right9 = rotation[7];
    const right10 = rotation[8];

    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;

    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;

    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = 0.0;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = 0.0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = 0.0;
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }

  /**
   * 将变换矩阵（底行为 <code>[0.0, 0.0, 0.0, 1.0]</code>）
   * 与由 {@link Cartesian3} 定义的隐式平移矩阵相乘。这是对
   * <code>Matrix4.multiply(m, Matrix4.fromTranslation(position), m);</code> 的优化，减少了分配和算术运算。
   *
   * @param {Matrix4} matrix 左侧的矩阵。
   * @param {Cartesian3} translation 右侧的平移。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 替代 Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromTranslation(position), m);
   * Cesium.Matrix4.multiplyByTranslation(m, position, m);
   */
  static multiplyByTranslation(matrix, translation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("translation", translation);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const x = translation.x;
    const y = translation.y;
    const z = translation.z;

    const tx = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12];
    const ty = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13];
    const tz = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];

    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = tx;
    result[13] = ty;
    result[14] = tz;
    result[15] = matrix[15];
    return result;
  }

  /**
   * 将仿射变换矩阵（底行为 <code>[0.0, 0.0, 0.0, 1.0]</code>）
   * 与隐式非均匀缩放矩阵相乘。这是对
   * <code>Matrix4.multiply(m, Matrix4.fromUniformScale(scale), m);</code> 的优化，其中
   * <code>m</code> 必须是仿射矩阵。
   * 此函数执行更少的分配和算术运算。
   *
   * @param {Matrix4} matrix 左侧的仿射矩阵。
   * @param {Cartesian3} scale 右侧的非均匀缩放。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   *
   * @example
   * // 替代 Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromScale(scale), m);
   * Cesium.Matrix4.multiplyByScale(m, scale, m);
   *
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
   * @see Matrix4.getScale
   */
  static multiplyByScale(matrix, scale, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("scale", scale);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const scaleX = scale.x;
    const scaleY = scale.y;
    const scaleZ = scale.z;

    // 比 Cartesian3.equals 更快
    if (scaleX === 1.0 && scaleY === 1.0 && scaleZ === 1.0) {
      return Matrix4.clone(matrix, result);
    }

    result[0] = scaleX * matrix[0];
    result[1] = scaleX * matrix[1];
    result[2] = scaleX * matrix[2];
    result[3] = matrix[3];

    result[4] = scaleY * matrix[4];
    result[5] = scaleY * matrix[5];
    result[6] = scaleY * matrix[6];
    result[7] = matrix[7];

    result[8] = scaleZ * matrix[8];
    result[9] = scaleZ * matrix[9];
    result[10] = scaleZ * matrix[10];
    result[11] = matrix[11];

    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];

    return result;
  }

  /**
   * 计算矩阵与均匀缩放的乘积，如同缩放是一个缩放矩阵。
   *
   * @param {Matrix4} matrix 左侧的矩阵。
   * @param {number} scale 右侧的均匀缩放。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 替代 Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromUniformScale(scale), m);
   * Cesium.Matrix4.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix4.multiplyByScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
   * @see Matrix4.getScale
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
    result[3] = matrix[3];

    result[4] = matrix[4] * scale;
    result[5] = matrix[5] * scale;
    result[6] = matrix[6] * scale;
    result[7] = matrix[7];

    result[8] = matrix[8] * scale;
    result[9] = matrix[9] * scale;
    result[10] = matrix[10] * scale;
    result[11] = matrix[11];

    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];

    return result;
  }

  /**
   * 计算矩阵与列向量的乘积。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Cartesian4} cartesian 向量。
   * @param {Cartesian4} result 用于存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    const vW = cartesian.w;

    const x =
      matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12] * vW;
    const y =
      matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13] * vW;
    const z =
      matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14] * vW;
    const w =
      matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  /**
   * 计算矩阵与 {@link Cartesian3} 的乘积。这等价于调用 {@link Matrix4.multiplyByVector}，
   * 其中 {@link Cartesian4} 的 <code>w</code> 分量为零。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Cartesian3} cartesian 点。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   *
   * @example
   * const p = new Cesium.Cartesian3(1.0, 2.0, 3.0);
   * const result = Cesium.Matrix4.multiplyByPointAsVector(matrix, p, new Cesium.Cartesian3());
   * // 等价于
   * //   Cartesian3 p = ...
   * //   Cesium.Matrix4.multiplyByVector(matrix, new Cesium.Cartesian4(p.x, p.y, p.z, 0.0), result);
   */
  static multiplyByPointAsVector(matrix, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;

    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ;
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ;
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ;

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 计算矩阵与 {@link Cartesian3} 的乘积。这等价于调用 {@link Matrix4.multiplyByVector}，
   * 其中 {@link Cartesian4} 的 <code>w</code> 分量为 1，但返回 {@link Cartesian3} 而不是 {@link Cartesian4}。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {Cartesian3} cartesian 点。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   *
   * @example
   * const p = new Cesium.Cartesian3(1.0, 2.0, 3.0);
   * const result = Cesium.Matrix4.multiplyByPoint(matrix, p, new Cesium.Cartesian3());
   */
  static multiplyByPoint(matrix, cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;

    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12];
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13];
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14];

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 计算矩阵与标量的乘积。
   *
   * @param {Matrix4} matrix 矩阵。
   * @param {number} scalar 要乘的数。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 创建 Matrix4 实例，它是提供的 Matrix4 的缩放版本
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.multiplyByScalar(m, -2, new Cesium.Matrix4());
   *
   * // m 保持不变
   * // a = [-20.0, -22.0, -24.0, -26.0]
   * //     [-28.0, -30.0, -32.0, -34.0]
   * //     [-36.0, -38.0, -40.0, -42.0]
   * //     [-44.0, -46.0, -48.0, -50.0]
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
    result[9] = matrix[9] * scalar;
    result[10] = matrix[10] * scalar;
    result[11] = matrix[11] * scalar;
    result[12] = matrix[12] * scalar;
    result[13] = matrix[13] * scalar;
    result[14] = matrix[14] * scalar;
    result[15] = matrix[15] * scalar;
    return result;
  }

  /**
   * 计算提供矩阵的取反副本。
   *
   * @param {Matrix4} matrix 要取反的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 创建新的 Matrix4 实例，它是 Matrix4 的取反
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.negate(m, new Cesium.Matrix4());
   *
   * // m 保持不变
   * // a = [-10.0, -11.0, -12.0, -13.0]
   * //     [-14.0, -15.0, -16.0, -17.0]
   * //     [-18.0, -19.0, -20.0, -21.0]
   * //     [-22.0, -23.0, -24.0, -25.0]
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
    result[9] = -matrix[9];
    result[10] = -matrix[10];
    result[11] = -matrix[11];
    result[12] = -matrix[12];
    result[13] = -matrix[13];
    result[14] = -matrix[14];
    result[15] = -matrix[15];
    return result;
  }

  /**
   * 计算提供矩阵的转置。
   *
   * @param {Matrix4} matrix 要转置的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @example
   * // 返回 Matrix4 的转置
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.transpose(m, new Cesium.Matrix4());
   *
   * // m 保持不变
   * // a = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   */
  static transpose(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const matrix1 = matrix[1];
    const matrix2 = matrix[2];
    const matrix3 = matrix[3];
    const matrix6 = matrix[6];
    const matrix7 = matrix[7];
    const matrix11 = matrix[11];

    result[0] = matrix[0];
    result[1] = matrix[4];
    result[2] = matrix[8];
    result[3] = matrix[12];
    result[4] = matrix1;
    result[5] = matrix[5];
    result[6] = matrix[9];
    result[7] = matrix[13];
    result[8] = matrix2;
    result[9] = matrix6;
    result[10] = matrix[10];
    result[11] = matrix[14];
    result[12] = matrix3;
    result[13] = matrix7;
    result[14] = matrix11;
    result[15] = matrix[15];
    return result;
  }

  /**
   * 计算一个矩阵，其中包含提供矩阵元素的绝对（无符号）值。
   *
   * @param {Matrix4} matrix 带有带符号元素的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
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
    result[9] = Math.abs(matrix[9]);
    result[10] = Math.abs(matrix[10]);
    result[11] = Math.abs(matrix[11]);
    result[12] = Math.abs(matrix[12]);
    result[13] = Math.abs(matrix[13]);
    result[14] = Math.abs(matrix[14]);
    result[15] = Math.abs(matrix[15]);

    return result;
  }

  /**
   * 逐分量比较提供的矩阵，如果相等则返回
   * <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix4} [left] 第一个矩阵。
   * @param {Matrix4} [right] 第二个矩阵。
   * @returns {boolean} 如果 left 和 right 相等则为 <code>true</code>，否则为 <code>false</code>。
   *
   * @example
   * // 比较两个 Matrix4 实例
   *
   * // a = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * // b = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * if(Cesium.Matrix4.equals(a,b)) {
   *      console.log("两个矩阵相等");
   * } else {
   *      console.log("它们不相等");
   * }
   *
   * // 在控制台打印 "两个矩阵相等"
   */
  static equals(left, right) {
    // 鉴于大多数矩阵将是变换矩阵，元素
    // 按顺序进行测试，以便测试很可能尽早失败。
    // 我认为这对 L1 缓存的友好程度
    // 与按索引顺序测试一样。在实践中它肯定更快。
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        // Translation
        left[12] === right[12] &&
        left[13] === right[13] &&
        left[14] === right[14] &&
        // Rotation/scale
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[4] === right[4] &&
        left[5] === right[5] &&
        left[6] === right[6] &&
        left[8] === right[8] &&
        left[9] === right[9] &&
        left[10] === right[10] &&
        // Bottom row
        left[3] === right[3] &&
        left[7] === right[7] &&
        left[11] === right[11] &&
        left[15] === right[15])
    );
  }

  /**
   * 逐分量比较提供的矩阵，如果它们在提供的 epsilon 范围内则返回
   * <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix4} [left] 第一个矩阵。
   * @param {Matrix4} [right] 第二个矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果 left 和 right 在提供的 epsilon 范围内则为 <code>true</code>，否则为 <code>false</code>。
   *
   * @example
   * // 比较两个 Matrix4 实例
   *
   * // a = [10.5, 14.5, 18.5, 22.5]
   * //     [11.5, 15.5, 19.5, 23.5]
   * //     [12.5, 16.5, 20.5, 24.5]
   * //     [13.5, 17.5, 21.5, 25.5]
   *
   * // b = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * if(Cesium.Matrix4.equalsEpsilon(a,b,0.1)){
   *      console.log("两个矩阵之间的差值小于 0.1");
   * } else {
   *      console.log("两个矩阵之间的差值不小于 0.1");
   * }
   *
   * // 在控制台打印 "两个矩阵之间的差值不小于 0.1"
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
        Math.abs(left[8] - right[8]) <= epsilon &&
        Math.abs(left[9] - right[9]) <= epsilon &&
        Math.abs(left[10] - right[10]) <= epsilon &&
        Math.abs(left[11] - right[11]) <= epsilon &&
        Math.abs(left[12] - right[12]) <= epsilon &&
        Math.abs(left[13] - right[13]) <= epsilon &&
        Math.abs(left[14] - right[14]) <= epsilon &&
        Math.abs(left[15] - right[15]) <= epsilon)
    );
  }

  /**
   * 获取提供矩阵的平移部分，假设矩阵为仿射变换矩阵。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {Cartesian3} result 用于存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static getTranslation(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = matrix[12];
    result.y = matrix[13];
    result.z = matrix[14];
    return result;
  }

  /**
   * 获取提供矩阵的左上角 3x3 矩阵。
   *
   * @param {Matrix4} matrix 要使用的矩阵。
   * @param {Matrix3} result 用于存储结果的对象。
   * @returns {Matrix3} 修改后的结果参数。
   *
   * @example
   * // 从 Matrix4 实例返回 Matrix3 实例
   *
   * // m = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * const b = new Cesium.Matrix3();
   * Cesium.Matrix4.getMatrix3(m,b);
   *
   * // b = [10.0, 14.0, 18.0]
   * //     [11.0, 15.0, 19.0]
   * //     [12.0, 16.0, 20.0]
   */
  static getMatrix3(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[4];
    result[4] = matrix[5];
    result[5] = matrix[6];
    result[6] = matrix[8];
    result[7] = matrix[9];
    result[8] = matrix[10];
    return result;
  }

  /**
   * 使用克莱姆法则计算提供矩阵的逆矩阵。
   * 如果行列式为零，则矩阵不可逆，将抛出异常。
   * 如果矩阵是proper rigid变换矩阵，则使用
   * {@link Matrix4.inverseTransformation} 求逆更高效。
   *
   * @param {Matrix4} matrix 要求逆的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   *
   * @exception {RuntimeError} 矩阵不可逆，因为其行列式为零。
   */
  static inverse(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');
    //
    // 移植自:
    //   ftp://download.intel.com/design/PentiumIII/sml/24504301.pdf
    //
    const src0 = matrix[0];
    const src1 = matrix[4];
    const src2 = matrix[8];
    const src3 = matrix[12];
    const src4 = matrix[1];
    const src5 = matrix[5];
    const src6 = matrix[9];
    const src7 = matrix[13];
    const src8 = matrix[2];
    const src9 = matrix[6];
    const src10 = matrix[10];
    const src11 = matrix[14];
    const src12 = matrix[3];
    const src13 = matrix[7];
    const src14 = matrix[11];
    const src15 = matrix[15];

    // 计算前 8 个元素的配对（余子式）
    let tmp0 = src10 * src15;
    let tmp1 = src11 * src14;
    let tmp2 = src9 * src15;
    let tmp3 = src11 * src13;
    let tmp4 = src9 * src14;
    let tmp5 = src10 * src13;
    let tmp6 = src8 * src15;
    let tmp7 = src11 * src12;
    let tmp8 = src8 * src14;
    let tmp9 = src10 * src12;
    let tmp10 = src8 * src13;
    let tmp11 = src9 * src12;

    // 计算前 8 个元素（余子式）
    const dst0 =
      tmp0 * src5 +
      tmp3 * src6 +
      tmp4 * src7 -
      (tmp1 * src5 + tmp2 * src6 + tmp5 * src7);
    const dst1 =
      tmp1 * src4 +
      tmp6 * src6 +
      tmp9 * src7 -
      (tmp0 * src4 + tmp7 * src6 + tmp8 * src7);
    const dst2 =
      tmp2 * src4 +
      tmp7 * src5 +
      tmp10 * src7 -
      (tmp3 * src4 + tmp6 * src5 + tmp11 * src7);
    const dst3 =
      tmp5 * src4 +
      tmp8 * src5 +
      tmp11 * src6 -
      (tmp4 * src4 + tmp9 * src5 + tmp10 * src6);
    const dst4 =
      tmp1 * src1 +
      tmp2 * src2 +
      tmp5 * src3 -
      (tmp0 * src1 + tmp3 * src2 + tmp4 * src3);
    const dst5 =
      tmp0 * src0 +
      tmp7 * src2 +
      tmp8 * src3 -
      (tmp1 * src0 + tmp6 * src2 + tmp9 * src3);
    const dst6 =
      tmp3 * src0 +
      tmp6 * src1 +
      tmp11 * src3 -
      (tmp2 * src0 + tmp7 * src1 + tmp10 * src3);
    const dst7 =
      tmp4 * src0 +
      tmp9 * src1 +
      tmp10 * src2 -
      (tmp5 * src0 + tmp8 * src1 + tmp11 * src2);

    // 计算后 8 个元素的配对（余子式）
    tmp0 = src2 * src7;
    tmp1 = src3 * src6;
    tmp2 = src1 * src7;
    tmp3 = src3 * src5;
    tmp4 = src1 * src6;
    tmp5 = src2 * src5;
    tmp6 = src0 * src7;
    tmp7 = src3 * src4;
    tmp8 = src0 * src6;
    tmp9 = src2 * src4;
    tmp10 = src0 * src5;
    tmp11 = src1 * src4;

    // 计算后 8 个元素（余子式）
    const dst8 =
      tmp0 * src13 +
      tmp3 * src14 +
      tmp4 * src15 -
      (tmp1 * src13 + tmp2 * src14 + tmp5 * src15);
    const dst9 =
      tmp1 * src12 +
      tmp6 * src14 +
      tmp9 * src15 -
      (tmp0 * src12 + tmp7 * src14 + tmp8 * src15);
    const dst10 =
      tmp2 * src12 +
      tmp7 * src13 +
      tmp10 * src15 -
      (tmp3 * src12 + tmp6 * src13 + tmp11 * src15);
    const dst11 =
      tmp5 * src12 +
      tmp8 * src13 +
      tmp11 * src14 -
      (tmp4 * src12 + tmp9 * src13 + tmp10 * src14);
    const dst12 =
      tmp2 * src10 +
      tmp5 * src11 +
      tmp1 * src9 -
      (tmp4 * src11 + tmp0 * src9 + tmp3 * src10);
    const dst13 =
      tmp8 * src11 +
      tmp0 * src8 +
      tmp7 * src10 -
      (tmp6 * src10 + tmp9 * src11 + tmp1 * src8);
    const dst14 =
      tmp6 * src9 +
      tmp11 * src11 +
      tmp3 * src8 -
      (tmp10 * src11 + tmp2 * src8 + tmp7 * src9);
    const dst15 =
      tmp10 * src10 +
      tmp4 * src8 +
      tmp9 * src9 -
      (tmp8 * src9 + tmp11 * src10 + tmp5 * src8);

    // 计算行列式
    let det = src0 * dst0 + src1 * dst1 + src2 * dst2 + src3 * dst3;

    if (Math.abs(det) < CesiumMath.EPSILON21) {
      // 零缩放矩阵的特殊情况，可能发生，例如
      // 当模型的节点具有 [0, 0, 0] 缩放时。
      if (
        Matrix3.equalsEpsilon(
          Matrix4.getMatrix3(matrix, scratchInverseRotation),
          scratchMatrix3Zero,
          CesiumMath.EPSILON7,
        ) &&
        Cartesian4.equals(
          Matrix4.getRow(matrix, 3, scratchBottomRow),
          scratchExpectedBottomRow,
        )
      ) {
        result[0] = 0.0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = 0.0;
        result[11] = 0.0;
        result[12] = -matrix[12];
        result[13] = -matrix[13];
        result[14] = -matrix[14];
        result[15] = 1.0;
        return result;
      }

      throw new RuntimeError(
        "矩阵不可逆，因为其行列式为零。",
      );
    }

    // 计算矩阵逆
    det = 1.0 / det;

    result[0] = dst0 * det;
    result[1] = dst1 * det;
    result[2] = dst2 * det;
    result[3] = dst3 * det;
    result[4] = dst4 * det;
    result[5] = dst5 * det;
    result[6] = dst6 * det;
    result[7] = dst7 * det;
    result[8] = dst8 * det;
    result[9] = dst9 * det;
    result[10] = dst10 * det;
    result[11] = dst11 * det;
    result[12] = dst12 * det;
    result[13] = dst13 * det;
    result[14] = dst14 * det;
    result[15] = dst15 * det;
    return result;
  }

  /**
   * 计算提供矩阵的逆矩阵，假设它是proper rigid变换矩阵，
   * 其中左上角 3x3 元素为旋转矩阵，
   * 第四列的前三个元素为平移。
   * 底行假定为 [0, 0, 0, 1]。
   * 不验证矩阵是否符合该形式。
   * 此方法比使用 {@link Matrix4.inverse} 计算通用 4x4
   * 矩阵的逆更快。
   *
   * @param {Matrix4} matrix 要求逆的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static inverseTransformation(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    // 此函数是对以下 4 行的优化。
    // const rT = Matrix3.transpose(Matrix4.getMatrix3(matrix));
    // const rTN = Matrix3.negate(rT);
    // const rTT = Matrix3.multiplyByVector(rTN, Matrix4.getTranslation(matrix));
    // return Matrix4.fromRotationTranslation(rT, rTT, result);

    const matrix0 = matrix[0];
    const matrix1 = matrix[1];
    const matrix2 = matrix[2];
    const matrix4 = matrix[4];
    const matrix5 = matrix[5];
    const matrix6 = matrix[6];
    const matrix8 = matrix[8];
    const matrix9 = matrix[9];
    const matrix10 = matrix[10];

    const vX = matrix[12];
    const vY = matrix[13];
    const vZ = matrix[14];

    const x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
    const y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
    const z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;

    result[0] = matrix0;
    result[1] = matrix4;
    result[2] = matrix8;
    result[3] = 0.0;
    result[4] = matrix1;
    result[5] = matrix5;
    result[6] = matrix9;
    result[7] = 0.0;
    result[8] = matrix2;
    result[9] = matrix6;
    result[10] = matrix10;
    result[11] = 0.0;
    result[12] = x;
    result[13] = y;
    result[14] = z;
    result[15] = 1.0;
    return result;
  }

  /**
   * 计算矩阵的逆矩阵的转置。
   *
   * @param {Matrix4} matrix 要转置并求逆的矩阵。
   * @param {Matrix4} result 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数。
   */
  static inverseTranspose(matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("matrix", matrix);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    return Matrix4.inverse(
      Matrix4.transpose(matrix, scratchTransposeMatrix),
      result,
    );
  }

  /**
   * 获取集合中的项目数量。
   *
   * @type {number}
   */
  get length() {
    return Matrix4.packedLength;
  }

  /**
   * 复制提供的 Matrix4 实例。
   *
   * @param {Matrix4} [result] 用于存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
   */
  clone(result) {
    return Matrix4.clone(this, result);
  }

  /**
   * 逐分量比较此矩阵与提供的矩阵，如果
   * 相等则返回 <code>true</code>，否则返回 <code>false</code>。
   *
   * @param {Matrix4} [right] 右侧矩阵。
   * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
   */
  equals(right) {
    return Matrix4.equals(this, right);
  }

  /**
   * 比较提供的矩阵和数组，从给定的数组偏移量开始。
   *
   * @param {Matrix4} matrix
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
      matrix[8] === array[offset + 8] &&
      matrix[9] === array[offset + 9] &&
      matrix[10] === array[offset + 10] &&
      matrix[11] === array[offset + 11] &&
      matrix[12] === array[offset + 12] &&
      matrix[13] === array[offset + 13] &&
      matrix[14] === array[offset + 14] &&
      matrix[15] === array[offset + 15]
    );
  }

  /**
   * 逐分量比较此矩阵与提供的矩阵，如果
   * 它们在提供的 epsilon 范围内则返回 <code>true</code>，
   * 否则返回 <code>false</code>。
   *
   * @param {Matrix4} [right] 右侧矩阵。
   * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
   * @returns {boolean} 如果它们在提供的 epsilon 范围内则为 <code>true</code>，否则为 <code>false</code>。
   */
  equalsEpsilon(right, epsilon) {
    return Matrix4.equalsEpsilon(this, right, epsilon);
  }

  /**
   * 创建表示此矩阵的字符串，每行位于
   * 单独的一行，格式为 '(column0, column1, column2, column3)'。
   *
   * @returns {string} 表示此矩阵的字符串，每行位于单独的一行，格式为 '(column0, column1, column2, column3)'。
   */
  toString() {
    return (
      `(${this[0]}, ${this[4]}, ${this[8]}, ${this[12]})\n` +
      `(${this[1]}, ${this[5]}, ${this[9]}, ${this[13]})\n` +
      `(${this[2]}, ${this[6]}, ${this[10]}, ${this[14]})\n` +
      `(${this[3]}, ${this[7]}, ${this[11]}, ${this[15]})`
    );
  }
}

/**
 * 将对象打包到数组中时使用的元素数量。
 * @type {number}
 */
Matrix4.packedLength = 16;

/**
 * 从数组中 16 个连续元素创建 Matrix4。
 * @function
 *
 * @param {number[]} array 数组，其 16 个连续元素对应矩阵的位置。假设为列主序。
 * @param {number} [startingIndex=0] 数组中第一个元素的偏移量，对应矩阵的第一列第一行位置。
 * @param {Matrix4} [result] 用于存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新的 Matrix4 实例。
 *
 * @example
 * // 创建 Matrix4:
 * // [1.0, 2.0, 3.0, 4.0]
 * // [1.0, 2.0, 3.0, 4.0]
 * // [1.0, 2.0, 3.0, 4.0]
 * // [1.0, 2.0, 3.0, 4.0]
 *
 * const v = [1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0, 3.0, 4.0, 4.0, 4.0, 4.0];
 * const m = Cesium.Matrix4.fromArray(v);
 *
 * // 使用数组中的偏移量创建相同的 Matrix4
 * const v2 = [0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0, 3.0, 4.0, 4.0, 4.0, 4.0];
 * const m2 = Cesium.Matrix4.fromArray(v2, 2);
 */
Matrix4.fromArray = Matrix4.unpack;

/**
 * 初始化为单位矩阵的不可变 Matrix4 实例。
 *
 * @type {Matrix4}
 * @constant
 */
Matrix4.IDENTITY = Object.freeze(
  new Matrix4(
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ),
);

/**
 * 初始化为零矩阵的不可变 Matrix4 实例。
 *
 * @type {Matrix4}
 * @constant
 */
Matrix4.ZERO = Object.freeze(
  new Matrix4(
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
  ),
);

/**
 * Matrix4 中第 0 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN0ROW0 = 0;

/**
 * Matrix4 中第 0 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN0ROW1 = 1;

/**
 * Matrix4 中第 0 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN0ROW2 = 2;

/**
 * Matrix4 中第 0 列第 3 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN0ROW3 = 3;

/**
 * Matrix4 中第 1 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN1ROW0 = 4;

/**
 * Matrix4 中第 1 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN1ROW1 = 5;

/**
 * Matrix4 中第 1 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN1ROW2 = 6;

/**
 * Matrix4 中第 1 列第 3 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN1ROW3 = 7;

/**
 * Matrix4 中第 2 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN2ROW0 = 8;

/**
 * Matrix4 中第 2 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN2ROW1 = 9;

/**
 * Matrix4 中第 2 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN2ROW2 = 10;

/**
 * Matrix4 中第 2 列第 3 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN2ROW3 = 11;

/**
 * Matrix4 中第 3 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN3ROW0 = 12;

/**
 * Matrix4 中第 3 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN3ROW1 = 13;

/**
 * Matrix4 中第 3 列第 2 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN3ROW2 = 14;

/**
 * Matrix4 中第 3 列第 3 行的索引。
 *
 * @type {number}
 * @constant
 */
Matrix4.COLUMN3ROW3 = 15;

const fromCameraF = new Cartesian3();
const fromCameraR = new Cartesian3();
const fromCameraU = new Cartesian3();

const scaleScratch1 = new Cartesian3();
const scaleScratch2 = new Cartesian3();
const scratchColumn = new Cartesian3();
const scaleScratch3 = new Cartesian3();
const scaleScratch4 = new Cartesian3();
const scaleScratch5 = new Cartesian3();

const scratchInverseRotation = new Matrix3();
const scratchMatrix3Zero = new Matrix3();
const scratchBottomRow = new Cartesian4();
const scratchExpectedBottomRow = new Cartesian4(0.0, 0.0, 0.0, 1.0);

const scratchTransposeMatrix = new Matrix4();

export default Matrix4;
