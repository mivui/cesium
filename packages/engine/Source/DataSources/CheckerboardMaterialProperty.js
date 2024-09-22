import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultEvenColor = Color.WHITE;
const defaultOddColor = Color.BLACK;
const defaultRepeat = new Cartesian2(2.0, 2.0);

/**
 * 映射到棋盘 {@link Material} 制服的 {@link MaterialProperty}。
 * @alias CheckerboardMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Property|Color} [options.evenColor=Color.WHITE] 指定第一个 {@link Color} 的属性。
 * @param {Property|Color} [options.oddColor=Color.BLACK] 指定第二个 {@link Color} 的属性。
 * @param {Property|Cartesian2} [options.repeat=new Cartesian2（2.0， 2.0）] 一个 {@link Cartesian2} 属性，用于指定图块在每个方向上重复的次数。
 */
function CheckerboardMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._evenColor = undefined;
  this._evenColorSubscription = undefined;
  this._oddColor = undefined;
  this._oddColorSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;

  this.evenColor = options.evenColor;
  this.oddColor = options.oddColor;
  this.repeat = options.repeat;
}

Object.defineProperties(CheckerboardMaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof CheckerboardMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._evenColor) && //
        Property.isConstant(this._oddColor) && //
        Property.isConstant(this._repeat)
      );
    },
  },

  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof CheckerboardMaterialProperty.prototype
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
   * 获取或设置指定第一个 {@link Color} 的属性。
   * @memberof CheckerboardMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  evenColor: createPropertyDescriptor("evenColor"),

  /**
   * 获取或设置指定第二个 {@link Color} 的属性。
   * @memberof CheckerboardMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  oddColor: createPropertyDescriptor("oddColor"),

  /**
   * 获取或设置{@link Cartesian2} 指定图块在每个方向上重复次数的属性。
   * @memberof CheckerboardMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(2.0, 2.0)
   */
  repeat: createPropertyDescriptor("repeat"),
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
CheckerboardMaterialProperty.prototype.getType = function (time) {
  return "Checkerboard";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CheckerboardMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.lightColor = Property.getValueOrClonedDefault(
    this._evenColor,
    time,
    defaultEvenColor,
    result.lightColor
  );
  result.darkColor = Property.getValueOrClonedDefault(
    this._oddColor,
    time,
    defaultOddColor,
    result.darkColor
  );
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
CheckerboardMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CheckerboardMaterialProperty && //
      Property.equals(this._evenColor, other._evenColor) && //
      Property.equals(this._oddColor, other._oddColor) && //
      Property.equals(this._repeat, other._repeat))
  );
};
export default CheckerboardMaterialProperty;
