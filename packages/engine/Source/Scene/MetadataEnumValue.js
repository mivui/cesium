import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";

/**
 * 元数据枚举值。
 * <p>
 * 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata|3D 元数据规范} 了解 3D 瓦片
 * </p>
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number} options.value 整数值。
 * @param {string} options.name 枚举值的名称。
 * @param {string} [options.description] 枚举值的描述。
 * @param {*} [options.extras] 额外的用户定义属性。
 * @param {object} [options.extensions] 包含扩展的对象。
 *
 * @alias MetadataEnumValue
 * @constructor
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function MetadataEnumValue(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const value = options.value;
  const name = options.name;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.value", value);
  Check.typeOf.string("options.name", name);

  //>>includeEnd('debug');

  this._value = value;
  this._name = name;
  this._description = options.description;
  this._extras = clone(options.extras, true);
  this._extensions = clone(options.extensions, true);
}

/**
 * 从 3D 拼贴 1.1、3DTILES_metadata、EXT_structural_metadata 或 EXT_feature_metadata 创建 {@link MetadataEnumValue}。
 *
 * @param {object} value 枚举值 JSON 对象。
 *
 * @returns {MetadataEnumValue} 新创建的元数据枚举值。
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
MetadataEnumValue.fromJson = function (value) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');

  return new MetadataEnumValue({
    value: value.value,
    name: value.name,
    description: value.description,
    extras: value.extras,
    extensions: value.extensions,
  });
};

Object.defineProperties(MetadataEnumValue.prototype, {
  /**
   * 整数值。
   *
   * @memberof MetadataEnumValue.prototype
   * @type {number}
   * @readonly
   */
  value: {
    get: function () {
      return this._value;
    },
  },

  /**
   * 枚举值的名称。
   *
   * @memberof MetadataEnumValue.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 枚举值的描述。
   *
   * @memberof MetadataEnumValue.prototype
   * @type {string}
   * @readonly
   */
  description: {
    get: function () {
      return this._description;
    },
  },

  /**
   * 额外的用户定义属性。
   *
   * @memberof MetadataEnumValue.prototype
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
   * @memberof MetadataEnumValue.prototype
   * @type {object}
   * @readonly
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },
});

export default MetadataEnumValue;
