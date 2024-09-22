/**
 * 指示上次访问此磁贴以供选择时发生的情况。
 * @private
 */
const TileSelectionResult = {
  /**
   * 没有选择结果，可能是因为未访问该磁贴
   * 最后一帧。
   */
  NONE: 0,

  /**
   * 此图块被视为不可见并被剔除。
   */
  CULLED: 1,

  /**
   * 已选择磁贴进行渲染。
   */
  RENDERED: 2,

  /**
   * 此磁贴未满足所需的屏幕空间错误，因此已进行优化。
   */
  REFINED: 3,

  /**
   * 此瓦片最初已渲染，但已从渲染列表中踢出
   * 支持上级，因为它尚不可渲染。
   */
  RENDERED_AND_KICKED: 2 | 4,

  /**
   * 此瓦片最初经过优化，但其渲染的后代被踢出
   * render 列表，因为它尚不可渲染。
   */
  REFINED_AND_KICKED: 3 | 4,

  /**
   * 此瓦片因不可见而被剔除，但仍需要加载
   * 上的任何高度都需要更新，因为相机的位置或
   * 摄像机的参考帧的原点位于此图块内。加载此磁贴
   * 如果摄像机当前位于下方，则可能会影响摄像机的位置
   * terrain，或者如果它正在跟踪其高度参考 terrain 的对象。
   * 摄像机位置的更改反过来可能会影响被剔除的内容。
   */
  CULLED_BUT_NEEDED: 1 | 8,

  /**
   * 确定选择结果是否指示此瓦片或其后代
   * 从 render 列表中踢出。换句话说，如果它是 <code>RENDERED_AND_KICKED</code>
   * 或 <code>REFINED_AND_KICKED</code>。
   *
   * @param {TileSelectionResult} value 要测试的选择结果。
   * 如果图块被踢出，则@returns {boolean} true，无论它最初是渲染还是优化。
   */
  wasKicked: function (value) {
    return value >= TileSelectionResult.RENDERED_AND_KICKED;
  },

  /**
   * 确定被踢出或CULLED_BUT_NEEDED之前的原始选择结果。
   * 如果图块未踢出或CULLED_BUT_NEEDED，则返回原始值。
   * @param {TileSelectionResult} value 选择结果。
   * @returns {TileSelectionResult} 踢球前的原始选择结果。
   */
  originalResult: function (value) {
    return value & 3;
  },

  /**
   * 将此选择结果转换为踢球。
   * @param {TileSelectionResult} value 原始选择结果。
   * @returns {TileSelectionResult} 选择结果的踢出形式。
   */
  kick: function (value) {
    return value | 4;
  },
};
export default TileSelectionResult;
