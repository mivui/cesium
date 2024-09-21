/**
 * 用于在完成时解析 promise 的函数。
 * @callback defer.resolve
 *
 * @param {*} value 结果值。
 */

/**
 * 用于在失败时拒绝 Promise 的函数。
 * @callback defer.reject
 *
 * @param {*} error 错误。
 */

/**
 * 一个包含 promise 对象以及用于解析或拒绝 promise 的函数的对象。
 *
 * @typedef {object} defer.deferred
 * @property {defer.resolve} resolve 调用时解析 promise。
 * @property {defer.reject} reject 调用时拒绝 promise。
 * @property {Promise} promise Promise 对象。
 */

/**
 * 创建一个 deferred 对象，其中包含一个 promise 对象，以及用于解析或拒绝 promise 的函数。
 * @returns {defer.deferred}
 * @private
 */
function defer() {
  let resolve;
  let reject;
  const promise = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });

  return {
    resolve: resolve,
    reject: reject,
    promise: promise,
  };
}

export default defer;
