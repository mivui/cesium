import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import JulianDate from "./JulianDate.js";

/**
 * 由开始和停止时间定义的间隔;（可选）将这些时间作为间隔的一部分包括在内。
 * 可以选择将任意数据与每个实例相关联，以便与 {@link TimeIntervalCollection} 一起使用。
 *
 * @alias TimeInterval
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {JulianDate} [options.start=new JulianDate()] 区间的开始时间。
 * @param {JulianDate} [options.stop=new JulianDate()] 区间的停止时间。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在区间中，则<code>为 true</code>， <code>false</code> 否则。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在区间内，<code>则为 true</code>， <code>false</code> 否则。
 * @param {object} [options.data] 与此区间关联的任意数据。
 *
 * @example
 * // Create an instance that spans August 1st, 1980 and is associated
 * // with a Cartesian position.
 * const timeInterval = new Cesium.TimeInterval({
 *     start : Cesium.JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
 *     stop : Cesium.JulianDate.fromIso8601('1980-08-02T00:00:00Z'),
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : Cesium.Cartesian3.fromDegrees(39.921037, -75.170082)
 * });
 *
 * @example
 * // Create two instances from ISO 8601 intervals with associated numeric data
 * // then compute their intersection, summing the data they contain.
 * const left = Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2000/2010',
 *     data : 2
 * });
 *
 * const right = Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '1995/2005',
 *     data : 3
 * });
 *
 * //The result of the below intersection will be an interval equivalent to
 * //const intersection = Cesium.TimeInterval.fromIso8601({
 * //  iso8601 : '2000/2005',
 * //  data : 5
 * //});
 * const intersection = new Cesium.TimeInterval();
 * Cesium.TimeInterval.intersect(left, right, intersection, function(leftData, rightData) {
 *     return leftData + rightData;
 * });
 *
 * @example
 * // Check if an interval contains a specific time.
 * const dateToCheck = Cesium.JulianDate.fromIso8601('1982-09-08T11:30:00Z');
 * const containsDate = Cesium.TimeInterval.contains(timeInterval, dateToCheck);
 */
function TimeInterval(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  /**
   * 获取或设置start time of this interval.
   * @type {JulianDate}
   */
  this.start = defined(options.start)
    ? JulianDate.clone(options.start)
    : new JulianDate();

  /**
   * 获取或设置stop time of this interval.
   * @type {JulianDate}
   */
  this.stop = defined(options.stop)
    ? JulianDate.clone(options.stop)
    : new JulianDate();

  /**
   * 获取或设置与此间隔关联的数据。
   * @type {*}
   */
  this.data = options.data;

  /**
   * 获取或设置是否开始时间包含在此间隔中。
   * @type {boolean}
   * @default true
   */
  this.isStartIncluded = defaultValue(options.isStartIncluded, true);

  /**
   * 获取或设置是否停止时间包含在此间隔中。
   * @type {boolean}
   * @default true
   */
  this.isStopIncluded = defaultValue(options.isStopIncluded, true);
}

Object.defineProperties(TimeInterval.prototype, {
  /**
   * 获取是否此间隔为空。
   * @memberof TimeInterval.prototype
   * @type {boolean}
   * @readonly
   */
  isEmpty: {
    get: function () {
      const stopComparedToStart = JulianDate.compare(this.stop, this.start);
      return (
        stopComparedToStart < 0 ||
        (stopComparedToStart === 0 &&
          (!this.isStartIncluded || !this.isStopIncluded))
      );
    },
  },
});

const scratchInterval = {
  start: undefined,
  stop: undefined,
  isStartIncluded: undefined,
  isStopIncluded: undefined,
  data: undefined,
};

/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 间隔。
 *
 * 如果 options.iso8601 与正确的格式不匹配，则@throws DeveloperError。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.iso8601 ISO 8601 间隔。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在区间中，则<code>为 true</code>， <code>false</code> 否则。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在区间内，<code>则为 true</code>， <code>false</code> 否则。
 * @param {object} [options.data] 与此区间关联的任意数据。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数或新实例（如果未提供）。
 */
TimeInterval.fromIso8601 = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.string("options.iso8601", options.iso8601);
  //>>includeEnd('debug');

  const dates = options.iso8601.split("/");
  if (dates.length !== 2) {
    throw new DeveloperError(
      "options.iso8601 is an invalid ISO 8601 interval."
    );
  }
  const start = JulianDate.fromIso8601(dates[0]);
  const stop = JulianDate.fromIso8601(dates[1]);
  const isStartIncluded = defaultValue(options.isStartIncluded, true);
  const isStopIncluded = defaultValue(options.isStopIncluded, true);
  const data = options.data;

  if (!defined(result)) {
    scratchInterval.start = start;
    scratchInterval.stop = stop;
    scratchInterval.isStartIncluded = isStartIncluded;
    scratchInterval.isStopIncluded = isStopIncluded;
    scratchInterval.data = data;
    return new TimeInterval(scratchInterval);
  }

  result.start = start;
  result.stop = stop;
  result.isStartIncluded = isStartIncluded;
  result.isStopIncluded = isStopIncluded;
  result.data = data;
  return result;
};

/**
 * 创建所提供间隔的 ISO8601 表示形式。
 *
 * @param {TimeInterval} timeInterval 需要转换的间隔。
 * @param {number} [precision] 用于表示秒部分的小数位数。 默认情况下，使用最精确的表示。
 * @returns {string} 提供的区间的 ISO8601 表示形式。
 */
TimeInterval.toIso8601 = function (timeInterval, precision) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("timeInterval", timeInterval);
  //>>includeEnd('debug');

  return `${JulianDate.toIso8601(
    timeInterval.start,
    precision
  )}/${JulianDate.toIso8601(timeInterval.stop, precision)}`;
};

/**
 * 复制提供的实例。
 *
 * @param {TimeInterval} [timeInterval] 要克隆的实例。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数或新实例（如果未提供）。
 */
TimeInterval.clone = function (timeInterval, result) {
  if (!defined(timeInterval)) {
    return undefined;
  }
  if (!defined(result)) {
    return new TimeInterval(timeInterval);
  }
  result.start = timeInterval.start;
  result.stop = timeInterval.stop;
  result.isStartIncluded = timeInterval.isStartIncluded;
  result.isStopIncluded = timeInterval.isStopIncluded;
  result.data = timeInterval.data;
  return result;
};

/**
 * 比较两个实例并返回 <code>true</code>，否则为<code>false</code>。
 *
 * @param {TimeInterval} [left] 第一个instance.
 * @param {TimeInterval} [right] 第二个 instance.
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个区间的数据的函数。 如果省略，则使用引用相等。
 * @returns {boolean} 如果日期相等，<code>则为 true</code>;否则为 <code>false</code>.
 */
TimeInterval.equals = function (left, right, dataComparer) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      ((left.isEmpty && right.isEmpty) ||
        (left.isStartIncluded === right.isStartIncluded &&
          left.isStopIncluded === right.isStopIncluded &&
          JulianDate.equals(left.start, right.start) &&
          JulianDate.equals(left.stop, right.stop) &&
          (left.data === right.data ||
            (defined(dataComparer) && dataComparer(left.data, right.data))))))
  );
};

/**
 * 比较两个实例<code>，如果它们在</code> <code></code>
 * 彼此。 也就是说，为了将日期视为相等（并且
 * 此函数返回 <code>true</code>），则表示它们之间差值的绝对值，在
 * 秒，必须小于 <code>epsilon</code>。
 *
 * @param {TimeInterval} [left] 第一个instance.
 * @param {TimeInterval} [right] 第二个 instance.
 * @param {number} [epsilon=0] 两个实例之间应分隔的最大秒数。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个区间数据的函数。 如果省略，则使用引用相等。
 * @returns {boolean} <code>true</code>，如果两个日期彼此相差在 <code>epsilon</code> 秒内;否则<code>为 false</code>。
 */
TimeInterval.equalsEpsilon = function (left, right, epsilon, dataComparer) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      ((left.isEmpty && right.isEmpty) ||
        (left.isStartIncluded === right.isStartIncluded &&
          left.isStopIncluded === right.isStopIncluded &&
          JulianDate.equalsEpsilon(left.start, right.start, epsilon) &&
          JulianDate.equalsEpsilon(left.stop, right.stop, epsilon) &&
          (left.data === right.data ||
            (defined(dataComparer) && dataComparer(left.data, right.data))))))
  );
};

/**
 * 计算两个区间的交集，可以选择合并其数据。
 *
 * @param {TimeInterval} left 第一个 interval.
 * @param {TimeInterval} [right] 第二个 interval.
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @param {TimeInterval.MergeCallback} [mergeCallback] 合并两个区间数据的函数。如果省略，则将使用左侧间隔中的数据。
 * @returns {TimeInterval} 修改后的结果参数。
 */
TimeInterval.intersect = function (left, right, result, mergeCallback) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  //>>includeEnd('debug');

  if (!defined(right)) {
    return TimeInterval.clone(TimeInterval.EMPTY, result);
  }

  const leftStart = left.start;
  const leftStop = left.stop;

  const rightStart = right.start;
  const rightStop = right.stop;

  const intersectsStartRight =
    JulianDate.greaterThanOrEquals(rightStart, leftStart) &&
    JulianDate.greaterThanOrEquals(leftStop, rightStart);
  const intersectsStartLeft =
    !intersectsStartRight &&
    JulianDate.lessThanOrEquals(rightStart, leftStart) &&
    JulianDate.lessThanOrEquals(leftStart, rightStop);

  if (!intersectsStartRight && !intersectsStartLeft) {
    return TimeInterval.clone(TimeInterval.EMPTY, result);
  }

  const leftIsStartIncluded = left.isStartIncluded;
  const leftIsStopIncluded = left.isStopIncluded;
  const rightIsStartIncluded = right.isStartIncluded;
  const rightIsStopIncluded = right.isStopIncluded;
  const leftLessThanRight = JulianDate.lessThan(leftStop, rightStop);

  if (!defined(result)) {
    result = new TimeInterval();
  }

  result.start = intersectsStartRight ? rightStart : leftStart;
  result.isStartIncluded =
    (leftIsStartIncluded && rightIsStartIncluded) ||
    (!JulianDate.equals(rightStart, leftStart) &&
      ((intersectsStartRight && rightIsStartIncluded) ||
        (intersectsStartLeft && leftIsStartIncluded)));
  result.stop = leftLessThanRight ? leftStop : rightStop;
  result.isStopIncluded = leftLessThanRight
    ? leftIsStopIncluded
    : (leftIsStopIncluded && rightIsStopIncluded) ||
      (!JulianDate.equals(rightStop, leftStop) && rightIsStopIncluded);
  result.data = defined(mergeCallback)
    ? mergeCallback(left.data, right.data)
    : left.data;
  return result;
};

/**
 * 检查指定的日期是否在提供的间隔内。
 *
 * @param {TimeInterval} timeInterval 间隔。
 * @param {JulianDate} julianDate 要检查的日期。
 * @returns {boolean} <code>true</code>（如果区间包含指定日期），否则 <code>false</code>，。
 */
TimeInterval.contains = function (timeInterval, julianDate) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("timeInterval", timeInterval);
  Check.typeOf.object("julianDate", julianDate);
  //>>includeEnd('debug');

  if (timeInterval.isEmpty) {
    return false;
  }

  const startComparedToDate = JulianDate.compare(
    timeInterval.start,
    julianDate
  );
  if (startComparedToDate === 0) {
    return timeInterval.isStartIncluded;
  }

  const dateComparedToStop = JulianDate.compare(julianDate, timeInterval.stop);
  if (dateComparedToStop === 0) {
    return timeInterval.isStopIncluded;
  }

  return startComparedToDate < 0 && dateComparedToStop < 0;
};

/**
 * 复制TimeInterval
 *
 * @param {TimeInterval} [result]用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数或者如果未提供任何实例，则为新实例。
 */
TimeInterval.prototype.clone = function (result) {
  return TimeInterval.clone(this, result);
};

/**
 * 将此实例与提供的实例 componentwise 进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {TimeInterval} [right] 右边 interval.
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个区间的数据的函数。 如果省略，则使用引用相等。
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
TimeInterval.prototype.equals = function (right, dataComparer) {
  return TimeInterval.equals(this, right, dataComparer);
};

/**
 * 将此实例与提供的实例 componentwise 进行比较，并返回
 * <code>true</code>，如果它们位于提供的 epsilon 内，
 * 否则<code>false</code> 。
 *
 * @param {TimeInterval} [right] 右边 interval.
 * @param {number} [epsilon=0] 用来检验等式。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个区间的数据的函数。 如果省略，则使用引用相等。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，<code>false</code>否则。
 */
TimeInterval.prototype.equalsEpsilon = function (right, epsilon, dataComparer) {
  return TimeInterval.equalsEpsilon(this, right, epsilon, dataComparer);
};

/**
 * 以 ISO8601 格式创建表示此 TimeInterval 的字符串。
 *
 * @returns {string} 以 ISO8601 格式表示此 TimeInterval 的字符串。
 */
TimeInterval.prototype.toString = function () {
  return TimeInterval.toIso8601(this);
};

/**
 * 不可变的空间隔。
 *
 * @type {TimeInterval}
 * @constant
 */
TimeInterval.EMPTY = Object.freeze(
  new TimeInterval({
    start: new JulianDate(),
    stop: new JulianDate(),
    isStartIncluded: false,
    isStopIncluded: false,
  })
);

/**
 * 用于合并间隔数据的功能接口。
 * @callback TimeInterval.MergeCallback
 *
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {*} 合并两个数据实例的结果。
 */

/**
 * 用于比较间隔数据的功能接口。
 * @callback TimeInterval.DataComparer
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {boolean} <code>true</code>（如果提供的实例相等），否则 <code>false</code>。
 */
export default TimeInterval;
