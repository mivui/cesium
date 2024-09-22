import defaultValue from "../Core/defaultValue.js";
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
 * @property {Property | boolean} [show=true] 一个布尔属性，指定矩形的可见性。
 * @property {Property |Rectangle} [coordinates] 指定 {@link Rectangle} 的属性。
 * @property {Property | number} [height=0] 一个数字属性，指定矩形相对于椭球体表面的高度。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property | number} [extrudedHeight] 一个数字属性，用于指定矩形的凸出面相对于椭球体表面的高度。
 * @property {Property |HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定 extrudedHeight 相对于什么的属性。
 * @property {Property | number} [rotation=0.0] 一个数值属性，指定矩形从北顺时针方向旋转。
 * @property {Property | number} [stRotation=0.0] 一个数值属性，指定矩形纹理从北逆时针旋转。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定矩形上点之间的角度距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定矩形是否使用提供的材质填充。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充矩形的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定矩形是否被勾勒出来。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定矩形是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距相机多远处显示此矩形。
 * @property {Property |ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此矩形在地面上时是分类地形、3D 瓦片，还是两者兼而有之。
 * @property {Property | number} [zIndex=0] 指定用于对地面几何图形进行排序的 zIndex 的属性。 仅当矩形为 constant 且未指定 height 或 extrudedHeight 时才有效。
 */

/**
 * 描述 {@link Rectangle}.
 * 矩形符合地球仪的曲率，可以放置在表面上或
 * 在高度处，并且可以选择将其拉伸到体积中。
 *
 * @alias RectangleGraphics
 * @constructor
 *
 * @param {RectangleGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Rectangle.html|Cesium Sandcastle Rectangle Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(RectangleGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定矩形可见性的属性。
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
   * 获取或设置numeric 指定矩形高度的属性。
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
   * 获取或设置numeric 指定矩形拉伸高度的属性。
   * 设置此属性将创建从高度开始到此高度结束的体积。
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
   * 获取或设置numeric 属性指定矩形从北顺时针方向旋转。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置numeric 属性指定矩形纹理从北逆时针旋转。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置numeric 指定矩形上点之间的角度距离的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 属性，指定是否使用提供的材质填充矩形。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充矩形的材料的属性。
   * @memberof RectangleGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对矩形进行轮廓划分的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 enum 属性，指定矩形是否
   * 从光源投射或接收阴影。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此矩形将在距摄像机多远处显示的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),

  /**
   * 获取或设置{@link ClassificationType} 指定此矩形在地面上时是分类地形、3D 瓦片还是两者的属性。
   * @memberof RectangleGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置指定矩形顺序的 zIndex 属性。 仅当矩形为 constant 且未指定 height 或 extrudedHeight 时才有效。
   * @memberof RectangleGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制instance.
 *
 * @param {RectangleGraphics} [result] 要在其上存储结果的对象。
 * @returns {RectangleGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {RectangleGraphics} source 要合并到此对象中的对象。
 */
RectangleGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.coordinates = defaultValue(this.coordinates, source.coordinates);
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
export default RectangleGraphics;
