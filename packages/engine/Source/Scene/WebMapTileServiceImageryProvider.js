import combine from "../Core/combine.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Resource from "../Core/Resource.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import TimeDynamicImagery from "./TimeDynamicImagery.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";
import GetFeatureInfoFormat from "./GetFeatureInfoFormat.js";

/**
 * @typedef {object} WebMapTileServiceImageryProvider.ConstructorOptions
 *
 * WebMapTileServiceImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url WMTS GetTile 操作的基本 URL（用于 KVP 编码请求）或瓦片 URL 模板（用于 RESTful 请求）。瓦片 URL 模板应包含以下变量：&#123;style&#125;、&#123;TileMatrixSet&#125;、&#123;TileMatrix&#125;、&#123;TileRow&#125;、&#123;TileCol&#125;。如果实际值已硬编码或服务器不需要，前两个是可选的。可以使用 &#123;s&#125; 关键字指定子域名。
 * @property {string} [format='image/jpeg'] 从服务器检索的图像的 MIME 类型。
 * @property {string} layer WMTS 请求的图层名称。
 * @property {string} style WMTS 请求的样式名称。
 * @property {string} tileMatrixSetID 用于 WMTS 请求的 TileMatrixSet 标识符。
 * @property {boolean} [enablePickFeatures] 如果为 true，{@link WebMapTileServiceImageryProvider#pickFeatures} 将调用
 *                          WMTS 服务器上的 GetFeatureInfo 操作并返回响应中包含的要素。如果为 false，
 *                          {@link WebMapTileServiceImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可拾取的要素），
 *                          而不与服务器通信。如果您知道 WMTS 服务器不支持
 *                          GetFeatureInfo，或者您不希望此提供程序的要素可被拾取，请将此属性设置为 false。
 *                          KVP 编码默认为 true。对于 RESTful 编码，仅当
 *                          {@link WebMapTileServiceImageryProvider.ConstructorOptions#getFeatureInfoUrl} 已指定时为 true，否则为 false。
 * @property {object} [getFeatureInfoParameters] 包含在 GetFeatureInfo 请求中的附加参数。键在内部转换为小写。
 * @property {Resource|string} [getFeatureInfoUrl] WMTS 服务的 GetFeatureInfo URL。如果未指定，则使用 <code>url</code> 的值。
 * @property {GetFeatureInfoFormat[]} [getFeatureInfoFormats=WebMapTileServiceImageryProvider.DefaultGetFeatureInfoFormats] 尝试 WMTS GetFeatureInfo 请求的
 *                          格式。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层覆盖的范围。
 * @property {TilingScheme} [tilingScheme] 与 TileMatrixSet 中瓦片组织相对应的瓦片方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果未指定，则使用 WGS84 椭球体。
 * @property {number} [tileWidth=256] 瓦片宽度（以像素为单位）。
 * @property {number} [tileHeight=256] 瓦片高度（以像素为单位）。
 * @property {number} [minimumLevel=0] 影像提供程序支持的最小细节级别。
 * @property {number} [maximumLevel] 影像提供程序支持的最大细节级别，如果没有限制则为 undefined。
 * @property {Array} [tileMatrixLabels] 用于 WMTS 请求的 TileMatrix 标识符列表，每个 TileMatrix 级别一个。
 * @property {Credit|string} [credit] 数据源的版权信息，显示在画布上。
 * @property {string|string[]} [subdomains='abc'] 用于 URL 模板中 <code>{s}</code> 占位符的子域名。
 *                          如果此参数是单个字符串，则字符串中的每个字符都是一个子域名。如果
 *                          是数组，则数组中的每个元素都是一个子域名。
 * @property {Clock} [clock] 用于确定时间维度值的 Clock 实例。指定 `times` 时为必需。
 * @property {TimeIntervalCollection} [times] TimeIntervalCollection，其 <code>data</code> 属性是一个包含时间动态维度及其值的对象。
 * @property {object} [dimensions] 包含静态维度及其值的对象。
 */

/**
 * 提供由 {@link http://www.opengeospatial.org/standards/wmts|WMTS 1.0.0} 兼容服务器提供的瓦片影像。
 * 此提供程序支持 HTTP KVP 编码和 RESTful GetTile 请求，但尚未支持 SOAP 编码。
 *
 * @alias WebMapTileServiceImageryProvider
 * @constructor
 *
 * @param {WebMapTileServiceImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=web-map-tile-service-with-time|Cesium Sandcastle 带时间的 Web 地图瓦片服务演示}
 *
 * @example
 * // 示例 1. USGS 阴影浮雕瓦片 (KVP)
 * const shadedRelief1 = new Cesium.WebMapTileServiceImageryProvider({
 *     url : 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
 *     layer : 'USGSShadedReliefOnly',
 *     style : 'default',
 *     format : 'image/jpeg',
 *     tileMatrixSetID : 'default028mm',
 *     // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
 *     maximumLevel: 19,
 *     credit : new Cesium.Credit('U. S. Geological Survey')
 * });
 * viewer.imageryLayers.addImageryProvider(shadedRelief1);
 *
 * @example
 * // 示例 2. USGS 阴影浮雕瓦片 (RESTful)
 * const shadedRelief2 = new Cesium.WebMapTileServiceImageryProvider({
 *     url : 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS/tile/1.0.0/USGSShadedReliefOnly/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
 *     layer : 'USGSShadedReliefOnly',
 *     style : 'default',
 *     format : 'image/jpeg',
 *     tileMatrixSetID : 'default028mm',
 *     maximumLevel: 19,
 *     credit : new Cesium.Credit('U. S. Geological Survey')
 * });
 * viewer.imageryLayers.addImageryProvider(shadedRelief2);
 *
 * @example
 * // 示例 3: NASA 时间动态雪水当量数据 (RESTful)
 * // 根据能力 XML 为图层定义时间间隔
 * const times = Cesium.TimeIntervalCollection.fromIso8601({
 *     iso8601: '2025-01-01/2025-09-01/P5D', // 使用维度部分中的有效间隔
 *     dataCallback: function(interval, index) {
 *       // 返回 URL 模板中使用的时间变量对象
 *       return {
 *           Time: Cesium.JulianDate.toIso8601(interval.start, 0)
 *       };
 *   }
 * });
 *
 * // 获取内部时钟，设置所需的开始、停止和乘数
 * const clock = viewer.clock;
 * clock.startTime = Cesium.JulianDate.fromIso8601('2025-01-01');
 * clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01');
 * clock.stopTime = Cesium.JulianDate.fromIso8601('2025-09-01');
 * clock.clockRange = Cesium.ClockRange.LOOP_STOP;
 * clock.multiplier = 1; // 每秒 1 天
 * clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
 *
 * viewer.timeline.zoomTo(clock.startTime, clock.stopTime);
 *
 * const weather = new Cesium.WebMapTileServiceImageryProvider({
 *     url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/AMSRU2_Snow_Water_Equivalent_5Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
 *     layer: 'AMSRU2_Snow_Water_Equivalent_5Day',
 *     style: 'default',
 *     tileMatrixSetID: 'GoogleMapsCompatible_Level6',
 *     format: 'image/png',
 *     clock: clock,
 *     times: times,
 *     credit: new Cesium.Credit('NASA Global Imagery Browse Services for EOSDIS')
 * });
 * viewer.imageryLayers.addImageryProvider(weather);
 *
 * @example
 * // 示例 4. Digital Earth Africa 水体，支持 GetFeatureInfo (RESTful)
 * const waterbodies = new Cesium.WebMapTileServiceImageryProvider({
 *    url: "https://geoserver.digitalearth.africa/geoserver/gwc/service/wmts/rest/{layer}/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format={format}",
 *    layer: "waterbodies:DEAfrica_Waterbodies",
 *    style: "waterbodies:waterbodies_v0_0_4",
 *    tileMatrixSetID: "EPSG:3857",
 *    tileMatrixLabels: [
 *      "EPSG:3857:0",
 *      "EPSG:3857:1",
 *      ...
 *    ],
 *    format: "image/png",
 *    enablePickFeatures: true,
 *    getFeatureInfoUrl: "https://geoserver.digitalearth.africa/geoserver/gwc/service/wmts/rest/{layer}/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}/{j}/{i}?format={format}",
 * });
 *
 * viewer.imageryLayers.addImageryProvider(waterbodies);
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see UrlTemplateImageryProvider
 */
function WebMapTileServiceImageryProvider(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.url)) {
    throw new DeveloperError("options.url is required.");
  }
  if (!defined(options.layer)) {
    throw new DeveloperError("options.layer is required.");
  }
  if (!defined(options.style)) {
    throw new DeveloperError("options.style is required.");
  }
  if (!defined(options.tileMatrixSetID)) {
    throw new DeveloperError("options.tileMatrixSetID is required.");
  }
  if (defined(options.times) && !defined(options.clock)) {
    throw new DeveloperError(
      "options.times was specified, so options.clock is required.",
    );
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

  this._getFeatureInfoUrl = options.getFeatureInfoUrl ?? options.url;

  const resource = Resource.createIfNeeded(options.url);
  const pickFeatureResource = Resource.createIfNeeded(this._getFeatureInfoUrl);

  const style = options.style;
  const tileMatrixSetID = options.tileMatrixSetID;
  const url = resource.url;
  const format = options.format ?? "image/jpeg";

  const bracketMatch = url.match(/{/g);
  if (
    !defined(bracketMatch) ||
    (bracketMatch.length === 1 && /{s}/.test(url))
  ) {
    resource.setQueryParameters(
      WebMapTileServiceImageryProvider.DefaultParameters,
      true,
    );
    this._useKvp = true;
  } else {
    resource.setTemplateValues(
      WebMapTileServiceImageryProvider.DefaultParameters,
      true,
    );
    this._useKvp = false;
  }

  if (this._useKvp) {
    pickFeatureResource.setQueryParameters(
      WebMapTileServiceImageryProvider.GetFeatureInfoDefaultParameters,
      true,
    );

    if (defined(options.getFeatureInfoParameters)) {
      pickFeatureResource.setQueryParameters(
        objectToLowercase(options.getFeatureInfoParameters),
      );
    }

    const pickFeatureParams = {
      infoformat: "{format}",
      i: "{i}",
      j: "{j}",
    };
    pickFeatureResource.setQueryParameters(pickFeatureParams, true);
  } else {
    pickFeatureResource.setTemplateValues(
      WebMapTileServiceImageryProvider.GetFeatureInfoDefaultParameters,
      true,
    );

    if (defined(options.getFeatureInfoParameters)) {
      pickFeatureResource.setTemplateValues(
        objectToLowercase(options.getFeatureInfoParameters),
      );
    }
  }

  this._resource = resource;
  this._tileMatrixLabels = options.tileMatrixLabels;
  this._format = format;
  this._dimensions = options.dimensions;
  this._tilematrixset = tileMatrixSetID;

  const parameters = {};
  parameters.tilematrix = "{TileMatrix}";
  parameters.layer = options.layer;
  parameters.style = style;
  parameters.tilerow = "{TileRow}";
  parameters.tilecol = "{TileCol}";
  parameters.tilematrixset = tileMatrixSetID;

  if (this._useKvp) {
    resource.setQueryParameters(parameters, true);
    resource.setQueryParameters({ format: format }, true);
    pickFeatureResource.setQueryParameters({ format: format }, true);
    pickFeatureResource.setQueryParameters(parameters, true);
  } else {
    parameters.Style = style;
    resource.setTemplateValues(parameters);
    resource.setTemplateValues({ format: format });
    pickFeatureResource.setTemplateValues(parameters);
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

  this._errorEvent = new Event();

  // Let UrlTemplateImageryProvider do the actual URL building.
  this._tileProvider = new UrlTemplateImageryProvider({
    url: resource,
    pickFeaturesUrl: pickFeatureResource,
    tilingScheme:
      options.tilingScheme ??
      new WebMercatorTilingScheme({ ellipsoid: options.ellipsoid }),
    rectangle: options.rectangle,
    tileWidth: options.tileWidth,
    tileHeight: options.tileHeight,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    subdomains: options.subdomains,
    tileDiscardPolicy: options.tileDiscardPolicy,
    credit: options.credit,
    getFeatureInfoFormats:
      options.getFeatureInfoFormats ??
      WebMapTileServiceImageryProvider.DefaultGetFeatureInfoFormats,
    enablePickFeatures:
      options.enablePickFeatures ??
      (this._useKvp || defined(options.getFeatureInfoUrl)),
    customTags: createCustomTags(this),
  });
}

function requestImage(imageryProvider, col, row, level, request, interval) {
  const tileProvider = imageryProvider._tileProvider;

  applyDimensions(imageryProvider, tileProvider._resource, interval);

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
  const tileProvider = imageryProvider._tileProvider;

  applyDimensions(
    imageryProvider,
    tileProvider._pickFeaturesResource,
    interval,
  );

  return tileProvider.pickFeatures(x, y, level, longitude, latitude);
}

Object.defineProperties(WebMapTileServiceImageryProvider.prototype, {
  /**
   * 获取托管影像的服务的 URL。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource.url;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileProvider.tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileProvider.tileHeight;
    },
  },

  /**
   * 获取可请求的最大细节级别。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._tileProvider.maximumLevel;
    },
  },

  /**
   * 获取可请求的最小细节级别。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._tileProvider.minimumLevel;
    },
  },

  /**
   * 获取此提供程序使用的瓦片方案。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tileProvider.tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像范围（以弧度为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tileProvider.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果该函数
   * 返回 undefined，则不会过滤任何瓦片。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取当影像提供程序遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会接收到 {@link TileProviderError} 的实例。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._tileProvider.errorEvent;
    },
  },

  /**
   * 获取此影像提供程序返回的图像的 MIME 类型。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  format: {
    get: function () {
      return this._format;
    },
  },

  /**
   * 获取当此影像提供程序处于活动状态时要显示的版权信息。通常用于注明
   * 影像的来源。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._tileProvider.credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供程序提供的图像
   * 是否包含 Alpha 通道。如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。如果此属性为 true，则任何没有 Alpha 通道的图像将被视为
   * 其 Alpha 值在所有地方都为 1.0。当此属性为 false 时，内存使用量
   * 和纹理上传时间会减少。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },

  /**
   * 获取或设置一个值，指示是否启用要素拾取。如果为 true，{@link WebMapTileServiceImageryProvider#pickFeatures} 将
   * 调用 WMTS 服务器上的 <code>GetFeatureInfo</code> 服务并尝试解释响应中包含的要素。如果为 false，
   * {@link WebMapTileServiceImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可拾取的
   * 要素），而不与服务器通信。如果您知道数据源
   * 不支持拾取要素，或者您不希望此提供程序的要素可被拾取，请将此属性设置为 false。
   * KVP 编码默认为 true。对于 RESTful 编码，仅当
   * {@link WebMapTileServiceImageryProvider.ConstructorOptions#getFeatureInfoUrl} 已指定时为 true，否则为 false。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {boolean}
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
   * 获取或设置一个时钟，用于获取时间动态参数使用的时间。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * 获取或设置一个时间间隔集合，用于获取时间动态参数。每个
   * TimeInterval 的数据是一个对象，包含在
   * 瓦片请求期间使用的属性的键和值。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * 获取或设置一个包含静态维度及其值的对象。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {object}
   */
  dimensions: {
    get: function () {
      return this._dimensions;
    },
    set: function (value) {
      if (this._dimensions !== value) {
        this._dimensions = value;
        if (defined(this._reload)) {
          this._reload();
        }
      }
    },
  },

  /**
   * 获取 WMTS 服务器的 getFeatureInfo URL。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
 * 获取当显示给定瓦片时要显示的版权信息。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要显示的版权信息。
 */
WebMapTileServiceImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return this._tileProvider.getTileCredits(x, y, level);
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 图像的承诺，当图像可用时解析，或者
 *          如果服务器有太多活动请求而返回 undefined，则应稍后重试请求。
 */
WebMapTileServiceImageryProvider.prototype.requestImage = function (
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
 * 异步确定瓦片内给定经度和纬度位置存在哪些要素（如果有）。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude  拾取要素的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 拾取要素的承诺，当异步
 *                   拾取完成时解析。解析值是一个 {@link ImageryLayerFeatureInfo}
 *                   实例数组。如果在给定位置未找到要素，数组可能为空。
 */
WebMapTileServiceImageryProvider.prototype.pickFeatures = function (
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
 * 包含在 WMTS URL 中以获取图像的默认参数。值如下：
 *    service=WMTS
 *    version=1.0.0
 *    request=GetTile
 *
 * @constant
 * @type {object}
 */
WebMapTileServiceImageryProvider.DefaultParameters = Object.freeze({
  service: "WMTS",
  version: "1.0.0",
  request: "GetTile",
});

/**
 * 包含在 WMTS URL 中以获取要素信息的默认参数。值如下：
 *     service=WMTS
 *     version=1.0.0
 *     request=GetFeatureInfo
 *
 * @constant
 * @type {object}
 */
WebMapTileServiceImageryProvider.GetFeatureInfoDefaultParameters =
  Object.freeze({
    service: "WMTS",
    version: "1.0.0",
    request: "GetFeatureInfo",
  });

WebMapTileServiceImageryProvider.DefaultGetFeatureInfoFormats = Object.freeze([
  Object.freeze(new GetFeatureInfoFormat("json", "application/json")),
  Object.freeze(new GetFeatureInfoFormat("xml", "text/xml")),
  Object.freeze(new GetFeatureInfoFormat("text", "text/html")),
]);

function applyDimensions(imageryProvider, resource, interval) {
  const staticDimensions = imageryProvider._dimensions;
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;

  if (!imageryProvider._useKvp) {
    if (defined(staticDimensions)) {
      resource.setTemplateValues(staticDimensions);
    }

    if (defined(dynamicIntervalData)) {
      resource.setTemplateValues(dynamicIntervalData);
    }
  } else {
    // build KVP request
    let query = {};

    if (defined(staticDimensions)) {
      query = combine(query, staticDimensions);
    }

    if (defined(dynamicIntervalData)) {
      query = combine(query, dynamicIntervalData);
    }

    resource.setQueryParameters(query);
  }
}

function createCustomTags(imageryProvider) {
  function getTileMatrix(level) {
    const labels = imageryProvider._tileMatrixLabels;
    return defined(labels) ? labels[level] : level.toString();
  }

  // We provide both uppercase and lowercase to make it more convenient for users when creating URL templates.
  return {
    TileMatrix: function (provider, x, y, level) {
      return getTileMatrix(level);
    },
    tilematrix: function (provider, x, y, level) {
      return getTileMatrix(level);
    },
    TileRow: function (provider, x, y) {
      return y.toString();
    },
    tilerow: function (provider, x, y) {
      return y.toString();
    },
    TileCol: function (provider, x, y) {
      return x.toString();
    },
    tilecol: function (provider, x, y) {
      return x.toString();
    },
    TileMatrixSet: function (provider) {
      return imageryProvider._tilematrixset;
    },
    tilematrixset: function (provider) {
      return imageryProvider._tilematrixset;
    },
  };
}

function objectToLowercase(obj) {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key.toLowerCase()] = obj[key];
    }
  }
  return result;
}

export default WebMapTileServiceImageryProvider;
