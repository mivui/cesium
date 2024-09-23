import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 一个 3x3 矩阵，可作为列优先顺序数组进行索引。
 * 构造函数参数按行优先顺序排列，以提高代码可读性。
 * @alias Matrix3
 * @constructor
 * @implements {ArrayLike<number>}
 *
 * @param {number} [column0Row0=0.0] 第 0 列第 0 行的值。
 * @param {number} [column1Row0=0.0] 第 1 列第 0 行的值。
 * @param {number} [column2Row0=0.0] 第 2 列第 0 行的值。
 * @param {number} [column0Row1=0.0] 第 0 列第 1 行的值。
 * @param {number} [column1Row1=0.0] 第 1 列第 1 行的值。
 * @param {number} [column2Row1=0.0] 第 2 列第 1 行的值。
 * @param {number} [column0Row2=0.0] 第 0 列第 2 行的值。
 * @param {number} [column1Row2=0.0] 第 1 列第 2 行的值。
 * @param {number} [column2Row2=0.0] 第 2 列第 2 行的值。
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
function Matrix3(
  column0Row0,
  column1Row0,
  column2Row0,
  column0Row1,
  column1Row1,
  column2Row1,
  column0Row2,
  column1Row2,
  column2Row2
) {
  this[0] = defaultValue(column0Row0, 0.0);
  this[1] = defaultValue(column0Row1, 0.0);
  this[2] = defaultValue(column0Row2, 0.0);
  this[3] = defaultValue(column1Row0, 0.0);
  this[4] = defaultValue(column1Row1, 0.0);
  this[5] = defaultValue(column1Row2, 0.0);
  this[6] = defaultValue(column2Row0, 0.0);
  this[7] = defaultValue(column2Row1, 0.0);
  this[8] = defaultValue(column2Row2, 0.0);
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Matrix3.packedLength = 9;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Matrix3} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Matrix3.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value[0];
  array[startingIndex++] = value[1];
  array[startingIndex++] = value[2];
  array[startingIndex++] = value[3];
  array[startingIndex++] = value[4];
  array[startingIndex++] = value[5];
  array[startingIndex++] = value[6];
  array[startingIndex++] = value[7];
  array[startingIndex++] = value[8];

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Matrix3} [result] 要在其中存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数 或者一个新的 Matrix3 实例（如果未提供）。
 */
Matrix3.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

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
  result[8] = array[startingIndex++];
  return result;
};

/**
 * 将 Matrix3 数组展平为组件数组。组件
 * 按列优先顺序存储。
 *
 * @param {Matrix3[]} array 要打包的矩阵数组。
 * @param {number[]} [result] 要在其中存储结果的数组。 如果这是一个类型化数组，它必须具有 array.length * 9 个组件，否则 {@link DeveloperError} 将被抛出。如果它是一个常规数组，它的大小将被调整为具有 （array.length * 9） 个元素。
 * @returns {number[]} 打包数组。
 */
Matrix3.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 9;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 9 elements"
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Matrix3.pack(array[i], result, i * 9);
  }
  return result;
};

/**
 * 将列优先矩阵组件数组解压缩到 Matrix3 数组中。
 *
 * @param {number[]} array 要解包的组件数组。
 * @param {Matrix3[]} [result] 要在其中存储结果的数组。
 * @returns {Matrix3[]} 未打包的数组。
 */
Matrix3.unpackArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 9);
  if (array.length % 9 !== 0) {
    throw new DeveloperError("array length must be a multiple of 9.");
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
};

/**
 * 复制Matrix3实例。
 *
 * @param {Matrix3} matrix 要复制的矩阵。
 * @param {Matrix3} [result] 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数 或者一个新的 Matrix3 实例（如果未提供）。 (Returns undefined if matrix is undefined)
 */
Matrix3.clone = function (matrix, result) {
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
      matrix[8]
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
};

/**
 * 从数组中的 9 个连续元素创建 Matrix3。
 *
 * @function
 * @param {number[]} 数组 其 9 个连续元素对应于矩阵位置的数组。 采用列优先顺序。
 * @param {number} [startingIndex=0] 第一个元素数组的偏移量，对应于矩阵中第一列第一行的位置。
 * @param {Matrix3} [result] 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Create the Matrix3:
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 *
 * const v = [1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m = Cesium.Matrix3.fromArray(v);
 *
 * // Create same Matrix3 with using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m2 = Cesium.Matrix3.fromArray(v2, 2);
 */
Matrix3.fromArray = Matrix3.unpack;

/**
 * 从列优先顺序数组创建 Matrix3 实例。
 *
 * @param {number[]} values 列优先顺序数组。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 */
Matrix3.fromColumnMajorArray = function (values, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("values", values);
  //>>includeEnd('debug');

  return Matrix3.clone(values, result);
};

/**
 * 从行优先顺序数组创建 Matrix3 实例。
 * 生成的矩阵将按列优先顺序排列。
 *
 * @param {number[]} values 行优先顺序数组。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 */
Matrix3.fromRowMajorArray = function (values, result) {
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
      values[8]
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
};

/**
 * 根据提供的四元数计算 3x3 旋转矩阵。
 *
 * @param {Quaternion} quaternion 要使用的四元数。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 来自此四元数的 3x3 旋转矩阵。
 */
Matrix3.fromQuaternion = function (quaternion, result) {
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
};

/**
 * 根据提供的 headingPitchRoll 计算 3x3 旋转矩阵。 (see http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles )
 *
 * @param {HeadingPitchRoll} headingPitchRoll 要使用的 headingPitchRoll。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 来自此 headingPitchRoll 的 3x3 旋转矩阵。
 */
Matrix3.fromHeadingPitchRoll = function (headingPitchRoll, result) {
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
};

/**
 * 计算表示非均匀尺度的 Matrix3 实例。
 *
 * @param {Cartesian3} 比例 x、y 和 z 比例因子。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Creates
 * //   [7.0, 0.0, 0.0]
 * //   [0.0, 8.0, 0.0]
 * //   [0.0, 0.0, 9.0]
 * const m = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromScale = function (scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("scale", scale);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Matrix3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
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
};

/**
 * 计算表示均匀缩放的 Matrix3 实例。
 *
 * @param {number} scale 统一比例因子。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Creates
 * //   [2.0, 0.0, 0.0]
 * //   [0.0, 2.0, 0.0]
 * //   [0.0, 0.0, 2.0]
 * const m = Cesium.Matrix3.fromUniformScale(2.0);
 */
Matrix3.fromUniformScale = function (scale, result) {
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
};

/**
 * 计算一个 Matrix3 实例，该实例表示 Cartesian3 向量的叉积等效矩阵。
 *
 * @param {Cartesian3} vector 叉积运算左侧的向量。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Creates
 * //   [0.0, -9.0,  8.0]
 * //   [9.0,  0.0, -7.0]
 * //   [-8.0, 7.0,  0.0]
 * const m = Cesium.Matrix3.fromCrossProduct(new Cesium.Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromCrossProduct = function (vector, result) {
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
      0.0
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
};

/**
 * 创建绕 x 轴的旋转矩阵。
 *
 * @param {number} angle 旋转的角度（以弧度为单位）。 正角度是逆时针方向的。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the x-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationX = function (angle, result) {
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
      cosAngle
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
};

/**
 * 创建绕 y 轴的旋转矩阵。
 *
 * @param {number} angle 旋转的角度（以弧度为单位）。 正角度是逆时针方向的。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the y-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationY = function (angle, result) {
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
      cosAngle
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
};

/**
 * 创建绕 z 轴的旋转矩阵。
 *
 * @param {number} angle 旋转的角度（以弧度为单位）。 正角度是逆时针方向的。
 * @param {Matrix3} [result] 存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix3} 修改后的结果参数, 或者一个新的 Matrix3 实例（如果未提供）。
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the z-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationZ = function (angle, result) {
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
      1.0
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
};

/**
 * 从提供的 Matrix3 实例创建一个 Array。
 * 数组将按列优先顺序排列。
 *
 * @param {Matrix3} matrix 要使用的矩阵..
 * @param {number[]} [result] 要在其中存储结果的数组。
 * @returns {number[]} 修改后的 Array 参数或新的 Array 实例（如果未提供）。
 */
Matrix3.toArray = function (matrix, result) {
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
};

/**
 * 计算元素在提供的行和列中的数组索引。
 *
 * @param {number} column 该列的从零开始的索引。
 * @param {number} row 该行的从零开始的索引。
 * @returns {number} 提供的行和列处的元素索引。
 *
 * @exception {DeveloperError} row must be 0, 1, or 2.
 * @exception {DeveloperError} column must be 0, 1, or 2.
 *
 * @example
 * const myMatrix = new Cesium.Matrix3();
 * const column1Row0Index = Cesium.Matrix3.getElementIndex(1, 0);
 * const column1Row0 = myMatrix[column1Row0Index]
 * myMatrix[column1Row0Index] = 10.0;
 */
Matrix3.getElementIndex = function (column, row) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("row", row, 0);
  Check.typeOf.number.lessThanOrEquals("row", row, 2);
  Check.typeOf.number.greaterThanOrEquals("column", column, 0);
  Check.typeOf.number.lessThanOrEquals("column", column, 2);
  //>>includeEnd('debug');

  return column * 3 + row;
};

/**
 * 在提供的索引处检索矩阵列的副本作为 Cartesian3 实例。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {number} index 要检索的列的从零开始的索引。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.getColumn = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const startIndex = index * 3;
  const x = matrix[startIndex];
  const y = matrix[startIndex + 1];
  const z = matrix[startIndex + 2];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 计算一个新矩阵，该矩阵将提供的矩阵中的指定列替换为提供的 Cartesian3 实例。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {number} index 要设置的列的从零开始的索引。
 * @param {Cartesian3} cartesian 笛卡尔 其值将被分配给指定列的笛卡尔。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.setColumn = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix3.clone(matrix, result);
  const startIndex = index * 3;
  result[startIndex] = cartesian.x;
  result[startIndex + 1] = cartesian.y;
  result[startIndex + 2] = cartesian.z;
  return result;
};

/**
 * 在提供的索引处检索矩阵行的副本作为 Cartesian3 实例。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {number} index 要检索的行的从零开始的索引。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.getRow = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = matrix[index];
  const y = matrix[index + 3];
  const z = matrix[index + 6];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 计算一个新矩阵，该矩阵将提供的矩阵中的指定行替换为提供的 Cartesian3 实例。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {number} index 要设置的行的从零开始的索引。
 * @param {Cartesian3} cartesian 笛卡尔 其值将被分配给指定行的笛卡尔。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.setRow = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix3.clone(matrix, result);
  result[index] = cartesian.x;
  result[index + 3] = cartesian.y;
  result[index + 6] = cartesian.z;
  return result;
};

const scaleScratch1 = new Cartesian3();

/**
 * 计算一个新矩阵，该矩阵将小数位数替换为提供的小数位数。
 * 这假设矩阵是仿射变换。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {Cartesian3} scale 替换所提供矩阵的刻度的刻度。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @see Matrix3.setUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.getScale
 */
Matrix3.setScale = function (matrix, scale, result) {
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
};

const scaleScratch2 = new Cartesian3();

/**
 * 计算一个新矩阵，该矩阵将小数位数替换为提供的均匀小数位数。
 * 这假设矩阵是仿射变换。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @param {number} scale 替换所提供矩阵的 scale 的统一小数位数。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @see Matrix3.setScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.getScale
 */
Matrix3.setUniformScale = function (matrix, scale, result) {
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
};

const scratchColumn = new Cartesian3();

/**
 * 提取非均匀尺度，假设矩阵是仿射变换。
 *
 * @param {Matrix3} matrix 矩阵。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 *
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 */
Matrix3.getScale = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn)
  );
  result.y = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn)
  );
  result.z = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn)
  );
  return result;
};

const scaleScratch3 = new Cartesian3();

/**
 * 计算假设矩阵是仿射变换的最大小数位数。
 * 最大比例是列向量的最大长度。
 *
 * @param {Matrix3} matrix 矩阵。
 * @returns {number} 最大刻度。
 */
Matrix3.getMaximumScale = function (matrix) {
  Matrix3.getScale(matrix, scaleScratch3);
  return Cartesian3.maximumComponent(scaleScratch3);
};

const scaleScratch4 = new Cartesian3();

/**
 * 设置假设矩阵是仿射变换的旋转。
 *
 * @param {Matrix3} matrix 矩阵。
 * @param {Matrix3} rotation 旋转矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @see Matrix3.getRotation
 */
Matrix3.setRotation = function (matrix, rotation, result) {
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
};

const scaleScratch5 = new Cartesian3();

/**
 * 提取旋转矩阵，假设矩阵是仿射变换。
 *
 * @param {Matrix3} matrix 矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @see Matrix3.setRotation
 */
Matrix3.getRotation = function (matrix, result) {
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
};

/**
 * 计算两个矩阵的乘积。
 *
 * @param {Matrix3} left 第一个矩阵。
 * @param {Matrix3} right 第二个矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.multiply = function (left, right, result) {
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
};

/**
 * 计算两个矩阵的和。
 *
 * @param {Matrix3} left 第一个矩阵。
 * @param {Matrix3} right 第二个矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.add = function (left, right, result) {
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
};

/**
 * 计算两个矩阵的差。
 *
 * @param {Matrix3} left 第一个矩阵。
 * @param {Matrix3} right 第二个矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.subtract = function (left, right, result) {
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
};

/**
 * 计算矩阵和列向量的乘积。
 *
 * @param {Matrix3} matrix  矩阵.
 * @param {Cartesian3} cartesian 列.
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Matrix3.multiplyByVector = function (matrix, cartesian, result) {
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
};

/**
 * 计算矩阵和标量的乘积。
 *
 * @param {Matrix3} matrix 矩阵。
 * @param {number} scalar 要乘以的数字。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.multiplyByScalar = function (matrix, scalar, result) {
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
};

/**
 * 计算矩阵乘以（非均匀）刻度的乘积，就像刻度是刻度矩阵一样。
 *
 * @param {Matrix3} matrix 左侧的矩阵。
 * @param {Cartesian3} scale 右侧的非均匀刻度。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 *
 * @example
 * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromScale(scale), m);
 * Cesium.Matrix3.multiplyByScale(m, scale, m);
 *
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 * @see Matrix3.getScale
 */
Matrix3.multiplyByScale = function (matrix, scale, result) {
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
};

/**
 * 计算矩阵乘以均匀小数位数的乘积，就好像小数位数是小数位数矩阵一样。
 *
 * @param {Matrix3} matrix 左侧的矩阵。
 * @param {number} scale 右侧的统一比例。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @example
 * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromUniformScale(scale), m);
 * Cesium.Matrix3.multiplyByUniformScale(m, scale, m);
 *
 * @see Matrix3.multiplyByScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 * @see Matrix3.getScale
 */
Matrix3.multiplyByUniformScale = function (matrix, scale, result) {
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
};

/**
 * 创建所提供矩阵的否定副本。
 *
 * @param {Matrix3} matrix 要求反的矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.negate = function (matrix, result) {
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
};

/**
 * 计算提供的矩阵的转置。
 *
 * @param {Matrix3} matrix 要转置的矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.transpose = function (matrix, result) {
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
};

function computeFrobeniusNorm(matrix) {
  let norm = 0.0;
  for (let i = 0; i < 9; ++i) {
    const temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

const rowVal = [1, 0, 0];
const colVal = [2, 2, 1];

function offDiagonalFrobeniusNorm(matrix) {
  // Computes the "off-diagonal" Frobenius norm.
  // Assumes matrix is symmetric.

  let norm = 0.0;
  for (let i = 0; i < 3; ++i) {
    const temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}

function shurDecomposition(matrix, result) {
  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.2 The 2by2 Symmetric Schur Decomposition.
  //
  // The routine takes a matrix, which is assumed to be symmetric, and
  // finds the largest off-diagonal term, and then creates
  // a matrix (result) which can be used to help reduce it

  const tolerance = CesiumMath.EPSILON15;

  let maxDiagonal = 0.0;
  let rotAxis = 1;

  // find pivot (rotAxis) based on max diagonal of matrix
  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(
      matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])]
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

  if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
    const qq = matrix[Matrix3.getElementIndex(q, q)];
    const pp = matrix[Matrix3.getElementIndex(p, p)];
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

  result[Matrix3.getElementIndex(p, p)] = result[
    Matrix3.getElementIndex(q, q)
  ] = c;
  result[Matrix3.getElementIndex(q, p)] = s;
  result[Matrix3.getElementIndex(p, q)] = -s;

  return result;
}

const jMatrix = new Matrix3();
const jMatrixTranspose = new Matrix3();

/**
 * 计算对称矩阵的特征向量和特征值。
 * <p>
 * 返回对角矩阵和酉矩阵，如下所示：
 * <code>matrix = unitary matrix * diagonal matrix * transpose(unitary matrix)</code>
 * </p>
 * <p>
 * 沿对角矩阵对角线的值是特征值。列
 * 是相应的特征向量。
 * </p>
 *
 * @param {Matrix3} matrix 要分解为对角矩阵和酉矩阵的矩阵。预期是对称的。
 * @param {object} [result] 具有幺正和对角线属性的对象，它们是存储结果的矩阵。
 * @returns {object} 具有酉和对角线属性的对象，分别是酉矩阵和对角线矩阵。
 *
 * @example
 * const a = //... symetric matrix
 * const result = {
 *     unitary : new Cesium.Matrix3(),
 *     diagonal : new Cesium.Matrix3()
 * };
 * Cesium.Matrix3.computeEigenDecomposition(a, result);
 *
 * const unitaryTranspose = Cesium.Matrix3.transpose(result.unitary, new Cesium.Matrix3());
 * const b = Cesium.Matrix3.multiply(result.unitary, result.diagonal, new Cesium.Matrix3());
 * Cesium.Matrix3.multiply(b, unitaryTranspose, b); // b is now equal to a
 *
 * const lambda = Cesium.Matrix3.getColumn(result.diagonal, 0, new Cesium.Cartesian3()).x;  // first eigenvalue
 * const v = Cesium.Matrix3.getColumn(result.unitary, 0, new Cesium.Cartesian3());          // first eigenvector
 * const c = Cesium.Cartesian3.multiplyByScalar(v, lambda, new Cesium.Cartesian3());        // equal to Cesium.Matrix3.multiplyByVector(a, v)
 */
Matrix3.computeEigenDecomposition = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.3 The Classical Jacobi Algorithm

  const tolerance = CesiumMath.EPSILON20;
  const maxSweeps = 10;

  let count = 0;
  let sweep = 0;

  if (!defined(result)) {
    result = {};
  }

  const unitaryMatrix = (result.unitary = Matrix3.clone(
    Matrix3.IDENTITY,
    result.unitary
  ));
  const diagMatrix = (result.diagonal = Matrix3.clone(matrix, result.diagonal));

  const epsilon = tolerance * computeFrobeniusNorm(diagMatrix);

  while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
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
};

/**
 * 计算一个矩阵，其中包含所提供矩阵元素的绝对 （无符号） 值。
 *
 * @param {Matrix3} matrix 具有有符号元素的矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.abs = function (matrix, result) {
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
};

/**
 * 计算所提供矩阵的行列式。
 *
 * @param {Matrix3} matrix 要使用的矩阵。
 * @returns {number} 矩阵的行列式的值。
 */
Matrix3.determinant = function (matrix) {
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
};

/**
 * 计算所提供矩阵的逆值。
 *
 * @param {Matrix3} matrix 要反转的矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 *
 * @exception {DeveloperError} matrix is not invertible.
 */
Matrix3.inverse = function (matrix, result) {
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
    throw new DeveloperError("matrix is not invertible");
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
};

const scratchTransposeMatrix = new Matrix3();

/**
 * 计算矩阵的逆转置。
 *
 * @param {Matrix3} matrix 要转置和反转的矩阵。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数。
 */
Matrix3.inverseTranspose = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  return Matrix3.inverse(
    Matrix3.transpose(matrix, scratchTransposeMatrix),
    result
  );
};

/**
 * 对提供的矩阵进行组件比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Matrix3} [left] 第一个matrix.
 * @param {Matrix3} [right] 第二个 matrix.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Matrix3.equals = function (left, right) {
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
};

/**
 * 对提供的矩阵进行组件比较，并返回
 * <code>true</code>，如果它们位于提供的 epsilon 内，
 * 否则 <code>false</code>。
 *
 * @param {Matrix3} [left] 第一个matrix.
 * @param {Matrix3} [right] 第二个 matrix.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
Matrix3.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);

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
};

/**
 * 初始化为标识矩阵的不可变 Matrix3 实例。
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)
);

/**
 * 初始化为零矩阵的不可变 Matrix3 实例。
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.ZERO = Object.freeze(
  new Matrix3(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
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
 * 第 1 列第 1 行的 Matrix3 索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW1 = 4;

/**
 * 第 1 列第 2 行的 Matrix3 索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW2 = 5;

/**
 * 第 2 列第 0 行的 Matrix3 索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW0 = 6;

/**
 * 第 2 列第 1 行的 Matrix3 索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW1 = 7;

/**
 * 第 2 列第 2 行的 Matrix3 索引。
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW2 = 8;

Object.defineProperties(Matrix3.prototype, {
  /**
   * 获取集合中的项数。
   * @memberof Matrix3.prototype
   *
   * @type {number}
   */
  length: {
    get: function () {
      return Matrix3.packedLength;
    },
  },
});

/**
 * 复制提供的 Matrix3 实例。
 *
 * @param {Matrix3} [result] 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数 或者一个新的 Matrix3 实例（如果未提供）。
 */
Matrix3.prototype.clone = function (result) {
  return Matrix3.clone(this, result);
};

/**
 * 将此矩阵与提供的矩阵进行分量比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Matrix3} [right] 右边 matrix.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
Matrix3.prototype.equals = function (right) {
  return Matrix3.equals(this, right);
};

/**
 * @private
 */
Matrix3.equalsArray = function (matrix, array, offset) {
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
};

/**
 * 将此矩阵与提供的矩阵进行分量比较，并返回
 * <code>true</code>，如果它们位于提供的 epsilon 内，
 * 否则 <code>false</code>。
 *
 * @param {Matrix3} [right] 右边 matrix.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，否则 <code>false</code>。
 */
Matrix3.prototype.equalsEpsilon = function (right, epsilon) {
  return Matrix3.equalsEpsilon(this, right, epsilon);
};

/**
 * 创建一个表示此 Matrix 的字符串，每行为
 * 在单独的行上，格式为 '（column0， column1， column2）'。
 *
 * @returns {string} 一个字符串，表示提供的 Matrix，每行位于单独的行上，格式为 '（column0， column1， column2）'。
 */
Matrix3.prototype.toString = function () {
  return (
    `(${this[0]}, ${this[3]}, ${this[6]})\n` +
    `(${this[1]}, ${this[4]}, ${this[7]})\n` +
    `(${this[2]}, ${this[5]}, ${this[8]})`
  );
};
export default Matrix3;
