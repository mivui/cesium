import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

/**
 * 映射到PolylineArrow {@link Material} 统一体的 {@link MaterialProperty}。
 *
 * @param {Property|Color} [color=Color.WHITE] 要使用的 {@link Color} 属性。
 *
 * @alias PolylineArrowMaterialProperty
 * @constructor
 */
function PolylineArrowMaterialProperty(color) {
  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;

  this.color = color;
}

Object.defineProperties(PolylineArrowMaterialProperty.prototype, {
  /**
   * 获取指示此属性是否为常量的值。如果getValue对当前定义始终返回相同结果，则属性被视为常量。
   * @memberof PolylineArrowMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._color);
    },
  },
  /**
   * 获取每当此属性定义更改时引发的事件。
   * 如果对getValue的调用对同一时间返回不同的结果，则定义被视为已更改。
   * @memberof PolylineArrowMaterialProperty.prototype
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
   * 获取或设置 {@link Color} {@link Property}。
   * @memberof PolylineArrowMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),
});

/**
 * 获取提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质类型。
 */
PolylineArrowMaterialProperty.prototype.getType = function (time) {
  return "PolylineArrow";
};

const timeScratch = new JulianDate();

/**
 * 获取提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数则返回新实例。
 */
PolylineArrowMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    Color.WHITE,
    result.color,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PolylineArrowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineArrowMaterialProperty && //
      Property.equals(this._color, other._color))
  );
};
export default PolylineArrowMaterialProperty;
