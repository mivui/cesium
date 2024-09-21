/**
 * 描述单个闰秒，它由 {@link JulianDate} 和
 * 数字偏移量表示 TAI 领先于 UTC 时间标准的秒数。
 * @alias LeapSecond
 * @constructor
 *
 * @param {JulianDate} [date] 表示闰秒时间的儒略日期。
 * @param {number} [offset] TAI 在提供的日期领先于 UTC 的累计秒数。
 */
function LeapSecond(date, offset) {
  /**
   * 获取或设置date at which this leap second occurs.
   * @type {JulianDate}
   */
  this.julianDate = date;

  /**
   * 获取或设置cumulative number of seconds between the UTC and TAI time standards at the time
   * of this leap second.
   * @type {number}
   */
  this.offset = offset;
}
export default LeapSecond;
