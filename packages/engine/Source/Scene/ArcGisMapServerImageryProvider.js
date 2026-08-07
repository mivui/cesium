import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import ArcGisMapService from "./ArcGisMapService.js";
import DiscardMissingTileImagePolicy from "./DiscardMissingTileImagePolicy.js";
import ImageryLayerFeatureInfo from "./ImageryLayerFeatureInfo.js";
import ImageryProvider from "./ImageryProvider.js";
import ArcGisBaseMapType from "./ArcGisBaseMapType.js";
import DeveloperError from "../Core/DeveloperError.js";

/**
 * @typedef {object} ArcGisMapServerImageryProvider.ConstructorOptions
 *
 * ArcGisMapServerImageryProvider 构造函数的初始化选项
 *
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否无效并应丢弃的策略。如果未指定此值，对于瓦片地图服务器使用默认 {@link DiscardMissingTileImagePolicy}，对于非瓦片地图服务器使用 {@link NeverTileDiscardPolicy}。在前一种情况下，我们请求最大瓦片级别的瓦片 0,0，并检查像素 (0,0)、(200,20)、(20,200)、(80,110) 和 (160, 130)。如果所有这些像素都是透明的，则禁用丢弃检查并且不丢弃任何瓦片。如果其中任何像素具有非透明颜色，则丢弃在这些像素位置具有相同值的任何瓦片。这些默认设置的最终结果应该是对标准 ArcGIS Server 进行正确的瓦片丢弃。要确保不丢弃任何瓦片，请为此参数构造并传递 {@link NeverTileDiscardPolicy}。
 * @property {boolean} [usePreCachedTilesIfAvailable=true] 如果为 true，则在预缓存瓦片可用时使用它们。导出瓦片仅受已弃用的 API 支持。
 * @property {string} [layers] 要显示的图层的逗号分隔列表，如果应显示所有图层则为 undefined。
 * @property {boolean} [enablePickFeatures=true] 如果为 true，{@link ArcGisMapServerImageryProvider#pickFeatures} 将调用 MapServer 上的 Identify 服务并返回响应中包含的要素。如果为 false，{@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可拾取的要素）而不与服务器通信。如果不想让此提供程序的要素可被拾取，请将此属性设置为 false。可以通过在对象上设置 {@link ArcGisMapServerImageryProvider#enablePickFeatures} 属性来覆盖。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形。在访问瓦片图层时忽略此参数。
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 用于将世界划分为瓦片的瓦片方案。在访问瓦片服务器时忽略此参数。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果指定并使用了 tilingScheme，则忽略此参数，而使用瓦片方案的椭球体。如果未指定任何参数，则使用默认椭球体。
 * @property {Credit|string} [credit] 数据源的署名，显示在画布上。在访问瓦片服务器时忽略此参数。
 * @property {number} [tileWidth=256] 每个瓦片的宽度（像素）。在访问瓦片服务器时忽略此参数。
 * @property {number} [tileHeight=256] 每个瓦片的高度（像素）。在访问瓦片服务器时忽略此参数。
 * @property {number} [maximumLevel] 请求的最大瓦片级别，如果没有最大值则为 undefined。在访问瓦片服务器时忽略此参数。
 *
 *
 */

/**
 * Used to track creation details while fetching initial metadata
 *
 * @constructor
 * @private
 *
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} options An object describing initialization options
 */
function ImageryProviderBuilder(options) {
  this.useTiles = options.usePreCachedTilesIfAvailable ?? true;

  const ellipsoid = options.ellipsoid;
  this.tilingScheme =
    options.tilingScheme ??
    new GeographicTilingScheme({ ellipsoid: ellipsoid });
  this.rectangle = options.rectangle ?? this.tilingScheme.rectangle;
  this.ellipsoid = ellipsoid;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this.credit = credit;
  this.tileCredits = undefined;
  this.tileDiscardPolicy = options.tileDiscardPolicy;

  this.tileWidth = options.tileWidth ?? 256;
  this.tileHeight = options.tileHeight ?? 256;
  this.maximumLevel = options.maximumLevel;
}

/**
 * Complete ArcGisMapServerImageryProvider creation based on builder values.
 *
 * @private
 *
 * @param {ArcGisMapServerImageryProvider} provider
 */
ImageryProviderBuilder.prototype.build = function (provider) {
  provider._useTiles = this.useTiles;
  provider._tilingScheme = this.tilingScheme;
  provider._rectangle = this.rectangle;
  provider._credit = this.credit;
  provider._tileCredits = this.tileCredits;
  provider._tileDiscardPolicy = this.tileDiscardPolicy;
  provider._tileWidth = this.tileWidth;
  provider._tileHeight = this.tileHeight;
  provider._maximumLevel = this.maximumLevel;

  // Install the default tile discard policy if none has been supplied.
  if (this.useTiles && !defined(this.tileDiscardPolicy)) {
    provider._tileDiscardPolicy = new DiscardMissingTileImagePolicy({
      missingImageUrl: buildImageResource(provider, 0, 0, this.maximumLevel)
        .url,
      pixelsToCheck: [
        new Cartesian2(0, 0),
        new Cartesian2(200, 20),
        new Cartesian2(20, 200),
        new Cartesian2(80, 110),
        new Cartesian2(160, 130),
      ],
      disableCheckIfAllPixelsAreTransparent: true,
    });
  }
};

function metadataSuccess(data, imageryProviderBuilder) {
  const tileInfo = data.tileInfo;
  if (!defined(tileInfo)) {
    imageryProviderBuilder.useTiles = false;
  } else {
    imageryProviderBuilder.tileWidth = tileInfo.rows;
    imageryProviderBuilder.tileHeight = tileInfo.cols;

    if (
      tileInfo.spatialReference.wkid === 102100 ||
      tileInfo.spatialReference.wkid === 102113
    ) {
      imageryProviderBuilder.tilingScheme = new WebMercatorTilingScheme({
        ellipsoid: imageryProviderBuilder.ellipsoid,
      });
    } else if (data.tileInfo.spatialReference.wkid === 4326) {
      imageryProviderBuilder.tilingScheme = new GeographicTilingScheme({
        ellipsoid: imageryProviderBuilder.ellipsoid,
      });
    } else {
      const message = `Tile spatial reference WKID ${data.tileInfo.spatialReference.wkid} is not supported.`;
      throw new RuntimeError(message);
    }
    imageryProviderBuilder.maximumLevel = data.tileInfo.lods.length - 1;

    if (defined(data.fullExtent)) {
      if (
        defined(data.fullExtent.spatialReference) &&
        defined(data.fullExtent.spatialReference.wkid)
      ) {
        if (
          data.fullExtent.spatialReference.wkid === 102100 ||
          data.fullExtent.spatialReference.wkid === 102113
        ) {
          const projection = new WebMercatorProjection();
          const extent = data.fullExtent;
          const sw = projection.unproject(
            new Cartesian3(
              Math.max(
                extent.xmin,
                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI,
              ),
              Math.max(
                extent.ymin,
                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI,
              ),
              0.0,
            ),
          );
          const ne = projection.unproject(
            new Cartesian3(
              Math.min(
                extent.xmax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI,
              ),
              Math.min(
                extent.ymax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI,
              ),
              0.0,
            ),
          );
          imageryProviderBuilder.rectangle = new Rectangle(
            sw.longitude,
            sw.latitude,
            ne.longitude,
            ne.latitude,
          );
        } else if (data.fullExtent.spatialReference.wkid === 4326) {
          imageryProviderBuilder.rectangle = Rectangle.fromDegrees(
            data.fullExtent.xmin,
            data.fullExtent.ymin,
            data.fullExtent.xmax,
            data.fullExtent.ymax,
          );
        } else {
          const extentMessage = `fullExtent.spatialReference WKID ${data.fullExtent.spatialReference.wkid} is not supported.`;
          throw new RuntimeError(extentMessage);
        }
      }
    } else {
      imageryProviderBuilder.rectangle =
        imageryProviderBuilder.tilingScheme.rectangle;
    }

    imageryProviderBuilder.useTiles = true;
  }

  if (defined(data.copyrightText) && data.copyrightText.length > 0) {
    if (defined(imageryProviderBuilder.credit)) {
      imageryProviderBuilder.tileCredits = [new Credit(data.copyrightText)];
    } else {
      imageryProviderBuilder.credit = new Credit(data.copyrightText);
    }
  }
}

function metadataFailure(resource, error) {
  let message = `An error occurred while accessing ${resource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  throw new RuntimeError(message);
}

async function requestMetadata(resource, imageryProviderBuilder) {
  const jsonResource = resource.getDerivedResource({
    queryParameters: {
      f: "json",
    },
  });

  try {
    const data = await jsonResource.fetchJson();
    metadataSuccess(data, imageryProviderBuilder);
  } catch (error) {
    metadataFailure(resource, error);
  }
}

/**
 * <div class="notice">
 * 此对象通常不直接实例化，请使用 {@link ArcGisMapServerImageryProvider.fromBasemapType} 或 {@link ArcGisMapServerImageryProvider.fromUrl}。
 * </div>
 *
 * 提供由 ArcGIS MapServer 托管的瓦片影像。默认情况下，如果可用，则使用服务器的预缓存瓦片。
 *
 * <br/>
 *
 * 需要 {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS 访问令牌 } 来验证对 ArcGIS 图像瓦片服务的请求。
 * 要访问安全的 ArcGIS 资源，需要创建 ArcGIS 开发者帐户或 ArcGIS 在线帐户，然后实现身份验证方法以获取访问令牌。
 *
 * @alias ArcGisMapServerImageryProvider
 * @constructor
 *
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see ArcGisMapServerImageryProvider.fromBasemapType
 * @see ArcGisMapServerImageryProvider.fromUrl
 *
 * @example
 * // 设置访问 ArcGIS 图像瓦片服务的默认访问令牌
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 *
 * // 从默认 ArcGIS 底图添加基础图层
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *       Cesium.ArcGisBaseMapType.SATELLITE
 *     )
 *   ),
 * });
 *
 * @example
 * // 直接从 URL 创建影像提供程序
 * const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
 *   "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer", {
 *     token: "<ArcGIS Access Token>"
 * });
 *
 * @see {@link https://developers.arcgis.com/rest/|ArcGIS Server REST API}
 * @see {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS Access Token }

 */
function ArcGisMapServerImageryProvider(options) {
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

  this._tileDiscardPolicy = options.tileDiscardPolicy;
  this._tileWidth = options.tileWidth ?? 256;
  this._tileHeight = options.tileHeight ?? 256;
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme =
    options.tilingScheme ??
    new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._useTiles = options.usePreCachedTilesIfAvailable ?? true;
  this._rectangle = options.rectangle ?? this._tilingScheme.rectangle;
  this._layers = options.layers;
  this._credit = options.credit;
  this._tileCredits = undefined;

   /**
    * 获取或设置一个值，该值指示是否启用要素拾取。如果为 true，{@link ArcGisMapServerImageryProvider#pickFeatures} 将在 ArcGIS 服务器上调用 "identify" 操作并返回响应中包含的要素。如果为 false，{@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可拾取的要素）而不与服务器通信。
    * @type {boolean}
    * @default true
    */
  this.enablePickFeatures = options.enablePickFeatures ?? true;

  this._errorEvent = new Event();
}

/**
 * 创建一个 {@link ImageryProvider}，提供来自 ArcGIS 底图的瓦片影像。
 * @param {ArcGisBaseMapType} style ArcGIS 底图影像的样式。有效选项为 {@link ArcGisBaseMapType.SATELLITE}、{@link ArcGisBaseMapType.OCEANS} 和 {@link ArcGisBaseMapType.HILLSHADE}。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<ArcGisMapServerImageryProvider>} 解析为创建的 ArcGisMapServerImageryProvider 的 Promise。
 *
 * @example
 * // 设置访问 ArcGIS 图像瓦片服务的默认访问令牌
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 *
 * // 从默认 ArcGIS 底图添加基础图层
 * const provider = await Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *   Cesium.ArcGisBaseMapType.SATELLITE);
 *
 * @example
 * // 从默认 ArcGIS 底图添加基础图层
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *       Cesium.ArcGisBaseMapType.HILLSHADE, {
 *         token: "<ArcGIS Access Token>"
 *       }
 *     )
 *   ),
 * });
 */

ArcGisMapServerImageryProvider.fromBasemapType = async function (
  style,
  options,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("style", style);
  //>>includeEnd('debug');

  options = options ?? Frozen.EMPTY_OBJECT;
  let accessToken;
  let server;
  let warningCredit;
  switch (style) {
    case ArcGisBaseMapType.SATELLITE:
      {
        accessToken = options.token ?? ArcGisMapService.defaultAccessToken;
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldImageryServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.OCEANS:
      {
        accessToken = options.token ?? ArcGisMapService.defaultAccessToken;
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldOceanServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.HILLSHADE:
      {
        accessToken = options.token ?? ArcGisMapService.defaultAccessToken;
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldHillshadeServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    default:
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(`Unsupported basemap type: ${style}`);
    //>>includeEnd('debug');
  }

  return ArcGisMapServerImageryProvider.fromUrl(server, {
    ...options,
    token: accessToken,
    credit: warningCredit,
    usePreCachedTilesIfAvailable: true, // ArcGIS Base Map Service Layers only support Tiled views
  });
};

function buildImageResource(imageryProvider, x, y, level, request) {
  let resource;
  if (imageryProvider._useTiles) {
    resource = imageryProvider._resource.getDerivedResource({
      url: `tile/${level}/${y}/${x}`,
      request: request,
    });
  } else {
    const nativeRectangle =
      imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);
    const bbox = `${nativeRectangle.west},${nativeRectangle.south},${nativeRectangle.east},${nativeRectangle.north}`;

    const query = {
      bbox: bbox,
      size: `${imageryProvider._tileWidth},${imageryProvider._tileHeight}`,
      format: "png32",
      transparent: true,
      f: "image",
    };

    if (
      imageryProvider._tilingScheme.projection instanceof GeographicProjection
    ) {
      query.bboxSR = 4326;
      query.imageSR = 4326;
    } else {
      query.bboxSR = 3857;
      query.imageSR = 3857;
    }
    if (imageryProvider.layers) {
      query.layers = `show:${imageryProvider.layers}`;
    }

    resource = imageryProvider._resource.getDerivedResource({
      url: "export",
      request: request,
      queryParameters: query,
    });
  }
  return resource;
}

Object.defineProperties(ArcGisMapServerImageryProvider.prototype, {
  /**
   * 获取 ArcGIS MapServer 的 URL。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource._url;
    },
  },

  /**
   * 获取用于向 ArcGis MapServer 服务进行身份验证的 ArcGIS 令牌。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  token: {
    get: function () {
      return this._resource.queryParameters.token;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度（像素）。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（像素）。
   * @memberof ArcGisMapServerImageryProvider.prototype
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
   * @memberof ArcGisMapServerImageryProvider.prototype
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
   * @memberof ArcGisMapServerImageryProvider.prototype
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
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形（以弧度为单位）。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果此函数返回 undefined，则不过滤任何瓦片。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取一个事件，该事件在影像提供程序遇到异步错误时触发。通过订阅该事件，您将收到错误通知并可能从中恢复。事件监听器会接收到 {@link TileProviderError} 的实例。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在此影像提供程序处于活动状态时显示的署名。通常用于为影像来源署名。
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供程序是否正在使用 ArcGIS MapServer 的预缓存瓦片。
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {boolean}
   * @readonly
   * @default true
   */
  usingPrecachedTiles: {
    get: function () {
      return this._useTiles;
    },
  },

  /**
   * 获取一个值，指示此影像提供程序提供的图像是否包含 alpha 通道。如果此属性为 false，则将忽略 alpha 通道（如果存在）。如果此属性为 true，则任何没有 alpha 通道的图像将被视为其 alpha 值在所有位置均为 1.0。当此属性为 false 时，可减少内存使用和纹理上传时间。
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {boolean}
   * @readonly
   * @default true
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },

  /**
   * 获取要显示的图层 ID 的逗号分隔列表。
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {string}
   */
  layers: {
    get: function () {
      return this._layers;
    },
  },
});

/**
 * 创建一个 {@link ImageryProvider}，提供由 ArcGIS MapServer 托管的瓦片影像。默认情况下，如果可用，则使用服务器的预缓存瓦片。
 *
 * @param {Resource|string} url ArcGIS MapServer 服务的 URL。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<ArcGisMapServerImageryProvider>} 解析为创建的 ArcGisMapServerImageryProvider 的 Promise。
 *
 * @example
 * const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
 *     "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
 * );
 *
 * @exception {RuntimeError} metadata spatial reference specifies an unknown WKID
 * @exception {RuntimeError} metadata fullExtent.spatialReference specifies an unknown WKID
 */
ArcGisMapServerImageryProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = options ?? Frozen.EMPTY_OBJECT;

  const resource = Resource.createIfNeeded(url);
  resource.appendForwardSlash();

  if (defined(options.token)) {
    resource.setQueryParameters({
      token: options.token,
    });
  }

  const provider = new ArcGisMapServerImageryProvider(options);
  provider._resource = resource;
  const imageryProviderBuilder = new ImageryProviderBuilder(options);
  const useTiles = options.usePreCachedTilesIfAvailable ?? true;
  if (useTiles) {
    await requestMetadata(resource, imageryProviderBuilder);
  }

  imageryProviderBuilder.build(provider);
  return provider;
};

/**
 * 获取在显示给定瓦片时要显示的署名。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要显示的署名。
 */
ArcGisMapServerImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return this._tileCredits;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 图像的 Promise，将在图像可用时解析，如果向服务器的活动请求过多，则返回 undefined，请求应稍后重试。
 */
ArcGisMapServerImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  return ImageryProvider.loadImage(
    this,
    buildImageResource(this, x, y, level, request),
  );
};

/**
 * 异步确定在瓦片内给定经度和纬度处存在哪些要素（如果有）。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude 拾取要素的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 拾取要素的 Promise，将在异步拾取完成时解析。解析值为 {@link ImageryLayerFeatureInfo} 实例的数组。如果在给定位置未找到要素，则数组可能为空。
 */
ArcGisMapServerImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  if (!this.enablePickFeatures) {
    return undefined;
  }

  const rectangle = this._tilingScheme.tileXYToNativeRectangle(x, y, level);

  let horizontal;
  let vertical;
  let sr;
  if (this._tilingScheme.projection instanceof GeographicProjection) {
    horizontal = CesiumMath.toDegrees(longitude);
    vertical = CesiumMath.toDegrees(latitude);
    sr = "4326";
  } else {
    const projected = this._tilingScheme.projection.project(
      new Cartographic(longitude, latitude, 0.0),
    );
    horizontal = projected.x;
    vertical = projected.y;
    sr = "3857";
  }

  let layers = "visible";
  if (defined(this._layers)) {
    layers += `:${this._layers}`;
  }

  const query = {
    f: "json",
    tolerance: 2,
    geometryType: "esriGeometryPoint",
    geometry: `${horizontal},${vertical}`,
    mapExtent: `${rectangle.west},${rectangle.south},${rectangle.east},${rectangle.north}`,
    imageDisplay: `${this._tileWidth},${this._tileHeight},96`,
    sr: sr,
    layers: layers,
  };

  const resource = this._resource.getDerivedResource({
    url: "identify",
    queryParameters: query,
  });

  return resource.fetchJson().then(function (json) {
    const result = [];

    const features = json.results;
    if (!defined(features)) {
      return result;
    }

    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];

      const featureInfo = new ImageryLayerFeatureInfo();
      featureInfo.data = feature;
      featureInfo.name = feature.value;
      featureInfo.properties = feature.attributes;
      featureInfo.configureDescriptionFromProperties(feature.attributes);

      // If this is a point feature, use the coordinates of the point.
      if (feature.geometryType === "esriGeometryPoint" && feature.geometry) {
        const wkid =
          feature.geometry.spatialReference &&
          feature.geometry.spatialReference.wkid
            ? feature.geometry.spatialReference.wkid
            : 4326;
        if (wkid === 4326 || wkid === 4283) {
          featureInfo.position = Cartographic.fromDegrees(
            feature.geometry.x,
            feature.geometry.y,
            feature.geometry.z,
          );
        } else if (wkid === 102100 || wkid === 900913 || wkid === 3857) {
          const projection = new WebMercatorProjection();
          featureInfo.position = projection.unproject(
            new Cartesian3(
              feature.geometry.x,
              feature.geometry.y,
              feature.geometry.z,
            ),
          );
        }
      }

      result.push(featureInfo);
    }

    return result;
  });
};
ArcGisMapServerImageryProvider._metadataCache = {};
export default ArcGisMapServerImageryProvider;
