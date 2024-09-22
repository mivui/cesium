import defaultValue from "./defaultValue.js";

/**
 * 单个地形图块的网格加上相关元数据。 此类型的实例包括
 * 通常从原始 {@link TerrainData} 创建。
 *
 * @alias TerrainMesh
 * @constructor
 *
 * @param {Cartesian3} center 瓦片的中心。 顶点位置是相对于此中心指定的。
 * @param {Float32Array} vertices 顶点数据，包括位置、纹理坐标和高度。
 * 顶点数据的顺序为 [X， Y， Z， H， U， V]，其中 X、Y 和 Z 表示
 * 顶点的笛卡尔位置，H 是椭球体上方的高度，并且
 * U 和 V 是纹理坐标。
 * @param {uint8Array|Uint16Array|Uint32Array} indices 描述顶点如何连接以形成三角形的索引。
 * @param {number} indexCountWithoutSkirts 不包括裙子的网格的索引计数。
 * @param {number} vertexCountWithoutSkirts 网格体的顶点数（不包括裙子）。
 * @param {number} minimumHeight 瓦片中的最低高度，以米为单位，位于椭球体上方。
 * @param {number} maximumHeight 瓦片中的最高高度，以米为单位，位于椭球体上方。
 * @param {BoundingSphere} boundingSphere3D 完全包含瓦片的边界球体。
 * @param {Cartesian3} occludeePointInScaledSpace 瓦片的遮挡点，以椭球体表示-
 * 缩放空间，用于水平面剔除。 如果此点低于地平线，
 * 该图块被视为完全低于地平线。
 * @param {number} [vertexStride=6] 每个顶点中的组件数量。
 * @param {OrientedBoundingBox} [orientedBoundingBox] 一个完全包含瓦片的边界框。
 * @param 用于解码网格的 {TerrainEncoding} 编码信息。
 * @param {number[]} westIndicesSouthToNorth 瓦片西边上的顶点索引，按从南到北（顺时针）的顺序排列。
 * @param {number[]} southIndicesEastToWest 瓦片南部边缘的顶点索引，按从东到西（顺时针）的顺序排列。
 * @param {number[]} eastIndicesNorthToSouth 瓦片东边缘的顶点索引，按从北到南（顺时针）的顺序排列。
 * @param {number[]} northIndicesWestToEast 瓦片北边上顶点的索引，从西到东（顺时针）排序。
 *
 * @private
 */
function TerrainMesh(
  center,
  vertices,
  indices,
  indexCountWithoutSkirts,
  vertexCountWithoutSkirts,
  minimumHeight,
  maximumHeight,
  boundingSphere3D,
  occludeePointInScaledSpace,
  vertexStride,
  orientedBoundingBox,
  encoding,
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast
) {
  /**
   * 瓦片的中心。 顶点位置是相对于此中心指定的。
   * @type {Cartesian3}
   */
  this.center = center;

  /**
   * 顶点数据，包括位置、纹理坐标和高度。
   * 顶点数据的顺序为 [X， Y， Z， H， U， V]，其中 X、Y 和 Z 表示
   * 顶点的笛卡尔位置，H 是椭球体上方的高度，并且
   * U 和 V 是纹理坐标。 顶点数据在这些
   * 当 {@link TerrainMesh#stride} 大于 6 时提到。
   * @type {Float32Array}
   */
  this.vertices = vertices;

  /**
   * 每个顶点中的组件数。 通常，对于 6 个组件，此值为 6
   * [X， Y， Z， H， U， V]，但如果每个顶点都有其他数据（例如顶点法线），则此值
   * 可能更高。
   * @type {number}
   */
  this.stride = defaultValue(vertexStride, 6);

  /**
   * 描述顶点如何连接以形成三角形的索引。
   * @type {Uint8Array|Uint16Array|Uint32Array}
   */
  this.indices = indices;

  /**
   * 不包括裙子的网丝的索引计数。
   * @type {number}
   */
  this.indexCountWithoutSkirts = indexCountWithoutSkirts;

  /**
   * 网格的顶点数，不包括裙子。
   * @type {number}
   */
  this.vertexCountWithoutSkirts = vertexCountWithoutSkirts;

  /**
   * 瓦片中的最低高度，以椭球体上方的米为单位。
   * @type {number}
   */
  this.minimumHeight = minimumHeight;

  /**
   * 瓦片中的最高高度，以米为单位，位于椭球体上方。
   * @type {number}
   */
  this.maximumHeight = maximumHeight;

  /**
   * 完全包含图块的边界球体。
   * @type {BoundingSphere}
   */
  this.boundingSphere3D = boundingSphere3D;

  /**
   * 瓦片的遮挡点，以椭球体 - 表示
   * 缩放空间，用于水平面剔除。 如果此点低于地平线，
   * 该图块被视为完全低于地平线。
   * @type {Cartesian3}
   */
  this.occludeePointInScaledSpace = occludeePointInScaledSpace;

  /**
   * 完全包含图块的边界框。
   * @type {OrientedBoundingBox}
   */
  this.orientedBoundingBox = orientedBoundingBox;

  /**
   * 用于解码网格顶点的信息。
   * @type {TerrainEncoding}
   */
  this.encoding = encoding;

  /**
   * 瓦片西边上的顶点索引，按从南到北（顺时针）的顺序排列。
   * @type {number[]}
   */
  this.westIndicesSouthToNorth = westIndicesSouthToNorth;

  /**
   * 瓦片南边上的顶点索引，按从东到西（顺时针）的顺序排列。
   * @type {number[]}
   */
  this.southIndicesEastToWest = southIndicesEastToWest;

  /**
   * 图块东边缘上的顶点索引，按从北到南（顺时针）的顺序排列。
   * @type {number[]}
   */
  this.eastIndicesNorthToSouth = eastIndicesNorthToSouth;

  /**
   * 图块北边缘上的顶点索引，按从西到东（顺时针）的顺序排列。
   * @type {number[]}
   */
  this.northIndicesWestToEast = northIndicesWestToEast;
}
export default TerrainMesh;
