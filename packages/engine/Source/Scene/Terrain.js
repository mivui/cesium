import Check from "../Core/Check.js";
import Event from "../Core/Event.js";
import createWorldBathymetryAsync from "../Core/createWorldBathymetryAsync.js";
import createWorldTerrainAsync from "../Core/createWorldTerrainAsync.js";

/**
 * 用于管理 terrain 提供程序的异步操作的帮助程序。
 *
 * @alias Terrain
 * @constructor
 *
 * @see Terrain.fromWorldTerrain
 * @see CesiumTerrainProvider
 * @see VRTheWorldTerrainProvider
 * @see GoogleEarthEnterpriseTerrainProvider
 *
 * @example
 * // Create
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 * });
 *
 * @example
 * // Handle loading events
 * const terrain = new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading terrain tiles! ${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 *
 * @param {Promise<TerrainProvider>} terrainProviderPromise A promise which resolves to a terrain provider
 */
function Terrain(terrainProviderPromise) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrainProviderPromise", terrainProviderPromise);
  //>>includeEnd('debug');

  this._ready = false;
  this._provider = undefined;
  this._errorEvent = new Event();
  this._readyEvent = new Event();

  handlePromise(this, terrainProviderPromise);
}

Object.defineProperties(Terrain.prototype, {
  /**
   * 获取 terrain 提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 的实例。
   * @memberof Terrain.prototype
   * @type {Event<Terrain.ErrorEventCallback>}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在成功创建 terrain 提供程序时引发的事件。事件侦听器
   * 的 {@link TerrainProvider} 的创建实例。
   * @memberof Terrain.prototype
   * @type {Event<Terrain.ReadyEventCallback>}
   * @readonly
   */
  readyEvent: {
    get: function () {
      return this._readyEvent;
    },
  },

  /**
   * 成功创建 terrain 提供程序后返回 true。否则，返回 false。
   * @memberof Terrain.prototype
   *
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 为地球提供表面几何图形的 terrain 提供程序。在引发 {@link Terrain.readyEvent} 之前不要使用。
   * @memberof Terrain.prototype
   *
   * @type {TerrainProvider}
   * @readonly
   */
  provider: {
    get: function () {
      return this._provider;
    },
  },
});
/**
 * 为 {@link@link https://cesium.com/content/#cesium-world-terrain|Cesium 世界地形}。
 *
 * @function
 *
 * @param {Object} [options] 对象，具有以下属性：
 * @param {Boolean} [options.requestVertexNormals=false] 指示客户端是否应从服务器请求其他照明信息（如果可用）的标志。
 * @param {Boolean} [options.requestWaterMask=false] 指示客户端是否应从服务器请求每个图块水面具（如果可用）的标志。
 * @returns {Terrain} CesiumTerrainProvider 的异步辅助对象
 *
 * @see Ion
 * @see createWorldTerrainAsync
 *
 * @example
 * // Create Cesium World Terrain with default settings
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain()
 * });
 *
 * @example
 * // Create Cesium World Terrain with water and normals.
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain({
 *      requestWaterMask: true,
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // Handle loading events
 * const terrain = Cesium.Terrain.fromWorldTerrain();
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading terrain tiles! ${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 */
Terrain.fromWorldTerrain = function (options) {
  return new Terrain(createWorldTerrainAsync(options));
};

/**
 * 为 {@link@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry}.
 *
 * @function
 *
 * @param {Object} [options] 对象，具有以下属性：
 * @param {Boolean} [options.requestVertexNormals=false] 指示客户端是否应从服务器请求其他照明信息（如果可用）的标志。
 * @returns {Terrain} CesiumTerrainProvider 的异步辅助对象
 *
 * @see Ion
 * @see createWorldBathymetryAsync
 *
 * @example
 * // Create Cesium World Bathymetry with default settings
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry)
 * });
 *
 * @example
 * // Create Cesium World Terrain with normals.
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry({
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // Handle loading events
 * const bathymetry = Cesium.Terrain.fromWorldBathymetry();
 *
 * scene.setTerrain(bathymetry);
 *
 * bathymetry.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   bathymetry.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading bathymetric terrain tiles! ${error}`);
 *   });
 * });
 *
 * bathymetry.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating bathymetric terrain! ${error}`);
 * });
 */
Terrain.fromWorldBathymetry = function (options) {
  return new Terrain(createWorldBathymetryAsync(options));
};

function handleError(errorEvent, error) {
  if (errorEvent.numberOfListeners > 0) {
    errorEvent.raiseEvent(error);
  } else {
    // Default handler is to log to the console
    console.error(error);
  }
}

async function handlePromise(instance, promise) {
  let provider;
  try {
    provider = await Promise.resolve(promise);
    instance._provider = provider;
    instance._ready = true;
    instance._readyEvent.raiseEvent(provider);
  } catch (error) {
    handleError(instance._errorEvent, error);
  }
}

export default Terrain;

/**
 * 发生错误时调用的函数。
 * @callback Terrain.ErrorEventCallback
 *
 * @this Terrain
 * @param {Error} err 一个对象，其中包含有关所发生错误的详细信息。
 */

/**
 * 在创建提供程序时调用的函数
 * @callback Terrain.ReadyEventCallback
 *
 * @this Terrain
 * @param {TerrainProvider} provider 创建的 terrain 提供程序。
 */
