import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultOutlineColor = Color.BLACK;
const defaultOutlineWidth = 1.0;

/**
 * 映射到折线轮廓 {@link Material} 的 {@link MaterialProperty} 统一。
 * @alias PolylineOutlineMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Property|Color} [options.color=Color.WHITE] 指定线条的 {@link Color} 的属性。
 * @param {Property|Color} [options.outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @param {Property|number} [options.outlineWidth=1.0] 一个数字属性，指定轮廓的宽度，以像素为单位。
 */
function PolylineOutlineMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;

  this.color = options.color;
  this.outlineColor = options.outlineColor;
  this.outlineWidth = options.outlineWidth;
}

Object.defineProperties(PolylineOutlineMaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof PolylineOutlineMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._outlineColor) &&
        Property.isConstant(this._outlineWidth)
      );
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof PolylineOutlineMaterialProperty.prototype
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
   * 获取或设置指定行的 {@link Color} 的属性。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
PolylineOutlineMaterialProperty.prototype.getType = function (time) {
  return "PolylineOutline";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {object} 修改后的结果参数 or a new instance if the result parameter was not supplied.
 */
PolylineOutlineMaterialProperty.prototype.getValue = function (time, result) {
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
    result.color
  );
  result.outlineColor = Property.getValueOrClonedDefault(
    this._outlineColor,
    time,
    defaultOutlineColor,
    result.outlineColor
  );
  result.outlineWidth = Property.getValueOrDefault(
    this._outlineWidth,
    time,
    defaultOutlineWidth
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
PolylineOutlineMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineOutlineMaterialProperty && //
      Property.equals(this._color, other._color) && //
      Property.equals(this._outlineColor, other._outlineColor) && //
      Property.equals(this._outlineWidth, other._outlineWidth))
  );
};
export default PolylineOutlineMaterialProperty;
