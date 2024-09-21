import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import oneTimeWarning from "./oneTimeWarning.js";

/**
 * 将弃用消息记录到控制台。 使用此功能代替
 * 直接<code>console.log</code>，因为这不会记录重复的消息
 * 除非它从多个 worker 调用。
 *
 * @function deprecationWarning
 *
 * @param {string} identifier 此已弃用 API 的唯一标识符。
 * @param {string} message 要记录到控制台的消息。
 *
 * @example
 * // Deprecated function or class
 * function Foo() {
 *    deprecationWarning('Foo', 'Foo was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use newFoo instead.');
 *    // ...
 * }
 *
 * // Deprecated function
 * Bar.prototype.func = function() {
 *    deprecationWarning('Bar.func', 'Bar.func() was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newFunc() instead.');
 *    // ...
 * };
 *
 * // Deprecated property
 * Object.defineProperties(Bar.prototype, {
 *     prop : {
 *         get : function() {
 *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
 *             // ...
 *         },
 *         set : function(value) {
 *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
 *             // ...
 *         }
 *     }
 * });
 *
 * @private
 */
function deprecationWarning(identifier, message) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(identifier) || !defined(message)) {
    throw new DeveloperError("identifier and message are required.");
  }
  //>>includeEnd('debug');

  oneTimeWarning(identifier, message);
}
export default deprecationWarning;
