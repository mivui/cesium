// @ts-check

import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定用于比较两个深度以进行深度测试的函数。
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
   * 如果传入深度小于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS: WebGLConstants.LESS,

  /**
   * 如果传入深度等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  EQUAL: WebGLConstants.EQUAL,

  /**
   * 如果传入深度小于或等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS_OR_EQUAL: WebGLConstants.LEQUAL,

  /**
   * 如果传入深度大于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER: WebGLConstants.GREATER,

  /**
   * 如果传入深度不等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  NOT_EQUAL: WebGLConstants.NOTEQUAL,

  /**
   * 如果传入深度大于或等于存储的深度，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER_OR_EQUAL: WebGLConstants.GEQUAL,

  /**
   * 深度测试总是通过。
   *
   * @type {number}
   * @constant
   */
  ALWAYS: WebGLConstants.ALWAYS,
};

Object.freeze(DepthFunction);

export default DepthFunction;
