import DeveloperError from "../Core/DeveloperError.js";

/**
 * {@link Cesium3DTileset} 中瓦片的内容。
 * <p>
 * 此接口的派生类提供对磁贴中各个功能的访问。
 * 通过 {@link Cesium3DTile#content} 访问派生对象。
 * </p>
 * <p>
 * 此类型描述接口，不打算直接实例化。
 * </p>
 *
 * @alias Cesium3DTileContent
 * @constructor
 */
function Cesium3DTileContent() {
  /**
   * 获取或设置任何功能的属性是否更改。 用于
   * 优化了在特征属性更改时应用样式的功能。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
   * 不是公共 Cesium API 的一部分。
   * </p>
   *
   * @type {boolean}
   *
   * @private
   */
  this.featurePropertiesDirty = false;
}

Object.defineProperties(Cesium3DTileContent.prototype, {
  /**
   * 获取瓦片中的要素数。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  featuresLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片中的点数。
   * <p>
   * 仅适用于包含点云内容的瓦片。这与 {@link Cesium3DTileContent#featuresLength} 不同，后者
   * 等于 <code>BATCH_ID</code> 特征表语义区分的点组数。
   * </p>
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/PointCloud#batched-points}
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  pointsLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取平铺中的三角形数。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  trianglesLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取图块的几何内存（以字节为单位）。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  geometryByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取平铺的纹理内存（以字节为单位）。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  texturesByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取批处理表纹理和任何二进制文件使用的内存量
   * geometryByteLength 中未考虑元数据属性，或者
   * textures字节长度
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  batchTableByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取包含其他内容（如复合磁贴）的内容的 {@link Cesium3DTileContent} 对象的数组。内部内容可能又具有内部内容，例如包含复合切片的复合切片。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Composite|Composite specification}
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Array}
   * @readonly
   */
  innerContents: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 当磁贴的内容准备好呈现时，返回 true;否则为 false
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {boolean}
   * @readonly
   */
  ready: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此图块的图块集。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Cesium3DTileset}
   * @readonly
   */
  tileset: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取包含此内容的磁贴。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Cesium3DTile}
   * @readonly
   */
  tile: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取磁贴内容的 URL。
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {string}
   * @readonly
   */
  url: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此内容的 batch 表。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
   * 不是公共 Cesium API 的一部分。
   * </p>
   *
   * @type {Cesium3DTileBatchTable}
   * @readonly
   *
   * @private
   */
  batchTable: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此内容的元数据，无论它是显式可用的还是通过
   * 隐式平铺。如果没有元数据，则应为“undefined”此属性。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
   * 不是公共 Cesium API 的一部分。
   * </p>
   *
   * @type {ImplicitMetadataView|undefined}
   *
   * @private
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  metadata: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
    set: function (value) {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 如果内容具有元数据 （3D Tiles 1.1），则获取此内容的组，或者
   * 如果它使用 <code>3DTILES_metadata</code> 扩展。如果两者都不存在，
   * 此属性应为 undefined。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
   * 不是公共 Cesium API 的一部分。
   * </p>
   *
   * @type {Cesium3DTileContentGroup|undefined}
   *
   * @private
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  group: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
    set: function (value) {
      DeveloperError.throwInstantiationError();
    },
  },
});

/**
 * 返回功能是否具有此属性。
 *
 * @param {number} batchId 特征的 batchId。
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} <code>true</code>，如果特征具有此属性;否则为 <code>false</code>。
 */
Cesium3DTileContent.prototype.hasProperty = function (batchId, name) {
  DeveloperError.throwInstantiationError();
};

/**
 * 返回 {@link Cesium3DTileFeature} 对象的
 * 给定 <code>batchId</code>。 此对象用于获取和修改
 * 功能的属性。
 * <p>
 * 瓦片中的要素按 <code>batchId 排序，batchId</code> 是用于从批处理表中检索其元数据的索引。
 * </p>
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/BatchTable}.
 *
 * @param {number} batchId 特征的 batchId。
 * @returns {Cesium3DTileFeature} 对应的 {@link Cesium3DTileFeature} 对象。
 *
 * @exception {DeveloperError} batchId must be between zero and {@link Cesium3DTileContent#featuresLength} - 1.
 */
Cesium3DTileContent.prototype.getFeature = function (batchId) {
  DeveloperError.throwInstantiationError();
};

/**
     * 在 {@link Cesium3DTileset#debugColorizeTiles} 更改时调用。
     * <p>
     * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
     * 不是公共 Cesium API 的一部分。
     * </p>
     *
     * @param {boolean} enabled 是启用还是禁用调试设置。
     * @returns {Cesium3DTileFeature} 相应的 {@link Cesium3DTileFeature} 对象。

     * @private
     */
Cesium3DTileContent.prototype.applyDebugSettings = function (enabled, color) {
  DeveloperError.throwInstantiationError();
};

/**
 * 将样式应用于内容
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
 * 不是公共 Cesium API 的一部分。
 * </p>
 *
 * @param {Cesium3DTileStyle} style 风格。
 *
 * @private
 */
Cesium3DTileContent.prototype.applyStyle = function (style) {
  DeveloperError.throwInstantiationError();
};

/**
 * 在图块集遍历期间由瓦片调用，以获取渲染此内容所需的绘制命令。
 * 当瓦片的内容处于 PROCESSING 状态时，这将创建 WebGL 资源，最终
 * 移至 READY 状态。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
 * 不是公共 Cesium API 的一部分。
 * </p>
 *
 * @param {Cesium3DTileset} tileset 包含此图块的图块集。
 * @param {FrameState} frameState 帧状态。
 *
 * @private
 */
Cesium3DTileContent.prototype.update = function (tileset, frameState) {
  DeveloperError.throwInstantiationError();
};

/**
 * 查找光线与渲染的平铺内容表面之间的交集。射线必须以世界坐标给出。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {FrameState} frameState 帧状态。
 * @param {Cartesian3|undefined} [result] 交集或 <code>undefined</code>，如果未找到。
 * @returns {Cartesian3|undefined} 交集或 <code>undefined</code>（如果未找到）。
 *
 * @private
 */
Cesium3DTileContent.prototype.pick = function (ray, frameState, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 <code>* isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
 * 不是公共 Cesium API 的一部分。
 * </p>
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see Cesium3DTileContent#destroy
 *
 * @private
 */
Cesium3DTileContent.prototype.isDestroyed = function () {
  DeveloperError.throwInstantiationError();
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 <code>* isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但
 * 不是公共 Cesium API 的一部分。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * content = content && content.destroy();
 *
 * @see Cesium3DTileContent#isDestroyed
 *
 * @private
 */
Cesium3DTileContent.prototype.destroy = function () {
  DeveloperError.throwInstantiationError();
};
export default Cesium3DTileContent;
