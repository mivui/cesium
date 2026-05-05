/**
 * @function
 *
 * @param {*} value 对象。
 * @returns {boolean} 如果对象已定义则返回true，否则返回false。
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
