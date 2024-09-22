import Color from "../../Core/Color.js";
import defined from "../../Core/defined.js";

/**
 * {@link Model} 的一个功能。
 * <p>
 * 提供对存储在模型特征表中的特征属性的访问。
 * </p>
 * <p>
 * 对 <code>ModelFeature</code> 对象的修改具有模型的生命周期。
 * </p>
 * <p>
 * 不要直接构造它。通过使用 {@link Scene#pick} 进行选取来访问它。
 * </p>
 *
 * @alias ModelFeature
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Model} options.model 特征所属的模型。
 * @param {number} options.featureId 此功能的唯一整数标识符。
 *
 * @example
 * // On mouse over, display all the properties for a feature in the console log.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.ModelFeature) {
 *         console.log(feature);
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 *
 */
function ModelFeature(options) {
  this._model = options.model;

  // This ModelFeatureTable is not documented as an option since it is
  // part of the private API and should not appear in the documentation.
  this._featureTable = options.featureTable;

  this._featureId = options.featureId;
  this._color = undefined; // for calling getColor
}

Object.defineProperties(ModelFeature.prototype, {
  /**
   * 获取或设置是否功能。这是为所有功能设置的
   * 评估样式的显示时。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._featureTable.getShow(this._featureId);
    },
    set: function (value) {
      this._featureTable.setShow(this._featureId, value);
    },
  },

  /**
   * 获取或设置高亮颜色 （highlight color） 与特征颜色相乘。 什么时候
   * 这是白色的，特征的颜色不会改变。这是为所有功能设置的
   * 当评估样式的颜色时。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {Color}
   *
   * @default {@link Color.WHITE}
   */
  color: {
    get: function () {
      if (!defined(this._color)) {
        this._color = new Color();
      }
      return this._featureTable.getColor(this._featureId, this._color);
    },
    set: function (value) {
      this._featureTable.setColor(this._featureId, value);
    },
  },
  /**
   * {@link Scene#pick} 返回的所有对象都具有 <code>primitive</code> 属性。这将返回
   * 包含特征的模型。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {Model}
   *
   * @readonly
   * @private
   */
  primitive: {
    get: function () {
      return this._model;
    },
  },

  /**
   * 此功能所属的 {@link ModelFeatureTable}。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {ModelFeatureTable}
   *
   * @readonly
   * @private
   */
  featureTable: {
    get: function () {
      return this._featureTable;
    },
  },

  /**
   * 获取与此功能关联的功能 ID。对于 3D 瓦片 1.0，
   * 返回批处理 ID。对于EXT_mesh_features，这是
   * 所选特征 ID 集。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {number}
   *
   * @readonly
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  featureId: {
    get: function () {
      return this._featureId;
    },
  },
});

/**
 * 返回功能是否包含此属性。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} 特征是否包含此属性。
 */
ModelFeature.prototype.hasProperty = function (name) {
  return this._featureTable.hasProperty(this._featureId, name);
};

/**
 * 返回具有给定名称的功能属性的值的副本。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果特征没有此属性，则为<code> undefined</code>。
 *
 * @example
 * // Display all the properties for a feature in the console log.
 * const propertyIds = feature.getPropertyIds();
 * const length = propertyIds.length;
 * for (let i = 0; i < length; ++i) {
 *     const propertyId = propertyIds[i];
 *     console.log(propertyId + ': ' + feature.getProperty(propertyId));
 * }
 */
ModelFeature.prototype.getProperty = function (name) {
  return this._featureTable.getProperty(this._featureId, name);
};

/**
 * 返回具有给定名称的功能属性的副本，检查所有
 * 来自 glTF EXT_structural_metadata 和旧版 EXT_feature_metadata 的元数据
 *扩展。根据名称从最具体到最详细检查元数据
 * general，并返回第一个匹配项。元数据按以下顺序检查：
 * <ol>
 * <li>语义的结构元数据属性</li>
 * <li>按属性 ID 划分的结构元数据属性</li>
 * </ol>
 * <p>
 * 参见 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata Extension} 以及
 * 上一页 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata|EXT_feature_metadata Extension} 来表示 glTF。
 * </p>
 *
 * @param {string} name 特征的语义或属性 ID。在每个元数据粒度中，在属性 ID 之前检查语义。
 * @return {*} 属性的值，如果功能没有此属性，<code>则为 undefined</code>。
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
ModelFeature.prototype.getPropertyInherited = function (name) {
  if (this._featureTable.hasPropertyBySemantic(this._featureId, name)) {
    return this._featureTable.getPropertyBySemantic(this._featureId, name);
  }

  return this._featureTable.getProperty(this._featureId, name);
};

/**
 * 返回功能的属性 ID 数组。
 *
 * @param {string[]} [results] 存储结果的数组。
 * @returns {string[]} 功能属性的 ID。
 */
ModelFeature.prototype.getPropertyIds = function (results) {
  return this._featureTable.getPropertyIds(results);
};

/**
 * 使用给定名称设置功能属性的值。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @param {*} value 将要复制的属性的值。
 * @returns {boolean} <code>true</code>（如果设置了该属性），否则<code> false</code>，。
 *
 * @exception {DeveloperError} Inherited batch table hierarchy property is read only.
 *
 * @example
 * const height = feature.getProperty('Height'); // e.g., the height of a building
 *
 * @example
 * const name = 'clicked';
 * if (feature.getProperty(name)) {
 *     console.log('already clicked');
 * } else {
 *     feature.setProperty(name, true);
 *     console.log('first click');
 * }
 */
ModelFeature.prototype.setProperty = function (name, value) {
  return this._featureTable.setProperty(this._featureId, name, value);
};

export default ModelFeature;
