import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import defaultValue from "./defaultValue.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * Creates a {@link CesiumTerrainProvider} instance for the {@link https://cesium.com/content/#cesium-world-terrain|Cesium World Terrain}.
 *
 * @function
 *
 * @param {Object} [options] 对象，具有以下属性:
 * @param {Boolean} [options.requestVertexNormals=false] 指示客户端是否应从服务器请求其他照明信息（如果可用）的标志。
 * @param {Boolean} [options.requestWaterMask=false] 指示客户端是否应从服务器请求每个图块水面具（如果可用）的标志。
 * @returns {Promise<CesiumTerrainProvider>} 解析为创建的 CesiumTerrainProvider 的 Promise
 *
 * @see Ion
 *
 * @example
 * // Create Cesium World Terrain with default settings
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldTerrainAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // Create Cesium World Terrain with water and normals.
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  return CesiumTerrainProvider.fromIonAssetId(1, {
    requestVertexNormals: defaultValue(options.requestVertexNormals, false),
    requestWaterMask: defaultValue(options.requestWaterMask, false),
    ellipsoid: Ellipsoid.WGS84,
  });
}
export default createWorldTerrainAsync;
