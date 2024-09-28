import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import ComponentDatatype from "./ComponentDatatype.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import AttributeType from "../Scene/AttributeType.js";

const RIGHT_SHIFT = 1.0 / 256.0;
const LEFT_SHIFT = 256.0;

/**
 * 属性压缩和解压缩功能。
 *
 * @namespace AttributeCompression
 *
 * @private
 */
const AttributeCompression = {};

/**
 * 将一个归一化向量按照'oct'编码方式编码为[0-rangeMax]范围内的2个SNORM值。
 *
 * Oct编码是单位长度向量的紧凑表示。
 * 'oct'编码见'独立单位向量的有效表示概览'。
 * Cigolle等人2014:{@link http://jcgt.org/published/0003/02/01/}
 *
 * @param {Cartesian3} vector 归一化的向量被压缩成2分量的“oct”编码。
 * @param {Cartesian2} result 2分量的八进制编码单位长度向量。
 * @param {number} rangeMax SNORM范围的最大值。编码的向量以log2(rangeMax+1)位存储。
 * @returns {Cartesian2} 2分量的八进制编码单位长度向量。
 *
 * @exception {DeveloperError} vector must be normalized.
 *
 * @see AttributeCompression.octDecodeInRange
 */
AttributeCompression.octEncodeInRange = function (vector, rangeMax, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("vector", vector);
  Check.defined("result", result);
  const magSquared = Cartesian3.magnitudeSquared(vector);
  if (Math.abs(magSquared - 1.0) > CesiumMath.EPSILON6) {
    throw new DeveloperError("vector must be normalized.");
  }
  //>>includeEnd('debug');

  result.x =
    vector.x / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));
  result.y =
    vector.y / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));
  if (vector.z < 0) {
    const x = result.x;
    const y = result.y;
    result.x = (1.0 - Math.abs(y)) * CesiumMath.signNotZero(x);
    result.y = (1.0 - Math.abs(x)) * CesiumMath.signNotZero(y);
  }

  result.x = CesiumMath.toSNorm(result.x, rangeMax);
  result.y = CesiumMath.toSNorm(result.y, rangeMax);

  return result;
};

/**
 * 将一个归一化向量按照'oct'编码方式编码为2个范围为[0-255]的SNORM值。
 *
 * @param {Cartesian3} vector 被压缩成2字节'oct'编码的归一化向量。
 * @param {Cartesian2} result 2字节的八进制编码的单位长度向量。
 * @returns {Cartesian2} 2字节的八进制编码的单位长度向量。
 *
 * @exception {DeveloperError} vector must be normalized.
 *
 * @see AttributeCompression.octEncodeInRange
 * @see AttributeCompression.octDecode
 */
AttributeCompression.octEncode = function (vector, result) {
  return AttributeCompression.octEncodeInRange(vector, 255, result);
};

const octEncodeScratch = new Cartesian2();
const uint8ForceArray = new Uint8Array(1);
function forceUint8(value) {
  uint8ForceArray[0] = value;
  return uint8ForceArray[0];
}
/**
 * @param {Cartesian3} vector 被压缩成4字节'oct'编码的归一化向量。
 * @param {Cartesian4} result 被压缩成4字节'oct'编码的归一化向量。
 * @returns {Cartesian4} 被压缩成4字节'oct'编码的归一化向量。
 *
 * @exception {DeveloperError} vector must be normalized.
 *
 * @see AttributeCompression.octEncodeInRange
 * @see AttributeCompression.octDecodeFromCartesian4
 */
AttributeCompression.octEncodeToCartesian4 = function (vector, result) {
  AttributeCompression.octEncodeInRange(vector, 65535, octEncodeScratch);
  result.x = forceUint8(octEncodeScratch.x * RIGHT_SHIFT);
  result.y = forceUint8(octEncodeScratch.x);
  result.z = forceUint8(octEncodeScratch.y * RIGHT_SHIFT);
  result.w = forceUint8(octEncodeScratch.y);
  return result;
};

/**
 * 将'oct'编码的单位长度向量解码为标准化的三分量向量。
 *
 * @param {number} x 八进制编码的单位长度向量的x分量。
 * @param {number} y 八进制编码的单位长度向量的y分量。
 * @param {number} rangeMax SNORM范围的最大值。编码的向量以log2(rangeMax+1)位存储。
 * @param {Cartesian3} result 解码和归一化的向量
 * @returns {Cartesian3} 解码和归一化的向量.
 *
 * @exception {DeveloperError} 解码和归一化的向量
 *
 * @see AttributeCompression.octEncodeInRange
 */
AttributeCompression.octDecodeInRange = function (x, y, rangeMax, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("result", result);
  if (x < 0 || x > rangeMax || y < 0 || y > rangeMax) {
    throw new DeveloperError(
      `x and y must be unsigned normalized integers between 0 and ${rangeMax}`,
    );
  }
  //>>includeEnd('debug');

  result.x = CesiumMath.fromSNorm(x, rangeMax);
  result.y = CesiumMath.fromSNorm(y, rangeMax);
  result.z = 1.0 - (Math.abs(result.x) + Math.abs(result.y));

  if (result.z < 0.0) {
    const oldVX = result.x;
    result.x = (1.0 - Math.abs(result.y)) * CesiumMath.signNotZero(oldVX);
    result.y = (1.0 - Math.abs(oldVX)) * CesiumMath.signNotZero(result.y);
  }

  return Cartesian3.normalize(result, result);
};

/**
 * 将2字节'oct'编码的单位长度向量解码为标准化的三分量向量。
 *
 * @param {number} x 八进制编码的单位长度向量的x分量。
 * @param {number} y 八进制编码的单位长度向量的y分量。
 * @param {Cartesian3} result 解码和归一化的向量.
 * @returns {Cartesian3} 解码和归一化的向量.
 *
 * @exception {DeveloperError} x and y must be an unsigned normalized integer between 0 and 255.
 *
 * @see AttributeCompression.octDecodeInRange
 */
AttributeCompression.octDecode = function (x, y, result) {
  return AttributeCompression.octDecodeInRange(x, y, 255, result);
};

/**
 * 将4字节'oct'编码的单位长度向量解码为标准化的三分量向量。
 *
 * @param {Cartesian4} encoded 八进制编码的单位长度向量。
 * @param {Cartesian3} result 解码和归一化的向量.
 * @returns {Cartesian3} 解码和归一化的向量.
 *
 * @exception {DeveloperError} x, y, z, and w must be unsigned normalized integers between 0 and 255.
 *
 * @see AttributeCompression.octDecodeInRange
 * @see AttributeCompression.octEncodeToCartesian4
 */
AttributeCompression.octDecodeFromCartesian4 = function (encoded, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("encoded", encoded);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');
  const x = encoded.x;
  const y = encoded.y;
  const z = encoded.z;
  const w = encoded.w;
  //>>includeStart('debug', pragmas.debug);
  if (
    x < 0 ||
    x > 255 ||
    y < 0 ||
    y > 255 ||
    z < 0 ||
    z > 255 ||
    w < 0 ||
    w > 255
  ) {
    throw new DeveloperError(
      "x, y, z, and w must be unsigned normalized integers between 0 and 255",
    );
  }
  //>>includeEnd('debug');

  const xOct16 = x * LEFT_SHIFT + y;
  const yOct16 = z * LEFT_SHIFT + w;
  return AttributeCompression.octDecodeInRange(xOct16, yOct16, 65535, result);
};

/**
 * 将oct编码的向量打包成单个浮点数。
 *
 * @param {Cartesian2} encoded oct编码向量。
 * @returns {number} 将oct编码的向量打包成单个浮点数。
 *
 */
AttributeCompression.octPackFloat = function (encoded) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("encoded", encoded);
  //>>includeEnd('debug');
  return 256.0 * encoded.x + encoded.y;
};

const scratchEncodeCart2 = new Cartesian2();

/**
 * 将一个归一化向量编码为2个范围为[0-255]的SNORM值，后面跟着'oct'编码和
 * 将这些值存储在单个浮点数中。
 *
 * @param {Cartesian3} vector 被压缩成2字节'oct'编码的归一化向量。
 * @returns {number} 2字节的八进制编码的单位长度向量。
 *
 * @exception {DeveloperError} vector must be normalized.
 */
AttributeCompression.octEncodeFloat = function (vector) {
  AttributeCompression.octEncode(vector, scratchEncodeCart2);
  return AttributeCompression.octPackFloat(scratchEncodeCart2);
};

/**
 * 将以浮点数封装的'oct'编码的单位长度向量解码为标准化的三分量向量。
 *
 * @param {number} value 该字节编码的单元长度向量作为一个浮点数存储。
 * @param {Cartesian3} result 解码和归一化的向量
 * @returns {Cartesian3} 解码和归一化的向量.
 *
 */
AttributeCompression.octDecodeFloat = function (value, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("value", value);
  //>>includeEnd('debug');

  const temp = value / 256.0;
  const x = Math.floor(temp);
  const y = (temp - x) * 256.0;

  return AttributeCompression.octDecode(x, y, result);
};

/**
 * 将三个规范化向量编码为6个SNORM值，范围为[0-255]，后面跟着'oct'编码和
 * 将它们打包成两个浮点数。
 *
 * @param {Cartesian3} v1 要压缩的归一化向量。
 * @param {Cartesian3} v2 要压缩的归一化向量。
 * @param {Cartesian3} v3 要压缩的归一化向量。
 * @param {Cartesian2} result 'oct'编码的向量被打包成两个浮点数。
 * @returns {Cartesian2} 'oct'编码的向量被打包成两个浮点数。
 *
 */
AttributeCompression.octPack = function (v1, v2, v3, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("v1", v1);
  Check.defined("v2", v2);
  Check.defined("v3", v3);
  Check.defined("result", result);
  //>>includeEnd('debug');

  const encoded1 = AttributeCompression.octEncodeFloat(v1);
  const encoded2 = AttributeCompression.octEncodeFloat(v2);

  const encoded3 = AttributeCompression.octEncode(v3, scratchEncodeCart2);
  result.x = 65536.0 * encoded3.x + encoded1;
  result.y = 65536.0 * encoded3.y + encoded2;
  return result;
};

/**
 * 将'oct'编码中的三个单位长度向量解码成一个浮点数，以标准化的三分量向量。
 *
 * @param {Cartesian2} packed 将三个八进制编码的单位长度向量存储为两个浮点数。
 * @param {Cartesian3} v1 一个解码和标准化的向量。
 * @param {Cartesian3} v2 一个解码和标准化的向量。
 * @param {Cartesian3} v3 一个解码和标准化的向量。
 */
AttributeCompression.octUnpack = function (packed, v1, v2, v3) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("packed", packed);
  Check.defined("v1", v1);
  Check.defined("v2", v2);
  Check.defined("v3", v3);
  //>>includeEnd('debug');

  let temp = packed.x / 65536.0;
  const x = Math.floor(temp);
  const encodedFloat1 = (temp - x) * 65536.0;

  temp = packed.y / 65536.0;
  const y = Math.floor(temp);
  const encodedFloat2 = (temp - y) * 65536.0;

  AttributeCompression.octDecodeFloat(encodedFloat1, v1);
  AttributeCompression.octDecodeFloat(encodedFloat2, v2);
  AttributeCompression.octDecode(x, y, v3);
};

/**
 * 将纹理坐标打包到单个浮动中。纹理坐标将只保留12位精度。
 *
 * @param {Cartesian2} textureCoordinates 要压缩的纹理坐标。两个坐标都必须在0.0-1.0的范围内。
 * @returns {number} 填充的纹理坐标。
 */
AttributeCompression.compressTextureCoordinates = function (
  textureCoordinates,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("textureCoordinates", textureCoordinates);
  //>>includeEnd('debug');

  // Move x and y to the range 0-4095;
  const x = (textureCoordinates.x * 4095.0) | 0;
  const y = (textureCoordinates.y * 4095.0) | 0;
  return 4096.0 * x + y;
};

/**
 * 解压打包到单个float中的纹理坐标。
 *
 * @param {number} compressed 压缩的纹理坐标。
 * @param {Cartesian2} result 解压后的纹理坐标。
 * @returns {Cartesian2} 修改后的结果参数。
 *
 */
AttributeCompression.decompressTextureCoordinates = function (
  compressed,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("compressed", compressed);
  Check.defined("result", result);
  //>>includeEnd('debug');

  const temp = compressed / 4096.0;
  const xZeroTo4095 = Math.floor(temp);
  result.x = xZeroTo4095 / 4095.0;
  result.y = (compressed - xZeroTo4095 * 4096) / 4095;
  return result;
};

function zigZagDecode(value) {
  return (value >> 1) ^ -(value & 1);
}

/**
 * 解码三角和之字形编码顶点。这将修改现有的缓冲区。
 *
 * @param {Uint16Array} uBuffer u值的缓冲区视图。
 * @param {Uint16Array} vBuffer v值的缓冲区视图。
 * @param {Uint16Array} [heightBuffer] 高度值的缓冲视图。
 *
 * @see {@link https://github.com/CesiumGS/quantized-mesh|quantized-mesh-1.0 terrain format}
 */
AttributeCompression.zigZagDeltaDecode = function (
  uBuffer,
  vBuffer,
  heightBuffer,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("uBuffer", uBuffer);
  Check.defined("vBuffer", vBuffer);
  Check.typeOf.number.equals(
    "uBuffer.length",
    "vBuffer.length",
    uBuffer.length,
    vBuffer.length,
  );
  if (defined(heightBuffer)) {
    Check.typeOf.number.equals(
      "uBuffer.length",
      "heightBuffer.length",
      uBuffer.length,
      heightBuffer.length,
    );
  }
  //>>includeEnd('debug');

  const count = uBuffer.length;

  let u = 0;
  let v = 0;
  let height = 0;

  for (let i = 0; i < count; ++i) {
    u += zigZagDecode(uBuffer[i]);
    v += zigZagDecode(vBuffer[i]);

    uBuffer[i] = u;
    vBuffer[i] = v;

    if (defined(heightBuffer)) {
      height += zigZagDecode(heightBuffer[i]);
      heightBuffer[i] = height;
    }
  }
};

/**
 * 将量子化类型数组解量化为浮点类型数组。
 *
 * @see {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data}
 *
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array} typedArray 量化数据的类型化数组。
 * @param {ComponentDatatype} componentDatatype 量化数据的成分数据类型。
 * @param {AttributeType} type 量化数据的属性类型。
 * @param {number} count 去量化数组中引用的属性数。
 *
 * @returns {Float32Array} 去量子化阵列。
 */
AttributeCompression.dequantize = function (
  typedArray,
  componentDatatype,
  type,
  count,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("typedArray", typedArray);
  Check.defined("componentDatatype", componentDatatype);
  Check.defined("type", type);
  Check.defined("count", count);
  //>>includeEnd('debug');

  const componentsPerAttribute = AttributeType.getNumberOfComponents(type);

  let divisor;
  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      divisor = 127.0;
      break;
    case ComponentDatatype.UNSIGNED_BYTE:
      divisor = 255.0;
      break;
    case ComponentDatatype.SHORT:
      divisor = 32767.0;
      break;
    case ComponentDatatype.UNSIGNED_SHORT:
      divisor = 65535.0;
      break;
    case ComponentDatatype.INT:
      divisor = 2147483647.0;
      break;
    case ComponentDatatype.UNSIGNED_INT:
      divisor = 4294967295.0;
      break;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(
        `Cannot dequantize component datatype: ${componentDatatype}`,
      );
    //>>includeEnd('debug');
  }

  const dequantizedTypedArray = new Float32Array(
    count * componentsPerAttribute,
  );

  for (let i = 0; i < count; i++) {
    for (let j = 0; j < componentsPerAttribute; j++) {
      const index = i * componentsPerAttribute + j;
      dequantizedTypedArray[index] = Math.max(
        typedArray[index] / divisor,
        -1.0,
      );
    }
  }

  return dequantizedTypedArray;
};

/**
 * 将rgb565编码的颜色解码为浮点类型数组，其中包含
 * 标准化的RGB值。
 *
 * @param {Uint16Array} typedArray RGB565值的数组
 * @param {Float32Array} [result] 数组来存储规范化的VEC3结果
 */
AttributeCompression.decodeRGB565 = function (typedArray, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("typedArray", typedArray);

  const expectedLength = typedArray.length * 3;
  if (defined(result)) {
    Check.typeOf.number.equals(
      "result.length",
      "typedArray.length * 3",
      result.length,
      expectedLength,
    );
  }
  //>>includeEnd('debug');

  const count = typedArray.length;
  if (!defined(result)) {
    result = new Float32Array(count * 3);
  }

  const mask5 = (1 << 5) - 1;
  const mask6 = (1 << 6) - 1;
  const normalize5 = 1.0 / 31.0;
  const normalize6 = 1.0 / 63.0;
  for (let i = 0; i < count; i++) {
    const value = typedArray[i];
    const red = value >> 11;
    const green = (value >> 5) & mask6;
    const blue = value & mask5;

    const offset = 3 * i;
    result[offset] = red * normalize5;
    result[offset + 1] = green * normalize6;
    result[offset + 2] = blue * normalize5;
  }

  return result;
};

export default AttributeCompression;
