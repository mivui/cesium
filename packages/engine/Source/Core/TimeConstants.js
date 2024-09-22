/**
 * 时间转换的常量，如 {@link JulianDate} 所做的转换。
 *
 * @namespace TimeConstants
 *
 * @see JulianDate
 *
 * @private
 */
const TimeConstants = {
  /**
   * 1 毫秒中的秒数：<code>0.001</code>
   * @type {number}
   * @constant
   */
  SECONDS_PER_MILLISECOND: 0.001,

  /**
   * 一分钟内的秒数：<code>60</code>。
   * @type {number}
   * @constant
   */
  SECONDS_PER_MINUTE: 60.0,

  /**
   * 一小时内的分钟数：<code>60</code>。
   * @type {number}
   * @constant
   */
  MINUTES_PER_HOUR: 60.0,

  /**
   * 一天的小时数：<code>24</code>。
   * @type {number}
   * @constant
   */
  HOURS_PER_DAY: 24.0,

  /**
   * 一小时内的秒数：<code>3600</code>。
   * @type {number}
   * @constant
   */
  SECONDS_PER_HOUR: 3600.0,

  /**
   * 一天的分钟数：<code>1440</code>。
   * @type {number}
   * @constant
   */
  MINUTES_PER_DAY: 1440.0,

  /**
   * 忽略闰秒的一天中的秒数：<code>86400</code>。
   * @type {number}
   * @constant
   */
  SECONDS_PER_DAY: 86400.0,

  /**
   * 一个儒略世纪的天数：<code>36525</code>。
   * @type {number}
   * @constant
   */
  DAYS_PER_JULIAN_CENTURY: 36525.0,

  /**
   * 万亿分之一秒。
   * @type {number}
   * @constant
   */
  PICOSECOND: 0.000000001,

  /**
   * 从儒略日期中减去以确定
   * 修改后的儒略日期，给出自午夜以来的天数
   * 1858 年 11 月 17 日。
   * @type {number}
   * @constant
   */
  MODIFIED_JULIAN_DATE_DIFFERENCE: 2400000.5,
};
export default Object.freeze(TimeConstants);
