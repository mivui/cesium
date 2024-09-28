import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";

/**
 * 一个 {@link PositionProperty}，其值相对于
 * {@link ReferenceFrame} 定义它。
 *
 * @alias ConstantPositionProperty
 * @constructor
 *
 * @param {Cartesian3} [value] 属性 value。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function ConstantPositionProperty(value, referenceFrame) {
  this._definitionChanged = new Event();
  this._value = Cartesian3.clone(value);
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
}

Object.defineProperties(ConstantPositionProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof ConstantPositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        !defined(this._value) || this._referenceFrame === ReferenceFrame.FIXED
      );
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof ConstantPositionProperty.prototype
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
   * @memberof ConstantPositionProperty.prototype
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
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
ConstantPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 设置属性的值。
 *
 * @param {Cartesian3} value 属性值。
 * @param {ReferenceFrame} [referenceFrame=this.referenceFrame] 定义位置的参考帧。
 */
ConstantPositionProperty.prototype.setValue = function (value, referenceFrame) {
  let definitionChanged = false;
  if (!Cartesian3.equals(this._value, value)) {
    definitionChanged = true;
    this._value = Cartesian3.clone(value);
  }
  if (defined(referenceFrame) && this._referenceFrame !== referenceFrame) {
    definitionChanged = true;
    this._referenceFrame = referenceFrame;
  }
  if (definitionChanged) {
    this._definitionChanged.raiseEvent(this);
  }
};

/**
 * 获取在提供的时间和提供的参考框架中的属性值。
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
ConstantPositionProperty.prototype.getValueInReferenceFrame = function (
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

  return PositionProperty.convertToReferenceFrame(
    time,
    this._value,
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
ConstantPositionProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof ConstantPositionProperty &&
      Cartesian3.equals(this._value, other._value) &&
      this._referenceFrame === other._referenceFrame)
  );
};
export default ConstantPositionProperty;
