import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Cesium3DTileset from "./Cesium3DTileset.js";
import Cesium3DTileStyle from "./Cesium3DTileStyle.js";

/**
 * 创建一个 {@link Cesium3DTileset} 实例 的
 * {@link https://cesium.com/content/cesium-osm-buildings/|Cesium OSM Buildings}
 * 瓦片集.
 *
 * @function
 *
 * @param {object} [options] 构造选项。{@link Cesium3DTileset} 构造函数允许的任何选项
 * 可在此处指定。除此之外，还支持以下属性：
 * @param {Color} [options.defaultColor=Color.WHITE] 用于建筑物的默认颜色
 * 没有颜色。如果指定了 <code>options.style</code>，则忽略此参数。
 * @param {Cesium3DTileStyle} [options.style] 用于图块集的样式。如果不是
 * 指定时，将使用默认样式，该样式为每个建筑物或建筑物部分提供
 * 从其 OpenStreetMap <code>标签</code>推断出的颜色。如果无法推断出颜色，
 * <code>options.defaultColor</code> 的
 * @param {boolean} [options.enableShowOutline=true] 如果为 true，则启用渲染轮廓。可以将其设置为 false，以避免在加载时对几何体进行额外处理。
 * @param {boolean} [options.showOutline=true] 是否显示建筑物周围的轮廓。如果为 true，则
 * 显示轮廓。如果为 false，则不显示轮廓。
 * @returns {Promise<Cesium3DTileset>}
 *
 * @see Ion
 *
 * @example
 * // Create Cesium OSM Buildings with default styling
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * try {
 *   const tileset = await Cesium.createOsmBuildingsAsync();
 *   viewer.scene.primitives.add(tileset));
 * } catch (error) {
 *   console.log(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Create Cesium OSM Buildings with a custom style highlighting
 * // schools and hospitals.
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * try {
 *   const tileset = await Cesium.createOsmBuildingsAsync({
 *     style: new Cesium.Cesium3DTileStyle({
 *       color: {
 *         conditions: [
 *           ["${feature['building']} === 'hospital'", "color('#0000FF')"],
 *           ["${feature['building']} === 'school'", "color('#00FF00')"],
 *           [true, "color('#ffffff')"]
 *         ]
 *       }
 *     })
 *   });
 *   viewer.scene.primitives.add(tileset));
 * } catch (error) {
 *   console.log(`Error creating tileset: ${error}`);
 * }
 */
async function createOsmBuildingsAsync(options) {
  const tileset = await Cesium3DTileset.fromIonAssetId(96188, options);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let style = options.style;

  if (!defined(style)) {
    const color = defaultValue(
      options.defaultColor,
      Color.WHITE
    ).toCssColorString();
    style = new Cesium3DTileStyle({
      color: `Boolean(\${feature['cesium#color']}) ? color(\${feature['cesium#color']}) : ${color}`,
    });
  }

  tileset.style = style;

  return tileset;
}

export default createOsmBuildingsAsync;
