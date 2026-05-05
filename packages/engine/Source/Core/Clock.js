import ClockRange from "./ClockRange.js";
import ClockStep from "./ClockStep.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import getTimestamp from "./getTimestamp.js";
import JulianDate from "./JulianDate.js";

/**
 * 用于跟踪模拟时间的简单时钟。
 *
 * @alias Clock
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {JulianDate} [options.startTime] 时钟的开始时间。
 * @param {JulianDate} [options.stopTime] 时钟的停止时间。
 * @param {JulianDate} [options.currentTime] 当前时间。
 * @param {number} [options.multiplier=1.0] 确定调用 {@link Clock#tick} 时时间前进的量，负值允许向后前进。
 * @param {ClockStep} [options.clockStep=ClockStep.SYSTEM_CLOCK_MULTIPLIER] 确定 {@link Clock#tick} 的调用是基于帧还是基于系统时钟。
 * @param {ClockRange} [options.clockRange=ClockRange.UNBOUNDED] 确定当达到 {@link Clock#startTime} 或 {@link Clock#stopTime} 时时钟的行为。
 * @param {boolean} [options.canAnimate=true] 指示 {@link Clock#tick} 是否可以推进时间。例如，如果数据正在缓冲，这可能是 false。当时钟的 {@link Clock#canAnimate} 和 {@link Clock#shouldAnimate} 都为 true 时才会推进时间。
 * @param {boolean} [options.shouldAnimate=false] 指示 {@link Clock#tick} 是否应尝试推进时间。当时钟的 {@link Clock#canAnimate} 和 {@link Clock#shouldAnimate} 都为 true 时才会推进时间。
 *
 * @exception {DeveloperError} startTime 必须在 stopTime 之前。
 *
 *
 * @example
 * // 创建一个在2013年圣诞节当天循环并以实时运行的时钟。
 * const clock = new Cesium.Clock({
 *    startTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    currentTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    stopTime : Cesium.JulianDate.fromIso8601("2013-12-26"),
 *    clockRange : Cesium.ClockRange.LOOP_STOP,
 *    clockStep : Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER
 * });
 *
 * @see ClockStep
 * @see ClockRange
 * @see JulianDate
 */
function Clock(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  let currentTime = options.currentTime;
  let startTime = options.startTime;
  let stopTime = options.stopTime;

  if (!defined(currentTime)) {
    // 如果未指定，当前时间是开始时间，
    // 或者如果也未指定开始时间，则是停止时间前一天，
    // 或者如果也未指定停止时间，则是现在。
    if (defined(startTime)) {
      currentTime = JulianDate.clone(startTime);
    } else if (defined(stopTime)) {
      currentTime = JulianDate.addDays(stopTime, -1.0, new JulianDate());
    } else {
      currentTime = JulianDate.now();
    }
  } else {
    currentTime = JulianDate.clone(currentTime);
  }

  if (!defined(startTime)) {
    // 如果未指定，开始时间是当前时间
    // （如上确定）
    startTime = JulianDate.clone(currentTime);
  } else {
    startTime = JulianDate.clone(startTime);
  }

  if (!defined(stopTime)) {
    // 如果未指定，停止时间是开始时间后一天
    // （如上确定）
    stopTime = JulianDate.addDays(startTime, 1.0, new JulianDate());
  } else {
    stopTime = JulianDate.clone(stopTime);
  }

  //>>includeStart('debug', pragmas.debug);
  if (JulianDate.greaterThan(startTime, stopTime)) {
    throw new DeveloperError("startTime must come before stopTime.");
  }
  //>>includeEnd('debug');

  /**
   * 时钟的开始时间。
   * @type {JulianDate}
   */
  this.startTime = startTime;

  /**
   * 时钟的停止时间。
   * @type {JulianDate}
   */
  this.stopTime = stopTime;

  /**
   * 确定当时钟达到 {@link Clock#startTime} 或 {@link Clock#stopTime}
   * 时的行为。
   * @type {ClockRange}
   * @default {@link ClockRange.UNBOUNDED}
   */
  this.clockRange = options.clockRange ?? ClockRange.UNBOUNDED;

  /**
   * 指示 {@link Clock#tick} 是否可以推进时间。例如，如果数据正在缓冲，
   * 这可能是 false。当时钟的 {@link Clock#canAnimate} 和 {@link Clock#shouldAnimate} 都为 true 时才会推进时间。
   * @type {boolean}
   * @default true
   */
  this.canAnimate = options.canAnimate ?? true;

  /**
   * 每当调用 {@link Clock#tick} 时引发的 {@link Event}。
   * @type {Event}
   */
  this.onTick = new Event();
  /**
   * 每当达到 {@link Clock#stopTime} 时引发的 {@link Event}。
   * @type {Event}
   */
  this.onStop = new Event();

  this._currentTime = undefined;
  this._multiplier = undefined;
  this._clockStep = undefined;
  this._shouldAnimate = undefined;
  this._lastSystemTime = getTimestamp();

  // 使用属性设置器使值保持一致。

  this.currentTime = currentTime;
  this.multiplier = options.multiplier ?? 1.0;
  this.shouldAnimate = options.shouldAnimate ?? false;
  this.clockStep = options.clockStep ?? ClockStep.SYSTEM_CLOCK_MULTIPLIER;
}

Object.defineProperties(Clock.prototype, {
  /**
   * 当前时间。
   * 更改此属性会将 {@link Clock#clockStep} 从 {@link ClockStep.SYSTEM_CLOCK} 更改为
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {JulianDate}
   */
  currentTime: {
    get: function () {
      return this._currentTime;
    },
    set: function (value) {
      if (JulianDate.equals(this._currentTime, value)) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._currentTime = value;
    },
  },

  /**
   * 获取或设置调用 {@link Clock#tick} 时前进的时间量。负值允许向后前进。
   * 如果 {@link Clock#clockStep} 设置为 {@link ClockStep.TICK_DEPENDENT}，这是要前进的秒数。
   * 如果 {@link Clock#clockStep} 设置为 {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}，此值会乘以
   * 自上次调用 {@link Clock#tick} 以来的系统时间流逝量。
   * 更改此属性会将 {@link Clock#clockStep} 从 {@link ClockStep.SYSTEM_CLOCK} 更改为
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {number}
   * @default 1.0
   */
  multiplier: {
    get: function () {
      return this._multiplier;
    },
    set: function (value) {
      if (this._multiplier === value) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._multiplier = value;
    },
  },

  /**
   * 确定对 {@link Clock#tick} 的调用是基于帧还是基于系统时钟。
   * 将此属性更改为 {@link ClockStep.SYSTEM_CLOCK} 会设置
   * {@link Clock#multiplier} 为 1.0，{@link Clock#shouldAnimate} 为 true，
   * 并将 {@link Clock#currentTime} 设置为当前系统时钟时间。
   * @memberof Clock.prototype
   * @type ClockStep
   * @default {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}
   */
  clockStep: {
    get: function () {
      return this._clockStep;
    },
    set: function (value) {
      if (value === ClockStep.SYSTEM_CLOCK) {
        this._multiplier = 1.0;
        this._shouldAnimate = true;
        this._currentTime = JulianDate.now();
      }

      this._clockStep = value;
    },
  },

  /**
   * 指示 {@link Clock#tick} 是否应尝试推进时间。
   * 当时钟的 {@link Clock#canAnimate} 和 {@link Clock#shouldAnimate} 都为 true 时才会推进时间。
   * 更改此属性会将 {@link Clock#clockStep} 从 {@link ClockStep.SYSTEM_CLOCK} 更改为
   * {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {boolean}
   * @default false
   */
  shouldAnimate: {
    get: function () {
      return this._shouldAnimate;
    },
    set: function (value) {
      if (this._shouldAnimate === value) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._shouldAnimate = value;
    },
  },
});

/**
 * 根据当前配置选项从当前时间推进时钟。
 * 无论是否发生动画，都应在每一帧调用 tick。
 * 要控制动画，请使用 {@link Clock#shouldAnimate} 属性。
 *
 * @returns {JulianDate} {@link Clock#currentTime} 属性的新值。
 */
Clock.prototype.tick = function () {
  const currentSystemTime = getTimestamp();
  let currentTime = JulianDate.clone(this._currentTime);

  if (this.canAnimate && this._shouldAnimate) {
    const clockStep = this._clockStep;
    if (clockStep === ClockStep.SYSTEM_CLOCK) {
      currentTime = JulianDate.now(currentTime);
    } else {
      const multiplier = this._multiplier;

      if (clockStep === ClockStep.TICK_DEPENDENT) {
        currentTime = JulianDate.addSeconds(
          currentTime,
          multiplier,
          currentTime,
        );
      } else {
        const milliseconds = currentSystemTime - this._lastSystemTime;
        currentTime = JulianDate.addSeconds(
          currentTime,
          multiplier * (milliseconds / 1000.0),
          currentTime,
        );
      }

      const clockRange = this.clockRange;
      const startTime = this.startTime;
      const stopTime = this.stopTime;

      if (clockRange === ClockRange.CLAMPED) {
        if (JulianDate.lessThan(currentTime, startTime)) {
          currentTime = JulianDate.clone(startTime, currentTime);
        } else if (JulianDate.greaterThan(currentTime, stopTime)) {
          currentTime = JulianDate.clone(stopTime, currentTime);
          this.onStop.raiseEvent(this);
        }
      } else if (clockRange === ClockRange.LOOP_STOP) {
        if (JulianDate.lessThan(currentTime, startTime)) {
          currentTime = JulianDate.clone(startTime, currentTime);
        }
        while (JulianDate.greaterThan(currentTime, stopTime)) {
          currentTime = JulianDate.addSeconds(
            startTime,
            JulianDate.secondsDifference(currentTime, stopTime),
            currentTime,
          );
          this.onStop.raiseEvent(this);
        }
      }
    }
  }

  this._currentTime = currentTime;
  this._lastSystemTime = currentSystemTime;
  this.onTick.raiseEvent(this);
  return currentTime;
};
export default Clock;
