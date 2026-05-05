import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} WallGraphics.ConstructorOptions
 *
 * WallGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定墙体的可见性。
 * @property {Property | Cartesian3[]} [positions] 一个属性，指定定义墙体顶部的 {@link Cartesian3} 位置数组。
 * @property {Property | number[]} [minimumHeights] 一个属性，指定用于墙体底部的高度数组，替代地球表面高度。
 * @property {Property | number[]} [maximumHeights] 一个属性，指定用于墙体顶部的高度数组，替代每个位置的高度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，指定每个经纬度点之间的角距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定墙体是否使用提供的材质进行填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充墙体的材质。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定墙体是否显示轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定墙体是否投射或接收光源阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定墙体在距离相机多远时显示。
 */

/**
 * 描述一个二维墙体，定义为线带以及可选的最大和最小高度。
 * 墙体贴合地球曲率，可以沿着地表放置或在一定高度上。
 *
 * @alias WallGraphics
 * @constructor
 *
 * @param {WallGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?id=wall|Cesium Sandcastle 墙体演示}
 */
function WallGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._minimumHeights = undefined;
  this._minimumHeightsSubscription = undefined;
  this._maximumHeights = undefined;
  this._maximumHeightsSubscription = undefined;
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

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(WallGraphics.prototype, {
  /**
   * 获取当属性或子属性发生更改或修改时引发的事件。
   * @memberof WallGraphics.prototype
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
   * 获取或设置布尔属性，指定墙体的可见性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置属性，指定定义墙体顶部的 {@link Cartesian3} 位置数组。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置属性，指定用于墙体底部的高度数组，替代地球表面高度。
   * 如果已定义，该数组的长度必须与 {@link Wall#positions} 相同。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  minimumHeights: createPropertyDescriptor("minimumHeights"),

  /**
   * 获取或设置属性，指定用于墙体顶部的高度数组，替代每个位置的高度。
   * 如果已定义，该数组的长度必须与 {@link Wall#positions} 相同。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  maximumHeights: createPropertyDescriptor("maximumHeights"),

  /**
   * 获取或设置数值属性，指定墙体上各点之间的角距离。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置布尔属性，指定墙体是否使用提供的材质进行填充。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置属性，指定用于填充墙体的材质。
   * @memberof WallGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置属性，指定墙体是否显示轮廓。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置属性，指定轮廓的 {@link Color}。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓的宽度。
   * <p>
   * 注意：在 Windows 平台的所有主流浏览器上，此属性将被忽略。详情请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定墙体是否投射或接收光源阴影。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定墙体在距离相机多远时显示。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制此实例。
 *
 * @param {WallGraphics} [result] 用于存储结果的物体。
 * @returns {WallGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
WallGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new WallGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.minimumHeights = this.minimumHeights;
  result.maximumHeights = this.maximumHeights;
  result.granularity = this.granularity;
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
 * 将此对象上每个未赋值的属性设置为
 * 提供的源对象上对应属性的值。
 *
 * @param {WallGraphics} source 要合并到此对象中的对象。
 */
WallGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.positions = this.positions ?? source.positions;
  this.minimumHeights = this.minimumHeights ?? source.minimumHeights;
  this.maximumHeights = this.maximumHeights ?? source.maximumHeights;
  this.granularity = this.granularity ?? source.granularity;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
};
export default WallGraphics;
