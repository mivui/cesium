/**
 * 此枚举类型用于确定对象 occludee、
 * 在水平面剔除期间可见。遮挡物可能会完全阻塞被遮挡物，在这种情况下
 * 它没有可见性，可能会部分阻挡被遮挡对象的视野，或者可能根本不阻挡它，
 * 实现完全可见性。
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
   * 表示对象的部分（但不是全部）可见
   *
   * @type {number}
   * @constant
   */
  PARTIAL: 0,

  /**
   * 表示对象在其整体上是可见的。
   *
   * @type {number}
   * @constant
   */
  FULL: 1,
};
export default Object.freeze(Visibility);
