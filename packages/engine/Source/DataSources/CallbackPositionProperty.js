import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";

/**
 * 一个 {@link PositionProperty}，其值由回调函数延迟计算。
 *
 * @alias CallbackPositionProperty
 * @constructor
 *
 * @param {CallbackPositionProperty.Callback} callback 计算 position 属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code>（当回调函数每次都返回相同的值时），如果值会发生变化，则为 <code>false</code>。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Callback%20Position%20Property.html|Cesium Sandcastle Callback Position Property Demo}
 */
function CallbackPositionProperty(callback, isConstant, referenceFrame) {
  this._callback = undefined;
  this._isConstant = undefined;
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
  this._definitionChanged = new Event();
  this.setCallback(callback, isConstant);
}

Object.defineProperties(CallbackPositionProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。
   * @memberof CallbackPositionProperty.prototype
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
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof CallbackPositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取定义位置的参考帧。
   * @memberof CallbackPositionProperty.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取固定帧中给定时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CallbackPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 设置要使用的回调。
 *
 * @param {CallbackPositionProperty.Callback} callback 评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code>（当回调函数每次都返回相同的值时），如果值会发生变化，则为 <code>false</code>。
 */
CallbackPositionProperty.prototype.setCallback = function (
  callback,
  isConstant,
) {
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
 * 获取在提供的时间和提供的参考框架中的属性值。
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CallbackPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  if (!defined(referenceFrame)) {
    throw new DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

  const value = this._callback(time, result);

  return PositionProperty.convertToReferenceFrame(
    time,
    value,
    this._referenceFrame,
    referenceFrame,
    result,
  );
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
CallbackPositionProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CallbackPositionProperty &&
      this._callback === other._callback &&
      this._isConstant === other._isConstant &&
      this._referenceFrame === other._referenceFrame)
  );
};

/**
 * 返回 position 属性值的函数。
 * @callback CallbackPositionProperty.Callback
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要将值存储到的对象。如果省略，则函数必须创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数,或者 result 参数未提供或不受支持，则为新实例。
 */
export default CallbackPositionProperty;
