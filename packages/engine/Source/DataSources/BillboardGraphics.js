import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} BillboardGraphics.ConstructorOptions
 *
 * BillboardGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定广告牌可见性的布尔属性。
 * @property {Property | string | HTMLImageElement | HTMLCanvasElement} [image] 指定用于广告牌的图像、URI 或 Canvas 的属性。
 * @property {Property | number} [scale=1.0] 指定应用于图像尺寸的缩放的数值属性。
 * @property {Property | Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定像素偏移的 {@link Cartesian2} 属性。
 * @property {Property | Cartesian3} [eyeOffset=Cartesian3.ZERO] 指定视点偏移的 {@link Cartesian3} 属性。
 * @property {Property | HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 指定 {@link HorizontalOrigin} 的属性。
 * @property {Property | VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 指定 {@link VerticalOrigin} 的属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的属性。
 * @property {Property | Color} [color=Color.WHITE] 指定图像色调 {@link Color} 的属性。
 * @property {Property | number} [rotation=0] 指定绕 alignedAxis 旋转的数值属性。
 * @property {Property | Cartesian3} [alignedAxis=Cartesian3.ZERO] 指定旋转轴单位向量的 {@link Cartesian3} 属性。
 * @property {Property | boolean} [sizeInMeters] 指定此广告牌尺寸是否以米为单位的布尔属性。
 * @property {Property | number} [width] 指定广告牌宽度（像素）的数值属性，覆盖原生尺寸。
 * @property {Property | number} [height] 指定广告牌高度（像素）的数值属性，覆盖原生尺寸。
 * @property {Property | NearFarScalar} [scaleByDistance] 用于根据距相机距离缩放点的 {@link NearFarScalar} 属性。
 * @property {Property | NearFarScalar} [translucencyByDistance] 用于根据距相机距离设置透明度的 {@link NearFarScalar} 属性。
 * @property {Property | NearFarScalar} [pixelOffsetScaleByDistance] 用于根据距相机距离设置像素偏移的 {@link NearFarScalar} 属性。
 * @property {Property | BoundingRectangle} [imageSubRegion] 指定 {@link BoundingRectangle} 的属性，用于定义图像的子区域而非整个图像，从左下角以像素为单位测量。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定在距相机多远处显示此广告牌的属性。
 * @property {Property | number} [disableDepthTestDistance] 指定在距相机多远处禁用深度测试的属性。
 * @property {Property | SplitDirection} [splitDirection] 指定广告牌 {@link SplitDirection} 的属性。
 */

/**
 * 描述位于包含 {@link Entity} 位置处的二维图标。
 * <p>
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 示例广告牌
 * </div>
 * </p>
 *
 * @alias BillboardGraphics
 * @constructor
 *
 * @param {BillboardGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=billboards|Cesium Sandcastle Billboard Demo}
 */
function BillboardGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._image = undefined;
  this._imageSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
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
  this._color = undefined;
  this._colorSubscription = undefined;
  this._rotation = undefined;
  this._rotationSubscription = undefined;
  this._alignedAxis = undefined;
  this._alignedAxisSubscription = undefined;
  this._sizeInMeters = undefined;
  this._sizeInMetersSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._pixelOffsetScaleByDistance = undefined;
  this._pixelOffsetScaleByDistanceSubscription = undefined;
  this._imageSubRegion = undefined;
  this._imageSubRegionSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;
  this._splitDirection = undefined;
  this._splitDirectionSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(BillboardGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时触发的事件。
   * @memberof BillboardGraphics.prototype
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
   * 获取或设置指定广告牌可见性的布尔属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定用于广告牌的图像、URI 或 Canvas 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  image: createPropertyDescriptor("image"),

  /**
   * 获取或设置指定应用于图像的统一缩放的数值属性。
   * 大于 <code>1.0</code> 的缩放会放大广告牌，而小于 <code>1.0</code> 的缩放会缩小它。
   * <p>
   * <div align='center'>
   * <img src='Images/Billboard.setScale.png' width='400' height='300' /><br/>
   * 从上图中从左到右，缩放分别为 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置指定广告牌在屏幕空间中从此广告牌原点偏移的 {@link Cartesian2} 属性。
   * 这通常用于将多个广告牌和标签对齐在同一位置，例如图像和文本。屏幕空间原点为画布的左上角；
   * <code>x</code> 从左到右增大，<code>y</code> 从上到下增大。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>b.pixeloffset = new Cartesian2(50, 25);</code><br/><img src='Images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 广告牌的起源由黄点指示。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian2.ZERO
   */
  pixelOffset: createPropertyDescriptor("pixelOffset"),

  /**
   * 获取或设置指定广告牌在眼坐标中偏移的 {@link Cartesian3} 属性。
   * 眼坐标系是一个左手坐标系，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，<code>z</code> 指向屏幕内。
   * <p>
   * 眼偏移通常用于将多个广告牌或对象排列在同一位置，例如，将广告牌放置在其对应的 3D 模型上方。
   * </p>
   * 如下所示，广告牌位于地球中心，但眼偏移使其始终出现在地球上方，而不受观察者或地球方向的影响。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>b.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code>
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  eyeOffset: createPropertyDescriptor("eyeOffset"),

  /**
   * 获取或设置指定 {@link HorizontalOrigin} 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default HorizontalOrigin.CENTER
   */
  horizontalOrigin: createPropertyDescriptor("horizontalOrigin"),

  /**
   * 获取或设置指定 {@link VerticalOrigin} 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default VerticalOrigin.CENTER
   */
  verticalOrigin: createPropertyDescriptor("verticalOrigin"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定与 <code>image</code> 相乘的 {@link Color} 的属性。
   * 这有两个常见用途。首先，许多不同的广告牌可以使用相同的白色纹理，每个广告牌具有不同的颜色，以创建彩色广告牌。
   * 其次，颜色的 alpha 分量可以使广告牌半透明，如下所示。Alpha 为 <code>0.0</code> 使广告牌透明，
   * <code>1.0</code> 使广告牌不透明。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setColor.Alpha255.png' width='250' height='188' /></td>
   * <td align='center'><code>alpha : 0.5</code><br/><img src='Images/Billboard.setColor.Alpha127.png' width='250' height='188' /></td>
   * </tr></table>
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定图像从 <code>alignedAxis</code> 逆时针旋转的数值属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置指定固定帧中旋转轴单位向量的 {@link Cartesian3} 属性。
   * 当设置为 Cartesian3.ZERO 时，旋转来自屏幕顶部。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  alignedAxis: createPropertyDescriptor("alignedAxis"),

  /**
   * 获取或设置指定此广告牌尺寸是否以米为单位测量的布尔属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  sizeInMeters: createPropertyDescriptor("sizeInMeters"),

  /**
   * 获取或设置指定广告牌宽度（像素）的数值属性。
   * 未定义时，使用原生宽度。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置指定广告牌高度（像素）的数值属性。
   * 未定义时，使用原生高度。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置指定广告牌根据距相机距离的缩放的 {@link NearFarScalar} 属性。
   * 当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限范围内时，
   * 广告牌的缩放将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，广告牌的缩放将保持在最近的边界。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置指定广告牌根据距相机距离的透明度的 {@link NearFarScalar} 属性。
   * 当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限范围内时，
   * 广告牌的透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，广告牌的透明度将保持在最近的边界。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置指定广告牌根据距相机距离的像素偏移的 {@link NearFarScalar} 属性。
   * 当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限范围内时，
   * 广告牌的像素偏移将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，广告牌的像素偏移将保持在最近的边界。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  pixelOffsetScaleByDistance: createPropertyDescriptor(
    "pixelOffsetScaleByDistance",
  ),

  /**
   * 获取或设置指定 {@link BoundingRectangle} 的属性，该属性定义用于广告牌的 <code>image</code> 子区域，
   * 而非整个图像，从左下角以像素为单位测量。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  imageSubRegion: createPropertyDescriptor("imageSubRegion"),

  /**
   * 获取或设置指定在距相机多远处显示此广告牌的 {@link DistanceDisplayCondition} 属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置禁用深度测试的距相机距离，例如，防止与地形裁剪。
   * 设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),

  /**
   * 获取或设置指定此广告牌 {@link SplitDirection} 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default SplitDirection.NONE
   */
  splitDirection: createPropertyDescriptor("splitDirection"),
});

/**
 * 复制此实例。
 *
 * @param {BillboardGraphics} [result] 存储结果的对象。
 * @returns {BillboardGraphics} 修改后的结果参数，如果未提供则为新实例。
 */
BillboardGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new BillboardGraphics(this);
  }
  result.show = this._show;
  result.image = this._image;
  result.scale = this._scale;
  result.pixelOffset = this._pixelOffset;
  result.eyeOffset = this._eyeOffset;
  result.horizontalOrigin = this._horizontalOrigin;
  result.verticalOrigin = this._verticalOrigin;
  result.heightReference = this._heightReference;
  result.color = this._color;
  result.rotation = this._rotation;
  result.alignedAxis = this._alignedAxis;
  result.sizeInMeters = this._sizeInMeters;
  result.width = this._width;
  result.height = this._height;
  result.scaleByDistance = this._scaleByDistance;
  result.translucencyByDistance = this._translucencyByDistance;
  result.pixelOffsetScaleByDistance = this._pixelOffsetScaleByDistance;
  result.imageSubRegion = this._imageSubRegion;
  result.distanceDisplayCondition = this._distanceDisplayCondition;
  result.disableDepthTestDistance = this._disableDepthTestDistance;
  result.splitDirection = this._splitDirection;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {BillboardGraphics} source 要合并到此对象中的对象。
 */
BillboardGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this._show ?? source.show;
  this.image = this._image ?? source.image;
  this.scale = this._scale ?? source.scale;
  this.pixelOffset = this._pixelOffset ?? source.pixelOffset;
  this.eyeOffset = this._eyeOffset ?? source.eyeOffset;
  this.horizontalOrigin = this._horizontalOrigin ?? source.horizontalOrigin;
  this.verticalOrigin = this._verticalOrigin ?? source.verticalOrigin;
  this.heightReference = this._heightReference ?? source.heightReference;
  this.color = this._color ?? source.color;
  this.rotation = this._rotation ?? source.rotation;
  this.alignedAxis = this._alignedAxis ?? source.alignedAxis;
  this.sizeInMeters = this._sizeInMeters ?? source.sizeInMeters;
  this.width = this._width ?? source.width;
  this.height = this._height ?? source.height;
  this.scaleByDistance = this._scaleByDistance ?? source.scaleByDistance;
  this.translucencyByDistance =
    this._translucencyByDistance ?? source.translucencyByDistance;
  this.pixelOffsetScaleByDistance =
    this._pixelOffsetScaleByDistance ?? source.pixelOffsetScaleByDistance;
  this.imageSubRegion = this._imageSubRegion ?? source.imageSubRegion;
  this.distanceDisplayCondition =
    this._distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.disableDepthTestDistance =
    this._disableDepthTestDistance ?? source.disableDepthTestDistance;
  this.splitDirection = this.splitDirection ?? source.splitDirection;
};
export default BillboardGraphics;
