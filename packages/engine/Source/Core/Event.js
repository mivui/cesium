import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 用于管理特定事件订阅者的通用工具类。
 * 此类通常在容器类内部实例化，并
 * 作为属性公开供其他人订阅。
 *
 * @alias Event
 * @template Listener extends (...args : any[]) => void = (...args : any[]) => void
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
  /**
   * @type {Map<Listener,Set<object>>}
   * @private
   */
  this._listeners = new Map();
  /**
   * @type {Map<Listener,Set<object>>}
   * @private
   */
  this._toRemove = new Map();
  /**
   * @type {Map<Listener,Set<object>>}
   * @private
   */
  this._toAdd = new Map();
  this._invokingListeners = false;
  this._listenerCount = 0; // 跟踪监听器+作用域对的数量
}

Object.defineProperties(Event.prototype, {
  /**
   * 当前订阅此事件的监听器数量。
   * @memberof Event.prototype
   * @type {number}
   * @readonly
   */
  numberOfListeners: {
    get: function () {
      return this._listenerCount;
    },
  },
});

/**
 * 注册一个回调函数，在事件触发时执行。
 * 可以提供可选的作用域作为<code>this</code>指针，
 * 函数将在该作用域中执行。
 *
 * @param {Listener} listener 事件触发时要执行的函数。
 * @param {object} [scope] 可选的对象作用域，作为<code>this</code>
 *        指针，监听器函数将在其中执行。
 * @returns {Event.RemoveCallback} 调用时将移除此事件监听器的函数。
 *
 * @see Event#raiseEvent
 * @see Event#removeEventListener
 */
Event.prototype.addEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');
  const event = this;

  const listenerMap = event._invokingListeners
    ? event._toAdd
    : event._listeners;
  const added = addEventListener(this, listenerMap, listener, scope);
  if (added) {
    event._listenerCount++;
  }

  return function () {
    event.removeEventListener(listener, scope);
  };
};

function addEventListener(event, listenerMap, listener, scope) {
  if (!listenerMap.has(listener)) {
    listenerMap.set(listener, new Set());
  }
  const scopes = listenerMap.get(listener);
  if (!scopes.has(scope)) {
    scopes.add(scope);
    return true;
  }

  return false;
}

/**
 * 取消注册先前注册的回调。
 *
 * @param {Listener} listener 要取消注册的函数。
 * @param {object} [scope] 最初传递给addEventListener的作用域。
 * @returns {boolean} 如果监听器已移除则返回<code>true</code>；如果监听器和作用域未向事件注册则返回<code>false</code>。
 *
 * @see Event#addEventListener
 * @see Event#raiseEvent
 */
Event.prototype.removeEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');

  const removedFromListeners = removeEventListener(
    this,
    this._listeners,
    listener,
    scope,
  );
  const removedFromToAdd = removeEventListener(
    this,
    this._toAdd,
    listener,
    scope,
  );

  const removed = removedFromListeners || removedFromToAdd;
  if (removed) {
    this._listenerCount--;
  }

  return removed;
};

function removeEventListener(event, listenerMap, listener, scope) {
  const scopes = listenerMap.get(listener);
  if (!scopes || !scopes.has(scope)) {
    return false;
  }

  if (event._invokingListeners) {
    if (!addEventListener(event, event._toRemove, listener, scope)) {
      // Already marked for removal
      return false;
    }
  } else {
    scopes.delete(scope);
    if (scopes.size === 0) {
      listenerMap.delete(listener);
    }
  }

  return true;
}

/**
 * 通过调用每个已注册的监听器并传入所有提供的参数来触发事件。
 *
 * @param {...Parameters<Listener>} arguments 此方法接受任意数量的参数，并将它们传递给监听器函数。
 *
 * @see Event#addEventListener
 * @see Event#removeEventListener
 */
Event.prototype.raiseEvent = function () {
  this._invokingListeners = true;

  for (const [listener, scopes] of this._listeners.entries()) {
    if (!defined(listener)) {
      continue;
    }

    for (const scope of scopes) {
      listener.apply(scope, arguments);
    }
  }

  this._invokingListeners = false;

  // Actually add items marked for addition
  for (const [listener, scopes] of this._toAdd.entries()) {
    for (const scope of scopes) {
      addEventListener(this, this._listeners, listener, scope);
    }
  }
  this._toAdd.clear();

  // Actually remove items marked for removal
  for (const [listener, scopes] of this._toRemove.entries()) {
    for (const scope of scopes) {
      removeEventListener(this, this._listeners, listener, scope);
    }
  }
  this._toRemove.clear();
};

/**
 * A function that removes a listener.
 * @callback Event.RemoveCallback
 */

export default Event;
