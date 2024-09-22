/**
 * 用于识别已知参考系的常量。
 *
 * @enum {number}
 */
const ReferenceFrame = {
  /**
   * 固定框架。
   *
   * @type {number}
   * @constant
   */
  FIXED: 0,

  /**
   * 惯性系。
   *
   * @type {number}
   * @constant
   */
  INERTIAL: 1,
};
export default Object.freeze(ReferenceFrame);
