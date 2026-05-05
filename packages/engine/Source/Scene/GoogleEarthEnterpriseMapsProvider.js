import buildModuleUrl from "../Core/buildModuleUrl.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import TileProviderError from "../Core/TileProviderError.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import ImageryProvider from "./ImageryProvider.js";

/**
 * @typedef {object} GoogleEarthEnterpriseMapsProvider.ConstructorOptions
 *
 * GoogleEarthEnterpriseMapsProvider 构造函数的初始化选项
 *
 * @property {number} channel 从服务器请求数据时要使用的频道（id）。
 *        频道编号可以通过查看位于以下位置的 json 文件找到：
 *        earth.localdomain/default_map/query?request=Json&vars=geeServerDefs /default_map 路径可能
 *        因您的 Google Earth Enterprise 服务器配置而异。查找与
 *        "ImageryMaps" requestType 关联的 "id"。可能有多个可用的 id。
 *        示例：
 *        {
 *          layers: [
 *            {
 *              id: 1002,
 *              requestType: "ImageryMaps"
 *            },
 *            {
 *              id: 1007,
 *              requestType: "VectorMapsRaster"
 *            }
 *          ]
 *        }
 * @property {string} [path="/default_map"] 托管影像的 Google Earth 服务器的路径。
 * @property {number} [maximumLevel] Google Earth
 *        Enterprise 服务器支持的最大细节级别，如果没有限制则为 undefined。
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否
 *        无效并应被丢弃的策略。为确保不丢弃任何瓦片，请构造并传递
 *        {@link NeverTileDiscardPolicy} 作为此参数。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，则使用默认椭球体。
 */

/**
 * Used to track creation details while fetching initial metadata
 *
 * @constructor
 * @private
 *
 * @param {GoogleEarthEnterpriseMapsProvider.ConstructorOptions} options An object describing initialization options
 */
function ImageryProviderBuilder(options) {
  this.channel = options.channel;
  this.ellipsoid = options.ellipsoid;
  this.tilingScheme = undefined;
  this.version = undefined;
}

/**
 * Complete GoogleEarthEnterpriseMapsProvider creation based on builder values.
 *
 * @private
 *
 * @param {GoogleEarthEnterpriseMapsProvider} provider
 */
ImageryProviderBuilder.prototype.build = function (provider) {
  provider._channel = this.channel;
  provider._version = this.version;
  provider._tilingScheme = this.tilingScheme;
};

function metadataSuccess(text, imageryProviderBuilder) {
  let data;

  // The Google Earth server sends malformed JSON data currently...
  try {
    // First, try parsing it like normal in case a future version sends correctly formatted JSON
    data = JSON.parse(text);
  } catch (e) {
    // Quote object strings manually, then try parsing again
    data = JSON.parse(
      text.replace(/([\[\{,])[\n\r ]*([A-Za-z0-9]+)[\n\r ]*:/g, '$1"$2":'),
    );
  }

  let layer;
  for (let i = 0; i < data.layers.length; i++) {
    if (data.layers[i].id === imageryProviderBuilder.channel) {
      layer = data.layers[i];
      break;
    }
  }

  if (!defined(layer)) {
    const message = `Could not find layer with channel (id) of ${imageryProviderBuilder.channel}.`;
    throw new RuntimeError(message);
  }

  if (!defined(layer.version)) {
    const message = `Could not find a version in channel (id) ${imageryProviderBuilder.channel}.`;
    throw new RuntimeError(message);
  }

  imageryProviderBuilder.version = layer.version;

  if (defined(data.projection) && data.projection === "flat") {
    imageryProviderBuilder.tilingScheme = new GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 2,
      rectangle: new Rectangle(-Math.PI, -Math.PI, Math.PI, Math.PI),
      ellipsoid: imageryProviderBuilder.ellipsoid,
    });
    // Default to mercator projection when projection is undefined
  } else if (!defined(data.projection) || data.projection === "mercator") {
    imageryProviderBuilder.tilingScheme = new WebMercatorTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 2,
      ellipsoid: imageryProviderBuilder.ellipsoid,
    });
  } else {
    const message = `Unsupported projection ${data.projection}.`;
    throw new RuntimeError(message);
  }

  return true;
}

function metadataFailure(error, metadataResource, provider) {
  let message = `An error occurred while accessing ${metadataResource.url}.`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  TileProviderError.reportError(
    undefined,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
  );

  throw new RuntimeError(message);
}

async function requestMetadata(
  metadataResource,
  imageryProviderBuilder,
  provider,
) {
  try {
    const text = await metadataResource.fetchText();
    metadataSuccess(text, imageryProviderBuilder);
  } catch (error) {
    metadataFailure(error, metadataResource, provider);
  }
}

/**
 * <div class="notice">
 * 要构造 GoogleEarthEnterpriseMapsProvider，请调用 {@link GoogleEarthEnterpriseImageryProvider.fromUrl}。不要直接调用构造函数。
 * </div>
 *
 * 使用 Google Earth 影像 API 提供瓦片影像。
 *
 * 注意：此影像提供程序不适用于公共 Google Earth 服务器。它适用于
 *        Google Earth Enterprise Server。
 *
 *        默认情况下，Google Earth Enterprise 服务器不设置
 *        {@link http://www.w3.org/TR/cors/|跨域资源共享} 标头。您可以
 *        使用添加这些标头的代理服务器，或者在 /opt/google/gehttpd/conf/gehttpd.conf 中
 *        将 'Header set Access-Control-Allow-Origin "*"' 选项添加到 '&lt;Directory /&gt;' 和
 *        '&lt;Directory "/opt/google/gehttpd/htdocs"&gt;' 指令中。
 *
 *        此提供程序用于 Google Earth Enterprise 的 2D 地图 API。对于 3D Earth API 使用，
 *        需要使用 {@link GoogleEarthEnterpriseImageryProvider}
 *
 * @alias GoogleEarthEnterpriseMapsProvider
 * @constructor
 *
 * @param {GoogleEarthEnterpriseMapsProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @exception {RuntimeError} 找不到频道（id）为 <code>options.channel</code> 的图层。
 * @exception {RuntimeError} 在频道（id）<code>options.channel</code> 中找不到版本。
 * @exception {RuntimeError} 不支持的投影 <code>data.projection</code>。
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 *
 * @example
 * const google = await Cesium.GoogleEarthEnterpriseMapsProvider.fromUrl("https://earth.localdomain", 1008);
 *
 * @see {@link http://www.w3.org/TR/cors/|跨域资源共享}
 */
function GoogleEarthEnterpriseMapsProvider(options) {
  options = options ?? {};

  this._defaultAlpha = undefined;
  this._defaultNightAlpha = undefined;
  this._defaultDayAlpha = undefined;
  this._defaultBrightness = undefined;
  this._defaultContrast = undefined;
  this._defaultHue = undefined;
  this._defaultSaturation = undefined;
  this._defaultGamma = 1.9;
  this._defaultMinificationFilter = undefined;
  this._defaultMagnificationFilter = undefined;

  this._tileDiscardPolicy = options.tileDiscardPolicy;
  this._channel = options.channel;
  this._requestType = "ImageryMaps";
  this._credit = new Credit(
    `<a href="http://www.google.com/enterprise/mapsearth/products/earthenterprise.html"><img src="${GoogleEarthEnterpriseMapsProvider.logoUrl}" title="Google Imagery"/></a>`,
  );

  this._tilingScheme = undefined;

  this._version = undefined;

  this._tileWidth = 256;
  this._tileHeight = 256;
  this._maximumLevel = options.maximumLevel;

  this._errorEvent = new Event();
}

Object.defineProperties(GoogleEarthEnterpriseMapsProvider.prototype, {
  /**
   * 获取 Google Earth MapServer 的 URL。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._url;
    },
  },

  /**
   * 获取 Google Earth 服务器上数据的 URL 路径。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {string}
   * @readonly
   */
  path: {
    get: function () {
      return this._path;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取当前正在使用的影像频道（id）。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {number}
   * @readonly
   */
  channel: {
    get: function () {
      return this._channel;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
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
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可请求的最小细节级别。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取此提供程序使用的瓦片方案。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此提供程序使用的数据版本。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {number}
   * @readonly
   */
  version: {
    get: function () {
      return this._version;
    },
  },

  /**
   * 获取从提供程序请求的数据类型。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {string}
   * @readonly
   */
  requestType: {
    get: function () {
      return this._requestType;
    },
  },
  /**
   * 获取此实例提供的影像范围（以弧度为单位）。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果该函数
   * 返回 undefined，则不会过滤任何瓦片。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取当影像提供程序遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会接收到 {@link TileProviderError} 的实例。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
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
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供程序提供的图像
   * 是否包含 Alpha 通道。如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。如果此属性为 true，则任何没有 Alpha 通道的图像将被视为
   * 其 Alpha 值在所有地方都为 1.0。当此属性为 false 时，内存使用量
   * 和纹理上传时间会减少。
   * @memberof GoogleEarthEnterpriseMapsProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },
});

/**
 * 使用 Google Earth 影像 API 创建瓦片影像提供程序。
 *
 * @param {Resource|string} url 托管影像的 Google Earth 服务器的 URL。
 * @param {GoogleEarthEnterpriseMapsProvider.ConstructorOptions} [options] 描述初始化选项的对象
 * @returns {Promise<GoogleEarthEnterpriseMapsProvider>} 已创建的 GoogleEarthEnterpriseMapsProvider。
 *
 * @exception {RuntimeError} 找不到频道（id）为 <code>options.channel</code> 的图层。
 * @exception {RuntimeError} 在频道（id）<code>options.channel</code> 中找不到版本。
 * @exception {RuntimeError} 不支持的投影 <code>data.projection</code>。
 *
 * @example
 * const google = await Cesium.GoogleEarthEnterpriseMapsProvider.fromUrl("https://earth.localdomain", 1008);
 */
GoogleEarthEnterpriseMapsProvider.fromUrl = async function (
  url,
  channel,
  options,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  Check.defined("channel", channel);
  //>>includeEnd('debug');

  options = options ?? {};

  const path = options.path ?? "/default_map";

  const resource = Resource.createIfNeeded(url).getDerivedResource({
    // We used to just append path to url, so now that we do proper URI resolution, removed the /
    url: path[0] === "/" ? path.substring(1) : path,
  });

  resource.appendForwardSlash();

  const metadataResource = resource.getDerivedResource({
    url: "query",
    queryParameters: {
      request: "Json",
      vars: "geeServerDefs",
      is2d: "t",
    },
  });

  const imageryProviderBuilder = new ImageryProviderBuilder(options);
  imageryProviderBuilder.channel = channel;
  await requestMetadata(metadataResource, imageryProviderBuilder);

  const provider = new GoogleEarthEnterpriseMapsProvider(options);
  imageryProviderBuilder.build(provider);

  provider._resource = resource;
  provider._url = url;
  provider._path = path;

  return provider;
};

/**
 * 获取当显示给定瓦片时要显示的版权信息。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要显示的版权信息。
 */
GoogleEarthEnterpriseMapsProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return undefined;
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
GoogleEarthEnterpriseMapsProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const resource = this._resource.getDerivedResource({
    url: "query",
    request: request,
    queryParameters: {
      request: this._requestType,
      channel: this._channel,
      version: this._version,
      x: x,
      y: y,
      z: level + 1, // Google Earth starts with a zoom level of 1, not 0
    },
  });

  return ImageryProvider.loadImage(this, resource);
};

/**
 * 此影像提供程序目前不支持拾取要素，因此此函数直接返回
 * undefined。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude  拾取要素的纬度。
 * @return {undefined} 由于不支持拾取，返回 undefined。
 */
GoogleEarthEnterpriseMapsProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};

GoogleEarthEnterpriseMapsProvider._logoUrl = undefined;

Object.defineProperties(GoogleEarthEnterpriseMapsProvider, {
  /**
   * 获取或设置用于显示在版权信息中的 Google Earth 徽标 URL。
   * @memberof GoogleEarthEnterpriseMapsProvider
   * @type {string}
   */
  logoUrl: {
    get: function () {
      if (!defined(GoogleEarthEnterpriseMapsProvider._logoUrl)) {
        GoogleEarthEnterpriseMapsProvider._logoUrl = buildModuleUrl(
          "Assets/Images/google_earth_credit.png",
        );
      }
      return GoogleEarthEnterpriseMapsProvider._logoUrl;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');

      GoogleEarthEnterpriseMapsProvider._logoUrl = value;
    },
  },
});
export default GoogleEarthEnterpriseMapsProvider;
