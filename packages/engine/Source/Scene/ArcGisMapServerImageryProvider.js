import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
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
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否
 * 无效，应丢弃。 如果未指定此值，则默认为
 * {@link DiscardMissingTileImagePolicy} 用于平铺地图服务器，而
 * {@link NeverTileDiscardPolicy} 用于非平铺地图服务器。 在前一种情况下，
 * 我们在最大瓦片级别请求瓦片 0,0 并检查像素 （0,0）、（200,20）、（20,200）、
 * （80,110） 和 （160， 130）。 如果所有这些像素都是透明的，则丢弃校验为
 * 禁用且不会丢弃任何牌。 如果其中任何一个具有不透明的颜色，则任何
 * 在这些像素位置具有相同值的瓦片将被丢弃。 的最终结果
 * 对于标准 ArcGIS Server，这些默认值应该是正确的切片丢弃。 为了确保
 * 没有丢弃任何图块，为此构造并传递一个 {@link NeverTileDiscardPolicy}
 *参数。
 * @property {boolean} [usePreCachedTilesIfAvailable=true] 如果为 true，则服务器的预缓存
 * 如果有瓦片，则使用瓦片。只有已弃用的 API 才支持导出切片。
 * @property {string} [layers] 要显示的图层的逗号分隔列表，如果应显示所有图层，则为 undefined。
 * @property {boolean} [enablePickFeatures=true] 如果为 true，则 {@link ArcGisMapServerImageryProvider#pickFeatures} 将调用
 * MapServer 上的 Identify 服务并返回响应中包含的要素。 如果为 false，则
 * {@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可选取的要素）
 * 而不与服务器通信。 如果不希望此提供程序的功能
 * 是可挑选的。可以通过在对象上设置 {@link ArcGisMapServerImageryProvider#enablePickFeatures} 属性来覆盖。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形。 访问
 * 平铺层。
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme（）] 用于将世界划分为多个图块的平铺方案。
 * 访问平铺服务器时，将忽略此参数。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。 如果指定并使用了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用默认椭球。
 * @property {Credit|string} [credit] 数据源的积分，显示在画布上。 访问平铺服务器时，将忽略此参数。
 * @property {number} [tileWidth=256] 每个图块的宽度（以像素为单位）。 访问平铺服务器时，将忽略此参数。
 * @property {number} [tileHeight=256] 每个图块的高度（以像素为单位）。 访问平铺服务器时，将忽略此参数。
 * @property {number} [maximumLevel] 要请求的最大图块级别，如果没有最大值，则为 undefined。 访问
 * 平铺服务器。
 *
 *
 */

/**
 * 用于在获取初始元数据时跟踪创建详细信息
 *
 * @constructor
 * @private
 *
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} options An 描述初始化选项的对象
 */
function ImageryProviderBuilder(options) {
  this.useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);

  const ellipsoid = options.ellipsoid;
  this.tilingScheme = defaultValue(
    options.tilingScheme,
    new GeographicTilingScheme({ ellipsoid: ellipsoid })
  );
  this.rectangle = defaultValue(options.rectangle, this.tilingScheme.rectangle);
  this.ellipsoid = ellipsoid;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this.credit = credit;
  this.tileCredits = undefined;
  this.tileDiscardPolicy = options.tileDiscardPolicy;

  this.tileWidth = defaultValue(options.tileWidth, 256);
  this.tileHeight = defaultValue(options.tileHeight, 256);
  this.maximumLevel = options.maximumLevel;
}

/**
 * 根据构建器值完成 ArcGisMapServerImageryProvider 创建。
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
                  Math.PI
              ),
              Math.max(
                extent.ymin,
                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI
              ),
              0.0
            )
          );
          const ne = projection.unproject(
            new Cartesian3(
              Math.min(
                extent.xmax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI
              ),
              Math.min(
                extent.ymax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                  Math.PI
              ),
              0.0
            )
          );
          imageryProviderBuilder.rectangle = new Rectangle(
            sw.longitude,
            sw.latitude,
            ne.longitude,
            ne.latitude
          );
        } else if (data.fullExtent.spatialReference.wkid === 4326) {
          imageryProviderBuilder.rectangle = Rectangle.fromDegrees(
            data.fullExtent.xmin,
            data.fullExtent.ymin,
            data.fullExtent.xmax,
            data.fullExtent.ymax
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
 * 提供由 ArcGIS MapServer 托管的切片影像。 默认情况下，服务器的预缓存切片为
 * 二手（如果有）。
 * 
 * <br/>
 * 
 *  {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS Access Token } 需要对 ArcGIS Image Tile 服务的请求进行身份验证。
 * 要访问安全的 ArcGIS 资源，需要创建 ArcGIS 开发人员
 * 帐户或 ArcGIS Online 帐户，然后实施身份验证方法以获取访问令牌。
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
 * // Set the default access token for accessing ArcGIS Image Tile service
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 * 
 * // Add a base layer from a default ArcGIS basemap
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *       Cesium.ArcGisBaseMapType.SATELLITE
 *     )
 *   ),
 * });
 *
 * @example
 * // Create an imagery provider from the url directly
 * const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
 *   "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer", {
 *     token: "<ArcGIS Access Token>"
 * });
 *
 * @see {@link https://developers.arcgis.com/rest/|ArcGIS Server REST API}
 * @see {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS Access Token }

 */
function ArcGisMapServerImageryProvider(options) {
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

  this._tileDiscardPolicy = options.tileDiscardPolicy;
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme = defaultValue(
    options.tilingScheme,
    new GeographicTilingScheme({ ellipsoid: options.ellipsoid })
  );
  this._useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);
  this._rectangle = defaultValue(
    options.rectangle,
    this._tilingScheme.rectangle
  );
  this._layers = options.layers;
  this._credit = options.credit;
  this._tileCredits = undefined;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }

  /**
   * 获取或设置一个值，该值指示是否启用功能选取。 如果为 true，则 {@link ArcGisMapServerImageryProvider#pickFeatures} 将
   * 在 ArcGIS 服务器上调用 “identify” 操作并返回响应中包含的要素。 如果为 false，则
   * {@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可选取的要素）
   * 而不与服务器通信。
   * @type {boolean}
   * @default true
   */
  this.enablePickFeatures = defaultValue(options.enablePickFeatures, true);

  this._errorEvent = new Event();
}

/**
 * 创建一个 {@link ImageryProvider}，用于提供来自 ArcGIS 底图的切片影像。
 * @param {ArcGisBaseMapType} 样式 ArcGIS 底图影像的样式。有效选项为 {@link ArcGisBaseMapType.SATELLITE}、{@link ArcGisBaseMapType.OCEANS} 和 {@link ArcGisBaseMapType.HILLSHADE}。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象.
 * @returns {Promise<ArcGisMapServerImageryProvider>} 解析为创建的 ArcGisMapServerImageryProvider 的 Promise。
 *
 * @example
 * // Set the default access token for accessing ArcGIS Image Tile service
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 *
 * // Add a base layer from a default ArcGIS basemap
 * const provider = await Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *   Cesium.ArcGisBaseMapType.SATELLITE);
 *
 * @example
 * // Add a base layer from a default ArcGIS Basemap
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
  options
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("style", style);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  let accessToken;
  let server;
  let warningCredit;
  switch (style) {
    case ArcGisBaseMapType.SATELLITE:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldImageryServer
        );
        server.appendForwardSlash();
        const defaultTokenCredit = ArcGisMapService.getDefaultTokenCredit(
          accessToken
        );
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.OCEANS:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldOceanServer
        );
        server.appendForwardSlash();
        const defaultTokenCredit = ArcGisMapService.getDefaultTokenCredit(
          accessToken
        );
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.HILLSHADE:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldHillshadeServer
        );
        server.appendForwardSlash();
        const defaultTokenCredit = ArcGisMapService.getDefaultTokenCredit(
          accessToken
        );
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
    const nativeRectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(
      x,
      y,
      level
    );
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
   * 获取用于对 ArcGis MapServer 服务进行身份验证的 ArcGIS 令牌。
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
   * 获取每个图块的宽度（以像素为单位）。
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
   * 获取每个图块的高度（以像素为单位）。
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
   * 获取可请求的最大详细级别。
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
   * 获取可请求的最小详细级别。
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
   * 获取此提供程序使用的切片方案。
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
   * 获取此实例提供的图像的矩形（以弧度为单位）。
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
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
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
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
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
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
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
   * 获取一个值，该值指示此影像提供商是否正在使用
   * ArcGIS 地图服务器。
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
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
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
 * 创建一个 {@link ImageryProvider}，该提供商由 ArcGIS MapServer 托管的切片影像。 默认情况下，服务器的预缓存切片为
 * 二手（如果有）。
 *
 * @param {Resource|String} url ArcGIS MapServer 服务的 URL。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象.
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

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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
  const useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);
  if (useTiles) {
    await requestMetadata(resource, imageryProviderBuilder);
  }

  imageryProviderBuilder.build(provider);
  return provider;
};

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
ArcGisMapServerImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level
) {
  return this._tileCredits;
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
ArcGisMapServerImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request
) {
  return ImageryProvider.loadImage(
    this,
    buildImageResource(this, x, y, level, request)
  );
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
 *实例。 如果在给定位置未找到要素，则数组可能为空。
 */
ArcGisMapServerImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
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
      new Cartographic(longitude, latitude, 0.0)
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
            feature.geometry.z
          );
        } else if (wkid === 102100 || wkid === 900913 || wkid === 3857) {
          const projection = new WebMercatorProjection();
          featureInfo.position = projection.unproject(
            new Cartesian3(
              feature.geometry.x,
              feature.geometry.y,
              feature.geometry.z
            )
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
