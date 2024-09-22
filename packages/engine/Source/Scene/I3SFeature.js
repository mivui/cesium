import defined from "../Core/defined.js";
import I3SDataProvider from "./I3SDataProvider.js";

/**
 * 此类实现 I3S 功能。
 * <p>
 * 不要直接构造此函数，而是通过 {@link I3SNode} 访问瓦片。
 * </p>
 * @alias I3SFeature
 * @internalConstructor
 */
function I3SFeature(parent, uri) {
  this._parent = parent;
  this._dataProvider = parent._dataProvider;
  this._layer = parent._layer;

  if (defined(this._parent._nodeIndex)) {
    this._resource = this._parent._layer.resource.getDerivedResource({
      url: `nodes/${this._parent._data.mesh.attribute.resource}/${uri}`,
    });
  } else {
    this._resource = this._parent.resource.getDerivedResource({ url: uri });
  }
}

Object.defineProperties(I3SFeature.prototype, {
  /**
   * 获取功能的资源
   * @memberof I3SFeature.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },
  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SFeature.prototype
   * @type {object}
   * @readonly
   */
  data: {
    get: function () {
      return this._data;
    },
  },
});

/**
 * 加载内容。
 * @returns {Promise<object>} 加载 I3S 功能数据时解决的 Promise
 * @private
 */
I3SFeature.prototype.load = async function () {
  this._data = await I3SDataProvider.loadJson(this._resource);
  return this._data;
};

export default I3SFeature;
