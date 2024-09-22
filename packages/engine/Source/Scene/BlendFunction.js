import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定如何计算混合因子。
 *
 * @enum {number}
 */
const BlendFunction = {
  /**
   * 混合因子为零。
   *
   * @type {number}
   * @constant
   */
  ZERO: WebGLConstants.ZERO,

  /**
   * 混合因子为 1。
   *
   * @type {number}
   * @constant
   */
  ONE: WebGLConstants.ONE,

  /**
   * The blend factor is 源颜色。
   *
   * @type {number}
   * @constant
   */
  SOURCE_COLOR: WebGLConstants.SRC_COLOR,

  /**
   * The blend factor is one minus 源颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_COLOR: WebGLConstants.ONE_MINUS_SRC_COLOR,

  /**
   * 混合因子是目标颜色。
   *
   * @type {number}
   * @constant
   */
  DESTINATION_COLOR: WebGLConstants.DST_COLOR,

  /**
   * 混合系数为 1 减去目标颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_COLOR: WebGLConstants.ONE_MINUS_DST_COLOR,

  /**
   * 混合因子是源 Alpha。
   *
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA: WebGLConstants.SRC_ALPHA,

  /**
   * 混合系数为 1 减去源 Alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_ALPHA: WebGLConstants.ONE_MINUS_SRC_ALPHA,

  /**
   * 混合因子是目标 Alpha。
   *
   * @type {number}
   * @constant
   */
  DESTINATION_ALPHA: WebGLConstants.DST_ALPHA,

  /**
   * 混合因子是 1 减去目标 Alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_ALPHA: WebGLConstants.ONE_MINUS_DST_ALPHA,

  /**
   * 混合因子是恒定颜色。
   *
   * @type {number}
   * @constant
   */
  CONSTANT_COLOR: WebGLConstants.CONSTANT_COLOR,

  /**
   * 混合因子为 1 减去常数颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_COLOR: WebGLConstants.ONE_MINUS_CONSTANT_COLOR,

  /**
   * 混合因子是常数 alpha。
   *
   * @type {number}
   * @constant
   */
  CONSTANT_ALPHA: WebGLConstants.CONSTANT_ALPHA,

  /**
   * 混合因子是 1 减去常数 alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_ALPHA: WebGLConstants.ONE_MINUS_CONSTANT_ALPHA,

  /**
   * 混合因子是饱和的源 Alpha。
   *
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA_SATURATE: WebGLConstants.SRC_ALPHA_SATURATE,
};
export default Object.freeze(BlendFunction);
