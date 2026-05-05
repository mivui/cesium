// @ts-check

// 注意，这些值直接映射到 ion 资源 ID。

/**
 * {@link createWorldImagery} 提供的影像类型。
 *
 * @enum {number}
 */
const IonWorldImageryStyle = {
  /**
   * 航空影像。
   *
   * @type {number}
   * @constant
   */
  AERIAL: 2,

  /**
   * 带有道路叠加层的航空影像。
   *
   * @type {number}
   * @constant
   */
  AERIAL_WITH_LABELS: 3,

  /**
   * 不带附加影像的道路。
   *
   * @type {number}
   * @constant
   */
  ROAD: 4,
};

Object.freeze(IonWorldImageryStyle);

export default IonWorldImageryStyle;
