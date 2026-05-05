// @ts-check

import Frozen from "../Core/Frozen.js";
import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js";

/** @import Color from "../Core/Color.js"; */
/** @import BufferPoint from "./BufferPoint.js"; */

/**
 * @typedef {object} BufferPointMaterialOptions
 * @property {Color} [color=Color.WHITE] 填充颜色。
 * @property {Color} [outlineColor=Color.WHITE] 轮廓颜色。
 * @property {number} [outlineWidth=0.0] 轮廓宽度,0-255px。
 * @property {number} [size=1.0] 点大小,0-255px。
 */

/**
 * {@link BufferPoint} 的材质描述。
 *
 * <p>BufferPointMaterial 对象是{@link Packable|可打包的},在调用
 * {@link BufferPoint#setMaterial} 时存储。对材质的后续更改不会影响点,
 * 除非再次调用 setMaterial()。</p>
 *
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 * @extends BufferPrimitiveMaterial
 */
class BufferPointMaterial extends BufferPrimitiveMaterial {
  /** @ignore */
  static Layout = {
    ...BufferPrimitiveMaterial.Layout,
    SIZE_U8: BufferPrimitiveMaterial.Layout.__BYTE_LENGTH,
    __BYTE_LENGTH: BufferPrimitiveMaterial.Layout.__BYTE_LENGTH + 4,
  };

  /**
   * @type {BufferPointMaterial}
   * @ignore
   */
  static DEFAULT_MATERIAL = Object.freeze(new BufferPointMaterial());

  /**
   * @param {BufferPointMaterialOptions} [options]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    super(options);

    /**
     * 点大小,0-255px。
     * @type {number}
     */
    this.size = options.size ?? 1;
  }

  /**
   * @override
   * @param {BufferPointMaterial} material
   * @param {DataView} view
   * @param {number} byteOffset
   * @override
   */
  static pack(material, view, byteOffset) {
    super.pack(material, view, byteOffset);
    view.setUint8(this.Layout.SIZE_U8 + byteOffset, material.size);
  }

  /**
   * @override
   * @param {DataView} view
   * @param {number} byteOffset
   * @param {BufferPointMaterial} result
   * @returns {BufferPointMaterial}
   * @override
   */
  static unpack(view, byteOffset, result) {
    super.unpack(view, byteOffset, result);
    result.size = view.getUint8(this.Layout.SIZE_U8 + byteOffset);
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
    return { ...super.toJSON(), size: this.size };
  }
}

export default BufferPointMaterial;
