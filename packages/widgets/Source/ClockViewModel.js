import {
  Clock,
  defined,
  destroyObject,
  EventHelper,
  JulianDate,
} from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 为用户界面公开 {@link Clock} 的视图模型。
 * @alias ClockViewModel
 * @constructor
 *
 * @param {Clock} [clock] 由这个视图模型包装的时钟对象，如果未定义，将创建一个新的实例。
 *
 * @see Clock
 */
function ClockViewModel(clock) {
  if (!defined(clock)) {
    clock = new Clock();
  }
  this._clock = clock;

  this._eventHelper = new EventHelper();
  this._eventHelper.add(clock.onTick, this.synchronize, this);

  /**
   * 获取当前系统时间。
   * 这个属性是可观察的。
   * @type {JulianDate}
   */
  this.systemTime = knockout.observable(JulianDate.now());
  this.systemTime.equalityComparer = JulianDate.equals;

  /**
   * 获取或设置时钟的开始时间。
   * See {@link Clock#startTime}.
   * 这个属性是可观察的。
   * @type {JulianDate}
   */
  this.startTime = knockout.observable(clock.startTime);
  this.startTime.equalityComparer = JulianDate.equals;
  this.startTime.subscribe(function (value) {
    clock.startTime = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟停止时间。
   * See {@link Clock#stopTime}.
   * 这个属性是可观察的。
   * @type {JulianDate}
   */
  this.stopTime = knockout.observable(clock.stopTime);
  this.stopTime.equalityComparer = JulianDate.equals;
  this.stopTime.subscribe(function (value) {
    clock.stopTime = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置当前时间。
   * See {@link Clock#currentTime}.
   * 这个属性是可观察的。
   * @type {JulianDate}
   */
  this.currentTime = knockout.observable(clock.currentTime);
  this.currentTime.equalityComparer = JulianDate.equals;
  this.currentTime.subscribe(function (value) {
    clock.currentTime = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟倍数。
   * See {@link Clock#multiplier}.
   * 这个属性是可观察的。
   * @type {number}
   */
  this.multiplier = knockout.observable(clock.multiplier);
  this.multiplier.subscribe(function (value) {
    clock.multiplier = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟步长设置。
   * See {@link Clock#clockStep}.
   * 这个属性是可观察的。
   * @type {ClockStep}
   */
  this.clockStep = knockout.observable(clock.clockStep);
  this.clockStep.subscribe(function (value) {
    clock.clockStep = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟范围设置。
   * See {@link Clock#clockRange}.
   * 这个属性是可观察的。
   * @type {ClockRange}
   */
  this.clockRange = knockout.observable(clock.clockRange);
  this.clockRange.subscribe(function (value) {
    clock.clockRange = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟是否可以动画。
   * See {@link Clock#canAnimate}.
   * 这个属性是可观察的。
   * @type {boolean}
   */
  this.canAnimate = knockout.observable(clock.canAnimate);
  this.canAnimate.subscribe(function (value) {
    clock.canAnimate = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟是否应该动画。
   * See {@link Clock#shouldAnimate}.
   * 这个属性是可观察的。
   * @type {boolean}
   */
  this.shouldAnimate = knockout.observable(clock.shouldAnimate);
  this.shouldAnimate.subscribe(function (value) {
    clock.shouldAnimate = value;
    this.synchronize();
  }, this);

  knockout.track(this, [
    "systemTime",
    "startTime",
    "stopTime",
    "currentTime",
    "multiplier",
    "clockStep",
    "clockRange",
    "canAnimate",
    "shouldAnimate",
  ]);
}

Object.defineProperties(ClockViewModel.prototype, {
  /**
   * 获取底层时钟。
   * @memberof ClockViewModel.prototype
   * @type {Clock}
   */
  clock: {
    get: function () {
      return this._clock;
    },
  },
});

/**
 * 更新视图模型与底层时钟的内容。
 * 可以被调用来强制更新viewModel，如果底层
 * 时钟已更改，<code>Clock.tick</code>。
 */
ClockViewModel.prototype.synchronize = function () {
  const clock = this._clock;

  this.systemTime = JulianDate.now();
  this.startTime = clock.startTime;
  this.stopTime = clock.stopTime;
  this.currentTime = clock.currentTime;
  this.multiplier = clock.multiplier;
  this.clockStep = clock.clockStep;
  this.clockRange = clock.clockRange;
  this.canAnimate = clock.canAnimate;
  this.shouldAnimate = clock.shouldAnimate;
};

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
ClockViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁视图模型。应该被称为
 * 当不再需要视图模型时，适当地清理视图模型。
 */
ClockViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default ClockViewModel;
