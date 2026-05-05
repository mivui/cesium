import DeveloperError from "../Core/DeveloperError.js";

/**
 * 提供体素数据。旨在与 {@link VoxelPrimitive} 一起使用。
 * 此类型描述了一个接口，不应直接实例化。
 *
 * @alias VoxelProvider
 * @constructor
 *
 * @see Cesium3DTilesVoxelProvider
 * @see VoxelPrimitive
 * @see VoxelShapeType
 *
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
function VoxelProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(VoxelProvider.prototype, {
  /**
   * 从局部空间到全局空间的变换。
   *
   * @memberof VoxelProvider.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   */
  globalTransform: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 从形状空间到局部空间的变换。
   *
   * @memberof VoxelProvider.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   */
  shapeTransform: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取 {@link VoxelShapeType}
   *
   * @memberof VoxelProvider.prototype
   * @type {VoxelShapeType}
   * @readonly
   */
  shape: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取最小边界。
   * 如果未定义，将使用形状的默认最小边界。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  minBounds: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取最大边界。
   * 如果未定义，将使用形状的默认最大边界。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  maxBounds: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取图块每个维度的体素数量。这对于数据集中的所有图块都是相同的。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3}
   * @readonly
   */
  dimensions: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取图块之前的填充体素数量。这在采样图块边缘时提高了渲染质量，但会增加内存使用量。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   */
  paddingBefore: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取图块之后的填充体素数量。这在采样图块边缘时提高了渲染质量，但会增加内存使用量。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   */
  paddingAfter: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据名称。
   *
   * @memberof VoxelProvider.prototype
   * @type {string[]}
   * @readonly
   */
  names: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据类型。
   *
   * @memberof VoxelProvider.prototype
   * @type {MetadataType[]}
   * @readonly
   */
  types: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据分量类型。
   *
   * @memberof VoxelProvider.prototype
   * @type {MetadataComponentType[]}
   * @readonly
   */
  componentTypes: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据最小值。
   *
   * @memberof VoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */
  minimumValues: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据最大值。
   *
   * @memberof VoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */
  maximumValues: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 此提供程序存在的最大图块数量。
   * 此值用作体素渲染器分配适当 GPU 内存的提示。
   * 如果此值未知，则可以为 undefined。
   *
   * @memberof VoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumTileCount: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 图集中包含可用图块的细节级别数量。
   *
   * @memberof VoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  availableLevels: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * Gets the number of keyframes in the dataset.
   *
   * @memberof VoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   * @private
   */
  keyframeCount: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * Gets the {@link TimeIntervalCollection} for the dataset,
   * or undefined if it doesn't have timestamps.
   *
   * @memberof VoxelProvider.prototype
   * @type {TimeIntervalCollection|undefined}
   * @readonly
   * @private
   */
  timeIntervalCollection: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 请求给定图块的数据。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.tileLevel=0] 图块的级别。
 * @param {number} [options.tileX=0] 图块的 X 坐标。
 * @param {number} [options.tileY=0] 图块的 Y 坐标。
 * @param {number} [options.tileZ=0] 图块的 Z 坐标。
 * @privateparam {number} [options.keyframe=0] 请求的关键帧。
 * @returns {Promise<VoxelContent>|undefined} 解析为包含图块数据的 VoxelContent 的 Promise，如果无法在此帧调度请求则返回 undefined。
 */
VoxelProvider.prototype.requestData = function (options) {
  DeveloperError.throwInstantiationError();
};

export default VoxelProvider;
