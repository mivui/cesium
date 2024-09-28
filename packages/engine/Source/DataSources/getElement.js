import DeveloperError from "../Core/DeveloperError.js";

/**
 * 如果 element 是字符串，则按 ID 查找 DOM 中的元素。 否则返回 element。
 *
 * @private
 *
 * @exception {DeveloperError} Element with id "id" does not exist in the document.
 */
function getElement(element) {
  if (typeof element === "string") {
    const foundElement = document.getElementById(element);

    //>>includeStart('debug', pragmas.debug);
    if (foundElement === null) {
      throw new DeveloperError(
        `Element with id "${element}" does not exist in the document.`,
      );
    }
    //>>includeEnd('debug');

    element = foundElement;
  }
  return element;
}
export default getElement;
