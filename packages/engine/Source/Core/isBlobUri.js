import Check from "./Check.js";

const blobUriRegex = /^blob:/i;

/**
 * 确定指定的 uri 是否为 blob uri。
 *
 * @function isBlobUri
 *
 * @param {string} uri 要测试的 uri。
 * @returns {boolean} true（当 URI 为 blob URI 时）;否则为 false。
 *
 * @private
 */
function isBlobUri(uri) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("uri", uri);
  //>>includeEnd('debug');

  return blobUriRegex.test(uri);
}
export default isBlobUri;
