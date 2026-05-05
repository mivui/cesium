import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import Frozen from "./Frozen.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 为 {@link https://cesium.com/content/#cesium-world-terrain|Cesium World Terrain} 创建一个 {@link CesiumTerrainProvider} 实例。
 *
 * @function
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.requestVertexNormals=false] 指示客户端是否应请求服务器提供的附加光照信息的标志。
 * @param {boolean} [options.requestWaterMask=false] 指示客户端是否应请求服务器提供的每瓦片水掩码的标志。
 * @returns {Promise<CesiumTerrainProvider>} 一个解析为已创建的 CesiumTerrainProvider 的 promise
 *
 * @see Ion
 *
 * @example
 * // 使用默认设置创建 Cesium World Terrain
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldTerrainAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // 创建带水面效果和法线的 Cesium World Terrain
 * try {
 *   const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldTerrainAsync({
 *       requestWaterMask: true,
 *       requestVertexNormals: true
 *     });
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 */
function createWorldTerrainAsync(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  return CesiumTerrainProvider.fromIonAssetId(1, {
    requestVertexNormals: options.requestVertexNormals ?? false,
    requestWaterMask: options.requestWaterMask ?? false,
    ellipsoid: Ellipsoid.WGS84,
  });
}
export default createWorldTerrainAsync;
