import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";

/**
 * 为椭球体表面提供地形或其他几何数据。表面几何按
 * {@link TilingScheme} 组织成金字塔状的瓦片结构。此类型描述了一个
 * 接口，不打算直接实例化。
 *
 * @alias TerrainProvider
 * @constructor
 *
 * @see EllipsoidTerrainProvider
 * @see CesiumTerrainProvider
 * @see VRTheWorldTerrainProvider
 * @see GoogleEarthEnterpriseTerrainProvider
 * @see ArcGISTiledElevationTerrainProvider
 * @see Cesium3DTilesTerrainProvider
 */
function TerrainProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainProvider.prototype, {
  /**
   * 获取当地形提供者遇到异步错误时触发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会收到一个 {@link TileProviderError} 实例。
   * @memberof TerrainProvider.prototype
   * @type {Event<TerrainProvider.ErrorEvent>}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取当地形提供者激活时要显示的署名信息。通常用于
   * 署名地形的来源。
   * @memberof TerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供者使用的瓦片方案。
   * @memberof TerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示提供者是否包含水掩码。水掩码
   * 指示地球上的哪些区域是水域而非陆地，从而可以将其渲染为
   * 带有动画波浪的反射表面。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个可用于确定此提供者地形可用性的对象，例如在
   * 点和矩形中。如果可用性信息不可用，
   * 此属性可能为 undefined。
   * @memberof TerrainProvider.prototype
   * @type {TileAvailability|undefined}
   * @readonly
   */
  availability: {
    get: DeveloperError.throwInstantiationError,
  },
});

const regularGridIndicesCache = [];

/**
 * 获取表示规则网格的三角形网格索引列表。多次使用
 * 相同的网格宽度和高度调用此函数将返回
 * 相同的索引列表。顶点总数必须小于或等于 65536。
 *
 * @param {number} width 规则网格水平方向的顶点数。
 * @param {number} height 规则网格垂直方向的顶点数。
 * @returns {Uint16Array|Uint32Array} 索引列表。64KB 或以下返回 Uint16Array，4GB 或以下返回 Uint32Array。
 */
TerrainProvider.getRegularGridIndices = function (width, height) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridIndicesCache[width] = byWidth = [];
  }

  let indices = byWidth[height];
  if (!defined(indices)) {
    if (width * height < CesiumMath.SIXTY_FOUR_KILOBYTES) {
      indices = byWidth[height] = new Uint16Array(
        (width - 1) * (height - 1) * 6,
      );
    } else {
      indices = byWidth[height] = new Uint32Array(
        (width - 1) * (height - 1) * 6,
      );
    }
    addRegularGridIndices(width, height, indices, 0);
  }

  return indices;
};

const regularGridAndEdgeIndicesCache = [];

/**
 * @private
 */
TerrainProvider.getRegularGridIndicesAndEdgeIndices = function (width, height) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridAndEdgeIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridAndEdgeIndicesCache[width] = byWidth = [];
  }

  let indicesAndEdges = byWidth[height];
  if (!defined(indicesAndEdges)) {
    const indices = TerrainProvider.getRegularGridIndices(width, height);

    const edgeIndices = getEdgeIndices(width, height);
    const westIndicesSouthToNorth = edgeIndices.westIndicesSouthToNorth;
    const southIndicesEastToWest = edgeIndices.southIndicesEastToWest;
    const eastIndicesNorthToSouth = edgeIndices.eastIndicesNorthToSouth;
    const northIndicesWestToEast = edgeIndices.northIndicesWestToEast;

    indicesAndEdges = byWidth[height] = {
      indices: indices,
      westIndicesSouthToNorth: westIndicesSouthToNorth,
      southIndicesEastToWest: southIndicesEastToWest,
      eastIndicesNorthToSouth: eastIndicesNorthToSouth,
      northIndicesWestToEast: northIndicesWestToEast,
    };
  }

  return indicesAndEdges;
};

const regularGridAndSkirtAndEdgeIndicesCache = [];

/**
 * @private
 */
TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices = function (
  width,
  height,
) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridAndSkirtAndEdgeIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridAndSkirtAndEdgeIndicesCache[width] = byWidth = [];
  }

  let indicesAndEdges = byWidth[height];
  if (!defined(indicesAndEdges)) {
    const gridVertexCount = width * height;
    const gridIndexCount = (width - 1) * (height - 1) * 6;
    const edgeVertexCount = width * 2 + height * 2;
    const edgeIndexCount = Math.max(0, edgeVertexCount - 4) * 6;
    const vertexCount = gridVertexCount + edgeVertexCount;
    const indexCount = gridIndexCount + edgeIndexCount;

    const edgeIndices = getEdgeIndices(width, height);
    const westIndicesSouthToNorth = edgeIndices.westIndicesSouthToNorth;
    const southIndicesEastToWest = edgeIndices.southIndicesEastToWest;
    const eastIndicesNorthToSouth = edgeIndices.eastIndicesNorthToSouth;
    const northIndicesWestToEast = edgeIndices.northIndicesWestToEast;

    const indices = IndexDatatype.createTypedArray(vertexCount, indexCount);
    addRegularGridIndices(width, height, indices, 0);
    TerrainProvider.addSkirtIndices(
      westIndicesSouthToNorth,
      southIndicesEastToWest,
      eastIndicesNorthToSouth,
      northIndicesWestToEast,
      gridVertexCount,
      indices,
      gridIndexCount,
    );

    indicesAndEdges = byWidth[height] = {
      indices: indices,
      westIndicesSouthToNorth: westIndicesSouthToNorth,
      southIndicesEastToWest: southIndicesEastToWest,
      eastIndicesNorthToSouth: eastIndicesNorthToSouth,
      northIndicesWestToEast: northIndicesWestToEast,
      indexCountWithoutSkirts: gridIndexCount,
    };
  }

  return indicesAndEdges;
};

/**
 * 根据边缘索引计算裙边顶点数。
 * @private
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} westIndicesSouthToNorth 瓦片西侧边缘索引。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} southIndicesEastToWest 瓦片南侧边缘索引。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} eastIndicesNorthToSouth 瓦片东侧边缘索引。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} northIndicesWestToEast 瓦片北侧边缘索引。
 * @returns {number} 裙边顶点数。
 */
TerrainProvider.getSkirtVertexCount = function (
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast,
) {
  return (
    westIndicesSouthToNorth.length +
    southIndicesEastToWest.length +
    eastIndicesNorthToSouth.length +
    northIndicesWestToEast.length
  );
};

/**
 * 根据裙边顶点数计算裙边索引数。
 * 考虑一个 3x3 的顶点网格。边缘周围将有 8 个裙边顶点：
 * - 16 个边缘三角形
 * - 48 个索引
 *
 *   |\|\|
 *   |/|   |/|
 *   |/|   |/|
 *   |\|\|
 *
 * @private
 * @param {number} skirtVertexCount 裙边顶点数
 * @returns {number} 裙边索引数
 */
TerrainProvider.getSkirtIndexCount = function (skirtVertexCount) {
  return (skirtVertexCount - 4) * 2 * 3;
};

/**
 * 根据裙边顶点数计算带填充角的裙边索引数。
 * 考虑一个 3x3 的顶点网格。边缘周围将有 8 个裙边顶点：
 * - 16 个边缘三角形
 * - 4 个帽三角形
 * - 60 个索引
 *
 *  /|\|\|\
 *  |/|   |/|
 *  |/|   |/|
 *   \|\|\|/
 *
 * @private
 * @param {number} skirtVertexCount 裙边顶点数
 * @returns {number} 裙边索引数
 */
TerrainProvider.getSkirtIndexCountWithFilledCorners = function (
  skirtVertexCount,
) {
  return ((skirtVertexCount - 4) * 2 + 4) * 3;
};

/**
 * 添加裙边索引。
 * 这不会添加填充角。使用 {@link TerrainProvider.addSkirtIndicesWithFilledCorners} 可添加带填充角的裙边索引。
 * @private
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} westIndicesSouthToNorth 瓦片西边缘顶点索引，按从南到北排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} southIndicesEastToWest 瓦片南边缘顶点索引，按从东到西排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} eastIndicesNorthToSouth 瓦片东边缘顶点索引，按从北到南排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} northIndicesWestToEast 瓦片北边缘顶点索引，按从西到东排序。
 * @param {number} vertexCount 添加裙边顶点前瓦片中的顶点数。
 * @param {Uint16Array|Uint32Array} indices 要添加裙边索引的索引数组。
 * @param {number} offset 索引数组中开始添加裙边索引的偏移量。
 */
TerrainProvider.addSkirtIndices = function (
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast,
  vertexCount,
  indices,
  offset,
) {
  let vertexIndex = vertexCount;
  offset = addSkirtIndices(
    westIndicesSouthToNorth,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += westIndicesSouthToNorth.length;
  offset = addSkirtIndices(
    southIndicesEastToWest,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += southIndicesEastToWest.length;
  offset = addSkirtIndices(
    eastIndicesNorthToSouth,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += eastIndicesNorthToSouth.length;
  addSkirtIndices(northIndicesWestToEast, vertexIndex, indices, offset);
};

/**
 * 添加带填充角的裙边索引。
 * @private
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} westIndicesSouthToNorth 瓦片西边缘顶点索引，按从南到北排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} southIndicesEastToWest 瓦片南边缘顶点索引，按从东到西排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} eastIndicesNorthToSouth 瓦片东边缘顶点索引，按从北到南排序。
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} northIndicesWestToEast 瓦片北边缘顶点索引，按从西到东排序。
 * @param {number} vertexCount 添加裙边顶点前瓦片中的顶点数。
 * @param {Uint16Array|Uint32Array} indices 要添加裙边索引的索引数组。
 * @param {number} offset 索引数组中开始添加裙边索引的偏移量。
 */
TerrainProvider.addSkirtIndicesWithFilledCorners = function (
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast,
  vertexCount,
  indices,
  offset,
) {
  // Add skirt indices without filled corners
  TerrainProvider.addSkirtIndices(
    westIndicesSouthToNorth,
    southIndicesEastToWest,
    eastIndicesNorthToSouth,
    northIndicesWestToEast,
    vertexCount,
    indices,
    offset,
  );

  const skirtVertexCount = TerrainProvider.getSkirtVertexCount(
    westIndicesSouthToNorth,
    southIndicesEastToWest,
    eastIndicesNorthToSouth,
    northIndicesWestToEast,
  );
  const skirtIndexCountWithoutCaps =
    TerrainProvider.getSkirtIndexCount(skirtVertexCount);

  const cornerStartIdx = offset + skirtIndexCountWithoutCaps;

  const cornerSWIndex = westIndicesSouthToNorth[0];
  const cornerNWIndex = northIndicesWestToEast[0];
  const cornerNEIndex = eastIndicesNorthToSouth[0];
  const cornerSEIndex = southIndicesEastToWest[0];

  // Indices based on edge order in addSkirtIndices
  const westSouthIndex = vertexCount;
  const westNorthIndex = westSouthIndex + westIndicesSouthToNorth.length - 1;
  const southEastIndex = westNorthIndex + 1;
  const southWestIndex = southEastIndex + southIndicesEastToWest.length - 1;
  const eastNorthIndex = southWestIndex + 1;
  const eastSouthIndex = eastNorthIndex + eastIndicesNorthToSouth.length - 1;
  const northWestIndex = eastSouthIndex + 1;
  const northEastIndex = northWestIndex + northIndicesWestToEast.length - 1;

  // Connect the corner vertices with the skirt vertices extending from the corner

  indices[cornerStartIdx + 0] = cornerSWIndex;
  indices[cornerStartIdx + 1] = westSouthIndex;
  indices[cornerStartIdx + 2] = southWestIndex;

  indices[cornerStartIdx + 3] = cornerSEIndex;
  indices[cornerStartIdx + 4] = southEastIndex;
  indices[cornerStartIdx + 5] = eastSouthIndex;

  indices[cornerStartIdx + 6] = cornerNEIndex;
  indices[cornerStartIdx + 7] = eastNorthIndex;
  indices[cornerStartIdx + 8] = northEastIndex;

  indices[cornerStartIdx + 9] = cornerNWIndex;
  indices[cornerStartIdx + 10] = northWestIndex;
  indices[cornerStartIdx + 11] = westNorthIndex;
};

function getEdgeIndices(width, height) {
  const westIndicesSouthToNorth = new Array(height);
  const southIndicesEastToWest = new Array(width);
  const eastIndicesNorthToSouth = new Array(height);
  const northIndicesWestToEast = new Array(width);

  let i;
  for (i = 0; i < width; ++i) {
    northIndicesWestToEast[i] = i;
    southIndicesEastToWest[i] = width * height - 1 - i;
  }

  for (i = 0; i < height; ++i) {
    eastIndicesNorthToSouth[i] = (i + 1) * width - 1;
    westIndicesSouthToNorth[i] = (height - i - 1) * width;
  }

  return {
    westIndicesSouthToNorth: westIndicesSouthToNorth,
    southIndicesEastToWest: southIndicesEastToWest,
    eastIndicesNorthToSouth: eastIndicesNorthToSouth,
    northIndicesWestToEast: northIndicesWestToEast,
  };
}

function addRegularGridIndices(width, height, indices, offset) {
  let index = 0;
  for (let j = 0; j < height - 1; ++j) {
    for (let i = 0; i < width - 1; ++i) {
      const upperLeft = index;
      const lowerLeft = upperLeft + width;
      const lowerRight = lowerLeft + 1;
      const upperRight = upperLeft + 1;

      indices[offset++] = upperLeft;
      indices[offset++] = lowerLeft;
      indices[offset++] = upperRight;
      indices[offset++] = upperRight;
      indices[offset++] = lowerLeft;
      indices[offset++] = lowerRight;

      ++index;
    }
    ++index;
  }
}

function addSkirtIndices(edgeIndices, vertexIndex, indices, offset) {
  let previousIndex = edgeIndices[0];

  const length = edgeIndices.length;
  for (let i = 1; i < length; ++i) {
    const index = edgeIndices[i];

    indices[offset++] = previousIndex;
    indices[offset++] = index;
    indices[offset++] = vertexIndex;

    indices[offset++] = vertexIndex;
    indices[offset++] = index;
    indices[offset++] = vertexIndex + 1;

    previousIndex = index;
    ++vertexIndex;
  }

  return offset;
}

/**
 * 指定从高度图创建的地形质量。值为 1.0 将
 * 确保相邻高度图顶点之间的间距不超过
 * {@link Globe.maximumScreenSpaceError} 屏幕像素，但可能会非常慢。
 * 值为 0.5 将使估计的零级几何误差减半，允许相邻
 * 高度图顶点之间有双倍的屏幕像素，从而渲染更快。
 * @type {number}
 */
TerrainProvider.heightmapTerrainQuality = 0.25;

/**
 * 当地形几何来自高度图时，确定合适的几何误差估计值。
 *
 * @param {Ellipsoid} ellipsoid 地形所附加的椭球体。
 * @param {number} tileImageWidth 与单个瓦片关联的高度图宽度（像素）。
 * @param {number} numberOfTilesAtLevelZero 零级瓦片水平方向的数量。
 * @returns {number} 估计的几何误差。
 */
TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap = function (
  ellipsoid,
  tileImageWidth,
  numberOfTilesAtLevelZero,
) {
  return (
    (ellipsoid.maximumRadius *
      2 *
      Math.PI *
      TerrainProvider.heightmapTerrainQuality) /
    (tileImageWidth * numberOfTilesAtLevelZero)
  );
};

/**
 * 请求给定瓦片的几何数据。结果必须包含地形数据，
 * 并可选择性地包含水掩码和可用子瓦片的指示。
 * @function
 *
 * @param {number} x 要请求几何的瓦片 X 坐标。
 * @param {number} y 要请求几何的瓦片 Y 坐标。
 * @param {number} level 要请求几何的瓦片层级。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求几何的 Promise。如果此方法
 *          返回 undefined 而非 Promise，则表示已有太多待处理请求，
 *          该请求将在稍后重试。
 */
TerrainProvider.prototype.requestTileGeometry =
  DeveloperError.throwInstantiationError;

/**
 * 获取给定层级瓦片允许的最大几何误差。
 * @function
 *
 * @param {number} level 要获取最大几何误差的瓦片层级。
 * @returns {number} 最大几何误差。
 */
TerrainProvider.prototype.getLevelMaximumGeometricError =
  DeveloperError.throwInstantiationError;

/**
 * 确定瓦片数据是否可加载。
 * @function
 *
 * @param {number} x 要请求几何的瓦片 X 坐标。
 * @param {number} y 要请求几何的瓦片 Y 坐标。
 * @param {number} level 要请求几何的瓦片层级。
 * @returns {boolean|undefined} 如果地形提供者不支持则返回 undefined，否则返回 true 或 false。
 */
TerrainProvider.prototype.getTileDataAvailable =
  DeveloperError.throwInstantiationError;

/**
 * 确保为瓦片加载可用性数据。
 * @function
 *
 * @param {number} x 要请求几何的瓦片 X 坐标。
 * @param {number} y 要请求几何的瓦片 Y 坐标。
 * @param {number} level 要请求几何的瓦片层级。
 * @returns {undefined|Promise<void>} 如果无需加载任何数据则返回 undefined，否则返回在所有必需瓦片加载完成后解析的 Promise。
 */
TerrainProvider.prototype.loadTileDataAvailability =
  DeveloperError.throwInstantiationError;
export default TerrainProvider;

/**
 * 发生错误时调用的函数。
 * @callback TerrainProvider.ErrorEvent
 *
 * @this TerrainProvider
 * @param {TileProviderError} err 包含所发生的错误详细信息的对象。
 */
