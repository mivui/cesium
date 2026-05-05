// @ts-check

/**
 * 提供JulianDate可作为输入的时间标准类型。
 *
 * @enum {number}
 *
 * @see JulianDate
 */
const TimeStandard = {
  /**
   * 表示协调世界时（UTC）时间标准。
   *
   * UTC与TAI的关系为<code>UTC = TAI - deltaT</code>，其中<code>deltaT</code>是截至TAI时间所引入的闰秒数量。
   *
   * @type {number}
   * @constant
   */
  UTC: 0,

  /**
   * 表示国际原子时（TAI）时间标准。
   * TAI是其他时间标准所依据的主要时间标准。
   *
   * @type {number}
   * @constant
   */
  TAI: 1,
};

Object.freeze(TimeStandard);

export default TimeStandard;
