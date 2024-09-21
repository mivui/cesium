import defined from "./defined.js";

/**
 * 构造一个由于开发人员错误（例如无效参数）而引发的异常对象，
 * 参数超出范围等。 此异常应仅在开发期间引发;
 * 它通常表示调用代码中存在 bug。 此异常绝不应为
 *抓住;相反，调用代码应努力不生成它。
 * <br /><br />
 * 另一方面，{@link RuntimeError} 表示可能
 * 在运行时抛出，例如，内存不足，因此应准备调用代码
 * 来捕捉。
 *
 * @alias DeveloperError
 * @constructor
 * @extends 错误
 *
 * @param {string} [message] 此异常的错误消息。
 *
 * @see RuntimeError
 */
function DeveloperError(message) {
  /**
   * “DeveloperError”，表示由于开发人员错误而引发此异常。
   * @type {string}
   * @readonly
   */
  this.name = "DeveloperError";

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
 * @private
 */
DeveloperError.throwInstantiationError = function () {
  throw new DeveloperError(
    "This function defines an interface and should not be called directly."
  );
};
export default DeveloperError;
