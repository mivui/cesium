import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import MetadataType from "./MetadataType.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";

/**
 * 来自 {@link VoxelPrimitive} 的一个体素单元。
 * <p>
 * 提供对体素图元中单个单元相关属性的访问。
 * </p>
 * <p>
 * 不要直接构造此对象。通过使用 {@link Scene#pickVoxel} 进行拾取来访问它。
 * </p>
 *
 * @alias VoxelCell
 * @constructor
 *
 * @param {VoxelPrimitive} primitive 包含该单元的体素图元
 * @param {number} tileIndex 瓦片的索引
 * @param {number} sampleIndex 瓦片内样本的索引，包含此单元的元数据
 *
 * @example
 * // 左键点击时，在控制台日志中显示体素单元的所有属性。
 * handler.setInputAction(function(movement) {
 *   const voxelCell = scene.pickVoxel(movement.position);
 *   if (voxelCell instanceof Cesium.VoxelCell) {
 *     const propertyIds = voxelCell.getPropertyIds();
 *     const length = propertyIds.length;
 *     for (let i = 0; i < length; ++i) {
 *       const propertyId = propertyIds[i];
 *       console.log(`{propertyId}: ${voxelCell.getProperty(propertyId)}`);
 *     }
 *   }
 * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 *
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
function VoxelCell(primitive, tileIndex, sampleIndex) {
  this._primitive = primitive;
  this._tileIndex = tileIndex;
  this._sampleIndex = sampleIndex;
  this._metadata = {};
  this._orientedBoundingBox = new OrientedBoundingBox();
}

/**
 * Construct a VoxelCell, and update the metadata and bounding box using the properties
 * of a supplied keyframe node.
 *
 * @private
 * @param {VoxelPrimitive} primitive The voxel primitive containing the cell.
 * @param {number} tileIndex The index of the tile.
 * @param {number} sampleIndex The index of the sample within the tile, containing metadata for this cell.
 * @param {KeyframeNode} keyframeNode The keyframe node containing information about the tile.
 * @returns {VoxelCell}
 *
 * @experimental This feature is not final and is subject to change without Cesium's standard deprecation policy.
 */
VoxelCell.fromKeyframeNode = function (
  primitive,
  tileIndex,
  sampleIndex,
  keyframeNode,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("primitive", primitive);
  Check.typeOf.number("tileIndex", tileIndex);
  Check.typeOf.number("sampleIndex", sampleIndex);
  Check.typeOf.object("keyframeNode", keyframeNode);
  //>>includeEnd('debug');

  const voxelCell = new VoxelCell(primitive, tileIndex, sampleIndex);
  const { spatialNode, content } = keyframeNode;
  voxelCell._metadata = getMetadataForSample(primitive, content, sampleIndex);
  voxelCell._orientedBoundingBox = getOrientedBoundingBox(
    primitive,
    spatialNode,
    sampleIndex,
    voxelCell._orientedBoundingBox,
  );
  return voxelCell;
};

/**
 * @private
 * @param {VoxelPrimitive} primitive
 * @param {VoxelContent} content
 * @param {number} sampleIndex
 * @returns {object}
 */
function getMetadataForSample(primitive, content, sampleIndex) {
  if (!defined(content) || !defined(content.metadata)) {
    return undefined;
  }
  const { names, types } = primitive.provider;
  const { metadata } = content;
  const metadataMap = {};
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const componentCount = MetadataType.getComponentCount(types[i]);
    const samples = metadata[i].slice(
      sampleIndex * componentCount,
      (sampleIndex + 1) * componentCount,
    );
    metadataMap[name] = samples;
  }
  return metadataMap;
}

const tileCoordinateScratch = new Cartesian3();
const tileUvScratch = new Cartesian3();

/**
 * @private
 * @param {VoxelPrimitive} primitive
 * @param {SpatialNode} spatialNode
 * @param {OrientedBoundingBox} result
 * @returns {OrientedBoundingBox}
 */
function getOrientedBoundingBox(primitive, spatialNode, sampleIndex, result) {
  // Convert the sample index into a 3D tile coordinate
  // Note: dimensions from the spatialNode include padding
  const paddedDimensions = spatialNode.dimensions;
  const sliceSize = paddedDimensions.x * paddedDimensions.y;
  const zIndex = Math.floor(sampleIndex / sliceSize);
  const indexInSlice = sampleIndex - zIndex * sliceSize;
  const yIndex = Math.floor(indexInSlice / paddedDimensions.x);
  const xIndex = indexInSlice - yIndex * paddedDimensions.x;
  const tileCoordinate = Cartesian3.fromElements(
    xIndex,
    yIndex,
    zIndex,
    tileCoordinateScratch,
  );

  // Remove padding, and convert to a fraction in [0, 1], where the limits are
  // the unpadded bounds of the tile
  const tileUv = Cartesian3.divideComponents(
    Cartesian3.subtract(
      tileCoordinate,
      primitive._paddingBefore,
      tileCoordinateScratch,
    ),
    primitive.dimensions,
    tileUvScratch,
  );

  const shape = primitive._shape;
  return shape.computeOrientedBoundingBoxForSample(
    spatialNode,
    primitive.dimensions,
    tileUv,
    result,
  );
}

Object.defineProperties(VoxelCell.prototype, {
  /**
   * Gets an object of the metadata values for this cell. The object's keys are the metadata names.
   *
   * @memberof VoxelCell.prototype
   *
   * @type {object}
   *
   * @readonly
   * @private
   */
  metadata: {
    get: function () {
      return this._metadata;
    },
  },

  /**
   * {@link Scene#pick} 返回的所有对象都有一个 <code>primitive</code> 属性。此属性返回包含该单元的 VoxelPrimitive。
   *
   * @memberof VoxelCell.prototype
   *
   * @type {VoxelPrimitive}
   *
   * @readonly
   */
  primitive: {
    get: function () {
      return this._primitive;
    },
  },

  /**
   * 获取单元的样本索引。
   *
   * @memberof VoxelCell.prototype
   *
   * @type {number}
   *
   * @readonly
   */
  sampleIndex: {
    get: function () {
      return this._sampleIndex;
    },
  },

  /**
   * 获取包含该单元的瓦片的索引。
   *
   * @memberof VoxelCell.prototype
   *
   * @type {number}
   *
   * @readonly
   */
  tileIndex: {
    get: function () {
      return this._tileIndex;
    },
  },

  /**
   * 获取包含该单元的有向包围盒的副本。
   *
   * @memberof VoxelCell.prototype
   *
   * @type {OrientedBoundingBox}
   *
   * @readonly
   */
  orientedBoundingBox: {
    get: function () {
      return this._orientedBoundingBox.clone();
    },
  },
});

/**
 * 如果要素包含此属性，则返回 <code>true</code>。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} 要素是否包含此属性。
 */
VoxelCell.prototype.hasProperty = function (name) {
  return defined(this._metadata[name]);
};

/**
 * 返回要素的元数据属性名称数组。
 *
 * @returns {string[]} 要素属性的 ID。
 */
VoxelCell.prototype.getNames = function () {
  return Object.keys(this._metadata);
};

/**
 * 返回具有给定名称的单元中元数据值的副本。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果要素没有此属性，则返回 <code>undefined</code>。
 *
 * @example
 * // 在控制台日志中显示体素单元的所有属性。
 * const names = voxelCell.getNames();
 * for (let i = 0; i < names.length; ++i) {
 *   const name = names[i];
 *   console.log(`{name}: ${voxelCell.getProperty(name)}`);
 * }
 */
VoxelCell.prototype.getProperty = function (name) {
  return this._metadata[name];
};

export default VoxelCell;
