import Check from "../Core/Check.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix2 from "../Core/Matrix2.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";

/**
 * 元数据值的一个实例。<br>
 * <br>
 * 这可以是以下类型之一：
 * <ul>
 *   <li><code>number</code> 用于类型 <code>SCALAR</code> 和非 <code>INT64</code> 或 <code>UINT64</code> 的数值组件类型</li>
 *   <li><code>bigint</code> 用于类型 <code>SCALAR</code> 和组件类型 <code>INT64</code> 或 <code>UINT64</code></li>
 *   <li><code>string</code> 用于类型 <code>STRING</code> 或 <code>ENUM</code></li>
 *   <li><code>boolean</code> 用于类型 <code>BOOLEAN</code></li>
 *   <li><code>Cartesian2</code> 用于类型 <code>VEC2</code></li>
 *   <li><code>Cartesian3</code> 用于类型 <code>VEC3</code></li>
 *   <li><code>Cartesian4</code> 用于类型 <code>VEC4</code></li>
 *   <li><code>Matrix2</code> 用于类型 <code>MAT2</code></li>
 *   <li><code>Matrix3</code> 用于类型 <code>MAT3</code></li>
 *   <li><code>Matrix4</code> 用于类型 <code>MAT4</code></li>
 *   <li>当元数据值是数组时，这些类型的数组</li>
 * </ul>
 * @typedef {(number|bigint|string|boolean|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|number[]|bigint[]|string[]|boolean[]|Cartesian2[]|Cartesian3[]|Cartesian4[]|Matrix2[]|Matrix3[]|Matrix4[])} MetadataValue
 */

/**
 * 元数据类型的枚举。这些元数据类型是容器，包含一个或多个 {@link MetadataComponentType} 类型的组件
 *
 * @enum {string}
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
const MetadataType = {
  /**
   * 单个组件
   *
   * @type {string}
   * @constant
   */
  SCALAR: "SCALAR",
  /**
   * 包含两个分量的向量
   *
   * @type {string}
   * @constant
   */
  VEC2: "VEC2",
  /**
   * 包含三个分量的向量
   *
   * @type {string}
   * @constant
   */
  VEC3: "VEC3",
  /**
   * 包含四个分量的向量
   *
   * @type {string}
   * @constant
   */
  VEC4: "VEC4",
  /**
   * 2x2 矩阵，以列主序格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT2: "MAT2",
  /**
   * 3x3 矩阵，以列主序格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT3: "MAT3",
  /**
   * 4x4 矩阵，以列主序格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT4: "MAT4",
  /**
   * 布尔值 (true/false)
   *
   * @type {string}
   * @constant
   */
  BOOLEAN: "BOOLEAN",
  /**
   * UTF-8 编码的字符串值
   *
   * @type {string}
   * @constant
   */
  STRING: "STRING",
  /**
   * 枚举值。此类型与 {@link MetadataEnum} 结合使用以描述有效值。
   *
   * @see MetadataEnum
   *
   * @type {string}
   * @constant
   */
  ENUM: "ENUM",
};

/**
 * Check if a type is VEC2, VEC3 or VEC4
 *
 * @param {MetadataType} type The type
 * @return {boolean} <code>true</code> if the type is a vector, <code>false</code> otherwise
 * @private
 */
MetadataType.isVectorType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.VEC2:
    case MetadataType.VEC3:
    case MetadataType.VEC4:
      return true;
    default:
      return false;
  }
};

/**
 * Check if a type is MAT2, MAT3 or MAT4
 *
 * @param {MetadataType} type The type
 * @return {boolean} <code>true</code> if the type is a matrix, <code>false</code> otherwise
 * @private
 */
MetadataType.isMatrixType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.MAT2:
    case MetadataType.MAT3:
    case MetadataType.MAT4:
      return true;
    default:
      return false;
  }
};

/**
 * Get the number of components for a vector or matrix type. e.g.
 * a VECN returns N, and a MATN returns N*N. All other types return 1.
 *
 * @param {MetadataType} type The type to get the component count for
 * @return {number} The number of components
 * @private
 */
MetadataType.getComponentCount = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.SCALAR:
    case MetadataType.STRING:
    case MetadataType.ENUM:
    case MetadataType.BOOLEAN:
      return 1;
    case MetadataType.VEC2:
      return 2;
    case MetadataType.VEC3:
      return 3;
    case MetadataType.VEC4:
      return 4;
    case MetadataType.MAT2:
      return 4;
    case MetadataType.MAT3:
      return 9;
    case MetadataType.MAT4:
      return 16;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid metadata type ${type}`);
    //>>includeEnd('debug');
  }
};

/**
 * Get the corresponding vector or matrix class. This is used to simplify
 * packing and unpacking code.
 * @param {MetadataType} type The metadata type
 * @return {object} The appropriate CartesianN class for vector types, MatrixN class for matrix types, or undefined otherwise.
 * @private
 */
MetadataType.getMathType = function (type) {
  switch (type) {
    case MetadataType.VEC2:
      return Cartesian2;
    case MetadataType.VEC3:
      return Cartesian3;
    case MetadataType.VEC4:
      return Cartesian4;
    case MetadataType.MAT2:
      return Matrix2;
    case MetadataType.MAT3:
      return Matrix3;
    case MetadataType.MAT4:
      return Matrix4;
    default:
      return undefined;
  }
};

Object.freeze(MetadataType);

export default MetadataType;
