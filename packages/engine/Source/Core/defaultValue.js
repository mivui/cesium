/**
 * 如果未定义，则返回第一个参数，否则返回第二个参数。
 * 用于设置参数的默认值。
 *
 * @function
 *
 * @param {*} a
 * @param {*} b
 * @returns {*} 如果不是 undefined，则返回第一个参数，否则返回第二个参数。
 *
 * @example
 * param = Cesium.defaultValue（param， '默认'）;
 */
function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

/**
 * 一个冻结的空对象，可以用作作为
 * 对象字面量。
 * @type {object}
 * @memberof defaultValue
 */
defaultValue.EMPTY_OBJECT = Object.freeze({});

export default defaultValue;
