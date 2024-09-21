import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import WebGLConstants from "./WebGLConstants.js";

/**
 * WebGL 索引数据类型的常量。 这些对应于
 * <code>type</code> 参数的 {@link http://www.khronos.org/opengles/sdk/docs/man/xhtml/glDrawElements.xml|drawElements} 的 intent 参数。
 *
 * @enum {number}
 */
const IndexDatatype = {
  /**
   * 8-bit unsigned 字节对应于 <code>UNSIGNED_BYTE</code> 和 类型
   * 的元素 <code>Uint8Array</code>.
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_BYTE: WebGLConstants.UNSIGNED_BYTE,

  /**
   * 16-bit unsigned short 对应于 <code>UNSIGNED_SHORT</code> 和 类型
   *  的元素<code>Uint16Array</code>.
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_SHORT: WebGLConstants.UNSIGNED_SHORT,

  /**
   * 32-bit unsigned int 对应于 <code>UNSIGNED_INT</code> 和类型
   *  的元素<code>Uint32Array</code>.
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_INT: WebGLConstants.UNSIGNED_INT,
};

/**
 * 返回相应数据类型的大小 （以字节为单位）。
 *
 * @param {IndexDatatype} indexDatatype 要获取其大小的索引数据类型。
 * @returns {number} 大小（以字节为单位）。
 *
 * @example
 * // Returns 2
 * const size = Cesium.IndexDatatype.getSizeInBytes(Cesium.IndexDatatype.UNSIGNED_SHORT);
 */
IndexDatatype.getSizeInBytes = function (indexDatatype) {
  switch (indexDatatype) {
    case IndexDatatype.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case IndexDatatype.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case IndexDatatype.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "indexDatatype is required and must be a valid IndexDatatype constant."
  );
  //>>includeEnd('debug');
};

/**
 * 获取具有给定大小（以字节为单位）的数据类型。
 *
 * @param {number} sizeInBytes 单个索引的大小（以字节为单位）。
 * @returns {IndexDatatype} 具有给定大小的索引数据类型。
 */
IndexDatatype.fromSizeInBytes = function (sizeInBytes) {
  switch (sizeInBytes) {
    case 2:
      return IndexDatatype.UNSIGNED_SHORT;
    case 4:
      return IndexDatatype.UNSIGNED_INT;
    case 1:
      return IndexDatatype.UNSIGNED_BYTE;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(
        "Size in bytes cannot be mapped to an IndexDatatype"
      );
    //>>includeEnd('debug');
  }
};

/**
 * 验证提供的索引数据类型是否为有效的 {@link IndexDatatype}。
 *
 * @param {IndexDatatype} indexDatatype 要验证的索引数据类型。
 * @returns {boolean} <code>true</code>，如果提供的索引数据类型是有效值;否则为 <code>false</code>。
 *
 * @example
 * if (!Cesium.IndexDatatype.validate(indexDatatype)) {
 *   throw new Cesium.DeveloperError('indexDatatype must be a valid value.');
 * }
 */
IndexDatatype.validate = function (indexDatatype) {
  return (
    defined(indexDatatype) &&
    (indexDatatype === IndexDatatype.UNSIGNED_BYTE ||
      indexDatatype === IndexDatatype.UNSIGNED_SHORT ||
      indexDatatype === IndexDatatype.UNSIGNED_INT)
  );
};

/**
 * 使用 <code><Uint16Array</code> 创建将存储索引的类型化数组
 * 或 <code>Uint32Array</code>，具体取决于顶点的数量。
 *
 * @param {number} numberOfVertices 索引将引用的顶点数。
 * @param {number|Array} indicesLengthOrArray 传递给类型化数组构造函数。
 * @returns {Uint16Array|Uint32Array} 使用 <code>indicesLengthOrArray</code> 构造的 <code>Uint16Array</code> 或 <code>Uint32Array</code>。
 *
 * @example
 * this.indices = Cesium.IndexDatatype.createTypedArray(positions.length / 3, numberOfIndices);
 */
IndexDatatype.createTypedArray = function (
  numberOfVertices,
  indicesLengthOrArray
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(numberOfVertices)) {
    throw new DeveloperError("numberOfVertices is required.");
  }
  //>>includeEnd('debug');

  if (numberOfVertices >= CesiumMath.SIXTY_FOUR_KILOBYTES) {
    return new Uint32Array(indicesLengthOrArray);
  }

  return new Uint16Array(indicesLengthOrArray);
};

/**
 * 从源数组缓冲区创建类型化数组。 生成的类型化数组将使用 <code><Uint16Array</code> 存储索引
 * 或 <code>Uint32Array</code>，具体取决于顶点的数量。
 *
 * @param {number} numberOfVertices 索引将引用的顶点数。
 * @param {ArrayBuffer} sourceArray 传递给类型化数组构造函数。
 * @param {number} byteOffset 传递给类型化数组构造函数。
 * @param {number} length 传递给类型化数组构造函数。
 * @returns {Uint16Array|Uint32Array} 使用 <code>sourceArray</code>、<code>byteOffset</code> 和 <code>length</code> 构造的 <code>Uint16Array</code> 或 <code>Uint32Array</code>。
 *
 */
IndexDatatype.createTypedArrayFromArrayBuffer = function (
  numberOfVertices,
  sourceArray,
  byteOffset,
  length
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(numberOfVertices)) {
    throw new DeveloperError("numberOfVertices is required.");
  }
  if (!defined(sourceArray)) {
    throw new DeveloperError("sourceArray is required.");
  }
  if (!defined(byteOffset)) {
    throw new DeveloperError("byteOffset is required.");
  }
  //>>includeEnd('debug');

  if (numberOfVertices >= CesiumMath.SIXTY_FOUR_KILOBYTES) {
    return new Uint32Array(sourceArray, byteOffset, length);
  }

  return new Uint16Array(sourceArray, byteOffset, length);
};

/**
 * 获取提供的 TypedArray 实例的 {@link IndexDatatype}。
 *
 * @param {Uint8Array|Uint16Array|uint32Array} array 类型化数组。
 * @returns {IndexDatatype} 所提供数组的 IndexDatatype，如果数组不是 Uint8Array、Uint16Array 或 Uint32Array，则为 undefined。
 */
IndexDatatype.fromTypedArray = function (array) {
  if (array instanceof Uint8Array) {
    return IndexDatatype.UNSIGNED_BYTE;
  }
  if (array instanceof Uint16Array) {
    return IndexDatatype.UNSIGNED_SHORT;
  }
  if (array instanceof Uint32Array) {
    return IndexDatatype.UNSIGNED_INT;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "array must be a Uint8Array, Uint16Array, or Uint32Array."
  );
  //>>includeEnd('debug');
};

export default Object.freeze(IndexDatatype);
