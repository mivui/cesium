import Frozen from "../Core/Frozen.js";
import IonImageryProvider from "./IonImageryProvider.js";
import IonWorldImageryStyle from "./IonWorldImageryStyle.js";

/**
 * 创建 ion 默认全球基础影像层（目前为 Bing Maps）的 {@link IonImageryProvider} 实例。
 *
 * @function
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {IonWorldImageryStyle} [options.style=IonWorldImageryStyle] 基础影像的样式，目前仅支持 AERIAL、AERIAL_WITH_LABELS 和 ROAD。
 * @returns {Promise<IonImageryProvider>}
 *
 * @see Ion
 *
 * @example
 * // 使用默认设置创建 Cesium World Imagery 基础图层
 * try {
 *   const imageryProvider = await Cesium.createWorldImageryAsync();
 * } catch (error) {
 *   console.log(`创建世界影像时出错：${error}`);
 * }
 *
 * @example
 * // 使用不同样式创建 Cesium World Imagery
 * try {
 *   const imageryProvider = await Cesium.createWorldImageryAsync({
 *         style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
 *   });
 * } catch (error) {
 *   console.log(`创建世界影像时出错：${error}`);
 * }
 */
function createWorldImageryAsync(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const style = options.style ?? IonWorldImageryStyle.AERIAL;
  return IonImageryProvider.fromAssetId(style);
}
export default createWorldImageryAsync;
