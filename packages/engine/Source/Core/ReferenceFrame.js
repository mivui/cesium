// @ts-check

/**
 * 用于标识已知参考系的常量。
 *
 * @enum {number}
 */
const ReferenceFrame = {
  /**
   * 固定参考系。
   *
   * @type {number}
   * @constant
   */
  FIXED: 0,

  /**
   * 惯性参考系。
   *
   * @type {number}
   * @constant
   */
  INERTIAL: 1,
};

Object.freeze(ReferenceFrame);

export default ReferenceFrame;
