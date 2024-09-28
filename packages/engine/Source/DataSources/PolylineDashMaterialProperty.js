import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultGapColor = Color.TRANSPARENT;
const defaultDashLength = 16.0;
const defaultDashPattern = 255.0;

/**
 * 映射到折线虚线 {@link Material} 制服的 {@link MaterialProperty}。
 * @alias PolylineDashMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Property|Color} [options.color=Color.WHITE] 指定线条的 {@link Color} 的属性。
 * @param {Property|Color} [options.gapColor=Color.TRANSPARENT] 指定线条中间隙的 {@link Color} 的属性。
 * @param {Property|number} [options.dashLength=16.0] 一个数字属性，用于指定虚线图案的长度（以像素为单位）。
 * @param {Property|number} [options.dashPattern=255.0] 一个数字属性，用于指定破折号的 16 位模式
 */
function PolylineDashMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._gapColor = undefined;
  this._gapColorSubscription = undefined;
  this._dashLength = undefined;
  this._dashLengthSubscription = undefined;
  this._dashPattern = undefined;
  this._dashPatternSubscription = undefined;

  this.color = options.color;
  this.gapColor = options.gapColor;
  this.dashLength = options.dashLength;
  this.dashPattern = options.dashPattern;
}

Object.defineProperties(PolylineDashMaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._gapColor) &&
        Property.isConstant(this._dashLength) &&
        Property.isConstant(this._dashPattern)
      );
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取或设置指定行的 {@link Color} 的属性。
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定行中间隙的 {@link Color} 的属性。
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  gapColor: createPropertyDescriptor("gapColor"),

  /**
   * 获取或设置numeric 指定破折号循环长度的属性
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  dashLength: createPropertyDescriptor("dashLength"),

  /**
   * 获取或设置numeric 指定虚线模式的属性
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  dashPattern: createPropertyDescriptor("dashPattern"),
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
PolylineDashMaterialProperty.prototype.getType = function (time) {
  return "PolylineDash";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则当前 system time is used.
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
PolylineDashMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  result.gapColor = Property.getValueOrClonedDefault(
    this._gapColor,
    time,
    defaultGapColor,
    result.gapColor,
  );
  result.dashLength = Property.getValueOrDefault(
    this._dashLength,
    time,
    defaultDashLength,
    result.dashLength,
  );
  result.dashPattern = Property.getValueOrDefault(
    this._dashPattern,
    time,
    defaultDashPattern,
    result.dashPattern,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
PolylineDashMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineDashMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._gapColor, other._gapColor) &&
      Property.equals(this._dashLength, other._dashLength) &&
      Property.equals(this._dashPattern, other._dashPattern))
  );
};
export default PolylineDashMaterialProperty;
