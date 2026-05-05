import Clock from "../Core/Clock.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createRawPropertyDescriptor from "./createRawPropertyDescriptor.js";

/**
 * 表示特定 {@link DataSource} 所需的时钟设置。这些设置可以在
 * DataSource 加载时应用到 {@link Clock}。
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
   * 获取或设置时钟所需的开始时间。
   * 参见 {@link Clock#startTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  startTime: createRawPropertyDescriptor("startTime"),

  /**
   * 获取或设置时钟所需的停止时间。
   * 参见 {@link Clock#stopTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  stopTime: createRawPropertyDescriptor("stopTime"),

  /**
   * 获取或设置加载此数据源时所需的当前时间。
   * 参见 {@link Clock#currentTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  currentTime: createRawPropertyDescriptor("currentTime"),

  /**
   * 获取或设置所需的时钟范围设置。
   * 参见 {@link Clock#clockRange}。
   * @memberof DataSourceClock.prototype
   * @type {ClockRange}
   */
  clockRange: createRawPropertyDescriptor("clockRange"),

  /**
   * 获取或设置所需的时钟步长设置。
   * 参见 {@link Clock#clockStep}。
   * @memberof DataSourceClock.prototype
   * @type {ClockStep}
   */
  clockStep: createRawPropertyDescriptor("clockStep"),

  /**
   * 获取或设置所需的时钟乘数。
   * 参见 {@link Clock#multiplier}。
   * @memberof DataSourceClock.prototype
   * @type {number}
   */
  multiplier: createRawPropertyDescriptor("multiplier"),
});

/**
 * 复制一个 DataSourceClock 实例。
 *
 * @param {DataSourceClock} [result] 存储结果的对象。
 * @returns {DataSourceClock} 修改后的结果参数，如果未提供则返回新实例。
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
 * 如果此 DataSourceClock 与另一个相等则返回 true。
 *
 * @param {DataSourceClock} [other] 要比较的另一个 DataSourceClock。
 * @returns {boolean} 如果 DataSourceClock 相等则返回 <code>true</code>；否则返回 <code>false</code>。
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
 * 将此对象上每个未赋值的属性分配给
 * 提供的源对象上相同属性的值。
 *
 * @param {DataSourceClock} source 要合并到此对象中的对象。
 */
DataSourceClock.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.startTime = this.startTime ?? source.startTime;
  this.stopTime = this.stopTime ?? source.stopTime;
  this.currentTime = this.currentTime ?? source.currentTime;
  this.clockRange = this.clockRange ?? source.clockRange;
  this.clockStep = this.clockStep ?? source.clockStep;
  this.multiplier = this.multiplier ?? source.multiplier;
};

/**
 * 获取此时钟实例作为 {@link Clock} 对象的值。
 *
 * @returns {Clock} 修改后的结果参数，如果未提供则返回新实例。
 */
DataSourceClock.prototype.getValue = function (result) {
  if (!defined(result)) {
    result = new Clock();
  }
  result.startTime = this.startTime ?? result.startTime;
  result.stopTime = this.stopTime ?? result.stopTime;
  result.currentTime = this.currentTime ?? result.currentTime;
  result.clockRange = this.clockRange ?? result.clockRange;
  result.multiplier = this.multiplier ?? result.multiplier;
  result.clockStep = this.clockStep ?? result.clockStep;
  return result;
};
export default DataSourceClock;
