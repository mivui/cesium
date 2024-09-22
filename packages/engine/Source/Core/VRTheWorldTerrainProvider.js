import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import getImagePixels from "./getImagePixels.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import RuntimeError from "./RuntimeError.js";
import TerrainProvider from "./TerrainProvider.js";
import TileProviderError from "./TileProviderError.js";

function DataRectangle(rectangle, maxLevel) {
  this.rectangle = rectangle;
  this.maxLevel = maxLevel;
}

/**
 * @typedef {Object} VRTheWorldTerrainProvider.ConstructorOptions
 *
 * VRTheWorldTerrainProvider 构造函数的初始化选项
 *
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。 如果未指定，则使用默认椭球体。
 * @property {Credit|string} [credit] 数据源的积分，显示在画布上。
 */

/**
 * 用于在获取初始元数据时跟踪创建详细信息
 *
 * @constructor
 * @private
 *
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} options 描述初始化选项的对象
 */
function TerrainProviderBuilder(options) {
  this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this.tilingScheme = undefined;
  this.heightmapWidth = undefined;
  this.heightmapHeight = undefined;
  this.levelZeroMaximumGeometricError = undefined;
  this.rectangles = [];
}

TerrainProviderBuilder.prototype.build = function (provider) {
  provider._tilingScheme = this.tilingScheme;
  provider._heightmapWidth = this.heightmapWidth;
  provider._heightmapHeight = this.heightmapHeight;
  provider._levelZeroMaximumGeometricError = this.levelZeroMaximumGeometricError;
  provider._rectangles = this.rectangles;
};

function metadataSuccess(terrainProviderBuilder, xml) {
  const srs = xml.getElementsByTagName("SRS")[0].textContent;
  if (srs === "EPSG:4326") {
    terrainProviderBuilder.tilingScheme = new GeographicTilingScheme({
      ellipsoid: terrainProviderBuilder.ellipsoid,
    });
  } else {
    throw new RuntimeError(`SRS ${srs} is not supported`);
  }

  const tileFormat = xml.getElementsByTagName("TileFormat")[0];
  terrainProviderBuilder.heightmapWidth = parseInt(
    tileFormat.getAttribute("width"),
    10
  );
  terrainProviderBuilder.heightmapHeight = parseInt(
    tileFormat.getAttribute("height"),
    10
  );
  terrainProviderBuilder.levelZeroMaximumGeometricError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
    terrainProviderBuilder.ellipsoid,
    Math.min(
      terrainProviderBuilder.heightmapWidth,
      terrainProviderBuilder.heightmapHeight
    ),
    terrainProviderBuilder.tilingScheme.getNumberOfXTilesAtLevel(0)
  );

  const dataRectangles = xml.getElementsByTagName("DataExtent");

  for (let i = 0; i < dataRectangles.length; ++i) {
    const dataRectangle = dataRectangles[i];

    const west = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("minx"))
    );
    const south = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("miny"))
    );
    const east = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("maxx"))
    );
    const north = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("maxy"))
    );
    const maxLevel = parseInt(dataRectangle.getAttribute("maxlevel"), 10);

    terrainProviderBuilder.rectangles.push(
      new DataRectangle(new Rectangle(west, south, east, north), maxLevel)
    );
  }
}

function metadataFailure(resource, error, provider) {
  let message = `An error occurred while accessing ${resource.url}`;

  if (defined(error) && defined(error.message)) {
    message = `${message}: ${error.message}`;
  }

  TileProviderError.reportError(
    undefined,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message
  );

  throw new RuntimeError(message);
}

async function requestMetadata(terrainProviderBuilder, resource, provider) {
  try {
    const xml = await resource.fetchXML();
    metadataSuccess(terrainProviderBuilder, xml);
  } catch (error) {
    metadataFailure(resource, error, provider);
  }
}

/**
 * <div class="notice">
 * 要构造 VRTheWorldTerrainProvider，请调用 {@link VRTheWorldTerrainProvider.fromUrl}. 不要直接调用构造函数。
 * </div>
 ** 一个 {@link TerrainProvider}，它通过曲面细分高度贴图来生成地形几何体。
 * 取自 {@link http://vr-theworld.com/|VT MÄK VR-TheWorld server}.
 *
 * @alias VRTheWorldTerrainProvider
 * @constructor
 *
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} [options]  描述初始化选项的对象.
 *
 * @example
 * const terrainProvider = await Cesium.VRTheWorldTerrainProvider.fromUrl(
 *   "https://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/"
 * );
 * viewer.terrainProvider = terrainProvider;
 *
 * @see TerrainProvider
 */
function VRTheWorldTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._errorEvent = new Event();

  this._terrainDataStructure = {
    heightScale: 1.0 / 1000.0,
    heightOffset: -1000.0,
    elementsPerHeight: 3,
    stride: 4,
    elementMultiplier: 256.0,
    isBigEndian: true,
    lowestEncodedHeight: 0,
    highestEncodedHeight: 256 * 256 * 256 - 1,
  };

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  this._tilingScheme = undefined;
  this._rectangles = [];
}

Object.defineProperties(VRTheWorldTerrainProvider.prototype, {
  /**
   * 获取 terrain 提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取此地形提供程序处于活动状态时要显示的信用额度。 通常，这用于贷记
   * 地形的源。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取此提供程序使用的平铺方案。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {GeographicTilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，该值指示提供程序是否包含水面罩。 水面罩
   * 表示地球上的哪些区域是水面而不是陆地，因此可以渲染它们
   * 作为具有动画波形的反射表面。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个值，该值指示请求的图块是否包含顶点法线。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },
  /**
   * 获取一个对象，该对象可用于确定此提供程序提供的地形的可用性，例如
   * 在点和矩形中。如果可用性
   * 信息不可用。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */
  availability: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * 创建一个 {@link TerrainProvider}，通过曲面细分高度贴图来生成地形几何体
 * 取自 {@link http://vr-theworld.com/|VT MÄK VR-TheWorld server}.
 *
 * @param {Resource|String} url VR-TheWorld TileMap 的 URL。
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} [options] An 描述初始化选项的对象.
 * @returns {Promise<VRTheWorldTerrainProvider>}
 *
 * @example
 * const terrainProvider = await Cesium.VRTheWorldTerrainProvider.fromUrl(
 *   "https://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/"
 * );
 * viewer.terrainProvider = terrainProvider;
 *
 * @exception {RuntimeError} metadata specifies and unknown SRS
 */
VRTheWorldTerrainProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const terrainProviderBuilder = new TerrainProviderBuilder(options);
  const resource = Resource.createIfNeeded(url);

  await requestMetadata(terrainProviderBuilder, resource);

  const provider = new VRTheWorldTerrainProvider(options);
  terrainProviderBuilder.build(provider);
  provider._resource = resource;

  return provider;
};

/**
 * 请求给定图块的几何图形。结果包括 terrain
 * 数据，并指示所有子磁贴都可用。
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<TerrainData>|undefined} 对所请求几何图形的承诺。如果这种方法
 *         返回未定义而不是承诺，这表明已经有太多请求
 *         等待中，请求将稍后重试。
 */
VRTheWorldTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request
) {
  const yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);
  const resource = this._resource.getDerivedResource({
    url: `${level}/${x}/${yTiles - y - 1}.tif`,
    queryParameters: {
      cesium: true,
    },
    request: request,
  });
  const promise = resource.fetchImage({
    preferImageBitmap: true,
  });
  if (!defined(promise)) {
    return undefined;
  }

  const that = this;
  return Promise.resolve(promise).then(function (image) {
    return new HeightmapTerrainData({
      buffer: getImagePixels(image),
      width: that._heightmapWidth,
      height: that._heightmapHeight,
      childTileMask: getChildMask(that, x, y, level),
      structure: that._terrainDataStructure,
    });
  });
};

/**
 *获取给定级别的贴图中允许的最大几何误差。
 *
 * @param {number} level 要获得最大几何误差的瓦片水平。
 * @returns {number} 最大几何误差。
 */
VRTheWorldTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level
) {
  return this._levelZeroMaximumGeometricError / (1 << level);
};

const rectangleScratch = new Rectangle();

function getChildMask(provider, x, y, level) {
  const tilingScheme = provider._tilingScheme;
  const rectangles = provider._rectangles;
  const parentRectangle = tilingScheme.tileXYToRectangle(x, y, level);

  let childMask = 0;

  for (let i = 0; i < rectangles.length && childMask !== 15; ++i) {
    const rectangle = rectangles[i];
    if (rectangle.maxLevel <= level) {
      continue;
    }

    const testRectangle = rectangle.rectangle;

    const intersection = Rectangle.intersection(
      testRectangle,
      parentRectangle,
      rectangleScratch
    );
    if (defined(intersection)) {
      // Parent tile is inside this rectangle, so at least one child is, too.
      if (
        isTileInRectangle(tilingScheme, testRectangle, x * 2, y * 2, level + 1)
      ) {
        childMask |= 4; // northwest
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2 + 1,
          y * 2,
          level + 1
        )
      ) {
        childMask |= 8; // northeast
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2,
          y * 2 + 1,
          level + 1
        )
      ) {
        childMask |= 1; // southwest
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2 + 1,
          y * 2 + 1,
          level + 1
        )
      ) {
        childMask |= 2; // southeast
      }
    }
  }

  return childMask;
}

function isTileInRectangle(tilingScheme, rectangle, x, y, level) {
  const tileRectangle = tilingScheme.tileXYToRectangle(x, y, level);
  return defined(
    Rectangle.intersection(tileRectangle, rectangle, rectangleScratch)
  );
}

/**
 * 确定是否可以加载磁贴的数据。
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {boolean|undefined} 如果不支持则未定义，否则为true或false。
 */
VRTheWorldTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level
) {
  return undefined;
};

/**
 * 确保我们为tile加载了可用性数据
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {undefined|Promise<void>} 如果不需要加载任何内容，则为 Undefined，或者在加载所有必需的图块时解析的 Promise
 */
VRTheWorldTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level
) {
  return undefined;
};
export default VRTheWorldTerrainProvider;
