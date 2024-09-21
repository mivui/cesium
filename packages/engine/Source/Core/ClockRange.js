/**
 * {@link Clock#tick} 用于确定行为的常量
 * 当达到 {@link Clock#startTime} 或 {@link Clock#stopTime} 时。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockStep
 */
const ClockRange = {
  /**
   * {@link Clock#tick} 将始终将时钟向前推进其当前方向。
   *
   * @type {number}
   * @constant
   */
  UNBOUNDED: 0,

  /**
   * 当达到 {@link Clock#startTime} 或 {@link Clock#stopTime} 时，
   * {@link Clock#tick} 不会进一步推进 {@link Clock#currentTime}。
   *
   * @type {number}
   * @constant
   */
  CLAMPED: 1,

  /**
   * 当达到 {@link Clock#stopTime} 时，{@link Clock#tick} 将前进
   * {@link Clock#currentTime} 到间隔的另一端。 什么时候
   * 时间向后移动，{@link Clock#tick} 不会过去
   * {@link 时钟#startTime}
   *
   * @type {number}
   * @constant
   */
  LOOP_STOP: 2,
};
export default Object.freeze(ClockRange);
