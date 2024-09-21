import Uri from "urijs";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 给定相对 Uri 和基本 Uri，返回相对 Uri 的绝对 Uri。
 * @function
 *
 * @param {string} relative 相对 Uri。
 * @param {string} [base] 基 Uri。
 * @returns {string} 给定相对 Uri 的绝对 Uri。
 *
 * @example
 * //absolute Uri will be "https://test.com/awesome.png";
 * const absoluteUri = Cesium.getAbsoluteUri('awesome.png', 'https://test.com');
 */
function getAbsoluteUri(relative, base) {
  let documentObject;
  if (typeof document !== "undefined") {
    documentObject = document;
  }

  return getAbsoluteUri._implementation(relative, base, documentObject);
}

getAbsoluteUri._implementation = function (relative, base, documentObject) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(relative)) {
    throw new DeveloperError("relative uri is required.");
  }
  //>>includeEnd('debug');

  if (!defined(base)) {
    if (typeof documentObject === "undefined") {
      return relative;
    }
    base = defaultValue(documentObject.baseURI, documentObject.location.href);
  }

  const relativeUri = new Uri(relative);
  if (relativeUri.scheme() !== "") {
    return relativeUri.toString();
  }
  return relativeUri.absoluteTo(base).toString();
};
export default getAbsoluteUri;
