// @ts-check

import defined from "../Core/defined.js";
import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";
import BufferPolyline from "./BufferPolyline.js";
import renderPolylines from "./renderBufferPolylineCollection.js";
import BufferPolylineMaterial from "./BufferPolylineMaterial.js";

/** @import { TypedArray } from "../Core/globalTypes.js"; */
/** @import Matrix4 from "../Core/Matrix4.js"; */
/** @import FrameState from "./FrameState.js" */

/**
 * @typedef {object} BufferPolylineOptions
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
 * @property {boolean} [show=true]
 * @property {BufferPolylineMaterial} [material=BufferPolylineMaterial.DEFAULT_MATERIAL]
 * @property {number} [featureId]
 * @property {object} [pickObject]
 * @property {TypedArray} [positions]
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */

/**
 * 存储在 ArrayBuffer 中的折线集合,用于性能和内存优化。
 *
 * <p>默认缓冲内存分配是任意的,且集合无法调整大小,
 * 因此在可用时应在集合构造函数中提供特定的每缓冲容量。</p>
 *
 * @example
 * const collection = new BufferPolylineCollection({
 *   primitiveCountMax: 1024,
 *   vertexCountMax: 4096,
 * });
 *
 * const polyline = new BufferPolyline();
 * const material = new BufferPolylineMaterial({color: Color.WHITE});
 *
 * // 创建新折线,临时绑定到 'polyline' 局部变量。
 * collection.add({
 *   positions: new Float64Array([ ... ]),
 *   material,
 * }, polyline);
 *
 * // 遍历集合中的所有折线,将 'polyline' 局部变量临时绑定到每条折线,
 * // 并更新折线材质。
 * for (let i = 0; i < collection.primitiveCount; i++) {
 *   collection.get(i, polyline);
 *   polyline.setMaterial(material);
 * }
 *
 * @see BufferPolyline
 * @see BufferPolylineMaterial
 * @see BufferPrimitiveCollection
 * @extends BufferPrimitiveCollection<BufferPolyline>
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPolylineCollection extends BufferPrimitiveCollection {
  _getCollectionClass() {
    return BufferPolylineCollection;
  }

  _getPrimitiveClass() {
    return BufferPolyline;
  }

  _getMaterialClass() {
    return BufferPolylineMaterial;
  }

  /////////////////////////////////////////////////////////////////////////////
  // COLLECTION LIFECYCLE

  /**
   * @param {BufferPolylineCollection} collection
   * @returns {BufferPolylineCollection}
   * @override
   * @ignore
   */
  static _cloneEmpty(collection) {
    return new BufferPolylineCollection({
      primitiveCountMax: collection.primitiveCountMax,
      vertexCountMax: collection.vertexCountMax,
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // PRIMITIVE LIFECYCLE

  /**
   * 向集合添加新折线,并指定选项。
   * {@link BufferPolyline} 实例链接到新折线,使用 'result' 参数(如果提供),
   * 否则使用新实例。对于重复调用,建议重用单个 BufferPolyline 实例,
   * 而不是在每次调用时分配新实例。
   *
   * @param {BufferPolylineOptions} options
   * @param {BufferPolyline} result
   * @returns {BufferPolyline}
   * @override
   */
  add(options, result = new BufferPolyline()) {
    super.add(options, result);

    const vertexOffset = this._positionCount;
    result._setUint32(BufferPolyline.Layout.POSITION_OFFSET_U32, vertexOffset);
    result._setUint32(BufferPolyline.Layout.POSITION_COUNT_U32, 0);

    if (defined(options.positions)) {
      result.setPositions(options.positions);
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
      this._renderContext = renderPolylines(
        this,
        frameState,
        this._renderContext,
      );
    }
  }
}

export default BufferPolylineCollection;
