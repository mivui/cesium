import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Resource from "../Core/Resource.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import GetFeatureInfoFormat from "./GetFeatureInfoFormat.js";
import TimeDynamicImagery from "./TimeDynamicImagery.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

/**
 *已知 EPSG 代码包含反向轴顺序，但不在 4000-5000 之间。
 *
 * @type {number[]}
 */
const includesReverseAxis = [
  3034, // ETRS89-extended / LCC Europe
  3035, // ETRS89-extended / LAEA Europe
  3042, // ETRS89 / UTM zone 30N (N-E)
  3043, // ETRS89 / UTM zone 31N (N-E)
  3044, // ETRS89 / UTM zone 32N (N-E)
];

/**
 * 已知 EPSG 代码不包括反向轴顺序，并且在 4000-5000 之间。
 *
 * @type {number[]}
 */
const excludesReverseAxis = [
  4471, // Mayotte
  4559, // French Antilles
];

/**
 * @typedef {object} WebMapServiceImageryProvider.ConstructorOptions
 *
 * WebMapServiceImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url WMS 服务的 URL。该 URL 支持与 {@link UrlTemplateImageryProvider} 相同的关键字。
 * @property {string} layers 要包含的图层，用逗号分隔。
 * @property {object} [parameters=WebMapServiceImageryProvider.DefaultParameters] 在 GetMap URL 中传递给 WMS 服务器的其他参数。
 * @property {object} [getFeatureInfoParameters=WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters] 在 GetFeatureInfo URL 中传递给 WMS 服务器的其他参数。
 * @property {boolean} [enablePickFeatures=true] 如果为 true，则 {@link WebMapServiceImageryProvider#pickFeatures} 将调用
 * 在 WMS 服务器上执行 GetFeatureInfo 操作，并返回响应中包含的要素。 如果为 false，则
 * {@link WebMapServiceImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可选取的特征）
 * 而不与服务器通信。 如果您知道 WMS 服务器不支持，请将此属性设置为 false
 * GetFeatureInfo 或者您不希望此提供商的功能是可选择的。请注意，这可以是动态的
 * 通过修改 WebMapServiceImageryProvider#enablePickFeatures 属性进行覆盖。
 * @property {GetFeatureInfoFormat[]} [getFeatureInfoFormats=WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats] 格式
 * 在其中尝试 WMS GetFeatureInfo 请求。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形。
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 用于将世界划分为多个图块的平铺方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。 如果指定了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用 WGS84 椭球体。
 * @property {number} [tileWidth=256] 每个图块的宽度（以像素为单位）。
 * @property {number} [tileHeight=256] 每个图块的高度（以像素为单位）。
 * @property {number} [minimumLevel=0] 图像提供商支持的最低细节层次。 当
 * 指定最低级别的瓦片数量较少，例如 4 或更少。 更大的数字是
 * 可能会导致渲染问题。
 * @property {number} [maximumLevel] 图像提供商支持的最大细节层次，如果没有限制，则为 undefined。
 * 如果未指定，则没有限制。
 * @property {string} [crs] CRS 规范，用于 WMS 规范 >= 1.3.0。
 * @property {string} [srs] SRS 规范，用于 WMS 规范 1.1.0 或 1.1.1
 * @property {Credit|string} [credit] 数据源的积分，显示在画布上。
 * @property {string|string[]} [subdomains='abc'] 用于 URL 模板中 <code>{s}</code> 占位符的子域。
 * 如果此参数是单个字符串，则字符串中的每个字符都是一个子域。 如果是
 * 一个数组，数组中的每个元素都是一个子域。
 * @property {Clock} [clock] 确定时间维度值时使用的 Clock 实例。指定 'times' 时是必需的。
 * @property {TimeIntervalCollection} [times] TimeIntervalCollection，其 data 属性是一个包含时间动态维度及其值的对象。
 * @property {Resource|string} [getFeatureInfoUrl] WMS 服务的 getFeatureInfo URL。如果未定义属性，则我们使用 url 的属性值。
 */

/**
 *提供由 Web 地图服务 （WMS） 服务器托管的切片影像。
 *
 * @alias WebMapServiceImageryProvider
 * @constructor
 *
 * @param {WebMapServiceImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 * @see {@link http://resources.esri.com/help/9.3/arcgisserver/apis/rest/|ArcGIS Server REST API}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 *
 * @example
 * const provider = new Cesium.WebMapServiceImageryProvider({
 *     url : 'https://sampleserver1.arcgisonline.com/ArcGIS/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer',
 *     layers : '0',
 *     proxy: new Cesium.DefaultProxy('/proxy/')
 * });
 * const imageryLayer = new Cesium.ImageryLayer(provider);
 * viewer.imageryLayers.add(imageryLayer);
 */
function WebMapServiceImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.url)) {
    throw new DeveloperError("options.url is required.");
  }
  if (!defined(options.layers)) {
    throw new DeveloperError("options.layers is required.");
  }
  //>>includeEnd('debug');

  if (defined(options.times) && !defined(options.clock)) {
    throw new DeveloperError(
      "options.times was specified, so options.clock is required.",
    );
  }

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

  this._getFeatureInfoUrl = defaultValue(
    options.getFeatureInfoUrl,
    options.url,
  );

  const resource = Resource.createIfNeeded(options.url);
  const pickFeatureResource = Resource.createIfNeeded(this._getFeatureInfoUrl);

  resource.setQueryParameters(
    WebMapServiceImageryProvider.DefaultParameters,
    true,
  );
  pickFeatureResource.setQueryParameters(
    WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters,
    true,
  );

  if (defined(options.parameters)) {
    resource.setQueryParameters(objectToLowercase(options.parameters));
  }

  if (defined(options.getFeatureInfoParameters)) {
    pickFeatureResource.setQueryParameters(
      objectToLowercase(options.getFeatureInfoParameters),
    );
  }

  const that = this;
  this._reload = undefined;
  if (defined(options.times)) {
    this._timeDynamicImagery = new TimeDynamicImagery({
      clock: options.clock,
      times: options.times,
      requestImageFunction: function (x, y, level, request, interval) {
        return requestImage(that, x, y, level, request, interval);
      },
      reloadFunction: function () {
        if (defined(that._reload)) {
          that._reload();
        }
      },
    });
  }

  const parameters = {};
  parameters.layers = options.layers;
  parameters.bbox =
    "{westProjected},{southProjected},{eastProjected},{northProjected}";
  parameters.width = "{width}";
  parameters.height = "{height}";

  // Use SRS or CRS based on the WMS version.
  if (parseFloat(resource.queryParameters.version) >= 1.3) {
    // Use CRS with 1.3.0 and going forward.
    // For GeographicTilingScheme, use CRS:84 vice EPSG:4326 to specify lon, lat (x, y) ordering for
    // bbox requests.
    parameters.crs = defaultValue(
      options.crs,
      options.tilingScheme &&
        options.tilingScheme.projection instanceof WebMercatorProjection
        ? "EPSG:3857"
        : "CRS:84",
    );

    // The axis order in previous versions of the WMS specifications was to always use easting (x or lon ) and northing (y or
    // lat). WMS 1.3.0 specifies that, depending on the particular CRS, the x axis may or may not be oriented West-to-East,
    // and the y axis may or may not be oriented South-to-North. The WMS portrayal operation shall account for axis order.
    // This affects some of the EPSG codes that were commonly used such as ESPG:4326. The current implementation
    // makes sure that coordinates passed to the server (as part of the GetMap BBOX parameter) as well as those advertised
    // in the capabilities document reflect the inverse axe orders for EPSG codes between 4000 and 5000.
    //  - Taken from Section 9.1.3 of https://download.osgeo.org/mapserver/docs/MapServer-56.pdf
    const parts = parameters.crs.split(":");
    if (parts[0] === "EPSG" && parts.length === 2) {
      const code = Number(parts[1]);
      if (
        (code >= 4000 && code < 5000 && !excludesReverseAxis.includes(code)) ||
        includesReverseAxis.includes(code)
      ) {
        parameters.bbox =
          "{southProjected},{westProjected},{northProjected},{eastProjected}";
      }
    }
  } else {
    // SRS for WMS 1.1.0 or 1.1.1.
    parameters.srs = defaultValue(
      options.srs,
      options.tilingScheme &&
        options.tilingScheme.projection instanceof WebMercatorProjection
        ? "EPSG:3857"
        : "EPSG:4326",
    );
  }

  resource.setQueryParameters(parameters, true);
  pickFeatureResource.setQueryParameters(parameters, true);

  const pickFeatureParams = {
    query_layers: options.layers,
    info_format: "{format}",
  };
  // use correct pixel coordinate identifier based on version
  if (parseFloat(pickFeatureResource.queryParameters.version) >= 1.3) {
    pickFeatureParams.i = "{i}";
    pickFeatureParams.j = "{j}";
  } else {
    pickFeatureParams.x = "{i}";
    pickFeatureParams.y = "{j}";
  }
  pickFeatureResource.setQueryParameters(pickFeatureParams, true);

  this._resource = resource;
  this._pickFeaturesResource = pickFeatureResource;
  this._layers = options.layers;

  // Let UrlTemplateImageryProvider do the actual URL building.
  this._tileProvider = new UrlTemplateImageryProvider({
    url: resource,
    pickFeaturesUrl: pickFeatureResource,
    tilingScheme: defaultValue(
      options.tilingScheme,
      new GeographicTilingScheme({ ellipsoid: options.ellipsoid }),
    ),
    rectangle: options.rectangle,
    tileWidth: options.tileWidth,
    tileHeight: options.tileHeight,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    subdomains: options.subdomains,
    tileDiscardPolicy: options.tileDiscardPolicy,
    credit: options.credit,
    getFeatureInfoFormats: defaultValue(
      options.getFeatureInfoFormats,
      WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats,
    ),
    enablePickFeatures: options.enablePickFeatures,
  });
}

function requestImage(imageryProvider, col, row, level, request, interval) {
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;
  const tileProvider = imageryProvider._tileProvider;

  if (defined(dynamicIntervalData)) {
    // We set the query parameters within the tile provider, because it is managing the query.
    tileProvider._resource.setQueryParameters(dynamicIntervalData);
  }
  return tileProvider.requestImage(col, row, level, request);
}

function pickFeatures(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  interval,
) {
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;
  const tileProvider = imageryProvider._tileProvider;

  if (defined(dynamicIntervalData)) {
    // We set the query parameters within the tile provider, because it is managing the query.
    tileProvider._pickFeaturesResource.setQueryParameters(dynamicIntervalData);
  }
  return tileProvider.pickFeatures(x, y, level, longitude, latitude);
}

Object.defineProperties(WebMapServiceImageryProvider.prototype, {
  /**
   * 获取 WMS 服务器的 URL。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource._url;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取名称WMS 图层，以逗号分隔。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  layers: {
    get: function () {
      return this._layers;
    },
  },

  /**
   * 获取每个图块的宽度（以像素为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileProvider.tileWidth;
    },
  },

  /**
   * 获取每个图块的高度（以像素为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileProvider.tileHeight;
    },
  },

  /**
   * 获取可请求的最大详细级别。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._tileProvider.maximumLevel;
    },
  },

  /**
   * 获取可请求的最小详细级别。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._tileProvider.minimumLevel;
    },
  },

  /**
   * 获取此提供程序使用的切片方案。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tileProvider.tilingScheme;
    },
  },

  /**
   * 获取此实例提供的图像的矩形（以弧度为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tileProvider.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._tileProvider.errorEvent;
    },
  },

  /**
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._tileProvider.credit;
    },
  },

  /**
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._tileProvider.hasAlphaChannel;
    },
  },

  /**
   * 获取或设置一个值，该值指示是否启用功能选取。 如果为 true，则 {@link WebMapServiceImageryProvider#pickFeatures} 将
   * 调用 WMS 服务器上的 <code>GetFeatureInfo</code> 服务，并尝试解释响应中包含的功能。 如果为 false，则
   * {@link WebMapServiceImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可选取的
   * 功能），而无需与服务器通信。 如果您知道您的数据，请将此属性设置为 false
   * Source 不支持选取功能，或者您不希望此提供程序的功能可选取。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {boolean}
   * @default true
   */
  enablePickFeatures: {
    get: function () {
      return this._tileProvider.enablePickFeatures;
    },
    set: function (enablePickFeatures) {
      this._tileProvider.enablePickFeatures = enablePickFeatures;
    },
  },

  /**
   * 获取或设置一个 clock，该 clock 用于 get keep time used for time 动态参数。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Clock}
   */
  clock: {
    get: function () {
      return this._timeDynamicImagery.clock;
    },
    set: function (value) {
      this._timeDynamicImagery.clock = value;
    },
  },
  /**
   * 获取或设置用于获取时间动态参数的时间间隔集合。每个
   * TimeInterval 是一个对象，其中包含在
   * 磁贴请求。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TimeIntervalCollection}
   */
  times: {
    get: function () {
      return this._timeDynamicImagery.times;
    },
    set: function (value) {
      this._timeDynamicImagery.times = value;
    },
  },

  /**
   * 获取 WMS 服务器的 getFeatureInfo URL。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Resource|string}
   * @readonly
   */
  getFeatureInfoUrl: {
    get: function () {
      return this._getFeatureInfoUrl;
    },
  },
});

/**
 * 获取在显示给定磁贴时要显示的积分。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
WebMapServiceImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return this._tileProvider.getTileCredits(x, y, level);
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
WebMapServiceImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  let result;
  const timeDynamicImagery = this._timeDynamicImagery;
  let currentInterval;

  // Try and load from cache
  if (defined(timeDynamicImagery)) {
    currentInterval = timeDynamicImagery.currentInterval;
    result = timeDynamicImagery.getFromCache(x, y, level, request);
  }

  // Couldn't load from cache
  if (!defined(result)) {
    result = requestImage(this, x, y, level, request, currentInterval);
  }

  // If we are approaching an interval, preload this tile in the next interval
  if (defined(result) && defined(timeDynamicImagery)) {
    timeDynamicImagery.checkApproachingInterval(x, y, level, request);
  }

  return result;
};

/**
 * 异步确定哪些要素（如果有）位于给定的经度和纬度
 * 一个图块。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 选取特征的经度。
 * @param {number} latitude 选取特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 对所选特征的 Promise，当异步
 * 拣选完成。 解析的值是 {@link ImageryLayerFeatureInfo} 的数组
 * 实例。 如果在给定位置未找到要素，则数组可能为空。
 */
WebMapServiceImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  const timeDynamicImagery = this._timeDynamicImagery;
  const currentInterval = defined(timeDynamicImagery)
    ? timeDynamicImagery.currentInterval
    : undefined;

  return pickFeatures(this, x, y, level, longitude, latitude, currentInterval);
};

/**
 * WMS URL 中用于获取图像的默认参数。 值如下所示：
 *    service=WMS
 *    version=1.1.1
 *    request=GetMap
 *    styles=
 *    format=image/jpeg
 *
 * @constant
 * @type {object}
 */
WebMapServiceImageryProvider.DefaultParameters = Object.freeze({
  service: "WMS",
  version: "1.1.1",
  request: "GetMap",
  styles: "",
  format: "image/jpeg",
});

/**
 * 要包含在 WMS URL 中以获取要素信息的默认参数。 值如下所示：
 *     service=WMS
 *     version=1.1.1
 *     request=GetFeatureInfo
 *
 * @constant
 * @type {object}
 */
WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters = Object.freeze({
  service: "WMS",
  version: "1.1.1",
  request: "GetFeatureInfo",
});

WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats = Object.freeze([
  Object.freeze(new GetFeatureInfoFormat("json", "application/json")),
  Object.freeze(new GetFeatureInfoFormat("xml", "text/xml")),
  Object.freeze(new GetFeatureInfoFormat("text", "text/html")),
]);

function objectToLowercase(obj) {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key.toLowerCase()] = obj[key];
    }
  }
  return result;
}
export default WebMapServiceImageryProvider;
