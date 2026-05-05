import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个便利对象，简化了将事件监听器
 * 附加到多个事件，然后在稍后（例如，
 * 在销毁方法中）一次性移除所有那些监听器的常见模式。
 *
 * @alias EventHelper
 * @constructor
 *
 *
 * @example
 * const helper = new Cesium.EventHelper();
 *
 * helper.add(someObject.event, listener1, this);
 * helper.add(otherObject.event, listener2, this);
 *
 * // 稍后...
 * helper.removeAll();
 *
 * @see Event
 */
function EventHelper() {
  this._removalFunctions = [];
}

/**
 * 向事件添加监听器，并记录注册以便稍后清理。
 *
 * @param {Event} event 要附加到的事件。
 * @param {Function} listener 事件触发时要执行的函数。
 * @param {object} [scope] 可选的对象作用域，作为<code>this</code>
 *        指针，监听器函数将在其中执行。
 * @returns {EventHelper.RemoveCallback} 调用时将移除此事件监听器的函数。
 *
 * @see Event#addEventListener
 */
EventHelper.prototype.add = function (event, listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(event)) {
    throw new DeveloperError("event is required");
  }
  //>>includeEnd('debug');

  const removalFunction = event.addEventListener(listener, scope);
  this._removalFunctions.push(removalFunction);

  const that = this;
  return function () {
    removalFunction();
    const removalFunctions = that._removalFunctions;
    removalFunctions.splice(removalFunctions.indexOf(removalFunction), 1);
  };
};

/**
 * 取消注册所有先前添加的监听器。
 *
 * @see Event#removeEventListener
 */
EventHelper.prototype.removeAll = function () {
  const removalFunctions = this._removalFunctions;
  for (let i = 0, len = removalFunctions.length; i < len; ++i) {
    removalFunctions[i]();
  }
  removalFunctions.length = 0;
};

/**
 * 移除监听器的函数。
 * @callback EventHelper.RemoveCallback
 */
export default EventHelper;
