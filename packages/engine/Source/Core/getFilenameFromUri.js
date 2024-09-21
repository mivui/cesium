import Uri from "urijs";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 给定 URI，返回 URI 的最后一段，删除任何路径或查询信息。
 * @function getFilenameFromUri
 *
 * @param {string} uri The Uri.
 * @returns {string} Uri 的最后一段。
 *
 * @example
 * //fileName will be"simple.czml";
 * const fileName = Cesium.getFilenameFromUri('/Gallery/simple.czml?value=true&example=false');
 */
function getFilenameFromUri(uri) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(uri)) {
    throw new DeveloperError("uri is required.");
  }
  //>>includeEnd('debug');

  const uriObject = new Uri(uri);
  uriObject.normalize();
  let path = uriObject.path();
  const index = path.lastIndexOf("/");
  if (index !== -1) {
    path = path.substr(index + 1);
  }
  return path;
}
export default getFilenameFromUri;
