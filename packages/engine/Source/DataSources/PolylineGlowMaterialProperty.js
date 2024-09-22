import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultGlowPower = 0.25;
const defaultTaperPower = 1.0;

/**
 * 映射到多段线发光 {@link Material} 制服的 {@link MaterialProperty}。
 * @alias PolylineGlowMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {Property|Color} [options.color=Color.WHITE] 指定线条的 {@link Color} 的属性。
 * @param {Property|number} [options.glowPower=0.25] 一个数字属性，指定发光的强度，以占总线宽的百分比表示。
 * @param {Property|number} [options.taperPower=1.0] 一个数字属性，指定锥化效果的强度，以占总线长的百分比表示。 如果为 1.0 或更高，则不使用锥化效果。
 */
function PolylineGlowMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._glowPower = undefined;
  this._glowPowerSubscription = undefined;
  this._taperPower = undefined;
  this._taperPowerSubscription = undefined;

  this.color = options.color;
  this.glowPower = options.glowPower;
  this.taperPower = options.taperPower;
}

Object.defineProperties(PolylineGlowMaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) && Property.isConstant(this._glow)
      );
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof PolylineGlowMaterialProperty.prototype
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
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置numeric 属性，用于指定发光的强度，以占总线宽的百分比表示（小于 1.0）。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  glowPower: createPropertyDescriptor("glowPower"),

  /**
   * 获取或设置numeric 属性，用于指定锥形效果的强度，以占总线条长度的百分比表示。 如果为 1.0 或更高，则不使用锥化效果。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  taperPower: createPropertyDescriptor("taperPower"),
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
PolylineGlowMaterialProperty.prototype.getType = function (time) {
  return "PolylineGlow";
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
PolylineGlowMaterialProperty.prototype.getValue = function (time, result) {
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
  result.glowPower = Property.getValueOrDefault(
    this._glowPower,
    time,
    defaultGlowPower,
    result.glowPower
  );
  result.taperPower = Property.getValueOrDefault(
    this._taperPower,
    time,
    defaultTaperPower,
    result.taperPower
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
PolylineGlowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineGlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._glowPower, other._glowPower) &&
      Property.equals(this._taperPower, other._taperPower))
  );
};
export default PolylineGlowMaterialProperty;
