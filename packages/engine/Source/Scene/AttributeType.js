import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix2 from "../Core/Matrix2.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";

/**
 * 描述 glTF 和 3D 瓦片的属性类型的枚举。
 *
 * @enum {string}
 *
 * @private
 */
const AttributeType = {
  /**
   * 该属性是单个组件。
   *
   * @type {string}
   * @constant
   */
  SCALAR: "SCALAR",

  /**
   * 该属性是一个双分量向量。
   *
   * @type {string}
   * @constant
   */
  VEC2: "VEC2",

  /**
   * 该属性是一个三分量向量。
   *
   * @type {string}
   * @constant
   */
  VEC3: "VEC3",

  /**
   * 该属性是一个四分量向量。
   *
   * @type {string}
   * @constant
   */
  VEC4: "VEC4",

  /**
   * 属性是一个 2x2 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT2: "MAT2",

  /**
   * 属性为 3x3 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT3: "MAT3",

  /**
   * 属性为 4x4 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT4: "MAT4",
};

/**
 * 获取属性类型的标量、向量或矩阵类型。
 *
 * @param {AttributeType} attributeType 属性类型。
 * @returns {*} 数学类型。
 *
 * @private
 */
AttributeType.getMathType = function (attributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
      return Number;
    case AttributeType.VEC2:
      return Cartesian2;
    case AttributeType.VEC3:
      return Cartesian3;
    case AttributeType.VEC4:
      return Cartesian4;
    case AttributeType.MAT2:
      return Matrix2;
    case AttributeType.MAT3:
      return Matrix3;
    case AttributeType.MAT4:
      return Matrix4;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("attributeType is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 获取每个属性的组件数。
 *
 * @param {AttributeType} attributeType 属性类型。
 * @returns {number} 组件的数量。
 *
 * @private
 */
AttributeType.getNumberOfComponents = function (attributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
      return 1;
    case AttributeType.VEC2:
      return 2;
    case AttributeType.VEC3:
      return 3;
    case AttributeType.VEC4:
    case AttributeType.MAT2:
      return 4;
    case AttributeType.MAT3:
      return 9;
    case AttributeType.MAT4:
      return 16;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("attributeType is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 获取适合此属性所需的属性位置数。最
 * 类型需要一个属性位置，但矩阵需要多个属性位置。
 *
 * @param {AttributeType} attributeType 属性类型。
 * @returns {number} 着色器中所需的属性位置数
 *
 * @private
 */
AttributeType.getAttributeLocationCount = function (attributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
    case AttributeType.VEC2:
    case AttributeType.VEC3:
    case AttributeType.VEC4:
      return 1;
    case AttributeType.MAT2:
      return 2;
    case AttributeType.MAT3:
      return 3;
    case AttributeType.MAT4:
      return 4;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("attributeType is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 获取属性类型的 GLSL 类型。
 *
 * @param {AttributeType} attributeType 属性类型。
 * @returns {string} 属性类型的 GLSL 类型。
 *
 * @private
 */
AttributeType.getGlslType = function (attributeType) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("attributeType", attributeType);
  //>>includeEnd('debug');

  switch (attributeType) {
    case AttributeType.SCALAR:
      return "float";
    case AttributeType.VEC2:
      return "vec2";
    case AttributeType.VEC3:
      return "vec3";
    case AttributeType.VEC4:
      return "vec4";
    case AttributeType.MAT2:
      return "mat2";
    case AttributeType.MAT3:
      return "mat3";
    case AttributeType.MAT4:
      return "mat4";
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("attributeType is not a valid value.");
    //>>includeEnd('debug');
  }
};

export default Object.freeze(AttributeType);
