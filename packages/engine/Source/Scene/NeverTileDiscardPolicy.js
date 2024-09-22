/**
 * 一个 {@link TileDiscardPolicy} 指定绝不应丢弃图块图像。
 *
 * @alias NeverTileDiscardPolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 */
function NeverTileDiscardPolicy(options) {}

/**
 * 确定丢弃策略是否已准备好处理映像。
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则为 True;否则为 false。
 */
NeverTileDiscardPolicy.prototype.isReady = function () {
  return true;
};

/**
 * 给定一个平铺图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果应该丢弃图像，则为 True;否则为 false。
 */
NeverTileDiscardPolicy.prototype.shouldDiscardImage = function (image) {
  return false;
};
export default NeverTileDiscardPolicy;
