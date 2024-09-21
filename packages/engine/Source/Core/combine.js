import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 合并两个对象，将其属性复制到新的组合对象上。当两个对象具有相同的
 * 属性，则使用第一个对象上的属性值。 如果任一对象未定义，则
 * 它将被视为空对象。
 *
 * @example
 * const object1 = {
 *     propOne : 1,
 *     propTwo : {
 *         value1 : 10
 *     }
 * }
 * const object2 = {
 *     propTwo : 2
 * }
 * const final = Cesium.combine(object1, object2);
 *
 * // final === {
 * //     propOne : 1,
 * //     propTwo : {
 * //         value1 : 10
 * //     }
 * // }
 *
 * @param {object} [object1] 第一个object to merge.
 * @param {object} [object2] 第二个 object to merge.
 * @param {boolean} [deep=false] Perform a recursive merge.
 * @returns {object} The combined object containing all properties from both objects.
 *
 * @function
 */
function combine(object1, object2, deep) {
  deep = defaultValue(deep, false);

  const result = {};

  const object1Defined = defined(object1);
  const object2Defined = defined(object2);
  let property;
  let object1Value;
  let object2Value;
  if (object1Defined) {
    for (property in object1) {
      if (object1.hasOwnProperty(property)) {
        object1Value = object1[property];
        if (
          object2Defined &&
          deep &&
          typeof object1Value === "object" &&
          object2.hasOwnProperty(property)
        ) {
          object2Value = object2[property];
          if (typeof object2Value === "object") {
            result[property] = combine(object1Value, object2Value, deep);
          } else {
            result[property] = object1Value;
          }
        } else {
          result[property] = object1Value;
        }
      }
    }
  }
  if (object2Defined) {
    for (property in object2) {
      if (
        object2.hasOwnProperty(property) &&
        !result.hasOwnProperty(property)
      ) {
        object2Value = object2[property];
        result[property] = object2Value;
      }
    }
  }
  return result;
}
export default combine;
