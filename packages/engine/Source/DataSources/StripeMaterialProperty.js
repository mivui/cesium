import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";
import StripeOrientation from "./StripeOrientation.js";

const defaultOrientation = StripeOrientation.HORIZONTAL;
const defaultEvenColor = Color.WHITE;
const defaultOddColor = Color.BLACK;
const defaultOffset = 0;
const defaultRepeat = 1;

/**
 * 一个映射到条纹 {@link Material} 统一变量的 {@link MaterialProperty}。
 * @alias StripeMaterialProperty
 * @constructor
 *
 * @param {object} [options] 具有如下属性的对象：
 * @param {Property|StripeOrientation} [options.orientation=StripeOrientation.HORIZONTAL] 一个指定 {@link StripeOrientation} 的属性。
 * @param {Property|Color} [options.evenColor=Color.WHITE] 一个指定第一个 {@link Color} 的属性。
 * @param {Property|Color} [options.oddColor=Color.BLACK] 一个指定第二个 {@link Color} 的属性。
 * @param {Property|number} [options.offset=0] 一个数值属性，指定从图案的何处开始应用材质。
 * @param {Property|number} [options.repeat=1] 一个数值属性，指定条纹重复的次数。
 */
function StripeMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._orientation = undefined;
  this._orientationSubscription = undefined;
  this._evenColor = undefined;
  this._evenColorSubscription = undefined;
  this._oddColor = undefined;
  this._oddColorSubscription = undefined;
  this._offset = undefined;
  this._offsetSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;

  this.orientation = options.orientation;
  this.evenColor = options.evenColor;
  this.oddColor = options.oddColor;
  this.offset = options.offset;
  this.repeat = options.repeat;
}

Object.defineProperties(StripeMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则该属性被视为常量。
   * @memberof StripeMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._orientation) && //
        Property.isConstant(this._evenColor) && //
        Property.isConstant(this._oddColor) && //
        Property.isConstant(this._offset) && //
        Property.isConstant(this._repeat)
      );
    },
  },
  /**
   * 获取当此属性的定义发生更改时引发的事件。
   * 如果对同一时间调用 getValue 将返回不同结果，则认为定义已更改。
   * @memberof StripeMaterialProperty.prototype
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
   * 获取或设置指定 {@link StripeOrientation} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default StripeOrientation.HORIZONTAL
   */
  orientation: createPropertyDescriptor("orientation"),

  /**
   * 获取或设置指定第一个 {@link Color} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  evenColor: createPropertyDescriptor("evenColor"),

  /**
   * 获取或设置指定第二个 {@link Color} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  oddColor: createPropertyDescriptor("oddColor"),

  /**
   * 获取或设置数值属性，指定从图案的何处开始绘制；
   * 0.0 表示偶数颜色的起点，1.0 表示奇数颜色的起点，2.0 再次回到偶数颜色，
   * 任何倍数或分数值表示中间的位置。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  offset: createPropertyDescriptor("offset"),

  /**
   * Gets or sets the numeric Property specifying how many times the stripes repeat.
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  repeat: createPropertyDescriptor("repeat"),
});

/**
 * 获取指定时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要获取类型的时间。
 * @returns {string} 材质类型。
 */
StripeMaterialProperty.prototype.getType = function (time) {
  return "Stripe";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在指定时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
StripeMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.horizontal =
    Property.getValueOrDefault(this._orientation, time, defaultOrientation) ===
    StripeOrientation.HORIZONTAL;
  result.evenColor = Property.getValueOrClonedDefault(
    this._evenColor,
    time,
    defaultEvenColor,
    result.evenColor,
  );
  result.oddColor = Property.getValueOrClonedDefault(
    this._oddColor,
    time,
    defaultOddColor,
    result.oddColor,
  );
  result.offset = Property.getValueOrDefault(this._offset, time, defaultOffset);
  result.repeat = Property.getValueOrDefault(this._repeat, time, defaultRepeat);
  return result;
};

/**
 * Compares this property to the provided property and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
StripeMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof StripeMaterialProperty && //
      Property.equals(this._orientation, other._orientation) && //
      Property.equals(this._evenColor, other._evenColor) && //
      Property.equals(this._oddColor, other._oddColor) && //
      Property.equals(this._offset, other._offset) && //
      Property.equals(this._repeat, other._repeat))
  );
};
export default StripeMaterialProperty;
