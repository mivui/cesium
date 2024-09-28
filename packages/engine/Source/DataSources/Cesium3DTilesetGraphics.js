import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} Cesium3DTilesetGraphics.ConstructorOptions
 *
 * Cesium3DTilesetGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定图块集可见性的布尔属性。
 * @property {Property | string |Resource} [uri] 指定图块集 URI 的字符串或 Resource Property。
 * @property {Property | number} [maximumScreenSpaceError] 一个数字或属性，用于指定用于驱动细节层次优化的最大屏幕空间误差。
 */

/**
 * 由 {@link Entity} 表示的 3D Tiles 图块集。
 * 图块集 modelMatrix 由包含的 Entity 位置和方向决定
 * 或者如果未定义 position ，则不设置 。
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(Cesium3DTilesetGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定模型可见性的属性。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置string 属性，用于指定 glTF 资源的 URI。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置用于驱动细节层次优化的最大屏幕空间错误。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */
  maximumScreenSpaceError: createPropertyDescriptor("maximumScreenSpaceError"),
});

/**
 * 复制instance.
 *
 * @param {Cesium3DTilesetGraphics} [result] 要在其上存储结果的对象。
 * @returns {Cesium3DTilesetGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {Cesium3DTilesetGraphics} source 要合并到此对象中的对象。
 */
Cesium3DTilesetGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.uri = defaultValue(this.uri, source.uri);
  this.maximumScreenSpaceError = defaultValue(
    this.maximumScreenSpaceError,
    source.maximumScreenSpaceError,
  );
};

export default Cesium3DTilesetGraphics;
