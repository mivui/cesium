// @ts-check

import defined from "../Core/defined.js";
import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";
import BufferPolygon from "./BufferPolygon.js";
import Frozen from "../Core/Frozen.js";
import assert from "../Core/assert.js";
import IndexDatatype from "../Core/IndexDatatype.js";
import renderPolygons from "./renderBufferPolygonCollection.js";
import BufferPolygonMaterial from "./BufferPolygonMaterial.js";

/** @import BlendOption from "./BlendOption.js"; */
/** @import BoundingSphere from "../Core/BoundingSphere.js"; */
/** @import { TypedArray } from "../Core/globalTypes.js"; */
/** @import Matrix4 from "../Core/Matrix4.js"; */
/** @import FrameState from "./FrameState.js" */
/** @import ComponentDatatype from "../Core/ComponentDatatype.js"; */

const { ERR_CAPACITY } = BufferPrimitiveCollection.Error;

/**
 * @typedef {object} BufferPolygonOptions
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
 * @property {boolean} [show=true]
 * @property {BufferPolygonMaterial} [material=BufferPolygonMaterial.DEFAULT_MATERIAL]
 * @property {number} [featureId]
 * @property {object} [pickObject]
 * @property {TypedArray} [positions]
 * @property {TypedArray} [holes]
 * @property {TypedArray} [triangles]
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */

/**
 * 存储在 ArrayBuffer 中的多边形集合,用于性能和内存优化。
 *
 * <p>默认缓冲内存分配是任意的,且集合无法调整大小,
 * 因此在可用时应在集合构造函数中提供特定的每缓冲容量。</p>
 *
 * @example
 * import earcut from "earcut";
 *
 * const collection = new BufferPolygonCollection({
 *   primitiveCountMax: 1024,
 *   vertexCountMax: 4096,
 *   holeCountMax: 1024,
 *   triangleCountMax: 2048,
 * });
 *
 * const polygon = new BufferPolygon();
 * const positions = [ ... ];
 * const holes = [ ... ];
 * const material = new BufferPolygonMaterial({color: Color.WHITE});
 *
 * // 创建新多边形,临时绑定到 'polygon' 局部变量。
 * collection.add({
 *   positions: new Float64Array(positions),
 *   holes: new Uint32Array(holes),
 *   triangles: new Uint32Array(earcut(positions, holes, 3)),
 *   material
 * }, polygon);
 *
 * // 遍历集合中的所有多边形,将 'polygon' 局部变量临时绑定到每个多边形,
 * // 并更新多边形材质。
 * for (let i = 0; i < collection.primitiveCount; i++) {
 *   collection.get(i, polygon);
 *   polygon.setMaterial(material);
 * }
 *
 * @see BufferPolygon
 * @see BufferPolygonMaterial
 * @see BufferPrimitiveCollection
 * @extends BufferPrimitiveCollection<BufferPolygon>
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPolygonCollection extends BufferPrimitiveCollection {
  /**
   * @param {object} options
   * @param {number} [options.primitiveCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {number} [options.vertexCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {number} [options.holeCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {number} [options.triangleCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {ComponentDatatype} [options.positionDatatype=ComponentDatatype.DOUBLE]
   * @param {boolean} [options.positionNormalized=false]
   * @param {boolean} [options.show=true]
   * @param {boolean} [options.allowPicking=true] 当 <code>true</code> 时，原语可以通过 {@link Scene#pick} 被选取。当 <code>false</code> 时，内存和初始化成本较低。
   * @param {BoundingSphere} [options.boundingVolume] 在世界空间中，该集合的边界体积。当未指定时，边界体积会自动计算，并在原始位置变化时更新。当指定时，用户需要根据需要更新边界体积。手动预先计算边界体积，并仅在需要时更新，将提高较大动态集合的性能。
   * @param {boolean} [options.debugShowBoundingVolume=false]
   * @param {BlendOption} [options.blendOption=BlendOption.TRANSLUCENT]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    super(options);

    /**
     * @type {number}
     * @ignore
     */
    this._holeCount = 0;

    /**
     * @type {number}
     * @protected
     * @ignore
     */
    this._holeCountMax =
      options.holeCountMax ?? BufferPrimitiveCollection.DEFAULT_CAPACITY;

    /**
     * @type {TypedArray}
     * @ignore
     */
    this._holeIndexView = null;

    /**
     * @type {number}
     * @ignore
     */
    this._triangleCount = 0;

    /**
     * @type {number}
     * @protected
     * @ignore
     */
    this._triangleCountMax =
      options.triangleCountMax ?? BufferPrimitiveCollection.DEFAULT_CAPACITY;

    /**
     * @type {TypedArray}
     * @ignore
     */
    this._triangleIndexView = null;

    this._allocateHoleIndexBuffer();
    this._allocateTriangleIndexBuffer();
  }

  _getCollectionClass() {
    return BufferPolygonCollection;
  }

  _getPrimitiveClass() {
    return BufferPolygon;
  }

  _getMaterialClass() {
    return BufferPolygonMaterial;
  }

  /////////////////////////////////////////////////////////////////////////////
  // COLLECTION LIFECYCLE

  /**
   * @private
   * @ignore
   */
  _allocateHoleIndexBuffer() {
    // @ts-expect-error Requires https://github.com/CesiumGS/cesium/pull/13203.
    this._holeIndexView = IndexDatatype.createTypedArray(
      this._positionCountMax,
      this._holeCountMax,
    );
  }

  /**
   * @private
   * @ignore
   */
  _allocateTriangleIndexBuffer() {
    // @ts-expect-error Requires https://github.com/CesiumGS/cesium/pull/13203.
    this._triangleIndexView = IndexDatatype.createTypedArray(
      this._positionCountMax,
      this._triangleCountMax * 3,
    );
  }

  /**
   * 将此集合的内容复制到结果集合。
   * 结果集合不调整大小,必须包含足够的空间以容纳源集合中的所有图元。
   * 结果集合中的现有多边形将被覆盖。
   *
   * <p>在为已达到容量的集合分配更多空间,
   * 并将多边形高效转移到新集合时非常有用。</p>
   *
   * @example
   * const result = new BufferPolygonCollection({ ... }); // 分配更大的 'result' 集合
   * BufferPolygonCollection.clone(collection, result);   // 将 'collection' 中的多边形复制到 'result'
   *
   * @param {BufferPolygonCollection} collection
   * @param {BufferPolygonCollection} result
   * @returns {BufferPolygonCollection}
   */
  static clone(collection, result) {
    super.clone(collection, result);

    //>>includeStart('debug', pragmas.debug);
    assert(collection.holeCount <= result.holeCountMax, ERR_CAPACITY);
    assert(collection.triangleCount <= result.triangleCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    this._copySubArray(
      collection._holeIndexView,
      result._holeIndexView,
      collection.holeCount,
    );

    this._copySubArray(
      collection._triangleIndexView,
      result._triangleIndexView,
      collection._triangleCount * 3,
    );

    result._holeCount = collection._holeCount;
    result._triangleCount = collection._triangleCount;

    return result;
  }

  /**
   * @param {BufferPolygonCollection} collection
   * @returns {BufferPolygonCollection}
   * @override
   * @ignore
   */
  static _cloneEmpty(collection) {
    return new BufferPolygonCollection({
      primitiveCountMax: collection.primitiveCountMax,
      vertexCountMax: collection.vertexCountMax,
      holeCountMax: collection.holeCountMax,
      triangleCountMax: collection.triangleCountMax,
      positionDatatype: collection.positionDatatype,
      positionNormalized: collection.positionNormalized,
    });
  }

  /**
   * @param {BufferPolygonCollection} src
   * @param {BufferPolygonCollection} dst
   * @override
   * @ignore
   */
  static _replaceBuffers(src, dst) {
    super._replaceBuffers(src, dst);
    dst._holeIndexView = src._holeIndexView;
    dst._triangleIndexView = src._triangleIndexView;
  }

  /////////////////////////////////////////////////////////////////////////////
  // PRIMITIVE LIFECYCLE

  /**
   * 向集合添加新多边形,并指定选项。
   * {@link BufferPolygon} 实例链接到新多边形,使用 'result' 参数(如果提供),
   * 否则使用新实例。对于重复调用,建议重用单个 BufferPolygon 实例,
   * 而不是在每次调用时分配新实例。
   *
   * @param {BufferPolygonOptions} options
   * @param {BufferPolygon} result
   * @returns {BufferPolygon}
   * @override
   */
  add(options, result = new BufferPolygon()) {
    super.add(options, result);

    const vertexOffset = this._positionCount;
    result._setUint32(BufferPolygon.Layout.POSITION_OFFSET_U32, vertexOffset);
    result._setUint32(BufferPolygon.Layout.POSITION_COUNT_U32, 0);

    const holeOffset = this._holeCount;
    result._setUint32(BufferPolygon.Layout.HOLE_OFFSET_U32, holeOffset);
    result._setUint32(BufferPolygon.Layout.HOLE_COUNT_U32, 0);

    const triangleOffset = this._triangleCount;
    result._setUint32(BufferPolygon.Layout.TRIANGLE_OFFSET_U32, triangleOffset);
    result._setUint32(BufferPolygon.Layout.TRIANGLE_COUNT_U32, 0);

    if (defined(options.positions)) {
      result.setPositions(options.positions);
    }

    if (defined(options.holes)) {
      result.setHoles(options.holes);
    }

    if (defined(options.triangles)) {
      result.setTriangles(options.triangles);
    }

    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // RENDER

  /**
   * @param {FrameState} frameState
   * @ignore
   */
  update(frameState) {
    super.update(frameState);

    const passes = frameState.passes;
    if (this.show && (passes.render || passes.pick)) {
      this._renderContext = renderPolygons(
        this,
        frameState,
        this._renderContext,
      );
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // ACCESSORS

  /**
   * 此集合拥有的缓冲区的总字节长度。包括由
   * {@link primitiveCountMax} 分配的任何未使用空间,即使尚未在该空间中添加多边形。
   *
   * @type {number}
   * @readonly
   * @override
   */
  get byteLength() {
    return (
      super.byteLength +
      this._holeIndexView.byteLength +
      this._triangleIndexView.byteLength
    );
  }

  /**
   * 集合中的孔数。必须 <= {@link holeCountMax}。
   *
   * @type {number}
   * @readonly
   */
  get holeCount() {
    return this._holeCount;
  }

  /**
   * 集合中的最大孔数。必须 >= {@link holeCount}。
   *
   * @type {number}
   * @readonly
   * @default {@link BufferPrimitiveCollection.DEFAULT_CAPACITY}
   */
  get holeCountMax() {
    return this._holeCountMax;
  }

  /**
   * 集合中的三角形数。必须 <= {@link triangleCountMax}。
   *
   * @type {number}
   * @readonly
   */
  get triangleCount() {
    return this._triangleCount;
  }

  /**
   * 集合中的最大三角形数。必须 >= {@link triangleCount}。
   *
   * @type {number}
   * @readonly
   * @default {@link BufferPrimitiveCollection.DEFAULT_CAPACITY}
   */
  get triangleCountMax() {
    return this._triangleCountMax;
  }
}
export default BufferPolygonCollection;
