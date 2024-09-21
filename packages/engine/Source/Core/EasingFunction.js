import { Easing } from "@tweenjs/tween.js";

/**
 * 用于 TweenCollection 的缓动函数。 这些函数来自
 * {@link https://github.com/sole/tween.js/|Tween.js} 和罗伯特·彭纳 （Robert Penner）。 请参阅
 * {@link http://sole.github.io/tween.js/examples/03_graphs.html|Tween.js graphs for each function}.
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
   * 二次方输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN: Easing.Quadratic.In,
  /**
   * 二次方输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_OUT: Easing.Quadratic.Out,
  /**
   * 先进后出二次方。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN_OUT: Easing.Quadratic.InOut,

  /**
   * 立方英寸
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN: Easing.Cubic.In,
  /**
   * 立方输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_OUT: Easing.Cubic.Out,
  /**
   * 立方输入然后输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN_OUT: Easing.Cubic.InOut,

  /**
   * 四次输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN: Easing.Quartic.In,
  /**
   * 四次方程出局。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_OUT: Easing.Quartic.Out,
  /**
   * 四次进后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN_OUT: Easing.Quartic.InOut,

  /**
   * 五分之一。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN: Easing.Quintic.In,
  /**
   * Quintic 出局。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_OUT: Easing.Quintic.Out,
  /**
   * 五次进后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN_OUT: Easing.Quintic.InOut,

  /**
   * 正弦输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN: Easing.Sinusoidal.In,
  /**
   * 正弦输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_OUT: Easing.Sinusoidal.Out,
  /**
   * 正弦输入然后输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN_OUT: Easing.Sinusoidal.InOut,

  /**
   * 指数输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN: Easing.Exponential.In,
  /**
   * 指数出局。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_OUT: Easing.Exponential.Out,
  /**
   * 指数输入然后输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN_OUT: Easing.Exponential.InOut,

  /**
   * 循环输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN: Easing.Circular.In,
  /**
   * 循环输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_OUT: Easing.Circular.Out,
  /**
   * 循环进后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN_OUT: Easing.Circular.InOut,

  /**
   * 弹性输入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN: Easing.Elastic.In,
  /**
   * 弹性输出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_OUT: Easing.Elastic.Out,
  /**
   * 弹性进后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN_OUT: Easing.Elastic.InOut,

  /**
   * 返回。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN: Easing.Back.In,
  /**
   * 退出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_OUT: Easing.Back.Out,
  /**
   * 回进后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN_OUT: Easing.Back.InOut,

  /**
   * 弹跳。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN: Easing.Bounce.In,
  /**
   * 弹跳。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_OUT: Easing.Bounce.Out,
  /**
   * 弹入然后弹出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN_OUT: Easing.Bounce.InOut,
};

/**
 * 用于实现自定义缓动函数的函数接口。
 * @callback EasingFunction.Callback
 * @param {number} time <code>[0,1]</code> 范围内的时间。
 * @returns {number} 函数在给定时间的值。
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
