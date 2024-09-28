import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import DeveloperError from "./DeveloperError.js";
import isLeapYear from "./isLeapYear.js";

const daysInYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 以比 JavaScript Date 对象更精确的格式表示公历日期。
 * 除了亚毫秒精度外，此对象还可以表示闰秒。
 * @alias GregorianDate
 * @constructor
 *
 * @param {number} [year] 整数的年份。
 * @param {number} [month] 整数月份，范围为 [1， 12]。
 * @param {number} [day] 从 1 开始的整数。
 * @param {number} [hour] 小时，范围为 [0， 23]。
 * @param {number} [minute] 一小时的整数分钟，范围为 [0， 59]。
 * @param {number} [second] 分钟的第二个整数，范围为 [0， 60]，其中 60 表示闰秒。
 * @param {number} [millisecond] 秒的毫秒，以浮点数表示，范围为 [0.0， 1000.0]。
 * @param {boolean} [isLeapSecond] 此时间是否在闰秒期间。
 *
 * @see JulianDate#toGregorianDate
 */
function GregorianDate(
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
  isLeapSecond,
) {
  const minimumYear = 1;
  const minimumMonth = 1;
  const minimumDay = 1;
  const minimumHour = 0;
  const minimumMinute = 0;
  const minimumSecond = 0;
  const minimumMillisecond = 0;

  year = defaultValue(year, minimumYear);
  month = defaultValue(month, minimumMonth);
  day = defaultValue(day, minimumDay);
  hour = defaultValue(hour, minimumHour);
  minute = defaultValue(minute, minimumMinute);
  second = defaultValue(second, minimumSecond);
  millisecond = defaultValue(millisecond, minimumMillisecond);
  isLeapSecond = defaultValue(isLeapSecond, false);
  //>>includeStart('debug', pragmas.debug);
  validateRange();
  validateDate();
  //>>includeEnd('debug');

  /**
   * 获取或设置year 的整数。
   * @type {number}
   */
  this.year = year;
  /**
   * 获取或设置month 为整数，范围 [1, 12].
   * @type {number}
   */
  this.month = month;
  /**
   * 获取或设置以整数形式表示的月份中的日期，从 1 开始。
   * @type {number}
   */
  this.day = day;
  /**
   * 获取或设置hour 为整数，范围 [0, 23].
   * @type {number}
   */
  this.hour = hour;
  /**
   * 获取或设置hour 的整数 minute （分钟） 和 range [0, 59].
   * @type {number}
   */
  this.minute = minute;
  /**
   * 获取或设置minute 的 second 为整数，范围 [0, 60], 其中 60 表示闰秒。
   * @type {number}
   */
  this.second = second;
  /**
   * 获取或设置millisecond 作为浮点数，范围 [0.0, 1000.0).
   * @type {number}
   */
  this.millisecond = millisecond;
  /**
   * 获取或设置此时间是否在闰秒期间。
   * @type {boolean}
   */
  this.isLeapSecond = isLeapSecond;

  function validateRange() {
    const maximumYear = 9999;
    const maximumMonth = 12;
    const maximumDay = 31;
    const maximumHour = 23;
    const maximumMinute = 59;
    const maximumSecond = 59;
    const excludedMaximumMilisecond = 1000;

    Check.typeOf.number.greaterThanOrEquals("Year", year, minimumYear);
    Check.typeOf.number.lessThanOrEquals("Year", year, maximumYear);

    Check.typeOf.number.greaterThanOrEquals("Month", month, minimumMonth);
    Check.typeOf.number.lessThanOrEquals("Month", month, maximumMonth);

    Check.typeOf.number.greaterThanOrEquals("Day", day, minimumDay);
    Check.typeOf.number.lessThanOrEquals("Day", day, maximumDay);

    Check.typeOf.number.greaterThanOrEquals("Hour", hour, minimumHour);
    Check.typeOf.number.lessThanOrEquals("Hour", hour, maximumHour);

    Check.typeOf.number.greaterThanOrEquals("Minute", minute, minimumMinute);
    Check.typeOf.number.lessThanOrEquals("Minute", minute, maximumMinute);

    Check.typeOf.bool("IsLeapSecond", isLeapSecond);

    Check.typeOf.number.greaterThanOrEquals("Second", second, minimumSecond);
    Check.typeOf.number.lessThanOrEquals(
      "Second",
      second,
      isLeapSecond ? maximumSecond + 1 : maximumSecond,
    );

    Check.typeOf.number.greaterThanOrEquals(
      "Millisecond",
      millisecond,
      minimumMillisecond,
    );
    Check.typeOf.number.lessThan(
      "Millisecond",
      millisecond,
      excludedMaximumMilisecond,
    );
  }

  // Javascript date object supports only dates greater than 1901. Thus validating with custom logic
  function validateDate() {
    const daysInMonth =
      month === 2 && isLeapYear(year)
        ? daysInYear[month - 1] + 1
        : daysInYear[month - 1];

    if (day > daysInMonth) {
      throw new DeveloperError("Month and Day represents invalid date");
    }
  }
}
export default GregorianDate;
