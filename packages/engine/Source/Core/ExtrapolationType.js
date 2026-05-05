// @ts-check

/**
 * 用于在查询超出可用数据范围时确定插值值的
 * 外推方式的常量。
 *
 * @enum {number}
 *
 * @see SampledProperty
 */
const ExtrapolationType = {
  /**
   * 不进行外推。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 在样本数据范围之外时使用第一个或最后一个值。
   *
   * @type {number}
   * @constant
   */
  HOLD: 1,

  /**
   * 对值进行外推。
   *
   * @type {number}
   * @constant
   */
  EXTRAPOLATE: 2,
};

Object.freeze(ExtrapolationType);

export default ExtrapolationType;
