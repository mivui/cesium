/**
 * 确定如何混合源颜色和目标颜色。
 *
 * @enum {number}
 *
 * @see DrawCommand.blending
 */
const BlendEquation = {
  /**
   * 源和目标分量相加。
   * @type {number}
   * @constant
   */
  ADD: 0,

  /**
   * 从源分量中减去目标分量。
   * @type {number}
   * @constant
   */
  SUBTRACT: 1,

  /**
   * 从目标分量中减去源分量。
   * @type {number}
   * @constant
   */
  REVERSE_SUBTRACT: 2,
};

/**
 * 获取 WebGL 的 blendEquation 值。
 *
 * @param {BlendEquation} blendEquation 要获取对应 WebGL 值的混合方程。
 * @returns {number} 对应的 WebGL 值。
 *
 * @private
 */
BlendEquation.toWebGLConstant = function (blendEquation) {
  return blendEquation;
};

Object.freeze(BlendEquation);

export default BlendEquation;
