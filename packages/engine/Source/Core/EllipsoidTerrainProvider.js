import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * 一个非常简单的 {@link TerrainProvider}，它通过分割椭球体来生成几何体
 *表面。
 *
 * @alias EllipsoidTerrainProvider
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {TilingScheme} [options.tilingScheme] 指定椭球体如何
 * 表面被打碎成图块。 如果未提供此参数，则 {@link GeographicTilingScheme}
 * 被使用。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球体。 如果指定了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用默认椭球。
 *
 * @see TerrainProvider
 */
function EllipsoidTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: defaultValue(options.ellipsoid, Ellipsoid.default),
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
   * 获取 terrain 提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
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
   * 获取此地形提供程序处于活动状态时要显示的信用额度。 通常，这用于贷记
   * 地形的源。
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
   * 获取此提供程序使用的平铺方案。
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
   * 获取一个值，该值指示提供程序是否包含水面罩。 水面罩
   * 表示地球上的哪些区域是水面而不是陆地，因此可以渲染它们
   * 作为具有动画波形的反射表面。
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
   * 获取一个值，该值指示请求的图块是否包含顶点法线。
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
   * 获取一个对象，该对象可用于确定此提供程序提供的地形的可用性，例如
   * 在点和矩形中。如果可用性
   * 信息不可用。
   * @memberof EllipsoidTerrainProvider.prototype
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
 * 请求给定图块的几何图形。结果包括 terrain
 * 数据，并指示所有子磁贴都可用。
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 对所请求几何图形的承诺。如果这种方法
 *         返回未定义而不是承诺，这表明已经有太多请求
 *         等待中，请求将稍后重试。
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
 *获取给定级别的贴图中允许的最大几何误差。
 *
 * @param {number} level 要获得最大几何误差的瓦片水平。
 * @returns {number} 最大几何误差。
 */
EllipsoidTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level,
) {
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
EllipsoidTerrainProvider.prototype.getTileDataAvailable = function (
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
 * @returns {undefined} 此提供程序不支持加载可用性。
 */
EllipsoidTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default EllipsoidTerrainProvider;
