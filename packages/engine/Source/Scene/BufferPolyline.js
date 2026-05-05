// @ts-check

import BufferPrimitive from "./BufferPrimitive.js";
import assert from "../Core/assert.js";
import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";
import defined from "../Core/defined.js";

/** @import { TypedArray, TypedArrayConstructor } from "../Core/globalTypes.js"; */
/** @import BufferPolylineCollection from "./BufferPolylineCollection.js"; */

const { ERR_RESIZE, ERR_CAPACITY } = BufferPrimitiveCollection.Error;

/**
 * 绑定到 {@link BufferPolylineCollection} 底层缓冲数据的视图。
 *
 * <p>BufferPolyline 实例是{@link https://en.wikipedia.org/wiki/Flyweight_pattern|享元}:
 * 单个 BufferPolyline 实例可以临时绑定到 BufferPolylineCollection 中的任意概念
 * "折线",允许以最小的内存占用迭代和更新非常大的集合。</p>
 *
 * 由两个 (2) 或更多位置表示。
 *
 * @see BufferPolylineCollection
 * @see BufferPolylineMaterial
 * @see BufferPrimitive
 * @extends BufferPrimitive
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPolyline extends BufferPrimitive {
  /**
   * @type {BufferPolylineCollection}
   * @ignore
   */
  _collection = null;

  /** @ignore */
  static Layout = {
    ...BufferPrimitive.Layout,

    /**
     * Offset in position array to first vertex in polyline, number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    POSITION_OFFSET_U32: BufferPrimitive.Layout.__BYTE_LENGTH,

    /**
     * Count of positions (vertices) in this polyline, number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    POSITION_COUNT_U32: BufferPrimitive.Layout.__BYTE_LENGTH + 4,

    /**
     * @type {number}
     * @ignore
     */
    __BYTE_LENGTH: BufferPrimitive.Layout.__BYTE_LENGTH + 8,
  };

  /////////////////////////////////////////////////////////////////////////////
  // LIFECYCLE

  /**
   * 将源折线的数据复制到结果。如果结果折线不是新的
   * (集合中的最后一条折线),则源折线和结果折线
   * 必须具有相同的顶点数。
   *
   * @param {BufferPolyline} polyline
   * @param {BufferPolyline} result
   * @return {BufferPolyline}
   * @override
   */
  static clone(polyline, result) {
    super.clone(polyline, result);
    result.setPositions(polyline.getPositions());
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // GEOMETRY

  /**
   * Offset in collection position array to first vertex in polyline, number
   * of VEC3 elements.
   *
   * @type {number}
   * @readonly
   * @ignore
   */
  get vertexOffset() {
    return this._getUint32(BufferPolyline.Layout.POSITION_OFFSET_U32);
  }

  /**
   * 此折线中的位置(顶点)数量,VEC3 元素数量。
   *
   * @type {number}
   * @readonly
   */
  get vertexCount() {
    return this._getUint32(BufferPolyline.Layout.POSITION_COUNT_U32);
  }

  /**
   * 返回此折线顶点位置的数组视图。如果给定 'result'
   * 参数,顶点位置将写入该数组并返回。
   * 否则,返回集合内存上的 ArrayView — 对此数组的更改
   * 不会触发渲染更新,这需要 `.setPositions()`。
   *
   * @param {TypedArray} [result]
   * return {TypedArray}
   */
  getPositions(result) {
    const { vertexOffset, vertexCount } = this;
    const positionView = this._collection._positionView;

    if (!defined(result)) {
      const byteOffset =
        positionView.byteOffset +
        vertexOffset * 3 * positionView.BYTES_PER_ELEMENT;
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
      result[i * 3] = positionView[(vertexOffset + i) * 3];
      result[i * 3 + 1] = positionView[(vertexOffset + i) * 3 + 1];
      result[i * 3 + 2] = positionView[(vertexOffset + i) * 3 + 2];
    }
    return result;
  }

  /** @param {TypedArray} positions */
  setPositions(positions) {
    const collection = this._collection;
    const vertexOffset = this.vertexOffset;
    const srcCount = this.vertexCount;
    const dstCount = positions.length / 3;
    const collectionCount = collection._positionCount + dstCount - srcCount;

    //>>includeStart('debug', pragmas.debug);
    assert(srcCount === dstCount || this._isResizable(), ERR_RESIZE);
    assert(collectionCount <= collection.vertexCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    collection._positionCount = collectionCount;
    this._setUint32(BufferPolyline.Layout.POSITION_COUNT_U32, dstCount);

    const positionView = collection._positionView;
    for (let i = 0; i < dstCount; i++) {
      positionView[(vertexOffset + i) * 3] = positions[i * 3];
      positionView[(vertexOffset + i) * 3 + 1] = positions[i * 3 + 1];
      positionView[(vertexOffset + i) * 3 + 2] = positions[i * 3 + 2];
    }

    this._dirty = true;
    collection._makeDirtyBoundingVolume();
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该折线的可 JSON 序列化的对象。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @returns {Object} 可 JSON 序列化的对象。
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      positions: Array.from(this.getPositions()),
    };
  }
}

export default BufferPolyline;
