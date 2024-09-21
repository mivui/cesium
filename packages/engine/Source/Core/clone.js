import defaultValue from "./defaultValue.js";

/**
 * 克隆对象，返回包含相同属性的新对象。
 *
 * @function
 *
 * @param {object} object 要克隆的对象。
 * @param {boolean} [deep=false] 如果为 true，则所有属性都将递归深度克隆。
 * @returns {object} 克隆的对象。
 */
function clone(object, deep) {
  if (object === null || typeof object !== "object") {
    return object;
  }

  deep = defaultValue(deep, false);

  const result = new object.constructor();
  for (const propertyName in object) {
    if (object.hasOwnProperty(propertyName)) {
      let value = object[propertyName];
      if (deep) {
        value = clone(value, deep);
      }
      result[propertyName] = value;
    }
  }

  return result;
}
export default clone;
