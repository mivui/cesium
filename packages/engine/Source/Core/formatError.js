import defined from "./defined.js";

/**
 * 将错误对象格式化为 String。 如果可用，则使用 name、message 和 stack
 * 属性，否则将回退到 toString() 上。
 *
 * @function
 *
 * @param {*} object 要在数组中查找的项。
 * @returns {string} 包含格式化错误的字符串。
 */
function formatError(object) {
  let result;

  const name = object.name;
  const message = object.message;
  if (defined(name) && defined(message)) {
    result = `${name}: ${message}`;
  } else {
    result = object.toString();
  }

  const stack = object.stack;
  if (defined(stack)) {
    result += `\n${stack}`;
  }

  return result;
}
export default formatError;
