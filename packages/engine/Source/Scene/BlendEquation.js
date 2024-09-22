import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定如何组合两个像素的值。
 *
 * @enum {number}
 */
const BlendEquation = {
  /**
   * 像素值按组件添加。 这用于半透明的加法混合。
   *
   * @type {number}
   * @constant
   */
  ADD: WebGLConstants.FUNC_ADD,

  /**
   * 像素值按组件（源 - 目标）减去。 这用于半透明的 Alpha 混合。
   *
   * @type {number}
   * @constant
   */
  SUBTRACT: WebGLConstants.FUNC_SUBTRACT,

  /**
   * 按组件减去像素值（目标 - 源）。
   *
   * @type {number}
   * @constant
   */
  REVERSE_SUBTRACT: WebGLConstants.FUNC_REVERSE_SUBTRACT,

  /**
   * 像素值为最小函数 （min（source， destination）） 提供。
   *
   * 此方程式对每个像素颜色分量起作用。
   *
   * @type {number}
   * @constant
   */
  MIN: WebGLConstants.MIN,

  /**
   * 像素值为最大函数 （max（source， destination）） 提供。
   *
   * 此方程式对每个像素颜色分量起作用。
   *
   * @type {number}
   * @constant
   */
  MAX: WebGLConstants.MAX,
};
export default Object.freeze(BlendEquation);
