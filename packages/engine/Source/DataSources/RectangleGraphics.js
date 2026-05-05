import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} RectangleGraphics.ConstructorOptions
 *
 * RectangleGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 布尔属性，指定矩形的可见性。
 * @property {Property | Rectangle} [coordinates] 指定 {@link Rectangle} 的属性。
 * @property {Property | number} [height=0] 数值属性，指定相对于椭球表面的矩形高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度参考系的属性。
 * @property {Property | number} [extrudedHeight] 数值属性，指定矩形拉伸面相对于椭球表面的高度。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定拉伸高度参考系的属性。
 * @property {Property | number} [rotation=0.0] 数值属性，指定矩形从北向顺时针旋转的角度。
 * @property {Property | number} [stRotation=0.0] 数值属性，指定矩形纹理从北向逆时针旋转的角度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 数值属性，指定矩形上点之间的角距离。
 * @property {Property | boolean} [fill=true] 布尔属性，指定矩形是否用提供的材质填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充矩形的材质的属性。
 * @property {Property | boolean} [outline=false] 布尔属性，指定矩形是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 数值属性，指定轮廓宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 枚举属性，指定矩形是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定从相机多远距离显示此矩形的属性。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 枚举属性，指定此矩形在贴地时是否对地形、3D Tiles 或两者进行分类。
 * @property {Property | number} [zIndex=0] 指定用于排序地面几何体的 zIndex 的属性。仅在矩形为常量且未指定 height 或 extrudedHeight 时有效。
 */

/**
 * 描述 {@link Rectangle} 的图形。
 * 矩形贴合地球曲率，可以放置在表面或指定高度，并可选择性地拉伸为体积。
 *
 * @alias RectangleGraphics
 * @constructor
 *
 * @param {RectangleGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?id=rectangle|Cesium Sandcastle 矩形演示}
 */
function RectangleGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._coordinates = undefined;
  this._coordinatesSubscription = undefined;
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
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distancedisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(RectangleGraphics.prototype, {
  /**
   * 获取当属性或子属性更改或修改时引发的事件。
   * @memberof RectangleGraphics.prototype
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
   * 获取或设置指定矩形可见性的布尔属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定 {@link Rectangle} 的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   */
  coordinates: createPropertyDescriptor("coordinates"),

  /**
   * 获取或设置数值属性，指定矩形的高度。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置数值属性，指定矩形拉伸的高度。
   * 设置此属性会创建从 height 开始到此高度的体。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置指定拉伸 {@link HeightReference} 的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置数值属性，指定矩形从北向顺时针旋转的角度。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置数值属性，指定矩形纹理从北向逆时针旋转的角度。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置数值属性，指定矩形上点之间的角距离。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置布尔属性，指定矩形是否用提供的材质填充。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充矩形的材质的属性。
   * @memberof RectangleGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定矩形是否有轮廓的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓宽度。
   * <p>
   * 注意：Windows 平台上的所有主流浏览器都会忽略此属性。详情请参见 {@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定矩形是否从光源投射或接收阴影。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机多远距离显示此矩形。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置 {@link ClassificationType} 属性，指定此矩形在贴地时是否对地形、3D Tiles 或两者进行分类。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置 zIndex 属性，指定矩形的排序顺序。仅在矩形为常量且未指定 height 或 extrudedHeight 时有效。
   * @memberof RectangleGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制此实例。
 *
 * @param {RectangleGraphics} [result] 用于存储结果的object。
 * @returns {RectangleGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
RectangleGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new RectangleGraphics(this);
  }
  result.show = this.show;
  result.coordinates = this.coordinates;
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
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * 将此对象上每个未赋值的属性设置为提供的源对象上相同属性的值。
 *
 * @param {RectangleGraphics} source 要合并到此对象中的对象。
 */
RectangleGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.coordinates = this.coordinates ?? source.coordinates;
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
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.classificationType =
    this.classificationType ?? source.classificationType;
  this.zIndex = this.zIndex ?? source.zIndex;
};
export default RectangleGraphics;
