import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultOutlineColor = Color.BLACK;
const defaultOutlineWidth = 1.0;

/**
 * 映射到折线轮廓 {@link Material} 统一变量的 {@link MaterialProperty}。
 * @alias PolylineOutlineMaterialProperty
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|Color} [options.color=Color.WHITE] 指定线条 {@link Color} 的属性。
 * @param {Property|Color} [options.outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @param {Property|number} [options.outlineWidth=1.0] 数值属性，指定轮廓宽度（像素）。
 */
function PolylineOutlineMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

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
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则属性被视为常量。
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
   * 获取当此属性的定义更改时引发的事件。
   * 如果对 getValue 的调用对相同时间返回不同结果，则认为定义已更改。
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
   * 获取或设置指定线条 {@link Color} 的属性。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓宽度。
   * @memberof PolylineOutlineMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),
});

/**
 * 获取指定时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 用于检索类型的时间。
 * @returns {string} 材质类型。
 */
PolylineOutlineMaterialProperty.prototype.getType = function (time) {
  return "PolylineOutline";
};

const timeScratch = new JulianDate();

/**
 * 获取指定时间属性的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回新实例。
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
    result.color,
  );
  result.outlineColor = Property.getValueOrClonedDefault(
    this._outlineColor,
    time,
    defaultOutlineColor,
    result.outlineColor,
  );
  result.outlineWidth = Property.getValueOrDefault(
    this._outlineWidth,
    time,
    defaultOutlineWidth,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
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
