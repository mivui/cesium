import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import getImagePixels from "../Core/getImagePixels.js";
import Resource from "../Core/Resource.js";

/**
 * 用于丢弃与已知图像匹配的切片图像的策略，该图像包含
 * “缺失”图像。
 *
 * @alias DiscardMissingTileImagePolicy
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Resource|string} options.missingImageUrl 已知缺失图像的 URL。
 * @param {Cartesian2[]} options.pixelsToCheck 一个 {@link Cartesian2} 像素位置的数组，以
 * 与缺失的图像进行比较。
 * @param {boolean} [options.disableCheckIfAllPixelsAreTransparent=false] 如果为 true，则丢弃检查将被禁用
 * 如果 missingImageUrl 中的所有 pixelsToCheck 的 alpha 值为 0。 如果为 false，则
 * 无论 pixelsToCheck 的值是多少，放弃检查都会继续进行。
 */
function DiscardMissingTileImagePolicy(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.missingImageUrl)) {
    throw new DeveloperError("options.missingImageUrl is required.");
  }

  if (!defined(options.pixelsToCheck)) {
    throw new DeveloperError("options.pixelsToCheck is required.");
  }
  //>>includeEnd('debug');

  this._pixelsToCheck = options.pixelsToCheck;
  this._missingImagePixels = undefined;
  this._missingImageByteLength = undefined;
  this._isReady = false;

  const resource = Resource.createIfNeeded(options.missingImageUrl);

  const that = this;

  function success(image) {
    if (defined(image.blob)) {
      that._missingImageByteLength = image.blob.size;
    }

    let pixels = getImagePixels(image);

    if (options.disableCheckIfAllPixelsAreTransparent) {
      let allAreTransparent = true;
      const width = image.width;

      const pixelsToCheck = options.pixelsToCheck;
      for (
        let i = 0, len = pixelsToCheck.length;
        allAreTransparent && i < len;
        ++i
      ) {
        const pos = pixelsToCheck[i];
        const index = pos.x * 4 + pos.y * width;
        const alpha = pixels[index + 3];

        if (alpha > 0) {
          allAreTransparent = false;
        }
      }

      if (allAreTransparent) {
        pixels = undefined;
      }
    }

    that._missingImagePixels = pixels;
    that._isReady = true;
  }

  function failure() {
    // Failed to download "missing" image, so assume that any truly missing tiles
    // will also fail to download and disable the discard check.
    that._missingImagePixels = undefined;
    that._isReady = true;
  }

  resource
    .fetchImage({
      preferBlob: true,
      preferImageBitmap: true,
      flipY: true,
    })
    .then(success)
    .catch(failure);
}

/**
 * 确定丢弃策略是否已准备好处理映像。
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则为 True;否则为 false。
 */
DiscardMissingTileImagePolicy.prototype.isReady = function () {
  return this._isReady;
};

/**
 * 给定一个平铺图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果应该丢弃图像，则为 True;否则为 false。
 *
 * @exception 在丢弃策略准备就绪之前，不得调用 {DeveloperError} <code>shouldDiscardImage</code>。
 */
DiscardMissingTileImagePolicy.prototype.shouldDiscardImage = function (image) {
  //>>includeStart('debug', pragmas.debug);
  if (!this._isReady) {
    throw new DeveloperError(
      "shouldDiscardImage must not be called before the discard policy is ready."
    );
  }
  //>>includeEnd('debug');

  const pixelsToCheck = this._pixelsToCheck;
  const missingImagePixels = this._missingImagePixels;

  // If missingImagePixels is undefined, it indicates that the discard check has been disabled.
  if (!defined(missingImagePixels)) {
    return false;
  }

  if (defined(image.blob) && image.blob.size !== this._missingImageByteLength) {
    return false;
  }

  const pixels = getImagePixels(image);
  const width = image.width;

  for (let i = 0, len = pixelsToCheck.length; i < len; ++i) {
    const pos = pixelsToCheck[i];
    const index = pos.x * 4 + pos.y * width;
    for (let offset = 0; offset < 4; ++offset) {
      const pixel = index + offset;
      if (pixels[pixel] !== missingImagePixels[pixel]) {
        return false;
      }
    }
  }
  return true;
};
export default DiscardMissingTileImagePolicy;
