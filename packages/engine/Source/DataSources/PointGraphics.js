import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PointGraphics.ConstructorOptions
 *
 * PointGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定点可见性的布尔属性。
 * @property {Property | number} [pixelSize=1] 指定大小（像素）的数值属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对参照的属性。
 * @property {Property | Color} [color=Color.WHITE] 指定点的 {@link Color} 的属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=0] 指定轮廓宽度（像素）的数值属性。
 * @property {Property | NearFarScalar} [scaleByDistance] 用于根据距离缩放点的 {@link NearFarScalar} 属性。
 * @property {Property | NearFarScalar} [translucencyByDistance] 用于根据与相机距离设置透明度的 {@link NearFarScalar} 属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定点在距离相机多远时显示的属性。
 * @property {Property | number} [disableDepthTestDistance] 指定距离相机多远时禁用深度测试的属性。
 * @property {Property | SplitDirection} [splitDirection] 指定应用于此点的 {@link SplitDirection} 分割的属性。
 */

/**
 * 描述位于包含 {@link Entity} 位置处的图形点。
 *
 * @alias PointGraphics
 * @constructor
 *
 * @param {PointGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */
function PointGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._pixelSize = undefined;
  this._pixelSizeSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;
  this._splitDirection = undefined;
  this._splitDirectionSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(PointGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PointGraphics.prototype
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
   * 获取或设置指定点可见性的布尔属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定大小（像素）的数值属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default 1
   */
  pixelSize: createPropertyDescriptor("pixelSize"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定点的 {@link Color} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度（像素）的数值属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置用于根据距离缩放点的 {@link NearFarScalar} 属性。
   * 如果未定义，则使用恒定大小。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置根据与相机距离指定点透明度的 {@link NearFarScalar} 属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界内时，
   * 点的透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 在这些范围之外，点的透明度保持钳位到最近的边界。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置指定点在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置距离相机多远时禁用深度测试，例如防止与地形裁剪。
   * 设置为零时始终应用深度测试。设置为Number.POSITIVE_INFINITY时从不应用深度测试。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),

  /**
   * 获取或设置指定此点 {@link SplitDirection} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default SplitDirection.NONE
   */
  splitDirection: createPropertyDescriptor("splitDirection"),
});

/**
 * 复制此实例。
 *
 * @param {PointGraphics} [result] 存储结果的对象。
 * @returns {PointGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
PointGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PointGraphics(this);
  }
  result.show = this.show;
  result.pixelSize = this.pixelSize;
  result.heightReference = this.heightReference;
  result.color = this.color;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.scaleByDistance = this.scaleByDistance;
  result.translucencyByDistance = this._translucencyByDistance;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.disableDepthTestDistance = this.disableDepthTestDistance;
  result.splitDirection = this.splitDirection;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {PointGraphics} source 要合并到此对象中的对象。
 */
PointGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.pixelSize = this.pixelSize ?? source.pixelSize;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.color = this.color ?? source.color;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.scaleByDistance = this.scaleByDistance ?? source.scaleByDistance;
  this.translucencyByDistance =
    this._translucencyByDistance ?? source.translucencyByDistance;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.disableDepthTestDistance =
    this.disableDepthTestDistance ?? source.disableDepthTestDistance;

  this.splitDirection = this.splitDirection ?? source.splitDirection;
};
export default PointGraphics;
