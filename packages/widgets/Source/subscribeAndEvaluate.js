import knockout from "./ThirdParty/knockout.js";

/**
 * 订阅一个Knockout可观察对象ES5属性，并立即启动
 * 用属性的当前值回调。
 *
 * @private
 *
 * @function subscribeAndEvaluate
 *
 * @param {object} owner 包含observable属性的对象。
 * @param {string} observablePropertyName 可观察属性的名称。
 * @param {Function} callback 回调函数。
 * @param {object} [target] this在回调函数中的值。
 * @param {string} [event='change'] 要接收通知的事件的名称。
 * @returns 来自Knockout的订阅对象，稍后可用于处理订阅。
 */
function subscribeAndEvaluate(
  owner,
  observablePropertyName,
  callback,
  target,
  event
) {
  callback.call(target, owner[observablePropertyName]);
  return knockout
    .getObservable(owner, observablePropertyName)
    .subscribe(callback, target, event);
}
export default subscribeAndEvaluate;
