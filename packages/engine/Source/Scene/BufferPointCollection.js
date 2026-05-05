// @ts-check

import BufferPrimitiveCollection from "./BufferPrimitiveCollection.js";
import BufferPoint from "./BufferPoint.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Frozen from "../Core/Frozen.js";
import renderPoints from "./renderBufferPointCollection.js";
import BufferPointMaterial from "./BufferPointMaterial.js";

/** @import ComponentDatatype from "../Core/ComponentDatatype.js"; */
/** @import Matrix4 from "../Core/Matrix4.js"; */
/** @import FrameState from "./FrameState.js"; */

/**
 * @typedef {object} BufferPointOptions
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
 * @property {boolean} [show=true]
 * @property {BufferPointMaterial} [material=BufferPointMaterial.DEFAULT_MATERIAL]
 * @property {number} [featureId]
 * @property {object} [pickObject]
 * @property {Cartesian3} [position=Cartesian3.ZERO]
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */

/**
 * 存储在 ArrayBuffer 中的点集合,用于性能和内存优化。
 *
 * <p>默认缓冲内存分配是任意的,且集合无法调整大小,
 * 因此在可用时应在集合构造函数中提供特定的每缓冲容量。</p>
 *
 * @example
 * const collection = new BufferPointCollection({primitiveCountMax: 1024});
 *
 * const point = new BufferPoint();
 * const material = new BufferPointMaterial({color: Color.WHITE});
 *
 * // 创建新点,临时绑定到 'point' 局部变量。
 * collection.add({
 *   position: new Cartesian3(0.0, 0.0, 0.0),
 *   material
 * }, point);
 *
 * // 遍历集合中的所有点,将 'point' 局部变量临时绑定到每个点,
 * // 并更新点材质。
 * for (let i = 0; i < collection.primitiveCount; i++) {
 *   collection.get(i, point);
 *   point.setMaterial(material);
 * }
 *
 * @see BufferPoint
 * @see BufferPrimitiveCollection
 * @extends BufferPrimitiveCollection<BufferPoint>
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPointCollection extends BufferPrimitiveCollection {
  /**
   * @param {object} options
   * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
   * @param {number} [options.primitiveCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {boolean} [options.show=true]
   * @param {ComponentDatatype} [options.positionDatatype=ComponentDatatype.DOUBLE]
   * @param {boolean} [options.allowPicking=false] 当 <code>true</code> 时,图元可使用 {@link Scene#pick} 进行拾取。当 <code>false</code> 时,内存和初始化成本更低。
   * @param {boolean} [options.debugShowBoundingVolume=false]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    super({ ...options, vertexCountMax: options.primitiveCountMax });
  }

  _getCollectionClass() {
    return BufferPointCollection;
  }

  _getPrimitiveClass() {
    return BufferPoint;
  }

  _getMaterialClass() {
    return BufferPointMaterial;
  }

  /////////////////////////////////////////////////////////////////////////////
  // COLLECTION LIFECYCLE

  /**
   * @param {BufferPointCollection} collection
   * @returns {BufferPointCollection}
   * @override
   * @ignore
   */
  static _cloneEmpty(collection) {
    return new BufferPointCollection({
      primitiveCountMax: collection.primitiveCountMax,
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // PRIMITIVE LIFECYCLE

  /**
   * 向集合添加新点,并指定选项。
   * {@link BufferPoint} 实例链接到新点,使用 'result' 参数(如果提供),否则使用新实例。
   * 对于重复调用,建议重用单个 BufferPoint 实例,而不是在每次调用时分配新实例。
   *
   * @param {BufferPointOptions} options
   * @param {BufferPoint} result
   * @returns {BufferPoint}
   * @override
   */
  add(options, result = new BufferPoint()) {
    super.add(options, result);

    result._setUint32(
      BufferPoint.Layout.POSITION_OFFSET_U32,
      this._positionCount++,
    );
    result.setPosition(options.position ?? Cartesian3.ZERO);

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
      this._renderContext = renderPoints(this, frameState, this._renderContext);
    }
  }
}

export default BufferPointCollection;
