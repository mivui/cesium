import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} Cesium3DTilesetGraphics.ConstructorOptions
 *
 * Cesium3DTilesetGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定瓦片集可见性的布尔属性。
 * @property {Property | string | Resource} [uri] 指定瓦片集 URI 的字符串或 Resource 属性。
 * @property {Property | number} [maximumScreenSpaceError] 指定用于驱动细节层次细化的最大屏幕空间误差的数字或属性。
 */

/**
 * 由 {@link Entity} 表示的 3D Tiles 瓦片集。
 * 瓦片集的 modelMatrix 由包含的 Entity 位置和方向确定，
 * 如果位置未定义则保持未设置。
 *
 * @alias Cesium3DTilesetGraphics
 * @constructor
 *
 * @param {Cesium3DTilesetGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */
function Cesium3DTilesetGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._uri = undefined;
  this._uriSubscription = undefined;
  this._maximumScreenSpaceError = undefined;
  this._maximumScreenSpaceErrorSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(Cesium3DTilesetGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时触发的事件。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置指定模型可见性的布尔属性。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定 glTF 资产 URI 的字符串属性。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置用于驱动细节层次细化的最大屏幕空间误差。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */
  maximumScreenSpaceError: createPropertyDescriptor("maximumScreenSpaceError"),
});

/**
 * 复制此实例。
 *
 * @param {Cesium3DTilesetGraphics} [result] 存储结果的对象。
 * @returns {Cesium3DTilesetGraphics} 修改后的结果参数，如果未提供则为新实例。
 */
Cesium3DTilesetGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new Cesium3DTilesetGraphics(this);
  }
  result.show = this.show;
  result.uri = this.uri;
  result.maximumScreenSpaceError = this.maximumScreenSpaceError;

  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {Cesium3DTilesetGraphics} source 要合并到此对象中的对象。
 */
Cesium3DTilesetGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.uri = this.uri ?? source.uri;
  this.maximumScreenSpaceError =
    this.maximumScreenSpaceError ?? source.maximumScreenSpaceError;
};

export default Cesium3DTilesetGraphics;
