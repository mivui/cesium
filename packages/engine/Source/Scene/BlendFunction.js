/**
 * 用于确定如何缩放源颜色或目标颜色的 RGB 或 Alpha 分量的混合函数。
 *
 * @enum {number}
 *
 * @see DrawCommand.blending
 */
const BlendFunction = {
  /**
   * 每个颜色分量乘以零。
   * @type {number}
   * @constant
   */
  ZERO: 0,

  /**
   * 每个颜色分量乘以一。
   * @type {number}
   * @constant
   */
  ONE: 1,

  /**
   * 每个颜色分量乘以源颜色。
   * @type {number}
   * @constant
   */
  SOURCE_COLOR: 2,

  /**
   * 每个颜色分量乘以一减去源颜色。
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_COLOR: 3,

  /**
   * 每个颜色分量乘以目标颜色。
   * @type {number}
   * @constant
   */
  DESTINATION_COLOR: 4,

  /**
   * 每个颜色分量乘以一减去目标颜色。
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_COLOR: 5,

  /**
   * 每个颜色分量乘以源 Alpha。
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA: 6,

  /**
   * 每个颜色分量乘以一减去源 Alpha。
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_ALPHA: 7,

  /**
   * 每个颜色分量乘以目标 Alpha。
   * @type {number}
   * @constant
   */
  DESTINATION_ALPHA: 8,

  /**
   * 每个颜色分量乘以一减去目标 Alpha。
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_ALPHA: 9,

  /**
   * 每个颜色分量乘以常数颜色。
   * @type {number}
   * @constant
   */
  CONSTANT_COLOR: 10,

  /**
   * 每个颜色分量乘以一减去常数颜色。
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_COLOR: 11,

  /**
   * 每个颜色分量乘以常数 Alpha。
   * @type {number}
   * @constant
   */
  CONSTANT_ALPHA: 12,

  /**
   * 每个颜色分量乘以一减去常数 Alpha。
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_ALPHA: 13,

  /**
   * 每个颜色分量乘以最小化源 Alpha 或一减去目标 Alpha，以较小者为准。
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA_SATURATE: 14,
};

/**
 * 获取 WebGL 的 blendFunction 值。
 *
 * @param {BlendFunction} blendFunction 要获取对应 WebGL 值的混合函数。
 * @returns {number} 对应的 WebGL 值。
 *
 * @private
 */
BlendFunction.toWebGLConstant = function (blendFunction) {
  return blendFunction;
};

Object.freeze(BlendFunction);

export default BlendFunction;
