import Check from "../Core/Check.js";
import Frozen from "../Core/Frozen.js";
import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";
import IonResource from "../Core/IonResource.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const trailingSlashRegex = /\/$/;

/**
 * @typedef {object} Azure2DImageryProvider.ConstructorOptions
 *
 * Azure2DImageryProvider 构造函数的初始化选项
 *
 * @property {string} subscriptionKey 影像的公共订阅密钥。
 * @property {string} [url="https://atlas.microsoft.com/"] Azure 服务器 URL。
 * @property {string} [tilesetId="microsoft.imagery"] Azure 瓦片集 ID。有效选项为 {@link microsoft.imagery}、{@link microsoft.base.road} 和 {@link microsoft.base.labels.road}
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，则使用默认椭球体。
 * @property {number} [minimumLevel=0] 影像提供程序支持的最小细节级别。指定此值时请注意，最小级别的瓦片数量应较少，如四个或更少。较大的数字可能会导致渲染问题。
 * @property {number} [maximumLevel=22] 影像提供程序支持的最大细节级别。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形（以弧度为单位）。
 */

/**
 * 提供来自 Azure 的 2D 图像瓦片。
 *
 * @alias Azure2DImageryProvider
 * @constructor
 * @param {Azure2DImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @example
 * // Azure 2D 影像提供程序
 * const azureImageryProvider = new Cesium.Azure2DImageryProvider({
 *     subscriptionKey: "subscription-key",
 *     tilesetId: "microsoft.base.road"
 * });
 */
function Azure2DImageryProvider(options) {
  options = options ?? {};
  const tilesetId = options.tilesetId ?? "microsoft.imagery";
  this._maximumLevel = options.maximumLevel ?? 22;
  this._minimumLevel = options.minimumLevel ?? 0;

  this._subscriptionKey =
    options.subscriptionKey ?? options["subscription-key"];
  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.subscriptionKey", this._subscriptionKey);
  //>>includeEnd('debug');

  this._tilesetId = options.tilesetId;

  const resource =
    options.url instanceof IonResource
      ? options.url
      : Resource.createIfNeeded(options.url ?? "https://atlas.microsoft.com/");

  let templateUrl = resource.getUrlComponent();
  if (!trailingSlashRegex.test(templateUrl)) {
    templateUrl += "/";
  }

  const tilesUrl = `${templateUrl}map/tile`;
  this._viewportUrl = `${templateUrl}map/attribution`;

  resource.url = tilesUrl;

  resource.setQueryParameters({
    "api-version": "2024-04-01",
    tilesetId: tilesetId,
    "subscription-key": this._subscriptionKey,
    zoom: `{z}`,
    x: `{x}`,
    y: `{y}`,
  });

  this._resource = resource;

  let credit;
  if (defined(options.credit)) {
    credit = options.credit;
    if (typeof credit === "string") {
      credit = new Credit(credit);
    }
  }

  const provider = new UrlTemplateImageryProvider({
    ...options,
    maximumLevel: this._maximumLevel,
    minimumLevel: this._minimumLevel,
    url: resource,
    credit: credit,
  });
  provider._resource = resource;
  this._imageryProvider = provider;

  // This will be defined for ion resources
  this._tileCredits = resource.credits;
  this._attributionsByLevel = undefined;
}

Object.defineProperties(Azure2DImageryProvider.prototype, {
  /**
   * 获取 Azure 2D 影像服务器的 URL。
   * @memberof Azure2DImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._imageryProvider.url;
    },
  },

  /**
   * 获取实例提供的影像的矩形（以弧度为单位）。
   * @memberof Azure2DImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._imageryProvider.rectangle;
    },
  },

  /**
   * 获取每个瓦片的宽度（像素）。
   * @memberof Azure2DImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._imageryProvider.tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（像素）。
   * @memberof Azure2DImageryProvider.prototype
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
   * @memberof Azure2DImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._imageryProvider.maximumLevel;
    },
  },

  /**
   * 获取可请求的最小细节级别。通常，只有在影像的矩形足够小以至于最小级别的瓦片数量很少时才应使用最小级别。具有较多最小级别瓦片的影像提供程序将导致渲染问题。
   * @memberof Azure2DImageryProvider.prototype
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
   * @memberof Azure2DImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._imageryProvider.tilingScheme;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果此函数返回 undefined，则不过滤任何瓦片。
   * @memberof Azure2DImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取一个事件，该事件在影像提供程序遇到异步错误时触发。通过订阅该事件，您将收到错误通知并可能从中恢复。事件监听器会接收到 {@link TileProviderError} 的实例。
   * @memberof Azure2DImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._imageryProvider.errorEvent;
    },
  },

  /**
   * 获取在此影像提供程序处于活动状态时显示的署名。通常用于为影像来源署名。
   * @memberof Azure2DImageryProvider.prototype
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
   * @memberof Azure2DImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._imageryProvider.proxy;
    },
  },

  /**
   * 获取一个值，指示此影像提供程序提供的图像是否包含 alpha 通道。如果此属性为 false，则将忽略 alpha 通道（如果存在）。如果此属性为 true，则任何没有 alpha 通道的图像将被视为其 alpha 值在所有位置均为 1.0。当此属性为 false 时，可减少内存使用和纹理上传时间。
   * @memberof Azure2DImageryProvider.prototype
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
 * 获取在显示给定瓦片时要显示的署名。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]|undefined} 显示瓦片时要显示的署名。
 */
Azure2DImageryProvider.prototype.getTileCredits = function (x, y, level) {
  const hasAttributions = defined(this._attributionsByLevel);

  if (!hasAttributions || !defined(this._tileCredits)) {
    return undefined;
  }

  const innerCredits = this._attributionsByLevel.get(level);
  if (!defined(this._tileCredits)) {
    return innerCredits;
  }

  return this._tileCredits.concat(innerCredits);
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
Azure2DImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const promise = this._imageryProvider.requestImage(x, y, level, request);

  // If the requestImage call returns undefined, it couldn't be scheduled this frame. Make sure to return undefined so this can be handled upstream.
  if (!defined(promise)) {
    return undefined;
  }

  // Asynchronously request and populate _attributionsByLevel if it hasn't been already. We do this here so that the promise can be properly awaited.
  if (!defined(this._attributionsByLevel)) {
    return Promise.all([promise, this.getViewportCredits()]).then(
      (results) => results[0],
    );
  }

  return promise;
};

/**
 * 此影像提供程序当前不支持要素拾取，因此此函数仅返回 undefined。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude 拾取要素的纬度。
 * @return {undefined} 由于不支持拾取，返回 undefined。
 */
Azure2DImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};

/**
 * 获取 Azure Maps 的影像署名以显示在署名中
 * @private
 * @return {Promise<Map<number, Credit[]>>} 按级别分组的署名来源映射，用于显示在署名中
 */
Azure2DImageryProvider.prototype.getViewportCredits = async function () {
  const maximumLevel = this._maximumLevel;

  const promises = [];
  for (let level = 0; level < maximumLevel + 1; level++) {
    promises.push(
      fetchViewportAttribution(
        this._resource,
        this._viewportUrl,
        this._subscriptionKey,
        this._tilesetId,
        level,
      ),
    );
  }
  const results = await Promise.all(promises);

  const attributionsByLevel = new Map();
  for (let level = 0; level < maximumLevel + 1; level++) {
    const credits = [];
    const attributions = results[level].join(",");
    if (attributions) {
      const levelCredits = new Credit(attributions);
      credits.push(levelCredits);
    }
    attributionsByLevel.set(level, credits);
  }

  this._attributionsByLevel = attributionsByLevel;

  return attributionsByLevel;
};

/**
 * 获取视口的署名信息
 *
 * @param {Resource} resource 资源对象
 * @param {string} url 署名 API 的 URL
 * @param {string} key 订阅密钥
 * @param {string} tilesetId 瓦片集 ID
 * @param {number} level 瓦片级别
 * @returns {Promise<string[]>} 署名文本数组
 */
async function fetchViewportAttribution(resource, url, key, tilesetId, level) {
  const viewportResource = resource.getDerivedResource({
    url,
    queryParameters: {
      zoom: level,
      bounds: "-180,-90,180,90",
    },
    data: JSON.stringify(Frozen.EMPTY_OBJECT),
  });

  const viewportJson = await viewportResource.fetchJson();
  return viewportJson.copyrights;
}

// Exposed for tests
export default Azure2DImageryProvider;
