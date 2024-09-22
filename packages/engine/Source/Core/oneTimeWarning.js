import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

const warnings = {};

/**
 * 将一次性消息记录到控制台。 使用此功能代替
 * 直接<code>console.log</code>，因为这不会记录重复的消息
 * 除非它从多个 worker 调用。
 *
 * @function oneTimeWarning
 *
 * @param {string} identifier 此警告的唯一标识符。
 * @param {string} [message=identifier] 要记录到控制台的消息。
 *
 * @example
 * for(let i=0;i<foo.length;++i) {
 *    if (!defined(foo[i].bar)) {
 *       // Something that can be recovered from but may happen a lot
 *       oneTimeWarning('foo.bar undefined', 'foo.bar is undefined. Setting to 0.');
 *       foo[i].bar = 0;
 *       // ...
 *    }
 * }
 *
 * @private
 */
function oneTimeWarning(identifier, message) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(identifier)) {
    throw new DeveloperError("identifier is required.");
  }
  //>>includeEnd('debug');

  if (!defined(warnings[identifier])) {
    warnings[identifier] = true;
    console.warn(defaultValue(message, identifier));
  }
}

oneTimeWarning.geometryOutlines =
  "Entity geometry outlines are unsupported on terrain. Outlines will be disabled. To enable outlines, disable geometry terrain clamping by explicitly setting height to 0.";

oneTimeWarning.geometryZIndex =
  "Entity geometry with zIndex are unsupported when height or extrudedHeight are defined.  zIndex will be ignored";

oneTimeWarning.geometryHeightReference =
  "Entity corridor, ellipse, polygon or rectangle with heightReference must also have a defined height.  heightReference will be ignored";
oneTimeWarning.geometryExtrudedHeightReference =
  "Entity corridor, ellipse, polygon or rectangle with extrudedHeightReference must also have a defined extrudedHeight.  extrudedHeightReference will be ignored";
export default oneTimeWarning;
