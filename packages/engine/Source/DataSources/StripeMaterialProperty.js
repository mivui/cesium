import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
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
 * 映射到条带 {@link Material} 制服的 {@link MaterialProperty}。
 * @alias StripeMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Property|StripeOrientation} [options.orientation=StripeOrientation.HORIZONTAL] 指定 {@link StripeOrientation} 的属性。
 * @param {Property|Color} [options.evenColor=Color.WHITE] 指定第一个 {@link Color} 的属性。
 * @param {Property|Color} [options.oddColor=Color.BLACK] 指定第二个 {@link Color} 的属性。
 * @param {Property|number} [options.offset=0] 一个数字属性，指定在图案中开始材质的距离。
 * @param {Property|number} [options.repeat=1] 一个数字属性，指定条带重复的次数。
 */
function StripeMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
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
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
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
   * 获取或设置指定 {@link StripeOrientation} 的属性
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
   * 获取或设置numeric 属性，用于指定模式中的点
   * 开始绘制;其中 0.0 是偶数颜色的开始，1.0 是开始
   * 为奇数色，2.0 再次为偶数色，以及任何倍数或分数值
   * 介于两者之间。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  offset: createPropertyDescriptor("offset"),

  /**
   * 获取或设置numeric 属性，用于指定条带重复的次数。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  repeat: createPropertyDescriptor("repeat"),
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
StripeMaterialProperty.prototype.getType = function (time) {
  return "Stripe";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者如果未提供 result 参数，则为新实例.
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
    result.evenColor
  );
  result.oddColor = Property.getValueOrClonedDefault(
    this._oddColor,
    time,
    defaultOddColor,
    result.oddColor
  );
  result.offset = Property.getValueOrDefault(this._offset, time, defaultOffset);
  result.repeat = Property.getValueOrDefault(this._repeat, time, defaultRepeat);
  return result;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
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
