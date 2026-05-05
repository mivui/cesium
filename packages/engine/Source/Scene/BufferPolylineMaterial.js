// @ts-check

import Frozen from "../Core/Frozen.js";
import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js";

/** @import Color from "../Core/Color.js"; */
/** @import BufferPolyline from "./BufferPolyline.js"; */

/**
 * @typedef {object} BufferPolylineMaterialOptions
 * @property {Color} [color=Color.WHITE] 填充颜色。
 * @property {Color} [outlineColor=Color.WHITE] 轮廓颜色。
 * @property {number} [outlineWidth=0.0] 轮廓宽度,0-255px。
 * @property {number} [width=1.0] 线条宽度,0-255px。
 */

/**
 * {@link BufferPolyline} 的材质描述。
 *
 * <p>BufferPolylineMaterial 对象是{@link Packable|可打包的},在调用
 * {@link BufferPolyline#setMaterial} 时存储。对材质的后续更改不会影响折线,
 * 除非再次调用 setMaterial()。</p>
 *
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 * @extends BufferPrimitiveMaterial
 */
class BufferPolylineMaterial extends BufferPrimitiveMaterial {
  /** @ignore */
  static Layout = {
    ...BufferPrimitiveMaterial.Layout,
    WIDTH_U8: BufferPrimitiveMaterial.Layout.__BYTE_LENGTH,
    __BYTE_LENGTH: BufferPrimitiveMaterial.Layout.__BYTE_LENGTH + 4,
  };

  /**
   * @type {BufferPolylineMaterial}
   * @ignore
   */
  static DEFAULT_MATERIAL = Object.freeze(new BufferPolylineMaterial());

  /**
   * @param {BufferPolylineMaterialOptions} [options]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    super(options);

    /**
     * 折线宽度,0–255px。
     * @type {number}
     */
    this.width = options.width ?? 1;
  }

  /**
   * @param {BufferPolylineMaterial} material
   * @param {DataView} view
   * @param {number} byteOffset
   * @override
   */
  static pack(material, view, byteOffset) {
    super.pack(material, view, byteOffset);
    view.setUint8(this.Layout.WIDTH_U8 + byteOffset, material.width);
  }

  /**
   * @param {DataView} view
   * @param {number} byteOffset
   * @param {BufferPolylineMaterial} result
   * @returns {BufferPolylineMaterial}
   * @override
   */
  static unpack(view, byteOffset, result) {
    super.unpack(view, byteOffset, result);
    result.width = view.getUint8(this.Layout.WIDTH_U8 + byteOffset);
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该材质的可 JSON 序列化的对象。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @returns {Object} 可 JSON 序列化的对象。
   */
  toJSON() {
    return { ...super.toJSON(), width: this.width };
  }
}

export default BufferPolylineMaterial;
