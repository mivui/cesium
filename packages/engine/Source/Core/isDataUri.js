import Check from "./Check.js";

const dataUriRegex = /^data:/i;

/**
 * 确定指定的 uri 是否为数据 uri。
 *
 * @function isDataUri
 *
 * @param {string} uri 要测试的 uri。
 * @returns {boolean} true（当 URI 为数据 URI 时）;否则为 false。
 *
 * @private
 */
function isDataUri(uri) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("uri", uri);
  //>>includeEnd('debug');

  return dataUriRegex.test(uri);
}
export default isDataUri;
