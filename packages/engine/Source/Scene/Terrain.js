import Check from "../Core/Check.js";
import Event from "../Core/Event.js";
import createWorldBathymetryAsync from "../Core/createWorldBathymetryAsync.js";
import createWorldTerrainAsync from "../Core/createWorldTerrainAsync.js";

/**
 * 用于管理地形提供者异步操作的辅助类。
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
 * // 创建
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 * });
 *
 * @example
 * // 处理加载事件
 * const terrain = new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`加载地形图块时遇到错误！${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`创建地形时遇到错误！${error}`);
 * });
 *
 * @param {Promise<TerrainProvider>} terrainProviderPromise 解析为地形提供者的 Promise
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
   * 获取当地形提供者遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并有可能从中恢复。事件监听器
   * 将接收抛出的错误实例。
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
   * 获取当地形提供者成功创建时引发的事件。事件监听器
   * 将接收创建的 {@link TerrainProvider} 实例。
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
   * 当地形提供者成功创建时返回 true，否则返回 false。
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
   * 为地球提供表面几何形状的地形提供者。在 {@link Terrain.readyEvent} 引发之前请勿使用。
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
 * 为 {@link https://cesium.com/content/#cesium-world-terrain|Cesium World Terrain} 创建 {@link Terrain} 实例。
 *
 * @function
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应在可用时从服务器请求额外的光照信息。
 * @param {boolean} [options.requestWaterMask=false] 标志，指示客户端是否应在可用时从服务器请求每个图块的水面遮罩。
 * @returns {Terrain} CesiumTerrainProvider 的异步辅助对象
 *
 * @see Ion
 * @see createWorldTerrainAsync
 *
 * @example
 * // 使用默认设置创建 Cesium World Terrain
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain()
 * });
 *
 * @example
 * // 创建带有水面和法线的 Cesium World Terrain。
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain({
 *      requestWaterMask: true,
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // 处理加载事件
 * const terrain = Cesium.Terrain.fromWorldTerrain();
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`加载地形图块时遇到错误！${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`创建地形时遇到错误！${error}`);
 * });
 */
Terrain.fromWorldTerrain = function (options) {
  return new Terrain(createWorldTerrainAsync(options));
};

/**
 * 为 {@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry} 创建 {@link Terrain} 实例。
 *
 * @function
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应在可用时从服务器请求额外的光照信息。
 * @returns {Terrain} CesiumTerrainProvider 的异步辅助对象
 *
 * @see Ion
 * @see createWorldBathymetryAsync
 *
 * @example
 * // 使用默认设置创建 Cesium World Bathymetry
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry)
 * });
 *
 * @example
 * // 创建带有法线的 Cesium World Terrain。
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry({
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // 处理加载事件
 * const bathymetry = Cesium.Terrain.fromWorldBathymetry();
 *
 * scene.setTerrain(bathymetry);
 *
 * bathymetry.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   bathymetry.provider.errorEvent.addEventListener(error => {
 *     alert(`加载水深地形图块时遇到错误！${error}`);
 *   });
 * });
 *
 * bathymetry.errorEvent.addEventListener(error => {
 *   alert(`创建水深地形时遇到错误！${error}`);
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
 * @param {Error} err 一个包含所发生错误详细信息的对象。
 */

/**
 * 提供者创建完成时调用的函数
 * @callback Terrain.ReadyEventCallback
 *
 * @this Terrain
 * @param {TerrainProvider} provider 已创建的地形提供者。
 */
