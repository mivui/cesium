import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import IonResource from "../Core/IonResource.js";
import RuntimeError from "../Core/RuntimeError.js";
import ArcGisMapServerImageryProvider from "./ArcGisMapServerImageryProvider.js";
import BingMapsImageryProvider from "./BingMapsImageryProvider.js";
import TileMapServiceImageryProvider from "./TileMapServiceImageryProvider.js";
import GoogleEarthEnterpriseMapsProvider from "./GoogleEarthEnterpriseMapsProvider.js";
import MapboxImageryProvider from "./MapboxImageryProvider.js";
import SingleTileImageryProvider from "./SingleTileImageryProvider.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";
import WebMapServiceImageryProvider from "./WebMapServiceImageryProvider.js";
import WebMapTileServiceImageryProvider from "./WebMapTileServiceImageryProvider.js";

// These values are the list of supported external imagery
// assets in the Cesium ion beta. They are subject to change.
const ImageryProviderAsyncMapping = {
  ARCGIS_MAPSERVER: ArcGisMapServerImageryProvider.fromUrl,
  BING: async (url, options) => {
    return BingMapsImageryProvider.fromUrl(url, options);
  },
  GOOGLE_EARTH: async (url, options) => {
    const channel = options.channel;
    delete options.channel;
    return GoogleEarthEnterpriseMapsProvider.fromUrl(url, channel, options);
  },
  MAPBOX: (url, options) => {
    return new MapboxImageryProvider({
      url: url,
      ...options,
    });
  },
  SINGLE_TILE: SingleTileImageryProvider.fromUrl,
  TMS: TileMapServiceImageryProvider.fromUrl,
  URL_TEMPLATE: (url, options) => {
    return new UrlTemplateImageryProvider({
      url: url,
      ...options,
    });
  },
  WMS: (url, options) => {
    return new WebMapServiceImageryProvider({
      url: url,
      ...options,
    });
  },
  WMTS: (url, options) => {
    return new WebMapTileServiceImageryProvider({
      url: url,
      ...options,
    });
  },
};

/**
 * @typedef {object} IonImageryProvider.ConstructorOptions
 *
 * TileMapServiceImageryProvider 构造函数的初始化选项
 *
 * @property {string} [accessToken=Ion.defaultAccessToken] 要使用的访问令牌。
 * @property {string|Resource} [server=Ion.defaultServer] Cesium ion API 服务器的资源。
 */

/**
 * <div class="notice">
 * 要构造 IonImageryProvider，请调用 {@link IonImageryProvider.fromAssetId}. 不要直接调用构造函数。
 * </div>
 *
 * 使用 Cesium ion REST API 提供平铺图像。
 *
 * @alias IonImageryProvider
 * @constructor
 *
 * @param {IonImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @see IonImageryProvider.fromAssetId
 */
function IonImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._defaultAlpha = undefined;
  this._defaultNightAlpha = undefined;
  this._defaultDayAlpha = undefined;
  this._defaultBrightness = undefined;
  this._defaultContrast = undefined;
  this._defaultHue = undefined;
  this._defaultSaturation = undefined;
  this._defaultGamma = undefined;
  this._defaultMinificationFilter = undefined;
  this._defaultMagnificationFilter = undefined;

  this._tileCredits = undefined;
  this._errorEvent = new Event();
}

Object.defineProperties(IonImageryProvider.prototype, {
  /**
   * 获取实例提供的图像的矩形（以弧度为单位）。
   * @memberof IonImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._imageryProvider.rectangle;
    },
  },

  /**
   * 获取每个图块的宽度（以像素为单位）。
   * @memberof IonImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._imageryProvider.tileWidth;
    },
  },

  /**
   * 获取每个图块的高度（以像素为单位）。
   * @memberof IonImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._imageryProvider.tileHeight;
    },
  },

  /**
   * 获取可请求的最大详细级别。
   * @memberof IonImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._imageryProvider.maximumLevel;
    },
  },

  /**
   * 获取可请求的最低详细级别。一般
   * 仅当图像的矩形较小时，才应使用最低级别
   * 足以使最低级别的图块数量很少。 图像
   * 提供者在最低级别上拥有多个图块将导致
   * 渲染问题。
   * @memberof IonImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._imageryProvider.minimumLevel;
    },
  },

  /**
   * Gets the tiling scheme used by the provider.
   * @memberof IonImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._imageryProvider.tilingScheme;
    },
  },

  /**
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
   * @memberof IonImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof IonImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
   * @memberof IonImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._imageryProvider.credit;
    },
  },

  /**
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
   * @memberof IonImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._imageryProvider.hasAlphaChannel;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof IonImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   * @default undefined
   */
  proxy: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * 使用 Cesium ion REST API 创建切片影像的提供程序。
 *
 * @param {Number} assetId 离子图像资产 ID。
 * @param {IonImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象.
 * @returns {Promise<IonImageryProvider>} 一个 Promise 解析为创建的 IonImageryProvider。
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @exception {RuntimeError} Cesium ion assetId is not an imagery asset
 * @exception {RuntimeError} Unrecognized Cesium ion imagery type
 */
IonImageryProvider.fromAssetId = async function (assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("assetId", assetId);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const endpointResource = IonResource._createEndpointResource(
    assetId,
    options
  );

  // A simple cache to avoid making repeated requests to ion for endpoints we've
  // already retrieved. This exists mainly to support Bing caching to reduce
  // world imagery sessions, but provides a small boost of performance in general
  // if constantly reloading assets
  const cacheKey = assetId.toString() + options.accessToken + options.server;
  let promise = IonImageryProvider._endpointCache[cacheKey];
  if (!defined(promise)) {
    promise = endpointResource.fetchJson();
    IonImageryProvider._endpointCache[cacheKey] = promise;
  }

  const endpoint = await promise;
  if (endpoint.type !== "IMAGERY") {
    throw new RuntimeError(
      `Cesium ion asset ${assetId} is not an imagery asset.`
    );
  }

  let imageryProvider;
  const externalType = endpoint.externalType;
  if (!defined(externalType)) {
    imageryProvider = await TileMapServiceImageryProvider.fromUrl(
      new IonResource(endpoint, endpointResource)
    );
  } else {
    const factory = ImageryProviderAsyncMapping[externalType];

    if (!defined(factory)) {
      throw new RuntimeError(
        `Unrecognized Cesium ion imagery type: ${externalType}`
      );
    }
    // Make a copy before editing since this object reference is cached;
    const options = { ...endpoint.options };
    const url = options.url;
    delete options.url;
    imageryProvider = await factory(url, options);
  }

  const provider = new IonImageryProvider(options);

  imageryProvider.errorEvent.addEventListener(function (tileProviderError) {
    //Propagate the errorEvent but set the provider to this instance instead
    //of the inner instance.
    tileProviderError.provider = provider;
    provider._errorEvent.raiseEvent(tileProviderError);
  });

  provider._tileCredits = IonResource.getCreditsFromEndpoint(
    endpoint,
    endpointResource
  );

  provider._imageryProvider = imageryProvider;

  return provider;
};

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
IonImageryProvider.prototype.getTileCredits = function (x, y, level) {
  const innerCredits = this._imageryProvider.getTileCredits(x, y, level);
  if (!defined(innerCredits)) {
    return this._tileCredits;
  }

  return this._tileCredits.concat(innerCredits);
};

/**
 * 请求给定磁贴的图像。
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 映像的 Promise，该 Promise 将在映像可用时解析，或者
 * undefined 如果对服务器的活动请求过多，则应稍后重试该请求。
 */
IonImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return this._imageryProvider.requestImage(x, y, level, request);
};

/**
 * 异步确定哪些要素（如果有）位于给定的经度和纬度
 * 一个图块。此函数是可选的，因此它可能并非存在于所有 ImageryProvider 中。
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
 *实例。 如果在给定位置未找到要素，则数组可能为空。
 * 如果不支持拣选，也可能为 undefined。
 */
IonImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

//exposed for testing
IonImageryProvider._endpointCache = {};
export default IonImageryProvider;
