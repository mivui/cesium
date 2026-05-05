/**
 * 描述单个闰秒，由 {@link JulianDate} 和一个表示 TAI 超前 UTC 时间标准秒数的数值偏移量构成。
 * @alias LeapSecond
 * @constructor
 *
 * @param {JulianDate} [date] 表示闰秒发生时间的儒略日期。
 * @param {number} [offset] 在指定日期 TAI 超前 UTC 的累计秒数。
 */
function LeapSecond(date, offset) {
  /**
   * 获取或设置此闰秒发生的日期。
   * @type {JulianDate}
   */
  this.julianDate = date;

  /**
   * 获取或设置此闰秒发生时 UTC 和 TAI 时间标准之间的累计秒数。
   * @type {number}
   */
  this.offset = offset;
}
export default LeapSecond;
