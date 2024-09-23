import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个 2x2 矩阵，可作为列优先顺序数组进行索引。
 * 构造函数参数按行优先顺序排列，以提高代码可读性。
 * @alias Matrix2
 * @constructor
 * @implements {ArrayLike<number>}
 *
 * @param {number} [column0Row0=0.0] 第 0 列第 0 行的值。
 * @param {number} [column1Row0=0.0] 第 1 列第 0 行的值。
 * @param {number} [column0Row1=0.0] 第 0 列第 1 行的值。
 * @param {number} [column1Row1=0.0] 第 1 列第 1 行的值。
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
function Matrix2(column0Row0, column1Row0, column0Row1, column1Row1) {
  this[0] = defaultValue(column0Row0, 0.0);
  this[1] = defaultValue(column0Row1, 0.0);
  this[2] = defaultValue(column1Row0, 0.0);
  this[3] = defaultValue(column1Row1, 0.0);
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Matrix2.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Matrix2} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Matrix2.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value[0];
  array[startingIndex++] = value[1];
  array[startingIndex++] = value[2];
  array[startingIndex++] = value[3];

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Matrix2} [result] 要在其中存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数 或者新的 Matrix2 实例（如果未提供）。
 */
Matrix2.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Matrix2();
  }

  result[0] = array[startingIndex++];
  result[1] = array[startingIndex++];
  result[2] = array[startingIndex++];
  result[3] = array[startingIndex++];
  return result;
};

/**
 * 将 Matrix2 数组展平为组件数组。组件
 * 按列优先顺序存储。
 *
 * @param {Matrix2[]} array 要打包的矩阵数组。
 * @param {number[]} [result] 要在其中存储结果的数组。 如果这是一个类型化数组，它必须具有 array.length * 4 个组件，否则将有一个 {@link DeveloperError} 将被抛出。如果它是一个常规数组，它的大小将被调整为具有 （array.length * 4） 个元素。
 * @returns {number[]} 打包数组。
 */
Matrix2.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 4;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 4 elements"
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Matrix2.pack(array[i], result, i * 4);
  }
  return result;
};

/**
 * 将列优先矩阵组件数组解压缩到 Matrix2 数组中。
 *
 * @param {number[]} array 要解包的组件数组。
 * @param {Matrix2[]} [result] 要在其中存储结果的数组。
 * @returns {Matrix2[]} 未打包的数组。
 */
Matrix2.unpackArray = function (array, result) {
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
};

/**
 * 复制Matrix2 实例。
 *
 * @param {Matrix2} matrix 要复制的矩阵。
 * @param {Matrix2} [result] 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数 或者新的 Matrix2 实例（如果未提供）。（如果 matrix 未定义，则返回 undefined）
 */
Matrix2.clone = function (matrix, result) {
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
};

/**
 * 从数组中的 4 个连续元素创建 Matrix2。
 *
 * @function
 * @param {number[]} array 其 4 个连续元素对应于矩阵位置的数组。 采用列优先顺序。
 * @param {number} [startingIndex=0] 第一个元素数组的偏移量，对应于矩阵中第一列第一行的位置。
 * @param {Matrix2} [result] 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数 或者新的 Matrix2 实例（如果未提供）。
 *
 * @example
 * // Create the Matrix2:
 * // [1.0, 2.0]
 * // [1.0, 2.0]
 *
 * const v = [1.0, 1.0, 2.0, 2.0];
 * const m = Cesium.Matrix2.fromArray(v);
 *
 * // Create same Matrix2 with using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 1.0, 2.0, 2.0];
 * const m2 = Cesium.Matrix2.fromArray(v2, 2);
 */
Matrix2.fromArray = Matrix2.unpack;
/**
 * 从列优先顺序数组创建 Matrix2 实例。
 *
 * @param {number[]} values 列优先顺序数组。
 * @param {Matrix2} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix2} 修改后的结果参数, 或者新的 Matrix2 实例（如果未提供）。
 */
Matrix2.fromColumnMajorArray = function (values, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("values", values);
  //>>includeEnd('debug');

  return Matrix2.clone(values, result);
};

/**
 * 从行优先顺序数组创建 Matrix2 实例。
 * 生成的矩阵将按列优先顺序排列。
 *
 * @param {number[]} values 行优先顺序数组。
 * @param {Matrix2} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix2} 修改后的结果参数, 或者新的 Matrix2 实例（如果未提供）。
 */
Matrix2.fromRowMajorArray = function (values, result) {
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
};

/**
 * 计算表示非均匀缩放的 Matrix2 实例。
 *
 * @param {Cartesian2} scale x 和 y 比例因子。
 * @param {Matrix2} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix2} 修改后的结果参数, 或者新的 Matrix2 实例（如果未提供）。
 *
 * @example
 * // Creates
 * //   [7.0, 0.0]
 * //   [0.0, 8.0]
 * const m = Cesium.Matrix2.fromScale(new Cesium.Cartesian2(7.0, 8.0));
 */
Matrix2.fromScale = function (scale, result) {
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
};

/**
 * 计算表示均匀缩放的 Matrix2 实例。
 *
 * @param {number} scale 统一比例因子。
 * @param {Matrix2} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix2} 修改后的结果参数, 或者新的 Matrix2 实例（如果未提供）。
 *
 * @example
 * // Creates
 * //   [2.0, 0.0]
 * //   [0.0, 2.0]
 * const m = Cesium.Matrix2.fromUniformScale(2.0);
 */
Matrix2.fromUniformScale = function (scale, result) {
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
};

/**
 * 创建旋转矩阵。
 *
 * @param {number} angle 旋转的角度（以弧度为单位）。 正角度是逆时针方向的。
 * @param {Matrix2} [result] 将存储结果的对象，如果未定义，将创建一个新实例。
 * @returns {Matrix2} 修改后的结果参数, 或者新的 Matrix2 实例（如果未提供）。
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise.
 * const p = new Cesium.Cartesian2(5, 6);
 * const m = Cesium.Matrix2.fromRotation(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix2.multiplyByVector(m, p, new Cesium.Cartesian2());
 */
Matrix2.fromRotation = function (angle, result) {
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
};

/**
 * 从提供的 Matrix2 实例创建一个 Array。
 * 数组将按列优先顺序排列。
 *
 * @param {Matrix2} 矩阵 要使用的矩阵..
 * @param {number[]} [result] 要在其中存储结果的数组。
 * @returns {number[]} 修改后的 Array 参数或新的 Array 实例（如果未提供）。
 */
Matrix2.toArray = function (matrix, result) {
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
};

/**
 * 计算元素在提供的行和列中的数组索引。
 *
 * @param {number} row 该行的从零开始的索引。
 * @param {number} column 该列的从零开始的索引。
 * @returns {number} 提供的行和列处的元素索引。
 *
 * @exception {DeveloperError} 行必须为 0 或 1。
 * @exception {DeveloperError} 列必须为 0 或 1。
 *
 * @example
 * const myMatrix = new Cesium.Matrix2();
 * const column1Row0Index = Cesium.Matrix2.getElementIndex(1, 0);
 * const column1Row0 = myMatrix[column1Row0Index]
 * myMatrix[column1Row0Index] = 10.0;
 */
Matrix2.getElementIndex = function (column, row) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("row", row, 0);
  Check.typeOf.number.lessThanOrEquals("row", row, 1);

  Check.typeOf.number.greaterThanOrEquals("column", column, 0);
  Check.typeOf.number.lessThanOrEquals("column", column, 1);
  //>>includeEnd('debug');

  return column * 2 + row;
};

/**
 * 在提供的索引处检索矩阵列的副本作为 Cartesian2 实例。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {number} index 要检索的列的从零开始的索引。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0 or 1.
 */
Matrix2.getColumn = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);

  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 1);

  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const startIndex = index * 2;
  const x = matrix[startIndex];
  const y = matrix[startIndex + 1];

  result.x = x;
  result.y = y;
  return result;
};

/**
 * 计算一个新矩阵，该矩阵将提供的矩阵中的指定列替换为提供的 Cartesian2 实例。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {number} index 要设置的列的从零开始的索引。
 * @param {Cartesian2} cartesian 笛卡尔 其值将被分配给指定列的笛卡尔。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0 or 1.
 */
Matrix2.setColumn = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);

  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 1);

  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix2.clone(matrix, result);
  const startIndex = index * 2;
  result[startIndex] = cartesian.x;
  result[startIndex + 1] = cartesian.y;
  return result;
};

/**
 * 在提供的索引处检索矩阵行的副本作为 Cartesian2 实例。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {number} index 要检索的行的从零开始的索引。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0 or 1.
 */
Matrix2.getRow = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);

  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 1);

  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = matrix[index];
  const y = matrix[index + 2];

  result.x = x;
  result.y = y;
  return result;
};

/**
 * 计算一个新矩阵，该矩阵将提供的矩阵中的指定行替换为提供的 Cartesian2 实例。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {number} index 要设置的行的从零开始的索引。
 * @param {Cartesian2} cartesian 笛卡尔 其值将被分配给指定行的笛卡尔。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @exception {DeveloperError} index must be 0 or 1.
 */
Matrix2.setRow = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);

  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 1);

  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix2.clone(matrix, result);
  result[index] = cartesian.x;
  result[index + 2] = cartesian.y;
  return result;
};

const scaleScratch1 = new Cartesian2();

/**
 * 计算一个新矩阵，该矩阵将小数位数替换为提供的小数位数。
 * 这假设矩阵是仿射变换。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {Cartesian2} scale 替换所提供矩阵的刻度的刻度。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @see Matrix2.setUniformScale
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.multiplyByScale
 * @see Matrix2.multiplyByUniformScale
 * @see Matrix2.getScale
 */
Matrix2.setScale = function (matrix, scale, result) {
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
};

const scaleScratch2 = new Cartesian2();

/**
 * 计算一个新矩阵，该矩阵将小数位数替换为提供的均匀小数位数。
 * 这假设矩阵是仿射变换。
 *
 * @param {Matrix2} matrix 要使用的矩阵。
 * @param {number} scale 替换所提供矩阵的 scale 的统一小数位数。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @see Matrix2.setScale
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.multiplyByScale
 * @see Matrix2.multiplyByUniformScale
 * @see Matrix2.getScale
 */
Matrix2.setUniformScale = function (matrix, scale, result) {
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
};

const scratchColumn = new Cartesian2();

/**
 * 提取非均匀尺度，假设矩阵是仿射变换。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 *
 * @see Matrix2.multiplyByScale
 * @see Matrix2.multiplyByUniformScale
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.setScale
 * @see Matrix2.setUniformScale
 */
Matrix2.getScale = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Cartesian2.magnitude(
    Cartesian2.fromElements(matrix[0], matrix[1], scratchColumn)
  );
  result.y = Cartesian2.magnitude(
    Cartesian2.fromElements(matrix[2], matrix[3], scratchColumn)
  );
  return result;
};

const scaleScratch3 = new Cartesian2();

/**
 * 计算假设矩阵是仿射变换的最大小数位数。
 * 最大比例是列向量的最大长度。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @returns {number} 最大刻度。
 */
Matrix2.getMaximumScale = function (matrix) {
  Matrix2.getScale(matrix, scaleScratch3);
  return Cartesian2.maximumComponent(scaleScratch3);
};

const scaleScratch4 = new Cartesian2();

/**
 * 设置假设矩阵是仿射变换的旋转。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @param {Matrix2} rotation 旋转矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @see Matrix2.fromRotation
 * @see Matrix2.getRotation
 */
Matrix2.setRotation = function (matrix, rotation, result) {
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
};

const scaleScratch5 = new Cartesian2();

/**
 * 提取旋转矩阵，假设矩阵是仿射变换。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @see Matrix2.setRotation
 * @see Matrix2.fromRotation
 */
Matrix2.getRotation = function (matrix, result) {
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
};

/**
 * 计算两个矩阵的乘积。
 *
 * @param {Matrix2} left 第一个矩阵。
 * @param {Matrix2} right 第二个矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.multiply = function (left, right, result) {
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
};

/**
 * 计算两个矩阵的和。
 *
 * @param {Matrix2} left 第一个矩阵。
 * @param {Matrix2} right 第二个矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.add = function (left, right, result) {
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
};

/**
 * 计算两个矩阵的差。
 *
 * @param {Matrix2} left 第一个矩阵。
 * @param {Matrix2} right 第二个矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.subtract = function (left, right, result) {
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
};

/**
 * 计算矩阵和列向量的乘积。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @param {Cartesian2} 笛卡尔 列。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Matrix2.multiplyByVector = function (matrix, cartesian, result) {
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
};

/**
 * 计算矩阵和标量的乘积。
 *
 * @param {Matrix2} 矩阵 矩阵。
 * @param {number} scalar 要乘以的数字。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.multiplyByScalar = function (matrix, scalar, result) {
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
};

/**
 * 计算矩阵乘以（非均匀）刻度的乘积，就像刻度是刻度矩阵一样。
 *
 * @param {Matrix2} 矩阵 左侧的矩阵。
 * @param {Cartesian2} scale 右侧的非均匀刻度。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 *
 * @example
 * // Instead of Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromScale(scale), m);
 * Cesium.Matrix2.multiplyByScale(m, scale, m);
 *
 * @see Matrix2.multiplyByUniformScale
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.setScale
 * @see Matrix2.setUniformScale
 * @see Matrix2.getScale
 */
Matrix2.multiplyByScale = function (matrix, scale, result) {
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
};

/**
 * 计算矩阵乘以均匀小数位数的乘积，就好像小数位数是小数位数矩阵一样。
 *
 * @param {Matrix2} 矩阵 左侧的矩阵。
 * @param {number} scale 右侧的统一比例。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 *
 * @example
 * // Instead of Cesium.Matrix2.multiply(m, Cesium.Matrix2.fromUniformScale(scale), m);
 * Cesium.Matrix2.multiplyByUniformScale(m, scale, m);
 *
 * @see Matrix2.multiplyByScale
 * @see Matrix2.fromScale
 * @see Matrix2.fromUniformScale
 * @see Matrix2.setScale
 * @see Matrix2.setUniformScale
 * @see Matrix2.getScale
 */
Matrix2.multiplyByUniformScale = function (matrix, scale, result) {
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
};

/**
 * 创建所提供矩阵的否定副本。
 *
 * @param {Matrix2} matrix 要否定的矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.negate = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = -matrix[0];
  result[1] = -matrix[1];
  result[2] = -matrix[2];
  result[3] = -matrix[3];
  return result;
};

/**
 * 计算提供的矩阵的转置。
 *
 * @param {Matrix2} matrix 要转置的矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.transpose = function (matrix, result) {
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
};

/**
 * 计算一个矩阵，其中包含所提供矩阵元素的绝对 （无符号） 值。
 *
 * @param {Matrix2} 矩阵 具有有符号元素的矩阵。
 * @param {Matrix2} result 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数。
 */
Matrix2.abs = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = Math.abs(matrix[0]);
  result[1] = Math.abs(matrix[1]);
  result[2] = Math.abs(matrix[2]);
  result[3] = Math.abs(matrix[3]);

  return result;
};

/**
 * 对提供的矩阵进行组件比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Matrix2} [left] 第一个 matrix.
 * @param {Matrix2} [right] 第二个 matrix.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Matrix2.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left[0] === right[0] &&
      left[1] === right[1] &&
      left[2] === right[2] &&
      left[3] === right[3])
  );
};

/**
 * @private
 */
Matrix2.equalsArray = function (matrix, array, offset) {
  return (
    matrix[0] === array[offset] &&
    matrix[1] === array[offset + 1] &&
    matrix[2] === array[offset + 2] &&
    matrix[3] === array[offset + 3]
  );
};

/**
 * 对提供的矩阵进行组件比较，并返回
 * <code>true</code>，如果它们位于提供的 epsilon 内，
 * 否则 <code>false</code>。
 *
 * @param {Matrix2} [left] 第一个matrix.
 * @param {Matrix2} [right] 第二个 matrix.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
Matrix2.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left[0] - right[0]) <= epsilon &&
      Math.abs(left[1] - right[1]) <= epsilon &&
      Math.abs(left[2] - right[2]) <= epsilon &&
      Math.abs(left[3] - right[3]) <= epsilon)
  );
};

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
 * Matrix2 中第 0 列第 0 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN0ROW0] = 5.0; // set column 0, row 0 to 5.0
 */
Matrix2.COLUMN0ROW0 = 0;

/**
 * Matrix2 中第 0 列第 1 行的索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN0ROW1] = 5.0; // set column 0, row 1 to 5.0
 */
Matrix2.COLUMN0ROW1 = 1;

/**
 * 第 1 列第 0 行的 Matrix2 索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN1ROW0] = 5.0; // set column 1, row 0 to 5.0
 */
Matrix2.COLUMN1ROW0 = 2;

/**
 * 第 1 列第 1 行的 Matrix2 索引。
 *
 * @type {number}
 * @constant
 *
 * @example
 * const matrix = new Cesium.Matrix2();
 * matrix[Cesium.Matrix2.COLUMN1ROW1] = 5.0; // set column 1, row 1 to 5.0
 */
Matrix2.COLUMN1ROW1 = 3;

Object.defineProperties(Matrix2.prototype, {
  /**
   * 获取集合中的项数。
   * @memberof Matrix2.prototype
   *
   * @type {number}
   */
  length: {
    get: function () {
      return Matrix2.packedLength;
    },
  },
});

/**
 * 复制提供的 Matrix2 实例。
 *
 * @param {Matrix2} [result] 要在其上存储结果的对象。
 * @returns {Matrix2} 修改后的结果参数 或者新的 Matrix2 实例（如果未提供）。
 */
Matrix2.prototype.clone = function (result) {
  return Matrix2.clone(this, result);
};

/**
 * 将此矩阵与提供的矩阵进行分量比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Matrix2} [right] 右边 matrix.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
Matrix2.prototype.equals = function (right) {
  return Matrix2.equals(this, right);
};

/**
 * 将此矩阵与提供的矩阵进行分量比较，并返回
 * <code>true</code> 如果它们位于提供的 epsilon 内，
 * 否则 <code>false</code>。
 *
 * @param {Matrix2} [right] 右边 matrix.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，否则 <code>false</code>。
 */
Matrix2.prototype.equalsEpsilon = function (right, epsilon) {
  return Matrix2.equalsEpsilon(this, right, epsilon);
};

/**
 * 创建一个表示此 Matrix 的字符串，每行为
 * 在单独的行上，格式为 '（column0， column1）'。
 *
 * @returns {string} 一个字符串，表示提供的 Matrix，每行位于单独的行上，格式为 '（column0， column1）'。
 */
Matrix2.prototype.toString = function () {
  return `(${this[0]}, ${this[2]})\n` + `(${this[1]}, ${this[3]})`;
};
export default Matrix2;
