import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import IonResource from "../Core/IonResource.js";
import RuntimeError from "../Core/RuntimeError.js";
import IonImageryProviderFactory from "./IonImageryProviderFactory.js";

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
 * 要构造 IonImageryProvider，请调用 {@link IonImageryProvider.fromAssetId}。不要直接调用构造函数。
 * </div>
 *
 * 使用 Cesium ion REST API 提供瓦片影像。
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
  options = options ?? Frozen.EMPTY_OBJECT;

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
   * 获取实例提供的影像范围（以弧度为单位）。
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
   * 获取每个瓦片的宽度（以像素为单位）。
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
   * 获取每个瓦片的高度（以像素为单位）。
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
   * 获取可请求的最大细节级别。
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
   * 获取可请求的最小细节级别。通常，
   * 最小级别应仅在影像范围足够小，使得最小级别的瓦片数量较少时使用。
   * 在最小级别有过多瓦片的影像提供程序将导致渲染问题。
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
   * 获取提供程序使用的瓦片方案。
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
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果该函数
   * 返回 undefined，则不会过滤任何瓦片。
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
   * 获取当影像提供程序遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会接收到 {@link TileProviderError} 的实例。
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
   * 获取当此影像提供程序处于活动状态时要显示的版权信息。通常用于注明
   * 影像的来源。
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
   * 获取一个值，指示此影像提供程序提供的图像
   * 是否包含 Alpha 通道。如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。如果此属性为 true，则任何没有 Alpha 通道的图像将被视为
   * 其 Alpha 值在所有地方都为 1.0。当此属性为 false 时，内存使用量
   * 和纹理上传时间会减少。
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
 * 使用 Cesium ion REST API 创建瓦片影像提供程序。
 *
 * @param {number} assetId  ion 影像资产 ID。
 * @param {IonImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<IonImageryProvider>} 一个解析为已创建的 IonImageryProvider 的承诺。
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @exception {RuntimeError} Cesium ion assetId 不是影像资产
 * @exception {RuntimeError} 无法识别的 Cesium ion 影像类型
 */
IonImageryProvider.fromAssetId = async function (assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("assetId", assetId);
  //>>includeEnd('debug');

  options = options ?? Frozen.EMPTY_OBJECT;
  const endpointResource = IonResource._createEndpointResource(
    assetId,
    options,
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

  let endpoint = await promise;
  if (endpoint.type !== "IMAGERY") {
    throw new RuntimeError(
      `Cesium ion asset ${assetId} is not an imagery asset.`,
    );
  }

  const externalType = endpoint.externalType;
  let factory = IonImageryProviderFactory.defaultFactoryCallback;

  // Make a copy before editing since this object reference is cached;
  endpoint = clone(endpoint, true);
  endpoint.options = endpoint.options ?? {};
  const url = endpoint.options?.url;
  delete options.url;

  if (defined(externalType)) {
    factory = IonImageryProviderFactory[externalType];

    if (!defined(factory)) {
      throw new RuntimeError(
        `Unrecognized Cesium ion imagery type: ${externalType}`,
      );
    }
  }

  const imageryProvider = await factory(url, endpoint, endpointResource);
  const provider = new IonImageryProvider(options);

  imageryProvider.errorEvent.addEventListener(function (tileProviderError) {
    //Propagate the errorEvent but set the provider to this instance instead
    //of the inner instance.
    tileProviderError.provider = provider;
    provider._errorEvent.raiseEvent(tileProviderError);
  });

  provider._tileCredits = IonResource.getCreditsFromEndpoint(
    endpoint,
    endpointResource,
  );

  provider._imageryProvider = imageryProvider;

  return provider;
};

/**
 * 获取当显示给定瓦片时要显示的版权信息。
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要显示的版权信息。
 */
IonImageryProvider.prototype.getTileCredits = function (x, y, level) {
  const innerCredits = this._imageryProvider.getTileCredits(x, y, level);
  if (!defined(innerCredits)) {
    return this._tileCredits;
  }

  return this._tileCredits.concat(innerCredits);
};

/**
 * 请求给定瓦片的图像。
 * @function
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 图像的承诺，当图像可用时解析，或者
 *          如果服务器有太多活动请求而返回 undefined，则应稍后重试请求。
 */
IonImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return this._imageryProvider.requestImage(x, y, level, request);
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
 */
IonImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

//exposed for testing
IonImageryProvider._endpointCache = {};
export default IonImageryProvider;
