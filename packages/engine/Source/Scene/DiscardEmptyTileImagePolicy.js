import defined from "../Core/defined.js";

/**
 * 用于丢弃不包含任何数据的磁贴图像（因此实际上不是图像）的策略。
 * 此策略丢弃 {@link DiscardEmptyTileImagePolicy.EMPTY_IMAGE}，即
 * 应由图像加载代码代替任何空的瓦片图像。
 *
 * @alias DiscardEmptyTileImagePolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 */
function DiscardEmptyTileImagePolicy(options) {}

/**
 * 确定丢弃策略是否已准备好处理映像。
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则为 True;否则为 false。
 */
DiscardEmptyTileImagePolicy.prototype.isReady = function () {
  return true;
};

/**
 * 给定一个平铺图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果应该丢弃图像，则为 True;否则为 false。
 */
DiscardEmptyTileImagePolicy.prototype.shouldDiscardImage = function (image) {
  return DiscardEmptyTileImagePolicy.EMPTY_IMAGE === image;
};

let emptyImage;

Object.defineProperties(DiscardEmptyTileImagePolicy, {
  /**
   * 表示空图像的默认值。
   * @type {HTMLImageElement}
   * @readonly
   * @memberof DiscardEmptyTileImagePolicy
   */
  EMPTY_IMAGE: {
    get: function () {
      if (!defined(emptyImage)) {
        emptyImage = new Image();
        // load a blank data URI with a 1x1 transparent pixel.
        emptyImage.src =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      }
      return emptyImage;
    },
  },
});
export default DiscardEmptyTileImagePolicy;
