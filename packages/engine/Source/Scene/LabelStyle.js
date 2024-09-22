/**
 * 介绍如何绘制标签。
 *
 * @enum {number}
 *
 * @see 标签#样式
 */
const LabelStyle = {
  /**
   * 填写标签的文本，但不添加轮廓。
   *
   * @type {number}
   * @constant
   */
  FILL: 0,

  /**
   * 勾勒出标签的文本轮廓，但不要填充。
   *
   * @type {number}
   * @constant
   */
  OUTLINE: 1,

  /**
   * 填写并勾勒出标签的文本轮廓。
   *
   * @type {number}
   * @constant
   */
  FILL_AND_OUTLINE: 2,
};
export default Object.freeze(LabelStyle);
