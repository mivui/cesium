import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";

/**
 * 一个 {@link Property}，其值由回调函数延迟计算。
 *
 * @alias CallbackProperty
 * @constructor
 *
 * @param {CallbackProperty.Callback} callback 评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code>（当回调函数每次都返回相同的值时），如果值会发生变化，则为 <code>false</code>。
 */
function CallbackProperty(callback, isConstant) {
  this._callback = undefined;
  this._isConstant = undefined;
  this._definitionChanged = new Event();
  this.setCallback(callback, isConstant);
}

Object.defineProperties(CallbackProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。
   * @memberof CallbackProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._isConstant;
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 每当调用 setCallback 时，定义都会更改。
   * @memberof CallbackProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取属性的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者 result 参数未提供或不受支持，则为新实例。
 */
CallbackProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this._callback(time, result);
};

/**
 * 设置要使用的回调。
 *
 * @param {CallbackProperty.Callback} callback 评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code>（当回调函数每次都返回相同的值时），如果值会发生变化，则为 <code>false</code>。
 */
CallbackProperty.prototype.setCallback = function (callback, isConstant) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(callback)) {
    throw new DeveloperError("callback is required.");
  }
  if (!defined(isConstant)) {
    throw new DeveloperError("isConstant is required.");
  }
  //>>includeEnd('debug');

  const changed =
    this._callback !== callback || this._isConstant !== isConstant;

  this._callback = callback;
  this._isConstant = isConstant;

  if (changed) {
    this._definitionChanged.raiseEvent(this);
  }
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
CallbackProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CallbackProperty &&
      this._callback === other._callback &&
      this._isConstant === other._isConstant)
  );
};

/**
 * 返回属性值的函数。
 * @callback CallbackProperty.Callback
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象。如果省略，则函数必须创建并返回一个新实例。
 * @returns {object} 修改后的结果参数, 或者 result 参数未提供或不受支持，则为新实例。
 */
export default CallbackProperty;
