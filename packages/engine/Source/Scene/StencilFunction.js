import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定用于比较模板测试的模板值的函数。
 *
 * @enum {number}
 */
const StencilFunction = {
  /**
   * 模板测试永远不会通过。
   *
   * @type {number}
   * @constant
   */
  NEVER: WebGLConstants.NEVER,

  /**
   * 当掩码参考值小于掩码的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS: WebGLConstants.LESS,

  /**
   * 当掩码参考值等于掩码的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  EQUAL: WebGLConstants.EQUAL,

  /**
   * 当被遮罩的参考值小于或等于被遮罩的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS_OR_EQUAL: WebGLConstants.LEQUAL,

  /**
   * 当掩码参考值大于掩码模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER: WebGLConstants.GREATER,

  /**
   * 当掩码的参考值不等于掩码的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  NOT_EQUAL: WebGLConstants.NOTEQUAL,

  /**
   * 当掩码参考值大于或等于掩码的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER_OR_EQUAL: WebGLConstants.GEQUAL,

  /**
   * 模板测试始终通过。
   *
   * @type {number}
   * @constant
   */
  ALWAYS: WebGLConstants.ALWAYS,
};
export default Object.freeze(StencilFunction);
