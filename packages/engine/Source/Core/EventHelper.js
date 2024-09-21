import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个方便的对象，简化了附加事件侦听器的常见模式
 * 添加到多个事件中，然后稍后立即删除所有这些侦听器，例如，在
 * 销毁方法。
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
 * // later...
 * helper.removeAll();
 *
 * @see Event
 */
function EventHelper() {
  this._removalFunctions = [];
}

/**
 * 向事件添加侦听器，并记录注册以供稍后清理。
 *
 * @param {Event} event 要附加到的事件。
 * @param {Function} listener 引发事件时要执行的函数。
 * @param {object} [scope] 一个可选的对象范围，用作 <code>this</code>
 * 侦听器函数将在其中执行的指针。
 * @returns {EventHelper.RemoveCallback} 一个函数，该函数将在调用时删除此事件侦听器。
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
 * 取消注册所有以前添加的侦听器。
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
 * 删除侦听器的函数。
 * @callback EventHelper.RemoveCallback
 */
export default EventHelper;
