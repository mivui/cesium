// @ts-check

/**
 * 此枚举类型用于确定对象相对于视锥体的位置。对象可以完全位于视锥体内（INSIDE），
 * 部分位于视锥体内部分位于视锥体外（INTERSECTING），或完全位于视锥体的6个平面之外（OUTSIDE）。
 *
 * @enum {number}
 */
const Intersect = {
  /**
   * 表示对象不在视锥体内。
   *
   * @type {number}
   * @constant
   */
  OUTSIDE: -1,

  /**
   * 表示对象与视锥体的一个平面相交。
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

Object.freeze(Intersect);

export default Intersect;
