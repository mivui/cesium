/**
 * 此枚举类型用于确定相对于 frustum 的
 * 对象。对象可以完全包含在视锥体 （INSIDE） 中，
 * 部分在视锥体内部，部分在外侧（相交），或完全在某个地方
 * 在视锥体的 6 个平面之外 （OUTSIDE）。
 *
 * @enum {number}
 */
const Intersect = {
  /**
   * 表示对象不包含在视锥体中。
   *
   * @type {number}
   * @constant
   */
  OUTSIDE: -1,

  /**
   * 表示对象与视锥体的某个平面相交。
   *
   * @type {number}
   * @constant
   */
  INTERSECTING: 0,

  /**
   * 表示对象完全位于视锥体内。
   *
   * @type {number}
   * @constant
   */
  INSIDE: 1,
};
export default Object.freeze(Intersect);
