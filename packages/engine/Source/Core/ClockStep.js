/**
 * 用于确定每次调用前进多少时间的常量
 * 更改为 {@link Clock#tick}。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockRange
 */
const ClockStep = {
  /**
   * {@link Clock#tick} 将当前时间提前固定步长，
   * ，这是 {@link Clock#multiplier} 指定的秒数。
   *
   * @type {number}
   * @constant
   */
  TICK_DEPENDENT: 0,

  /**
   * {@link Clock#tick} 将当前时间提前系统的数量
   * 自上次调用以来经过的时间乘以 {@link Clock#multiplier}。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK_MULTIPLIER: 1,

  /**
   * {@link Clock#tick} 将时钟设置为当前系统时间;
   * 忽略所有其他设置。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK: 2,
};
export default Object.freeze(ClockStep);
