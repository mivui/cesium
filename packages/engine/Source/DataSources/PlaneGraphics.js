import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PlaneGraphics.ConstructorOptions
 *
 * PlaneGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定平面可见性的布尔属性。
 * @property {Property | Plane} [plane] 指定平面的法线和距离的 {@link Plane} 属性。
 * @property {Property | Cartesian2} [dimensions] 指定平面宽度和高度的 {@link Cartesian2} 属性。
 * @property {Property | boolean} [fill=true] 指定平面是否用提供的材质填充的布尔属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充平面的材质的属性。
 * @property {Property | boolean} [outline=false] 指定平面是否带轮廓的布尔属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数值属性。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 指定平面是否从光源投射或接收阴影的枚举属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定平面在距离相机多远时显示的属性。
 */

/**
 * 描述一个平面。中心位置和方向由包含的 {@link Entity} 决定。
 *
 * @alias PlaneGraphics
 * @constructor
 *
 * @param {PlaneGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=plane|Cesium Sandcastle 平面演示}
 */
function PlaneGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._plane = undefined;
  this._planeSubscription = undefined;
  this._dimensions = undefined;
  this._dimensionsSubscription = undefined;
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

Object.defineProperties(PlaneGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PlaneGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置指定平面可见性的布尔属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定平面的法线和距离的 {@link Plane} 属性。
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  plane: createPropertyDescriptor("plane"),

  /**
   * 获取或设置指定平面宽度和高度的 {@link Cartesian2} 属性。
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  dimensions: createPropertyDescriptor("dimensions"),

  /**
   * 获取或设置指定平面是否用提供的材质填充的布尔属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充平面的材质。
   * @memberof PlaneGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定平面是否带轮廓的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * <p>
   * 注意：在Windows平台的所有主流浏览器上，此属性将被忽略。详情参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定平面是否从光源投射或接收阴影的枚举属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定平面在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制此实例。
 *
 * @param {PlaneGraphics} [result] 存储结果的对象。
 * @returns {PlaneGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
PlaneGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PlaneGraphics(this);
  }
  result.show = this.show;
  result.plane = this.plane;
  result.dimensions = this.dimensions;
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
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {PlaneGraphics} source 要合并到此对象中的对象。
 */
PlaneGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.plane = this.plane ?? source.plane;
  this.dimensions = this.dimensions ?? source.dimensions;
  this.fill = this.fill ?? source.fill;
  this.material = this.material ?? source.material;
  this.outline = this.outline ?? source.outline;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
};
export default PlaneGraphics;
