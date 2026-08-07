// @ts-check

import DeveloperError from "../Core/DeveloperError.js";

/**
 * {@link Cesium3DTileset} 中瓦片的内容。
 * <p>
 * 该接口的派生类提供对瓦片中单个要素的访问。
 * 通过 {@link Cesium3DTile#content} 访问派生对象。
 * </p>
 * <p>
 * 此类型描述一个接口,不打算直接实例化。
 * </p>
 *
 * @interface
 */
class Cesium3DTileContent {
  constructor() {
    /**
     * Gets or sets if any feature's property changed.  Used to
     * optimized applying a style when a feature's property changed.
     * <p>
     * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
     * not part of the public Cesium API.
     * </p>
     *
     * @type {boolean}
     *
     * @protected
     * @ignore
     */
    this.featurePropertiesDirty = false;
  }

  /**
   * 获取图元中的特征数。
   *
   *
   * @type {number}
   * @readonly
   */
  featuresLength;

  /**
   * 获取图元中的点数。
   * <p>
   * 仅适用于具有点云内容的图元。这不同于 {@link Cesium3DTileContent#featuresLength},后者
   * 等于由 <code>BATCH_ID</code> 特征表语义区分的点组的数量。
   * </p>
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/PointCloud#batched-points}
   *
   *
   * @type {number}
   * @readonly
   * @constant
   */
  pointsLength;

  /**
   * 获取图元中的三角形数。
   *
   *
   * @type {number}
   * @readonly
   * @constant
   */
  trianglesLength;

  /**
   * 获取图元的几何内存(字节)。
   *
   *
   * @type {number}
   * @readonly
   * @constant
   */
  geometryByteLength;

  /**
   * 获取图元的纹理内存(字节)。
   *
   *
   * @type {number}
   * @readonly
   */
  texturesByteLength;

  /**
   * 获取批处理表纹理所使用的内存量，以及任何未在 geometryByteLength 或 texturesByteLength 中计入的二进制元数据属性
   *
   *
   * @type {number}
   * @readonly
   * @constant
   */
  batchTableByteLength;

  /**
   * 获取包含其他内容的内容的 {@link Cesium3DTileContent} 对象数组,例如复合图元。内部内容可能依次包含内部内容,例如包含复合图元的复合图元。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Composite|Composite specification}
   *
   *
   * @type {Array<*>}
   * @readonly
   * @constant
   */
  innerContents;

  /**
   * 当图元的内容准备好渲染时返回 true;否则返回 false
   *
   *
   * @type {boolean}
   * @readonly
   * @constant
   */
  ready;

  /**
   * 获取此图元的图元集。
   *
   *
   * @type {Cesium3DTileset}
   * @readonly
   * @constant
   */
  tileset;

  /**
   * 获取包含此内容的图元。
   *
   *
   * @type {Cesium3DTile}
   * @readonly
   * @constant
   */
  tile;

  /**
   * 获取图块内容的 URL。
   *
   * @type {string}
   * @readonly
   * @constant
   */
  url;

  /**
   * Gets the batch table for this content.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @type {Cesium3DTileBatchTable}
   * @readonly
   * @constant
   *
   * @private
   */
  batchTable;

  /**
   * Gets the metadata for this content, whether it is available explicitly or via
   * implicit tiling. If there is no metadata, this property should be undefined.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @type {ImplicitMetadataView|undefined}
   *
   * @private
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  metadata;

  /**
   * Gets the group for this content if the content has metadata (3D Tiles 1.1) or
   * if it uses the <code>3DTILES_metadata</code> extension. If neither are present,
   * this property should be undefined.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @type {Cesium3DContentGroup|undefined}
   *
   * @private
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  group;

  /**
   * 返回该要素是否具有此属性。
   *
   * @param {number} batchId 要素的 batchId。
   * @param {string} name 属性的区分大小写名称。
   * @returns {boolean} 如果要素具有此属性，则为 <code>true</code>；否则为 <code>false</code>。
   */
  hasProperty(batchId, name) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 返回具有给定<code>batchId</code>的要素的{@link Cesium3DTileFeature}对象。该对象用于获取和修改要素的属性。
   * <p>
   * 瓦片中的要素按<code>batchId</code>排序，<code>batchId</code>是用于从批处理表中检索其元数据的索引。
   * </p>
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/BatchTable}。
   *
   * @param {number} batchId 要素的batchId。
   * @returns {Cesium3DTileFeature} 对应的{@link Cesium3DTileFeature}对象。
   *
   * @exception {DeveloperError} batchId必须在零到{@link Cesium3DTileContent#featuresLength} - 1之间。
   */
  getFeature(batchId) {
    DeveloperError.throwInstantiationError();
  }

  /**
       * Called when {@link Cesium3DTileset#debugColorizeTiles} changes.
       * <p>
       * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
       * not part of the public Cesium API.
       * </p>
       *
       * @param {boolean} enabled Whether to enable or disable debug settings.
       * @param {Color} color Debug color.
       * @returns {Cesium3DTileFeature} The corresponding {@link Cesium3DTileFeature} object.

       * @private
       */
  applyDebugSettings(enabled, color) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Apply a style to the content
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @param {Cesium3DTileStyle} style The style.
   * @returns {void}
   *
   * @private
   */
  applyStyle(style) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Called by the tile during tileset traversal to get the draw commands needed to render this content.
   * When the tile's content is in the PROCESSING state, this creates WebGL resources to ultimately
   * move to the READY state.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @param {Cesium3DTileset} tileset The tileset containing this tile.
   * @param {FrameState} frameState The frame state.
   * @returns {void}
   *
   * @private
   */
  update(tileset, frameState) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Find an intersection between a ray and the tile content surface that was rendered. The ray must be given in world coordinates.
   *
   * @param {Ray} ray The ray to test for intersection.
   * @param {FrameState} frameState The frame state.
   * @param {Cartesian3|undefined} [result] The intersection or <code>undefined</code> if none was found.
   * @returns {Cartesian3|undefined} The intersection or <code>undefined</code> if none was found.
   *
   * @private
   */
  pick(ray, frameState, result) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Returns true if this object was destroyed; otherwise, false.
   * <br /><br />
   * If this object was destroyed, it should not be used; calling any function other than
   * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @returns {boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
   *
   * @see Cesium3DTileContent#destroy
   *
   * @private
   */
  isDestroyed() {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
   * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
   * <br /><br />
   * Once an object is destroyed, it should not be used; calling any function other than
   * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
   * assign the return value (<code>undefined</code>) to the object as done in the example.
   * <p>
   * This is used to implement the <code>Cesium3DTileContent</code> interface, but is
   * not part of the public Cesium API.
   * </p>
   *
   * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
   *
   * @example
   * content = content && content.destroy();
   *
   * @see Cesium3DTileContent#isDestroyed
   *
   * @returns {void}
   *
   * @private
   */
  destroy() {
    DeveloperError.throwInstantiationError();
  }
}

export default Cesium3DTileContent;
