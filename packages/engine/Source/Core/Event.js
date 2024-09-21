import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 用于管理特定事件的订阅者的通用实用程序类。
 * 这个类通常在容器类中实例化，并且
 * 作为属性公开，供其他人订阅。
 *
 * @alias Event
 * @template Listener extends (...args: any[]) => void = (...args: any[]) => void
 * @constructor
 * @example
 * MyObject.prototype.myListener = function(arg1, arg2) {
 *     this.myArg1Copy = arg1;
 *     this.myArg2Copy = arg2;
 * }
 *
 * const myObjectInstance = new MyObject();
 * const evt = new Cesium.Event();
 * evt.addEventListener(MyObject.prototype.myListener, myObjectInstance);
 * evt.raiseEvent('1', '2');
 * evt.removeEventListener(MyObject.prototype.myListener);
 */
function Event() {
  this._listeners = [];
  this._scopes = [];
  this._toRemove = [];
  this._insideRaiseEvent = false;
}

Object.defineProperties(Event.prototype, {
  /**
   * The number of listeners currently subscribed to the event.
   * @memberof Event.prototype
   * @type {number}
   * @readonly
   */
  numberOfListeners: {
    get: function () {
      return this._listeners.length - this._toRemove.length;
    },
  },
});

/**
 * 注册一个回调函数，以便在引发事件时执行。
 * 可以提供一个可选的范围作为 <code>this</code> 指针
 * 函数将在其中执行。
 *
 * @param {Listener} listener 引发事件时要执行的函数。
 * @param {object} [scope] 一个可选的对象范围，用作 <code>this</code>
 * 侦听器函数将在其中执行的指针。
 * @returns {Event.RemoveCallback} 一个函数，该函数将在调用时删除此事件侦听器。
 *
 * @see Event#raiseEvent
 * @see Event#removeEventListener
 */
Event.prototype.addEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');

  this._listeners.push(listener);
  this._scopes.push(scope);

  const event = this;
  return function () {
    event.removeEventListener(listener, scope);
  };
};

/**
 * 取消注册之前注册的回调。
 *
 * @param {Listener} listener 要注销的函数。
 * @param {object} [scope] 最初传递给 addEventListener 的作用域。
 * @returns {boolean} <code>true</code>，如果监听器被删除;<code>如果</code>侦听器和范围未向事件注册，则为 false。
 *
 * @see Event#addEventListener
 * @see Event#raiseEvent
 */
Event.prototype.removeEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');

  const listeners = this._listeners;
  const scopes = this._scopes;

  let index = -1;
  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i] === listener && scopes[i] === scope) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    if (this._insideRaiseEvent) {
      //In order to allow removing an event subscription from within
      //a callback, we don't actually remove the items here.  Instead
      //remember the index they are at and undefined their value.
      this._toRemove.push(index);
      listeners[index] = undefined;
      scopes[index] = undefined;
    } else {
      listeners.splice(index, 1);
      scopes.splice(index, 1);
    }
    return true;
  }

  return false;
};

function compareNumber(a, b) {
  return b - a;
}

/**
 * 通过使用提供的所有参数调用每个已注册的侦听器来引发事件。
 *
 * @param {...Parameters<Listener>} 参数 此方法接受任意数量的参数并将它们传递给侦听器函数。
 *
 * @see Event#addEventListener
 * @see Event#removeEventListener
 */
Event.prototype.raiseEvent = function () {
  this._insideRaiseEvent = true;

  let i;
  const listeners = this._listeners;
  const scopes = this._scopes;
  let length = listeners.length;

  for (i = 0; i < length; i++) {
    const listener = listeners[i];
    if (defined(listener)) {
      listeners[i].apply(scopes[i], arguments);
    }
  }

  //Actually remove items removed in removeEventListener.
  const toRemove = this._toRemove;
  length = toRemove.length;
  if (length > 0) {
    toRemove.sort(compareNumber);
    for (i = 0; i < length; i++) {
      const index = toRemove[i];
      listeners.splice(index, 1);
      scopes.splice(index, 1);
    }
    toRemove.length = 0;
  }

  this._insideRaiseEvent = false;
};

/**
 * 删除侦听器的函数。
 * @callback Event.RemoveCallback
 */

export default Event;
