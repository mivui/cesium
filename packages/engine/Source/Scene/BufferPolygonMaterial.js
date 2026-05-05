// @ts-check

import Frozen from "../Core/Frozen.js";
import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js";

/** @import Color from "../Core/Color.js"; */
/** @import BufferPolygon from "./BufferPolygon.js"; */

/**
 * @typedef {object} BufferPolygonMaterialOptions
 * @property {Color} [color=Color.WHITE] 填充颜色。
 * @property {Color} [outlineColor=Color.WHITE] 轮廓颜色。
 * @property {number} [outlineWidth=0.0] 轮廓宽度,0-255px。
 */

/**
 * {@link BufferPolygon} 的材质描述。
 *
 * <p>BufferPolygonMaterial 对象是{@link Packable|可打包的},在调用
 * {@link BufferPolygon#setMaterial} 时存储。对材质的后续更改不会影响多边形,
 * 除非再次调用 setMaterial()。</p>
 *
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 * @extends BufferPrimitiveMaterial
 */
class BufferPolygonMaterial extends BufferPrimitiveMaterial {
  /**
   * @type {BufferPolygonMaterial}
   * @ignore
   */
  static DEFAULT_MATERIAL = Object.freeze(new BufferPolygonMaterial());

  /**
   * @param {BufferPolygonMaterialOptions} [options]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    super(options);
  }
}

export default BufferPolygonMaterial;
