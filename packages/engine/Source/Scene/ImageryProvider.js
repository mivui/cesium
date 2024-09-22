import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Resource from "../Core/Resource.js";

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|ImageBitmap} ImageryTypes
 *
 * {@link ImageryProvider} 方法返回图像的格式可能会
 * 因提供商、配置或服务器设置而异。 最常见的是
 * <code>HTMLImageElement</code>、<code>HTMLCanvasElement</code> 或支持
 * 浏览器，<code>ImageBitmap</code>。
 *
 * 有关每个 ImageryProvider 类如何返回图像的更多信息，请参阅每个 ImageryProvider 类的文档。
 */

/**
 * 提供要在椭球体表面显示的图像。 此类型描述
 * 接口，并且不打算直接实例化。
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
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers.html|Cesium Sandcastle Imagery Layers Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers%20Manipulation.html|Cesium Sandcastle Imagery Manipulation Demo}
 */
function ImageryProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(ImageryProvider.prototype, {
  /**
   * 获取实例提供的图像的矩形（以弧度为单位）。
   * @memberof ImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个图块的宽度（以像素为单位）。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个图块的高度（以像素为单位）。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可请求的最大详细级别。
   * @memberof ImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可请求的最低详细级别。 一般
   * 仅当图像的矩形较小时，才应使用最低级别
   * 足以使最低级别的图块数量很少。 图像
   * 提供者在最低级别上拥有多个图块将导致
   * 渲染问题。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供程序使用的切片方案。
   * @memberof ImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
   * @memberof ImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof ImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
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
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
   * @memberof ImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
ImageryProvider.prototype.getTileCredits = function (x, y, level) {
  DeveloperError.throwInstantiationError();
};

/**
 * 请求给定磁贴的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 返回映像的 Promise，该 Promise 将在映像可用时解析，或者
 * undefined 如果对服务器的活动请求过多，则应稍后重试该请求。
 */
ImageryProvider.prototype.requestImage = function (x, y, level, request) {
  DeveloperError.throwInstantiationError();
};

/**
 * 异步确定哪些要素（如果有）位于给定的经度和纬度
 * 一个图块。
 * 此函数是可选的，因此它可能并非存在于所有 ImageryProvider 中。
 *
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 选取特征的经度。
 * @param {number} latitude 选取特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 对所选特征的 Promise，当异步
 * 拣选完成。 解析的值是 {@link ImageryLayerFeatureInfo} 的数组
 * 实例。 如果在给定位置未找到要素，则数组可能为空。
 * 如果不支持拣选，也可能为 undefined。
 *
 */
ImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  DeveloperError.throwInstantiationError();
};

const ktx2Regex = /\.ktx2$/i;

/**
 * 从给定 URL 加载图像。 如果 URL 引用的服务器已经具有
 * 待处理的请求过多，此函数将返回 undefined，表示
 * 稍后应重试该请求。
 *
 * @param {ImageryProvider} imageryProvider URL 的图像提供程序。
 * @param {Resource|string} url 图像的 URL。
 * @returns {Promise<ImageryTypes|CompressedTextureBuffer>|undefined} 图像的 Promise，当图像可用时将解析，或者
 * undefined 如果对服务器的活动请求过多，则应稍后重试该请求。
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
