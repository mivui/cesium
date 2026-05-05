import { Easing } from "@tweenjs/tween.js";

/**
 * 与 TweenCollection 配合使用的缓动函数。这些函数来自
 * {@link https://github.com/sole/tween.js/|Tween.js} 和 Robert Penner。参见
 * {@link http://sole.github.io/tween.js/examples/03_graphs.html|每个函数的 Tween.js 图表}。
 *
 * @namespace
 */
const EasingFunction = {
  /**
   * 线性缓动。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  LINEAR_NONE: Easing.Linear.None,

  /**
   * 二次缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN: Easing.Quadratic.In,
  /**
   * 二次缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_OUT: Easing.Quadratic.Out,
  /**
   * 二次缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN_OUT: Easing.Quadratic.InOut,

  /**
   * 三次缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN: Easing.Cubic.In,
  /**
   * 三次缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_OUT: Easing.Cubic.Out,
  /**
   * 三次缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN_OUT: Easing.Cubic.InOut,

  /**
   * 四次缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN: Easing.Quartic.In,
  /**
   * 四次缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_OUT: Easing.Quartic.Out,
  /**
   * 四次缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN_OUT: Easing.Quartic.InOut,

  /**
   * 五次缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN: Easing.Quintic.In,
  /**
   * 五次缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_OUT: Easing.Quintic.Out,
  /**
   * 五次缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN_OUT: Easing.Quintic.InOut,

  /**
   * 正弦缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN: Easing.Sinusoidal.In,
  /**
   * 正弦缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_OUT: Easing.Sinusoidal.Out,
  /**
   * 正弦缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN_OUT: Easing.Sinusoidal.InOut,

  /**
   * 指数缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN: Easing.Exponential.In,
  /**
   * 指数缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_OUT: Easing.Exponential.Out,
  /**
   * 指数缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN_OUT: Easing.Exponential.InOut,

  /**
   * 圆形缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN: Easing.Circular.In,
  /**
   * 圆形缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_OUT: Easing.Circular.Out,
  /**
   * 圆形缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN_OUT: Easing.Circular.InOut,

  /**
   * 弹性缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN: Easing.Elastic.In,
  /**
   * 弹性缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_OUT: Easing.Elastic.Out,
  /**
   * 弹性缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN_OUT: Easing.Elastic.InOut,

  /**
   * 回退缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN: Easing.Back.In,
  /**
   * 回退缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_OUT: Easing.Back.Out,
  /**
   * 回退缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN_OUT: Easing.Back.InOut,

  /**
   * 弹跳缓入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN: Easing.Bounce.In,
  /**
   * 弹跳缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_OUT: Easing.Bounce.Out,
  /**
   * 弹跳缓入缓出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN_OUT: Easing.Bounce.InOut,
};

/**
 * Function interface for implementing a custom easing function.
 * @callback EasingFunction.Callback
 * @param {number} time The time in the range <code>[0, 1]</code>.
 * @returns {number} The value of the function at the given time.
 *
 * @example
 * function quadraticIn(time) {
 *     return time * time;
 * }
 *
 * @example
 * function quadraticOut(time) {
 *     return time * (2.0 - time);
 * }
 */

export default Object.freeze(EasingFunction);
