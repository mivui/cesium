import Check from "./Check.js";
import Credit from "./Credit.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * @callback CustomHeightmapTerrainProvider.GeometryCallback
 * @param {number} x 请求几何体瓦片的 X 坐标。
 * @param {number} y 请求几何体瓦片的 Y 坐标。
 * @param {number} level 请求几何体瓦片的层级。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]|Promise<Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]>|undefined} 行主序的高度数组或对应的 Promise。如果返回 undefined，则地球将渲染父瓦片。
 */

/**
 * 一个简单的 {@link TerrainProvider}，通过回调函数获取高度值。
 * 它可用于程序化生成地形，或在不创建 {@link TerrainProvider} 子类的情况下加载自定义高度图数据。
 *
 * 存在一些限制，例如不支持水掩码、顶点法线和可用性，因此对于这些更复杂的用例，完整的 {@link TerrainProvider} 子类更为合适。
 *
 * @alias CustomHeightmapTerrainProvider
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {CustomHeightmapTerrainProvider.GeometryCallback} options.callback 用于请求瓦片几何体的回调函数。
 * @param {number} options.width 每个高度图瓦片的列数。
 * @param {number} options.height 每个高度图瓦片的行数。
 * @param {TilingScheme} [options.tilingScheme] 指定椭球表面如何分割为瓦片的瓦片方案。如果未提供此参数，则使用 {@link GeographicTilingScheme}。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球。如果指定了 tilingScheme，则此参数将被忽略，改用瓦片方案的椭球。如果两个参数均未指定，则使用默认椭球。
 * @param {Credit|string} [options.credit] 数据源的版权信息，将显示在画布上。
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
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.callback", options.callback);
  Check.defined("options.width", options.width);
  Check.defined("options.height", options.height);
  //>>includeEnd('debug');

  this._callback = options.callback;

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: options.ellipsoid ?? Ellipsoid.default,
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
   * 获取当地形提供程序遇到异步错误时引发的事件。通过订阅此事件，您将收到错误通知并可能从中恢复。事件监听器会接收到一个 {@link TileProviderError} 实例。
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
   * 获取当地形提供程序处于活动状态时要显示的版权信息。通常用于标注地形的来源。
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
   * 获取此提供程序使用的瓦片方案。
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
   * 获取一个值，指示提供程序是否包含水掩码。水掩码用于标识地球表面哪些区域是水域而非陆地，
   * 从而可以将其渲染为带有动画波纹的反射表面。
   * {@link CustomHeightmapTerrainProvider} 不支持水掩码，因此返回值始终为 false。
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
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * {@link CustomHeightmapTerrainProvider} 不支持顶点法线，因此返回值始终为 false。
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
   * 获取一个可用于确定此提供程序地形可用性的对象，例如在点和矩形区域中查询可用性。
   * 如果不可用性信息，则此属性可能为 undefined。
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
   * 获取每个高度图瓦片的列数。
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
   * 获取每个高度图瓦片的行数。
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
 * 请求给定瓦片的几何体。结果包含地形数据，并指示所有子瓦片均可用。
 *
 * @param {number} x 请求几何体瓦片的 X 坐标。
 * @param {number} y 请求几何体瓦片的 Y 坐标。
 * @param {number} level 请求几何体瓦片的层级。
 * @param {Request} [request] 请求对象，仅限内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求几何体的 Promise。如果此方法返回 undefined 而非 Promise，则表示已有太多待处理请求，该请求将在稍后重试。
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
 * 获取给定层级瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片层级。
 * @returns {number} 最大几何误差。
 */
CustomHeightmapTerrainProvider.prototype.getLevelMaximumGeometricError =
  function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

/**
 * 确定瓦片的数据是否可供加载。
 *
 * @param {number} x 请求几何体瓦片的 X 坐标。
 * @param {number} y 请求几何体瓦片的 Y 坐标。
 * @param {number} level 请求几何体瓦片的层级。
 * @returns {boolean|undefined} 如果不支持则返回 undefined，否则返回 true 或 false。
 */
CustomHeightmapTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 确保我们为瓦片加载可用性数据。
 *
 * @param {number} x 请求几何体瓦片的 X 坐标。
 * @param {number} y 请求几何体瓦片的 Y 坐标。
 * @param {number} level 请求几何体瓦片的层级。
 * @returns {undefined|Promise<void>} 如果没有需要加载的内容则返回 undefined，否则返回当所有必需瓦片加载完成时解析的 Promise。
 */
CustomHeightmapTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default CustomHeightmapTerrainProvider;
