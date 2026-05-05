import defined from "./defined.js";

/**
 * 构造因开发者错误而抛出的异常对象，例如无效参数、
 * 参数超出范围等。此异常应仅在开发期间抛出；
 * 通常表示调用代码中存在错误。此异常永远不应被
 * 捕获；相反，调用代码应努力不产生此异常。
 * <br /><br />
 * 另一方面，{@link RuntimeError}表示可能在运行时
 * 抛出的异常，例如内存不足，调用代码应准备
 * 捕获它。
 *
 * @alias DeveloperError
 * @constructor
 * @extends Error
 *
 * @param {string} [message] 此异常的错误消息。
 *
 * @see RuntimeError
 */
function DeveloperError(message) {
  /**
   * 'DeveloperError'表示此异常因开发者错误而抛出。
   * @type {string}
   * @readonly
   */
  this.name = "DeveloperError";

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
  DeveloperError.prototype = Object.create(Error.prototype);
  DeveloperError.prototype.constructor = DeveloperError;
}

DeveloperError.prototype.toString = function () {
  let str = `${this.name}: ${this.message}`;

  if (defined(this.stack)) {
    str += `\n${this.stack.toString()}`;
  }

  return str;
};

/**
 * @returns {never}
 * @ignore
 */
DeveloperError.throwInstantiationError = function () {
  throw new DeveloperError(
    "此函数定义接口，不应直接调用。",
  );
};
export default DeveloperError;
