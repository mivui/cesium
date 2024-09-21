/**
 * @function
 *
 * @param {*} value The object.
 * @returns {boolean} Returns true if the object is defined, returns false 否则。
 *
 * @example
 * if (Cesium.defined(positions)) {
 *      doSomething();
 * } else {
 *      doSomethingElse();
 * }
 */
function defined(value) {
  return value !== undefined && value !== null;
}
export default defined;
