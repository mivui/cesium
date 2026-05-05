// @ts-check

import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";

/** @import Packable from "../Core/Packable.js"; */
/** @import BufferPrimitive from "./BufferPrimitive.js"; */

/**
 * @typedef {object} BufferPrimitiveMaterialOptions
 * @property {Color} [color=Color.WHITE] 填充颜色。
 * @property {Color} [outlineColor=Color.WHITE] 轮廓颜色。
 * @property {number} [outlineWidth=0.0] 轮廓宽度,0-255px。
 */

/**
 * {@link BufferPrimitive} 的材质描述。抽象类。
 *
 * <p>BufferPrimitiveMaterial 对象是{@link Packable|可打包的},在调用
 * {@link BufferPrimitive#setMaterial} 时存储。对材质的后续更改不会影响图元,
 * 除非再次调用 setMaterial()。</p>
 *
 * @see BufferPointMaterial
 * @see BufferPolylineMaterial
 * @see BufferPolygonMaterial
 * @see Packable
 *
 * @abstract
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPrimitiveMaterial {
  /** @ignore */
  static Layout = {
    COLOR_U32: 0,
    OUTLINE_COLOR_U32: 4,
    OUTLINE_WIDTH_U8: 8,
    __BYTE_LENGTH: 12,
  };

  /**
   * @type {BufferPrimitiveMaterial}
   * @ignore
   */
  static DEFAULT_MATERIAL;

  /**
   * @param {BufferPrimitiveMaterialOptions} [options]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    /**
     * 填充颜色。
     * @type {Color}
     */
    this.color = Color.clone(options.color ?? Color.WHITE);

    /**
     * 轮廓颜色。
     * @type {Color}
     */
    this.outlineColor = Color.clone(options.outlineColor ?? Color.WHITE);

    /**
     * 轮廓宽度,0-255px。
     * @type {number}
     */
    this.outlineWidth = options.outlineWidth ?? 0;
  }

  /** @type {number} */
  static get packedLength() {
    return this.Layout.__BYTE_LENGTH;
  }

  /**
   * 将提供的材质存储到提供的数组中。
   *
   * @param {BufferPrimitiveMaterial} material
   * @param {DataView} view
   * @param {number} byteOffset
   */
  static pack(material, view, byteOffset) {
    view.setUint32(
      this.Layout.COLOR_U32 + byteOffset,
      material.color.toRgba(),
      true,
    );
    view.setUint32(
      this.Layout.OUTLINE_COLOR_U32 + byteOffset,
      material.outlineColor.toRgba(),
      true,
    );
    view.setUint8(
      this.Layout.OUTLINE_WIDTH_U8 + byteOffset,
      material.outlineWidth,
    );
  }

  /**
   * 从打包数组中检索材质。
   *
   * @param {DataView} view 打包数组。
   * @param {number} byteOffset 要解包的元素的起始索引。
   * @param {BufferPrimitiveMaterial} result 解包结果存储到的材质。
   * @returns {BufferPrimitiveMaterial} 修改后的结果材质,包含解包的结果。
   */
  static unpack(view, byteOffset, result) {
    Color.fromRgba(
      view.getUint32(this.Layout.COLOR_U32 + byteOffset, true),
      result.color,
    );
    Color.fromRgba(
      view.getUint32(this.Layout.OUTLINE_COLOR_U32 + byteOffset, true),
      result.outlineColor,
    );
    result.outlineWidth = view.getUint8(
      this.Layout.OUTLINE_WIDTH_U8 + byteOffset,
    );
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
    return {
      color: this.color.toCssHexString(),
      outlineColor: this.outlineColor.toCssHexString(),
      outlineWidth: this.outlineWidth,
    };
  }
}

export default BufferPrimitiveMaterial;
