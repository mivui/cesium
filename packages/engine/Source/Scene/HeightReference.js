/**
 * 表示相对于地形的位置。
 *
 * @enum {number}
 */
const HeightReference = {
  /**
   * 立场是绝对的。
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 位置与地形和 3D 瓦片固定。
   * @type {number}
   * @constant
   */
  CLAMP_TO_GROUND: 1,

  /**
   * 位置高度是 terrain 和 3D 瓦片上方的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_GROUND: 2,

  /**
   * 位置被夹紧到 terain。
   * @type {number}
   * @constant
   */
  CLAMP_TO_TERRAIN: 3,

  /**
   * 位置高度是 terrain 以上的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_TERRAIN: 4,

  /**
   * 位置被钳制到 3D 瓦片。
   * @type {number}
   * @constant
   */
  CLAMP_TO_3D_TILE: 5,

  /**
   * 位置高度是 3D 瓦片上方的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_3D_TILE: 6,
};

export default Object.freeze(HeightReference);

/**
 * 如果高度应固定到表面，则返回 true
 * @param {HeightReference} heightReference
 * 如果高度应固定到表面，则@returns true
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
 * 如果高度应相对于表面偏移，则返回 true
 * @param {HeightReference} heightReference
 * 如果高度应相对于表面偏移，则@returns true
 * @private
 */
export function isHeightReferenceRelative(heightReference) {
  return (
    heightReference === HeightReference.RELATIVE_TO_GROUND ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN
  );
}
