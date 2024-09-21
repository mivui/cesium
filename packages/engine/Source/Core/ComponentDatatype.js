import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import WebGLConstants from "./WebGLConstants.js";

/**
 * WebGL 组件数据类型。 组件是 intrinsic，
 * 哪些形式属性，哪些形式顶点。
 *
 * @enum {number}
 */
const ComponentDatatype = {
  /**
   * 对应的8位带符号字节 <code>gl.BYTE</code> 还有类型
   * 元素的 <code>Int8Array</code>.
   *
   * @type {number}
   * @constant
   */
  BYTE: WebGLConstants.BYTE,

  /**
   * 8-bit unsigned byte对应 <code>UNSIGNED_BYTE</code> 和类型
   * 元素的 <code>Uint8Array</code>.
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_BYTE: WebGLConstants.UNSIGNED_BYTE,

  /**
   * 16-bit signed short 对应<code>SHORT</code> 和类型
   * 元素的 <code>Int16Array</code>.
   *
   * @type {number}
   * @constant
   */
  SHORT: WebGLConstants.SHORT,

  /**
   * 16-bit unsigned short 对应 <code>UNSIGNED_SHORT</code> 和类型
   * 元素的 <code>Uint16Array</code>.
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_SHORT: WebGLConstants.UNSIGNED_SHORT,

  /**
   * 32-bit signed int 对应 <code>INT</code> 和类型
   * 元素的 <code>Int32Array</code>.
   *
   * @memberOf ComponentDatatype
   *
   * @type {number}
   * @constant
   */
  INT: WebGLConstants.INT,

  /**
   * 32-bit unsigned int 对应 <code>UNSIGNED_INT</code> 和类型
   * 元素的 <code>Uint32Array</code>.
   *
   * @memberOf ComponentDatatype
   *
   * @type {number}
   * @constant
   */
  UNSIGNED_INT: WebGLConstants.UNSIGNED_INT,

  /**
   * 32-bit 浮点型 对应 <code>FLOAT</code> 和类型
   * 元素的 <code>Float32Array</code>.
   *
   * @type {number}
   * @constant
   */
  FLOAT: WebGLConstants.FLOAT,

  /**
   * 64 位浮点对应 <code>gl.DOUBLE</code>（在桌面 OpenGL 中;
   * 这在 WebGL 中不受支持，在 Cesium 中通过 {@link GeometryPipeline.encodeAttribute} 进行模拟）
   * 和类型 元素的 <code>Float64Array</code>.
   *
   * @memberOf ComponentDatatype
   *
   * @type {number}
   * @constant
   * @default 0x140A
   */
  DOUBLE: WebGLConstants.DOUBLE,
};

/**
 * 返回相应数据类型的大小 （以字节为单位）。
 *
 * @param {ComponentDatatype} componentDatatype 要获取其大小的组件数据类型。
 * @returns {number} 大小（以字节为单位）。
 *
 * @exception {DeveloperError} componentDatatype 不是有效值。
 *
 * @example
 * // Returns Int8Array.BYTES_PER_ELEMENT
 * const size = Cesium.ComponentDatatype.getSizeInBytes(Cesium.ComponentDatatype.BYTE);
 */
ComponentDatatype.getSizeInBytes = function (componentDatatype) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return Int8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.SHORT:
      return Int16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.INT:
      return Int32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.FLOAT:
      return Float32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.DOUBLE:
      return Float64Array.BYTES_PER_ELEMENT;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 获取提供的 TypedArray 实例的 {@link ComponentDatatype}。
 *
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} array 类型化数组。
 * @returns {ComponentDatatype} 提供的数组的 ComponentDatatype，如果数组不是 TypedArray，则为 undefined。
 */
ComponentDatatype.fromTypedArray = function (array) {
  if (array instanceof Int8Array) {
    return ComponentDatatype.BYTE;
  }
  if (array instanceof Uint8Array) {
    return ComponentDatatype.UNSIGNED_BYTE;
  }
  if (array instanceof Int16Array) {
    return ComponentDatatype.SHORT;
  }
  if (array instanceof Uint16Array) {
    return ComponentDatatype.UNSIGNED_SHORT;
  }
  if (array instanceof Int32Array) {
    return ComponentDatatype.INT;
  }
  if (array instanceof Uint32Array) {
    return ComponentDatatype.UNSIGNED_INT;
  }
  if (array instanceof Float32Array) {
    return ComponentDatatype.FLOAT;
  }
  if (array instanceof Float64Array) {
    return ComponentDatatype.DOUBLE;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "array must be an Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, or Float64Array."
  );
  //>>includeEnd('debug');
};

/**
 * 验证提供的组件数据类型是否为有效的 {@link ComponentDatatype}
 *
 * @param {ComponentDatatype} componentDatatype 要验证的组件数据类型。
 * @returns {boolean} <code>true</code>，如果提供的组件数据类型是有效值;否则为 <code>false</code>。
 *
 * @example
 * if (!Cesium.ComponentDatatype.validate(componentDatatype)) {
 *   throw new Cesium.DeveloperError('componentDatatype must be a valid value.');
 * }
 */
ComponentDatatype.validate = function (componentDatatype) {
  return (
    defined(componentDatatype) &&
    (componentDatatype === ComponentDatatype.BYTE ||
      componentDatatype === ComponentDatatype.UNSIGNED_BYTE ||
      componentDatatype === ComponentDatatype.SHORT ||
      componentDatatype === ComponentDatatype.UNSIGNED_SHORT ||
      componentDatatype === ComponentDatatype.INT ||
      componentDatatype === ComponentDatatype.UNSIGNED_INT ||
      componentDatatype === ComponentDatatype.FLOAT ||
      componentDatatype === ComponentDatatype.DOUBLE)
  );
};

/**
 * 创建类型化数组对应的 component 数据类型。
 *
 * @param {ComponentDatatype} componentDatatype 组件数据类型。
 * @param {number|Array} valuesOrLength 要创建的数组或数组的长度。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} 类型化数组。
 *
 * @exception {DeveloperError} componentDatatype is not a valid value.
 *
 * @example
 * // creates a Float32Array with length of 100
 * const typedArray = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 100);
 */
ComponentDatatype.createTypedArray = function (
  componentDatatype,
  valuesOrLength
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("componentDatatype is required.");
  }
  if (!defined(valuesOrLength)) {
    throw new DeveloperError("valuesOrLength is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(valuesOrLength);
    case ComponentDatatype.SHORT:
      return new Int16Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(valuesOrLength);
    case ComponentDatatype.INT:
      return new Int32Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(valuesOrLength);
    case ComponentDatatype.FLOAT:
      return new Float32Array(valuesOrLength);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(valuesOrLength);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 创建字节数组的类型化视图。
 *
 * @param {ComponentDatatype} componentDatatype 要创建的视图的类型。
 * @param {ArrayBuffer} buffer 用于视图的缓冲区存储。
 * @param {number} [byteOffset] 视图中第一个元素的偏移量（以字节为单位）。
 * @param {number} [length] 视图中的元素数。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} 缓冲区的类型化数组视图。
 *
 * @exception {DeveloperError} componentDatatype is not a valid value.
 */
ComponentDatatype.createArrayBufferView = function (
  componentDatatype,
  buffer,
  byteOffset,
  length
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("componentDatatype is required.");
  }
  if (!defined(buffer)) {
    throw new DeveloperError("buffer is required.");
  }
  //>>includeEnd('debug');

  byteOffset = defaultValue(byteOffset, 0);
  length = defaultValue(
    length,
    (buffer.byteLength - byteOffset) /
      ComponentDatatype.getSizeInBytes(componentDatatype)
  );

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(buffer, byteOffset, length);
    case ComponentDatatype.SHORT:
      return new Int16Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(buffer, byteOffset, length);
    case ComponentDatatype.INT:
      return new Int32Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(buffer, byteOffset, length);
    case ComponentDatatype.FLOAT:
      return new Float32Array(buffer, byteOffset, length);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(buffer, byteOffset, length);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 从其名称中获取 ComponentDatatype。
 *
 * @param {string} name ComponentDatatype 的名称。
 * @returns {ComponentDatatype} ComponentDatatype.
 *
 * @exception {DeveloperError} name is not a valid value.
 */
ComponentDatatype.fromName = function (name) {
  switch (name) {
    case "BYTE":
      return ComponentDatatype.BYTE;
    case "UNSIGNED_BYTE":
      return ComponentDatatype.UNSIGNED_BYTE;
    case "SHORT":
      return ComponentDatatype.SHORT;
    case "UNSIGNED_SHORT":
      return ComponentDatatype.UNSIGNED_SHORT;
    case "INT":
      return ComponentDatatype.INT;
    case "UNSIGNED_INT":
      return ComponentDatatype.UNSIGNED_INT;
    case "FLOAT":
      return ComponentDatatype.FLOAT;
    case "DOUBLE":
      return ComponentDatatype.DOUBLE;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("name is not a valid value.");
    //>>includeEnd('debug');
  }
};
export default Object.freeze(ComponentDatatype);
