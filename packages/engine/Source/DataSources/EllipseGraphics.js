import defaultValue from "../Core/defaultValue.js";
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
 * @property {Property | boolean} [show=true] 一个布尔属性，用于指定椭圆的可见性。
 * @property {Property | number} [semiMajorAxis] 指定长半轴的数值属性。
 * @property {Property | number} [semiMinorAxis] 指定短半轴的数值属性。
 * @property {Property | number} [height=0] 一个数字属性，指定椭圆相对于椭球体表面的高度。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property | number} [extrudedHeight] 一个数字属性，用于指定椭圆的拉伸面相对于椭球体表面的高度。
 * @property {Property |HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定 extrudedHeight 相对于什么的属性。
 * @property {Property | number} [rotation=0.0] 一个数字属性，指定椭圆从北逆时针旋转。
 * @property {Property | number} [stRotation=0.0] 一个数值属性，指定椭圆纹理从北方逆时针旋转。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定椭圆上点之间的角度距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否使用提供的材质填充椭圆。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充椭圆的材料的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对椭圆进行轮廓显示。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property | number} [numberOfVerticalLines=16] 一个数字属性，指定要沿轮廓的周长绘制的垂直线数。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定椭圆是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定此椭圆将在距离相机多远处显示。
 * @property {Property |ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此椭圆在地面上时是对地形、3D 瓦片进行分类，还是对两者进行分类。
 * @property {ConstantProperty | number} [zIndex=0] 指定椭圆的 zIndex 的属性。 用于对地面几何图形进行排序。 仅当椭圆为常量且未指定 height 或 exturdedHeight 时才有效。
 */

/**
 * 描述由中心点和半长轴和半短轴定义的椭圆。
 * 椭圆符合地球仪的曲率，可以放置在表面上或
 * 在高度处，并且可以选择将其拉伸到体积中。
 * 中心点由包含的 {@link Entity} 确定。
 *
 * @alias EllipseGraphics
 * @constructor
 *
 * @param {EllipseGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Circles and Ellipses.html|Cesium Sandcastle Circles and Ellipses Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(EllipseGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定椭圆可见性的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置numeric 属性指定半长轴。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMajorAxis: createPropertyDescriptor("semiMajorAxis"),

  /**
   * 获取或设置numeric 指定半短轴的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMinorAxis: createPropertyDescriptor("semiMinorAxis"),

  /**
   * 获取或设置numeric 指定椭圆高度的属性。
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
   * 获取或设置numeric 指定椭圆拉伸高度的属性。
   * 设置此属性将创建从高度开始到此高度结束的体积。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置指定拉伸 {@link HeightReference} 的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置numeric 属性指定椭圆从北逆时针旋转。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置numeric 属性指定椭圆纹理从北逆时针旋转。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置numeric 属性，用于指定椭圆上点之间的角度距离。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 指定是否使用提供的材质填充椭圆的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充椭圆的材料的属性。
   * @memberof EllipseGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否为椭圆添加轮廓的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。了解详情, see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置numeric 指定要沿轮廓周长绘制的垂直线数的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置枚举属性，指定椭圆是否
   * 从光源投射或接收阴影。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此椭圆将在距相机多远处显示的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),

  /**
   * 获取或设置{@link ClassificationType}指定此椭圆在地面上时是分类地形、3D 瓦片还是两者的属性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置指定椭圆排序的 zIndex 属性。 仅当椭圆为常量且未指定 height 或 extrudedHeight 时才有效
   * @memberof EllipseGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制instance.
 *
 * @param {EllipseGraphics} [result] 要在其上存储结果的对象。
 * @returns {EllipseGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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

  this.show = defaultValue(this.show, source.show);
  this.semiMajorAxis = defaultValue(this.semiMajorAxis, source.semiMajorAxis);
  this.semiMinorAxis = defaultValue(this.semiMinorAxis, source.semiMinorAxis);
  this.height = defaultValue(this.height, source.height);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference
  );
  this.extrudedHeight = defaultValue(
    this.extrudedHeight,
    source.extrudedHeight
  );
  this.extrudedHeightReference = defaultValue(
    this.extrudedHeightReference,
    source.extrudedHeightReference
  );
  this.rotation = defaultValue(this.rotation, source.rotation);
  this.stRotation = defaultValue(this.stRotation, source.stRotation);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.numberOfVerticalLines = defaultValue(
    this.numberOfVerticalLines,
    source.numberOfVerticalLines
  );
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
  this.classificationType = defaultValue(
    this.classificationType,
    source.classificationType
  );
  this.zIndex = defaultValue(this.zIndex, source.zIndex);
};
export default EllipseGraphics;
