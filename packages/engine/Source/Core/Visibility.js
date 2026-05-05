// @ts-check

/**
 * 此枚举类型用于确定在视地平线剔除过程中，被遮挡物（occludee）的可见程度。遮挡物可能完全遮挡被遮挡物（此时其不可见），也可能部分遮挡被遮挡物，或者完全不遮挡（使其完全可见）。
 *
 * @enum {number}
 */
const Visibility = {
  /**
   * 表示对象的任何部分都不可见。
   *
   * @type {number}
   * @constant
   */
  NONE: -1,

  /**
   * 表示对象的部分（非全部）可见。
   *
   * @type {number}
   * @constant
   */
  PARTIAL: 0,

  /**
   * 表示对象完全可见。
   *
   * @type {number}
   * @constant
   */
  FULL: 1,
};

Object.freeze(Visibility);

export default Visibility;
