import defaultValue from "../Core/defaultValue.js";
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
 * @property {Property | boolean} [show=true] 一个布尔属性，指定框的可见性。
 * @property {Property | Cartesian3} [dimensions] 一个 {@link Cartesian3} 属性，用于指定框的长度、宽度和高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，用于指定从实体位置开始的高度相对于什么。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否用提供的材质填充框。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充框的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔型 属性，指定是否对框进行轮廓划分。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定盒子是投射还是接收来自光源的阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此框。
 *
 */

/**
 * 描述一个框。中心位置和方向由包含的 {@link Entity} 确定。
 *
 * @alias BoxGraphics
 * @constructor
 *
 * @param {BoxGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Box.html|Cesium Sandcastle Box Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(BoxGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean Property specifying the visibility of the box.
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置 {@link Cartesian3} 属性，指定框的长度、宽度和高度。
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
   * 获取或设置boolean 指定是否使用提供的材质填充框的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充箱子的材料。
   * @memberof BoxGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否为框添加轮廓的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的属性。
   * <p>
   * 注意：在 Windows 平台上的所有主要浏览器上，都将忽略此属性。有关详细信息，请参阅 (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 enum 属性，指定框是否
   * 从光源投射或接收阴影。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定在距摄像机多远处显示此框的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制实例。
 *
 * @param {BoxGraphics} [result] 要在其上存储结果的对象。
 * @returns {BoxGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {BoxGraphics} source 要合并到此对象中的对象。
 */
BoxGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.dimensions = defaultValue(this.dimensions, source.dimensions);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default BoxGraphics;
