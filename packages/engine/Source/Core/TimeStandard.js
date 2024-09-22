/**
 * 提供 JulianDate 可以用作 input 的时间标准类型。
 *
 * @enum {number}
 *
 * @see JulianDate
 */
const TimeStandard = {
  /**
   * 表示协调世界时 （UTC） 时间标准。
   *
   * UTC 与 TAI 的关系根据关系
   * <code>UTC = TAI - deltaT</code>，其中 <code>deltaT</code> 是跳跃数
   * 秒数，这些秒数已引入 TAI 中。
   *
   * @type {number}
   * @constant
   */
  UTC: 0,

  /**
   * 表示国际原子时 （TAI） 时间标准。
   * TAI 是与其他时间标准相关的主要时间标准。
   *
   * @type {number}
   * @constant
   */
  TAI: 1,
};
export default Object.freeze(TimeStandard);
