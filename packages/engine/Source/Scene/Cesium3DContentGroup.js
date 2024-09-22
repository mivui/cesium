import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";

/**
 * 组的简单抽象。这个类的存在是为了制作元数据 API
 * 更一致，即元数据可以通过
 * <code>content.group.metadata</code> 与 tile 元数据非常相似，它是作为
 * <code>tile.metadata</code> 的
 *
 * @param {object} options 对象，具有以下属性:
 * @param {GroupMetadata} options.metadata 与此组关联的元数据。
 *
 * @alias Cesium3DContentGroup
 * @constructor
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function Cesium3DContentGroup(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.metadata", options.metadata);
  //>>includeEnd('debug');

  this._metadata = options.metadata;
}

Object.defineProperties(Cesium3DContentGroup.prototype, {
  /**
   * 获取此组的元数据
   *
   * @memberof Cesium3DContentGroup.prototype
   *
   * @type {GroupMetadata}
   *
   * @readonly
   */
  metadata: {
    get: function () {
      return this._metadata;
    },
  },
});

export default Cesium3DContentGroup;
