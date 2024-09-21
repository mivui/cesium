import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import GeographicProjection from "./GeographicProjection.js";
import HeightmapEncoding from "./HeightmapEncoding.js";
import HeightmapTessellator from "./HeightmapTessellator.js";
import CesiumMath from "./Math.js";
import OrientedBoundingBox from "./OrientedBoundingBox.js";
import Rectangle from "./Rectangle.js";
import TaskProcessor from "./TaskProcessor.js";
import TerrainData from "./TerrainData.js";
import TerrainEncoding from "./TerrainEncoding.js";
import TerrainMesh from "./TerrainMesh.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * 单个瓦片的地形数据，其中地形数据表示为高度贴图。 高度贴图
 * 是按行优先顺序从北到南、从西到东排列的矩形高度数组。
 *
 * @alias HeightmapTerrainData
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} options.buffer 包含高度数据的缓冲区。
 * @param {number} options.width 高度贴图的宽度（经度方向），以样本为单位。
 * @param {number} options.height 高度贴图的高度（纬度方向），以样本为单位。
 * @param {number} [options.childTileMask=15] 一个位掩码，指示此图块的四个子图块中存在哪一个。
 * 如果设置了子位，则当该图块
 * 是必需的。 如果清除该位，则不会请求子平铺，并且 geometry 为
 * 而是从父级进行上采样。 位值如下所示：
 * <table>
 * <tr><th>Bit Position</th><th>位值</th><th>子平铺</th></tr>
 * <tr><td>0</td><td>1</td><td>西南</td></tr>
 * <tr><td>1</td><td>2</td><td>东南</td></tr>
 * <tr><td>2</td><td>4</td><td>西北</td></tr>
 * <tr><td>3</td><td>8</td><td>东北</td></tr>
 * </table>
 * @param {Uint8Array} [options.waterMask] 此地形数据中包含的水掩膜 （如果有）。 水面罩是一个正方形
 *                    Uint8Array 或图像，其中值 255 表示水，值 0 表示陆地。
 *                    允许介于 0 和 255 之间的值，以便在陆地和水之间平滑混合。
 * @param {object} [options.structure] 描述高度数据结构的对象。
 * @param {number} [options.structure.heightScale=1.0] 将高度样本相乘以获得
 * heightOffset 以上的高度，以米为单位。 heightOffset 将添加到生成的
 * 乘以刻度后的高度。
 * @param {number} [options.structure.heightOffset=0.0] 要添加到缩放高度以获得最终
 * 高度（以米为单位）。 偏移量是在高度样本乘以
 * heightScale 的
 * @param {number} [options.structure.elementsPerHeight=1] 缓冲区中构成单个高度的元素数
 * 样本。 这通常为 1，表示每个元素都是一个单独的高度样本。 如果
 * 大于 1，则该数量的元素一起构成高度样本，即
 * 根据 structure.elementMultiplier 和 structure.isBigEndian 属性计算。
 * @param {number} [options.structure.stride=1] 从 的第一个元素开始跳过的元素数
 * 一个高度到下一个高度的第一个元素。
 * @param {number} [options.structure.elementMultiplier=256.0] 用于计算高度值的乘数，当
 * stride 属性大于 1。 例如，如果 stride 为 4，并且 strideMultiplier
 * 为 256，则高度的计算方式如下：
 * '高度 = 缓冲区[索引] + 缓冲区[索引 + 1] * 256 + 缓冲区[索引 + 2] * 256 * 256 + 缓冲区[索引 + 3] * 256 * 256 * 256'
 * 这是假设 isBigEndian 属性为 false。 如果为 true，则
 * 元素被反转。
 * @param {boolean} [options.structure.isBigEndian=false] 表示缓冲区中元素的字节序，当
 * stride 属性大于 1。 如果此属性为 false，则第一个元素是
 * 低阶元素。 如果为 true，则第一个元素是高阶元素。
 * @param {number} [options.structure.lowestEncodedHeight] 高度缓冲区中可以存储的最小值。 任何较低的高度
 * 小于该值，在使用 'heightScale' 和 'heightOffset' 编码后，该值被固定到该值。 例如，如果 height
 * buffer 是 'Uint16Array'，此值应为 0，因为 'Uint16Array' 无法存储负数。 如果该参数为
 * 未指定，不强制执行最小值。
 * @param {number} [options.structure.highestEncodedHeight] 高度缓冲区中可以存储的最大值。 任何更高的高度
 * 小于该值，在使用 'heightScale' 和 'heightOffset' 编码后，该值被固定到该值。 例如，如果 height
 * buffer 是 'Uint16Array'，此值应为 '256 * 256 - 1' 或 65535，因为 'Uint16Array' 无法存储更大的数字
 * 比 65535 多。 如果未指定此参数，则不强制实施最大值。
 * @param {HeightmapEncoding} [options.encoding=HeightmapEncoding.NONE] 在缓冲区上使用的编码。
 * @param {boolean} [options.createdByUpsampling=false] 如果此实例是通过对另一个实例进行上采样创建的，则为 True;
 * 否则为 false。
 *
 *
 * @example
 * const buffer = ...
 * const heightBuffer = new Uint16Array(buffer, 0, that._heightmapWidth * that._heightmapWidth);
 * const childTileMask = new Uint8Array(buffer, heightBuffer.byteLength, 1)[0];
 * const waterMask = new Uint8Array(buffer, heightBuffer.byteLength + 1, buffer.byteLength - heightBuffer.byteLength - 1);
 * const terrainData = new Cesium.HeightmapTerrainData({
 *   buffer : heightBuffer,
 *   width : 65,
 *   height : 65,
 *   childTileMask : childTileMask,
 *   waterMask : waterMask
 * });
 *
 * @see TerrainData
 * @see QuantizedMeshTerrainData
 * @see GoogleEarthEnterpriseTerrainData
 */
function HeightmapTerrainData(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.buffer)) {
    throw new DeveloperError("options.buffer is required.");
  }
  if (!defined(options.width)) {
    throw new DeveloperError("options.width is required.");
  }
  if (!defined(options.height)) {
    throw new DeveloperError("options.height is required.");
  }
  //>>includeEnd('debug');

  this._buffer = options.buffer;
  this._width = options.width;
  this._height = options.height;
  this._childTileMask = defaultValue(options.childTileMask, 15);
  this._encoding = defaultValue(options.encoding, HeightmapEncoding.NONE);

  const defaultStructure = HeightmapTessellator.DEFAULT_STRUCTURE;
  let structure = options.structure;
  if (!defined(structure)) {
    structure = defaultStructure;
  } else if (structure !== defaultStructure) {
    structure.heightScale = defaultValue(
      structure.heightScale,
      defaultStructure.heightScale
    );
    structure.heightOffset = defaultValue(
      structure.heightOffset,
      defaultStructure.heightOffset
    );
    structure.elementsPerHeight = defaultValue(
      structure.elementsPerHeight,
      defaultStructure.elementsPerHeight
    );
    structure.stride = defaultValue(structure.stride, defaultStructure.stride);
    structure.elementMultiplier = defaultValue(
      structure.elementMultiplier,
      defaultStructure.elementMultiplier
    );
    structure.isBigEndian = defaultValue(
      structure.isBigEndian,
      defaultStructure.isBigEndian
    );
  }

  this._structure = structure;
  this._createdByUpsampling = defaultValue(options.createdByUpsampling, false);
  this._waterMask = options.waterMask;

  this._skirtHeight = undefined;
  this._bufferType =
    this._encoding === HeightmapEncoding.LERC
      ? Float32Array
      : this._buffer.constructor;
  this._mesh = undefined;
}

Object.defineProperties(HeightmapTerrainData.prototype, {
  /**
   * An array of credits for this tile.
   * @memberof HeightmapTerrainData.prototype
   * @type {Credit[]}
   */
  credits: {
    get: function () {
      return undefined;
    },
  },
  /**
   * 此地形数据中包含的水面罩（如果有）。 水面罩是一个正方形
   * Uint8Array 或图像，其中值 255 表示水，值 0 表示陆地。
   * 允许介于 0 和 255 之间的值，以便在陆地和水之间平滑混合。
   * @memberof HeightmapTerrainData.prototype
   * @type {Uint8Array|HTMLImageElement|HTMLCanvasElement}
   */
  waterMask: {
    get: function () {
      return this._waterMask;
    },
  },

  childTileMask: {
    get: function () {
      return this._childTileMask;
    },
  },
});

const createMeshTaskName = "createVerticesFromHeightmap";
const createMeshTaskProcessorNoThrottle = new TaskProcessor(createMeshTaskName);
const createMeshTaskProcessorThrottle = new TaskProcessor(
  createMeshTaskName,
  TerrainData.maximumAsynchronousTasks
);

/**
 * 从此地形数据创建 {@link TerrainMesh}。
 *
 * @private
 *
 * @param {object} options 对象，具有以下属性:
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的平铺方案。
 * @param {number} options.x x坐标 瓦片，为其创建地形数据。
 * @param {number} options.y y坐标 瓦片，为其创建 terrain 数据。
 * @param {number} options.level 要为其创建 terrain 数据的瓦片的级别。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例尺。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 地形被夸大的相对高度。
 * @param {boolean} [options.throttle=true] 如果为 true，则表示如果正在进行的异步网格创建太多，则需要重试此操作。
 * @returns {Promise<TerrainMesh>|undefined} 地形网格的 Promise，如果太多，则为 undefined
 * 异步网格创建已在进行中，操作应
 * 稍后重试。
 */
HeightmapTerrainData.prototype.createMesh = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.tilingScheme", options.tilingScheme);
  Check.typeOf.number("options.x", options.x);
  Check.typeOf.number("options.y", options.y);
  Check.typeOf.number("options.level", options.level);
  //>>includeEnd('debug');

  const tilingScheme = options.tilingScheme;
  const x = options.x;
  const y = options.y;
  const level = options.level;
  const exaggeration = defaultValue(options.exaggeration, 1.0);
  const exaggerationRelativeHeight = defaultValue(
    options.exaggerationRelativeHeight,
    0.0
  );
  const throttle = defaultValue(options.throttle, true);

  const ellipsoid = tilingScheme.ellipsoid;
  const nativeRectangle = tilingScheme.tileXYToNativeRectangle(x, y, level);
  const rectangle = tilingScheme.tileXYToRectangle(x, y, level);

  // Compute the center of the tile for RTC rendering.
  const center = ellipsoid.cartographicToCartesian(Rectangle.center(rectangle));

  const structure = this._structure;

  const levelZeroMaxError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
    ellipsoid,
    this._width,
    tilingScheme.getNumberOfXTilesAtLevel(0)
  );
  const thisLevelMaxError = levelZeroMaxError / (1 << level);
  this._skirtHeight = Math.min(thisLevelMaxError * 4.0, 1000.0);

  const createMeshTaskProcessor = throttle
    ? createMeshTaskProcessorThrottle
    : createMeshTaskProcessorNoThrottle;

  const verticesPromise = createMeshTaskProcessor.scheduleTask({
    heightmap: this._buffer,
    structure: structure,
    includeWebMercatorT: true,
    width: this._width,
    height: this._height,
    nativeRectangle: nativeRectangle,
    rectangle: rectangle,
    relativeToCenter: center,
    ellipsoid: ellipsoid,
    skirtHeight: this._skirtHeight,
    isGeographic: tilingScheme.projection instanceof GeographicProjection,
    exaggeration: exaggeration,
    exaggerationRelativeHeight: exaggerationRelativeHeight,
    encoding: this._encoding,
  });

  if (!defined(verticesPromise)) {
    // Postponed
    return undefined;
  }

  const that = this;
  return Promise.resolve(verticesPromise).then(function (result) {
    let indicesAndEdges;
    if (that._skirtHeight > 0.0) {
      indicesAndEdges = TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices(
        result.gridWidth,
        result.gridHeight
      );
    } else {
      indicesAndEdges = TerrainProvider.getRegularGridIndicesAndEdgeIndices(
        result.gridWidth,
        result.gridHeight
      );
    }

    const vertexCountWithoutSkirts = result.gridWidth * result.gridHeight;

    // Clone complex result objects because the transfer from the web worker
    // has stripped them down to JSON-style objects.
    that._mesh = new TerrainMesh(
      center,
      new Float32Array(result.vertices),
      indicesAndEdges.indices,
      indicesAndEdges.indexCountWithoutSkirts,
      vertexCountWithoutSkirts,
      result.minimumHeight,
      result.maximumHeight,
      BoundingSphere.clone(result.boundingSphere3D),
      Cartesian3.clone(result.occludeePointInScaledSpace),
      result.numberOfAttributes,
      OrientedBoundingBox.clone(result.orientedBoundingBox),
      TerrainEncoding.clone(result.encoding),
      indicesAndEdges.westIndicesSouthToNorth,
      indicesAndEdges.southIndicesEastToWest,
      indicesAndEdges.eastIndicesNorthToSouth,
      indicesAndEdges.northIndicesWestToEast
    );

    // Free memory received from server after mesh is created.
    that._buffer = undefined;
    return that._mesh;
  });
};

/**
 * @param {object} options 对象，具有以下属性:
 * @param {TilingScheme} options.tilingScheme The tiling scheme to which this tile belongs.
 * @param {number} options.x x坐标  tile for which to create the terrain data.
 * @param {number} options.y y坐标 tile for which to create the terrain data.
 * @param {number} options.level The level of the tile for which to create the terrain data.
 * @param {number} [options.exaggeration=1.0] The scale used to exaggerate the terrain.
 * @param {number} [options.exaggerationRelativeHeight=0.0] The height relative to which terrain is exaggerated.
 *
 * @private
 */
HeightmapTerrainData.prototype._createMeshSync = function (options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.tilingScheme", options.tilingScheme);
  Check.typeOf.number("options.x", options.x);
  Check.typeOf.number("options.y", options.y);
  Check.typeOf.number("options.level", options.level);
  //>>includeEnd('debug');

  const tilingScheme = options.tilingScheme;
  const x = options.x;
  const y = options.y;
  const level = options.level;
  const exaggeration = defaultValue(options.exaggeration, 1.0);
  const exaggerationRelativeHeight = defaultValue(
    options.exaggerationRelativeHeight,
    0.0
  );

  const ellipsoid = tilingScheme.ellipsoid;
  const nativeRectangle = tilingScheme.tileXYToNativeRectangle(x, y, level);
  const rectangle = tilingScheme.tileXYToRectangle(x, y, level);

  // Compute the center of the tile for RTC rendering.
  const center = ellipsoid.cartographicToCartesian(Rectangle.center(rectangle));

  const structure = this._structure;

  const levelZeroMaxError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
    ellipsoid,
    this._width,
    tilingScheme.getNumberOfXTilesAtLevel(0)
  );
  const thisLevelMaxError = levelZeroMaxError / (1 << level);
  this._skirtHeight = Math.min(thisLevelMaxError * 4.0, 1000.0);

  const result = HeightmapTessellator.computeVertices({
    heightmap: this._buffer,
    structure: structure,
    includeWebMercatorT: true,
    width: this._width,
    height: this._height,
    nativeRectangle: nativeRectangle,
    rectangle: rectangle,
    relativeToCenter: center,
    ellipsoid: ellipsoid,
    skirtHeight: this._skirtHeight,
    isGeographic: tilingScheme.projection instanceof GeographicProjection,
    exaggeration: exaggeration,
    exaggerationRelativeHeight: exaggerationRelativeHeight,
  });

  // Free memory received from server after mesh is created.
  this._buffer = undefined;

  let indicesAndEdges;
  if (this._skirtHeight > 0.0) {
    indicesAndEdges = TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices(
      this._width,
      this._height
    );
  } else {
    indicesAndEdges = TerrainProvider.getRegularGridIndicesAndEdgeIndices(
      this._width,
      this._height
    );
  }

  const vertexCountWithoutSkirts = result.gridWidth * result.gridHeight;

  // No need to clone here (as we do in the async version) because the result
  // is not coming from a web worker.
  this._mesh = new TerrainMesh(
    center,
    result.vertices,
    indicesAndEdges.indices,
    indicesAndEdges.indexCountWithoutSkirts,
    vertexCountWithoutSkirts,
    result.minimumHeight,
    result.maximumHeight,
    result.boundingSphere3D,
    result.occludeePointInScaledSpace,
    result.encoding.stride,
    result.orientedBoundingBox,
    result.encoding,
    indicesAndEdges.westIndicesSouthToNorth,
    indicesAndEdges.southIndicesEastToWest,
    indicesAndEdges.eastIndicesNorthToSouth,
    indicesAndEdges.northIndicesWestToEast
  );

  return this._mesh;
};

/**
 * 计算指定经纬度处的地形高度。
 *
 * @param {Rectangle} rectangle 此地形数据覆盖的矩形。
 * @param {number} longitude 以弧度为单位的经度。
 * @param {number} latitude 以弧度为单位的纬度。
 * @returns {number} 指定位置的地形高度。 如果位置
 * 在矩形之外，这个方法会推断高度，很可能会很疯狂
 * 对于远在矩形之外的位置不正确。
 */
HeightmapTerrainData.prototype.interpolateHeight = function (
  rectangle,
  longitude,
  latitude
) {
  const width = this._width;
  const height = this._height;

  const structure = this._structure;
  const stride = structure.stride;
  const elementsPerHeight = structure.elementsPerHeight;
  const elementMultiplier = structure.elementMultiplier;
  const isBigEndian = structure.isBigEndian;
  const heightOffset = structure.heightOffset;
  const heightScale = structure.heightScale;

  const isMeshCreated = defined(this._mesh);
  const isLERCEncoding = this._encoding === HeightmapEncoding.LERC;
  const isInterpolationImpossible = !isMeshCreated && isLERCEncoding;
  if (isInterpolationImpossible) {
    // We can't interpolate using the buffer because it's LERC encoded
    //  so please call createMesh() first and interpolate using the mesh;
    //  as mesh creation will decode the LERC buffer
    return undefined;
  }

  let heightSample;
  if (isMeshCreated) {
    const buffer = this._mesh.vertices;
    const encoding = this._mesh.encoding;
    heightSample = interpolateMeshHeight(
      buffer,
      encoding,
      heightOffset,
      heightScale,
      rectangle,
      width,
      height,
      longitude,
      latitude
    );
  } else {
    heightSample = interpolateHeight(
      this._buffer,
      elementsPerHeight,
      elementMultiplier,
      stride,
      isBigEndian,
      rectangle,
      width,
      height,
      longitude,
      latitude
    );
    heightSample = heightSample * heightScale + heightOffset;
  }

  return heightSample;
};

/**
 * 对此地形数据进行上采样，以供后代瓦片使用。 生成的实例将包含
 * 高度样本，必要时进行插值。
 *
 * @param {TilingScheme} tilingScheme 此地形数据的平铺方案。
 * @param {number} thisX 平铺方案中此瓦片的 X 坐标。
 * @param {number} thisY 此瓦片在切片方案中的 Y 坐标。
 * @param {number} thisLevel 此瓦片在平铺方案中的级别。
 * @param {number} descendantX 我们正在上采样的后代瓦片的平铺方案中的 X 坐标。
 * @param {number} descendantY 我们正在进行上采样的后代瓦片的平铺方案中的 Y 坐标。
 * @param {number} descendantLevel 我们正在上采样的后代瓦片的平铺方案中的级别。
 * @returns {Promise<HeightmapTerrainData>|undefined} 为后代瓦片提供上采样高度贴图地形数据的承诺，
 * 或 undefined 如果网格不可用。
 */
HeightmapTerrainData.prototype.upsample = function (
  tilingScheme,
  thisX,
  thisY,
  thisLevel,
  descendantX,
  descendantY,
  descendantLevel
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(tilingScheme)) {
    throw new DeveloperError("tilingScheme is required.");
  }
  if (!defined(thisX)) {
    throw new DeveloperError("thisX is required.");
  }
  if (!defined(thisY)) {
    throw new DeveloperError("thisY is required.");
  }
  if (!defined(thisLevel)) {
    throw new DeveloperError("thisLevel is required.");
  }
  if (!defined(descendantX)) {
    throw new DeveloperError("descendantX is required.");
  }
  if (!defined(descendantY)) {
    throw new DeveloperError("descendantY is required.");
  }
  if (!defined(descendantLevel)) {
    throw new DeveloperError("descendantLevel is required.");
  }
  const levelDifference = descendantLevel - thisLevel;
  if (levelDifference > 1) {
    throw new DeveloperError(
      "Upsampling through more than one level at a time is not currently supported."
    );
  }
  //>>includeEnd('debug');

  const meshData = this._mesh;
  if (!defined(meshData)) {
    return undefined;
  }

  const width = this._width;
  const height = this._height;
  const structure = this._structure;
  const stride = structure.stride;

  const heights = new this._bufferType(width * height * stride);

  const buffer = meshData.vertices;
  const encoding = meshData.encoding;

  // PERFORMANCE_IDEA: don't recompute these rectangles - the caller already knows them.
  const sourceRectangle = tilingScheme.tileXYToRectangle(
    thisX,
    thisY,
    thisLevel
  );
  const destinationRectangle = tilingScheme.tileXYToRectangle(
    descendantX,
    descendantY,
    descendantLevel
  );

  const heightOffset = structure.heightOffset;
  const heightScale = structure.heightScale;

  const elementsPerHeight = structure.elementsPerHeight;
  const elementMultiplier = structure.elementMultiplier;
  const isBigEndian = structure.isBigEndian;

  const divisor = Math.pow(elementMultiplier, elementsPerHeight - 1);

  for (let j = 0; j < height; ++j) {
    const latitude = CesiumMath.lerp(
      destinationRectangle.north,
      destinationRectangle.south,
      j / (height - 1)
    );
    for (let i = 0; i < width; ++i) {
      const longitude = CesiumMath.lerp(
        destinationRectangle.west,
        destinationRectangle.east,
        i / (width - 1)
      );
      let heightSample = interpolateMeshHeight(
        buffer,
        encoding,
        heightOffset,
        heightScale,
        sourceRectangle,
        width,
        height,
        longitude,
        latitude
      );

      // Use conditionals here instead of Math.min and Math.max so that an undefined
      // lowestEncodedHeight or highestEncodedHeight has no effect.
      heightSample =
        heightSample < structure.lowestEncodedHeight
          ? structure.lowestEncodedHeight
          : heightSample;
      heightSample =
        heightSample > structure.highestEncodedHeight
          ? structure.highestEncodedHeight
          : heightSample;

      setHeight(
        heights,
        elementsPerHeight,
        elementMultiplier,
        divisor,
        stride,
        isBigEndian,
        j * width + i,
        heightSample
      );
    }
  }

  return Promise.resolve(
    new HeightmapTerrainData({
      buffer: heights,
      width: width,
      height: height,
      childTileMask: 0,
      structure: this._structure,
      createdByUpsampling: true,
    })
  );
};

/**
 * 根据
 * {@link HeightmapTerrainData.childTileMask} 中。 假定给定的子图块坐标
 * 成为此牌的四个子牌之一。 如果非子图块坐标为
 * 给定，则返回 southeast child tile 的可用性。
 *
 * @param {number} thisX 此（父）瓦片的瓦片 X 坐标。
 * @param {number} thisY 此（父）瓦片的瓦片 Y 坐标。
 * @param {number} childX 用于检查可用性的子磁贴的磁贴 X 坐标。
 * @param {number} childY 要检查可用性的子磁贴的磁贴 Y 坐标。
 * @returns {boolean} 如果子磁贴可用，则为 True;否则为 false。
 */
HeightmapTerrainData.prototype.isChildAvailable = function (
  thisX,
  thisY,
  childX,
  childY
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(thisX)) {
    throw new DeveloperError("thisX is required.");
  }
  if (!defined(thisY)) {
    throw new DeveloperError("thisY is required.");
  }
  if (!defined(childX)) {
    throw new DeveloperError("childX is required.");
  }
  if (!defined(childY)) {
    throw new DeveloperError("childY is required.");
  }
  //>>includeEnd('debug');

  let bitNumber = 2; // northwest child
  if (childX !== thisX * 2) {
    ++bitNumber; // east child
  }
  if (childY !== thisY * 2) {
    bitNumber -= 2; // south child
  }

  return (this._childTileMask & (1 << bitNumber)) !== 0;
};

/**
 * 获取一个值，该值指示此地形数据是否是通过对较低分辨率的上采样创建的
 * 地形数据。 如果此值为 false，则数据是从其他来源获取的，例如
 * 从远程服务器下载。 对于实例，此方法应返回 true
 * 从调用 {@link HeightmapTerrainData#upsample} 返回。
 *
 * @returns {boolean} 如果此实例是通过上采样创建的，则为 True;否则为 false。
 */
HeightmapTerrainData.prototype.wasCreatedByUpsampling = function () {
  return this._createdByUpsampling;
};

function interpolateHeight(
  sourceHeights,
  elementsPerHeight,
  elementMultiplier,
  stride,
  isBigEndian,
  sourceRectangle,
  width,
  height,
  longitude,
  latitude
) {
  const fromWest =
    ((longitude - sourceRectangle.west) * (width - 1)) /
    (sourceRectangle.east - sourceRectangle.west);
  const fromSouth =
    ((latitude - sourceRectangle.south) * (height - 1)) /
    (sourceRectangle.north - sourceRectangle.south);

  let westInteger = fromWest | 0;
  let eastInteger = westInteger + 1;
  if (eastInteger >= width) {
    eastInteger = width - 1;
    westInteger = width - 2;
  }

  let southInteger = fromSouth | 0;
  let northInteger = southInteger + 1;
  if (northInteger >= height) {
    northInteger = height - 1;
    southInteger = height - 2;
  }

  const dx = fromWest - westInteger;
  const dy = fromSouth - southInteger;

  southInteger = height - 1 - southInteger;
  northInteger = height - 1 - northInteger;

  const southwestHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    southInteger * width + westInteger
  );
  const southeastHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    southInteger * width + eastInteger
  );
  const northwestHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    northInteger * width + westInteger
  );
  const northeastHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    northInteger * width + eastInteger
  );

  return triangleInterpolateHeight(
    dx,
    dy,
    southwestHeight,
    southeastHeight,
    northwestHeight,
    northeastHeight
  );
}

function interpolateMeshHeight(
  buffer,
  encoding,
  heightOffset,
  heightScale,
  sourceRectangle,
  width,
  height,
  longitude,
  latitude
) {
  // returns a height encoded according to the structure's heightScale and heightOffset.
  const fromWest =
    ((longitude - sourceRectangle.west) * (width - 1)) /
    (sourceRectangle.east - sourceRectangle.west);
  const fromSouth =
    ((latitude - sourceRectangle.south) * (height - 1)) /
    (sourceRectangle.north - sourceRectangle.south);

  let westInteger = fromWest | 0;
  let eastInteger = westInteger + 1;
  if (eastInteger >= width) {
    eastInteger = width - 1;
    westInteger = width - 2;
  }

  let southInteger = fromSouth | 0;
  let northInteger = southInteger + 1;
  if (northInteger >= height) {
    northInteger = height - 1;
    southInteger = height - 2;
  }

  const dx = fromWest - westInteger;
  const dy = fromSouth - southInteger;

  southInteger = height - 1 - southInteger;
  northInteger = height - 1 - northInteger;

  const southwestHeight =
    (encoding.decodeHeight(buffer, southInteger * width + westInteger) -
      heightOffset) /
    heightScale;
  const southeastHeight =
    (encoding.decodeHeight(buffer, southInteger * width + eastInteger) -
      heightOffset) /
    heightScale;
  const northwestHeight =
    (encoding.decodeHeight(buffer, northInteger * width + westInteger) -
      heightOffset) /
    heightScale;
  const northeastHeight =
    (encoding.decodeHeight(buffer, northInteger * width + eastInteger) -
      heightOffset) /
    heightScale;

  return triangleInterpolateHeight(
    dx,
    dy,
    southwestHeight,
    southeastHeight,
    northwestHeight,
    northeastHeight
  );
}

function triangleInterpolateHeight(
  dX,
  dY,
  southwestHeight,
  southeastHeight,
  northwestHeight,
  northeastHeight
) {
  // The HeightmapTessellator bisects the quad from southwest to northeast.
  if (dY < dX) {
    // Lower right triangle
    return (
      southwestHeight +
      dX * (southeastHeight - southwestHeight) +
      dY * (northeastHeight - southeastHeight)
    );
  }

  // Upper left triangle
  return (
    southwestHeight +
    dX * (northeastHeight - northwestHeight) +
    dY * (northwestHeight - southwestHeight)
  );
}

function getHeight(
  heights,
  elementsPerHeight,
  elementMultiplier,
  stride,
  isBigEndian,
  index
) {
  index *= stride;

  let height = 0;
  let i;

  if (isBigEndian) {
    for (i = 0; i < elementsPerHeight; ++i) {
      height = height * elementMultiplier + heights[index + i];
    }
  } else {
    for (i = elementsPerHeight - 1; i >= 0; --i) {
      height = height * elementMultiplier + heights[index + i];
    }
  }

  return height;
}

function setHeight(
  heights,
  elementsPerHeight,
  elementMultiplier,
  divisor,
  stride,
  isBigEndian,
  index,
  height
) {
  index *= stride;

  let i;
  if (isBigEndian) {
    for (i = 0; i < elementsPerHeight - 1; ++i) {
      heights[index + i] = (height / divisor) | 0;
      height -= heights[index + i] * divisor;
      divisor /= elementMultiplier;
    }
  } else {
    for (i = elementsPerHeight - 1; i > 0; --i) {
      heights[index + i] = (height / divisor) | 0;
      height -= heights[index + i] * divisor;
      divisor /= elementMultiplier;
    }
  }
  heights[index + i] = height;
}
export default HeightmapTerrainData;
