import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultEvenColor = Color.WHITE;
const defaultOddColor = Color.BLACK;
const defaultRepeat = new Cartesian2(2.0, 2.0);

/**
 * 映射到棋盘格 {@link Material} uniform 的 {@link MaterialProperty}。
 * @alias CheckerboardMaterialProperty
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Property|Color} [options.evenColor=Color.WHITE] 指定第一个 {@link Color} 的属性。
 * @param {Property|Color} [options.oddColor=Color.BLACK] 指定第二个 {@link Color} 的属性。
 * @param {Property|Cartesian2} [options.repeat=new Cartesian2(2.0, 2.0)] 指定瓦片在每个方向重复次数的 {@link Cartesian2} 属性。
 */
function CheckerboardMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

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
   * 获取指示此属性是否为常量的值。如果 getValue 始终对当前定义返回相同结果，则认为属性是常量。
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
   * 获取每当此属性定义更改时触发的事件。
   * 如果调用 getValue 对于相同时间返回不同结果，则认为定义已更改。
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
   * 获取或设置指定瓦片在每个方向重复次数的 {@link Cartesian2} 属性。
   * @memberof CheckerboardMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(2.0, 2.0)
   */
  repeat: createPropertyDescriptor("repeat"),
});

/**
 * 获取给定时间处的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要获取类型的时间。
 * @returns {string} 材质类型。
 */
CheckerboardMaterialProperty.prototype.getType = function (time) {
  return "Checkerboard";
};

const timeScratch = new JulianDate();

/**
 * 获取给定时间处的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数则为新实例。
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
    result.lightColor,
  );
  result.darkColor = Property.getValueOrClonedDefault(
    this._oddColor,
    time,
    defaultOddColor,
    result.darkColor,
  );
  result.repeat = Property.getValueOrDefault(this._repeat, time, defaultRepeat);
  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则为 <code>true</code>，否则为 <code>false</code>。
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
