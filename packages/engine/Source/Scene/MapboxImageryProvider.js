import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Resource from "../Core/Resource.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const trailingSlashRegex = /\/$/;
const defaultCredit = new Credit(
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/">Improve this map</a></strong>'
);

/**
 * @typedef {object} MapboxImageryProvider.ConstructorOptions
 *
 * MapboxImageryProvider 构造函数的初始化选项
 *
 * @property {string} [url='https://api.mapbox.com/v4/'] The Mapbox server url.
 * @property {string} mapId Mapbox 地图 ID。
 * @property {string} accessToken 图像的公共访问令牌。
 * @property {string} [format='png'] 图片请求的格式。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。 如果未指定，则使用默认椭球体。
 * @property {number} [minimumLevel=0] 图像提供商支持的最低细节层次。 指定时要小心
 * 最低级别的图块数量很少，例如 4 个或更少。 可能更大的数字
 * 导致渲染问题。
 * @property {number} [maximumLevel] 图像提供商支持的最大细节层次，如果没有限制，则为 undefined。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形，以弧度为单位。
 * @property {Credit|string} [credit] 数据源的积分，显示在画布上。
 */

/**
 * 提供由 Mapbox 托管的平铺图像。
 *
 * @alias MapboxImageryProvider
 * @constructor
 *
 * @param {MapboxImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @example
 * // Mapbox tile provider
 * const mapbox = new Cesium.MapboxImageryProvider({
 *     mapId: 'mapbox.mapbox-terrain-v2',
 *     accessToken: 'thisIsMyAccessToken'
 * });
 *
 * @see {@link https://docs.mapbox.com/api/maps/raster-tiles/}
 * @see {@link https://docs.mapbox.com/api/accounts/tokens/}
 */
function MapboxImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const mapId = options.mapId;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(mapId)) {
    throw new DeveloperError("options.mapId is required.");
  }
  //>>includeEnd('debug');

  const accessToken = options.accessToken;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(accessToken)) {
    throw new DeveloperError("options.accessToken is required.");
  }
  //>>includeEnd('debug');

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

  const resource = Resource.createIfNeeded(
    defaultValue(options.url, "https://{s}.tiles.mapbox.com/v4/")
  );

  this._mapId = mapId;
  this._accessToken = accessToken;

  let format = defaultValue(options.format, "png");
  if (!/\./.test(format)) {
    format = `.${format}`;
  }
  this._format = format;

  let templateUrl = resource.getUrlComponent();
  if (!trailingSlashRegex.test(templateUrl)) {
    templateUrl += "/";
  }
  templateUrl += `${mapId}/{z}/{x}/{y}${this._format}`;
  resource.url = templateUrl;

  resource.setQueryParameters({
    access_token: accessToken,
  });

  let credit;
  if (defined(options.credit)) {
    credit = options.credit;
    if (typeof credit === "string") {
      credit = new Credit(credit);
    }
  } else {
    credit = defaultCredit;
  }

  this._resource = resource;
  this._imageryProvider = new UrlTemplateImageryProvider({
    url: resource,
    credit: credit,
    ellipsoid: options.ellipsoid,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    rectangle: options.rectangle,
  });
}

Object.defineProperties(MapboxImageryProvider.prototype, {
  /**
   * 获取 Mapbox 服务器的 URL。
   * @memberof MapboxImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._imageryProvider.url;
    },
  },

  /**
   * 获取实例提供的图像的矩形（以弧度为单位）。
   * @memberof MapboxImageryProvider.prototype
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
   * @memberof MapboxImageryProvider.prototype
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
   * @memberof MapboxImageryProvider.prototype
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
   * @memberof MapboxImageryProvider.prototype
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
   * @memberof MapboxImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._imageryProvider.minimumLevel;
    },
  },

  /**
   * 获取提供程序使用的切片方案。
   * @memberof MapboxImageryProvider.prototype
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
   * @memberof MapboxImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取在图像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof MapboxImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._imageryProvider.errorEvent;
    },
  },

  /**
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
   * @memberof MapboxImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._imageryProvider.credit;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof MapboxImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._imageryProvider.proxy;
    },
  },

  /**
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
   * @memberof MapboxImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._imageryProvider.hasAlphaChannel;
    },
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
MapboxImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * 请求给定磁贴的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 当镜像可用时将解析的镜像的 Promise，或者
 * undefined 如果对服务器的活动请求过多，则应稍后重试该请求。
 */
MapboxImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return this._imageryProvider.requestImage(x, y, level, request);
};

/**
 * 异步确定哪些要素（如果有）位于给定的经度和纬度
 * 一个图块。此函数是可选的，因此它可能并非存在于所有 ImageryProvider 中。
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
 */
MapboxImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

// Exposed for tests
MapboxImageryProvider._defaultCredit = defaultCredit;
export default MapboxImageryProvider;
