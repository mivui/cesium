import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 根据模板测试的结果确定所采取的操作。
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
   * 将模板缓冲区值替换为参考值。
   *
   * @type {number}
   * @constant
   */
  REPLACE: WebGLConstants.REPLACE,

  /**
   * 递增模板缓冲区值，钳制到无符号字节。
   *
   * @type {number}
   * @constant
   */
  INCREMENT: WebGLConstants.INCR,

  /**
   * 递减模板缓冲区值，钳制为零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT: WebGLConstants.DECR,

  /**
   * 按位反转现有模板缓冲区值。
   *
   * @type {number}
   * @constant
   */
  INVERT: WebGLConstants.INVERT,

  /**
   * 递增模板缓冲区值，当超出无符号字节范围时换行为零。
   *
   * @type {number}
   * @constant
   */
  INCREMENT_WRAP: WebGLConstants.INCR_WRAP,

  /**
   * 递减模具缓冲区值，换行到最大无符号字节，而不是低于零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT_WRAP: WebGLConstants.DECR_WRAP,
};
export default Object.freeze(StencilOperation);
