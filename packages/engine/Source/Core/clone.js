/**
 * 克隆一个对象，返回包含相同属性的新对象。
 *
 * @function
 *
 * @param {object} object 要克隆的对象。
 * @param {boolean} [deep=false] 如果为true，所有属性将被递归深度克隆。
 * @returns {object} 克隆的对象。
 */
function clone(object, deep) {
  if (object === null || typeof object !== "object") {
    return object;
  }

  deep = deep ?? false;

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
