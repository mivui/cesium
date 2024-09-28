import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} LabelGraphics.ConstructorOptions
 *
 * LabelGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定标签可见性的布尔属性。
 * @property {Property | string} [text] 指定文本的属性。支持显式换行符 '\n'。
 * @property {Property | string} [font='30px sans-serif'] 指定 CSS 字体的属性。
 * @property {Property |LabelStyle} [style=LabelStyle.FILL] 指定 {@link LabelStyle} 的属性。
 * @property {Property | number} [scale=1.0] 一个数字属性，指定要应用于文本的比例。
 * @property {Property | boolean} [showBackground=false] 一个布尔属性，指定标签后面背景的可见性。
 * @property {Property |Color} [backgroundColor=new Color(0.165, 0.165, 0.165,0.8)] 指定背景 {@link Color} 的属性。
 * @property {Property |Cartesian2} [backgroundPadding=new Cartesian2(7,5)] 一个 {@link Cartesian2} 属性，用于指定水平和垂直背景填充（以像素为单位）。
 * @property {Property |Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定像素偏移量的 {@link Cartesian2} 属性。
 * @property {Property |Cartesian3} [eyeOffset=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，用于指定眼睛偏移。
 * @property {Property |HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 指定 {@link HorizontalOrigin} 的属性。
 * @property {Property |VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 指定 {@link VerticalOrigin} 的属性。
 * @property {Property |HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property |Color} [fillColor=Color.WHITE] 指定填充 {@link Color} 的属性。
 * @property {Property |Color} [outlineColor=Color.BLACK] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数字属性。
 * @property {Property |NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置半透明。
 * @property {Property |NearFarScalar} [pixelOffsetScaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置 pixelOffset。
 * @property {Property |NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置缩放。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距相机多远处显示此标签。
 * @property {Property | number} [disableDepthTestDistance] 一个属性，用于指定要禁用深度测试的摄像头的距离。
 */

/**
 * 描述位于包含 {@link Entity} 位置的二维标签。
 * <p>
 * <div align='center'>
 * <img src='Images/Label.png' width='400' height='300' /><br />
 * 示例标签
 * </div>
 * </p>
 *
 * @alias LabelGraphics
 * @constructor
 *
 * @param {LabelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Labels.html|Cesium Sandcastle Labels Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(LabelGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定标签可见性的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置string 属性，用于指定标签的文本。
   * 支持显式换行符 '\n'。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  text: createPropertyDescriptor("text"),

  /**
   * 获取或设置string 属性，用于指定 CSS 语法中的字体。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font|CSS font on MDN}
   */
  font: createPropertyDescriptor("font"),

  /**
   * 获取或设置指定 {@link LabelStyle} 的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  style: createPropertyDescriptor("style"),

  /**
   * 获取或设置numeric 指定要应用于图像的统一缩放的属性。
   * 大于 <code>1.0</code> 的比例会放大标签，而小于 <code>1.0</code> 的比例会缩小标签。
   * <p>
   * <div align='center'>
   * <img src='Images/Label.setScale.png' width='400' height='300' /><br/>
   * 在上图中，比例尺从左到右依次为 <code>0.5</code>, <code>1.0</code>,
   * 和 <code>2.0</code>.
   * </div>
   * </p>
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置boolean 属性，用于指定标签后面背景的可见性。
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
   * 获取或设置{@link Cartesian2} 指定标签的 horizontal 和 vertical 的属性
   * background padding in pixels.
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(7, 5)
   */
  backgroundPadding: createPropertyDescriptor("backgroundPadding"),

  /**
   * 获取或设置{@link Cartesian2}指定标签在屏幕空间中的像素偏移量的属性
   * 来自此标签的原点。 这通常用于对齐多个标签和
   * 相同的位置，例如，图像和文本。 屏幕空间原点是
   * canvas; <code>x</code>从左到右增加，以及 <code>y</code> 从上到下增加。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Label.setPixelOffset.default.png' width='250' height='188' /></td>
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
   * 获取或设置{@link Cartesian3} 指定标签在眼睛坐标中的偏移量的属性。
   * 眼睛坐标是左手坐标系，其中 <code>x</code> 指向查看者的
   * 向右，<code>Y</code> 指向上方，<code>Z</code> 指向屏幕。
   * <p>
   * 眼图偏移通常用于将多个标签或对象排列在同一位置，例如，将
   * 将标签排列在相应的 3D 模型上方。
   * </p>
   * 在下图中，标签位于地球的中心，但眼睛偏移使其始终
   * 显示在地球顶部，无论观看者或地球的方向如何。
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
   * 获取或设置numeric 指定轮廓宽度的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，根据与摄像机的距离指定标签的半透明性。
   * 标签的半透明性将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的。
   * 在这些范围之外，标签的半透明性仍然被限制在最近的边界上。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，根据与相机的距离指定标签的像素偏移量。
   * 标签的像素偏移量将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 。
   * 在这些范围之外，标签的像素偏移量将保持限制在最近的边界上。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  pixelOffsetScaleByDistance: createPropertyDescriptor(
    "pixelOffsetScaleByDistance",
  ),

  /**
   * 根据标签与相机的距离获取或设置 Label 的近距和远距缩放属性。
   * 标签的比例将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 。
   * 超出这些范围时，标签的刻度将保持限制为最近的边界。 如果未定义，则
   * scaleByDistance 将被禁用。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此标签将在距摄像机多远处显示的属性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置与摄像机的距离，以禁用深度测试，以防止根据地形进行裁剪。
   * 当设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),
});

/**
 * 复制实例。
 *
 * @param {LabelGraphics} [result] 要在其上存储结果的对象。
 * @returns {LabelGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {LabelGraphics} source 要合并到此对象中的对象。
 */
LabelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.text = defaultValue(this.text, source.text);
  this.font = defaultValue(this.font, source.font);
  this.style = defaultValue(this.style, source.style);
  this.scale = defaultValue(this.scale, source.scale);
  this.showBackground = defaultValue(
    this.showBackground,
    source.showBackground,
  );
  this.backgroundColor = defaultValue(
    this.backgroundColor,
    source.backgroundColor,
  );
  this.backgroundPadding = defaultValue(
    this.backgroundPadding,
    source.backgroundPadding,
  );
  this.pixelOffset = defaultValue(this.pixelOffset, source.pixelOffset);
  this.eyeOffset = defaultValue(this.eyeOffset, source.eyeOffset);
  this.horizontalOrigin = defaultValue(
    this.horizontalOrigin,
    source.horizontalOrigin,
  );
  this.verticalOrigin = defaultValue(
    this.verticalOrigin,
    source.verticalOrigin,
  );
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fillColor = defaultValue(this.fillColor, source.fillColor);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.translucencyByDistance = defaultValue(
    this.translucencyByDistance,
    source.translucencyByDistance,
  );
  this.pixelOffsetScaleByDistance = defaultValue(
    this.pixelOffsetScaleByDistance,
    source.pixelOffsetScaleByDistance,
  );
  this.scaleByDistance = defaultValue(
    this.scaleByDistance,
    source.scaleByDistance,
  );
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.disableDepthTestDistance = defaultValue(
    this.disableDepthTestDistance,
    source.disableDepthTestDistance,
  );
};
export default LabelGraphics;
