import Check from "./Check.js";
import DeveloperError from "./DeveloperError.js";
import isLeapYear from "./isLeapYear.js";

const daysInYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 表示比 JavaScript Date 对象更精确的格里高利日期格式。
 * 除了亚毫秒精度外，此对象还可以表示闰秒。
 * @alias GregorianDate
 * @constructor
 *
 * @param {number} [year] 年份，为整数。
 * @param {number} [month] 月份，为整数，范围 [1, 12]。
 * @param {number} [day] 月份中的日期，从 1 开始的整数。
 * @param {number} [hour] 小时，为整数，范围 [0, 23]。
 * @param {number} [minute] 小时中的分钟，为整数，范围 [0, 59]。
 * @param {number} [second] 分钟中的秒，为整数，范围 [0, 60]，其中 60 表示闰秒。
 * @param {number} [millisecond] 秒中的毫秒，为浮点数，范围 [0.0, 1000.0)。
 * @param {boolean} [isLeapSecond] 此时间是否处于闰秒期间。
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

  year = year ?? minimumYear;
  month = month ?? minimumMonth;
  day = day ?? minimumDay;
  hour = hour ?? minimumHour;
  minute = minute ?? minimumMinute;
  second = second ?? minimumSecond;
  millisecond = millisecond ?? minimumMillisecond;
  isLeapSecond = isLeapSecond ?? false;
  //>>includeStart('debug', pragmas.debug);
  validateRange();
  validateDate();
  //>>includeEnd('debug');

  /**
   * 获取或设置年份，为整数。
   * @type {number}
   */
  this.year = year;

  /**
   * 获取或设置月份，为整数，范围 [1, 12]。
   * @type {number}
   */
  this.month = month;

  /**
   * 获取或设置月份中的日期，从 1 开始的整数。
   * @type {number}
   */
  this.day = day;

  /**
   * 获取或设置小时，为整数，范围 [0, 23]。
   * @type {number}
   */
  this.hour = hour;

  /**
   * 获取或设置小时中的分钟，为整数，范围 [0, 59]。
   * @type {number}
   */
  this.minute = minute;

  /**
   * 获取或设置分钟中的秒，为整数，范围 [0, 60]，其中 60 表示闰秒。
   * @type {number}
   */
  this.second = second;

  /**
   * 获取或设置秒中的毫秒，为浮点数，范围 [0.0, 1000.0)。
   * @type {number}
   */
  this.millisecond = millisecond;

  /**
   * 获取或设置此时间是否处于闰秒期间。
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

  // JavaScript date 对象仅支持大于 1901 的日期。因此使用自定义逻辑进行验证
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
