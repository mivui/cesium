import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import PolygonHierarchy from "../Core/PolygonHierarchy.js";
import ConstantProperty from "./ConstantProperty.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

function createPolygonHierarchyProperty(value) {
  if (Array.isArray(value)) {
    // convert array of positions to PolygonHierarchy object
    value = new PolygonHierarchy(value);
  }
  return new ConstantProperty(value);
}

/**
 * @typedef {object} PolygonGraphics.ConstructorOptions
 *
 * PolygonGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定多边形可见性的布尔属性。
 * @property {Property | PolygonHierarchy | Cartesian3[]} [hierarchy] 指定 {@link PolygonHierarchy} 的属性。
 * @property {Property | number} [height=0] 指定多边形相对于椭球表面高度的数值属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对参照的属性。
 * @property {Property | number} [extrudedHeight] 指定多边形拉伸面相对于椭球表面高度的数值属性。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定extrudedHeight相对参照的属性。
 * @property {Property | number} [stRotation=0.0] 指定多边形纹理从北向逆时针旋转的数值属性。仅在未定义textureCoordinates时有效。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 指定每个经纬度点之间角距离的数值属性。
 * @property {Property | boolean} [fill=true] 指定多边形是否用提供的材质填充的布尔属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充多边形的材质的属性。
 * @property {Property | boolean} [outline=false] 指定多边形是否带轮廓的布尔属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数值属性。
 * @property {Property | boolean} [perPositionHeight=false] 指定是否使用每个位置的高度的布尔属性。
 * @property {boolean | boolean} [closeTop=true] 当false时，拉伸多边形的顶部保持开放。
 * @property {boolean | boolean} [closeBottom=true] 当false时，拉伸多边形的底部保持开放。
 * @property {Property | ArcType} [arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线类型。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 指定多边形是否从光源投射或接收阴影的枚举属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定多边形在距离相机多远时显示的属性。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 指定多边形在地面上时是对地形、3D Tiles还是两者进行分类的枚举属性。
 * @property {ConstantProperty | number} [zIndex=0] 指定用于排序地面几何图形的zIndex的属性。仅在多边形为常量且未指定height或extrudedHeight时有效。
 * @property {Property | PolygonHierarchy} [textureCoordinates] 指定纹理坐标（作为 {@link Cartesian2} 点的 {@link PolygonHierarchy}）的属性。对地面图元无效。
 */

/**
 * 描述由构成外形状和任何嵌套孔洞的线性环层次结构定义的多边形。
 * 多边形符合地球的曲率，可以放置在表面上或指定高度，并可选择拉伸为体积。
 *
 * @alias PolygonGraphics
 * @constructor
 *
 * @param {PolygonGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?id=polygon|Cesium Sandcastle 多边形演示}
 */
function PolygonGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._hierarchy = undefined;
  this._hierarchySubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
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
  this._perPositionHeight = undefined;
  this._perPositionHeightSubscription = undefined;
  this._closeTop = undefined;
  this._closeTopSubscription = undefined;
  this._closeBottom = undefined;
  this._closeBottomSubscription = undefined;
  this._arcType = undefined;
  this._arcTypeSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;
  this._textureCoordinates = undefined;
  this._textureCoordinatesSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(PolygonGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PolygonGraphics.prototype
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
   * 获取或设置指定多边形可见性的布尔属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定 {@link PolygonHierarchy} 的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  hierarchy: createPropertyDescriptor(
    "hierarchy",
    undefined,
    createPolygonHierarchyProperty,
  ),

  /**
   * 获取或设置指定多边形恒定高度的数值属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定多边形拉伸高度的数值属性。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为false，则体积从 {@link PolygonGraphics#height} 开始到此高度结束。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为true，则体积从每个 {@link PolygonGraphics#hierarchy} 位置的高度开始到此高度结束。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置指定拉伸 {@link HeightReference} 的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置指定多边形纹理从北向逆时针旋转的数值属性。仅在未定义textureCoordinates时有效。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置指定多边形上点之间角距离的数值属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置指定多边形是否用提供的材质填充的布尔属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充多边形的材质的属性。
   * @memberof PolygonGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定多边形是否带轮廓的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * <p>
   * 注意：在Windows平台的所有主流浏览器上，此属性将被忽略。详情参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定是否使用每个位置的高度的布尔属性。
   * 如果为true，则形状将具有由每个 {@link PolygonGraphics#hierarchy} 位置的高度定义的非均匀高度。
   * 如果为false，则形状将具有由 {@link PolygonGraphics#height} 指定的恒定高度。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  perPositionHeight: createPropertyDescriptor("perPositionHeight"),

  /**
   * 获取或设置指定是否包含拉伸多边形顶部的布尔属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeTop: createPropertyDescriptor("closeTop"),

  /**
   * 获取或设置指定是否包含拉伸多边形底部的布尔属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeBottom: createPropertyDescriptor("closeBottom"),

  /**
   * 获取或设置指定多边形边缘使用的线类型的 {@link ArcType} 属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置指定多边形是否从光源投射或接收阴影的枚举属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定多边形在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置指定此多边形在地面上时是对地形、3D Tiles还是两者进行分类的 {@link ClassificationType} 属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置指定地面几何图形排序的zIndex属性。仅在多边形为常量且未指定height或extrudedHeight时有效。
   * @memberof PolygonGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),

  /**
   * 指定纹理坐标（作为 {@link Cartesian2} 点的 {@link PolygonHierarchy}）的属性。对地面图元无效。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  textureCoordinates: createPropertyDescriptor("textureCoordinates"),
});

/**
 * 复制此实例。
 *
 * @param {PolygonGraphics} [result] 存储结果的对象。
 * @returns {PolygonGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
PolygonGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolygonGraphics(this);
  }
  result.show = this.show;
  result.hierarchy = this.hierarchy;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.stRotation = this.stRotation;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.perPositionHeight = this.perPositionHeight;
  result.closeTop = this.closeTop;
  result.closeBottom = this.closeBottom;
  result.arcType = this.arcType;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  result.textureCoordinates = this.textureCoordinates;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {PolygonGraphics} source 要合并到此对象中的对象。
 */
PolygonGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.hierarchy = this.hierarchy ?? source.hierarchy;
  this.height = this.height ?? source.height;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.extrudedHeight = this.extrudedHeight ?? source.extrudedHeight;
  this.extrudedHeightReference =
    this.extrudedHeightReference ?? source.extrudedHeightReference;
  this.stRotation = this.stRotation ?? source.stRotation;
  this.granularity = this.granularity ?? source.granularity;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.perPositionHeight = this.perPositionHeight ?? source.perPositionHeight;
  this.closeTop = this.closeTop ?? source.closeTop;
  this.closeBottom = this.closeBottom ?? source.closeBottom;
  this.arcType = this.arcType ?? source.arcType;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.classificationType =
    this.classificationType ?? source.classificationType;
  this.zIndex = this.zIndex ?? source.zIndex;
  this.textureCoordinates =
    this.textureCoordinates ?? source.textureCoordinates;
};
export default PolygonGraphics;
