// @ts-check

/**
 * 用于确定每次调用 {@link Clock#tick} 时时间推进量的常量。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockRange
 */
const ClockStep = {
  /**
   * {@link Clock#tick} 按固定步长推进当前时间，
   * 即 {@link Clock#multiplier} 指定的秒数。
   *
   * @type {number}
   * @constant
   */
  TICK_DEPENDENT: 0,

  /**
   * {@link Clock#tick} 按距上一次调用经过的系统时间
   * 乘以 {@link Clock#multiplier} 的量来推进当前时间。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK_MULTIPLIER: 1,

  /**
   * {@link Clock#tick} 将时钟设置为当前系统时间；
   * 忽略所有其他设置。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK: 2,
};

Object.freeze(ClockStep);

export default ClockStep;
