import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import MetadataClassProperty from "./MetadataClassProperty.js";

/**
 * 元数据类。
 *
 * <p>
 * See the {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata|3D Metadata Specification} for 3D Tiles
 * </p>
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.id 类的 ID。
 * @param {string} [options.name] 类的名称。
 * @param {string} [options.description] 类的描述。
 * @param {Object<string, MetadataClassProperty>} [options.properties] 类属性，其中每个键都是属性 ID。
 * @param {*} [options.extras] 额外的用户定义属性。
 * @param {object} [options.extensions] 包含扩展的对象。
 *
 * @alias MetadataClass
 * @constructor
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function MetadataClass(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const id = options.id;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.id", id);
  //>>includeEnd('debug');

  const properties = defaultValue(options.properties, {});
  const propertiesBySemantic = {};
  for (const propertyId in properties) {
    if (properties.hasOwnProperty(propertyId)) {
      const property = properties[propertyId];
      if (defined(property.semantic)) {
        propertiesBySemantic[property.semantic] = property;
      }
    }
  }

  this._id = id;
  this._name = options.name;
  this._description = options.description;
  this._properties = properties;
  this._propertiesBySemantic = propertiesBySemantic;
  this._extras = clone(options.extras, true);
  this._extensions = clone(options.extensions, true);
}

/**
 * 从 3D 图块 1.1、3DTILES_metadata、EXT_structural_metadata 或 EXT_feature_metadata 创建 {@link MetadataClass}。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.id 类的 ID。
 * @param {object} options.class 类 JSON 对象。
 * @param {Object<string,MetadataEnum>} [options.enums] 枚举字典。
 *
 * @returns {MetadataClass} 新创建的元数据类。
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
MetadataClass.fromJson = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const id = options.id;
  const classDefinition = options.class;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.id", id);
  Check.typeOf.object("options.class", classDefinition);
  //>>includeEnd('debug');

  const properties = {};
  for (const propertyId in classDefinition.properties) {
    if (classDefinition.properties.hasOwnProperty(propertyId)) {
      const property = MetadataClassProperty.fromJson({
        id: propertyId,
        property: classDefinition.properties[propertyId],
        enums: options.enums,
      });
      properties[propertyId] = property;
    }
  }

  return new MetadataClass({
    id: id,
    name: classDefinition.name,
    description: classDefinition.description,
    properties: properties,
    extras: classDefinition.extras,
    extensions: classDefinition.extensions,
  });
};

Object.defineProperties(MetadataClass.prototype, {
  /**
   * 类属性。
   *
   * @memberof MetadataClass.prototype
   * @type {Object<string, MetadataClassProperty>}
   * @readonly
   */
  properties: {
    get: function () {
      return this._properties;
    },
  },

  /**
   * 将语义映射到类属性的字典。
   *
   * @memberof MetadataClass.prototype
   * @type {Object<string, MetadataClassProperty>}
   * @readonly
   *
   * @private
   */
  propertiesBySemantic: {
    get: function () {
      return this._propertiesBySemantic;
    },
  },

  /**
   * 类的 ID。
   *
   * @memberof MetadataClass.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 类的名称。
   *
   * @memberof MetadataClass.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 类的描述。
   *
   * @memberof MetadataClass.prototype
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
   * @memberof MetadataClass.prototype
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
   * @memberof MetadataClass.prototype
   * @type {object}
   * @readonly
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },
});

/**
 * 批处理时为元数据类指定的类名
 * 表格从 3D Tiles 1.0 格式加载。
 *
 * @private
 */
MetadataClass.BATCH_TABLE_CLASS_NAME = "_batchTable";

export default MetadataClass;
