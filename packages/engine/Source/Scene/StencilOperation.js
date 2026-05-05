// @ts-check

import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定基于模板测试结果采取的操作。
 *
 * @enum {number}
 */
const StencilOperation = {
  /**
   * 将模板缓冲区值设置为零。
   *
   * @type {number}
   * @constant
   */
  ZERO: WebGLConstants.ZERO,

  /**
   * 不更改模板缓冲区。
   *
   * @type {number}
   * @constant
   */
  KEEP: WebGLConstants.KEEP,

  /**
   * 用参考值替换模板缓冲区值。
   *
   * @type {number}
   * @constant
   */
  REPLACE: WebGLConstants.REPLACE,

  /**
   * 递增模板缓冲区值，钳位到无符号字节。
   *
   * @type {number}
   * @constant
   */
  INCREMENT: WebGLConstants.INCR,

  /**
   * 递减模板缓冲区值，钳位到零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT: WebGLConstants.DECR,

  /**
   * 按位反转现有的模板缓冲区值。
   *
   * @type {number}
   * @constant
   */
  INVERT: WebGLConstants.INVERT,

  /**
   * 递增模板缓冲区值，当超过无符号字节范围时回绕到零。
   *
   * @type {number}
   * @constant
   */
  INCREMENT_WRAP: WebGLConstants.INCR_WRAP,

  /**
   * 递减模板缓冲区值，回绕到最大无符号字节而不是低于零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT_WRAP: WebGLConstants.DECR_WRAP,
};

Object.freeze(StencilOperation);

export default StencilOperation;
