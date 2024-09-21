import {
  Clock,
  defined,
  destroyObject,
  EventHelper,
  JulianDate,
} from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * A view model which exposes a {@link Clock} for user interfaces.
 * @alias ClockViewModel
 * @constructor
 *
 * @param {Clock} [clock] The clock object wrapped by this view model, if undefined a new instance will be created.
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
   * Gets the current system time.
   * 这个属性是可观察的。
   * @type {JulianDate}
   */
  this.systemTime = knockout.observable(JulianDate.now());
  this.systemTime.equalityComparer = JulianDate.equals;

  /**
   * Gets or sets the start time of the clock.
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
   * Gets or sets the stop time of the clock.
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
   * Gets or sets the current time.
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
   * Gets or sets the clock multiplier.
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
   * Gets or sets the clock step setting.
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
   * Gets or sets the clock range setting.
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
   * Gets or sets whether the clock can animate.
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
   * Gets or sets whether the clock should animate.
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
   * Gets the underlying Clock.
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
 * Updates the view model with the contents of the underlying clock.
 * Can be called to force an update of the viewModel if the underlying
 * clock has changed and <code>Clock.tick</code> has not yet been called.
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
 * Destroys the view model.  Should be called to
 * properly clean up the view model when it is no longer needed.
 */
ClockViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default ClockViewModel;
