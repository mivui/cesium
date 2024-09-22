import DeveloperError from "./DeveloperError.js";

/**
 * 使用在
 * 对象的上下文，以便始终立即调用 new 函数
 * 在旧的之前。
 *
 * @private
 */
function wrapFunction(obj, oldFunction, newFunction) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof oldFunction !== "function") {
    throw new DeveloperError("oldFunction is required to be a function.");
  }

  if (typeof newFunction !== "function") {
    throw new DeveloperError("oldFunction is required to be a function.");
  }
  //>>includeEnd('debug');

  return function () {
    newFunction.apply(obj, arguments);
    oldFunction.apply(obj, arguments);
  };
}
export default wrapFunction;
