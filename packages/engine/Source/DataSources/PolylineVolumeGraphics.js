import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PolylineVolumeGraphics.ConstructorOptions
 *
 * PolylineVolumeGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 布尔属性，指定体的可见性。
 * @property {Property | Cartesian3[]} [positions] 指定定义线带的 {@link Cartesian3} 位置数组的属性。
 * @property {Property | Cartesian2[]} [shape] 指定定义要拉伸的形状的 {@link Cartesian2} 位置数组的属性。
 * @property {Property | CornerType} [cornerType=CornerType.ROUNDED] {@link CornerType} 属性，指定角落样式。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 数值属性，指定每个经纬度点之间的角距离。
 * @property {Property | boolean} [fill=true] 布尔属性，指定体是否用提供的材质填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充体的材质的属性。
 * @property {Property | boolean} [outline=false] 布尔属性，指定体是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 数值属性，指定轮廓宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 枚举属性，指定体是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定从相机多远距离显示此体的属性。
 */

/**
 * 描述一个折线体，定义为线带和沿其拉伸的相应二维形状。
 * 生成的体会贴合地球曲率。
 *
 * @alias PolylineVolumeGraphics
 * @constructor
 *
 * @param {PolylineVolumeGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?id=polyline-volume|Cesium Sandcastle 折线体演示}
 */
function PolylineVolumeGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._shape = undefined;
  this._shapeSubscription = undefined;
  this._cornerType = undefined;
  this._cornerTypeSubscription = undefined;
  this._granularity = undefined;
  this._granularitySubscription = undefined;
  this._fill = undefined;
  this._fillSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._outline = undefined;
  this._outlineSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubsription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(PolylineVolumeGraphics.prototype, {
  /**
   * 获取当属性或子属性更改或修改时引发的事件。
   * @memberof PolylineVolumeGraphics.prototype
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
   * 获取或设置指定体可见性的布尔属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定定义线带的 {@link Cartesian3} 位置数组的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定定义要拉伸的形状的 {@link Cartesian2} 位置数组的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  shape: createPropertyDescriptor("shape"),

  /**
   * 获取或设置 {@link CornerType} 属性，指定角落样式。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default CornerType.ROUNDED
   */
  cornerType: createPropertyDescriptor("cornerType"),

  /**
   * 获取或设置数值属性，指定体上点之间的角距离。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置布尔属性，指定体是否用提供的材质填充。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充体的材质的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定体是否有轮廓的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓宽度。
   * <p>
   * 注意：Windows 平台上的所有主流浏览器都会忽略此属性。详情请参见 {@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定体是否从光源投射或接收阴影。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机多远距离显示此体。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * Duplicates this instance.
 *
 * @param {PolylineVolumeGraphics} [result] The object onto which to store the result.
 * @returns {PolylineVolumeGraphics} The modified result parameter or a new instance if one was not provided.
 */
PolylineVolumeGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolylineVolumeGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.shape = this.shape;
  result.cornerType = this.cornerType;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {PolylineVolumeGraphics} source The object to be merged into this object.
 */
PolylineVolumeGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.positions = this.positions ?? source.positions;
  this.shape = this.shape ?? source.shape;
  this.cornerType = this.cornerType ?? source.cornerType;
  this.granularity = this.granularity ?? source.granularity;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
};
export default PolylineVolumeGraphics;
