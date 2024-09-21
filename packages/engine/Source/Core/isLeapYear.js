import DeveloperError from "./DeveloperError.js";

/**
 * 确定给定日期是否为闰年。
 *
 * @function isLeapYear
 *
 * @param {number} year 待测年份。
 * @returns {boolean} 如果 <code>year</code> 是闰年，则为 True。
 *
 * @example
 * const leapYear = Cesium.isLeapYear(2000); // true
 */
function isLeapYear(year) {
  //>>includeStart('debug', pragmas.debug);
  if (year === null || isNaN(year)) {
    throw new DeveloperError("year is required and must be a number.");
  }
  //>>includeEnd('debug');

  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
export default isLeapYear;
