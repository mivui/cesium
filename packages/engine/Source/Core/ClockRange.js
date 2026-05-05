// @ts-check

/**
 * {@link Clock#tick} 在到达 {@link Clock#startTime} 或 {@link Clock#stopTime} 时
 * 用于确定行为的常量。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockStep
 */
const ClockRange = {
  /**
   * {@link Clock#tick} 将始终按当前方向推进时钟。
   *
   * @type {number}
   * @constant
   */
  UNBOUNDED: 0,

  /**
   * 当到达 {@link Clock#startTime} 或 {@link Clock#stopTime} 时，
   * {@link Clock#tick} 将不再进一步推进 {@link Clock#currentTime}。
   *
   * @type {number}
   * @constant
   */
  CLAMPED: 1,

  /**
   * 当到达 {@link Clock#stopTime} 时，{@link Clock#tick} 将把
   * {@link Clock#currentTime} 推进到间隔的另一端。当
   * 时间向后移动时，{@link Clock#tick} 不会超过
   * {@link Clock#startTime}
   *
   * @type {number}
   * @constant
   */
  LOOP_STOP: 2,
};

Object.freeze(ClockRange);

export default ClockRange;
