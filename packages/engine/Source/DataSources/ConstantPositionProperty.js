import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";

/**
 * 其值相对于定义它的 {@link ReferenceFrame} 不变的 {@link PositionProperty}。
 *
 * @alias ConstantPositionProperty
 * @constructor
 *
 * @param {Cartesian3} [value] 属性值。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function ConstantPositionProperty(value, referenceFrame) {
  this._definitionChanged = new Event();
  this._value = Cartesian3.clone(value);
  this._referenceFrame = referenceFrame ?? ReferenceFrame.FIXED;
}

Object.defineProperties(ConstantPositionProperty.prototype, {
  /**
   * 获取指示此属性是否为常量的值。如果 getValue 始终对当前定义返回相同结果，则认为属性是常量。
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
   * 获取每当此属性定义更改时触发的事件。
   * 如果调用 getValue 对于相同时间返回不同结果，则认为定义已更改。
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
   * 获取定义位置的参考系。
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
 * 获取固定帧中给定时间处的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数则为新实例。
 */
ConstantPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 设置属性值。
 *
 * @param {Cartesian3} value 属性值。
 * @param {ReferenceFrame} [referenceFrame=this.referenceFrame] 定义位置的参考系。
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
 * 获取给定时间和给定参考系中的属性值。
 *
 * @param {JulianDate} time 要获取值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考系。
 * @param {Cartesian3} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供结果参数则为新实例。
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
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则为 <code>true</code>，否则为 <code>false</code>。
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
