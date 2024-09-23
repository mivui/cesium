import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 列举缩小 WebGL 纹理时使用的所有可能的过滤器。
 *
 * @enum {number}
 *
 * @see TextureMagnificationFilter （贴图放大过滤器）
 */
const TextureMinificationFilter = {
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
  /**
   * 选择最近的 mip 级别，并在该级别内应用最近的采样。
   * <p>
   * 要求纹理具有 mipmap。mip 级别由纹理的视角和屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_NEAREST: WebGLConstants.NEAREST_MIPMAP_NEAREST,
  /**
   * 选择最近的 mip 级别，并在该级别内应用线性采样。
   * <p>
   * 要求纹理具有 mipmap。mip 级别由纹理的视角和屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  LINEAR_MIPMAP_NEAREST: WebGLConstants.LINEAR_MIPMAP_NEAREST,
  /**
   * 从两个相邻的 mip 级别使用最近的采样读取纹理值，并线性插值结果。
   * <p>
   * 从 mipmapped 纹理采样时，此选项可在视觉质量和速度之间实现良好的平衡。
   * </p>
   * <p>
   * 要求纹理具有 mipmap。mip 级别由纹理的视角和屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_LINEAR: WebGLConstants.NEAREST_MIPMAP_LINEAR,
  /**
   * 使用线性采样从两个相邻的 mip 级别读取纹理值，并线性插值结果。
   * <p>
   * 从 mipmapped 纹理采样时，此选项可在视觉质量和速度之间实现良好的平衡。
   * </p>
   * <p>
   * 要求纹理具有 mipmap。mip 级别由纹理的视角和屏幕空间大小选择。
   * </p>
   * @type {number}
   * @constant
   */
  LINEAR_MIPMAP_LINEAR: WebGLConstants.LINEAR_MIPMAP_LINEAR,
};

/**
 * 根据可能的枚举值验证给定的 <code>textureMinificationFilter</code>。
 *
 * @private
 *
 * @param textureMinificationFilter
 * @returns {boolean} <code>true</code>，如果 <code>textureMinificationFilter</code> 有效。
 */
TextureMinificationFilter.validate = function (textureMinificationFilter) {
  return (
    textureMinificationFilter === TextureMinificationFilter.NEAREST ||
    textureMinificationFilter === TextureMinificationFilter.LINEAR ||
    textureMinificationFilter ===
      TextureMinificationFilter.NEAREST_MIPMAP_NEAREST ||
    textureMinificationFilter ===
      TextureMinificationFilter.LINEAR_MIPMAP_NEAREST ||
    textureMinificationFilter ===
      TextureMinificationFilter.NEAREST_MIPMAP_LINEAR ||
    textureMinificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_LINEAR
  );
};

export default Object.freeze(TextureMinificationFilter);
