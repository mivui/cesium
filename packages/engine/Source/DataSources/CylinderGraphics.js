import defaultValue from "../Core/defaultValue.js";
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
 * @property {Property | number} [length] 指定圆柱体长度的数字属性。
 * @property {Property | number} [topRadius] 一个数字属性，用于指定圆柱体顶部的半径。
 * @property {Property | number} [bottomRadius] 一个数字属性，用于指定圆柱体底部的半径。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 一个属性，用于指定从实体位置开始的高度相对于什么。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否使用提供的材质填充圆柱体。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充圆柱体的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对圆柱体进行轮廓划分。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property | number} [numberOfVerticalLines=16] 一个数字属性，指定要沿轮廓的周长绘制的垂直线数。
 * @property {Property | number} [slices=128] 圆柱体周边的边数。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定圆柱体是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此圆柱体。
 */

/**
 * 描述由长度、顶部半径和底部半径定义的圆柱体、截断圆锥体或圆锥体。
 * 中心位置和方向由包含的 {@link Entity} 确定。
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(CylinderGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定圆柱体可见性的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置numeric 指定圆柱体长度的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  length: createPropertyDescriptor("length"),

  /**
   * 获取或设置numeric 指定圆柱体顶部半径的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  topRadius: createPropertyDescriptor("topRadius"),

  /**
   * 获取或设置numeric 指定圆柱体底部半径的属性。
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
   * 获取或设置boolean 属性，指定是否使用提供的材质填充圆柱体。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充圆柱体的材料的属性。
   * @memberof CylinderGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置boolean 指定是否对圆柱体进行轮廓划分的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置Property 指定轮廓的 {@link Color} 。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。了解详情, see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定要沿轮廓周长绘制的垂直线数的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置指定圆柱体周长周围的边数的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  slices: createPropertyDescriptor("slices"),

  /**
   * 获取或设置枚举 Property 指定圆柱体是否
   * 从光源投射或接收阴影。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定在距摄像机多远处显示此圆柱体的属性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),
});

/**
 * 复制实例。
 *
 * @param {CylinderGraphics} [result] 要在其上存储结果的对象。
 * @returns {CylinderGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {CylinderGraphics} source 要合并到此对象中的对象。
 */
CylinderGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.length = defaultValue(this.length, source.length);
  this.topRadius = defaultValue(this.topRadius, source.topRadius);
  this.bottomRadius = defaultValue(this.bottomRadius, source.bottomRadius);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.numberOfVerticalLines = defaultValue(
    this.numberOfVerticalLines,
    source.numberOfVerticalLines
  );
  this.slices = defaultValue(this.slices, source.slices);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
};
export default CylinderGraphics;
