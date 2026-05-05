// @ts-check

import assert from "../Core/assert.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import BufferPrimitive from "./BufferPrimitive.js";
import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";

/** @import { TypedArray, TypedArrayConstructor } from "../Core/globalTypes.js"; */
/** @import BufferPolygonCollection from "./BufferPolygonCollection.js"; */

const { ERR_CAPACITY, ERR_RESIZE, ERR_OUT_OF_RANGE } =
  BufferPrimitiveCollection.Error;

/**
 * 绑定到 {@link BufferPolygonCollection} 底层缓冲数据的视图。
 *
 * <p>BufferPolygon 实例是{@link https://en.wikipedia.org/wiki/Flyweight_pattern|享元}:
 * 单个 BufferPolygon 实例可以临时绑定到 BufferPolygonCollection 中的任意概念
 * "多边形",允许以最小的内存占用迭代和更新非常大的集合。</p>
 *
 * <p>由一个 (1) 外部线性环表示,包含三个 (3) 或更多位置。
 * 可选择在多边形内定义一个或多个内部线性环("孔")。
 * 每个孔表示为位置数组中的单个索引,该索引处的顶点是内部线性环的起点,
 * 沿后续顶点继续,直到到达下一个孔的顶点索引或顶点列表的末尾。
 * 存储预计算的三角剖分,表示为每个三角形三个顶点索引。</p>
 *
 * @see BufferPolygonCollection
 * @see BufferPolygonMaterial
 * @see BufferPrimitive
 * @extends BufferPrimitive
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPolygon extends BufferPrimitive {
  /**
   * @type {BufferPolygonCollection}
   * @ignore
   */
  _collection = null;

  /** @ignore */
  static Layout = {
    ...BufferPrimitive.Layout,

    /**
     * Offset in collection position array to first vertex in polygon, number
     * of VEC3 elements.
     * @type {number}
     * @ignore
     */
    POSITION_OFFSET_U32: BufferPrimitive.Layout.__BYTE_LENGTH,

    /**
     * Count of positions (vertices) in this polygon, number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    POSITION_COUNT_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 4,

    /**
     * Offset in collection holes array to first hole in polygon, number of
     * integer elements.
     * @type {number}
     * @ignore
     */
    HOLE_OFFSET_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 8,

    /**
     * Count of holes (indices) in this polygon.
     * @type {number}
     * @ignore
     */
    HOLE_COUNT_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 12,

    /**
     * Offset in collection triangles array to first triangle in polygon,
     * number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    TRIANGLE_OFFSET_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 16,

    /**
     * Count of triangles in this polygon, number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    TRIANGLE_COUNT_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 20,

    /**
     * @type {number}
     * @ignore
     */
    __BYTE_LENGTH: BufferPrimitive.Layout.__BYTE_LENGTH + 24,
  };

  /////////////////////////////////////////////////////////////////////////////
  // LIFECYCLE

  /**
   * 将源多边形的数据复制到结果。如果结果多边形不是新的
   * (集合中的最后一个多边形),则源多边形和结果多边形
   * 必须具有相同的顶点数、孔数和三角形数。
   *
   * @param {BufferPolygon} polygon
   * @param {BufferPolygon} result
   * @return {BufferPolygon}
   * @override
   */
  static clone(polygon, result) {
    super.clone(polygon, result);
    result.setPositions(polygon.getPositions());
    result.setHoles(polygon.getHoles());
    result.setTriangles(polygon.getTriangles());
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // GEOMETRY

  /**
   * Offset in collection position array to first vertex in polygon, number
   * of VEC3 elements.
   *
   * @type {number}
   * @readonly
   * @ignore
   */
  get vertexOffset() {
    return this._getUint32(BufferPolygon.Layout.POSITION_OFFSET_U32);
  }

  /**
   * 此多边形中的位置(顶点)数量,包括外环和
   * 内部环(孔),VEC3 元素数量。
   *
   * @type {number}
   * @readonly
   */
  get vertexCount() {
    return this._getUint32(BufferPolygon.Layout.POSITION_COUNT_U32);
  }

  /**
   * 返回此多边形顶点位置的数组视图。如果给定 'result'
   * 参数,顶点位置将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setPositions()`。
   *
   * @param {TypedArray} [result]
   * return {TypedArray}
   */
  getPositions(result) {
    return this._getPositionsRange(0, this.vertexCount, result);
  }

  /** @param {TypedArray} positions */
  setPositions(positions) {
    const collection = this._collection;
    const vertexOffset = this.vertexOffset;
    const srcCount = this.vertexCount;
    const dstCount = positions.length / 3;
    const collectionCount = collection.vertexCount + dstCount - srcCount;

    //>>includeStart('debug', pragmas.debug);
    assert(srcCount === dstCount || this._isResizable(), ERR_RESIZE);
    assert(collectionCount <= collection.vertexCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    collection._positionCount = collectionCount;
    this._setUint32(BufferPolygon.Layout.POSITION_COUNT_U32, dstCount);

    const positionView = collection._positionView;
    for (let i = 0; i < dstCount; i++) {
      positionView[(vertexOffset + i) * 3] = positions[i * 3];
      positionView[(vertexOffset + i) * 3 + 1] = positions[i * 3 + 1];
      positionView[(vertexOffset + i) * 3 + 2] = positions[i * 3 + 2];
    }

    this._dirty = true;
    collection._makeDirtyBoundingVolume();
  }

  /**
   * 多边形外线性环中第一个顶点在集合位置数组中的偏移量,
   * VEC3 元素数量。
   *
   * @type {number}
   * @readonly
   */
  get outerVertexOffset() {
    return this.vertexOffset;
  }

  /**
   * 此多边形外线性环中的位置(顶点)数量,
   * VEC3 元素数量。
   *
   * @type {number}
   * @readonly
   */
  get outerVertexCount() {
    if (this.holeCount > 0) {
      return this.getHoles()[0];
    }
    return this.vertexCount;
  }

  /**
   * 返回此多边形外线性环顶点位置的数组视图。
   * 如果给定 'result' 参数,顶点位置将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setPositions()`。
   *
   * @param {TypedArray} [result]
   * @returns {TypedArray}
   */
  getOuterPositions(result) {
    return this._getPositionsRange(0, this.outerVertexCount, result);
  }

  /**
   * Offset in collection holes array to first hole in polygon, number of
   * integer elements.
   *
   * @type {number}
   * @readonly
   * @ignore
   */
  get holeOffset() {
    return this._getUint32(BufferPolygon.Layout.HOLE_OFFSET_U32);
  }

  /**
   * 此多边形中的孔(索引)数量。
   *
   * @type {number}
   * @readonly
   */
  get holeCount() {
    return this._getUint32(BufferPolygon.Layout.HOLE_COUNT_U32);
  }

  /**
   * 获取此多边形的孔索引,每个孔表示为
   * 此多边形位置数组中的单个偏移量。每个孔隐式地
   * 从该顶点偏移量沿内部线性环继续,
   * 直到到达位置数组的末尾或下一个孔偏移量。
   *
   * 如果给定 'result' 参数,孔索引将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setHoles()`。
   *
   * @param {TypedArray} [result]
   * @returns {TypedArray}
   */
  getHoles(result) {
    const { holeOffset, holeCount } = this;
    const holeIndexView = this._collection._holeIndexView;

    if (!defined(result)) {
      const byteOffset =
        holeIndexView.byteOffset + holeOffset * holeIndexView.BYTES_PER_ELEMENT;
      const TypedArray = /** @type {TypedArrayConstructor} */ (
        holeIndexView.constructor
      );
      return new TypedArray(
        /** @type {ArrayBuffer} */ (holeIndexView.buffer),
        byteOffset,
        holeCount,
      );
    }

    for (let i = 0; i < holeCount; i++) {
      result[i] = holeIndexView[holeOffset + i];
    }
    return result;
  }

  /**
   * 设置此多边形的孔索引,孔表示为此多边形
   * 位置数组中的单个偏移量。每个孔隐式地
   * 从该顶点偏移量沿内部线性环继续,
   * 直到到达位置数组的末尾或下一个孔偏移量。
   *
   * @param {TypedArray} holes
   */
  setHoles(holes) {
    const collection = this._collection;
    const holeOffset = this.holeOffset;
    const srcCount = this.holeCount;
    const dstCount = holes.length;
    const collectionCount = collection.holeCount + dstCount - srcCount;

    //>>includeStart('debug', pragmas.debug);
    assert(srcCount === dstCount || this._isResizable(), ERR_RESIZE);
    assert(collectionCount <= collection.holeCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    collection._holeCount = collectionCount;
    this._setUint32(BufferPolygon.Layout.HOLE_COUNT_U32, dstCount);

    const holeIndexView = collection._holeIndexView;
    for (let i = 0; i < dstCount; i++) {
      holeIndexView[holeOffset + i] = holes[i];
    }

    this._dirty = true;
  }

  /**
   * 返回指定孔中的 (VEC3) 顶点数。
   *
   * @param {number} holeIndex
   * @returns {number}
   */
  getHoleVertexCount(holeIndex) {
    const holes = this.getHoles();

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("holeIndex", holeIndex, 0);
    Check.typeOf.number.lessThan("holeIndex", holeIndex, holes.length);
    //>>includeEnd('debug');

    const holeVertexOffset = holes[holeIndex];
    return holeIndex === holes.length - 1
      ? this.vertexCount - holeVertexOffset
      : holes[holeIndex + 1] - holeVertexOffset;
  }

  /**
   * 返回指定孔的内部线性环顶点位置的数组视图。
   * 如果给定 'result' 参数,顶点位置将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setPositions()`。
   *
   * @param {number} holeIndex
   * @param {TypedArray} [result]
   * return {TypedArray}
   */
  getHolePositions(holeIndex, result) {
    const holes = this.getHoles();

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("holeIndex", holeIndex, 0);
    Check.typeOf.number.lessThan("holeIndex", holeIndex, holes.length);
    //>>includeEnd('debug');

    const holeVertexOffset = holes[holeIndex];
    const holeVertexCount = this.getHoleVertexCount(holeIndex);
    return this._getPositionsRange(holeVertexOffset, holeVertexCount, result);
  }

  /**
   * Internal helper for accessing vertex positions. 'vertexOffset' argument
   * is relative to the start of the polygon's vertex block, with 0 being
   * the first vertex in the polygon. If 'result' argument is given, the
   * requested range of vertices are written to the result array and returned.
   * Otherwise, returns an ArrayView on collection memory.
   *
   * @param {number} vertexOffset
   * @param {number} vertexCount
   * @param {TypedArray} [result]
   * @returns {TypedArray}
   * @private
   */
  _getPositionsRange(vertexOffset, vertexCount, result) {
    const collection = this._collection;
    const positionView = this._collection._positionView;

    const collectionVertexOffset = this.vertexOffset + vertexOffset;

    //>>includeStart('debug', pragmas.debug);
    assert(collectionVertexOffset >= 0, ERR_OUT_OF_RANGE);
    assert(collectionVertexOffset < collection.vertexCount, ERR_OUT_OF_RANGE);
    assert(vertexCount > 0, ERR_OUT_OF_RANGE);
    assert(vertexCount <= this.vertexCount, ERR_OUT_OF_RANGE);
    //>>includeEnd('debug');

    if (!defined(result)) {
      const byteOffset =
        positionView.byteOffset +
        collectionVertexOffset * 3 * positionView.BYTES_PER_ELEMENT;
      const TypedArray = /** @type {TypedArrayConstructor} */ (
        positionView.constructor
      );
      return new TypedArray(
        /** @type {ArrayBuffer} */ (positionView.buffer),
        byteOffset,
        vertexCount * 3,
      );
    }

    for (let i = 0; i < vertexCount; i++) {
      result[i * 3] = positionView[(collectionVertexOffset + i) * 3];
      result[i * 3 + 1] = positionView[(collectionVertexOffset + i) * 3 + 1];
      result[i * 3 + 2] = positionView[(collectionVertexOffset + i) * 3 + 2];
    }
    return result;
  }

  /**
   * Offset in collection triangles array to first triangle in polygon,
   * number of VEC3 elements.
   * @type {number}
   * @readonly
   * @ignore
   */
  get triangleOffset() {
    return this._getUint32(BufferPolygon.Layout.TRIANGLE_OFFSET_U32);
  }

  /**
   * 此多边形中的三角形数量,VEC3 元素数量。
   *
   * @type {number}
   * @readonly
   */
  get triangleCount() {
    return this._getUint32(BufferPolygon.Layout.TRIANGLE_COUNT_U32);
  }

  /**
   * 返回此多边形三角形索引的数组视图,表示为
   * 每个三角形三个顶点索引。
   *
   * 如果给定 'result' 参数,三角形索引将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setTriangles()`。
   *
   * @param {TypedArray} [result]
   * @returns {TypedArray}
   */
  getTriangles(result) {
    const { triangleOffset, triangleCount } = this;
    const indices = this._collection._triangleIndexView;

    if (!defined(result)) {
      const byteOffset =
        indices.byteOffset + triangleOffset * 3 * indices.BYTES_PER_ELEMENT;
      const TypedArray = /** @type {TypedArrayConstructor} */ (
        indices.constructor
      );
      return new TypedArray(
        /** @type {ArrayBuffer} */ (indices.buffer),
        byteOffset,
        triangleCount * 3,
      );
    }

    for (let i = 0; i < triangleCount; i++) {
      result[i * 3] = indices[(triangleOffset + i) * 3];
      result[i * 3 + 1] = indices[(triangleOffset + i) * 3 + 1];
      result[i * 3 + 2] = indices[(triangleOffset + i) * 3 + 2];
    }
    return result;
  }

  /**
   * 设置此多边形的三角形索引,表示为
   * 每个三角形三个顶点索引。
   *
   * @param {TypedArray} indices
   */
  setTriangles(indices) {
    const collection = this._collection;
    const triangleOffset = this.triangleOffset;
    const srcCount = this.triangleCount;
    const dstCount = indices.length / 3;
    const collectionCount = collection.triangleCount + dstCount - srcCount;

    //>>includeStart('debug', pragmas.debug);
    assert(srcCount === dstCount || this._isResizable(), ERR_RESIZE);
    assert(collectionCount <= collection.triangleCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    collection._triangleCount += dstCount - srcCount;
    this._setUint32(BufferPolygon.Layout.TRIANGLE_COUNT_U32, dstCount);

    const dstIndices = collection._triangleIndexView;
    for (let i = 0; i < dstCount; i++) {
      dstIndices[(triangleOffset + i) * 3] = indices[i * 3];
      dstIndices[(triangleOffset + i) * 3 + 1] = indices[i * 3 + 1];
      dstIndices[(triangleOffset + i) * 3 + 2] = indices[i * 3 + 2];
    }

    this._dirty = true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该多边形的可 JSON 序列化的对象。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @returns {Object} 可 JSON 序列化的对象。
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      positions: Array.from(this.getPositions()),
      holes: Array.from(this.getHoles()),
      triangles: Array.from(this.getTriangles()),
    };
  }
}

export default BufferPolygon;
