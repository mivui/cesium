import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} EllipsoidGraphics.ConstructorOptions
 *
 * EllipsoidGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定椭球体的可见性。
 * @property {Property |Cartesian3} [radii] 指定椭球半径的 {@link Cartesian3} 属性。
 * @property {Property |Cartesian3} [innerRadii] 指定椭球体内部半径的 {@link Cartesian3} 属性。
 * @property {Property | number} [minimumClock=0.0] 指定椭球最小时钟角度的属性。
 * @property {Property | number} [maximumClock=2*PI] 指定椭球体最大时钟角度的属性。
 * @property {Property | number} [minimumCone=0.0] 指定椭球体的最小圆锥角的属性。
 * @property {Property | number} [maximumCone=PI] 指定椭球体的最大圆锥角的属性。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 一个属性，用于指定从实体位置开始的高度相对于什么。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定椭球体是否使用提供的材质填充。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充椭球体的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对椭球体进行轮廓显示。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property | number} [stackPartitions=64] 指定堆栈数量的 Property。
 * @property {Property | number} [slicePartitions=64] 指定径向切片数量的属性。
 * @property {Property | number} [subdivisions=128] 一个属性，指定每个轮廓环的样本数，确定曲率的粒度。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定椭球体是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定此椭球体将在距离相机多远处显示。
 */

/**
 * 描述椭球体或球体。 中心位置和方向由包含的 {@link Entity} 确定。
 *
 * @alias EllipsoidGraphics
 * @constructor
 *
 * @param {EllipsoidGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Spheres%20and%20Ellipsoids.html|Cesium Sandcastle Spheres and Ellipsoids Demo}
 */
function EllipsoidGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._radii = undefined;
  this._radiiSubscription = undefined;
  this._innerRadii = undefined;
  this._innerRadiiSubscription = undefined;
  this._minimumClock = undefined;
  this._minimumClockSubscription = undefined;
  this._maximumClock = undefined;
  this._maximumClockSubscription = undefined;
  this._minimumCone = undefined;
  this._minimumConeSubscription = undefined;
  this._maximumCone = undefined;
  this._maximumConeSubscription = undefined;
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
  this._stackPartitions = undefined;
  this._stackPartitionsSubscription = undefined;
  this._slicePartitions = undefined;
  this._slicePartitionsSubscription = undefined;
  this._subdivisions = undefined;
  this._subdivisionsSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(EllipsoidGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
   * @memberof EllipsoidGraphics.prototype
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
   * 获取或设置boolean 指定椭球体可见性的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置{@link Cartesian3} {@link Property} 指定椭球体的半径。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  radii: createPropertyDescriptor("radii"),

  /**
   * 获取或设置{@link Cartesian3} {@link Property}指定椭球体的内半径。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default radii
   */
  innerRadii: createPropertyDescriptor("innerRadii"),

  /**
   * 获取或设置指定椭球的最小时钟角度的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumClock: createPropertyDescriptor("minimumClock"),

  /**
   * 获取或设置指定椭球体的最大时钟角度的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 2*PI
   */
  maximumClock: createPropertyDescriptor("maximumClock"),

  /**
   * 获取或设置指定椭球体的最小圆锥角的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumCone: createPropertyDescriptor("minimumCone"),

  /**
   * 获取或设置指定椭球体的最大圆锥角的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default PI
   */
  maximumCone: createPropertyDescriptor("maximumCone"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置boolean 属性，指定是否使用提供的材质填充椭球体。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充椭球体的材料的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对椭球体进行轮廓显示的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * 注意：在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置Property 指定堆栈的数量。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  stackPartitions: createPropertyDescriptor("stackPartitions"),

  /**
   * 获取或设置指定每 360 度径向切片数的属性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  slicePartitions: createPropertyDescriptor("slicePartitions"),

  /**
   * 获取或设置指定每个轮廓环的样本数的属性，用于确定曲率的粒度。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  subdivisions: createPropertyDescriptor("subdivisions"),

  /**
   * 获取或设置枚举属性，指定省略柱体
   * 从光源投射或接收阴影。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 属性，用于指定此椭球体将在距照相机多远处显示。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制实例。
 *
 * @param {EllipsoidGraphics} [result] 要在其上存储结果的对象。
 * @returns {EllipsoidGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
 */
EllipsoidGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new EllipsoidGraphics(this);
  }
  result.show = this.show;
  result.radii = this.radii;
  result.innerRadii = this.innerRadii;
  result.minimumClock = this.minimumClock;
  result.maximumClock = this.maximumClock;
  result.minimumCone = this.minimumCone;
  result.maximumCone = this.maximumCone;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.stackPartitions = this.stackPartitions;
  result.slicePartitions = this.slicePartitions;
  result.subdivisions = this.subdivisions;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {EllipsoidGraphics} source 要合并到此对象中的对象。
 */
EllipsoidGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.radii = defaultValue(this.radii, source.radii);
  this.innerRadii = defaultValue(this.innerRadii, source.innerRadii);
  this.minimumClock = defaultValue(this.minimumClock, source.minimumClock);
  this.maximumClock = defaultValue(this.maximumClock, source.maximumClock);
  this.minimumCone = defaultValue(this.minimumCone, source.minimumCone);
  this.maximumCone = defaultValue(this.maximumCone, source.maximumCone);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.stackPartitions = defaultValue(
    this.stackPartitions,
    source.stackPartitions,
  );
  this.slicePartitions = defaultValue(
    this.slicePartitions,
    source.slicePartitions,
  );
  this.subdivisions = defaultValue(this.subdivisions, source.subdivisions);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default EllipsoidGraphics;
