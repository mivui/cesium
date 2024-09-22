import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import MetadataClass from "./MetadataClass.js";
import MetadataEnum from "./MetadataEnum.js";

/**
 * 包含类和枚举的架构。
 * <p>
 * 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata|3D 元数据规范} 了解 3D 瓦片
 * </p>
 *
 * @param {object} options 对象，具有以下属性：
 * @param {string} [options.id] 架构的 ID
 * @param {string} [options.name] 架构的名称。
 * @param {string} [options.description] 架构的描述。
 * @param {string} [options.version] 架构的特定应用程序版本。
 * @param {Object<string,MetadataClass>} [options.classes] 模式中定义的类，其中每个键都是类 ID。
 * @param {Object<string,MetadataEnum>} [options.enums] 枚举，其中每个键都是枚举 ID。
 * @param {*} [options.extras] 额外的用户定义属性。
 * @param {object} [options.extensions] 包含扩展的对象。
 *
 * @alias MetadataSchema
 * @constructor
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function MetadataSchema(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const classes = defaultValue(options.classes, {});
  const enums = defaultValue(options.enums, {});

  this._classes = classes;
  this._enums = enums;
  this._id = options.id;
  this._name = options.name;
  this._description = options.description;
  this._version = options.version;
  this._extras = clone(options.extras, true);
  this._extensions = clone(options.extensions, true);
}

/**
 * 从 3D 瓦片 1.1、3DTILES_metadata、EXT_structural_metadata 或 EXT_feature_metadata 创建 {@link MetadataSchema}。
 *
 * @param {object} schema 架构 JSON 对象。
 *
 * @returns {MetadataSchema} 新创建的元数据架构
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
MetadataSchema.fromJson = function (schema) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("schema", schema);
  //>>includeEnd('debug');

  const enums = {};
  if (defined(schema.enums)) {
    for (const enumId in schema.enums) {
      if (schema.enums.hasOwnProperty(enumId)) {
        enums[enumId] = MetadataEnum.fromJson({
          id: enumId,
          enum: schema.enums[enumId],
        });
      }
    }
  }

  const classes = {};
  if (defined(schema.classes)) {
    for (const classId in schema.classes) {
      if (schema.classes.hasOwnProperty(classId)) {
        classes[classId] = MetadataClass.fromJson({
          id: classId,
          class: schema.classes[classId],
          enums: enums,
        });
      }
    }
  }

  return new MetadataSchema({
    id: schema.id,
    name: schema.name,
    description: schema.description,
    version: schema.version,
    classes: classes,
    enums: enums,
    extras: schema.extras,
    extensions: schema.extensions,
  });
};

Object.defineProperties(MetadataSchema.prototype, {
  /**
   * 架构中定义的类。
   *
   * @memberof MetadataSchema.prototype
   * @type {Object<string, MetadataClass>}
   * @readonly
   */
  classes: {
    get: function () {
      return this._classes;
    },
  },

  /**
   * 架构中定义的枚举。
   *
   * @memberof MetadataSchema.prototype
   * @type {Object<string, MetadataEnum>}
   * @readonly
   */
  enums: {
    get: function () {
      return this._enums;
    },
  },

  /**
   * 架构的 ID。
   *
   * @memberof MetadataSchema.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 架构的名称。
   *
   * @memberof MetadataSchema.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 架构的描述。
   *
   * @memberof MetadataSchema.prototype
   * @type {string}
   * @readonly
   */
  description: {
    get: function () {
      return this._description;
    },
  },

  /**
   * 架构的应用程序特定版本。
   *
   * @memberof MetadataSchema.prototype
   * @type {string}
   * @readonly
   */
  version: {
    get: function () {
      return this._version;
    },
  },

  /**
   * 额外的用户定义属性。
   *
   * @memberof MetadataSchema.prototype
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
   * @memberof MetadataSchema.prototype
   * @type {object}
   * @readonly
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },
});

export default MetadataSchema;
