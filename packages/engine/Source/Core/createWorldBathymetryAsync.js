import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import defaultValue from "./defaultValue.js";

/**
 * 创建一个 {@link CesiumTerrainProvider} instance 的{@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry}.
 *
 * @function
 *
 * @param {Object} [options] 对象，具有以下属性:
 * @param {Boolean} [options.requestVertexNormals=false] 指示客户端是否应从服务器请求其他照明信息（如果可用）的标志。
 * @returns {Promise<CesiumTerrainProvider>} 解析为创建的 CesiumTerrainProvider 的 Promise
 *
 * @see Ion
 *
 * @example
 * // Create Cesium World Bathymetry with default settings
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldBathymetryAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // Create Cesium World Bathymetry with normals.
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  return CesiumTerrainProvider.fromIonAssetId(2426648, {
    requestVertexNormals: defaultValue(options.requestVertexNormals, false),
  });
}
export default createWorldBathymetryAsync;
