/**
 * 原点相对于对象的垂直位置，例如 {@link Billboard}
 * 或 {@link label} 的 例如，将垂直原点设置为 <code>TOP</code>
 * 或 <code>BOTTOM</code> 将在上方或下方显示广告牌（在屏幕空间中）
 * 锚点位置。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.setVerticalOrigin.png' width='695' height='175' /><br />
 * </div>
 *
 * @enum {number}
 *
 * @see Billboard#verticalOrigin
 * @see 标签#verticalOrigin
 */
const VerticalOrigin = {
  /**
   * 原点位于 <code>BASELINE</code> 和 <code>TOP</code> 之间的垂直中心。
   *
   * @type {number}
   * @constant
   */
  CENTER: 0,

  /**
   * 原点位于对象的底部。
   *
   * @type {number}
   * @constant
   */
  BOTTOM: 1,

  /**
   * 如果对象包含文本，则原点位于文本的基线处，否则原点位于对象的底部。
   *
   * @type {number}
   * @constant
   */
  BASELINE: 2,

  /**
   * 原点位于对象的顶部。
   *
   * @type {number}
   * @constant
   */
  TOP: -1,
};
export default Object.freeze(VerticalOrigin);
