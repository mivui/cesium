import defined from "./defined.js";

/**
 * 构造一个由于运行时错误而抛出的异常对象，例如内存不足、无法编译着色器等。如果某个函数可能抛出此异常，调用代码应准备好捕获它。
 * <br /><br />
 * 另一方面，{@link DeveloperError} 表示由于开发者错误（例如无效参数）导致的异常，通常表明调用代码中存在错误。
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
   * 'RuntimeError'，指示此异常是由于运行时错误而抛出的。
   * @type {string}
   * @readonly
   */
  this.name = "RuntimeError";

  /**
   * 解释为何抛出此异常。
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
