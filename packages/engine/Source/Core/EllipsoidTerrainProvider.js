import Frozen from "./Frozen.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * 一个非常简单的{@link TerrainProvider}，通过对椭球表面进行细分来生成几何图形。
 *
 * @alias EllipsoidTerrainProvider
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {TilingScheme} [options.tilingScheme] 指定椭球表面如何分割为瓦片的瓦片方案。如果未提供此参数，则使用{@link GeographicTilingScheme}。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球体。如果指定了tilingScheme，则此参数将被忽略，转而使用瓦片方案的椭球体。如果两者都未指定，则使用默认椭球体。
 *
 * @see TerrainProvider
 */
function EllipsoidTerrainProvider(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: options.ellipsoid ?? Ellipsoid.default,
    });
  }

  // Note: the 64 below does NOT need to match the actual vertex dimensions, because
  // the ellipsoid is significantly smoother than actual terrain.
  this._levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      64,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    );

  this._errorEvent = new Event();
}

Object.defineProperties(EllipsoidTerrainProvider.prototype, {
  /**
   * 获取当地形提供程序遇到异步错误时引发的事件。通过订阅此事件，您将收到错误通知并可能从中恢复。事件监听器会收到{@link TileProviderError}的实例。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当此地形提供程序处于活动状态时要显示的信用声明。通常用于标注地形的来源。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取此提供程序使用的瓦片方案。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {GeographicTilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，指示提供程序是否包含水掩码。水掩码用于标识地球上的水域区域而非陆地，以便将其渲染为带有动画波纹的反射表面。
   * @memberof EllipsoidTerrainProvider.prototype
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
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },
  /**
   * 获取一个可用于确定此提供程序地形可用性的对象，例如在点和矩形中。如果可用性信息不可用，此属性可能为undefined。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {TileAvailability|undefined}
   * @readonly
   */
  availability: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * 请求给定瓦片的几何数据。结果包含地形数据并指示所有子瓦片都可用。
 *
 * @param {number} x 请求几何数据的瓦片X坐标。
 * @param {number} y 请求几何数据的瓦片Y坐标。
 * @param {number} level 请求几何数据的瓦片层级。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求几何数据的Promise。如果此方法返回undefined而不是Promise，则表示已有太多待处理请求，稍后将重试该请求。
 */
EllipsoidTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const width = 16;
  const height = 16;
  return Promise.resolve(
    new HeightmapTerrainData({
      buffer: new Uint8Array(width * height),
      width: width,
      height: height,
    }),
  );
};

/**
 * 获取给定层级瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片层级。
 * @returns {number} 最大几何误差。
 */
EllipsoidTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level,
) {
  return this._levelZeroMaximumGeometricError / (1 << level);
};

/**
 * 确定瓦片的数据是否可加载。
 *
 * @param {number} x 请求几何数据的瓦片X坐标。
 * @param {number} y 请求几何数据的瓦片Y坐标。
 * @param {number} level 请求几何数据的瓦片层级。
 * @returns {boolean|undefined} 如果不支持则返回undefined，否则返回true或false。
 */
EllipsoidTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 确保我们为瓦片加载可用性数据
 *
 * @param {number} x 请求几何数据的瓦片X坐标。
 * @param {number} y 请求几何数据的瓦片Y坐标。
 * @param {number} level 请求几何数据的瓦片层级。
 * @returns {undefined} 此提供程序不支持加载可用性数据。
 */
EllipsoidTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default EllipsoidTerrainProvider;
