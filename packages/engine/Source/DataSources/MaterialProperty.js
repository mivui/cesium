import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import JulianDate from "../Core/JulianDate.js";
import Material from "../Scene/Material.js";

/**
 * 表示 {@link Material} uniform 的所有 {@link Property} 对象的接口。
 * 此类型定义接口，不能直接实例化。
 *
 * @alias MaterialProperty
 * @constructor
 * @abstract
 *
 * @see ColorMaterialProperty
 * @see CompositeMaterialProperty
 * @see GridMaterialProperty
 * @see ImageMaterialProperty
 * @see PolylineGlowMaterialProperty
 * @see PolylineOutlineMaterialProperty
 * @see StripeMaterialProperty
 */
function MaterialProperty() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(MaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof MaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof MaterialProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 * @function
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
MaterialProperty.prototype.getType = DeveloperError.throwInstantiationError;

/**
 * 获取属性在提供的时间的值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
MaterialProperty.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
MaterialProperty.prototype.equals = DeveloperError.throwInstantiationError;

const timeScratch = new JulianDate();

/**
 * @private
 */
MaterialProperty.getValue = function (time, materialProperty, material) {
  let type;
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  if (defined(materialProperty)) {
    type = materialProperty.getType(time);
    if (defined(type)) {
      if (!defined(material) || material.type !== type) {
        material = Material.fromType(type);
      }
      materialProperty.getValue(time, material.uniforms);
      return material;
    }
  }

  if (!defined(material) || material.type !== Material.ColorType) {
    material = Material.fromType(Material.ColorType);
  }
  Color.clone(Color.WHITE, material.uniforms.color);

  return material;
};
export default MaterialProperty;
