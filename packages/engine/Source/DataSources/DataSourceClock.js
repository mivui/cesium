import Clock from "../Core/Clock.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createRawPropertyDescriptor from "./createRawPropertyDescriptor.js";

/**
 * 表示特定 {@link DataSource} 所需的 clock settings。 可以应用这些设置
 * 到 {@link Clock} 时。
 *
 * @alias DataSourceClock
 * @constructor
 */
function DataSourceClock() {
  this._definitionChanged = new Event();
  this._startTime = undefined;
  this._stopTime = undefined;
  this._currentTime = undefined;
  this._clockRange = undefined;
  this._clockStep = undefined;
  this._multiplier = undefined;
}

Object.defineProperties(DataSourceClock.prototype, {
  /**
   * 获取每当分配新属性时引发的事件。
   * @memberof DataSourceClock.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置期望的 clock 开始时间。
   * See {@link Clock#startTime}.
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  startTime: createRawPropertyDescriptor("startTime"),

  /**
   * 获取或设置时钟的 desired stop time。
   * See {@link Clock#stopTime}.
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  stopTime: createRawPropertyDescriptor("stopTime"),

  /**
   * 获取或设置加载此数据源时的 Desired Current Time。
   * See {@link Clock#currentTime}.
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  currentTime: createRawPropertyDescriptor("currentTime"),

  /**
   * 获取或设置所需的 clock range 设置。
   * See {@link Clock#clockRange}.
   * @memberof DataSourceClock.prototype
   * @type {ClockRange}
   */
  clockRange: createRawPropertyDescriptor("clockRange"),

  /**
   * 获取或设置所需的 clock step 设置。
   * See {@link Clock#clockStep}.
   * @memberof DataSourceClock.prototype
   * @type {ClockStep}
   */
  clockStep: createRawPropertyDescriptor("clockStep"),

  /**
   * 获取或设置所需的 clock multiplier。
   * See {@link Clock#multiplier}.
   * @memberof DataSourceClock.prototype
   * @type {number}
   */
  multiplier: createRawPropertyDescriptor("multiplier"),
});

/**
 * 复制DataSourceClock实例。
 *
 * @param {DataSourceClock} [result] 要在其上存储结果的对象。
 * @returns {DataSourceClock} 修改后的结果参数或者一个新实例（如果未提供）。
 */
DataSourceClock.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new DataSourceClock();
  }
  result.startTime = this.startTime;
  result.stopTime = this.stopTime;
  result.currentTime = this.currentTime;
  result.clockRange = this.clockRange;
  result.clockStep = this.clockStep;
  result.multiplier = this.multiplier;
  return result;
};

/**
 * 如果此 DataSourceClock 等效于另一个 DataSourceClock，则返回 true
 *
 * @param {DataSourceClock} other 要比较的另一个 DataSourceClock。
 * 如果 DataSourceClocks 相等，则@returns {boolean} <code>true</code>;否则为 <code>false</code>。
 */
DataSourceClock.prototype.equals = function (other) {
  return (
    this === other ||
    (defined(other) &&
      JulianDate.equals(this.startTime, other.startTime) &&
      JulianDate.equals(this.stopTime, other.stopTime) &&
      JulianDate.equals(this.currentTime, other.currentTime) &&
      this.clockRange === other.clockRange &&
      this.clockStep === other.clockStep &&
      this.multiplier === other.multiplier)
  );
};

/**
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {DataSourceClock} source 要合并到此对象中的对象。
 */
DataSourceClock.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.startTime = defaultValue(this.startTime, source.startTime);
  this.stopTime = defaultValue(this.stopTime, source.stopTime);
  this.currentTime = defaultValue(this.currentTime, source.currentTime);
  this.clockRange = defaultValue(this.clockRange, source.clockRange);
  this.clockStep = defaultValue(this.clockStep, source.clockStep);
  this.multiplier = defaultValue(this.multiplier, source.multiplier);
};

/**
 * 获取此 clock 实例的值作为 {@link Clock} 对象。
 *
 * @returns {Clock} 修改后的结果参数或者一个新实例（如果未提供）。
 */
DataSourceClock.prototype.getValue = function (result) {
  if (!defined(result)) {
    result = new Clock();
  }
  result.startTime = defaultValue(this.startTime, result.startTime);
  result.stopTime = defaultValue(this.stopTime, result.stopTime);
  result.currentTime = defaultValue(this.currentTime, result.currentTime);
  result.clockRange = defaultValue(this.clockRange, result.clockRange);
  result.multiplier = defaultValue(this.multiplier, result.multiplier);
  result.clockStep = defaultValue(this.clockStep, result.clockStep);
  return result;
};
export default DataSourceClock;
