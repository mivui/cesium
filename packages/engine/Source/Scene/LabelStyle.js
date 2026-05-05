// @ts-check

/**
 * 描述如何绘制标签。
 *
 * @enum {number}
 *
 * @see Label#style
 */
const LabelStyle = {
  /**
   * 填充标签文本，但不描边。
   *
   * @type {number}
   * @constant
   */
  FILL: 0,

  /**
   * 描边标签文本，但不填充。
   *
   * @type {number}
   * @constant
   */
  OUTLINE: 1,

  /**
   * 填充并描边标签文本。
   *
   * @type {number}
   * @constant
   */
  FILL_AND_OUTLINE: 2,
};

Object.freeze(LabelStyle);

export default LabelStyle;
