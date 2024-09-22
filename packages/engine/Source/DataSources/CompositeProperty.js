import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import JulianDate from "../Core/JulianDate.js";
import TimeIntervalCollection from "../Core/TimeIntervalCollection.js";
import Property from "./Property.js";

function subscribeAll(property, eventHelper, definitionChanged, intervals) {
  function callback() {
    definitionChanged.raiseEvent(property);
  }
  const items = [];
  eventHelper.removeAll();
  const length = intervals.length;
  for (let i = 0; i < length; i++) {
    const interval = intervals.get(i);
    if (defined(interval.data) && items.indexOf(interval.data) === -1) {
      eventHelper.add(interval.data.definitionChanged, callback);
    }
  }
}

/**
 * 由 {@link TimeIntervalCollection} 定义的 {@link Property}，其中
 * data 属性是@link另一个 Property 实例，即
 * 在提供的时间进行评估。
 *
 * @alias CompositeProperty
 * @constructor
 *
 *
 * @example
 * const constantProperty = ...;
 * const sampledProperty = ...;
 *
 * //Create a composite property from two previously defined properties
 * //where the property is valid on August 1st, 2012 and uses a constant
 * //property for the first half of the day and a sampled property for the
 * //remaining half.
 * const composite = new Cesium.CompositeProperty();
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T00:00:00.00Z/2012-08-01T12:00:00.00Z',
 *     data : constantProperty
 * }));
 * composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2012-08-01T12:00:00.00Z/2012-08-02T00:00:00.00Z',
 *     isStartIncluded : false,
 *     isStopIncluded : false,
 *     data : sampledProperty
 * }));
 *
 * @see CompositeMaterialProperty
 * @see CompositePositionProperty
 */
function CompositeProperty() {
  this._eventHelper = new EventHelper();
  this._definitionChanged = new Event();
  this._intervals = new TimeIntervalCollection();
  this._intervals.changedEvent.addEventListener(
    CompositeProperty.prototype._intervalsChanged,
    this
  );
}

Object.defineProperties(CompositeProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof CompositeProperty.prototype
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
   * 每当使用不同的数据调用 setValue 时，定义都会更改
   * 比当前值。
   * @memberof CompositeProperty.prototype
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
   * @memberof CompositeProperty.prototype
   *
   * @type {TimeIntervalCollection}
   */
  intervals: {
    get: function () {
      return this._intervals;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CompositeProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const innerProperty = this._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getValue(time, result);
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
CompositeProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CompositeProperty && //
      this._intervals.equals(other._intervals, Property.equals))
  );
};

/**
 * @private
 */
CompositeProperty.prototype._intervalsChanged = function () {
  subscribeAll(
    this,
    this._eventHelper,
    this._definitionChanged,
    this._intervals
  );
  this._definitionChanged.raiseEvent(this);
};
export default CompositeProperty;
