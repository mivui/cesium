import defaultValue from "../Core/defaultValue.js";
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
 * PolygonGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定多边形可见性的布尔属性。
 * @property {Property |PolygonHierarchy |Cartesian3[]} [hierarchy] 指定 {@link PolygonHierarchy} 的属性。
 * @property {Property | number} [height=0] 一个数字属性，指定多边形相对于椭球体表面的高度。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property | number} [extrudedHeight] 一个数值属性，用于指定多边形的凸出面相对于椭球体表面的高度。
 * @property {Property |HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定 extrudedHeight 相对于什么的属性。
 * @property {Property | number} [stRotation=0.0] 一个数值属性，指定多边形纹理从北逆时针旋转。仅在未定义 textureCoordinates 时有效。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定每个纬度和经度点之间的角度距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定多边形是否使用提供的材质填充。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充多边形的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对多边形进行轮廓划分。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property | boolean} [perPositionHeight=false] 一个布尔值，指定是否使用每个位置的高度。
 * @property {boolean | boolean} [closeTop=true] 如果为 false，则挤出多边形的顶部保持打开状态。
 * @property {boolean | boolean} [closeBottom=true] 当为 false 时，挤出多边形的底部保持开放状态。
 * @property {Property |ArcType} [arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线类型。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定多边形是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此多边形。
 * @property {Property |ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此多边形在地面上时是分类地形、3D 瓦片，还是两者兼而有之。
 * @property {ConstantProperty | number} [zIndex=0] 一个属性，用于指定用于对地面几何体进行排序的 zIndex。 仅当多边形为 constant 且未指定 height 或 extrudedHeight 时才有效。
 * @property {Property |PolygonHierarchy} [textureCoordinates] 一个属性，将纹理坐标指定为 {@link Cartesian2} 点的 {@link PolygonHierarchy}。对 Ground Primitives 没有影响。
 */

/**
 * 描述由构成外部形状和任何嵌套孔的线性环层次结构定义的多边形。
 * 多边形符合地球的曲率，可以放置在表面或
 * 在高度处，并且可以选择将其拉伸到体积中。
 *
 * @alias PolygonGraphics
 * @constructor
 *
 * @param {PolygonGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polygon.html|Cesium Sandcastle Polygon Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PolygonGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定多边形可见性的属性。
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
   * 获取或设置numeric 指定多边形的恒定高度的属性。
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
   * 获取或设置numeric 指定多边形拉伸高度的属性。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为 false，则体积从 {@link PolygonGraphics#height} 开始，到此高度结束。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为 true，则体积从每个 {@link PolygonGraphics#hierarchy} 位置的高度开始，并在此高度结束。
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
   * 获取或设置numeric 属性指定多边形纹理从北逆时针旋转。仅在未定义 textureCoordinates 时有效。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置numeric 属性，用于指定多边形上点之间的角度距离。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 属性，指定是否使用提供的材质填充多边形。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充多边形的材料的属性。
   * @memberof PolygonGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对多边形进行轮廓划分的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置boolean 指定是否使用每个位置的高度。
   * 如果为 true，则形状将具有由每个 {@link PolygonGraphics#hierarchy} 位置的高度定义的非均匀高度。
   * 如果为 false，则形状将具有由 {@link PolygonGraphics#height} 指定的恒定高度。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  perPositionHeight: createPropertyDescriptor("perPositionHeight"),

  /**
   * 获取或设置一个布尔值，用于指定是否包含拉伸多边形的顶部。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeTop: createPropertyDescriptor("closeTop"),

  /**
   * 获取或设置一个布尔值，用于指定是否包含挤出多边形的底部。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeBottom: createPropertyDescriptor("closeBottom"),

  /**
   * 获取或设置{@link ArcType} 指定多边形边使用的线条类型的属性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置 enum 属性，指定多边形
   * 从光源投射或接收阴影。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 属性指定此多边形将在距摄像机多远处显示。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置{@link ClassificationType} 属性指定此多边形在地面上时是分类地形、3D 瓦片还是两者。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置zIndex Prperty 指定地面几何的顺序。 仅当多边形为 constant 且未指定 height 或 extrudedHeight 时才有效。
   * @memberof PolygonGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),

  /**
   *  将纹理坐标指定为 {@link Cartesian2} 点的 {@link PolygonHierarchy} 的属性。对 Ground Primitives 没有影响。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  textureCoordinates: createPropertyDescriptor("textureCoordinates"),
});

/**
 * 复制实例。
 *
 * @param {PolygonGraphics} [result] 要在其上存储结果的对象。
 * @returns {PolygonGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上的每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {PolygonGraphics} source 要合并到此对象中的对象。
 */
PolygonGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.hierarchy = defaultValue(this.hierarchy, source.hierarchy);
  this.height = defaultValue(this.height, source.height);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.extrudedHeight = defaultValue(
    this.extrudedHeight,
    source.extrudedHeight,
  );
  this.extrudedHeightReference = defaultValue(
    this.extrudedHeightReference,
    source.extrudedHeightReference,
  );
  this.stRotation = defaultValue(this.stRotation, source.stRotation);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.perPositionHeight = defaultValue(
    this.perPositionHeight,
    source.perPositionHeight,
  );
  this.closeTop = defaultValue(this.closeTop, source.closeTop);
  this.closeBottom = defaultValue(this.closeBottom, source.closeBottom);
  this.arcType = defaultValue(this.arcType, source.arcType);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.classificationType = defaultValue(
    this.classificationType,
    source.classificationType,
  );
  this.zIndex = defaultValue(this.zIndex, source.zIndex);
  this.textureCoordinates = defaultValue(
    this.textureCoordinates,
    source.textureCoordinates,
  );
};
export default PolygonGraphics;
