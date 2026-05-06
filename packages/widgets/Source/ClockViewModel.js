import {
  Clock,
  defined,
  destroyObject,
  EventHelper,
  JulianDate,
} from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 暴露 {@link Clock} 以供用户界面使用的视图模型。
 * @alias ClockViewModel
 * @constructor
 *
 * @param {Clock} [clock] 此视图模型包装的时钟对象，如果未定义将创建新实例。
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
   * 此属性可被观察。
   * @type {JulianDate}
   */
  this.systemTime = knockout.observable(JulianDate.now());
  this.systemTime.equalityComparer = JulianDate.equals;

  /**
   * 获取或设置时钟的起始时间。
   * 见 {@link Clock#startTime}。
   * 此属性可被观察。
   * @type {JulianDate}
   */
  this.startTime = knockout.observable(clock.startTime);
  this.startTime.equalityComparer = JulianDate.equals;
  this.startTime.subscribe(function (value) {
    clock.startTime = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟的停止时间。
   * 见 {@link Clock#stopTime}。
   * 此属性可被观察。
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
   * 见 {@link Clock#currentTime}。
   * 此属性可被观察。
   * @type {JulianDate}
   */
  this.currentTime = knockout.observable(clock.currentTime);
  this.currentTime.equalityComparer = JulianDate.equals;
  this.currentTime.subscribe(function (value) {
    clock.currentTime = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟的倍率。
   * 见 {@link Clock#multiplier}。
   * 此属性可被观察。
   * @type {number}
   */
  this.multiplier = knockout.observable(clock.multiplier);
  this.multiplier.subscribe(function (value) {
    clock.multiplier = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟步进设置。
   * 见 {@link Clock#clockStep}。
   * 此属性可被观察。
   * @type {ClockStep}
   */
  this.clockStep = knockout.observable(clock.clockStep);
  this.clockStep.subscribe(function (value) {
    clock.clockStep = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟范围设置。
   * 见 {@link Clock#clockRange}。
   * 此属性可被观察。
   * @type {ClockRange}
   */
  this.clockRange = knockout.observable(clock.clockRange);
  this.clockRange.subscribe(function (value) {
    clock.clockRange = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟是否可以动画。
   * 见 {@link Clock#canAnimate}。
   * 此属性可被观察。
   * @type {boolean}
   */
  this.canAnimate = knockout.observable(clock.canAnimate);
  this.canAnimate.subscribe(function (value) {
    clock.canAnimate = value;
    this.synchronize();
  }, this);

  /**
   * 获取或设置时钟是否应该动画。
   * 见 {@link Clock#shouldAnimate}。
   * 此属性可被观察。
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
   * 获取底层的 Clock 对象。
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
 * 使用底层时钟的内容更新视图模型。
 * 可以调用此方法来强制更新视图模型，如果底层时钟已更改且尚未调用 <code>Clock.tick</code>。
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
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false。
 */
ClockViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁视图模型。当不再需要视图模型时应调用此方法以正确清理。
 */
ClockViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default ClockViewModel;
