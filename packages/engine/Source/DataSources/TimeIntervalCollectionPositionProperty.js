import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import TimeIntervalCollection from "../Core/TimeIntervalCollection.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";

/**
 * 一个同时也是 {@link PositionProperty} 的 {@link TimeIntervalCollectionProperty}。
 *
 * @alias TimeIntervalCollectionPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考框架。
 */
function TimeIntervalCollectionPositionProperty(referenceFrame) {
  this._definitionChanged = new Event();
  this._intervals = new TimeIntervalCollection();
  this._intervals.changedEvent.addEventListener(
    TimeIntervalCollectionPositionProperty.prototype._intervalsChanged,
    this,
  );
  this._referenceFrame = referenceFrame ?? ReferenceFrame.FIXED;
}

Object.defineProperties(TimeIntervalCollectionPositionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则该属性被视为常量。
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
   * 获取当此属性的定义发生更改时引发的事件。
   * 如果对同一时间调用 getValue 将返回不同结果，则认为定义已更改。
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
   * 获取时间间隔集合。
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
   * 获取定义位置的参考框架。
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
 * 获取属性在固定参考框架中指定时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
TimeIntervalCollectionPositionProperty.prototype.getValue = function (
  time,
  result,
) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取属性在指定时间和指定参考框架中的值。
 *
 * @param {JulianDate} time 要获取值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考框架。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
TimeIntervalCollectionPositionProperty.prototype.getValueInReferenceFrame =
  function (time, referenceFrame, result) {
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
        result,
      );
    }
    return undefined;
  };

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
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
TimeIntervalCollectionPositionProperty.prototype._intervalsChanged =
  function () {
    this._definitionChanged.raiseEvent(this);
  };
export default TimeIntervalCollectionPositionProperty;
