import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} CylinderGraphics.ConstructorOptions
 *
 * CylinderGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定圆柱体的可见性。
 * @property {Property | number} [length] 一个数值属性，指定圆柱体的长度。
 * @property {Property | number} [topRadius] 一个数值属性，指定圆柱体顶部的半径。
 * @property {Property | number} [bottomRadius] 一个数值属性，指定圆柱体底部的半径。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定实体位置的高度是相对于什么的。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定圆柱体是否使用提供的材质进行填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充圆柱体的材质。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定圆柱体是否有轮廓线。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓线的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓线的宽度。
 * @property {Property | number} [numberOfVerticalLines=16] 一个数值属性，指定沿轮廓周长绘制的垂直线数量。
 * @property {Property | number} [slices=128] 圆柱体周长周围的边缘数量。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定圆柱体是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机多远的距离显示此圆柱体。
 */

/**
 * 描述由长度、顶部半径和底部半径定义的圆柱体、截锥体或圆锥体。
 * 中心位置和方向由包含的 {@link Entity} 决定。
 *
 * @alias CylinderGraphics
 * @constructor
 *
 * @param {CylinderGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */
function CylinderGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._length = undefined;
  this._lengthSubscription = undefined;
  this._topRadius = undefined;
  this._topRadiusSubscription = undefined;
  this._bottomRadius = undefined;
  this._bottomRadiusSubscription = undefined;
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
  this._numberOfVerticalLines = undefined;
  this._numberOfVerticalLinesSubscription = undefined;
  this._slices = undefined;
  this._slicesSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(CylinderGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof CylinderGraphics.prototype
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
   * 获取或设置指定圆柱体可见性的布尔属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定圆柱体长度的数值属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  length: createPropertyDescriptor("length"),

  /**
   * 获取或设置指定圆柱体顶部半径的数值属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  topRadius: createPropertyDescriptor("topRadius"),

  /**
   * 获取或设置指定圆柱体底部半径的数值属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  bottomRadius: createPropertyDescriptor("bottomRadius"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定圆柱体是否使用提供的材质进行填充的布尔属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充圆柱体的材质的属性。
   * @memberof CylinderGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定圆柱体是否有轮廓线的布尔属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓线 {@link Color} 的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓线宽度的数值属性。
   * <p>
   * 注意：在 Windows 平台的所有主流浏览器上，此属性将被忽略。详情请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定沿轮廓周长绘制的垂直线数量的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置指定圆柱体周长周围边缘数量的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  slices: createPropertyDescriptor("slices"),

  /**
   * 获取或设置指定圆柱体是否从光源投射或接收阴影的枚举属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * Gets or sets the {@link DistanceDisplayCondition} Property specifying at what distance from the camera that this cylinder will be displayed.
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制此实例。
 *
 * @param {CylinderGraphics} [result] 存储结果的对象。
 * @returns {CylinderGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
CylinderGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new CylinderGraphics(this);
  }
  result.show = this.show;
  result.length = this.length;
  result.topRadius = this.topRadius;
  result.bottomRadius = this.bottomRadius;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.numberOfVerticalLines = this.numberOfVerticalLines;
  result.slices = this.slices;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给
 * 提供的源对象上相同属性的值。
 *
 * @param {CylinderGraphics} source 要合并到此对象中的对象。
 */
CylinderGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.length = this.length ?? source.length;
  this.topRadius = this.topRadius ?? source.topRadius;
  this.bottomRadius = this.bottomRadius ?? source.bottomRadius;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.numberOfVerticalLines =
    this.numberOfVerticalLines ?? source.numberOfVerticalLines;
  this.slices = this.slices ?? source.slices;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
};
export default CylinderGraphics;
