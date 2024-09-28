import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import MetadataType from "./MetadataType.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";

/**
 * 来自 {@link VoxelPrimitive} 的单元格。
 * <p>
 * 提供对与体素基元的一个单元格关联的属性的访问。
 * </p>
 * <p>
 * 不要直接构造它。 通过使用 {@link Scene#pickVoxel} 进行选取来访问它。
 * </p>
 *
 * @alias VoxelCell
 * @constructor
 *
 * @param {VoxelPrimitive} primitive 包含单元格的体素基元
 * @param {number} tileIndex 瓦片的索引
 * @param {number} sampleIndex 瓦片中样本的索引，包含此单元格的元数据
 *
 * @example
 * // On left click, display all the properties for a voxel cell in the console log.
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
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
function VoxelCell(primitive, tileIndex, sampleIndex) {
  this._primitive = primitive;
  this._tileIndex = tileIndex;
  this._sampleIndex = sampleIndex;
  this._metadata = {};
  this._orientedBoundingBox = new OrientedBoundingBox();
}

/**
 * 构造一个 VoxelCell，并使用属性更新元数据和边界框
 * 提供的关键帧节点。
 *
 * @private
 * @param {VoxelPrimitive} primitive 包含单元格的体素基元。
 * @param {number} tileIndex 瓦片的索引。
 * @param {number} sampleIndex 磁贴中样本的索引，包含此单元格的元数据。
 * @param {KeyframeNode} keyframeNode 包含有关图块信息的关键帧节点。
 * @returns {VoxelCell}
 *
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
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
  const { spatialNode, metadata } = keyframeNode;
  voxelCell._metadata = getMetadataForSample(primitive, metadata, sampleIndex);
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
 * @param {object} metadata
 * @param {number} sampleIndex
 * @returns {object}
 */
function getMetadataForSample(primitive, metadata, sampleIndex) {
  if (!defined(metadata)) {
    return undefined;
  }
  const { names, types } = primitive.provider;
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
   * 获取此单元格的元数据值的对象。对象的键是元数据名称。
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
   * {@link Scene#pick} 返回的所有对象都具有 <code>primitive</code> 属性。这将返回
   * 包含单元格的 VoxelPrimitive。
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
   * 获取单元格的样本索引。
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
   * 获取包含单元格的磁贴的索引。
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
   * 获取包含单元格的定向边界框的副本。
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
 * 如果功能包含此属性，则返回 <code>true</code>。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} 特征是否包含此属性。
 */
VoxelCell.prototype.hasProperty = function (name) {
  return defined(this._metadata[name]);
};

/**
 * 返回功能的元数据属性名称数组。
 *
 * @returns {string[]} 功能属性的 ID。
 */
VoxelCell.prototype.getNames = function () {
  return Object.keys(this._metadata);
};

/**
 * 返回具有给定名称的单元格中元数据值的副本。
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果特征没有此属性，<code>则为 undefined</code>。
 *
 * @example
 * // Display all the properties for a voxel cell in the console log.
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
