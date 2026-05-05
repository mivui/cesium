import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultRepeat = new Cartesian2(1, 1);
const defaultTransparent = false;
const defaultColor = Color.WHITE;

/**
 * 一个映射到图像 {@link Material} 统一变量的 {@link MaterialProperty}。
 * @alias ImageMaterialProperty
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.image] 指定图像、URL、Canvas 或视频的属性。
 * @param {Property|Cartesian2} [options.repeat=new Cartesian2(1.0, 1.0)] 指定图像在每个方向重复次数的 {@link Cartesian2} 属性。
 * @param {Property|Color} [options.color=Color.WHITE] 应用于图像的颜色。
 * @param {Property|boolean} [options.transparent=false] 当图像具有透明度时设置为 true（例如，当 png 具有透明部分时）。
 */
function ImageMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._transparent = undefined;
  this._transparentSubscription = undefined;

  this.image = options.image;
  this.repeat = options.repeat;
  this.color = options.color;
  this.transparent = options.transparent;
}

Object.defineProperties(ImageMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，
   * 则该属性被视为常量。
   * @memberof ImageMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._image) && Property.isConstant(this._repeat)
      );
    },
  },

  /**
   * 获取当此属性的定义更改时将触发的事件。
   * 如果对同一时间的 getValue 调用将返回不同结果，
   * 则认为定义已更改。
   * @memberof ImageMaterialProperty.prototype
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
   * 获取或设置指定要使用的图像、URL、Canvas 或视频的属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   */
  image: createPropertyDescriptor("image"),

  /**
   * 获取或设置指定图像在每个方向重复次数的 {@link Cartesian2} 属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(1, 1)
   */
  repeat: createPropertyDescriptor("repeat"),

  /**
   * 获取或设置指定应用于图像的颜色的 Color 属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定图像是否具有透明度的布尔属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  transparent: createPropertyDescriptor("transparent"),
});

/**
 * 获取提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质类型。
 */
ImageMaterialProperty.prototype.getType = function (time) {
  return "Image";
};

const timeScratch = new JulianDate();

/**
 * 获取提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建新实例并返回。
 * @returns {object} 修改后的 result 参数，如果未提供 result 参数，则返回新实例。
 */
ImageMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  if (!defined(result)) {
    result = {};
  }

  result.image = Property.getValueOrUndefined(this._image, time);
  result.repeat = Property.getValueOrClonedDefault(
    this._repeat,
    time,
    defaultRepeat,
    result.repeat,
  );
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  if (Property.getValueOrDefault(this._transparent, time, defaultTransparent)) {
    result.color.alpha = Math.min(0.99, result.color.alpha);
  }

  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
ImageMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof ImageMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._repeat, other._repeat) &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._transparent, other._transparent))
  );
};
export default ImageMaterialProperty;
