import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} CorridorGraphics.ConstructorOptions
 *
 * CorridorGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定走廊可见性的布尔属性。
 * @property {Property |Cartesian3[]} [positions] 一个属性，用于指定定义走廊中心线的 {@link Cartesian3} 位置数组。
 * @property {Property | number} [width] 一个数字属性，用于指定廊道边缘之间的距离。
 * @property {Property | number} [height=0] 一个数字属性，用于指定走廊相对于椭球体表面的高度。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property | number} [extrudedHeight] 一个数字属性，用于指定道路的拉伸面相对于椭球体表面的高度。
 * @property {Property |HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定 extrudedHeight 相对于什么的属性。
 * @property {Property |CornerType} [cornerType=CornerType.ROUNDED] 一个 {@link CornerType} 属性，用于指定角的样式。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，用于指定每个纬度和经度之间的距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否使用提供的材质填充走廊。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充走廊的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对走廊进行轮廓划分。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，用于指定走廊是否从光源投射或接收阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像头多远处显示此走廊。
 * @property {Property |ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此走廊在地面上时是分类地形、3D 瓦片，还是两者兼而有之。
 * @property {ConstantProperty | number} [zIndex] 指定走廊的 zIndex 的属性，用于排序。 仅当 height 和 extrudedHeight 未定义且道路是静态的时，才有效。
 */

/**
 * 描述道路，该道路是由中心线和宽度定义的造型，该宽度
 * 符合地球的曲率。它可以放置在表面或高处
 * 中，并且可以选择将其拉伸到体积块中。
 *
 * @alias CorridorGraphics
 * @constructor
 *
 * @param {CorridorGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Corridor.html|Cesium Sandcastle Corridor Demo}
 */
function CorridorGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
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
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(CorridorGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
   * @memberof CorridorGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置boolean 指定道路可见性的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置一个 Property，指定定义走廊中心线的 {@link Cartesian3} 位置的数组。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定轮廓宽度的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置指定走廊高度的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置指定 {@link HeightReference}.
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定道路拉伸高度的属性。
   * 设置此属性将创建从高度开始到结束的走廊形状体积
   * 在此高度。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置指定 extruded 的属性 {@link HeightReference}.
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置{@link CornerType} 指定如何设置拐角样式的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default CornerType.ROUNDED
   */
  cornerType: createPropertyDescriptor("cornerType"),

  /**
   * 获取或设置指定每个纬度和经度点之间的采样距离的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 属性，用于指定是否使用提供的材质填充走廊。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充道路的材质的属性。
   * @memberof CorridorGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对道路进行轮廓划分的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。了解详情, see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定 corridor
   * 从光源投射或接收阴影。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定在距摄像机多远处显示此走廊的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),

  /**
   * 获取或设置{@link ClassificationType} 指定此走廊在地面上时是分类地形、3D 瓦片还是两者兼而有之的属性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置指定走廊顺序的 zIndex 属性。 仅当 coridor 是 static 且未指定 height 或 exturdedHeight 时才有效。
   * @memberof CorridorGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制实例。
 *
 * @param {CorridorGraphics} [result] 要在其上存储结果的对象。
 * @returns {CorridorGraphics} 修改后的结果参数 or a new instance if one was not provided.
 */
CorridorGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new CorridorGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.width = this.width;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.cornerType = this.cornerType;
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {CorridorGraphics} source 要合并到此对象中的对象。
 */
CorridorGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.width = defaultValue(this.width, source.width);
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
  this.cornerType = defaultValue(this.cornerType, source.cornerType);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
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
export default CorridorGraphics;
