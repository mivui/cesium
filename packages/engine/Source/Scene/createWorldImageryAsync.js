import defaultValue from "../Core/defaultValue.js";
import IonImageryProvider from "./IonImageryProvider.js";
import IonWorldImageryStyle from "./IonWorldImageryStyle.js";

/**
 * 为 ion 的默认全局基础图像图层（当前为 Bing 地图）创建一个 {@link IonImageryProvider} 实例。
 *
 * @function
 *
 * @param {Object} [options] 对象，具有以下属性:
 * @param {IonWorldImageryStyle} [options.style=IonWorldImageryStyle] 基础影像的样式，目前仅支持 AERIAL、AERIAL_WITH_LABELS 和 ROAD。
 * @returns {Promise<IonImageryProvider>}
 *
 * @see Ion
 *
 * @example
 * // Create a Cesium World Imagery base layer with default settings
 * try {
 *   const imageryProvider = await Cesium.createWorldImageryAsync();
 * } catch (error) {
 *   console.log(`There was an error creating world imagery: ${error}`);
 * }
 *
 * @example
 * // Create Cesium World Imagery with different style
 * try {
 *   const imageryProvider = await Cesium.createWorldImageryAsync({
 *         style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
 *   });
 * } catch (error) {
 *   console.log(`There was an error creating world imagery: ${error}`);
 * }
 */
function createWorldImageryAsync(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const style = defaultValue(options.style, IonWorldImageryStyle.AERIAL);
  return IonImageryProvider.fromAssetId(style);
}
export default createWorldImageryAsync;
