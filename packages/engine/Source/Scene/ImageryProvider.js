import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Resource from "../Core/Resource.js";

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|ImageBitmap|OffscreenCanvas} ImageryTypes
 *
 * {@link ImageryProvider} 方法返回图像时的格式可能
 * 因提供程序、配置或服务器设置而异。最常见的是
 * <code>HTMLImageElement</code>、<code>HTMLCanvasElement</code>，或在支持的
 * 浏览器上返回 <code>ImageBitmap</code>。
 *
 * 有关各 ImageryProvider 类如何返回图像的更多信息，请参阅其文档。
 */

/**
 * 提供要在椭球体表面显示的影像。此类型描述了一个
 * 接口，不打算直接实例化。
 *
 * @alias ImageryProvider
 * @constructor
 * @abstract
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see OpenStreetMapImageryProvider
 * @see TileMapServiceImageryProvider
 * @see GoogleEarthEnterpriseImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see GridImageryProvider
 * @see IonImageryProvider
 * @see MapboxImageryProvider
 * @see MapboxStyleImageryProvider
 * @see SingleTileImageryProvider
 * @see TileCoordinatesImageryProvider
 * @see UrlTemplateImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=imagery-layers|Cesium Sandcastle 影像图层演示}
 * @demo {@link https://sandcastle.cesium.com/index.html?id=imagery-layers-manipulation|Cesium Sandcastle 影像操作演示}
 */
function ImageryProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(ImageryProvider.prototype, {
  /**
   * 获取实例提供的影像范围（以弧度为单位）。
   * @memberof ImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可请求的最大细节级别。
   * @memberof ImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可请求的最小细节级别。通常，
   * 最小级别应仅在影像范围足够小，使得最小级别的瓦片数量较少时使用。
   * 在最小级别有过多瓦片的影像提供程序将导致渲染问题。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供程序使用的瓦片方案。
   * @memberof ImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果该函数
   * 返回 undefined，则不会过滤任何瓦片。
   * @memberof ImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取当影像提供程序遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会接收到 {@link TileProviderError} 的实例。
   * @memberof ImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取当此影像提供程序处于活动状态时要显示的版权信息。通常用于注明
   * 影像的来源。
   * @memberof ImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof ImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示此影像提供程序提供的图像
   * 是否包含 Alpha 通道。如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。如果此属性为 true，则任何没有 Alpha 通道的图像将被视为
   * 其 Alpha 值在所有地方都为 1.0。当此属性为 false 时，内存使用量
   * 和纹理上传时间会减少。
   * @memberof ImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取当显示给定瓦片时要显示的版权信息。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要显示的版权信息。
 */
ImageryProvider.prototype.getTileCredits = function (x, y, level) {
  DeveloperError.throwInstantiationError();
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 返回图像的承诺，当图像可用时解析，或者
 *          如果服务器有太多活动请求而返回 undefined，则应稍后重试请求。
 */
ImageryProvider.prototype.requestImage = function (x, y, level, request) {
  DeveloperError.throwInstantiationError();
};

/**
 * 异步确定瓦片内给定经度和纬度位置存在哪些要素（如果有）。
 * 此函数是可选的，因此并非所有 ImageryProvider 上都存在。
 *
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude  拾取要素的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 拾取要素的承诺，当异步
 *                   拾取完成时解析。解析值是一个 {@link ImageryLayerFeatureInfo}
 *                   实例数组。如果在给定位置未找到要素，数组可能为空。
 *                   如果不支持拾取，也可能返回 undefined。
 *
 */
ImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  DeveloperError.throwInstantiationError();
};

const ktx2Regex = /\.ktx2$/i;

/**
 * 从给定的 URL 加载图像。如果 URL 引用的服务器已经
 * 有太多待处理请求，此函数将返回 undefined，表示
 * 应稍后重试请求。
 *
 * @param {ImageryProvider} imageryProvider 该 URL 的影像提供程序。
 * @param {Resource|string} url 图像的 URL。
 * @returns {Promise<ImageryTypes|CompressedTextureBuffer>|undefined} 图像的承诺，当图像可用时解析，或者
 *          如果服务器有太多活动请求而返回 undefined，则应稍后重试请求。
 */
ImageryProvider.loadImage = function (imageryProvider, url) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);

  if (ktx2Regex.test(resource.url)) {
    // Resolves with `CompressedTextureBuffer`
    return loadKTX2(resource);
  } else if (
    defined(imageryProvider) &&
    defined(imageryProvider.tileDiscardPolicy)
  ) {
    // Resolves with `HTMLImageElement` or `ImageBitmap`
    return resource.fetchImage({
      preferBlob: true,
      preferImageBitmap: true,
      flipY: true,
    });
  }

  return resource.fetchImage({
    preferImageBitmap: true,
    flipY: true,
  });
};
export default ImageryProvider;
