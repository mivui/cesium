import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定用于比较深度测试的两个深度的函数。
 *
 * @enum {number}
 */
const DepthFunction = {
  /**
   * 深度测试永远不会通过。
   *
   * @type {number}
   * @constant
   */
  NEVER: WebGLConstants.NEVER,

  /**
   * 如果输入深度小于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS: WebGLConstants.LESS,

  /**
   * 如果输入深度等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  EQUAL: WebGLConstants.EQUAL,

  /**
   * 如果输入深度小于或等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS_OR_EQUAL: WebGLConstants.LEQUAL,

  /**
   * 如果输入深度大于存储深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER: WebGLConstants.GREATER,

  /**
   * 如果输入深度不等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  NOT_EQUAL: WebGLConstants.NOTEQUAL,

  /**
   * 如果输入深度大于或等于存储深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER_OR_EQUAL: WebGLConstants.GEQUAL,

  /**
   * 深度测试总是通过的。
   *
   * @type {number}
   * @constant
   */
  ALWAYS: WebGLConstants.ALWAYS,
};
export default Object.freeze(DepthFunction);
