import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} EllipseGraphics.ConstructorOptions
 *
 * EllipseGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定椭圆的可见性。
 * @property {Property | number} [semiMajorAxis] 一个数值属性，指定半长轴。
 * @property {Property | number} [semiMinorAxis] 一个数值属性，指定半短轴。
 * @property {Property | number} [height=0] 一个数值属性，指定椭圆相对于椭球体表面的高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定高度的相对参考。
 * @property {Property | number} [extrudedHeight] 一个数值属性，指定椭圆挤压面相对于椭球体表面的高度。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 一个属性，指定挤压高度的相对参考。
 * @property {Property | number} [rotation=0.0] 一个数值属性，指定椭圆从北向逆时针旋转的角度。
 * @property {Property | number} [stRotation=0.0] 一个数值属性，指定椭圆纹理从北向逆时针旋转的角度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，指定椭圆上点之间的角距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定椭圆是否使用提供的材质进行填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充椭圆的材质。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定椭圆是否有轮廓线。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓线的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓线的宽度。
 * @property {Property | number} [numberOfVerticalLines=16] 一个数值属性，指定沿轮廓周长绘制的垂直线数量。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定椭圆是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机多远的距离显示此椭圆。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定当椭圆在地面上时，是否对地形、3D Tiles 或两者进行分类。
 * @property {ConstantProperty | number} [zIndex=0] 一个属性，指定椭圆的 zIndex，用于排序地面几何体。仅在椭圆是常量且未指定 height 或 extrudedHeight 时才有效果。
 */

/**
 * 描述由中心点、半长轴和半短轴定义的椭圆。
 * 椭圆符合地球曲率，可以放置在表面或指定高度，
 * 也可以选择挤压成体积。
 * 中心点由包含的 {@link Entity} 决定。
 *
 * @alias EllipseGraphics
 * @constructor
 *
 * @param {EllipseGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=circles-and-ellipses|Cesium Sandcastle Circles and Ellipses Demo}
 */
function EllipseGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._semiMajorAxis = undefined;
  this._semiMajorAxisSubscription = undefined;
  this._semiMinorAxis = undefined;
  this._semiMinorAxisSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
  this._rotation = undefined;
  this._rotationSubscription = undefined;
  this._stRotation = undefined;
  this._stRotationSubscription = undefined;
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
  this._numberOfVerticalLines = undefined;
  this._numberOfVerticalLinesSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(EllipseGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof EllipseGraphics.prototype
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
   * 获取或设置指定椭圆可见性的布尔属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定半长轴的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMajorAxis: createPropertyDescriptor("semiMajorAxis"),

  /**
   * 获取或设置指定半短轴的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMinorAxis: createPropertyDescriptor("semiMinorAxis"),

  /**
   * 获取或设置指定椭圆高度的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定椭圆挤压高度的数值属性。
   * 设置此属性会创建一个从高度开始到此高度结束的体积。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置指定挤压 {@link HeightReference} 的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置指定椭圆从北向逆时针旋转角度的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置指定椭圆纹理从北向逆时针旋转角度的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置指定椭圆上点之间角距离的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置指定椭圆是否使用提供的材质进行填充的布尔属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充椭圆的材质的属性。
   * @memberof EllipseGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定椭圆是否有轮廓线的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓线 {@link Color} 的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓线宽度的数值属性。
   * <p>
   * 注意：在 Windows 平台的所有主流浏览器上，此属性将被忽略。详情请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定沿轮廓周长绘制垂直线数量的数值属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置指定椭圆是否从光源投射或接收阴影的枚举属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定从相机多远的距离显示此椭圆的 {@link DistanceDisplayCondition} 属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置指定当椭圆在地面上时，是否对地形、3D Tiles 或两者进行分类的 {@link ClassificationType} 属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置指定椭圆排序的 zIndex 属性。仅在椭圆是常量且未指定 height 或 extrudedHeight 时才有效果
   * @memberof EllipseGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制此实例。
 *
 * @param {EllipseGraphics} [result] 存储结果的对象。
 * @returns {EllipseGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
EllipseGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new EllipseGraphics(this);
  }
  result.show = this.show;
  result.semiMajorAxis = this.semiMajorAxis;
  result.semiMinorAxis = this.semiMinorAxis;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.rotation = this.rotation;
  result.stRotation = this.stRotation;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.numberOfVerticalLines = this.numberOfVerticalLines;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {EllipseGraphics} source The object to be merged into this object.
 */
EllipseGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.semiMajorAxis = this.semiMajorAxis ?? source.semiMajorAxis;
  this.semiMinorAxis = this.semiMinorAxis ?? source.semiMinorAxis;
  this.height = this.height ?? source.height;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.extrudedHeight = this.extrudedHeight ?? source.extrudedHeight;
  this.extrudedHeightReference =
    this.extrudedHeightReference ?? source.extrudedHeightReference;
  this.rotation = this.rotation ?? source.rotation;
  this.stRotation = this.stRotation ?? source.stRotation;
  this.granularity = this.granularity ?? source.granularity;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.numberOfVerticalLines =
    this.numberOfVerticalLines ?? source.numberOfVerticalLines;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.classificationType =
    this.classificationType ?? source.classificationType;
  this.zIndex = this.zIndex ?? source.zIndex;
};
export default EllipseGraphics;
