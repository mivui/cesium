import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PolylineVolumeGraphics.ConstructorOptions
 *
 * PolylineVolumeGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定卷可见性的布尔属性。
 * @property {Property |Cartesian3[]} [positions] 一个属性，指定定义线带的 {@link Cartesian3} 位置数组。
 * @property {Property |Cartesian2[]} [shape] 一个属性，指定 {@link Cartesian2} 位置数组，用于定义要拉伸的形状。
 * @property {Property |CornerType} [cornerType=CornerType.ROUNDED] 一个 {@link CornerType} 属性，用于指定角的样式。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定每个纬度和经度点之间的角度距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否使用提供的材质填充体积。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充体积的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对体积进行轮廓显示。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定体积是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此体积。
 */

/**
 * 描述定义为线条的多段线体积和沿该线条拉伸的相应二维形状。
 * 生成的体积符合地球的曲率。
 *
 * @alias PolylineVolumeGraphics
 * @constructor
 *
 * @param {PolylineVolumeGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline%20Volume.html|Cesium Sandcastle Polyline Volume Demo}
 */
function PolylineVolumeGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._shape = undefined;
  this._shapeSubscription = undefined;
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
  this._distanceDisplayConditionSubsription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PolylineVolumeGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
   * @memberof PolylineVolumeGraphics.prototype
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
   * 获取或设置boolean 属性，用于指定卷的可见性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定定义线带的 {@link Cartesian3} 位置数组的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定 {@link Cartesian2} 位置数组的属性，这些位置定义要拉伸的形状。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  shape: createPropertyDescriptor("shape"),

  /**
   * 获取或设置{@link CornerType}指定角样式的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default CornerType.ROUNDED
   */
  cornerType: createPropertyDescriptor("cornerType"),

  /**
   * 获取或设置numeric 属性，用于指定体积上点之间的角度距离。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置boolean 属性，指定是否使用提供的材质填充体积。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充体积的材料的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否对体积进行轮廓显示的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 enum 属性，指定 volume
   * 从光源投射或接收阴影。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此体积在距摄像机多远处显示的属性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),
});

/**
 * 复制instance.
 *
 * @param {PolylineVolumeGraphics} [result] 要在其上存储结果的对象。
 * @returns {PolylineVolumeGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
 */
PolylineVolumeGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolylineVolumeGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.shape = this.shape;
  result.cornerType = this.cornerType;
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
 * @param {PolylineVolumeGraphics} source 要合并到此对象中的对象。
 */
PolylineVolumeGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.shape = defaultValue(this.shape, source.shape);
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
};
export default PolylineVolumeGraphics;
