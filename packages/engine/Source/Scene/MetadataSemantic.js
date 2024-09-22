/**
 * 内置语义的枚举。
 *
 * @enum MetadataSemantic
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata/Semantics|3D 元数据语义参考}
 */
const MetadataSemantic = {
  /**
   * 唯一标识符，存储为 <code>STRING</code>。
   *
   * @type {string}
   * @constant
   * @private
   */
  ID: "ID",
  /**
   * 名称，存储为 <code>STRING</code>。这不必是唯一的。
   *
   * @type {string}
   * @constant
   * @private
   */
  NAME: "NAME",
  /**
   * 描述，存储为 <code>STRING</code>。
   *
   * @type {string}
   * @constant
   * @private
   */
  DESCRIPTION: "DESCRIPTION",
  /**
   * 图块集中的图块数量，存储为 <code>UINT64</code>。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILESET_TILE_COUNT: "TILESET_TILE_COUNT",
  /**
   * 瓦片的边界框，存储为 12 <code>个 FLOAT32</code> 或 <code>FLOAT64</code> 个分量的数组。这些组件的格式与 3D Tiles 1.0 中的 <code>boundingVolume.box</code> 格式相同。此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_BOUNDING_BOX: "TILE_BOUNDING_BOX",
  /**
   * 瓦片的边界区域，存储为包含 6 个 <code>FLOAT64</code> 个分量的数组。组件包括 <code>[west， south， east， north， minimumHeight， maximumHeight]。</code>此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_BOUNDING_REGION: "TILE_BOUNDING_REGION",
  /**
   * 瓦片的边界球体，存储为 4 <code>个 FLOAT32</code> 或 <code>FLOAT64</code> 个分量的数组。分量为 <code>[centerX， centerY， centerZ， radius]。</code>此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_BOUNDING_SPHERE: "TILE_BOUNDING_SPHERE",
  /**
   * 椭球体上方（或下方）的图块的最小高度，存储为<code>FLOAT32</code>或<code>FLOAT64</code>。此语义用于收紧隐式平铺中隐式计算的边界区域。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_MINIMUM_HEIGHT: "TILE_MINIMUM_HEIGHT",
  /**
   * 椭球体上方（或下方）的图块的最大高度，存储为<code>FLOAT32</code>或<code>FLOAT64</code>。此语义用于收紧隐式平铺中隐式计算的边界区域。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_MAXIMUM_HEIGHT: "TILE_MAXIMUM_HEIGHT",
  /**
   * 瓦片的水平线遮挡点，存储为 <code>FLOAT32</code> 或 <code>FLOAT64</code> 分量的 <code>VEC3</code>。
   *
   * @see {@link https://cesium.com/blog/2013/04/25/horizon-culling/|Horizon 剔除}
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_HORIZON_OCCLUSION_POINT: "TILE_HORIZON_OCCLUSION_POINT",
  /**
   * 切片的几何误差，存储为 <code>FLOAT32</code> 或 <code>FLOAT64</code>。此语义用于覆盖隐式平铺中隐式计算的几何误差。
   *
   * @type {string}
   * @constant
   * @private
   */
  TILE_GEOMETRIC_ERROR: "TILE_GEOMETRIC_ERROR",
  /**
   * 图块内容的边界框，存储为 12 个<code>FLOAT32</code>或 <code>FLOAT64</code> 个组件的数组。这些组件的格式与 3D Tiles 1.0 中的 <code>boundingVolume.box</code> 格式相同。此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_BOUNDING_BOX: "CONTENT_BOUNDING_BOX",
  /**
   * 瓦片内容的边界区域，存储为包含 6 个 <code>FLOAT64</code> 个组件的数组。组件包括 <code>[west， south， east， north， minimumHeight， maximumHeight]。</code>此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_BOUNDING_REGION: "CONTENT_BOUNDING_REGION",
  /**
   * 瓦片内容的边界球体，存储为 4 <code>个FLOAT32</code>或 <code>FLOAT64</code> 个组件的数组。分量为 <code>[centerX， centerY， centerZ， radius]。</code>此语义用于提供比隐式平铺中隐式计算的边界卷更紧密的边界卷。
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_BOUNDING_SPHERE: "CONTENT_BOUNDING_SPHERE",
  /**
   * 椭球体上方（或下方）的图块内容的最小高度，存储为<code>FLOAT32</code>或<code>FLOAT64</code>
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_MINIMUM_HEIGHT: "CONTENT_MINIMUM_HEIGHT",
  /**
   * 椭球体上方（或下方）的瓦片内容的最大高度，存储为<code>FLOAT32</code>或<code>FLOAT64</code>
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_MAXIMUM_HEIGHT: "CONTENT_MAXIMUM_HEIGHT",
  /**
   * 瓦片内容的水平线遮挡点，存储为 <code>FLOAT32</code> 或 <code>FLOAT64</code> 分量的 <code>VEC3</code>。
   *
   * @see {@link https://cesium.com/blog/2013/04/25/horizon-culling/|Horizon 剔除}
   *
   * @type {string}
   * @constant
   * @private
   */
  CONTENT_HORIZON_OCCLUSION_POINT: "CONTENT_HORIZON_OCCLUSION_POINT",
};

export default Object.freeze(MetadataSemantic);
