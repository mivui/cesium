import binarySearch from "./binarySearch.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import GregorianDate from "./GregorianDate.js";
import isLeapYear from "./isLeapYear.js";
import Iso8601 from "./Iso8601.js";
import JulianDate from "./JulianDate.js";
import TimeInterval from "./TimeInterval.js";

function compareIntervalStartTimes(left, right) {
  return JulianDate.compare(left.start, right.start);
}

/**
 * 一个非重叠的 {@link TimeInterval} 实例集合，按开始时间排序。
 * @alias TimeIntervalCollection
 * @constructor
 *
 * @param {TimeInterval[]} [intervals] 要添加到集合中的间隔数组。
 */
function TimeIntervalCollection(intervals) {
  this._intervals = [];
  this._changedEvent = new Event();

  if (defined(intervals)) {
    const length = intervals.length;
    for (let i = 0; i < length; i++) {
      this.addInterval(intervals[i]);
    }
  }
}

Object.defineProperties(TimeIntervalCollection.prototype, {
  /**
   * 获取每当集合中的间隔发生更改时引发的事件。
   * @memberof TimeIntervalCollection.prototype
   * @type {Event}
   * @readonly
   */
  changedEvent: {
    get: function () {
      return this._changedEvent;
    },
  },

  /**
   * 获取集合的开始时间。
   * @memberof TimeIntervalCollection.prototype
   * @type {JulianDate}
   * @readonly
   */
  start: {
    get: function () {
      const intervals = this._intervals;
      return intervals.length === 0 ? undefined : intervals[0].start;
    },
  },

  /**
   * 获取开始时间是否包含在集合中。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isStartIncluded: {
    get: function () {
      const intervals = this._intervals;
      return intervals.length === 0 ? false : intervals[0].isStartIncluded;
    },
  },

  /**
   * 获取集合的停止时间。
   * @memberof TimeIntervalCollection.prototype
   * @type {JulianDate}
   * @readonly
   */
  stop: {
    get: function () {
      const intervals = this._intervals;
      const length = intervals.length;
      return length === 0 ? undefined : intervals[length - 1].stop;
    },
  },

  /**
   * 获取停止时间是否包含在集合中。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isStopIncluded: {
    get: function () {
      const intervals = this._intervals;
      const length = intervals.length;
      return length === 0 ? false : intervals[length - 1].isStopIncluded;
    },
  },

  /**
   * 获取集合中的间隔数量。
   * @memberof TimeIntervalCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._intervals.length;
    },
  },

  /**
   * 获取集合是否为空。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isEmpty: {
    get: function () {
      return this._intervals.length === 0;
    },
  },
});

/**
 * 按组件方式将此实例与所提供的实例进行比较，
 * 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {TimeIntervalCollection} [right] 右侧集合。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
TimeIntervalCollection.prototype.equals = function (right, dataComparer) {
  if (this === right) {
    return true;
  }
  if (!(right instanceof TimeIntervalCollection)) {
    return false;
  }
  const intervals = this._intervals;
  const rightIntervals = right._intervals;
  const length = intervals.length;
  if (length !== rightIntervals.length) {
    return false;
  }
  for (let i = 0; i < length; i++) {
    if (!TimeInterval.equals(intervals[i], rightIntervals[i], dataComparer)) {
      return false;
    }
  }
  return true;
};

/**
 * 获取指定索引处的间隔。
 *
 * @param {number} index 要检索的间隔的索引。
 * @returns {TimeInterval|undefined} 指定索引处的间隔，如果该索引处不存在间隔则返回 <code>undefined</code>。
 */
TimeIntervalCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._intervals[index];
};

/**
 * 从集合中移除所有间隔。
 */
TimeIntervalCollection.prototype.removeAll = function () {
  if (this._intervals.length > 0) {
    this._intervals.length = 0;
    this._changedEvent.raiseEvent(this);
  }
};

/**
 * 查找并返回包含指定日期的间隔。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {TimeInterval|undefined} 包含指定日期的间隔，如果不存在此类间隔则返回 <code>undefined</code>。
 */
TimeIntervalCollection.prototype.findIntervalContainingDate = function (date) {
  const index = this.indexOf(date);
  return index >= 0 ? this._intervals[index] : undefined;
};

/**
 * 查找并返回包含指定日期的间隔的数据。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {object} 包含指定日期的间隔的数据，如果不存在此类间隔则返回 <code>undefined</code>。
 */
TimeIntervalCollection.prototype.findDataForIntervalContainingDate = function (
  date,
) {
  const index = this.indexOf(date);
  return index >= 0 ? this._intervals[index].data : undefined;
};

/**
 * 检查指定日期是否在此集合内。
 *
 * @param {JulianDate} julianDate 要检查的日期。
 * @returns {boolean} 如果集合包含指定日期则为 <code>true</code>，否则为 <code>false</code>。
 */
TimeIntervalCollection.prototype.contains = function (julianDate) {
  return this.indexOf(julianDate) >= 0;
};

const indexOfScratch = new TimeInterval();

/**
 * 查找并返回集合中包含指定日期的间隔的索引。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {number} 包含指定日期的间隔的索引，如果不存在此类间隔，
 * 则返回一个负数，即下一个在日期之后开始的间隔的索引的按位补码，
 * 如果没有间隔在指定日期之后开始，则返回集合长度的按位补码。
 */
TimeIntervalCollection.prototype.indexOf = function (date) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required");
  }
  //>>includeEnd('debug');

  const intervals = this._intervals;
  indexOfScratch.start = date;
  indexOfScratch.stop = date;
  let index = binarySearch(
    intervals,
    indexOfScratch,
    compareIntervalStartTimes,
  );
  if (index >= 0) {
    if (intervals[index].isStartIncluded) {
      return index;
    }

    if (
      index > 0 &&
      intervals[index - 1].stop.equals(date) &&
      intervals[index - 1].isStopIncluded
    ) {
      return index - 1;
    }
    return ~index;
  }

  index = ~index;
  if (
    index > 0 &&
    index - 1 < intervals.length &&
    TimeInterval.contains(intervals[index - 1], date)
  ) {
    return index - 1;
  }
  return ~index;
};

/**
 * 返回集合中匹配指定参数的第一个间隔。
 * 所有参数都是可选的，<code>undefined</code> 参数被视为无关条件。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {JulianDate} [options.start] 间隔的开始时间。
 * @param {JulianDate} [options.stop] 间隔的停止时间。
 * @param {boolean} [options.isStartIncluded] 如果 <code>options.start</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded] 如果 <code>options.stop</code> 包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @returns {TimeInterval|undefined} 集合中匹配指定参数的第一个间隔。
 */
TimeIntervalCollection.prototype.findInterval = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const start = options.start;
  const stop = options.stop;
  const isStartIncluded = options.isStartIncluded;
  const isStopIncluded = options.isStopIncluded;

  const intervals = this._intervals;
  for (let i = 0, len = intervals.length; i < len; i++) {
    const interval = intervals[i];
    if (
      (!defined(start) || interval.start.equals(start)) &&
      (!defined(stop) || interval.stop.equals(stop)) &&
      (!defined(isStartIncluded) ||
        interval.isStartIncluded === isStartIncluded) &&
      (!defined(isStopIncluded) || interval.isStopIncluded === isStopIncluded)
    ) {
      return intervals[i];
    }
  }
  return undefined;
};

/**
 * 向集合中添加间隔，合并包含相同数据的间隔，并在需要时拆分包含不同数据的间隔，
 * 以保持非重叠集合。
 * 新间隔中的数据优先于集合中的任何现有间隔。
 *
 * @param {TimeInterval} interval 要添加的间隔。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 */
TimeIntervalCollection.prototype.addInterval = function (
  interval,
  dataComparer,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(interval)) {
    throw new DeveloperError("interval is required");
  }
  //>>includeEnd('debug');

  if (interval.isEmpty) {
    return;
  }

  const intervals = this._intervals;

  // 快速处理常见情况：我们添加的新间隔在所有现有间隔之后。
  if (
    intervals.length === 0 ||
    JulianDate.greaterThan(interval.start, intervals[intervals.length - 1].stop)
  ) {
    intervals.push(interval);
    this._changedEvent.raiseEvent(this);
    return;
  }

  // 保持按开始日期排序
  let index = binarySearch(intervals, interval, compareIntervalStartTimes);
  if (index < 0) {
    index = ~index;
  } else {
    // 间隔的开始日期恰好等于集合中至少一个间隔的开始日期。
    // 它实际上可能等于两个间隔的开始日期，如果其中一个不包含该日期。
    // 在这种情况下，二分查找可能找到了其中任何一个。我们需要查看周围的间隔
    // 及其 IsStartIncluded 属性，以确保我们使用的是正确的间隔。

    // eslint-disable-next-line no-lonely-if
    if (
      index > 0 &&
      interval.isStartIncluded &&
      intervals[index - 1].isStartIncluded &&
      intervals[index - 1].start.equals(interval.start)
    ) {
      --index;
    } else if (
      index < intervals.length &&
      !interval.isStartIncluded &&
      intervals[index].isStartIncluded &&
      intervals[index].start.equals(interval.start)
    ) {
      ++index;
    }
  }

  let comparison;
  if (index > 0) {
    // 不是列表中的第一个，所以看看前一个间隔是否与此间隔重叠。

    comparison = JulianDate.compare(intervals[index - 1].stop, interval.start);
    if (
      comparison > 0 ||
      (comparison === 0 &&
        (intervals[index - 1].isStopIncluded || interval.isStartIncluded))
    ) {
      // 存在重叠
      if (
        defined(dataComparer)
          ? dataComparer(intervals[index - 1].data, interval.data)
          : intervals[index - 1].data === interval.data
      ) {
        // 重叠间隔具有相同的数据，所以合并它们
        if (JulianDate.greaterThan(interval.stop, intervals[index - 1].stop)) {
          interval = new TimeInterval({
            start: intervals[index - 1].start,
            stop: interval.stop,
            isStartIncluded: intervals[index - 1].isStartIncluded,
            isStopIncluded: interval.isStopIncluded,
            data: interval.data,
          });
        } else {
          interval = new TimeInterval({
            start: intervals[index - 1].start,
            stop: intervals[index - 1].stop,
            isStartIncluded: intervals[index - 1].isStartIncluded,
            isStopIncluded:
              intervals[index - 1].isStopIncluded ||
              (interval.stop.equals(intervals[index - 1].stop) &&
                interval.isStopIncluded),
            data: interval.data,
          });
        }
        intervals.splice(index - 1, 1);
        --index;
      } else {
        // 重叠间隔具有不同的数据。新添加的间隔"获胜"，所以截断前一个间隔。
        // 如果现有间隔延伸到新间隔的结尾之后，
        // 将现有间隔拆分为两个间隔。
        comparison = JulianDate.compare(
          intervals[index - 1].stop,
          interval.stop,
        );
        if (
          comparison > 0 ||
          (comparison === 0 &&
            intervals[index - 1].isStopIncluded &&
            !interval.isStopIncluded)
        ) {
          intervals.splice(
            index,
            0,
            new TimeInterval({
              start: interval.stop,
              stop: intervals[index - 1].stop,
              isStartIncluded: !interval.isStopIncluded,
              isStopIncluded: intervals[index - 1].isStopIncluded,
              data: intervals[index - 1].data,
            }),
          );
        }
        intervals[index - 1] = new TimeInterval({
          start: intervals[index - 1].start,
          stop: interval.start,
          isStartIncluded: intervals[index - 1].isStartIncluded,
          isStopIncluded: !interval.isStartIncluded,
          data: intervals[index - 1].data,
        });
      }
    }
  }

  while (index < intervals.length) {
    // 不是列表中的最后一个，所以看看后面的间隔是否与此间隔重叠。
    comparison = JulianDate.compare(interval.stop, intervals[index].start);
    if (
      comparison > 0 ||
      (comparison === 0 &&
        (interval.isStopIncluded || intervals[index].isStartIncluded))
    ) {
      // 存在重叠
      if (
        defined(dataComparer)
          ? dataComparer(intervals[index].data, interval.data)
          : intervals[index].data === interval.data
      ) {
        // 重叠间隔具有相同的数据，所以合并它们
        interval = new TimeInterval({
          start: interval.start,
          stop: JulianDate.greaterThan(intervals[index].stop, interval.stop)
            ? intervals[index].stop
            : interval.stop,
          isStartIncluded: interval.isStartIncluded,
          isStopIncluded: JulianDate.greaterThan(
            intervals[index].stop,
            interval.stop,
          )
            ? intervals[index].isStopIncluded
            : interval.isStopIncluded,
          data: interval.data,
        });
        intervals.splice(index, 1);
      } else {
        // 重叠间隔具有不同的数据。新添加的间隔"获胜"，所以截断下一个间隔。
        intervals[index] = new TimeInterval({
          start: interval.stop,
          stop: intervals[index].stop,
          isStartIncluded: !interval.isStopIncluded,
          isStopIncluded: intervals[index].isStopIncluded,
          data: intervals[index].data,
        });

        if (intervals[index].isEmpty) {
          intervals.splice(index, 1);
        } else {
          // 找到了部分跨越，所以不可能再跨越下一个间隔。
          // 停止查找。
          break;
        }
      }
    } else {
      // 找到了我们跨越的最后一个，所以停止查找。
      break;
    }
  }

  // 添加新间隔
  intervals.splice(index, 0, interval);
  this._changedEvent.raiseEvent(this);
};

/**
 * 从此时间隔集合中移除指定的间隔，在指定的间隔上创建一个空洞。
 * 输入间隔的 data 属性被忽略。
 *
 * @param {TimeInterval} interval 要移除的间隔。
 * @returns {boolean} 如果间隔被移除则为 <code>true</code>，如果集合中没有该间隔的任何部分则为 <code>false</code>。
 */
TimeIntervalCollection.prototype.removeInterval = function (interval) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(interval)) {
    throw new DeveloperError("interval is required");
  }
  //>>includeEnd('debug');

  if (interval.isEmpty) {
    return false;
  }

  const intervals = this._intervals;

  let index = binarySearch(intervals, interval, compareIntervalStartTimes);
  if (index < 0) {
    index = ~index;
  }

  let result = false;

  // 检查前一个间隔末尾的截断。
  if (
    index > 0 &&
    (JulianDate.greaterThan(intervals[index - 1].stop, interval.start) ||
      (intervals[index - 1].stop.equals(interval.start) &&
        intervals[index - 1].isStopIncluded &&
        interval.isStartIncluded))
  ) {
    result = true;

    if (
      JulianDate.greaterThan(intervals[index - 1].stop, interval.stop) ||
      (intervals[index - 1].isStopIncluded &&
        !interval.isStopIncluded &&
        intervals[index - 1].stop.equals(interval.stop))
    ) {
      // 将现有间隔拆分为两部分
      intervals.splice(
        index,
        0,
        new TimeInterval({
          start: interval.stop,
          stop: intervals[index - 1].stop,
          isStartIncluded: !interval.isStopIncluded,
          isStopIncluded: intervals[index - 1].isStopIncluded,
          data: intervals[index - 1].data,
        }),
      );
    }
    intervals[index - 1] = new TimeInterval({
      start: intervals[index - 1].start,
      stop: interval.start,
      isStartIncluded: intervals[index - 1].isStartIncluded,
      isStopIncluded: !interval.isStartIncluded,
      data: intervals[index - 1].data,
    });
  }

  // 检查开始时间是否应保留，因为 interval.start 相同但未被包含。
  if (
    index < intervals.length &&
    !interval.isStartIncluded &&
    intervals[index].isStartIncluded &&
    interval.start.equals(intervals[index].start)
  ) {
    result = true;

    intervals.splice(
      index,
      0,
      new TimeInterval({
        start: intervals[index].start,
        stop: intervals[index].start,
        isStartIncluded: true,
        isStopIncluded: true,
        data: intervals[index].data,
      }),
    );
    ++index;
  }

  // 移除完全被输入间隔重叠的所有间隔。
  while (
    index < intervals.length &&
    JulianDate.greaterThan(interval.stop, intervals[index].stop)
  ) {
    result = true;
    intervals.splice(index, 1);
  }

  // 检查输入间隔在现有间隔结束时的边界情况
  if (index < intervals.length && interval.stop.equals(intervals[index].stop)) {
    result = true;

    if (!interval.isStopIncluded && intervals[index].isStopIncluded) {
      // 间隔的最后一点的应保留，因为停止日期包含在现有间隔中但不在输入间隔中。
      if (
        index + 1 < intervals.length &&
        intervals[index + 1].start.equals(interval.stop) &&
        intervals[index].data === intervals[index + 1].data
      ) {
        // 将单点与下一个间隔合并
        intervals.splice(index, 1);
        intervals[index] = new TimeInterval({
          start: intervals[index].start,
          stop: intervals[index].stop,
          isStartIncluded: true,
          isStopIncluded: intervals[index].isStopIncluded,
          data: intervals[index].data,
        });
      } else {
        intervals[index] = new TimeInterval({
          start: interval.stop,
          stop: interval.stop,
          isStartIncluded: true,
          isStopIncluded: true,
          data: intervals[index].data,
        });
      }
    } else {
      // 间隔完全重叠
      intervals.splice(index, 1);
    }
  }

  // 截断任何部分重叠的间隔。
  if (
    index < intervals.length &&
    (JulianDate.greaterThan(interval.stop, intervals[index].start) ||
      (interval.stop.equals(intervals[index].start) &&
        interval.isStopIncluded &&
        intervals[index].isStartIncluded))
  ) {
    result = true;
    intervals[index] = new TimeInterval({
      start: interval.stop,
      stop: intervals[index].stop,
      isStartIncluded: !interval.isStopIncluded,
      isStopIncluded: intervals[index].isStopIncluded,
      data: intervals[index].data,
    });
  }

  if (result) {
    this._changedEvent.raiseEvent(this);
  }

  return result;
};

/**
 * 创建此集合与所提供的集合的交集的新实例。
 *
 * @param {TimeIntervalCollection} other 要与之求交的集合。
 * @param {TimeInterval.DataComparer} [dataComparer] 比较两个间隔数据的函数。如果省略，则使用引用相等性。
 * @param {TimeInterval.MergeCallback} [mergeCallback] 合并两个间隔数据的函数。如果省略，将使用左侧间隔的数据。
 * @returns {TimeIntervalCollection} 一个新的 TimeIntervalCollection，它是此集合与所提供的集合的交集。
 */
TimeIntervalCollection.prototype.intersect = function (
  other,
  dataComparer,
  mergeCallback,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(other)) {
    throw new DeveloperError("other is required.");
  }
  //>>includeEnd('debug');

  const result = new TimeIntervalCollection();
  let left = 0;
  let right = 0;
  const intervals = this._intervals;
  const otherIntervals = other._intervals;

  while (left < intervals.length && right < otherIntervals.length) {
    const leftInterval = intervals[left];
    const rightInterval = otherIntervals[right];
    if (JulianDate.lessThan(leftInterval.stop, rightInterval.start)) {
      ++left;
    } else if (JulianDate.lessThan(rightInterval.stop, leftInterval.start)) {
      ++right;
    } else {
      // 以下内容将返回交集，如果定义了回调，则其"数据已合并"
      if (
        defined(mergeCallback) ||
        (defined(dataComparer) &&
          dataComparer(leftInterval.data, rightInterval.data)) ||
        (!defined(dataComparer) && rightInterval.data === leftInterval.data)
      ) {
        const intersection = TimeInterval.intersect(
          leftInterval,
          rightInterval,
          new TimeInterval(),
          mergeCallback,
        );
        if (!intersection.isEmpty) {
          // 由于我们以空集合开始'result'，并且'this'中没有重叠的间隔（作为规则），
          // 'intersection'永远不会与'result'中的前一个间隔重叠。所以，不需要进行额外的'合并'。
          result.addInterval(intersection, dataComparer);
        }
      }

      if (
        JulianDate.lessThan(leftInterval.stop, rightInterval.stop) ||
        (leftInterval.stop.equals(rightInterval.stop) &&
          !leftInterval.isStopIncluded &&
          rightInterval.isStopIncluded)
      ) {
        ++left;
      } else {
        ++right;
      }
    }
  }
  return result;
};

/**
 * 从 JulianDate 数组创建新实例。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {JulianDate[]} options.julianDates ISO 8601 日期数组。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果停止时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加从 Iso8601.MINIMUM_VALUE 到开始时间的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加从停止时间到 Iso8601.MAXIMUM_VALUE 的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个函数，在每次将间隔添加到集合之前调用该间隔。如果未指定，数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeIntervalCollection.fromJulianDateArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.julianDates)) {
    throw new DeveloperError("options.iso8601Array is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new TimeIntervalCollection();
  }

  const julianDates = options.julianDates;
  const length = julianDates.length;
  const dataCallback = options.dataCallback;

  const isStartIncluded = options.isStartIncluded ?? true;
  const isStopIncluded = options.isStopIncluded ?? true;
  const leadingInterval = options.leadingInterval ?? false;
  const trailingInterval = options.trailingInterval ?? false;
  let interval;

  // 添加一个默认间隔，它只会在到达第一个间隔之前被使用
  let startIndex = 0;
  if (leadingInterval) {
    ++startIndex;
    interval = new TimeInterval({
      start: Iso8601.MINIMUM_VALUE,
      stop: julianDates[0],
      isStartIncluded: true,
      isStopIncluded: !isStartIncluded,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);
  }

  for (let i = 0; i < length - 1; ++i) {
    let startDate = julianDates[i];
    const endDate = julianDates[i + 1];

    interval = new TimeInterval({
      start: startDate,
      stop: endDate,
      isStartIncluded: result.length === startIndex ? isStartIncluded : true,
      isStopIncluded: i === length - 2 ? isStopIncluded : false,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);

    startDate = endDate;
  }

  if (trailingInterval) {
    interval = new TimeInterval({
      start: julianDates[length - 1],
      stop: Iso8601.MAXIMUM_VALUE,
      isStartIncluded: !isStopIncluded,
      isStopIncluded: true,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);
  }

  return result;
};

const scratchGregorianDate = new GregorianDate();
const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 将表示为 GregorianDate 的持续时间添加到 JulianDate
 *
 * @param {JulianDate} julianDate 日期。
 * @param {GregorianDate} duration 表示为 GregorianDate 的持续时间。
 * @param {JulianDate} result 用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数。
 *
 * @private
 */
function addToDate(julianDate, duration, result) {
  if (!defined(result)) {
    result = new JulianDate();
  }
  JulianDate.toGregorianDate(julianDate, scratchGregorianDate);

  let millisecond = scratchGregorianDate.millisecond + duration.millisecond;
  let second = scratchGregorianDate.second + duration.second;
  let minute = scratchGregorianDate.minute + duration.minute;
  let hour = scratchGregorianDate.hour + duration.hour;
  let day = scratchGregorianDate.day + duration.day;
  let month = scratchGregorianDate.month + duration.month;
  let year = scratchGregorianDate.year + duration.year;

  if (millisecond >= 1000) {
    second += Math.floor(millisecond / 1000);
    millisecond = millisecond % 1000;
  }

  if (second >= 60) {
    minute += Math.floor(second / 60);
    second = second % 60;
  }

  if (minute >= 60) {
    hour += Math.floor(minute / 60);
    minute = minute % 60;
  }

  if (hour >= 24) {
    day += Math.floor(hour / 24);
    hour = hour % 24;
  }

  // 如果天数大于月份的长度，我们需要移除这些天数，
  // 重新调整月份和年份，并重复直到天数小于月份的长度。
  monthLengths[2] = isLeapYear(year) ? 29 : 28;
  while (day > monthLengths[month] || month >= 13) {
    if (day > monthLengths[month]) {
      day -= monthLengths[month];
      ++month;
    }

    if (month >= 13) {
      --month;
      year += Math.floor(month / 12);
      month = month % 12;
      ++month;
    }

    monthLengths[2] = isLeapYear(year) ? 29 : 28;
  }

  scratchGregorianDate.millisecond = millisecond;
  scratchGregorianDate.second = second;
  scratchGregorianDate.minute = minute;
  scratchGregorianDate.hour = hour;
  scratchGregorianDate.day = day;
  scratchGregorianDate.month = month;
  scratchGregorianDate.year = year;

  return JulianDate.fromGregorianDate(scratchGregorianDate, result);
}

const scratchJulianDate = new JulianDate();
const durationRegex =
  /P(?:([\d.,]+)Y)?(?:([\d.,]+)M)?(?:([\d.,]+)W)?(?:([\d.,]+)D)?(?:T(?:([\d.,]+)H)?(?:([\d.,]+)M)?(?:([\d.,]+)S)?)?/;

/**
 * 解析 ISO8601 持续时间字符串
 *
 * @param {string} iso8601 一个 ISO 8601 持续时间。
 * @param {GregorianDate} result 用于结果的现有实例。
 * @returns {boolean} 解析成功则为 true，否则为 false
 *
 * @private
 */
function parseDuration(iso8601, result) {
  if (!defined(iso8601) || iso8601.length === 0) {
    return false;
  }

  // 重置对象
  result.year = 0;
  result.month = 0;
  result.day = 0;
  result.hour = 0;
  result.minute = 0;
  result.second = 0;
  result.millisecond = 0;

  if (iso8601[0] === "P") {
    const matches = iso8601.match(durationRegex);
    if (!defined(matches)) {
      return false;
    }
    if (defined(matches[1])) {
      // 年
      result.year = Number(matches[1].replace(",", "."));
    }
    if (defined(matches[2])) {
      // 月
      result.month = Number(matches[2].replace(",", "."));
    }
    if (defined(matches[3])) {
      // 周
      result.day = Number(matches[3].replace(",", ".")) * 7;
    }
    if (defined(matches[4])) {
      // 天
      result.day += Number(matches[4].replace(",", "."));
    }
    if (defined(matches[5])) {
      // 小时
      result.hour = Number(matches[5].replace(",", "."));
    }
    if (defined(matches[6])) {
      // 周
      result.minute = Number(matches[6].replace(",", "."));
    }
    if (defined(matches[7])) {
      // 秒
      const seconds = Number(matches[7].replace(",", "."));
      result.second = Math.floor(seconds);
      result.millisecond = (seconds % 1) * 1000;
    }
  } else {
    // 它们实际上可以将持续时间指定为普通日期，但有一些注意事项。尽量加载它。
    if (iso8601[iso8601.length - 1] !== "Z") {
      // 它不是日期，它是持续时间，所以必须始终是 UTC
      iso8601 += "Z";
    }
    JulianDate.toGregorianDate(
      JulianDate.fromIso8601(iso8601, scratchJulianDate),
      result,
    );
  }

  // 持续时间为 0 将导致无限循环，所以只要确保某些内容非零
  return (
    result.year ||
    result.month ||
    result.day ||
    result.hour ||
    result.minute ||
    result.second ||
    result.millisecond
  );
}

const scratchDuration = new GregorianDate();
/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 时间间隔（开始/结束/持续时间）创建新实例。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {string} options.iso8601 一个 ISO 8601 间隔。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果停止时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加从 Iso8601.MINIMUM_VALUE 到开始时间的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加从停止时间到 Iso8601.MAXIMUM_VALUE 的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个函数，在每次将间隔添加到集合之前调用该间隔。如果未指定，数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeIntervalCollection.fromIso8601 = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.iso8601)) {
    throw new DeveloperError("options.iso8601 is required.");
  }
  //>>includeEnd('debug');

  const dates = options.iso8601.split("/");
  const start = JulianDate.fromIso8601(dates[0]);
  const stop = JulianDate.fromIso8601(dates[1]);
  const julianDates = [];

  if (!parseDuration(dates[2], scratchDuration)) {
    julianDates.push(start, stop);
  } else {
    let date = JulianDate.clone(start);
    julianDates.push(date);
    while (JulianDate.compare(date, stop) < 0) {
      date = addToDate(date, scratchDuration);
      const afterStop = JulianDate.compare(stop, date) <= 0;
      if (afterStop) {
        JulianDate.clone(stop, date);
      }

      julianDates.push(date);
    }
  }

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: julianDates,
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};

/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 日期数组创建新实例。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {string[]} options.iso8601Dates ISO 8601 日期数组。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果停止时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加从 Iso8601.MINIMUM_VALUE 到开始时间的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加从停止时间到 Iso8601.MAXIMUM_VALUE 的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个函数，在每次将间隔添加到集合之前调用该间隔。如果未指定，数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeIntervalCollection.fromIso8601DateArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.iso8601Dates)) {
    throw new DeveloperError("options.iso8601Dates is required.");
  }
  //>>includeEnd('debug');

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: options.iso8601Dates.map(function (date) {
        return JulianDate.fromIso8601(date);
      }),
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};

/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 持续时间数组创建新实例。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {JulianDate} options.epoch 持续时间相对于其的日期。
 * @param {string} options.iso8601Durations ISO 8601 持续时间数组。
 * @param {boolean} [options.relativeToPrevious=false] 如果持续时间相对于前一个日期则为 <code>true</code>，如果始终相对于纪元则为 <code>false</code>。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果停止时间包含在间隔内则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加从 Iso8601.MINIMUM_VALUE 到开始时间的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加从停止时间到 Iso8601.MAXIMUM_VALUE 的间隔，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个函数，在每次将间隔添加到集合之前调用该间隔。如果未指定，数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，如果未提供则返回新实例。
 */
TimeIntervalCollection.fromIso8601DurationArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.epoch)) {
    throw new DeveloperError("options.epoch is required.");
  }
  if (!defined(options.iso8601Durations)) {
    throw new DeveloperError("options.iso8601Durations is required.");
  }
  //>>includeEnd('debug');

  const epoch = options.epoch;
  const iso8601Durations = options.iso8601Durations;
  const relativeToPrevious = options.relativeToPrevious ?? false;
  const julianDates = [];
  let date, previousDate;

  const length = iso8601Durations.length;
  for (let i = 0; i < length; ++i) {
    // 允许第一次迭代时持续时间为 0，因为那样就只是纪元
    if (parseDuration(iso8601Durations[i], scratchDuration) || i === 0) {
      if (relativeToPrevious && defined(previousDate)) {
        date = addToDate(previousDate, scratchDuration);
      } else {
        date = addToDate(epoch, scratchDuration);
      }
      julianDates.push(date);
      previousDate = date;
    }
  }

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: julianDates,
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};
export default TimeIntervalCollection;
