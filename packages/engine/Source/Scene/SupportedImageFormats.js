import defaultValue from "../Core/defaultValue.js";

/**
 * Image formats supported by the browser.
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.webp=false] Whether the browser supports WebP images.
 * @param {boolean} [options.basis=false] Whether the browser supports compressed textures required to view KTX2 + Basis Universal images.
 *
 * @private
 */
function SupportedImageFormats(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this.webp = defaultValue(options.webp, false);
  this.basis = defaultValue(options.basis, false);
}

export default SupportedImageFormats;
