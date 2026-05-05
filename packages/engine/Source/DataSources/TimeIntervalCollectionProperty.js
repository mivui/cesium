import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import TimeIntervalCollection from "../Core/TimeIntervalCollection.js";
import Property from "./Property.js";

/**
 * 一个由 {@link TimeIntervalCollection} 定义的 {@link Property}，
 * 其中每个 {@link TimeInterval} 的 data 属性表示时间对应的值。
 *
 * @alias TimeIntervalCollectionProperty
 * @constructor
 *
 * @example
 * //创建一个 Cartesian2 时间间隔属性，包含 2012年8月1日 的数据，
 * //每 6 小时使用不同的值。
 * const composite = new Cesium.TimeIntervalCollectionProperty();
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T00:00:00.00Z/2012-08-01T06:00:00.00Z',
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : new Cesium.Cartesian2(2.0, 3.4)
 * }));
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T06:00:00.00Z/2012-08-01T12:00:00.00Z',
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : new Cesium.Cartesian2(12.0, 2.7)
 * }));
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T12:00:00.00Z/2012-08-01T18:00:00.00Z',
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : new Cesium.Cartesian2(5.0, 12.4)
 * }));
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T18:00:00.00Z/2012-08-02T00:00:00.00Z',
 *     isStartIncluded : true,
 *     isStopIncluded : true,
 *     data : new Cesium.Cartesian2(85.0, 4.1)
 * }));
 */
function TimeIntervalCollectionProperty() {
  this._definitionChanged = new Event();
  this._intervals = new TimeIntervalCollection();
  this._intervals.changedEvent.addEventListener(
    TimeIntervalCollectionProperty.prototype._intervalsChanged,
    this,
  );
}

Object.defineProperties(TimeIntervalCollectionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则该属性被视为常量。
   * @memberof TimeIntervalCollectionProperty.prototype
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
   * 只要使用与当前值不同的数据调用 setValue，定义就会更改。
   * @memberof TimeIntervalCollectionProperty.prototype
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
   * @memberof TimeIntervalCollectionProperty.prototype
   *
   * @type {TimeIntervalCollection}
   * @readonly
   */
  intervals: {
    get: function () {
      return this._intervals;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取属性在指定时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
TimeIntervalCollectionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const value = this._intervals.findDataForIntervalContainingDate(time);
  if (defined(value) && typeof value.clone === "function") {
    return value.clone(result);
  }
  return value;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
TimeIntervalCollectionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof TimeIntervalCollectionProperty && //
      this._intervals.equals(other._intervals, Property.equals))
  );
};

/**
 * @private
 */
TimeIntervalCollectionProperty.prototype._intervalsChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default TimeIntervalCollectionProperty;
