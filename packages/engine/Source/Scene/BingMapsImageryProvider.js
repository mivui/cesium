import buildModuleUrl from "../Core/buildModuleUrl.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import TileProviderError from "../Core/TileProviderError.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import BingMapsStyle from "./BingMapsStyle.js";
import DiscardEmptyTilePolicy from "./DiscardEmptyTileImagePolicy.js";
import ImageryProvider from "./ImageryProvider.js";

/**
 * @typedef {object} BingMapsImageryProvider.ConstructorOptions
 *
 * BingMapsImageryProvider 构造函数的初始化选项
 *
 * @property {string} [key] 应用程序的 Bing Maps 键，可以是
 * 创建于 {@link https://www.bingmapsportal.com/}。
 * @property {string} [tileProtocol] 加载瓦片时使用的协议，例如 'http' 或 'https'。
 * 默认情况下，磁贴使用与页面相同的协议加载。
 * @property {BingMapsStyle} [mapStyle=BingMapsStyle.AERIAL] 要加载的 Bing 地图图像的类型。
 * @property {string} [mapLayer] 在 {@link https://learn.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata#template-parameters} 上定义的其他显示图层选项
 * @property {string} [culture=''] 请求 Bing 地图图像时要使用的区域性。不
 * 支持所有区域性。参见 {@link http://msdn.microsoft.com/en-us/library/hh441729.aspx}
 * 以获取有关受支持区域性的信息。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。 如果未指定，则使用默认椭球体。
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否
 * 无效，应丢弃。 默认情况下，{@link DiscardEmptyTileImagePolicy}
 * ，预期 Bing 地图服务器将针对缺失的图块发送零长度响应。
 * 为确保不丢弃任何图块，请为此参数构造并传递 {@link NeverTileDiscardPolicy}。
 */

/**
 * 用于在获取初始元数据时跟踪创建详细信息
 *
 * @constructor
 * @private
 *
 * @param {BingMapsImageryProvider.ConstructorOptions} options  描述初始化选项的对象
 */
function ImageryProviderBuilder(options) {
  this.tileWidth = undefined;
  this.tileHeight = undefined;
  this.maximumLevel = undefined;
  this.imageUrlSubdomains = undefined;
  this.imageUrlTemplate = undefined;

  this.attributionList = undefined;
}

/**
 * 根据生成器值完成 BingMapsImageryProvider 创建。
 *
 * @private
 *
 * @param {BingMapsImageryProvider} provider
 */
ImageryProviderBuilder.prototype.build = function (provider) {
  provider._tileWidth = this.tileWidth;
  provider._tileHeight = this.tileHeight;
  provider._maximumLevel = this.maximumLevel;
  provider._imageUrlSubdomains = this.imageUrlSubdomains;
  provider._imageUrlTemplate = this.imageUrlTemplate;

  let attributionList = (provider._attributionList = this.attributionList);
  if (!attributionList) {
    attributionList = [];
  }
  provider._attributionList = attributionList;

  for (
    let attributionIndex = 0, attributionLength = attributionList.length;
    attributionIndex < attributionLength;
    ++attributionIndex
  ) {
    const attribution = attributionList[attributionIndex];

    if (attribution.credit instanceof Credit) {
      // If attribution.credit has already been created
      // then we are using a cached value, which means
      // none of the remaining processing needs to be done.
      break;
    }

    attribution.credit = new Credit(attribution.attribution);
    const coverageAreas = attribution.coverageAreas;

    for (
      let areaIndex = 0, areaLength = attribution.coverageAreas.length;
      areaIndex < areaLength;
      ++areaIndex
    ) {
      const area = coverageAreas[areaIndex];
      const bbox = area.bbox;
      area.bbox = new Rectangle(
        CesiumMath.toRadians(bbox[1]),
        CesiumMath.toRadians(bbox[0]),
        CesiumMath.toRadians(bbox[3]),
        CesiumMath.toRadians(bbox[2]),
      );
    }
  }
};

function metadataSuccess(data, imageryProviderBuilder) {
  if (data.resourceSets.length !== 1) {
    throw new RuntimeError(
      "metadata does not specify one resource in resourceSets",
    );
  }

  const resource = data.resourceSets[0].resources[0];
  imageryProviderBuilder.tileWidth = resource.imageWidth;
  imageryProviderBuilder.tileHeight = resource.imageHeight;
  imageryProviderBuilder.maximumLevel = resource.zoomMax - 1;
  imageryProviderBuilder.imageUrlSubdomains = resource.imageUrlSubdomains;
  imageryProviderBuilder.imageUrlTemplate = resource.imageUrl;

  let validProviders = resource.imageryProviders;
  if (defined(resource.imageryProviders)) {
    // prevent issues with the imagery API from crashing the viewer when the expected properties are not there
    // See https://github.com/CesiumGS/cesium/issues/12088
    validProviders = resource.imageryProviders.filter((provider) =>
      provider.coverageAreas?.some((area) => defined(area.bbox)),
    );
  }
  imageryProviderBuilder.attributionList = validProviders;
}

function metadataFailure(metadataResource, error, provider) {
  let message = `An error occurred while accessing ${metadataResource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  TileProviderError.reportError(
    undefined,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
    undefined,
    undefined,
    undefined,
    error,
  );

  throw new RuntimeError(message);
}

async function requestMetadata(
  metadataResource,
  imageryProviderBuilder,
  provider,
) {
  const cacheKey = metadataResource.url;
  let promise = BingMapsImageryProvider._metadataCache[cacheKey];
  if (!defined(promise)) {
    promise = metadataResource.fetchJsonp("jsonp");
    BingMapsImageryProvider._metadataCache[cacheKey] = promise;
  }

  try {
    const data = await promise;
    return metadataSuccess(data, imageryProviderBuilder);
  } catch (e) {
    metadataFailure(metadataResource, e, provider);
  }
}

/**
 * <div class="notice">
 * 要构造 BingMapsImageryProvider，请调用 {@link BingMapsImageryProvider.fromUrl}. 不要直接调用构造函数。
 * </div>
 *
 * 使用 Bing 地图图像 REST API 提供平铺图像。
 *
 * @alias BingMapsImageryProvider
 * @constructor
 *
 * @param {BingMapsImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see BingMapsImageryProvider.fromUrl
 * @see ArcGisMapServerImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 * @example
 * const bing = await Cesium.BingMapsImageryProvider.fromUrl(
 *   "https://dev.virtualearth.net", {
 *     key: "get-yours-at-https://www.bingmapsportal.com/",
 *     mapStyle: Cesium.BingMapsStyle.AERIAL
 * });
 *
 * @see {@link http://msdn.microsoft.com/en-us/library/ff701713.aspx|Bing Maps REST Services}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
function BingMapsImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._defaultAlpha = undefined;
  this._defaultNightAlpha = undefined;
  this._defaultDayAlpha = undefined;
  this._defaultBrightness = undefined;
  this._defaultContrast = undefined;
  this._defaultHue = undefined;
  this._defaultSaturation = undefined;
  this._defaultGamma = 1.0;
  this._defaultMinificationFilter = undefined;
  this._defaultMagnificationFilter = undefined;

  this._mapStyle = defaultValue(options.mapStyle, BingMapsStyle.AERIAL);
  this._mapLayer = options.mapLayer;
  this._culture = defaultValue(options.culture, "");
  this._key = options.key;

  this._tileDiscardPolicy = options.tileDiscardPolicy;
  if (!defined(this._tileDiscardPolicy)) {
    this._tileDiscardPolicy = new DiscardEmptyTilePolicy();
  }

  this._proxy = options.proxy;
  this._credit = new Credit(
    `<a href="https://www.microsoft.com/en-us/maps/product/enduserterms"><img src="${BingMapsImageryProvider.logoUrl}" title="Bing Imagery"/></a>`,
  );

  this._tilingScheme = new WebMercatorTilingScheme({
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 2,
    ellipsoid: options.ellipsoid,
  });

  this._tileWidth = undefined;
  this._tileHeight = undefined;
  this._maximumLevel = undefined;
  this._imageUrlTemplate = undefined;
  this._imageUrlSubdomains = undefined;
  this._attributionList = undefined;

  this._errorEvent = new Event();
}

Object.defineProperties(BingMapsImageryProvider.prototype, {
  /**
   * 获取托管图像的 BingMaps 服务器 URL 的名称。
   * @memberof BingMapsImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource.url;
    },
  },

  /**
   *获取此提供程序使用的代理。
   * @memberof BingMapsImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取 Bing Maps 键。
   * @memberof BingMapsImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  key: {
    get: function () {
      return this._key;
    },
  },

  /**
   * 获取要加载的 Bing 地图图像的类型。
   * @memberof BingMapsImageryProvider.prototype
   * @type {BingMapsStyle}
   * @readonly
   */
  mapStyle: {
    get: function () {
      return this._mapStyle;
    },
  },

  /**
   * 获取 中定义的其他地图层选项 {@link https://learn.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata#template-parameters}/
   * @memberof BingMapsImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  mapLayer: {
    get: function () {
      return this._mapLayer;
    },
  },

  /**
   * 请求 Bing 地图图像时要使用的区域性。不
   * 支持所有区域性。参见 {@link http://msdn.microsoft.com/en-us/library/hh441729.aspx}
   * 以获取有关受支持区域性的信息。
   * @memberof BingMapsImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  culture: {
    get: function () {
      return this._culture;
    },
  },

  /**
   * 获取每个图块的宽度（以像素为单位）。
   * @memberof BingMapsImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个图块的高度（以像素为单位）。
   * @memberof BingMapsImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可请求的最大详细级别。
   * @memberof BingMapsImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可请求的最小详细级别。
   * @memberof BingMapsImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取此提供程序使用的切片方案。
   * @memberof BingMapsImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的图像的矩形（以弧度为单位）。
   * @memberof BingMapsImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
   * @memberof BingMapsImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof BingMapsImageryProvider.prototype
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
   * @memberof BingMapsImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 将此属性设置为 false 可减少内存使用量
   * 和纹理上传时间。
   * @memberof BingMapsImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return defined(this.mapLayer);
    },
  },
});

/**
 * 创建一个 {@link ImageryProvider}，它使用 Bing 地图图像 REST API 提供平铺图像。
 *
 * @param {Resource|String} url 托管图像的 Bing 地图服务器的 URL。
 * @param {BingMapsImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 * @returns {Promise<BingMapsImageryProvider>} 解析为创建的 BingMapsImageryProvider 的 Promise
 *
 * @example
 * const bing = await Cesium.BingMapsImageryProvider.fromUrl(
 *   "https://dev.virtualearth.net", {
 *     key: "get-yours-at-https://www.bingmapsportal.com/",
 *     mapStyle: Cesium.BingMapsStyle.AERIAL
 * });
 *
 * @exception {RuntimeError} metadata does not specify one resource in resourceSets
 */
BingMapsImageryProvider.fromUrl = async function (url, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  Check.defined("options.key", options.key);
  //>>includeEnd('debug');

  let tileProtocol = options.tileProtocol;

  // For backward compatibility reasons, the tileProtocol may end with
  // a `:`. Remove it.
  if (defined(tileProtocol)) {
    if (
      tileProtocol.length > 0 &&
      tileProtocol[tileProtocol.length - 1] === ":"
    ) {
      tileProtocol = tileProtocol.substr(0, tileProtocol.length - 1);
    }
  } else {
    // use http if the document's protocol is http, otherwise use https
    const documentProtocol = document.location.protocol;
    tileProtocol = documentProtocol === "http:" ? "http" : "https";
  }

  const mapStyle = defaultValue(options.mapStyle, BingMapsStyle.AERIAL);
  const resource = Resource.createIfNeeded(url);
  resource.appendForwardSlash();

  const queryParameters = {
    incl: "ImageryProviders",
    key: options.key,
    uriScheme: tileProtocol,
  };

  if (defined(options.mapLayer)) {
    queryParameters.mapLayer = options.mapLayer;
  }

  if (defined(options.culture)) {
    queryParameters.culture = options.culture;
  }

  const metadataResource = resource.getDerivedResource({
    url: `REST/v1/Imagery/Metadata/${mapStyle}`,
    queryParameters: queryParameters,
  });

  const provider = new BingMapsImageryProvider(options);
  provider._resource = resource;
  const imageryProviderBuilder = new ImageryProviderBuilder(options);
  await requestMetadata(metadataResource, imageryProviderBuilder);
  imageryProviderBuilder.build(provider);
  return provider;
};

const rectangleScratch = new Rectangle();

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
BingMapsImageryProvider.prototype.getTileCredits = function (x, y, level) {
  const rectangle = this._tilingScheme.tileXYToRectangle(
    x,
    y,
    level,
    rectangleScratch,
  );
  const result = getRectangleAttribution(
    this._attributionList,
    level,
    rectangle,
  );

  return result;
};

/**
 * 请求给定磁贴的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 映像的 Promise，该 Promise 将在映像可用时解析，或者
 * undefined 如果对服务器的活动请求过多，则应稍后重试该请求。
 */
BingMapsImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const promise = ImageryProvider.loadImage(
    this,
    buildImageResource(this, x, y, level, request),
  );

  if (defined(promise)) {
    return promise.catch(function (error) {
      // One cause of an error here is that the image we tried to load was zero-length.
      // This isn't actually a problem, since it indicates that there is no tile.
      // So, in that case we return the EMPTY_IMAGE sentinel value for later discarding.
      if (defined(error.blob) && error.blob.size === 0) {
        return DiscardEmptyTilePolicy.EMPTY_IMAGE;
      }
      return Promise.reject(error);
    });
  }

  return undefined;
};

/**
 * 此图像提供程序目前不支持选取功能，因此此函数仅返回
 *定义。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 选取特征的经度。
 * @param {number} latitude 选取特征的纬度。
 * @return {undefined} Undefined，因为不支持拣选。
 */
BingMapsImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};

/**
 * 将图块 （x， y， level） 位置转换为用于请求图像的四边形键
 * 从 Bing 地图服务器。
 *
 * @param {number} x 瓦片的 x 坐标。
 * @param {number} y 瓦片的 y 坐标。
 * @param {number} level 磁贴的缩放级别。
 *
 * @see {@link http://msdn.microsoft.com/en-us/library/bb259689.aspx|Bing Maps Tile System}
 * @see BingMapsImageryProvider#quadKeyToTileXY
 */
BingMapsImageryProvider.tileXYToQuadKey = function (x, y, level) {
  let quadkey = "";
  for (let i = level; i >= 0; --i) {
    const bitmask = 1 << i;
    let digit = 0;

    if ((x & bitmask) !== 0) {
      digit |= 1;
    }

    if ((y & bitmask) !== 0) {
      digit |= 2;
    }

    quadkey += digit;
  }
  return quadkey;
};

/**
 * 将用于从 Bing Maps 服务器请求图像的瓦片的 quad 键转换为
 * （x， y， level） 位置。
 *
 * @param {string} quadkey 瓦片的四键
 *
 * @see {@link http://msdn.microsoft.com/en-us/library/bb259689.aspx|Bing Maps Tile System}
 * @see BingMapsImageryProvider#tileXYToQuadKey
 */
BingMapsImageryProvider.quadKeyToTileXY = function (quadkey) {
  let x = 0;
  let y = 0;
  const level = quadkey.length - 1;
  for (let i = level; i >= 0; --i) {
    const bitmask = 1 << i;
    const digit = +quadkey[level - i];

    if ((digit & 1) !== 0) {
      x |= bitmask;
    }

    if ((digit & 2) !== 0) {
      y |= bitmask;
    }
  }
  return {
    x: x,
    y: y,
    level: level,
  };
};

BingMapsImageryProvider._logoUrl = undefined;

Object.defineProperties(BingMapsImageryProvider, {
  /**
   * 获取或设置用于在制作人员名单中显示的 Bing 徽标的 URL。
   * @memberof BingMapsImageryProvider
   * @type {string}
   */
  logoUrl: {
    get: function () {
      if (!defined(BingMapsImageryProvider._logoUrl)) {
        BingMapsImageryProvider._logoUrl = buildModuleUrl(
          "Assets/Images/bing_maps_credit.png",
        );
      }
      return BingMapsImageryProvider._logoUrl;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');

      BingMapsImageryProvider._logoUrl = value;
    },
  },
});

function buildImageResource(imageryProvider, x, y, level, request) {
  const imageUrl = imageryProvider._imageUrlTemplate;

  const subdomains = imageryProvider._imageUrlSubdomains;
  const subdomainIndex = (x + y + level) % subdomains.length;

  return imageryProvider._resource.getDerivedResource({
    url: imageUrl,
    request: request,
    templateValues: {
      quadkey: BingMapsImageryProvider.tileXYToQuadKey(x, y, level),
      subdomain: subdomains[subdomainIndex],
      culture: imageryProvider._culture,
    },
    queryParameters: {
      // this parameter tells the Bing servers to send a zero-length response
      // instead of a placeholder image for missing tiles.
      n: "z",
    },
  });
}

const intersectionScratch = new Rectangle();

function getRectangleAttribution(attributionList, level, rectangle) {
  // Bing levels start at 1, while ours start at 0.
  ++level;

  const result = [];

  for (
    let attributionIndex = 0, attributionLength = attributionList.length;
    attributionIndex < attributionLength;
    ++attributionIndex
  ) {
    const attribution = attributionList[attributionIndex];
    const coverageAreas = attribution.coverageAreas;

    let included = false;

    for (
      let areaIndex = 0, areaLength = attribution.coverageAreas.length;
      !included && areaIndex < areaLength;
      ++areaIndex
    ) {
      const area = coverageAreas[areaIndex];
      if (level >= area.zoomMin && level <= area.zoomMax) {
        const intersection = Rectangle.intersection(
          rectangle,
          area.bbox,
          intersectionScratch,
        );
        if (defined(intersection)) {
          included = true;
        }
      }
    }

    if (included) {
      result.push(attribution.credit);
    }
  }

  return result;
}

// Exposed for testing
BingMapsImageryProvider._metadataCache = {};
export default BingMapsImageryProvider;
