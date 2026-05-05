import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import Frozen from "./Frozen.js";

/**
 * 为 {@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry} 创建一个 {@link CesiumTerrainProvider} 实例。
 *
 * @function
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.requestVertexNormals=false] 指示客户端是否应请求服务器提供的附加光照信息的标志。
 * @returns {Promise<CesiumTerrainProvider>} 一个解析为已创建的 CesiumTerrainProvider 的 promise
 *
 * @see Ion
 *
 * @example
 * // 使用默认设置创建 Cesium World Bathymetry
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldBathymetryAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // 创建带法线的 Cesium World Bathymetry
 * try {
 *   const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldBathymetryAsync({
 *       requestVertexNormals: true
 *     });
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 */
function createWorldBathymetryAsync(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  return CesiumTerrainProvider.fromIonAssetId(2426648, {
    requestVertexNormals: options.requestVertexNormals ?? false,
  });
}
export default createWorldBathymetryAsync;
