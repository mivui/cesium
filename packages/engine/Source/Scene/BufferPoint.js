// @ts-check

import BufferPrimitive from "./BufferPrimitive.js";
import Cartesian3 from "../Core/Cartesian3.js";
import assert from "../Core/assert.js";
import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";

/** @import BufferPointCollection from "./BufferPointCollection.js"; */

const { ERR_CAPACITY } = BufferPrimitiveCollection.Error;

const scratchCartesian = new Cartesian3();

/**
 * 绑定到 {@link BufferPointCollection} 底层缓冲数据的视图。
 *
 * <p>BufferPoint 实例是{@link https://en.wikipedia.org/wiki/Flyweight_pattern|享元}:
 * 单个 BufferPoint 实例可以临时绑定到 BufferPointCollection 中的任意概念
 * "点",允许以最小的内存占用迭代和更新非常大的集合。</p>
 *
 * 由一个 (1) 位置表示。
 *
 * @see BufferPointCollection
 * @see BufferPointMaterial
 * @see BufferPrimitive
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 * @extends BufferPrimitive
 */
class BufferPoint extends BufferPrimitive {
  /**
   * @type {BufferPointCollection}
   * @ignore
   */
  _collection = null;

  /** @ignore */
  static Layout = {
    ...BufferPrimitive.Layout,

    /**
     * Offset in position array to current point vertex, number of VEC3 elements.
     * @type {number}
     * @ignore
     */
    POSITION_OFFSET_U32: BufferPrimitive.Layout.__BYTE_LENGTH,

    /**
     * @type {number}
     * @ignore
     */
    __BYTE_LENGTH: BufferPrimitive.Layout.__BYTE_LENGTH + 4,
  };

  /////////////////////////////////////////////////////////////////////////////
  // LIFECYCLE

  /**
   * 将源点的数据复制到结果。
   *
   * @param {BufferPoint} point
   * @param {BufferPoint} result
   * @return {BufferPoint}
   * @override
   */
  static clone(point, result) {
    super.clone(point, result);
    result.setPosition(point.getPosition(scratchCartesian));
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // GEOMETRY

  /**
   * Offset in collection position array to position of this point, number
   * of VEC3 elements.
   *
   * @type {number}
   * @readonly
   * @ignore
   */
  get vertexOffset() {
    return this._getUint32(BufferPoint.Layout.POSITION_OFFSET_U32);
  }

  /**
   * 此图元中的位置(顶点)数量。始终为 1。
   *
   * @type {number}
   * @readonly
   */
  get vertexCount() {
    return 1;
  }

  /**
   * 获取此点的位置。
   *
   * @param {Cartesian3} [result]
   * @returns {Cartesian3}
   */
  getPosition(result) {
    const positionF64 = this._collection._positionView;
    // @ts-expect-error TODO(tsd-jsdoc): See https://github.com/CesiumGS/cesium/pull/13302.
    return Cartesian3.fromArray(positionF64, this.vertexOffset * 3, result);
  }

  /**
   * 设置此点的位置。
   *
   * @param {Cartesian3} position
   */
  setPosition(position) {
    const collection = this._collection;
    const vertexOffset = this.vertexOffset;

    //>>includeStart('debug', pragmas.debug);
    assert(vertexOffset < collection.vertexCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    collection._positionView[vertexOffset * 3] = position.x;
    collection._positionView[vertexOffset * 3 + 1] = position.y;
    collection._positionView[vertexOffset * 3 + 2] = position.z;

    this._dirty = true;
    collection._makeDirtyBoundingVolume();
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该点的可 JSON 序列化的对象。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @returns {Object} 可 JSON 序列化的对象。
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      position: Cartesian3.pack(this.getPosition(), []),
    };
  }
}

export default BufferPoint;
