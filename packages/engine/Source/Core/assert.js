// @ts-check

import DeveloperError from "./DeveloperError.js";

/**
 * 检查条件是否为真值，如果条件不满足则抛出指定消息。
 * `asserts condition` 返回类型允许 TypeScript 缩小条件类型，并在不进行进一步的 if/else 检查或空值合并的情况下强制执行更严格的类型。
 *
 * @example
 * assert(object.optionalProperty, 'Missing .optionalProperty');
 * object.optionalProperty.toString(); // 安全；无类型错误。
 *
 * @function
 *
 * @param {*} condition
 * @param {string} msg
 * @ignore
 */
function assert(condition, msg) {
  if (!condition) {
    throw new DeveloperError(msg);
  }
}

export default assert;
