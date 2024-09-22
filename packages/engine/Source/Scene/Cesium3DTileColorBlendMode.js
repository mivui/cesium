/**
 * 定义从 Cesium API 或声明式样式设置的每个特征颜色如何与
 * 原始特征，例如 glTF 材质或瓦片中的每点颜色。
 * <p>
 * 当使用 <code>REPLACE</code> 或 <code>MIX</code> 且源颜色是 glTF 材质时，该技术必须为
 * <code>_3DTILESDIFFUSE</code> diffuse color 参数的语义。否则，仅支持 <code>HIGHLIGHT</code>。
 * </p>
 * <p>
 * 颜色计算结果为白色 （1.0， 1.0， 1.0） 的特征始终在渲染时不进行颜色混合，而不管
 * 图块集的颜色混合模式。
 * </p>
 * <pre><code>
 * "techniques": {
 *   "technique0": {
 *     "parameters": {
 *       "diffuse": {
 *         "semantic": "_3DTILESDIFFUSE",
 *         "type": 35666
 *       }
 *     }
 *   }
 * }
 * </code></pre>
 *
 * @enum {number}
 */
const Cesium3DTileColorBlendMode = {
  /**
   * 将源颜色乘以特征颜色。
   *
   * @type {number}
   * @constant
   */
  HIGHLIGHT: 0,

  /**
   * 将源颜色替换为特征颜色。
   *
   * @type {number}
   * @constant
   */
  REPLACE: 1,

  /**
   * 将源颜色和特征颜色混合在一起。
   *
   * @type {number}
   * @constant
   */
  MIX: 2,
};
export default Object.freeze(Cesium3DTileColorBlendMode);
