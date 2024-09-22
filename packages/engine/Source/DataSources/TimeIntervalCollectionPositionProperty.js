import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import TimeIntervalCollection from "../Core/TimeIntervalCollection.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";

/**
 * 一个 {@link TimeIntervalCollectionProperty}，也是一个 {@link PositionProperty}。
 *
 * @alias TimeIntervalCollectionPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function TimeIntervalCollectionPositionProperty(referenceFrame) {
  this._definitionChanged = new Event();
  this._intervals = new TimeIntervalCollection();
  this._intervals.changedEvent.addEventListener(
    TimeIntervalCollectionPositionProperty.prototype._intervalsChanged,
    this
  );
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
}

Object.defineProperties(TimeIntervalCollectionPositionProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._intervals.isEmpty;
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
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
   * 获取 interval 集合。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   * @type {TimeIntervalCollection}
   * @readonly
   */
  intervals: {
    get: function () {
      return this._intervals;
    },
  },
  /**
   * 获取定义位置的参考帧。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   * @type {ReferenceFrame}
   * @readonly
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
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供 result 参数，则修改后为新实例。
 */
TimeIntervalCollectionPositionProperty.prototype.getValue = function (
  time,
  result
) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在提供的时间和提供的参考框架中的属性值。
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
TimeIntervalCollectionPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  if (!defined(referenceFrame)) {
    throw new DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

  const position = this._intervals.findDataForIntervalContainingDate(time);
  if (defined(position)) {
    return PositionProperty.convertToReferenceFrame(
      time,
      position,
      this._referenceFrame,
      referenceFrame,
      result
    );
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
TimeIntervalCollectionPositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof TimeIntervalCollectionPositionProperty && //
      this._intervals.equals(other._intervals, Property.equals) && //
      this._referenceFrame === other._referenceFrame)
  );
};

/**
 * @private
 */
TimeIntervalCollectionPositionProperty.prototype._intervalsChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default TimeIntervalCollectionPositionProperty;
