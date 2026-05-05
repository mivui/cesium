/**
 * Indicates what happened the last time this tile was visited for selection.
 * @private
 */
const TileSelectionResult = {
  /**
   * 没有选择结果，可能是上一帧未访问过该瓦片。
   */
  NONE: 0,

  /**
   * 该瓦片被判定为不可见，已被剔除。
   */
  CULLED: 1,

  /**
   * 该瓦片已被选中用于渲染。
   */
  RENDERED: 2,

  /**
   * 该瓦片未达到要求的屏幕空间误差，已被细化。
   */
  REFINED: 3,

  /**
   * 该瓦片原本已渲染，但因尚未可渲染，已从渲染列表中移除，转而使用其祖先瓦片。
   */
  RENDERED_AND_KICKED: 2 | 4,

  /**
   * 该瓦片原本已细化，但其已渲染的后代瓦片因尚未可渲染，已从渲染列表中移除，转而使用其祖先瓦片。
   */
  REFINED_AND_KICKED: 3 | 4,

  /**
   * 该瓦片因不可见被剔除，但仍需加载，且其上的所有高度数据需要更新，因为摄像机位置或摄像机参考系原点位于该瓦片内。若摄像机当前位于地形下方，或正在跟踪高度参考地形的物体，加载该瓦片可能会影响摄像机位置。而摄像机位置的变化反过来又可能影响剔除结果。
   */
  CULLED_BUT_NEEDED: 1 | 8,

  /**
   * 判断选择结果是否表示本瓦片或其后代瓦片已从渲染列表中移除。即，结果为 <code>RENDERED_AND_KICKED</code> 或 <code>REFINED_AND_KICKED</code> 时成立。
   *
   * @param {TileSelectionResult} value 待测试的选择结果。
   * @returns {boolean} 若瓦片被移除则返回 true，无论其原本是渲染状态还是细化状态。
   */
  wasKicked: function (value) {
    return value >= TileSelectionResult.RENDERED_AND_KICKED;
  },

  /**
   * 获取被移除或 CULLED_BUT_NEEDED 之前的选择结果。若瓦片未被移除或未被标记为 CULLED_BUT_NEEDED，则返回原始值。
   * @param {TileSelectionResult} value 选择结果。
   * @returns {TileSelectionResult} 移除前的原始选择结果。
   */
  originalResult: function (value) {
    return value & 3;
  },

  /**
   * 将选择结果转换为被移除状态。
   * @param {TileSelectionResult} value 原始选择结果。
   * @returns {TileSelectionResult} 被移除状态的选择结果。
   */
  kick: function (value) {
    return value | 4;
  },
};
export default TileSelectionResult;
