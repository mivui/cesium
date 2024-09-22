import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PointGraphics.ConstructorOptions
 *
 * PointGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定点的可见性。
 * @property {Property | number} [pixelSize=1] 一个数字属性，用于指定以像素为单位的大小。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property |Color} [color=Color.WHITE] 指定点的 {@link Color} 的属性。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=0] 一个数字属性，指定轮廓宽度（以像素为单位）。
 * @property {Property |NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} 用于根据距离缩放点的属性。
 * @property {Property |NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置半透明。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像头多远处显示此点。
 * @property {Property | number} [disableDepthTestDistance] 一个属性，用于指定要禁用深度测试的摄像头的距离。
 * @property {Property |SplitDirection} [splitDirection] 一个属性，指定要应用于此点的 {@link SplitDirection} 分割。
 */

/**
 * 描述位于包含 {@link Entity} 位置的图形点。
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PointGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定点可见性的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置numeric 属性，以像素为单位指定大小。
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
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric 属性，用于指定轮廓宽度（以像素为单位）。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置{@link NearFarScalar} 用于根据距离缩放点的属性。
   * 如果未定义，则使用常量大小。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，根据与摄像机的距离指定点的半透明性。
   * 点的半透明性将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 。
   * 在这些范围之外，点的半透明性仍然被限制在最近的边界上。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 属性，用于指定在距摄像机多远处显示此点。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),

  /**
   * 获取或设置与摄像机的距离，以禁用深度测试，以防止根据地形进行裁剪。
   * 当设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance"
  ),

  /**
   * 获取或设置指定此点的 {@link SplitDirection} 的属性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default SplitDirection.NONE
   */
  splitDirection: createPropertyDescriptor("splitDirection"),
});

/**
 * 复制实例。
 *
 * @param {PointGraphics} [result] 要在其上存储结果的对象。
 * @returns {PointGraphics} 修改后的结果参数 或者一个新实例（如果未提供）。
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
 * 将此对象上的每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {PointGraphics} source 要合并到此对象中的对象。
 */
PointGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.pixelSize = defaultValue(this.pixelSize, source.pixelSize);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference
  );
  this.color = defaultValue(this.color, source.color);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.scaleByDistance = defaultValue(
    this.scaleByDistance,
    source.scaleByDistance
  );
  this.translucencyByDistance = defaultValue(
    this._translucencyByDistance,
    source.translucencyByDistance
  );
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
  this.disableDepthTestDistance = defaultValue(
    this.disableDepthTestDistance,
    source.disableDepthTestDistance
  );

  this.splitDirection = defaultValue(
    this.splitDirection,
    source.splitDirection
  );
};
export default PointGraphics;
