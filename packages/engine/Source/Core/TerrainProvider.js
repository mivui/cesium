import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";

/**
 * 为椭球体的表面提供地形或其他几何体。 表面几何形状为
 * 根据 {@link TilingScheme} 组织成图块金字塔。 此类型描述
 * 接口，并且不打算直接实例化。
 *
 * @alias TerrainProvider
 * @constructor
 *
 * @see EllipsoidTerrainProvider
 * @see CesiumTerrainProvider
 * @see VRTheWorldTerrainProvider
 * @see GoogleEarthEnterpriseTerrainProvider
 */
function TerrainProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainProvider.prototype, {
  /**
   * 获取 terrain 提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof TerrainProvider.prototype
   * @type {Event<TerrainProvider.ErrorEvent>}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此地形提供程序处于活动状态时要显示的信用额度。 通常，这用于贷记
   * 地形的源。
   * @memberof TerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供程序使用的切片方案。
   * @memberof TerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，该值指示提供程序是否包含水面罩。 水面罩
   * 表示地球上的哪些区域是水面而不是陆地，因此可以渲染它们
   * 作为具有动画波形的反射表面。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，该值指示请求的图块是否包含顶点法线。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个对象，该对象可用于确定此提供程序提供的地形的可用性，例如
   * 在点和矩形中。如果可用性
   * 信息不可用。
   * @memberof TerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */
  availability: {
    get: DeveloperError.throwInstantiationError,
  },
});

const regularGridIndicesCache = [];

/**
 * 获取表示规则网格的三角形网格的索引列表。 叫
 * 此函数以相同的网格宽度和高度多次返回
 * 相同的索引列表。 顶点总数必须小于或等于
 * 至 65536。
 *
 * @param {number} width 规则网格中水平方向的顶点数。
 * @param {number} height 垂直方向上规则网格中的顶点数。
 * @returns {Uint16Array|Uint32Array} 索引列表。返回 64KB 或更小的 Uint16Array，返回 4GB 或更小的 Uint32Array。
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
 * @private
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
 * 指定从高度贴图创建的地形的质量。 值为 1.0 时
 * 确保相邻高度贴图顶点之间的间隔不超过
 * {@link Globe.maximumScreenSpaceError} 屏幕像素，并且可能会运行得非常慢。
 * 值 0.5 会将估计的零级几何误差减半，从而允许两倍的
 * 在相邻高度贴图顶点之间屏蔽像素，从而更快地渲染。
 * @type {number}
 */
TerrainProvider.heightmapTerrainQuality = 0.25;

/**
 * 当几何体来自高度贴图时，确定适当的几何误差估计值。
 *
 * @param {Ellipsoid} ellipsoid 地形附加到的椭球体。
 * @param {number} tileImageWidth 与单个瓦片关联的高度图的宽度（以像素为单位）。
 * @param {number} numberOfTilesAtLevelZero 瓦片级别为零时水平方向的瓦片数量。
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
 * 请求给定图块的几何图形。结果必须包括 terrain data 和
 * 可以选择包括水面罩和哪些子图块可用的指示。
 * @function
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 对所请求几何图形的承诺。如果这种方法
 *         返回未定义而不是承诺，这表明已经有太多请求
 *         等待中，请求将稍后重试。
 */
TerrainProvider.prototype.requestTileGeometry =
  DeveloperError.throwInstantiationError;

/**
 *获取给定级别的贴图中允许的最大几何误差。
 * @function
 *
 * @param {number} level 要获得最大几何误差的瓦片水平。
 * @returns {number} 最大几何误差。
 */
TerrainProvider.prototype.getLevelMaximumGeometricError =
  DeveloperError.throwInstantiationError;

/**
 * 确定是否可以加载磁贴的数据。
 * @function
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {boolean|undefined} 如果地形提供程序不支持，则为 undefined，否则为 true 或 false。
 */
TerrainProvider.prototype.getTileDataAvailable =
  DeveloperError.throwInstantiationError;

/**
 * 确保我们为tile加载了可用性数据
 * @function
 *
 * @param {number} x 要为其请求几何图形的贴图的X坐标。
 * @param {number} y 要为其请求几何图形的贴图的Y坐标。
 * @param {number} level 要为其请求几何图形的贴图的级别。
 * @returns {undefined|Promise<void>} 如果不需要加载任何内容，则为 Undefined，或者在加载所有必需的图块时解析的 Promise
 */
TerrainProvider.prototype.loadTileDataAvailability =
  DeveloperError.throwInstantiationError;
export default TerrainProvider;

/**
 * 发生错误时调用的函数。
 * @callback TerrainProvider.ErrorEvent
 *
 * @this TerrainProvider
 * @param {TileProviderError} err 一个对象，其中包含有关所发生错误的详细信息。
 */
