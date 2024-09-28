import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} BillboardGraphics.ConstructorOptions
 *
 * BillboardGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，用于指定公告板的可见性。
 * @property {Property | string | HTMLCanvasElement} [image] 一个 Property，指定要用于公告板的 Image、URI 或 Canvas。
 * @property {Property | number} [scale=1.0] 一个数字属性，指定要应用于图像大小的比例。
 * @property {Property | Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定像素偏移量的 {@link Cartesian2} 属性。
 * @property {Property | Cartesian3} [eyeOffset=Cartesian3.ZERO] 指定眼偏移的 {@link Cartesian3} 属性。
 * @property {Property | HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 指定 {@link HorizontalOrigin} 的 Property。
 * @property {Property | VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 指定 {@link VerticalOrigin} 的 Property。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的 Property。
 * @property {Property | Color} [color=Color.WHITE] 指定图像的色调 {@link Color} 的属性。
 * @property {Property | number} [rotation=0] 一个数字 Property，用于指定绕 alignedAxis 的旋转。
 * @property {Property | Cartesian3} [alignedAxis=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，用于指定旋转的单位向量轴。
 * @property {Property | boolean} [sizeInMeters] 一个布尔属性，指定此公告牌的大小是否应以米为单位。
 * @property {Property | number} [width] 一个数字属性，用于指定广告牌的宽度（以像素为单位），覆盖本机大小。
 * @property {Property | number} [height] 一个数字属性，用于指定广告牌的高度（以像素为单位），覆盖本机大小。
 * @property {Property | NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离缩放点。
 * @property {Property | NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置半透明。
 * @property {Property | NearFarScalar} [pixelOffsetScaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与摄像机的距离设置 pixelOffset。
 * @property {Property | BoundingRectangle} [imageSubRegion] 一个指定 {@link BoundingRectangle} 的属性，该属性定义要用于广告牌的图像子区域，而不是整个图像，以从左下角开始的像素为单位。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，用于指定此公告牌将在距离摄像机多远处显示。
 * @property {Property | number} [disableDepthTestDistance] 一个属性，用于指定要禁用深度测试的相机的距离。
 * @property {Property | SplitDirection} [splitDirection] 指定公告牌的 {@link SplitDirection} 的 Property。
 */

/**
 * 描述位于包含 {@link Entity} 位置的二维图标。
 * <p>
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 广告牌示例
 * </div>
 * </p>
 *
 * @alias BillboardGraphics
 * @constructor
 *
 * @param {BillboardGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Billboards.html|Cesium Sandcastle Billboard Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(BillboardGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定公告板可见性的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定要用于广告牌的 Image、URI 或 Canvas 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  image: createPropertyDescriptor("image"),

  /**
   * 获取或设置numeric 指定要应用于图像的统一缩放的属性。
   * 大于 <code>1.0</code> 的比例会放大广告牌，而小于 <code>1.0</code> 的比例会缩小广告牌。
   * <p>
   * <div align='center'>
   * <img src='Images/Billboard.setScale.png' width='400' height='300' /><br/>
   * 在上图中，比例从左到右分别为 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置{@link Cartesian2} 指定广告牌在屏幕空间中的像素偏移的属性
   * 来自此广告牌的来源。 这通常用于将多个广告牌和标签对齐
   * 相同的位置，例如，图像和文本。 屏幕空间原点是
   * canvas; <code>x</code>从左到右增加，<code>y</code> 从上到下增加。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>b.pixeloffset = new Cartesian2(50, 25);</code><br/><img src='Images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 公告牌的原点由黄点表示。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian2.ZERO
   */
  pixelOffset: createPropertyDescriptor("pixelOffset"),

  /**
   * 获取或设置{@link Cartesian3} 指定广告牌在眼睛坐标中的偏移量的属性。
   * 眼睛坐标是左手坐标系，其中 <code>x</code> 指向查看者的
   * 向右，<code>Y</code> 指向上方，<code>Z</code> 指向屏幕。
   * <p>
   * 眼动偏移通常用于将多个广告牌或对象排列在同一位置，例如，将
   * 在其相应的 3D 模型上方布置广告牌。
   * </p>
   * 在下面，广告牌位于地球的中心，但眼睛偏移使其始终
   * 显示在地球顶部，无论观看者或地球的方向如何。
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
   * 获取或设置指定 {@link HorizontalOrigin}.
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default HorizontalOrigin.CENTER
   */
  horizontalOrigin: createPropertyDescriptor("horizontalOrigin"),

  /**
   * 获取或设置指定 {@link VerticalOrigin}.
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default VerticalOrigin.CENTER
   */
  verticalOrigin: createPropertyDescriptor("verticalOrigin"),

  /**
   * 获取或设置指定 {@link HeightReference}.
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定 {@link Color} 乘以 <code>image</code>.
   * 这有两个常见的用例。 首先，相同的白色纹理可能被许多不同的广告牌使用，
   * 每个都有不同的颜色，以创建彩色广告牌。其次，颜色的 alpha 分量可以是
   * 用于使公告牌半透明，如下所示。Alpha 值为 <code>0.0</code> 时，广告牌
   * 透明，<code>1.0</code> 使公告牌不透明。
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
   * 获取或设置数值的指定 图像的旋转
   * 从 <code>alignedAxis</code> 逆时针方向。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置{@link Cartesian3} 指定 单位矢量旋转轴
   * 在固定框架中。当设置为 Cartesian3.ZERO 时，从屏幕顶部开始旋转。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  alignedAxis: createPropertyDescriptor("alignedAxis"),

  /**
   * 获取或设置boolean 属性，指定此公告板的大小是否以米为单位。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  sizeInMeters: createPropertyDescriptor("sizeInMeters"),

  /**
   * 获取或设置数值的指定公告板的宽度（以像素为单位）。
   * 如果未定义，则使用本机宽度。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置数值的指定 公告牌的高度（以像素为单位）。
   * 如果未定义，则使用本机高度。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置 {@link NearFarScalar} 根据与摄像机的距离指定公告牌的比例。
   * 公告牌的比例将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 *。
   * 在这些范围之外，公告牌的刻度仍会限制在最近的边界上。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 根据与摄像机的距离指定公告牌的半透明性。
   * 公告牌的半透明性将在 {@link NearFarScalar#nearValue} 和 之间插值
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 *。
   * 在这些范围之外，公告牌的半透明性仍然被限制在最近的边界上。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 根据与摄像机的距离指定公告牌的像素偏移。
   * 公告牌的像素偏移量将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 *。
   * 超出这些范围时，公告板的像素偏移将保持限制在最近的边界上。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  pixelOffsetScaleByDistance: createPropertyDescriptor(
    "pixelOffsetScaleByDistance",
  ),

  /**
   * 获取或设置指定 {@link BoundingRectangle} 的属性，该属性定义
   * 子区域 <code>image</code>用于公告牌，而不是整个图像，
   * 以左下角的像素为单位。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  imageSubRegion: createPropertyDescriptor("imageSubRegion"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此公告板将在距摄像机多远处显示的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置与摄像机的距离，以禁用深度测试，以防止根据地形进行裁剪。
   * 当设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),

  /**
   * 获取或设置指定 {@link SplitDirection}这个广告牌。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default SplitDirection.NONE
   */
  splitDirection: createPropertyDescriptor("splitDirection"),
});

/**
 * 复制instance.
 *
 * @param {BillboardGraphics} [result] 要在其上存储结果的对象。
 * @returns {BillboardGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {BillboardGraphics} source 要合并到此对象中的对象。
 */
BillboardGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this._show, source.show);
  this.image = defaultValue(this._image, source.image);
  this.scale = defaultValue(this._scale, source.scale);
  this.pixelOffset = defaultValue(this._pixelOffset, source.pixelOffset);
  this.eyeOffset = defaultValue(this._eyeOffset, source.eyeOffset);
  this.horizontalOrigin = defaultValue(
    this._horizontalOrigin,
    source.horizontalOrigin,
  );
  this.verticalOrigin = defaultValue(
    this._verticalOrigin,
    source.verticalOrigin,
  );
  this.heightReference = defaultValue(
    this._heightReference,
    source.heightReference,
  );
  this.color = defaultValue(this._color, source.color);
  this.rotation = defaultValue(this._rotation, source.rotation);
  this.alignedAxis = defaultValue(this._alignedAxis, source.alignedAxis);
  this.sizeInMeters = defaultValue(this._sizeInMeters, source.sizeInMeters);
  this.width = defaultValue(this._width, source.width);
  this.height = defaultValue(this._height, source.height);
  this.scaleByDistance = defaultValue(
    this._scaleByDistance,
    source.scaleByDistance,
  );
  this.translucencyByDistance = defaultValue(
    this._translucencyByDistance,
    source.translucencyByDistance,
  );
  this.pixelOffsetScaleByDistance = defaultValue(
    this._pixelOffsetScaleByDistance,
    source.pixelOffsetScaleByDistance,
  );
  this.imageSubRegion = defaultValue(
    this._imageSubRegion,
    source.imageSubRegion,
  );
  this.distanceDisplayCondition = defaultValue(
    this._distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.disableDepthTestDistance = defaultValue(
    this._disableDepthTestDistance,
    source.disableDepthTestDistance,
  );
  this.splitDirection = defaultValue(
    this.splitDirection,
    source.splitDirection,
  );
};
export default BillboardGraphics;
