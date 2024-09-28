import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * @callback CustomHeightmapTerrainProvider.GeometryCallback
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]|Promise<Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]>|undefined} 按行优先顺序对高度数组的数组或 Promise。如果未定义，则地球将呈现父瓦片。
 */

/**
 * 一个简单的 {@link TerrainProvider}，用于从回调函数获取高度值。
 * 它可以用于程序生成的地形，也可以作为加载自定义的一种方式
 * 高度贴图数据，而无需创建 {@link TerrainProvider} 的子类。
 *
 * 存在一些限制，例如无水遮罩、无顶点法线和无
 * 可用性，因此成熟的 {@link TerrainProvider} 子类更合适
 * 对于这些更复杂的用例。
 *
 * @alias CustomHeightmapTerrainProvider
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {CustomHeightmapTerrainProvider.GeometryCallback} options.callback 用于请求瓦片几何体的回调函数。
 * @param {number} options.width 每个高度贴图瓦片的列数。
 * @param {number} options.height 每个高度贴图瓦片的行数。
 * @param {TilingScheme} [options.tilingScheme] 指定椭球体如何
 * 表面被打碎成图块。如果未提供此参数，则 {@link GeographicTilingScheme}
 * 被使用。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球体。 如果指定了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用默认椭球。
 * @param {Credit|string} [options.credit] 数据源的积分，显示在画布上。
 *
 * @example
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrainProvider: new Cesium.CustomHeightmapTerrainProvider({
 *     width: 32,
 *     height: 32,
 *     callback: function (x, y, level) {
 *       return new Float32Array(32 * 32); // all zeros
 *     },
 *   }),
 * });
 *
 * @see TerrainProvider
 */
function CustomHeightmapTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.callback", options.callback);
  Check.defined("options.width", options.width);
  Check.defined("options.height", options.height);
  //>>includeEnd('debug');

  this._callback = options.callback;

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: defaultValue(options.ellipsoid, Ellipsoid.default),
    });
  }

  this._width = options.width;
  this._height = options.height;
  const maxTileDimensions = Math.max(this._width, this._height);

  this._levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      maxTileDimensions,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    );

  this._errorEvent = new Event();

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;
}

Object.defineProperties(CustomHeightmapTerrainProvider.prototype, {
  /**
   * 获取 terrain 提供程序遇到异步错误时引发的事件。通过订阅
   * 时，您将收到错误通知，并可能从中恢复。事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取此地形提供程序处于活动状态时要显示的信用额度。通常，这用于贷记
   * 地形的源。
   * @memberof CustomHeightmapTerrainProvider.prototype
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
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，该值指示提供程序是否包含水面罩。水面罩
   * 表示地球上的哪些区域是水面而不是陆地，因此可以渲染它们
   * 作为具有动画波形的反射表面。
   * {@link CustomHeightmapTerrainProvider} 不支持水遮罩，因此返回
   * 值将始终为 false。
   * @memberof CustomHeightmapTerrainProvider.prototype
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
   * {@link CustomHeightmapTerrainProvider} 不支持顶点法线，因此返回
   * 值将始终为 false。
   * @memberof CustomHeightmapTerrainProvider.prototype
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
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */
  availability: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取每个高度贴图平铺的列数。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  width: {
    get: function () {
      return this._width;
    },
  },

  /**
   * 获取每个高度贴图平铺的行数。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  height: {
    get: function () {
      return this._height;
    },
  },
});

/**
 * 请求给定图块的几何图形。结果包括 terrain
 * 数据，并指示所有子磁贴都可用。
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求的 geometry 的 Promise。如果此方法
 *         返回未定义而不是承诺，这表明已经有太多请求
 *         等待中，请求将稍后重试。
 */
CustomHeightmapTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const promise = this._callback(x, y, level);
  if (!defined(promise)) {
    return undefined;
  }

  const width = this._width;
  const height = this._height;

  return Promise.resolve(promise).then(function (heightmapData) {
    let buffer = heightmapData;
    if (Array.isArray(buffer)) {
      // HeightmapTerrainData expects a TypedArray, so convert from number[] to Float64Array
      buffer = new Float64Array(buffer);
    }

    return new HeightmapTerrainData({
      buffer: buffer,
      width: width,
      height: height,
    });
  });
};

/**
 *获取给定级别的贴图中允许的最大几何误差。
 *
 * @param {number} level 要获得最大几何误差的瓦片水平。
 * @returns {number} 最大几何误差。
 */
CustomHeightmapTerrainProvider.prototype.getLevelMaximumGeometricError =
  function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

/**
 * 确定是否可以加载磁贴的数据。
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {boolean|undefined} 如果不支持则未定义，否则为true或false。
 */
CustomHeightmapTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
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
CustomHeightmapTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default CustomHeightmapTerrainProvider;
