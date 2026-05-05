import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} LabelGraphics.ConstructorOptions
 *
 * LabelGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定标签可见性的布尔属性。
 * @property {Property | string} [text] 指定文本的属性。支持显式换行符'\n'。
 * @property {Property | string} [font='30px sans-serif'] 指定CSS字体的属性。
 * @property {Property | LabelStyle} [style=LabelStyle.FILL] 指定 {@link LabelStyle} 的属性。
 * @property {Property | number} [scale=1.0] 指定应用于文本的比例的数值属性。
 * @property {Property | boolean} [showBackground=false] 指定标签背景可见性的布尔属性。
 * @property {Property | Color} [backgroundColor=new Color(0.165, 0.165, 0.165, 0.8)] 指定背景 {@link Color} 的属性。
 * @property {Property | Cartesian2} [backgroundPadding=new Cartesian2(7, 5)] 指定水平和垂直背景填充（像素）的 {@link Cartesian2} 属性。
 * @property {Property | Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定像素偏移的 {@link Cartesian2} 属性。
 * @property {Property | Cartesian3} [eyeOffset=Cartesian3.ZERO] 指定眼偏移的 {@link Cartesian3} 属性。
 * @property {Property | HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 指定 {@link HorizontalOrigin} 的属性。
 * @property {Property | VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 指定 {@link VerticalOrigin} 的属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对参照的属性。
 * @property {Property | Color} [fillColor=Color.WHITE] 指定填充 {@link Color} 的属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数值属性。
 * @property {Property | NearFarScalar} [translucencyByDistance] 用于根据与相机距离设置透明度的 {@link NearFarScalar} 属性。
 * @property {Property | NearFarScalar} [pixelOffsetScaleByDistance] 用于根据与相机距离设置像素偏移的 {@link NearFarScalar} 属性。
 * @property {Property | NearFarScalar} [scaleByDistance] 用于根据与相机距离设置缩放的 {@link NearFarScalar} 属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定标签在距离相机多远时显示的属性。
 * @property {Property | number} [disableDepthTestDistance] 指定距离相机多远时禁用深度测试的属性。
 */

/**
 * 描述位于包含 {@link Entity} 位置的二维标签。
 * <p>
 * <div align='center'>
 * <img src='Images/Label.png' width='400' height='300' /><br />
 * 标签示例
 * </div>
 * </p>
 *
 * @alias LabelGraphics
 * @constructor
 *
 * @param {LabelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=labels|Cesium Sandcastle 标签演示}
 */
function LabelGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._text = undefined;
  this._textSubscription = undefined;
  this._font = undefined;
  this._fontSubscription = undefined;
  this._style = undefined;
  this._styleSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
  this._showBackground = undefined;
  this._showBackgroundSubscription = undefined;
  this._backgroundColor = undefined;
  this._backgroundColorSubscription = undefined;
  this._backgroundPadding = undefined;
  this._backgroundPaddingSubscription = undefined;
  this._pixelOffset = undefined;
  this._pixelOffsetSubscription = undefined;
  this._eyeOffset = undefined;
  this._eyeOffsetSubscription = undefined;
  this._horizontalOrigin = undefined;
  this._horizontalOriginSubscription = undefined;
  this._verticalOrigin = undefined;
  this._verticalOriginSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._fillColor = undefined;
  this._fillColorSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._pixelOffsetScaleByDistance = undefined;
  this._pixelOffsetScaleByDistanceSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(LabelGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof LabelGraphics.prototype
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
   * 获取或设置指定标签可见性的布尔属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定标签文本的字符串属性。
   * 支持显式换行符'\n'。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  text: createPropertyDescriptor("text"),

  /**
   * 获取或设置指定CSS语法字体的字符串属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font|MDN上的CSS字体}
   */
  font: createPropertyDescriptor("font"),

  /**
   * 获取或设置指定 {@link LabelStyle} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  style: createPropertyDescriptor("style"),

  /**
   * 获取或设置指定应用于图像的均匀缩放的数值属性。
   * 大于 <code>1.0</code> 的缩放会放大标签，小于 <code>1.0</code> 的缩放会缩小标签。
   * <p>
   * <div align='center'>
   * <img src='Images/Label.setScale.png' width='400' height='300' /><br/>
   * 上图中从左到右的缩放分别为 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * </p>
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置指定标签背景可见性的布尔属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  showBackground: createPropertyDescriptor("showBackground"),

  /**
   * 获取或设置指定背景 {@link Color} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default new Color(0.165, 0.165, 0.165, 0.8)
   */
  backgroundColor: createPropertyDescriptor("backgroundColor"),

  /**
   * 获取或设置指定标签水平和垂直背景填充（像素）的 {@link Cartesian2} 属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(7, 5)
   */
  backgroundPadding: createPropertyDescriptor("backgroundPadding"),

  /**
   * 获取或设置指定标签在屏幕空间中相对于标签原点的像素偏移的 {@link Cartesian2} 属性。
   * 这通常用于对齐多个标签和同一位置的标签，例如图像和文本。屏幕空间原点是画布的左上角；
   * <code>x</code> 从左向右增加，<code>y</code> 从上向下增加。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>默认</code><br/><img src='Images/Label.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>l.pixeloffset = new Cartesian2(25, 75);</code><br/><img src='Images/Label.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 标签的原点由黄点指示。
   * </div>
   * </p>
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian2.ZERO
   */
  pixelOffset: createPropertyDescriptor("pixelOffset"),

  /**
   * 获取或设置指定标签在眼坐标中偏移的 {@link Cartesian3} 属性。
   * 眼坐标是左手坐标系，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，<code>z</code> 指向屏幕内。
   * <p>
   * 眼偏移通常用于在同一位置排列多个标签或对象，例如将标签排列在其对应的3D模型上方。
   * </p>
   * 下面，标签位于地球中心，但眼偏移使其始终显示在地球顶部，无论观察者或地球的朝向如何。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>l.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code><br /><br />
   * </div>
   * </p>
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  eyeOffset: createPropertyDescriptor("eyeOffset"),

  /**
   * 获取或设置指定 {@link HorizontalOrigin} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  horizontalOrigin: createPropertyDescriptor("horizontalOrigin"),

  /**
   * 获取或设置指定 {@link VerticalOrigin} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  verticalOrigin: createPropertyDescriptor("verticalOrigin"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定填充 {@link Color} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  fillColor: createPropertyDescriptor("fillColor"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置根据与相机距离指定标签透明度的 {@link NearFarScalar} 属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界内时，
   * 标签的透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 在这些范围之外，标签的透明度保持钳位到最近的边界。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置根据与相机距离指定标签像素偏移的 {@link NearFarScalar} 属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界内时，
   * 标签的像素偏移将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 在这些范围之外，标签的像素偏移保持钳位到最近的边界。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  pixelOffsetScaleByDistance: createPropertyDescriptor(
    "pixelOffsetScaleByDistance",
  ),

  /**
   * 获取或设置基于标签与相机距离的远近缩放属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界内时，
   * 标签的缩放将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 在这些范围之外，标签的缩放保持钳位到最近的边界。如果未定义，scaleByDistance将被禁用。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置指定标签在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置距离相机多远时禁用深度测试，例如防止与地形裁剪。
   * 设置为零时始终应用深度测试。设置为Number.POSITIVE_INFINITY时从不应用深度测试。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),
});

/**
 * 复制此实例。
 *
 * @param {LabelGraphics} [result] 存储结果的对象。
 * @returns {LabelGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
LabelGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new LabelGraphics(this);
  }
  result.show = this.show;
  result.text = this.text;
  result.font = this.font;
  result.style = this.style;
  result.scale = this.scale;
  result.showBackground = this.showBackground;
  result.backgroundColor = this.backgroundColor;
  result.backgroundPadding = this.backgroundPadding;
  result.pixelOffset = this.pixelOffset;
  result.eyeOffset = this.eyeOffset;
  result.horizontalOrigin = this.horizontalOrigin;
  result.verticalOrigin = this.verticalOrigin;
  result.heightReference = this.heightReference;
  result.fillColor = this.fillColor;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.translucencyByDistance = this.translucencyByDistance;
  result.pixelOffsetScaleByDistance = this.pixelOffsetScaleByDistance;
  result.scaleByDistance = this.scaleByDistance;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.disableDepthTestDistance = this.disableDepthTestDistance;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {LabelGraphics} source 要合并到此对象中的对象。
 */
LabelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.text = this.text ?? source.text;
  this.font = this.font ?? source.font;
  this.style = this.style ?? source.style;
  this.scale = this.scale ?? source.scale;
  this.showBackground = this.showBackground ?? source.showBackground;
  this.backgroundColor = this.backgroundColor ?? source.backgroundColor;
  this.backgroundPadding = this.backgroundPadding ?? source.backgroundPadding;
  this.pixelOffset = this.pixelOffset ?? source.pixelOffset;
  this.eyeOffset = this.eyeOffset ?? source.eyeOffset;
  this.horizontalOrigin = this.horizontalOrigin ?? source.horizontalOrigin;
  this.verticalOrigin = this.verticalOrigin ?? source.verticalOrigin;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.fillColor = this.fillColor ?? source.fillColor;
  this.outlineColor = this.outlineColor ?? source.outlineColor;
  this.outlineWidth = this.outlineWidth ?? source.outlineWidth;
  this.translucencyByDistance =
    this.translucencyByDistance ?? source.translucencyByDistance;
  this.pixelOffsetScaleByDistance =
    this.pixelOffsetScaleByDistance ?? source.pixelOffsetScaleByDistance;
  this.scaleByDistance = this.scaleByDistance ?? source.scaleByDistance;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.disableDepthTestDistance =
    this.disableDepthTestDistance ?? source.disableDepthTestDistance;
};
export default LabelGraphics;
