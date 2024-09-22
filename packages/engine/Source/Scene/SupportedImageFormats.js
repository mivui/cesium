import defaultValue from "../Core/defaultValue.js";

/**
 * 浏览器支持的图像格式。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.webp=false] 浏览器是否支持 WebP 图片。
 * @param {boolean} [options.basis=false] 浏览器是否支持查看 KTX2 + Basis Universal 图片所需的压缩纹理。
 *
 * @private
 */
function SupportedImageFormats(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this.webp = defaultValue(options.webp, false);
  this.basis = defaultValue(options.basis, false);
}

export default SupportedImageFormats;
