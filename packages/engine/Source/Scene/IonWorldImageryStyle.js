// Note, these values map directly to ion asset ids.

/**
 * 由 {@link createWorldImagery} 提供的图像类型。
 *
 * @enum {number}
 */
const IonWorldImageryStyle = {
  /**
   * 航拍图像。
   *
   * @type {number}
   * @constant
   */
  AERIAL: 2,

  /**
   * 带有道路叠加层的航拍图像。
   *
   * @type {number}
   * @constant
   */
  AERIAL_WITH_LABELS: 3,

  /**
   * 没有额外图像的道路。
   *
   * @type {number}
   * @constant
   */
  ROAD: 4,
};
export default Object.freeze(IonWorldImageryStyle);
