import Check from "../../Core/Check.js";
import defined from "../../Core/defined.js";
import Cartesian2 from "../../Core/Cartesian2.js";
import Cartesian3 from "../../Core/Cartesian3.js";
import Cartesian4 from "../../Core/Cartesian4.js";
import DeveloperError from "../../Core/DeveloperError.js";
import ComponentDatatype from "../../Core/ComponentDatatype.js";
import AttributeCompression from "../../Core/AttributeCompression.js";
import IndexDatatype from "../../Core/IndexDatatype.js";
import PrimitiveType from "../../Core/PrimitiveType.js";
import Matrix4 from "../../Core/Matrix4.js";
import Quaternion from "../../Core/Quaternion.js";
import Transforms from "../../Core/Transforms.js";

import AttributeType from "../AttributeType.js";
import InstanceAttributeSemantic from "../InstanceAttributeSemantic.js";
import VertexAttributeSemantic from "../VertexAttributeSemantic.js";
import ModelUtility from "./ModelUtility.js";

/**
 * A class for reading the data from a <code>ModelComponents.Attribute</code>.
 *
 * NOTE: Much of the functionality here already exists, scattered in many places.
 * In most cases, the functionality is tailored for "one case" (like only handling
 * positions, or only normals, or not considering quantization, or not handling
 * interleaved buffers, ...). In many cases, the functionality is tailored for an
 * 'accessor' (and often, the functions also expect the 'gltf' to be given).
 * Most of what is done here (and in the existing functions) is pretty low-level
 * and generic, though: The functions could often be fed with some (count, type,
 * componentType), and there could be convenience functions that EITHER take these
 * values from an 'accessor' OR from an 'attribute'. The tl;dr: Large parts of
 * this could be "nicer", or "more generic", and "better" along all dimensions
 * of this term. Just give me time...
 *
 * NOTE: The fact that all this has to operate on TypedArray is unfortunate.
 * Most of the subsequent processing could operate on some abstraction of
 * that. The fact that that TypedArrays can be read/written as "bulk", and
 * then offer access that is "as efficient as it can be" could be a
 * justification, as part of the performance-genericity trade-off
 *
 * NOTE: All this does not properly handle MATn types. There should be SOME
 * abstraction for element- and component-wise access of the data. See
 * https://github.com/javagl/JglTF/blob/84ce6d019fec3b75b6af1649bbe834005b2c620f/jgltf-model/src/main/java/de/javagl/jgltf/model/AbstractAccessorData.java#L149
 *
 * @private
 */
class ModelReader {
  /**
   * 将给定的属性数据读取到类型化数组中。
   *
   * 这将把数据读取到一个紧凑的扁平数组中，其数据类型与属性的数据类型相对应。
   *
   * 如果属性存储在交错缓冲区中，或者被标记为"归一化"、量化或八进制编码，
   * 那么它将被去交错，应用归一化，并根据需要进行去量化和八进制解码。
   *
   * 结果将是实际的属性数据。
   *
   * @param {Attribute} attribute 属性
   * @returns {TypedArray} 属性数据
   */
  static readAttributeAsTypedArray(attribute) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("attribute", attribute);
    //>>includeEnd('debug');

    // Obtain a compact (non-interleaved) typed array that contains
    // the components.
    const compactTypedArray =
      ModelReader.readAttributeAsRawCompactTypedArray(attribute);

    // If the attribute is not normalized and the data is not quantized
    // and not normalized, then this can be returned directly
    const normalized = attribute.normalized;
    const quantization = attribute.quantization;
    if (!defined(quantization) && !normalized) {
      return compactTypedArray;
    }

    const elementType = attribute.type;
    const elementCount = attribute.count;

    // If the attribute is normalized, normalize the data from
    // the typed array
    let normalizedTypedArray = compactTypedArray;
    if (normalized) {
      // Note that although this is called "dequantize", it does
      // not really "dequantize" based on the quantization. It only
      // performs the conversion from the (normalized) integer
      // component types into floating point.
      normalizedTypedArray = AttributeCompression.dequantize(
        compactTypedArray,
        attribute.componentDatatype,
        elementType,
        elementCount,
      );
    }

    if (!defined(quantization)) {
      return normalizedTypedArray;
    }
    // Now, this one actually DOES dequantize...
    const dequantizedTypedArray = ModelReader.dequantize(
      normalizedTypedArray,
      elementCount,
      elementType,
      quantization,
    );
    return dequantizedTypedArray;
  }

  /**
   * 将给定属性的数据读取到紧凑的类型化数组中。
   *
   * 如果属性存储为交错数据，则结果将是去交错后的数据。如果数据被量化或
   * 归一化，则结果数据将是"原始"数据，不应用归一化或去量化。
   *
   * @param {ModelComponents.Attribute} attribute 属性
   * @returns {TypedArray} 原始属性数据
   */
  static readAttributeAsRawCompactTypedArray(attribute) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("attribute", attribute);
    //>>includeEnd('debug');

    const elementType = attribute.type;
    const elementCount = attribute.count;

    const componentsPerElement =
      AttributeType.getNumberOfComponents(elementType);
    const totalComponentCount = elementCount * componentsPerElement;

    // If the data is quantized, use the quantized component type
    let componentType = attribute.componentDatatype;
    const quantization = attribute.quantization;
    if (defined(quantization)) {
      componentType = quantization.componentDatatype;
    }
    const buffer = attribute.buffer;

    // If the byte stride is the default (i.e. the total element size),
    // then just fetch the whole buffer data into a typed array of the
    // desired target type, and return it
    const byteOffset = attribute.byteOffset;
    const byteStride = attribute.byteStride;
    const bytesPerComponent = ComponentDatatype.getSizeInBytes(componentType);
    const defaultByteStride = componentsPerElement * bytesPerComponent;

    const isDefaultStride =
      !defined(byteStride) || byteStride === defaultByteStride;
    const hasTypedArray = defined(attribute.typedArray);

    // If in-memory — return as-is
    // Important: typedArray is already tightly-packed on creation (See: ModelComponents.typedArray and GltfLoader.getPackedTypedArray)
    //            byteOffset and byteStride should thus be ignored
    if (hasTypedArray) {
      return attribute.typedArray;
    }

    // Non-interleaved — copy from typedArray or read from GPU
    if (isDefaultStride) {
      const typedArray = ComponentDatatype.createTypedArray(
        componentType,
        totalComponentCount,
      );
      buffer.getBufferData(typedArray, byteOffset);
      return typedArray;
    }

    // Fetch the whole buffer in its raw form, to pick out the
    // interleaved values.
    // Note: When ALL attributes have to be fetched from an
    // interleaved buffer, then this getBufferData call will
    // be performed multiple times. It would be preferable to
    // have ONE "TypedArray[] getThemFrom(buffer)" call that
    // returns all of the (interleaved) attributes at once,
    // but this requires abstractions that we don't have.

    // Read back from GPU if not available in memory
    const fullTypedArray = new Uint8Array(buffer.sizeInBytes);
    buffer.getBufferData(fullTypedArray);

    // Read the components of each element, and write them into
    // a typed array in a compact form
    const compactTypedArray = ComponentDatatype.createTypedArray(
      componentType,
      totalComponentCount,
    );
    const elementByteStride = byteStride ?? defaultByteStride;
    const dataView = new DataView(
      fullTypedArray.buffer,
      fullTypedArray.byteOffset,
      fullTypedArray.byteLength,
    );
    const components = new Array(componentsPerElement);
    const componentsReader = ModelReader.createComponentsReader(componentType);
    for (let i = 0; i < elementCount; ++i) {
      const elementByteOffset = byteOffset + i * elementByteStride;
      componentsReader(
        dataView,
        elementByteOffset,
        componentsPerElement,
        components,
      );
      for (let j = 0; j < componentsPerElement; ++j) {
        compactTypedArray[i * componentsPerElement + j] = components[j];
      }
    }
    return compactTypedArray;
  }

  /**
   * 根据给定的量化信息，对输入数组中的数据进行去量化，并返回结果。
   *
   * 这假设归一化已经应用。这意味着当 <code>quantization.normalized</code>
   * 标志为 <code>true</code> 时，输入将被视为包含在 [-1, 1] 范围内的浮点值。
   *
   * @param {TypedArray} quantizedTypedArray 量化后的类型化数组
   * @param {number} elementCount 元素数量
   * @param {AttributeType} elementType 元素类型
   * @param {ModelComponents.Quantization} quantization 量化信息
   * @returns {TypedArray} 结果
   * @throws DeveloperError 当元素类型不是 SCALAR、VEC2、VEC3 或 VEC4 时
   */
  static dequantize(
    quantizedTypedArray,
    elementCount,
    elementType,
    quantization,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.defined("elementType", elementType);
    Check.defined("quantization", quantization);
    //>>includeEnd('debug');

    if (quantization.octEncoded) {
      const dequantizedTypedArray = ModelReader.octDecode(
        quantizedTypedArray,
        elementCount,
        quantization.normalizationRange,
        undefined,
      );
      if (quantization.octEncodedZXY) {
        ModelReader.convertZxyToXyz(
          dequantizedTypedArray,
          dequantizedTypedArray,
        );
      }
      return dequantizedTypedArray;
    }

    // These could be generalized, if the offset/stepSize were not
    // CartesianX objects, but arrays...
    const stepSize = quantization.quantizedVolumeStepSize;
    const offset = quantization.quantizedVolumeOffset;
    if (elementType === AttributeType.SCALAR) {
      return ModelReader.dequantize1D(
        quantizedTypedArray,
        elementCount,
        stepSize,
        offset,
        undefined,
      );
    }
    if (elementType === AttributeType.VEC2) {
      return ModelReader.dequantize2D(
        quantizedTypedArray,
        elementCount,
        stepSize,
        offset,
        undefined,
      );
    }
    if (elementType === AttributeType.VEC3) {
      return ModelReader.dequantize3D(
        quantizedTypedArray,
        elementCount,
        stepSize,
        offset,
        undefined,
      );
    }
    if (elementType === AttributeType.VEC4) {
      return ModelReader.dequantize4D(
        quantizedTypedArray,
        elementCount,
        stepSize,
        offset,
        undefined,
      );
    }
    throw new DeveloperError(
      `Element type for dequantization must be SCALAR, VEC2, VEC3, or VEC4, but is ${elementType}`,
    );
  }

  /**
   * 从给定输入中解码八进制编码的法线，并将结果写入给定输出，
   * 如果结果为 undefined 则分配并返回一个新数组。
   *
   * 这将对输入的三个分量分别应用 <code>AttributeCompression.octDecodeInRange</code> 函数。
   *
   * @param {TypedArray} quantizedTypedArray 输入
   * @param {number} elementCount 元素数量
   * @param {number} normalizationRange 归一化范围
   * @param {TypedArray} [dequantizedTypedArray] 结果
   * @returns {TypedArray} 结果
   */
  static octDecode(
    quantizedTypedArray,
    elementCount,
    normalizationRange,
    dequantizedTypedArray,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.typeOf.number.greaterThan(
      "normalizationRange",
      normalizationRange,
      0,
    );
    //>>includeEnd('debug');

    if (!defined(dequantizedTypedArray)) {
      dequantizedTypedArray = new Float32Array(quantizedTypedArray.length);
    }
    const c = new Cartesian3();
    for (let i = 0; i < elementCount; i++) {
      Cartesian3.unpack(quantizedTypedArray, i * 3, c);
      AttributeCompression.octDecodeInRange(c.x, c.y, normalizationRange, c);
      Cartesian3.pack(c, dequantizedTypedArray, i * 3);
    }
    return dequantizedTypedArray;
  }

  /**
   * 将给定输入数组中的每三个连续元素从 (z, x, y) 转换为 (x, y, z)，
   * 并将结果写入给定输出数组，如果输出数组为 undefined 则创建一个新数组。
   *
   * @param {TypedArray} input 输入
   * @param {number} elementCount 元素数量
   * @param {TypedArray} [output] 结果
   * @returns {TypedArray} 结果
   */
  static convertZxyToXyz(input, elementCount, output) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("input", input);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    //>>includeEnd('debug');

    if (!defined(output)) {
      output = new Float32Array(input.length);
    }
    let offset = 0;
    for (let i = 0; i < elementCount; i++, offset += 3) {
      const z = input[offset + 0];
      const x = input[offset + 1];
      const y = input[offset + 2];
      output[offset + 0] = x;
      output[offset + 1] = y;
      output[offset + 2] = z;
    }
    return output;
  }

  /**
   * 根据给定的量化信息对给定的量化数组进行去量化，并将结果写入给定的输出数组，
   * 如果输出数组为 undefined 则创建它。
   *
   * 这将简单地用以下方式填充输出数组：
   * <code>output[i] = input[i] * stepSize + offset</code>
   *
   * @param {TypedArray} quantizedTypedArray 量化数组
   * @param {number} elementCount 元素数量
   * @param {number} stepSize 量化步长
   * @param {number} offset 量化偏移
   * @param {TypedArray} [dequantizedTypedArray] 结果
   * @returns {TypedArray} 结果
   */
  static dequantize1D(
    quantizedTypedArray,
    elementCount,
    stepSize,
    offset,
    dequantizedTypedArray,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.defined("stepSize", stepSize);
    Check.defined("offset", offset);
    //>>includeEnd('debug');

    if (!defined(dequantizedTypedArray)) {
      dequantizedTypedArray = new Float32Array(quantizedTypedArray.length);
    }
    for (let i = 0; i < elementCount; i++) {
      const q = quantizedTypedArray[i];
      const d = q * stepSize + offset;
      dequantizedTypedArray[i] = d;
    }
    return dequantizedTypedArray;
  }

  /**
   * 根据给定的量化信息对给定的量化数组进行去量化，并将结果写入给定的输出数组，
   * 如果输出数组为 undefined 则创建它。
   *
   * 当将输入和输出解释为 Cartesian2 数组时，这将简单地用以下方式填充输出数组：
   * <code>output[i] = input[i] * stepSize + offset</code>
   *
   * @param {TypedArray} quantizedTypedArray 量化数组
   * @param {number} elementCount 元素数量
   * @param {Cartesian2} stepSize 量化步长
   * @param {Cartesian2} offset 量化偏移
   * @param {TypedArray} [dequantizedTypedArray] 结果
   * @returns {TypedArray} 结果
   */
  static dequantize2D(
    quantizedTypedArray,
    elementCount,
    stepSize,
    offset,
    dequantizedTypedArray,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.defined("stepSize", stepSize);
    Check.defined("offset", offset);
    //>>includeEnd('debug');

    if (!defined(dequantizedTypedArray)) {
      dequantizedTypedArray = new Float32Array(quantizedTypedArray.length);
    }
    const c = new Cartesian2();
    for (let i = 0; i < elementCount; i++) {
      Cartesian2.unpack(quantizedTypedArray, i * 2, c);
      Cartesian2.multiplyComponents(c, stepSize, c);
      Cartesian2.add(c, offset, c);
      Cartesian2.pack(c, dequantizedTypedArray, i * 2);
    }
    return dequantizedTypedArray;
  }

  /**
   * 根据给定的量化信息对给定的量化数组进行去量化，并将结果写入给定的输出数组，
   * 如果输出数组为 undefined 则创建它。
   *
   * 当将输入和输出解释为 Cartesian3 数组时，这将简单地用以下方式填充输出数组：
   * <code>output[i] = input[i] * stepSize + offset</code>
   *
   * @param {TypedArray} quantizedTypedArray 量化数组
   * @param {number} elementCount 元素数量
   * @param {Cartesian3} stepSize 量化步长
   * @param {Cartesian3} offset 量化偏移
   * @param {TypedArray} [dequantizedTypedArray] 结果
   * @returns {TypedArray} 结果
   */
  static dequantize3D(
    quantizedTypedArray,
    elementCount,
    stepSize,
    offset,
    dequantizedTypedArray,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.defined("stepSize", stepSize);
    Check.defined("offset", offset);
    //>>includeEnd('debug');

    if (!defined(dequantizedTypedArray)) {
      dequantizedTypedArray = new Float32Array(quantizedTypedArray.length);
    }
    const c = new Cartesian3();
    for (let i = 0; i < elementCount; i++) {
      Cartesian3.unpack(quantizedTypedArray, i * 3, c);
      Cartesian3.multiplyComponents(c, stepSize, c);
      Cartesian3.add(c, offset, c);
      Cartesian3.pack(c, dequantizedTypedArray, i * 3);
    }
    return dequantizedTypedArray;
  }

  /**
   * 根据给定的量化信息对给定的量化数组进行去量化，并将结果写入给定的输出数组，
   * 如果输出数组为 undefined 则创建它。
   *
   * 当将输入和输出解释为 Cartesian4 数组时，这将简单地用以下方式填充输出数组：
   * <code>output[i] = input[i] * stepSize + offset</code>
   *
   * @param {TypedArray} quantizedTypedArray 量化数组
   * @param {number} elementCount 元素数量
   * @param {Cartesian4} stepSize 量化步长
   * @param {Cartesian4} offset 量化偏移
   * @param {TypedArray} [dequantizedTypedArray] 结果
   * @returns {TypedArray} 结果
   */
  static dequantize4D(
    quantizedTypedArray,
    elementCount,
    stepSize,
    offset,
    dequantizedTypedArray,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("quantizedTypedArray", quantizedTypedArray);
    Check.typeOf.number.greaterThanOrEquals("elementCount", elementCount, 0);
    Check.defined("stepSize", stepSize);
    Check.defined("offset", offset);
    //>>includeEnd('debug');

    if (!defined(dequantizedTypedArray)) {
      dequantizedTypedArray = new Float32Array(quantizedTypedArray.length);
    }
    const c = new Cartesian4();
    for (let i = 0; i < elementCount; i++) {
      Cartesian4.unpack(quantizedTypedArray, i * 4, c);
      Cartesian4.multiplyComponents(c, stepSize, c);
      Cartesian4.add(c, offset, c);
      Cartesian4.pack(c, dequantizedTypedArray, i * 4);
    }
    return dequantizedTypedArray;
  }

  /**
   * 以 little-endian 顺序从数据视图的给定字节偏移处读取并返回具有给定类型的值
   * @callback ComponentsReaderCallback
   * @param {DataView} dataView 二进制缓冲区的类型化数据视图
   * @param {number} byteOffset 从视图起始位置开始读取数据的偏移量（以字节为单位）
   * @param {number} numberOfComponents 要读取的分量数量
   * @param {number[]} result 用于读取结果的数组
   */

  /**
   * 创建一个函数，以 little-endian 顺序从给定的数据视图中读取指定数量的
   * 具有给定类型的分量，并将它们写入给定的结果数组。
   *
   * @param {ComponentDatatype} componentType 分量类型
   * @returns {ComponentsReaderCallback} 读取器
   */
  static createComponentsReader(componentType) {
    const componentReader = ModelReader.createComponentReader(componentType);
    const sizeInBytes = ComponentDatatype.getSizeInBytes(componentType);
    return function (dataView, byteOffset, numberOfComponents, result) {
      let offset = byteOffset;
      for (let i = 0; i < numberOfComponents; ++i) {
        result[i] = componentReader(dataView, offset);
        offset += sizeInBytes;
      }
    };
  }

  /**
   * 以 little-endian 顺序从数据视图的给定字节偏移处读取并返回具有给定类型的值
   * @callback ComponentReaderCallback
   * @param {DataView} dataView 二进制缓冲区的类型化数据视图
   * @param {number} byteOffset 从视图起始位置开始读取数据的偏移量（以字节为单位）
   * @returns {number|BigInt} 从 dataView 读取的值
   */

  /**
   * 创建一个函数，以 little-endian 顺序从数据视图的给定字节偏移处
   * 读取并返回具有给定类型的值
   * @param {ComponentDatatype} componentType 分量类型
   * @returns {ComponentReaderCallback} 读取器
   */
  static createComponentReader(componentType) {
    switch (componentType) {
      case ComponentDatatype.BYTE:
        return function (dataView, byteOffset) {
          return dataView.getInt8(byteOffset);
        };
      case ComponentDatatype.UNSIGNED_BYTE:
        return function (dataView, byteOffset) {
          return dataView.getUint8(byteOffset);
        };
      case ComponentDatatype.SHORT:
        return function (dataView, byteOffset) {
          return dataView.getInt16(byteOffset, true);
        };
      case ComponentDatatype.UNSIGNED_SHORT:
        return function (dataView, byteOffset) {
          return dataView.getUint16(byteOffset, true);
        };
      case ComponentDatatype.INT:
        return function (dataView, byteOffset) {
          return dataView.getInt32(byteOffset, true);
        };
      case ComponentDatatype.UNSIGNED_INT:
        return function (dataView, byteOffset) {
          return dataView.getUint32(byteOffset, true);
        };
      case ComponentDatatype.FLOAT:
        return function (dataView, byteOffset) {
          return dataView.getFloat32(byteOffset, true);
        };
      case ComponentDatatype.DOUBLE:
        return function (dataView, byteOffset) {
          return dataView.getFloat64(byteOffset, true);
        };
    }
    throw new DeveloperError(
      `The componentType must be a valid ComponentDatatype, but is ${componentType}`,
    );
  }

  /**
   * 使用给定的 4x4 矩阵变换给定数组的元素，将每三个连续元素
   * 解释为一个 3D 点，并将结果写入给定的结果数组，
   * 如果结果数组为 undefined 则创建它。
   *
   * @param {TypedArray} input 输入数组
   * @param {Matrix4} matrix 矩阵
   * @param {TypedArray} [result] 结果
   * @returns {TypedArray} 结果
   */
  static transform3D(input, matrix, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("input", input);
    Check.defined("matrix", matrix);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Float32Array(input.length);
    }
    const c = new Cartesian3();
    const elementCount = input.length / 3;
    for (let i = 0; i < elementCount; i++) {
      Cartesian3.unpack(input, i * 3, c);
      Matrix4.multiplyByPoint(matrix, c, c);
      Cartesian3.pack(c, result, i * 3);
    }
    return result;
  }

  /**
   * 从隐式范围要素 ID 集合中读取要素 ID 到类型化数组中。
   *
   * 为每个顶点使用 <code>offset + Math.floor(i / repeat)</code> 生成值。
   * 如果 <code>repeat</code> 为 undefined，则所有值都设置为 <code>offset</code>。
   *
   * @param {FeatureIdImplicitRange} featureIdSet 隐式范围要素 ID 集合。
   * @param {object} attributeOwner 具有 <code>attributes</code> 数组的对象
   *   （图元或实例对象）
   * @returns {Float32Array} 生成的要素 ID 值。
   */
  static readImplicitRangeAsTypedArray(featureIdSet, attributeOwner) {
    const count = attributeOwner.attributes[0]?.count ?? 0;
    const offset = featureIdSet.offset;
    const repeat = featureIdSet.repeat;
    const typedArray = new Float32Array(count);
    if (defined(repeat)) {
      for (let i = 0; i < count; i++) {
        typedArray[i] = offset + Math.floor(i / repeat);
      }
    } else {
      typedArray.fill(offset);
    }
    return typedArray;
  }

  /**
   * 从给定的图元索引中读取索引值，并以类型化数组形式返回。
   *
   * 如果给定对象已有 <code>typedArray</code> 属性，则假定其包含正确的索引，直接返回。
   *
   * 否则，将从给定图元索引对象的 <code>buffer</code> 中读取数据，
   * 转换为与 <code>indexDataType</code> 匹配的类型化数组并返回。
   *
   * 调用方不得修改返回的类型化数组。
   *
   * @param {ModelComponents.Indices} primitiveIndices 图元索引
   * @returns {TypedArray} 索引值
   * @throws {DeveloperError} 如果给定对象的 <code>indexDataType</code>
   * 既不是 <code>UNSIGNED_BYTE</code>、<code>UNSIGNED_SHORT</code>，
   * 也不是 <code>UNSIGNED_INT</code>
   */
  static readIndicesAsTypedArray(primitiveIndices) {
    const existingIndices = primitiveIndices.typedArray;
    if (defined(existingIndices)) {
      return existingIndices;
    }
    const indicesBuffer = primitiveIndices.buffer;
    const indicesCount = primitiveIndices.count;
    const indexDatatype = primitiveIndices.indexDatatype;
    const indices = ModelReader.createIndexTypedArray(
      indexDatatype,
      indicesCount,
    );
    indicesBuffer.getBufferData(indices);
    return indices;
  }

  /**
   * 从给定的图元索引对象中读取索引值，并以三角形顶点索引的类型化数组形式返回。
   *
   * 如果给定的图元类型是 <code>TRIANGLES</code>，则索引值将从给定对象中读取并返回。
   *
   * 如果图元类型是 <code>TRIANGLE_STRIP</code> 或 <code>TRIANGLE_FAN</code>，
   * 则原始索引值将被读取，转换为三角形索引（即其等效的 <code>TRIANGLES</code> 表示），
   * 并返回结果。
   *
   * 返回数组的类型将与给定对象的 <code>indexDataType</code> 匹配。
   *
   * 调用方不得修改返回的类型化数组。
   *
   * @param {ModelComponents.Indices} primitiveIndices 图元索引
   * @returns {TypedArray} 索引，必要时转换为三角形索引
   * @throws {DeveloperError} 如果给定对象的 <code>indexDataType</code>
   * 既不是 <code>UNSIGNED_BYTE</code>、<code>UNSIGNED_SHORT</code>，
   * 也不是 <code>UNSIGNED_INT</code>，或者给定的 <code>primitiveType</code>
   * 既不是 <code>TRIANGLES</code>、<code>TRIANGLE_STRIP</code>，
   * 也不是 <code>TRIANGLE_FAN</code>
   */
  static readIndicesAsTriangleIndicesTypedArray(
    primitiveIndices,
    primitiveType,
  ) {
    const originalIndices =
      ModelReader.readIndicesAsTypedArray(primitiveIndices);
    if (primitiveType === PrimitiveType.TRIANGLES) {
      return originalIndices;
    }
    if (primitiveType === PrimitiveType.TRIANGLE_STRIP) {
      const triangleIndices =
        ModelReader.convertTriangleStripToTriangleIndices(originalIndices);
      return triangleIndices;
    }
    if (primitiveType === PrimitiveType.TRIANGLE_FAN) {
      const triangleIndices =
        ModelReader.convertTriangleFanToTriangleIndices(originalIndices);
      return triangleIndices;
    }
    throw new DeveloperError(
      `The primitiveType must be TRIANGLES (${PrimitiveType.TRIANGLES}, ` +
        `TRIANGLE_STRIP (${PrimitiveType.TRIANGLE_STRIP}, or ` +
        `TRIANGLE_FAN (${PrimitiveType.TRIANGLE_FAN}, but is ${primitiveType}`,
    );
  }

  /**
   * 将给定索引从 <code>TRIANGLE_STRIP</code> 表示形式
   * 转换为 <code>TRIANGLES</code> 表示形式，并返回结果。
   *
   * 结果类型将与输入数组的类型相同。
   *
   * @param {TypedArray} indices 输入索引
   * @returns {TypedArray} 结果三角形索引
   */
  static convertTriangleStripToTriangleIndices(indices) {
    const triangleIndices = indices.constructor((indices.length - 2) * 3);
    for (let i = 0; i < indices.length - 2; i++) {
      if (i % 2 === 1) {
        triangleIndices[i * 3 + 0] = indices[i + 0];
        triangleIndices[i * 3 + 1] = indices[i + 2];
        triangleIndices[i * 3 + 2] = indices[i + 1];
      } else {
        triangleIndices[i * 3 + 0] = indices[i + 0];
        triangleIndices[i * 3 + 1] = indices[i + 1];
        triangleIndices[i * 3 + 2] = indices[i + 2];
      }
    }
    return triangleIndices;
  }

  /**
   * 将给定索引从 <code>TRIANGLE_FAN</code> 表示形式
   * 转换为 <code>TRIANGLES</code> 表示形式，并返回结果。
   *
   * 结果类型将与输入数组的类型相同。
   *
   * @param {TypedArray} indices 输入索引
   * @returns {TypedArray} 结果三角形索引
   */
  static convertTriangleFanToTriangleIndices(indices) {
    const triangleIndices = indices.constructor((indices.length - 2) * 3);
    for (let i = 0; i < indices.length - 2; i++) {
      triangleIndices[i * 3 + 0] = indices[i + 0];
      triangleIndices[i * 3 + 1] = indices[i + 1];
      triangleIndices[i * 3 + 2] = indices[i + 2];
    }
    return triangleIndices;
  }

  /**
   * 创建与给定索引数据类型和大小匹配的类型化数组。
   *
   * @param {number} indexDatatype <code>IndexDataType</code>
   * @param {number} size 要创建的数组的大小
   * @returns {TypedArray} 类型化数组
   * @throws {DeveloperError} 如果 <code>indexDataType</code> 既不是
   * <code>UNSIGNED_BYTE</code>、<code>UNSIGNED_SHORT</code>，
   * 也不是 <code>UNSIGNED_INT</code>，或者大小为负数。
   */
  static createIndexTypedArray(indexDatatype, size) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("size", size, 0);
    //>>includeEnd('debug');

    switch (indexDatatype) {
      case IndexDatatype.UNSIGNED_BYTE:
        return new Uint8Array(size);
      case IndexDatatype.UNSIGNED_SHORT:
        return new Uint16Array(size);
      case IndexDatatype.UNSIGNED_INT:
        return new Uint32Array(size);
    }
    throw new DeveloperError(
      `The indexDatatype must be UNSIGNED_BYTE (${IndexDatatype.UNSIGNED_BYTE}, ` +
        `UNSIGNED_SHORT (${IndexDatatype.UNSIGNED_SHORT}, or ` +
        `UNSIGNED_INT (${IndexDatatype.UNSIGNED_INT}, but is ${indexDatatype}`,
    );
  }

  /**
   * Per-instance data combining a transform matrix with an optional feature ID.
   *
   * @typedef {object} ModelReader.Instance
   * @property {Matrix4} transform The instance transform matrix.
   * @property {number} [featureId] The per-instance feature ID, or undefined.
   *
   * @private
   */

  /**
   * A callback invoked by {@link ModelReader.forEachPrimitive} for each
   * runtime primitive in the model.
   *
   * @callback ModelReader.ForEachPrimitiveCallback
   * @param {object} runtimePrimitive The runtime primitive wrapper.
   * @param {object} primitive The underlying model primitive (runtimePrimitive.primitive).
   * @param {ModelReader.Instance[]} instances Per-instance data (transforms and optional feature IDs).
   * @param {Matrix4} computedModelMatrix The computed model matrix for the node.
   *
   * @private
   */

  /**
   * 遍历模型场景图中的每个图元，为每个节点计算节点变换和实例变换，
   * 并为每个运行时图元调用回调。
   * <p>
   * 当提供地图投影时，计算出的模型矩阵将通过 {@link Transforms.basisTo2D} 投影到 2D。
   * </p>
   *
   * @param {Model} model 要遍历场景图的模型。
   * @param {object} [options] 包含以下属性的对象：
   * @param {MapProjection} [options.mapProjection] 2D 模式的地图投影。当定义时，计算出的模型矩阵将投影到 2D。
   * @param {string} [options.instanceFeatureIdLabel] 用于选择要读取的实例要素 ID 集的标签。当定义时，将获取每个实例的要素 ID。当未定义时，不获取要素 ID。
   * @param {ModelReader.ForEachPrimitiveCallback} callback 为每个图元调用的函数。
   */
  static forEachPrimitive(model, options, callback) {
    const mapProjection = options?.mapProjection;
    const instanceFeatureIdLabel = options?.instanceFeatureIdLabel;
    const sceneGraph = model.sceneGraph;
    if (!defined(sceneGraph)) {
      return;
    }

    const scratchNodeTransforms = {
      nodeComputedTransform: new Matrix4(),
      modelMatrix: new Matrix4(),
      computedModelMatrix: new Matrix4(),
    };

    const nodes = sceneGraph._runtimeNodes;
    const nodesLength = nodes.length;

    for (let n = 0; n < nodesLength; n++) {
      const runtimeNode = nodes[n];

      const nodeTransforms = ModelReader.computeNodeTransforms(
        runtimeNode,
        sceneGraph,
        model,
        scratchNodeTransforms,
      );

      let computedModelMatrix = nodeTransforms.computedModelMatrix;

      if (defined(mapProjection)) {
        computedModelMatrix = Transforms.basisTo2D(
          mapProjection,
          computedModelMatrix,
          computedModelMatrix,
        );
      }

      const instanceTransforms = ModelReader.computeInstanceTransforms(
        runtimeNode,
        computedModelMatrix,
        nodeTransforms.nodeComputedTransform,
        nodeTransforms.modelMatrix,
      );

      const instanceFeatureIds = defined(instanceFeatureIdLabel)
        ? ModelReader.computeInstanceFeatureIds(
            runtimeNode,
            instanceFeatureIdLabel,
          )
        : undefined;

      const instances = [];
      for (let i = 0; i < instanceTransforms.length; i++) {
        instances.push({
          transform: instanceTransforms[i],
          featureId: defined(instanceFeatureIds)
            ? instanceFeatureIds[i]
            : undefined,
        });
      }

      const primitivesLength = runtimeNode.runtimePrimitives.length;
      for (let p = 0; p < primitivesLength; p++) {
        const runtimePrimitive = runtimeNode.runtimePrimitives[p];
        callback(
          runtimePrimitive,
          runtimePrimitive.primitive,
          instances,
          computedModelMatrix,
        );
      }
    }
  }

  /**
   * 计算运行时节点的模型矩阵，考虑实例化
   * 和世界空间变换。
   *
   * @param {object} runtimeNode 运行时节点。
   * @param {ModelSceneGraph} sceneGraph 模型场景图。
   * @param {Model} model 模型。
   * @param {object} result 包含临时矩阵的对象：{ nodeComputedTransform: Matrix4, modelMatrix: Matrix4, computedModelMatrix: Matrix4 }。
   * @returns {object} 填充了计算出的变换的 result 参数。
   *
   */
  static computeNodeTransforms(runtimeNode, sceneGraph, model, result) {
    const node = runtimeNode.node;

    let nodeComputedTransform = Matrix4.clone(
      runtimeNode.computedTransform,
      result.nodeComputedTransform,
    );
    let modelMatrix = Matrix4.clone(
      sceneGraph.computedModelMatrix,
      result.modelMatrix,
    );

    const instances = node.instances;
    if (defined(instances)) {
      if (instances.transformInWorldSpace) {
        // Replicate the multiplication order in LegacyInstancingStageVS.
        modelMatrix = Matrix4.multiplyTransformation(
          model.modelMatrix,
          sceneGraph.components.transform,
          modelMatrix,
        );
        nodeComputedTransform = Matrix4.multiplyTransformation(
          sceneGraph.axisCorrectionMatrix,
          runtimeNode.computedTransform,
          nodeComputedTransform,
        );
      }
    }

    const computedModelMatrix = Matrix4.multiplyTransformation(
      modelMatrix,
      nodeComputedTransform,
      result.computedModelMatrix,
    );

    result.computedModelMatrix = computedModelMatrix;
    result.nodeComputedTransform = nodeComputedTransform;
    result.modelMatrix = modelMatrix;
    return result;
  }

  /**
   * 为节点构建实例变换数组。
   * 如果节点未实例化，则返回仅包含
   * computedModelMatrix 的数组。
   *
   * @param {object} runtimeNode 运行时节点。
   * @param {Matrix4} computedModelMatrix 计算出的模型矩阵。
   * @param {Matrix4} nodeComputedTransform 节点计算出的变换。
   * @param {Matrix4} modelMatrix 模型矩阵。
   * @returns {Matrix4[]}
   */
  static computeInstanceTransforms(
    runtimeNode,
    computedModelMatrix,
    nodeComputedTransform,
    modelMatrix,
  ) {
    const transforms = [];
    const node = runtimeNode.node;
    const instances = node.instances;

    if (defined(instances)) {
      const transformsCount = instances.attributes[0].count;
      const instanceComponentDatatype =
        instances.attributes[0].componentDatatype;

      const transformElements = 12;
      let transformsTypedArray = runtimeNode.transformsTypedArray;

      if (!defined(transformsTypedArray)) {
        const instanceTransformsBuffer = runtimeNode.instancingTransformsBuffer;
        if (defined(instanceTransformsBuffer)) {
          transformsTypedArray = ComponentDatatype.createTypedArray(
            instanceComponentDatatype,
            transformsCount * transformElements,
          );
          instanceTransformsBuffer.getBufferData(transformsTypedArray);
        }
      }

      if (defined(transformsTypedArray)) {
        ModelReader.computeInstanceTransformsFromTypedArray(
          transformsTypedArray,
          transformsCount,
          transforms,
        );
      } else {
        ModelReader.computeInstanceTransformsFromAttributes(
          instances,
          transformsCount,
          transforms,
        );
      }

      for (let i = 0; i < transforms.length; i++) {
        const transform = transforms[i];
        if (instances.transformInWorldSpace) {
          Matrix4.multiplyTransformation(
            transform,
            nodeComputedTransform,
            transform,
          );
          Matrix4.multiplyTransformation(modelMatrix, transform, transform);
        } else {
          Matrix4.multiplyTransformation(
            computedModelMatrix,
            transform,
            transform,
          );
        }
      }
    }

    if (transforms.length === 0) {
      transforms.push(computedModelMatrix);
    }

    return transforms;
  }

  /**
   * 为节点构建每个实例的要素 ID 数组。
   * 如果节点未实例化或没有匹配的要素 ID 集，
   * 则返回 <code>undefined</code>。
   *
   * @param {object} runtimeNode 运行时节点。
   * @param {string} instanceFeatureIdLabel 用于选择要素 ID 集的标签。
   * @returns {number[]|undefined} 每个实例的要素 ID，或 undefined。
   */
  static computeInstanceFeatureIds(runtimeNode, instanceFeatureIdLabel) {
    const node = runtimeNode.node;
    const instances = node.instances;

    if (!defined(instances)) {
      return undefined;
    }

    const featureIdSet = ModelUtility.getFeatureIdsByLabel(
      instances.featureIds,
      instanceFeatureIdLabel,
    );

    if (!defined(featureIdSet)) {
      return undefined;
    }

    let typedArray;

    // Case: FeatureIdAttribute
    if ("setIndex" in featureIdSet) {
      const attribute = ModelUtility.getAttributeBySemantic(
        instances,
        VertexAttributeSemantic.FEATURE_ID,
        featureIdSet.setIndex,
      );
      if (defined(attribute)) {
        typedArray = ModelReader.readAttributeAsTypedArray(attribute);
      }
    }

    // Case: FeatureIdImplicitRange
    if ("offset" in featureIdSet) {
      typedArray = ModelReader.readImplicitRangeAsTypedArray(
        featureIdSet,
        instances,
      );
    }

    if (!defined(typedArray)) {
      return undefined;
    }

    const featureIds = new Array(typedArray.length);
    for (let i = 0; i < typedArray.length; i++) {
      featureIds[i] = typedArray[i];
    }
    return featureIds;
  }

  /**
   * 从打包的类型化数组构建实例变换，其中每个实例
   * 存储为 12 个浮点数（3 行 4 列，行主序）。
   *
   * @param {TypedArray} transformsTypedArray 打包的变换数组。
   * @param {number} count 实例数量。
   * @param {Matrix4[]} transforms 用于推入变换的输出数组。
   */
  static computeInstanceTransformsFromTypedArray(
    transformsTypedArray,
    count,
    transforms,
  ) {
    const transformElements = 12;
    for (let i = 0; i < count; i++) {
      const index = i * transformElements;

      const transform = new Matrix4(
        transformsTypedArray[index],
        transformsTypedArray[index + 1],
        transformsTypedArray[index + 2],
        transformsTypedArray[index + 3],
        transformsTypedArray[index + 4],
        transformsTypedArray[index + 5],
        transformsTypedArray[index + 6],
        transformsTypedArray[index + 7],
        transformsTypedArray[index + 8],
        transformsTypedArray[index + 9],
        transformsTypedArray[index + 10],
        transformsTypedArray[index + 11],
        0,
        0,
        0,
        1,
      );

      transforms.push(transform);
    }
  }

  /**
   * 当没有可用的打包 transformsTypedArray 时，
   * 从单独的 TRANSLATION、ROTATION 和 SCALE 属性构建实例变换。
   *
   * @param {object} instances 实例对象。
   * @param {number} count 实例数量。
   * @param {Matrix4[]} transforms 用于推入变换的输出数组。
   */
  static computeInstanceTransformsFromAttributes(instances, count, transforms) {
    const translationAttribute = ModelUtility.getAttributeBySemantic(
      instances,
      InstanceAttributeSemantic.TRANSLATION,
    );
    const rotationAttribute = ModelUtility.getAttributeBySemantic(
      instances,
      InstanceAttributeSemantic.ROTATION,
    );
    const scaleAttribute = ModelUtility.getAttributeBySemantic(
      instances,
      InstanceAttributeSemantic.SCALE,
    );

    const hasTranslation = defined(translationAttribute);
    const hasRotation = defined(rotationAttribute);
    const hasScale = defined(scaleAttribute);

    if (!hasTranslation && !hasRotation && !hasScale) {
      return;
    }

    let translationTypedArray, rotationTypedArray, scaleTypedArray;
    if (hasTranslation) {
      translationTypedArray =
        ModelReader.readAttributeAsRawCompactTypedArray(translationAttribute);
    }
    if (hasRotation) {
      rotationTypedArray =
        ModelReader.readAttributeAsRawCompactTypedArray(rotationAttribute);
    }
    if (hasScale) {
      scaleTypedArray =
        ModelReader.readAttributeAsRawCompactTypedArray(scaleAttribute);
    }

    for (let i = 0; i < count; i++) {
      const translation = hasTranslation
        ? new Cartesian3(
            translationTypedArray[i * 3],
            translationTypedArray[i * 3 + 1],
            translationTypedArray[i * 3 + 2],
          )
        : Cartesian3.ZERO;

      const rotation = hasRotation
        ? new Quaternion(
            rotationTypedArray[i * 4],
            rotationTypedArray[i * 4 + 1],
            rotationTypedArray[i * 4 + 2],
            rotationTypedArray[i * 4 + 3],
          )
        : Quaternion.IDENTITY;

      const scale = hasScale
        ? new Cartesian3(
            scaleTypedArray[i * 3],
            scaleTypedArray[i * 3 + 1],
            scaleTypedArray[i * 3 + 2],
          )
        : Cartesian3.ONE;

      const transform = Matrix4.fromTranslationQuaternionRotationScale(
        translation,
        rotation,
        scale,
        new Matrix4(),
      );

      transforms.push(transform);
    }
  }
}

export default ModelReader;
