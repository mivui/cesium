// @ts-check

import DeveloperError from "../Core/DeveloperError.js";

/** @import Cartesian3 from "../Core/Cartesian3.js"; */
/** @import Matrix4 from "../Core/Matrix4.js"; */
/** @import MetadataComponentType from "./MetadataComponentType.js"; */
/** @import MetadataType from "./MetadataType.js"; */
/** @import TimeIntervalCollection from "../Core/TimeIntervalCollection.js"; */
/** @import VoxelContent from "./VoxelContent.js"; */
/** @import VoxelShapeType from "./VoxelShapeType.js"; */

/**
 * 提供体素数据。旨在与 {@link VoxelPrimitive} 一起使用。
 * 该类型描述了一个接口，不打算直接实例化。
 *
 * @see Cesium3DTilesVoxelProvider
 * @see VoxelPrimitive
 * @see VoxelShapeType
 *
 * @experimental 此功能尚未最终确定，可能会在不遵循Cesium标准弃用政策的情况下发生变化。
 */
class VoxelProvider {
  constructor() {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 请求给定瓦片的数据。
   *
   * @param {object} [options] 包含以下属性的对象：
   * @param {number} [options.tileLevel=0] 瓦片的级别。
   * @param {number} [options.tileX=0] 瓦片的 X 坐标。
   * @param {number} [options.tileY=0] 瓦片的 Y 坐标。
   * @param {number} [options.tileZ=0] 瓦片的 Z 坐标。
   * @privateparam {number} [options.keyframe=0] 请求的关键帧。
   * @returns {Promise<VoxelContent>|undefined} 返回一个 Promise，该 Promise 解析为包含瓦片数据的 VoxelContent，或者如果该请求无法在本帧调度则返回 undefined。
   */
  requestData(options) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 从局部空间到全局空间的变换。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   * @constant
   */
  globalTransform;

  /**
   * 从形状空间到局部空间的变换。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   * @constant
   */
  shapeTransform;

  /**
   * 获取 {@link VoxelShapeType}
   *
   * @type {VoxelShapeType}
   * @readonly
   * @constant
   */
  shape;

  /**
   * 获取最小边界。
   * 如果未定义，将使用形状的默认最小边界。
   *
   * @type {Cartesian3|undefined}
   * @readonly
   * @constant
   */
  minBounds;

  /**
   * 获取最大边界。
   * 如果未定义，将使用形状的默认最大边界。
   *
   * @type {Cartesian3|undefined}
   * @readonly
   * @constant
   */
  maxBounds;

  /**
   * 获取图块每个维度的体素数量。这对于数据集中的所有图块都是相同的。
   *
   * @type {Cartesian3}
   * @readonly
   * @constant
   */
  dimensions;

  /**
   * 获取图块之前的填充体素数量。这在采样图块边缘时提高了渲染质量，但会增加内存使用量。
   *
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   * @constant
   */
  paddingBefore;

  /**
   * 获取图块之后的填充体素数量。这在采样图块边缘时提高了渲染质量，但会增加内存使用量。
   *
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   * @constant
   */
  paddingAfter;

  /**
   * 获取元数据名称。
   *
   * @type {string[]}
   * @readonly
   * @constant
   */
  names;

  /**
   * 获取元数据类型。
   *
   * @type {MetadataType[]}
   * @readonly
   * @constant
   */
  types;

  /**
   * 获取元数据分量类型。
   *
   * @type {MetadataComponentType[]}
   * @readonly
   * @constant
   */
  componentTypes;

  /**
   * 获取元数据最小值。
   *
   * @type {number[][]|undefined}
   * @readonly
   * @constant
   */
  minimumValues;

  /**
   * 获取元数据最大值。
   *
   * @type {number[][]|undefined}
   * @readonly
   * @constant
   */
  maximumValues;

  /**
   * 此提供程序存在的最大图块数量。
   * 此值用作体素渲染器分配适当 GPU 内存的提示。
   * 如果此值未知，则可以为 undefined。
   *
   * @type {number|undefined}
   * @readonly
   * @constant
   */
  maximumTileCount;

  /**
   * 图集中包含可用图块的细节级别数量。
   *
   * @type {number|undefined}
   * @readonly
   * @constant
   */
  availableLevels;

  /**
   * Gets the number of keyframes in the dataset.
   *
   * @type {number|undefined}
   * @readonly
   * @constant
   * @private
   */
  keyframeCount;

  /**
   * Gets the {@link TimeIntervalCollection} for the dataset,
   * or undefined if it doesn't have timestamps.
   *
   * @type {TimeIntervalCollection|undefined}
   * @readonly
   * @constant
   * @private
   */
  timeIntervalCollection;
}

export default VoxelProvider;
