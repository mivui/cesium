import defined from "./defined.js";

/**
 * 构造一个异常对象，该对象由于运行时可能发生的错误而引发，例如，
 * 内存不足、无法编译着色器等。 如果函数可能会抛出 this
 * exception，则调用代码应准备好捕获它。
 * <br /><br />
 * 另一方面，{@link DeveloperError} 表示异常到期
 * 添加到开发者错误（例如，无效的参数）中，这通常表示
 * 调用代码。
 *
 * @alias RuntimeError
 * @constructor
 * @extends Error
 *
 * @param {string} [message] 此异常的错误消息。
 *
 * @see DeveloperError
 */
function RuntimeError(message) {
  /**
   * 'RuntimeError' 指示由于运行时错误而引发此异常。
   * @type {string}
   * @readonly
   */
  this.name = "RuntimeError";

  /**
   * 引发此异常的原因的说明。
   * @type {string}
   * @readonly
   */
  this.message = message;

  //Browsers such as IE don't have a stack property until you actually throw the error.
  let stack;
  try {
    throw new Error();
  } catch (e) {
    stack = e.stack;
  }

  /**
   * 此异常的堆栈跟踪（如果可用）。
   * @type {string}
   * @readonly
   */
  this.stack = stack;
}

if (defined(Object.create)) {
  RuntimeError.prototype = Object.create(Error.prototype);
  RuntimeError.prototype.constructor = RuntimeError;
}

RuntimeError.prototype.toString = function () {
  let str = `${this.name}: ${this.message}`;

  if (defined(this.stack)) {
    str += `\n${this.stack.toString()}`;
  }

  return str;
};
export default RuntimeError;
