import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import JulianDate from "./JulianDate.js";

/**
 * 由开始和停止时间定义的间隔；可选择是否将这些时间包含在间隔内。
 * 任意数据可以选择性地与每个实例关联，用于 {@link TimeIntervalCollection}。
 *
 * @alias TimeInterval
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {JulianDate} [options.start=new JulianDate()] 间隔的开始时间。
 * @param {JulianDate} [options.stop=new JulianDate()] 间隔的停止时间。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {object} [options.data] 与此间隔关联的任意数据。
 *
 * @example
 * // 创建一个表示1980年8月1日的实例，并关联一个笛卡尔位置。
 * const timeInterval = new Cesium.TimeInterval({
 *     start : Cesium.JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
 *     stop : Cesium.JulianDate.fromIso8601('1980-08-02T00:00:00Z'),
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : Cesium.Cartesian3.fromDegrees(39.921037, -75.170082)
 * });
 *
 * @example
 * // 从 ISO 8601 间隔创建两个实例，并关联数值数据
 * // 然后计算它们的交集，求和它们包含的数据。
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
 * // 下面的交集结果等价于
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
 * // 检查间隔是否包含特定时间。
 * const dateToCheck = Cesium.JulianDate.fromIso8601('1982-09-08T11:30:00Z');
 * const containsDate = Cesium.TimeInterval.contains(timeInterval, dateToCheck);
 */
function TimeInterval(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  /**
   * 获取或设置此间隔的开始时间。
   * @type {JulianDate}
   */
  this.start = defined(options.start)
    ? JulianDate.clone(options.start)
    : new JulianDate();

  /**
   * 获取或设置此间隔的停止时间。
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
   * 获取或设置开始时间是否包含在此间隔内。
   * @type {boolean}
   * @default true
   */
  this.isStartIncluded = options.isStartIncluded ?? true;

  /**
   * 获取或设置停止时间是否包含在此间隔内。
   * @type {boolean}
   * @default true
   */
  this.isStopIncluded = options.isStopIncluded ?? true;
}

Object.defineProperties(TimeInterval.prototype, {
  /**
   * 获取此间隔是否为空。
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
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 间隔创建新实例。
 *
 * @throws DeveloperError 如果 options.iso8601 不符合正确的格式。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {string} options.iso8601 ISO 8601 间隔。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {object} [options.data] 与此间隔关联的任意数据。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeInterval.fromIso8601 = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.string("options.iso8601", options.iso8601);
  //>>includeEnd('debug');

  const dates = options.iso8601.split("/");
  if (dates.length !== 2) {
    throw new DeveloperError(
      "options.iso8601 不是有效的 ISO 8601 间隔。",
    );
  }
  const start = JulianDate.fromIso8601(dates[0]);
  const stop = JulianDate.fromIso8601(dates[1]);
  const isStartIncluded = options.isStartIncluded ?? true;
  const isStopIncluded = options.isStopIncluded ?? true;
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
 * 创建所提供的间隔的 ISO8601 表示。
 *
 * @param {TimeInterval} timeInterval 要转换的间隔。
 * @param {number} [precision] 用于表示秒分量的小数位数。默认使用最精确的表示。
 * @returns {string} 所提供的间隔的 ISO8601 表示。
 */
TimeInterval.toIso8601 = function (timeInterval, precision) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("timeInterval", timeInterval);
  //>>includeEnd('debug');

  return `${JulianDate.toIso8601(
    timeInterval.start,
    precision,
  )}/${JulianDate.toIso8601(timeInterval.stop, precision)}`;
};

/**
 * 复制所提供的实例。
 *
 * @param {TimeInterval} [timeInterval] 要克隆的实例。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，如果未提供则返回新实例。
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
 * 比较两个实例，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {TimeInterval} [left] 第一个实例。
 * @param {TimeInterval} [right] 第二个实例。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果日期相等则返回 <code>true</code>；否则返回 <code>false</code>。
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
 * 比较两个实例，如果它们在彼此 <code>epsilon</code> 秒范围内则返回 <code>true</code>。
 * 也就是说，为了使日期被视为相等（并让此函数返回 <code>true</code>），
 * 它们之间以秒为单位的差的绝对值必须小于 <code>epsilon</code>。
 *
 * @param {TimeInterval} [left] 第一个实例。
 * @param {TimeInterval} [right] 第二个实例。
 * @param {number} [epsilon=0] 应该分隔两个实例的最大秒数。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果两个日期在彼此的 <code>epsilon</code> 秒范围内则返回 <code>true</code>；否则返回 <code>false</code>。
 */
TimeInterval.equalsEpsilon = function (left, right, epsilon, dataComparer) {
  epsilon = epsilon ?? 0;

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
 * 计算两个间隔的交集，可选择合并它们的数据。
 *
 * @param {TimeInterval} left 第一个间隔。
 * @param {TimeInterval} [right] 第二个间隔。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @param {TimeInterval.MergeCallback} [mergeCallback] 合并两个间隔数据的函数。如果省略，将使用左侧间隔的数据。
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
 * 检查指定日期是否在所提供的间隔内。
 *
 * @param {TimeInterval} timeInterval 间隔。
 * @param {JulianDate} julianDate 要检查的日期。
 * @returns {boolean} 如果间隔包含指定日期则为 <code>true</code>，否则为 <code>false</code>。
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
    julianDate,
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
 * 复制此实例。
 *
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeInterval.prototype.clone = function (result) {
  return TimeInterval.clone(this, result);
};

/**
 * 按组件方式将此实例与所提供的实例进行比较，
 * 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {TimeInterval} [right] 右侧间隔。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
TimeInterval.prototype.equals = function (right, dataComparer) {
  return TimeInterval.equals(this, right, dataComparer);
};

/**
 * 按组件方式将此实例与所提供的实例进行比较，
 * 如果在提供的 epsilon 范围内则返回 <code>true</code>，
 * 否则返回 <code>false</code>。
 *
 * @param {TimeInterval} [right] 右侧间隔。
 * @param {number} [epsilon=0] 用于相等性测试的 epsilon。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果在提供的 epsilon 范围内则返回 <code>true</code>，否则返回 <code>false</code>。
 */
TimeInterval.prototype.equalsEpsilon = function (right, epsilon, dataComparer) {
  return TimeInterval.equalsEpsilon(this, right, epsilon, dataComparer);
};

/**
 * 创建表示此 TimeInterval 的 ISO8601 格式的字符串。
 *
 * @returns {string} 表示此 TimeInterval 的 ISO8601 格式的字符串。
 */
TimeInterval.prototype.toString = function () {
  return TimeInterval.toIso8601(this);
};

/**
 * 一个不可空的空间隔。
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
  }),
);

/**
 * 用于合并间隔数据的函数接口。
 * @callback TimeInterval.MergeCallback
 *
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {*} 合并两个数据实例的结果。
 */

/**
 * 用于比较间隔数据的函数接口。
 * @callback TimeInterval.DataComparer
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {boolean} 如果所提供的实例相等则为 <code>true</code>，否则为 <code>false</code>。
 */
export default TimeInterval;
