// @ts-check

/**
 * 表示相对于地形的位置。
 *
 * @enum {number}
 */
const HeightReference = {
  /**
   * 位置是绝对的。
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 位置贴附到地形和 3D Tiles。当贴附到 photorealistic 3D Tiles 等 3D 瓦片集时，
   * 确保瓦片集的 {@link Cesium3DTileset#enableCollision} 设置为 <code>true</code>。
   * 否则，实体可能无法正确贴附到瓦片集表面。
   * @type {number}
   * @constant
   */
  CLAMP_TO_GROUND: 1,

  /**
   * 位置高度是相对于地形和 3D Tiles 的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_GROUND: 2,

  /**
   * 位置贴附到地形。
   * @type {number}
   * @constant
   */
  CLAMP_TO_TERRAIN: 3,

  /**
   * 位置高度是相对于地形的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_TERRAIN: 4,

  /**
   * 位置贴附到 3D Tiles。
   * @type {number}
   * @constant
   */
  CLAMP_TO_3D_TILE: 5,

  /**
   * 位置高度是相对于 3D Tiles 的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_3D_TILE: 6,
};

Object.freeze(HeightReference);

export default HeightReference;

/**
 * 如果高度应贴附到表面则返回 true
 * @param {HeightReference} heightReference
 * @returns 如果高度应贴附到表面则返回 true
 * @private
 */
export function isHeightReferenceClamp(heightReference) {
  return (
    heightReference === HeightReference.CLAMP_TO_GROUND ||
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.CLAMP_TO_TERRAIN
  );
}

/**
 * 如果高度应相对于表面偏移则返回 true
 * @param {HeightReference} heightReference
 * @returns 如果高度应相对于表面偏移则返回 true
 * @private
 */
export function isHeightReferenceRelative(heightReference) {
  return (
    heightReference === HeightReference.RELATIVE_TO_GROUND ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN
  );
}
