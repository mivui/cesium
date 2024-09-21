import defined from "./defined.js";
import isBitSet from "./isBitSet.js";

// Bitmask for checking tile properties
const childrenBitmasks = [0x01, 0x02, 0x04, 0x08];
const anyChildBitmask = 0x0f;
const cacheFlagBitmask = 0x10; // True if there is a child subtree
const imageBitmask = 0x40;
const terrainBitmask = 0x80;

/**
 * 包含来自 Google 地球企业版服务器的每个图块的相关信息
 *
 * @param {number} bits 位，包含每个图块的数据类型和可用子项的位掩码。
 * @param {number} cnodeVersion 子树元数据请求的版本。
 * @param {number} imageryVersion 图像请求图块的版本。
 * @param {number} terrainVersion 地形瓦片请求的版本。
 * @param 图像提供商的 {number} imageryProvider ID。
 * @param terrain provider 的 {number} terrainProvider ID。
 *
 * @private
 */
function GoogleEarthEnterpriseTileInformation(
  bits,
  cnodeVersion,
  imageryVersion,
  terrainVersion,
  imageryProvider,
  terrainProvider
) {
  this._bits = bits;
  this.cnodeVersion = cnodeVersion;
  this.imageryVersion = imageryVersion;
  this.terrainVersion = terrainVersion;
  this.imageryProvider = imageryProvider;
  this.terrainProvider = terrainProvider;
  this.ancestorHasTerrain = false; // Set it later once we find its parent
  this.terrainState = undefined;
}

/**
 * 从对象创建 GoogleEarthEnterpriseTileInformation
 *
 * @param {object} info 要克隆的对象
 * @param {GoogleEarthEnterpriseTileInformation} [result] 要在其上存储结果的对象。
 * @returns {GoogleEarthEnterpriseTileInformation} 修改后的结果参数 或新的 GoogleEarthEnterpriseTileInformation 实例（如果未提供）。
 */
GoogleEarthEnterpriseTileInformation.clone = function (info, result) {
  if (!defined(result)) {
    result = new GoogleEarthEnterpriseTileInformation(
      info._bits,
      info.cnodeVersion,
      info.imageryVersion,
      info.terrainVersion,
      info.imageryProvider,
      info.terrainProvider
    );
  } else {
    result._bits = info._bits;
    result.cnodeVersion = info.cnodeVersion;
    result.imageryVersion = info.imageryVersion;
    result.terrainVersion = info.terrainVersion;
    result.imageryProvider = info.imageryProvider;
    result.terrainProvider = info.terrainProvider;
  }
  result.ancestorHasTerrain = info.ancestorHasTerrain;
  result.terrainState = info.terrainState;

  return result;
};

/**
 * 设置磁贴的父级
 *
 * @param {GoogleEarthEnterpriseTileInformation} 父级父磁贴
 */
GoogleEarthEnterpriseTileInformation.prototype.setParent = function (parent) {
  this.ancestorHasTerrain = parent.ancestorHasTerrain || this.hasTerrain();
};

/**
 * 获取子树是否可用
 *
 * @returns {boolean} true 如果 subtree 可用， false 否则。
 */
GoogleEarthEnterpriseTileInformation.prototype.hasSubtree = function () {
  return isBitSet(this._bits, cacheFlagBitmask);
};

/**
 * 获取图像是否可用
 *
 * @returns {boolean} 如果影像可用，则为 true， false 否则。
 */
GoogleEarthEnterpriseTileInformation.prototype.hasImagery = function () {
  return isBitSet(this._bits, imageBitmask);
};

/**
 * 获取 terrain 是否可用
 *
 * @returns {boolean} true（如果地形可用），则为 false。 否则。
 */
GoogleEarthEnterpriseTileInformation.prototype.hasTerrain = function () {
  return isBitSet(this._bits, terrainBitmask);
};

/**
 * 获取是否存在任何子项
 *
 * @returns {boolean} true（如果有子项可用），否则 false 。
 */
GoogleEarthEnterpriseTileInformation.prototype.hasChildren = function () {
  return isBitSet(this._bits, anyChildBitmask);
};

/**
 * 获取指定的子项是否可用
 *
 * @param {number} index 子瓦片的索引
 *
 * @returns {boolean} true（如果 child 可用），否则为 false。
 */
GoogleEarthEnterpriseTileInformation.prototype.hasChild = function (index) {
  return isBitSet(this._bits, childrenBitmasks[index]);
};

/**
 * 获取包含子项的位掩码
 *
 * @returns {number} 子位掩码
 */
GoogleEarthEnterpriseTileInformation.prototype.getChildBitmask = function () {
  return this._bits & anyChildBitmask;
};
export default GoogleEarthEnterpriseTileInformation;
