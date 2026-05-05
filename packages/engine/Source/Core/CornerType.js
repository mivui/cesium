// @ts-check

/**
 * 拐角样式的选项。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=corridor|Corridor Demo}
 * 演示了三种拐角类型，由 {@link CorridorGraphics} 使用。
 *
 * @enum {number}
 */
const CornerType = {
  /**
   * <img src="Images/CornerTypeRounded.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 拐角具有平滑边缘。
   * @type {number}
   * @constant
   */
  ROUNDED: 0,

  /**
   * <img src="Images/CornerTypeMitered.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 拐角点是相邻边的交点。
   * @type {number}
   * @constant
   */
  MITERED: 1,

  /**
   * <img src="Images/CornerTypeBeveled.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 拐角被斜切。
   * @type {number}
   * @constant
   */
  BEVELED: 2,
};

Object.freeze(CornerType);

export default CornerType;
