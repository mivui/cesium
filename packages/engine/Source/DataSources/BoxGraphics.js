import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} BoxGraphics.ConstructorOptions
 *
 * BoxGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定箱体可见性的布尔属性。
 * @property {Property | Cartesian3} [dimensions] 指定箱体长度、宽度和高度的 {@link Cartesian3} 属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定实体位置的高度相对于什么的属性。
 * @property {Property | boolean} [fill=true] 指定箱体是否填充所提供材质的布尔属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充箱体的材质的属性。
 * @property {Property | boolean} [outline=false] 指定箱体是否轮廓化的布尔属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数值属性。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 指定箱体是否从光源投射或接收阴影的枚举属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定在距相机多远处显示此箱体的属性。
 *
 */

/**
 * 描述一个箱体。中心位置和方向由包含的 {@link Entity} 确定。
 *
 * @alias BoxGraphics
 * @constructor
 *
 * @param {BoxGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=box|Cesium Sandcastle Box Demo}
 */
function BoxGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._dimensions = undefined;
  this._dimensionsSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
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
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(BoxGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时触发的事件。
   * @memberof BoxGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置指定箱体可见性的布尔属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定箱体长度、宽度和高度的 {@link Cartesian3} 属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   */
  dimensions: createPropertyDescriptor("dimensions"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定箱体是否填充所提供材质的布尔属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充箱体的材质。
   * @memberof BoxGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定箱体是否轮廓化的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * <p>
   * 注意：此属性在所有主要浏览器的 Windows 平台上都将被忽略。详情请见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定箱体是否从光源投射或接收阴影的枚举属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定在距相机多远处显示此箱体的 {@link DistanceDisplayCondition} 属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制此实例。
 *
 * @param {BoxGraphics} [result] 存储结果的对象。
 * @returns {BoxGraphics} 修改后的结果参数，如果未提供则为新实例。
 */
BoxGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new BoxGraphics(this);
  }
  result.show = this.show;
  result.dimensions = this.dimensions;
  result.heightReference = this.heightReference;
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
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {BoxGraphics} source 要合并到此对象中的对象。
 */
BoxGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.dimensions = this.dimensions ?? source.dimensions;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
};
export default BoxGraphics;
