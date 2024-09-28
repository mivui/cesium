import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PlaneGraphics.ConstructorOptions
 *
 * PlaneGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定飞机的可见性。
 * @property {Property |Plane} [plane] 一个 {@link Plane} 属性，用于指定平面的法线和距离。
 * @property {Property |Cartesian2} [dimensions] 一个 {@link Cartesian2} 属性，用于指定平面的宽度和高度。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定是否用提供的材质填充平面。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于填充平面的材质的属性。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定是否对平面进行轮廓划分。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定平面是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此平面。
 */

/**
 * 描述一架飞机。中心位置和方向由包含的 {@link Entity} 确定。
 *
 * @alias PlaneGraphics
 * @constructor
 *
 * @param {PlaneGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Plane.html|Cesium Sandcastle Plane Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PlaneGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定平面可见性的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置{@link Plane} 指定平面的法线和距离的属性。
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  plane: createPropertyDescriptor("plane"),

  /**
   * 获取或设置{@link Cartesian2} 指定平面宽度和高度的属性。
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  dimensions: createPropertyDescriptor("dimensions"),

  /**
   * 获取或设置boolean 属性，指定是否使用提供的材质填充平面。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充平面的材料。
   * @memberof PlaneGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定是否为平面添加轮廓的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 指定轮廓宽度的属性。
   * <p>
   * Note: 在 Windows 平台上的所有主要浏览器上都将忽略此属性。有关详细信息， see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定平面
   * 从光源投射或接收阴影。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此平面将在距摄像机多远处显示的属性。
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制实例。
 *
 * @param {PlaneGraphics} [result] 要在其上存储结果的对象。
 * @returns {PlaneGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {PlaneGraphics} source 要合并到此对象中的对象。
 */
PlaneGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.plane = defaultValue(this.plane, source.plane);
  this.dimensions = defaultValue(this.dimensions, source.dimensions);
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
export default PlaneGraphics;
