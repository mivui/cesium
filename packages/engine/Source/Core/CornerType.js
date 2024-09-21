/**
 * 角的样式选项。
 *
 * @demo  {@link https://sandcastle.cesium.com/index.html?src=Corridor.html&label=Geometries|Corridor Demo}
 * 演示了三种角类型，如{@link CorridorGraphics}.
 *
 * @enum {number}
 */
const CornerType = {
  /**
   * <img src="Images/CornerTypeRounded.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 边角具有光滑的边缘。
   * @type {number}
   * @constant
   */
  ROUNDED: 0,

  /**
   * <img src="Images/CornerTypeMitered.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 拐角点是相邻边的交集。
   * @type {number}
   * @constant
   */
  MITERED: 1,

  /**
   * <img src="Images/CornerTypeBeveled.png" style="vertical-align: middle;" width="186" height="189" />
   *
   * 边角被剪断。
   * @type {number}
   * @constant
   */
  BEVELED: 2,
};
export default Object.freeze(CornerType);
