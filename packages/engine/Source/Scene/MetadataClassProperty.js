import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix2 from "../Core/Matrix2.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import MetadataType from "./MetadataType.js";
import MetadataComponentType from "./MetadataComponentType.js";

/**
 * 元数据属性，作为 {@link MetadataClass} 的一部分。
 * <p>
 * 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata|3D 元数据规范} 了解 3D 瓦片
 * </p>
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.id 属性的 ID。
 * @param {MetadataType} options.type 属性的类型，例如 SCALAR、VEC2、VEC3。
 * @param {MetadataComponentType} [options.componentType] 属性的组件类型。这包括整数（例如 INT8 或 UINT16）和浮点（FLOAT32 和 FLOAT64）值。
 * @param {MetadataEnum} [options.enumType] 属性的枚举类型。仅当 type 为 ENUM 时定义。
 * @param {boolean} [options.isArray=false] 如果属性是数组（固定长度或可变长度），则为 True，否则为 false。
 * @param {boolean} [options.isVariableLengthArray=false] 如果属性是可变长度数组，则为 True， 否则为 false。
 * @param {number} [options.arrayLength] 数组元素的数量。仅针对固定长度数组定义。
 * @param {boolean} [options.normalized=false] 属性是否被归一化。
 * @param {number|number[]|number[][]} [options.min] 一个数字或一个数字数组，存储此属性的最小允许值。仅当 type 为数字类型时定义。
 * @param {number|number[]|number[][]} [options.max] 存储此属性的最大允许值的数字或数字数组。仅当 type 为数字类型时定义。
 * @param {number|number[]|number[][]} [options.offset] 作为值转换的一部分要添加到属性值的偏移量。
 * @param {number|number[]|number[][]} [options.scale] 作为值转换的一部分，要乘以属性值的比例。
 * @param {boolean|number|string|Array} [options.noData] 表示 null 值的 no-data sentinel 值。
 * @param {boolean|number|string|Array} [options.default] 未定义实体的属性值时使用的默认值。
 * @param {boolean} [options.required=false] 属性是否为必填项。
 * @param {string} [options.name] 属性的名称。
 * @param {string} [options.description] 属性的描述。
 * @param {string} [options.semantic] 描述应如何解释此属性的标识符。
 * @param {*} [options.extras] 额外的用户定义属性。
 * @param {object} [options.extensions] 包含扩展的对象。
 *
 * @alias MetadataClassProperty
 * @constructor
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function MetadataClassProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const id = options.id;
  const type = options.type;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.id", id);
  Check.typeOf.string("options.type", type);
  //>>includeEnd('debug');

  const componentType = options.componentType;
  const enumType = options.enumType;

  const normalized =
    defined(componentType) &&
    MetadataComponentType.isIntegerType(componentType) &&
    defaultValue(options.normalized, false);

  // Basic information about this property
  this._id = id;
  this._name = options.name;
  this._description = options.description;
  this._semantic = options.semantic;

  // Only for unit testing purposes, not documented in the API
  this._isLegacyExtension = options.isLegacyExtension;

  // Details about basic types
  this._type = type;
  this._componentType = componentType;
  this._enumType = enumType;
  this._valueType = defined(enumType) ? enumType.valueType : componentType;

  // Details about arrays
  this._isArray = defaultValue(options.isArray, false);
  this._isVariableLengthArray = defaultValue(
    options.isVariableLengthArray,
    false,
  );
  this._arrayLength = options.arrayLength;

  // min and max allowed values
  this._min = clone(options.min, true);
  this._max = clone(options.max, true);

  // properties that adjust the range of metadata values
  this._normalized = normalized;

  let offset = clone(options.offset, true);
  let scale = clone(options.scale, true);
  const hasValueTransform = defined(offset) || defined(scale);

  const enableNestedArrays = true;
  if (!defined(offset)) {
    offset = this.expandConstant(0, enableNestedArrays);
  }

  if (!defined(scale)) {
    scale = this.expandConstant(1, enableNestedArrays);
  }

  this._offset = offset;
  this._scale = scale;
  this._hasValueTransform = hasValueTransform;

  // sentinel value for missing data, and a default value to use
  // in its place if needed.
  this._noData = clone(options.noData, true);
  // For vector and array types, this is stored as an array of values.
  this._default = clone(options.default, true);

  this._required = defaultValue(options.required, true);

  // extras and extensions
  this._extras = clone(options.extras, true);
  this._extensions = clone(options.extensions, true);
}

/**
 * 从 3D 图块 1.1、3DTILES_metadata、EXT_structural_metadata 或 EXT_feature_metadata 创建 {@link MetadataClassProperty}。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.id The ID of the property.
 * @param {object} options.property The property JSON object.
 * @param {Object<string, MetadataEnum>} [options.enums] A dictionary of enums.
 *
 * @returns {MetadataClassProperty} The newly created metadata class property.
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
MetadataClassProperty.fromJson = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const id = options.id;
  const property = options.property;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.id", id);
  Check.typeOf.object("options.property", property);
  Check.typeOf.string("options.property.type", property.type);
  //>>includeEnd('debug');

  // Try to determine if this is the legacy extension. This is not
  // always possible, as there are some types that are valid in both
  // extensions.
  const isLegacyExtension = isLegacy(property);
  const parsedType = parseType(property, options.enums);

  // EXT_feature_metadata had an optional flag, while EXT_structural_metadata
  // has a required flag. The defaults are not the same, and there's some cases
  // like {type: BOOLEAN} that are ambiguous. Coalesce this into a single
  // required flag
  let required;
  if (!defined(isLegacyExtension)) {
    // Impossible to tell which extension was used, so don't require
    // the property
    required = false;
  } else if (isLegacyExtension) {
    required = defined(property.optional) ? !property.optional : true;
  } else {
    required = defaultValue(property.required, false);
  }

  return new MetadataClassProperty({
    id: id,
    type: parsedType.type,
    componentType: parsedType.componentType,
    enumType: parsedType.enumType,
    isArray: parsedType.isArray,
    isVariableLengthArray: parsedType.isVariableLengthArray,
    arrayLength: parsedType.arrayLength,
    normalized: property.normalized,
    min: property.min,
    max: property.max,
    offset: property.offset,
    scale: property.scale,
    noData: property.noData,
    default: property.default,
    required: required,
    name: property.name,
    description: property.description,
    semantic: property.semantic,
    extras: property.extras,
    extensions: property.extensions,
    isLegacyExtension: isLegacyExtension,
  });
};

Object.defineProperties(MetadataClassProperty.prototype, {
  /**
   * 属性的 ID。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 属性的名称。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 属性的描述。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {string}
   * @readonly
   */
  description: {
    get: function () {
      return this._description;
    },
  },

  /**
   * 属性的类型，例如 SCALAR、VEC2、VEC3
   *
   * @memberof MetadataClassProperty.prototype
   * @type {MetadataType}
   * @readonly
   */
  type: {
    get: function () {
      return this._type;
    },
  },

  /**
   * 属性的枚举类型。仅当 type 为 ENUM 时定义。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {MetadataEnum}
   * @readonly
   */
  enumType: {
    get: function () {
      return this._enumType;
    },
  },

  /**
   * 属性的组件类型。这包括 integer
   *（例如 INT8 或 UINT16）和浮点（FLOAT32 和 FLOAT64）值
   *
   * @memberof MetadataClassProperty.prototype
   * @type {MetadataComponentType}
   * @readonly
   */
  componentType: {
    get: function () {
      return this._componentType;
    },
  },

  /**
   * 用于存储属性的每个组件的数据类型。这
   * 通常与 componentType 相同，但 ENUM 除外，其中 this
   * 返回一个整数类型
   *
   * @memberof MetadataClassProperty.prototype
   * @type {MetadataComponentType}
   * @readonly
   * @private
   */
  valueType: {
    get: function () {
      return this._valueType;
    },
  },

  /**
   * 如果属性是数组（固定长度或可变长度），则为 True，
   * 否则 false 。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isArray: {
    get: function () {
      return this._isArray;
    },
  },

  /**
   * 如果属性是可变长度数组，则为 True，否则为 false。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isVariableLengthArray: {
    get: function () {
      return this._isVariableLengthArray;
    },
  },

  /**
   * 数组元素的数量。仅针对 fixed-size 定义
   * 阵列。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {number}
   * @readonly
   */
  arrayLength: {
    get: function () {
      return this._arrayLength;
    },
  },

  /**
   * 属性是否已规范化。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean}
   * @readonly
   */
  normalized: {
    get: function () {
      return this._normalized;
    },
  },

  /**
   * 一个数字或数字数组，用于存储此属性的最大允许值。仅当 type 为数字类型时定义。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {number|number[]|number[][]}
   * @readonly
   */
  max: {
    get: function () {
      return this._max;
    },
  },

  /**
   * 一个数字或数字数组，用于存储此属性的最小允许值。仅当 type 为数字类型时定义。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {number|number[]|number[][]}
   * @readonly
   */
  min: {
    get: function () {
      return this._min;
    },
  },

  /**
   * 表示 null 值的 no-data sentinel 值
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean|number|string|Array}
   * @readonly
   */
  noData: {
    get: function () {
      return this._noData;
    },
  },

  /**
   * 未定义实体的属性值时使用的默认值。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean|number|string|Array}
   * @readonly
   */
  default: {
    get: function () {
      return this._default;
    },
  },

  /**
   * 属性是否为必填项。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean}
   * @readonly
   */
  required: {
    get: function () {
      return this._required;
    },
  },

  /**
   * 描述应如何解释此属性的标识符。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {string}
   * @readonly
   */
  semantic: {
    get: function () {
      return this._semantic;
    },
  },

  /**
   * 如果应应用 offset/scale，则为 True。如果偏移/缩放均为
   * undefined，则默认为 identity，因此此属性设置为 false
   *
   * @memberof MetadataClassProperty.prototype
   * @type {boolean}
   * @readonly
   * @private
   */
  hasValueTransform: {
    get: function () {
      return this._hasValueTransform;
    },
  },

  /**
   * 作为值转换的一部分添加到属性值的偏移量。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {number|number[]|number[][]}
   * @readonly
   */
  offset: {
    get: function () {
      return this._offset;
    },
  },

  /**
   * 作为值转换的一部分，要乘以属性值的比例。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {number|number[]|number[][]}
   * @readonly
   */
  scale: {
    get: function () {
      return this._scale;
    },
  },

  /**
   * 额外的用户定义属性。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {*}
   * @readonly
   */
  extras: {
    get: function () {
      return this._extras;
    },
  },

  /**
   * 包含扩展的对象。
   *
   * @memberof MetadataClassProperty.prototype
   * @type {object}
   * @readonly
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },
});

function isLegacy(property) {
  if (property.type === "ARRAY") {
    return true;
  }

  // New property types in EXT_structural_metadata
  const type = property.type;
  if (
    type === MetadataType.SCALAR ||
    MetadataType.isMatrixType(type) ||
    MetadataType.isVectorType(type)
  ) {
    return false;
  }

  // EXT_feature_metadata allowed numeric types as a type. Now they are
  // represented as {type: SINGLE, componentType: type}
  if (defined(MetadataComponentType[type])) {
    return true;
  }

  // New properties in EXT_structural_metadata
  if (
    defined(property.noData) ||
    defined(property.scale) ||
    defined(property.offset) ||
    defined(property.required) ||
    defined(property.count) ||
    defined(property.array)
  ) {
    return false;
  }

  // Properties that only exist in EXT_feature_metadata
  if (defined(property.optional)) {
    return false;
  }

  // impossible to tell, give up.
  return undefined;
}

function parseType(property, enums) {
  const type = property.type;
  const componentType = property.componentType;

  // EXT_feature_metadata had an ARRAY type. This is now handled
  // with array + count, so some details need to be transcoded
  const isLegacyArray = type === "ARRAY";
  let isArray;
  let arrayLength;
  let isVariableLengthArray;
  if (isLegacyArray) {
    // definitely EXT_feature_metadata
    isArray = true;
    arrayLength = property.componentCount;
    isVariableLengthArray = !defined(arrayLength);
  } else if (property.array) {
    isArray = true;
    arrayLength = property.count;
    isVariableLengthArray = !defined(property.count);
  } else {
    // Could be either extension. Some cases are impossible to distinguish
    // Default to a single value
    isArray = false;
    arrayLength = undefined;
    isVariableLengthArray = false;
  }

  let enumType;
  if (defined(property.enumType)) {
    enumType = enums[property.enumType];
  }

  // In both EXT_feature_metadata and EXT_structural_metadata, ENUM appears
  // as a type.
  if (type === MetadataType.ENUM) {
    return {
      type: type,
      componentType: undefined,
      enumType: enumType,
      valueType: enumType.valueType,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // In EXT_feature_metadata, ENUM also appears as an ARRAY componentType
  if (isLegacyArray && componentType === MetadataType.ENUM) {
    return {
      type: componentType,
      componentType: undefined,
      enumType: enumType,
      valueType: enumType.valueType,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // EXT_structural_metadata only: SCALAR, VECN and MATN
  if (
    type === MetadataType.SCALAR ||
    MetadataType.isMatrixType(type) ||
    MetadataType.isVectorType(type)
  ) {
    return {
      type: type,
      componentType: componentType,
      enumType: undefined,
      valueType: componentType,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // In both EXT_structural_metadata and EXT_feature_metadata,
  // BOOLEAN and STRING appear as types
  if (type === MetadataType.BOOLEAN || type === MetadataType.STRING) {
    return {
      type: type,
      componentType: undefined,
      enumType: undefined,
      valueType: undefined,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // EXT_feature_metadata also allows BOOLEAN and STRING as an ARRAY
  // componentType
  if (
    isLegacyArray &&
    (componentType === MetadataType.BOOLEAN ||
      componentType === MetadataType.STRING)
  ) {
    return {
      type: componentType,
      componentType: undefined,
      enumType: undefined,
      valueType: undefined,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // Both EXT_feature_metadata and EXT_structural_metadata allow numeric types like
  // INT32 or FLOAT64 as a componentType.
  if (defined(componentType) && defined(MetadataComponentType[componentType])) {
    return {
      type: MetadataType.SCALAR,
      componentType: componentType,
      enumType: undefined,
      valueType: componentType,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  // EXT_feature_metadata: integer and float types were allowed as types,
  // but now these are expressed as {type: SCALAR, componentType: type}
  if (defined(MetadataComponentType[type])) {
    return {
      type: MetadataType.SCALAR,
      componentType: type,
      enumType: undefined,
      valueType: type,
      isArray: isArray,
      isVariableLengthArray: isVariableLengthArray,
      arrayLength: arrayLength,
    };
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    `unknown metadata type {type: ${type}, componentType: ${componentType})`,
  );
  //>>includeEnd('debug');
}

/**
 * 规范化整数属性值。如果属性未规范化
 * 该值将返回原封不动。
 * <p>
 * 鉴于 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata#normalized-values|3D 元数据规范} 中定义归一化的方式，
 * normalize 和 unnormalize 几乎相反，但并不完全相反。特别
 * 最小有符号整数值在归一化后将相差 1，并且
 * 非规范化。看
 * {@link https://www.desmos.com/calculator/nledg1evut|此 Desmos 图}
 * 使用 INT8 的示例。
 * </p>
 * <p>
 * 此外，对于 64 位整数类型，可能会损失精度
 * 由于转换为 Number
 * </p>
 *
 * @param {*} value 整数值或整数值数组。
 * @returns {*} 标准化值或标准化值的数组。
 *
 * @private
 */
MetadataClassProperty.prototype.normalize = function (value) {
  if (!this._normalized) {
    return value;
  }

  return normalizeInPlace(
    value,
    this._valueType,
    MetadataComponentType.normalize,
  );
};

/**
 * 取消规范化整数属性值。如果属性未规范化
 * 该值将返回原封不动。
 * <p>
 * 鉴于 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata#normalized-values|3D 元数据规范} 中定义归一化的方式，
 * normalize 和 unnormalize 几乎相反，但并不完全相反。特别
 * 最小有符号整数值在归一化后将相差 1，并且
 * 非规范化。看
 * {@link https://www.desmos.com/calculator/nledg1evut|此 Desmos 图}
 * 使用 INT8 的示例。
 * </p>
 * <p>
 * 此外，对于 64 位整数类型，可能会损失精度
 * 由于转换为 Number
 * </p>
 *
 * @param {*} value 标准化值或标准化值的数组。
 * @returns {*} 整数值或整数值数组。
 *
 * @private
 */
MetadataClassProperty.prototype.unnormalize = function (value) {
  if (!this._normalized) {
    return value;
  }

  return normalizeInPlace(
    value,
    this._valueType,
    MetadataComponentType.unnormalize,
  );
};

/**
 * @private
 */
MetadataClassProperty.prototype.applyValueTransform = function (value) {
  // variable length arrays do not have a well-defined offset/scale so this
  // is forbidden by the spec
  if (!this._hasValueTransform || this._isVariableLengthArray) {
    return value;
  }

  return MetadataClassProperty.valueTransformInPlace(
    value,
    this._offset,
    this._scale,
    MetadataComponentType.applyValueTransform,
  );
};

/**
 * @private
 */
MetadataClassProperty.prototype.unapplyValueTransform = function (value) {
  // variable length arrays do not have a well-defined offset/scale so this
  // is forbidden by the spec
  if (!this._hasValueTransform || this._isVariableLengthArray) {
    return value;
  }

  return MetadataClassProperty.valueTransformInPlace(
    value,
    this._offset,
    this._scale,
    MetadataComponentType.unapplyValueTransform,
  );
};

/**
 * @private
 */
MetadataClassProperty.prototype.expandConstant = function (
  constant,
  enableNestedArrays,
) {
  enableNestedArrays = defaultValue(enableNestedArrays, false);
  const isArray = this._isArray;
  const arrayLength = this._arrayLength;
  const componentCount = MetadataType.getComponentCount(this._type);
  const isNested = isArray && componentCount > 1;

  // scalar values can be returned directly
  if (!isArray && componentCount === 1) {
    return constant;
  }

  // vector and matrix values
  if (!isArray) {
    return new Array(componentCount).fill(constant);
  }

  // arrays of scalars
  if (!isNested) {
    return new Array(arrayLength).fill(constant);
  }

  // arrays of vectors/matrices: flattened
  if (!enableNestedArrays) {
    return new Array(this._arrayLength * componentCount).fill(constant);
  }

  // array of vectors/matrices: nested
  const innerConstant = new Array(componentCount).fill(constant);
  // This array fill duplicates the pointer to the inner arrays. Since this is
  // intended for use with constants, no need to clone the array.
  return new Array(this._arrayLength).fill(innerConstant);
};

/**
 * 如果值为 noData sentinel，则返回 undefined。否则，返回
 * 值。
 * @param {*} value 原始值
 * @returns {*} 值或 undefined（如果值为无数据值）。
 *
 * @private
 */
MetadataClassProperty.prototype.handleNoData = function (value) {
  const sentinel = this._noData;
  if (!defined(sentinel)) {
    return value;
  }

  if (arrayEquals(value, sentinel)) {
    return undefined;
  }

  return value;
};

function arrayEquals(left, right) {
  if (!Array.isArray(left)) {
    return left === right;
  }

  if (!Array.isArray(right)) {
    return false;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    if (!arrayEquals(left[i], right[i])) {
      return false;
    }
  }

  return true;
}

/**
 * 将 VECN 值解压缩为 {@link Cartesian2}、{@link Cartesian3}，或
 * {@link Cartesian4} 和 MATN 值转换为 {@link Matrix2}、{@link Matrix3}，或
 * {@link Matrix4} 取决于 N。所有其他值（包括
 * 其他大小）保持不变。
 *
 * @param {*}  value 为原始的标准化值。
 * @param {boolean} [enableNestedArrays=false] 如果为 true，则向量数组表示为嵌套数组。这用于 JSON 编码，但用于二进制编码
 * @returns {*} 如果值分别为向量或矩阵类型，则为适当的向量或矩阵类型。如果属性是向量或矩阵的数组，则返回相应向量或矩阵类型的数组。否则，将返回该值。
 * @private
 */
MetadataClassProperty.prototype.unpackVectorAndMatrixTypes = function (
  value,
  enableNestedArrays,
) {
  enableNestedArrays = defaultValue(enableNestedArrays, false);
  const MathType = MetadataType.getMathType(this._type);
  const isArray = this._isArray;
  const componentCount = MetadataType.getComponentCount(this._type);
  const isNested = isArray && componentCount > 1;

  if (!defined(MathType)) {
    return value;
  }

  if (enableNestedArrays && isNested) {
    return value.map(function (x) {
      return MathType.unpack(x);
    });
  }

  if (isArray) {
    return MathType.unpackArray(value);
  }

  return MathType.unpack(value);
};

/**
 * 将 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 打包到
 * 数组（如果此属性是 <code>VECN</code>）。
 * 将 {@link Matrix2}、{@link Matrix3} 或 {@link Matrix4} 打包成
 * 数组（如果此属性是 <code>MATN</code>）。
 * 所有其他值（包括其他大小的数组）都保持不变。
 *
 * @param {*} value 此属性的值
 * @param {boolean} [enableNestedArrays=false] 如果为 true，则向量数组表示为嵌套数组。这用于 JSON 编码，但用于二进制编码
 * @returns {*} 如果属性是向量或矩阵类型，则为适当长度的数组。否则，将返回该值。
 * @private
 */
MetadataClassProperty.prototype.packVectorAndMatrixTypes = function (
  value,
  enableNestedArrays,
) {
  enableNestedArrays = defaultValue(enableNestedArrays, false);
  const MathType = MetadataType.getMathType(this._type);
  const isArray = this._isArray;
  const componentCount = MetadataType.getComponentCount(this._type);
  const isNested = isArray && componentCount > 1;

  if (!defined(MathType)) {
    return value;
  }

  if (enableNestedArrays && isNested) {
    return value.map(function (x) {
      return MathType.pack(x, []);
    });
  }

  if (isArray) {
    return MathType.packArray(value, []);
  }

  return MathType.pack(value, []);
};

/**
 * 验证给定的值是否符合属性。
 *
 * @param {*} value 该值。
 * @returns {string|undefined} 如果值不符合属性，则显示错误消息，否则为 undefined。
 * @private
 */
MetadataClassProperty.prototype.validate = function (value) {
  if (!defined(value) && defined(this._default)) {
    // no value, but we have a default to use.
    return undefined;
  }

  if (this._required && !defined(value)) {
    return `required property must have a value`;
  }

  if (this._isArray) {
    return validateArray(this, value);
  }

  return validateSingleValue(this, value);
};

function validateArray(classProperty, value) {
  if (!Array.isArray(value)) {
    return `value ${value} must be an array`;
  }

  const length = value.length;
  if (
    !classProperty._isVariableLengthArray &&
    length !== classProperty._arrayLength
  ) {
    return "Array length does not match property.arrayLength";
  }

  for (let i = 0; i < length; i++) {
    const message = validateSingleValue(classProperty, value[i]);
    if (defined(message)) {
      return message;
    }
  }
}

function validateSingleValue(classProperty, value) {
  const type = classProperty._type;
  const componentType = classProperty._componentType;
  const enumType = classProperty._enumType;
  const normalized = classProperty._normalized;

  if (MetadataType.isVectorType(type)) {
    return validateVector(value, type, componentType);
  } else if (MetadataType.isMatrixType(type)) {
    return validateMatrix(value, type, componentType);
  } else if (type === MetadataType.STRING) {
    return validateString(value);
  } else if (type === MetadataType.BOOLEAN) {
    return validateBoolean(value);
  } else if (type === MetadataType.ENUM) {
    return validateEnum(value, enumType);
  }

  return validateScalar(value, componentType, normalized);
}

function validateVector(value, type, componentType) {
  if (!MetadataComponentType.isVectorCompatible(componentType)) {
    return `componentType ${componentType} is incompatible with vector type ${type}`;
  }

  if (type === MetadataType.VEC2 && !(value instanceof Cartesian2)) {
    return `vector value ${value} must be a Cartesian2`;
  }

  if (type === MetadataType.VEC3 && !(value instanceof Cartesian3)) {
    return `vector value ${value} must be a Cartesian3`;
  }

  if (type === MetadataType.VEC4 && !(value instanceof Cartesian4)) {
    return `vector value ${value} must be a Cartesian4`;
  }
}

function validateMatrix(value, type, componentType) {
  if (!MetadataComponentType.isVectorCompatible(componentType)) {
    return `componentType ${componentType} is incompatible with matrix type ${type}`;
  }

  if (type === MetadataType.MAT2 && !(value instanceof Matrix2)) {
    return `matrix value ${value} must be a Matrix2`;
  }

  if (type === MetadataType.MAT3 && !(value instanceof Matrix3)) {
    return `matrix value ${value} must be a Matrix3`;
  }

  if (type === MetadataType.MAT4 && !(value instanceof Matrix4)) {
    return `matrix value ${value} must be a Matrix4`;
  }
}

function validateString(value) {
  if (typeof value !== "string") {
    return getTypeErrorMessage(value, MetadataType.STRING);
  }
}

function validateBoolean(value) {
  if (typeof value !== "boolean") {
    return getTypeErrorMessage(value, MetadataType.BOOLEAN);
  }
}

function validateEnum(value, enumType) {
  const javascriptType = typeof value;
  if (defined(enumType)) {
    if (javascriptType !== "string" || !defined(enumType.valuesByName[value])) {
      return `value ${value} is not a valid enum name for ${enumType.id}`;
    }
    return;
  }
}

function validateScalar(value, componentType, normalized) {
  const javascriptType = typeof value;

  switch (componentType) {
    case MetadataComponentType.INT8:
    case MetadataComponentType.UINT8:
    case MetadataComponentType.INT16:
    case MetadataComponentType.UINT16:
    case MetadataComponentType.INT32:
    case MetadataComponentType.UINT32:
    case MetadataComponentType.FLOAT32:
    case MetadataComponentType.FLOAT64:
      if (javascriptType !== "number") {
        return getTypeErrorMessage(value, componentType);
      }
      if (!isFinite(value)) {
        return getNonFiniteErrorMessage(value, componentType);
      }
      return checkInRange(value, componentType, normalized);
    case MetadataComponentType.INT64:
    case MetadataComponentType.UINT64:
      if (javascriptType !== "number" && javascriptType !== "bigint") {
        return getTypeErrorMessage(value, componentType);
      }
      if (javascriptType === "number" && !isFinite(value)) {
        return getNonFiniteErrorMessage(value, componentType);
      }
      return checkInRange(value, componentType, normalized);
  }
}

function getTypeErrorMessage(value, type) {
  return `value ${value} does not match type ${type}`;
}

function getOutOfRangeErrorMessage(value, type, normalized) {
  let errorMessage = `value ${value} is out of range for type ${type}`;
  if (normalized) {
    errorMessage += " (normalized)";
  }
  return errorMessage;
}

function checkInRange(value, componentType, normalized) {
  if (normalized) {
    const min = MetadataComponentType.isUnsignedIntegerType(componentType)
      ? 0.0
      : -1.0;
    const max = 1.0;
    if (value < min || value > max) {
      return getOutOfRangeErrorMessage(value, componentType, normalized);
    }
    return;
  }

  if (
    value < MetadataComponentType.getMinimum(componentType) ||
    value > MetadataComponentType.getMaximum(componentType)
  ) {
    return getOutOfRangeErrorMessage(value, componentType, normalized);
  }
}

function getNonFiniteErrorMessage(value, type) {
  return `value ${value} of type ${type} must be finite`;
}

function normalizeInPlace(values, valueType, normalizeFunction) {
  if (!Array.isArray(values)) {
    return normalizeFunction(values, valueType);
  }

  for (let i = 0; i < values.length; i++) {
    values[i] = normalizeInPlace(values[i], valueType, normalizeFunction);
  }

  return values;
}

/**
 * @private
 */
MetadataClassProperty.valueTransformInPlace = function (
  values,
  offsets,
  scales,
  transformationFunction,
) {
  if (!Array.isArray(values)) {
    // transform a single value
    return transformationFunction(values, offsets, scales);
  }

  for (let i = 0; i < values.length; i++) {
    // offsets and scales must be the same array shape as values.
    values[i] = MetadataClassProperty.valueTransformInPlace(
      values[i],
      offsets[i],
      scales[i],
      transformationFunction,
    );
  }

  return values;
};

export default MetadataClassProperty;
