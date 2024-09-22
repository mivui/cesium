/**
 * 相对于 {@link Scene#splitPosition} 显示基元或 ImageryLayer 的方向。
 *
 * @enum {number}
 *
 * @see ImageryLayer#splitDirection
 * @see Cesium3DTileset#splitDirection
 */
const SplitDirection = {
  /**
   * 在 {@link Scene#splitPosition} 的左侧显示基元或 ImageryLayer。
   *
   * @type {number}
   * @constant
   */
  LEFT: -1.0,

  /**
   * 始终显示基元或 ImageryLayer。
   *
   * @type {number}
   * @constant
   */
  NONE: 0.0,

  /**
   * 在 {@link Scene#splitPosition} 的右侧显示基元或 ImageryLayer。
   *
   * @type {number}
   * @constant
   */
  RIGHT: 1.0,
};
export default Object.freeze(SplitDirection);
