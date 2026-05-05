import JulianDate from "./JulianDate.js";
import TimeInterval from "./TimeInterval.js";

const MINIMUM_VALUE = Object.freeze(
  JulianDate.fromIso8601("0000-01-01T00:00:00Z"),
);
const MAXIMUM_VALUE = Object.freeze(
  JulianDate.fromIso8601("9999-12-31T24:00:00Z"),
);
const MAXIMUM_INTERVAL = Object.freeze(
  new TimeInterval({
    start: MINIMUM_VALUE,
    stop: MAXIMUM_VALUE,
  }),
);

/**
 * 与 ISO8601 支持相关的常量。
 *
 * @namespace
 *
 * @see {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601 on Wikipedia}
 * @see JulianDate
 * @see TimeInterval
 */
const Iso8601 = {
  /**
   * 表示可由 ISO8601 日期表示的最早时间的 {@link JulianDate}。
   * 等价于日期字符串 '0000-01-01T00:00:00Z'
   *
   * @type {JulianDate}
   * @constant
   */
  MINIMUM_VALUE: MINIMUM_VALUE,

  /**
   * 表示可由 ISO8601 日期表示的最晚时间的 {@link JulianDate}。
   * 等价于日期字符串 '9999-12-31T24:00:00Z'
   *
   * @type {JulianDate}
   * @constant
   */
  MAXIMUM_VALUE: MAXIMUM_VALUE,

  /**
   * 表示可由 ISO8601 时间间隔表示的最大时间间隔的 {@link TimeInterval}。
   * 等价于间隔字符串 '0000-01-01T00:00:00Z/9999-12-31T24:00:00Z'
   *
   * @type {TimeInterval}
   * @constant
   */
  MAXIMUM_INTERVAL: MAXIMUM_INTERVAL,
};
export default Iso8601;
