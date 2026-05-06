import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 枚举了在缩小 WebGL 纹理时使用的所有可能滤镜。
 *
 * @enum {number}
 *
 * @see TextureMagnificationFilter
 */
const TextureMinificationFilter = {
  /**
   * 通过返回最接近的像素来对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  NEAREST: WebGLConstants.NEAREST,
  /**
   * 通过对最接近的四个像素进行双线性插值来对纹理进行采样。这会产生比 <code>NEAREST</code> 滤镜更平滑的结果。
   *
   * @type {number}
   * @constant
   */
  LINEAR: WebGLConstants.LINEAR,
  /**
   * 选择最近的 mipmap 级别并在该级别内应用最近采样。
   * <p>
   * 要求纹理具有 mipmap。mip 级别由视角和纹理的屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_NEAREST: WebGLConstants.NEAREST_MIPMAP_NEAREST,
  /**
   * 选择最近的 mipmap 级别并在该级别内应用线性采样。
   * <p>
   * 要求纹理具有 mipmap。mip 级别由视角和纹理的屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  LINEAR_MIPMAP_NEAREST: WebGLConstants.LINEAR_MIPMAP_NEAREST,
  /**
   * 从两个相邻的 mipmap 级别使用最近采样读取纹理值，并对结果进行线性插值。
   * <p>
   * 此选项在对 mipmap 纹理进行采样时，提供了视觉质量和速度的良好平衡。
   * </p>
   * <p>
   * 要求纹理具有 mipmap。mip 级别由视角和纹理的屏幕空间大小选择。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_LINEAR: WebGLConstants.NEAREST_MIPMAP_LINEAR,
  /**
   * 从两个相邻的 mipmap 级别使用线性采样读取纹理值，并对结果进行线性插值。
   * <p>
   * 此选项在对 mipmap 纹理进行采样时，提供了视觉质量和速度的良好平衡。
   * </p>
   * <p>
   * 要求纹理具有 mipmap。mip 级别由视角和纹理的屏幕空间大小选择。
   * </p>
   * @type {number}
   * @constant
   */
  LINEAR_MIPMAP_LINEAR: WebGLConstants.LINEAR_MIPMAP_LINEAR,
};

/**
 * Validates the given <code>textureMinificationFilter</code> with respect to the possible enum values.
 *
 * @private
 *
 * @param textureMinificationFilter
 * @returns {boolean} <code>true</code> if <code>textureMinificationFilter</code> is valid.
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

Object.freeze(TextureMinificationFilter);

export default TextureMinificationFilter;
