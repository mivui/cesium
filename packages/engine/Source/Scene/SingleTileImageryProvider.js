import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import TileProviderError from "../Core/TileProviderError.js";
import ImageryProvider from "./ImageryProvider.js";

/**
 * @typedef {object} SingleTileImageryProvider.ConstructorOptions
 *
 * SingleTileImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url 瓦片的 URL。
 * @property {number} [tileWidth] 瓦片的宽度，单位为像素。
 * @property {number} [tileHeight] 瓦片的高度，单位为像素。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形区域，单位为弧度。
 * @property {Credit|string} [credit] 数据源的版权信息，将显示在画布上。
 * @property {Ellipsoid} [ellipsoid] 椭球体。若未指定，则使用 WGS84 椭球体。
 */

/**
 * 提供单个顶级影像瓦片。假定单张图像使用地理投影（即 WGS84 / EPSG:4326），
 * 并将使用 {@link GeographicTilingScheme} 进行渲染。
 *
 * @alias SingleTileImageryProvider
 * @constructor
 *
 * @param {SingleTileImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 */
function SingleTileImageryProvider(options) {
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

  const rectangle = options.rectangle ?? Rectangle.MAX_VALUE;
  const tilingScheme = new GeographicTilingScheme({
    rectangle: rectangle,
    numberOfLevelZeroTilesX: 1,
    numberOfLevelZeroTilesY: 1,
    ellipsoid: options.ellipsoid,
  });
  this._tilingScheme = tilingScheme;
  this._image = undefined;
  this._texture = undefined;

  this._hasError = false;
  this._errorEvent = new Event();

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.url", options.url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(options.url);
  this._resource = resource;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.tileWidth", options.tileWidth);
  Check.typeOf.number("options.tileHeight", options.tileHeight);
  //>>includeEnd('debug');

  this._tileWidth = options.tileWidth;
  this._tileHeight = options.tileHeight;
}

Object.defineProperties(SingleTileImageryProvider.prototype, {
  /**
   * 获取单个顶级影像瓦片的 URL。
   * @memberof SingleTileImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource.url;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度，单位为像素。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度，单位为像素。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可请求的最大细节级别。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取可请求的最小细节级别。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取此提供者使用的切片方案。
   * @memberof SingleTileImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形范围，单位为弧度。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果不为 undefined，该策略负责通过其 shouldDiscardImage 函数
   * 过滤掉"缺失"的瓦片。如果该函数返回 undefined，则不会过滤任何瓦片。
   * @memberof SingleTileImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取当影像提供者遇到异步错误时引发的事件。通过订阅该事件，
   * 您将收到错误通知并可能从中恢复。事件监听器会接收到一个 {@link TileProviderError} 实例。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当此影像提供者处于活动状态时要显示的版权信息。通常用于注明影像来源。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 Alpha 通道。
   * 如果此属性为 false，则 Alpha 通道（如果存在）将被忽略。
   * 如果此属性为 true，则任何没有 Alpha 通道的图像将被视为其 Alpha 值处处为 1.0。
   * 当此属性为 false 时，可以减少内存使用和纹理上传时间。
   * @memberof SingleTileImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },
});

function failure(resource, error, provider, previousError) {
  let message = `Failed to load image ${resource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  const reportedError = TileProviderError.reportError(
    previousError,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
    0,
    0,
    0,
    error,
  );
  if (reportedError.retry) {
    return doRequest(resource, provider, reportedError);
  }

  if (defined(provider)) {
    provider._hasError = true;
  }
  throw new RuntimeError(message);
}

async function doRequest(resource, provider, previousError) {
  try {
    const image = await ImageryProvider.loadImage(null, resource);
    return image;
  } catch (error) {
    return failure(resource, error, provider, previousError);
  }
}

/**
 * @typedef {object} SingleTileImageryProvider.fromUrlOptions
 *
 * 使用 SingleTileImageryProvider.fromUrl 时 SingleTileImageryProvider 构造函数的初始化选项
 *
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形区域，单位为弧度。
 * @property {Credit|string} [credit] 数据源的版权信息，将显示在画布上。
 * @property {Ellipsoid} [ellipsoid] 椭球体。若未指定，则使用 WGS84 椭球体。
 */

/**
 * 为单个顶级影像瓦片创建提供者。假定单张图像使用
 * @param {Resource|string} url 瓦片的 URL
 * @param {SingleTileImageryProvider.fromUrlOptions} [options] 描述初始化选项的对象。
 * @returns {Promise.<SingleTileImageryProvider>} 已解析的 SingleTileImageryProvider。
 *
 * @example
 * const provider = await SingleTileImageryProvider.fromUrl("https://yoururl.com/image.png");
 */
SingleTileImageryProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);
  const image = await doRequest(resource);

  options = options ?? Frozen.EMPTY_OBJECT;
  const provider = new SingleTileImageryProvider({
    ...options,
    url: url,
    tileWidth: image.width,
    tileHeight: image.height,
  });
  provider._image = image;
  return provider;
};

/**
 * 获取给定瓦片显示时要显示的版权信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别；
 * @returns {Credit[]} 瓦片显示时要显示的版权信息。
 */
SingleTileImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise.<ImageryTypes>|undefined} 已解析的图像
 */
SingleTileImageryProvider.prototype.requestImage = async function (
  x,
  y,
  level,
  request,
) {
  if (!this._hasError && !defined(this._image)) {
    const image = await doRequest(this._resource, this);
    this._image = image;
    TileProviderError.reportSuccess(this._errorEvent);
    return image;
  }

  return this._image;
};

/**
 * 此影像提供者目前不支持拾取要素，因此此函数直接返回 undefined。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别。
 * @param {number} longitude 拾取要素处的经度。
 * @param {number} latitude  拾取要素处的纬度。
 * @return {undefined} 由于不支持拾取，返回 undefined。
 */
SingleTileImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default SingleTileImageryProvider;
