import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 列举放大 WebGL 纹理时使用的所有可能的过滤器。
 *
 * @enum {number}
 *
 * @see TextureMinificationFilter
 */
const TextureMagnificationFilter = {
  /**
   * 通过返回最近的像素对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  NEAREST: WebGLConstants.NEAREST,
  /**
   * 通过对 4 个最接近的像素进行双线性插值对纹理进行采样。这会产生比 <code>NEAREST</code> 筛选更平滑的结果。
   *
   * @type {number}
   * @constant
   */
  LINEAR: WebGLConstants.LINEAR,
};

/**
 * 根据可能的枚举值验证给定的 <code>textureMinificationFilter</code>。
 * @param textureMagnificationFilter
 * @returns {boolean} <code>true</code>，如果 <code>textureMagnificationFilter</code> 有效。
 *
 * @private
 */
TextureMagnificationFilter.validate = function (textureMagnificationFilter) {
  return (
    textureMagnificationFilter === TextureMagnificationFilter.NEAREST ||
    textureMagnificationFilter === TextureMagnificationFilter.LINEAR
  );
};

export default Object.freeze(TextureMagnificationFilter);
