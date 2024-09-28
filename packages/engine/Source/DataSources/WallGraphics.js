import defaultValue from "../Core/defaultValue.js";
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
 * @property {Property | boolean} [show=true] 指定墙的可见性的布尔属性。
 * @property {Property |Cartesian3[]} [positions] 一个属性，指定定义墙顶部的 {@link Cartesian3} 位置数组。
 * @property {Property | number[]} [minimumHeights] 一个属性，指定要用于墙底部而不是地球表面的高度数组。
 * @property {Property | number[]} [maximumHeights] 一个属性，指定要用于墙顶部的高度数组，而不是每个位置的高度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定每个纬度和经度点之间的角度距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定墙是否使用提供的材质填充。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充墙壁的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对墙进行轮廓勾勒。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定墙壁是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像头多远处显示此墙。
 */

/**
 * 描述定义为线带的二维墙以及可选的最大和最小高度。
 * 墙体符合地球仪的曲率，可以沿表面或海拔高度放置。
 *
 * @alias WallGraphics
 * @constructor
 *
 * @param {WallGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Wall.html|Cesium Sandcastle Wall Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(WallGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定墙的可见性的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定 {@link Cartesian3} 位置数组的属性，用于定义墙的顶部。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定要用于墙底部而不是地球表面的高度数组的属性。
   * 如果已定义，则数组的长度必须与 {@link Wall#positions} 相同。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  minimumHeights: createPropertyDescriptor("minimumHeights"),

  /**
   * 获取或设置指定要用于墙顶部的高度数组，而不是每个位置的高度的属性。
   * 如果已定义，则数组的长度必须与 {@link Wall#positions} 相同。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  maximumHeights: createPropertyDescriptor("maximumHeights"),

  /**
   * 获取或设置numeric 指定墙上点之间的角度距离的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 指定是否使用提供的材质填充墙的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充墙的材料的属性。
   * @memberof WallGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对墙进行轮廓勾勒的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 enum 属性，指定墙体是否
   * 从光源投射或接收阴影。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定在距摄像机多远处显示此墙的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制实例。
 *
 * @param {WallGraphics} [result] 要在其上存储结果的对象。
 * @returns {WallGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {WallGraphics} source 要合并到此对象中的对象。
 */
WallGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.minimumHeights = defaultValue(
    this.minimumHeights,
    source.minimumHeights,
  );
  this.maximumHeights = defaultValue(
    this.maximumHeights,
    source.maximumHeights,
  );
  this.granularity = defaultValue(this.granularity, source.granularity);
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
export default WallGraphics;
