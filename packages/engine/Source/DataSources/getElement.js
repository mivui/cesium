import DeveloperError from "../Core/DeveloperError.js";

/**
 * 如果 element 是字符串，则通过 ID 在 DOM 中查找元素。否则返回 element。
 *
 * @private
 *
 * @exception {DeveloperError} ID 为 "id" 的元素在文档中不存在。
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
