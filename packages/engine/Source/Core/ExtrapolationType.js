/**
 * 用于确定如何外推内插值的常量
 * 当查询超出可用数据的边界时。
 *
 * @enum {number}
 *
 * @see SampledProperty
 */
const ExtrapolationType = {
  /**
   * 不发生外推。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 当超出样本数据范围时，将使用第一个或最后一个值。
   *
   * @type {number}
   * @constant
   */
  HOLD: 1,

  /**
   * 该值是外推的。
   *
   * @type {number}
   * @constant
   */
  EXTRAPOLATE: 2,
};
export default Object.freeze(ExtrapolationType);
