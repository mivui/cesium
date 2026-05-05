import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 对变形目标使用的权重值数组进行线性插值的样条。
 *
 * @alias MorphWeightSpline
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number[]} options.times 每个点的严格递增、无单位浮点时间数组。
 *                这些值与时钟时间无关，它们是曲线的参数化。
 * @param {number[]} options.weights 给定的浮点控制权重数组。权重按以下方式排序：
 *                所有目标的权重按时间顺序和它们在 glTF 中出现的顺序排列，
 *                其中变形目标来自该 glTF。这意味着对于 2 个目标，weights = [w(0,0), w(0,1), w(1,0), w(1,1) ...]
 *                其中 w(i,j) 中的 i 和 j 分别是时间索引和目标索引。
 *
 * @exception {DeveloperError} weights.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须是 weights.length 的因子。
 *
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const weights = [0.0, 1.0, 0.25, 0.75, 0.5, 0.5, 0.75, 0.25, 1.0, 0.0]; // 两个目标
 * const spline = new Cesium.WeightSpline({
 *     times : times,
 *     weights : weights
 * });
 *
 * const p0 = spline.evaluate(times[0]);
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see LinearSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 */
function MorphWeightSpline(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const weights = options.weights;
  const times = options.times;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("weights", weights);
  Check.defined("times", times);
  Check.typeOf.number.greaterThanOrEquals("weights.length", weights.length, 3);
  if (weights.length % times.length !== 0) {
    throw new DeveloperError(
      "times.length must be a factor of weights.length.",
    );
  }
  //>>includeEnd('debug');

  this._times = times;
  this._weights = weights;
  this._count = weights.length / times.length;

  this._lastTimeIndex = 0;
}

Object.defineProperties(MorphWeightSpline.prototype, {
  /**
   * 控制权重的时间数组。
   *
   * @memberof WeightSpline.prototype
   *
   * @type {number[]}
   * @readonly
   */
  times: {
    get: function () {
      return this._times;
    },
  },

  /**
   * 浮点控制权重数组。
   *
   * @memberof WeightSpline.prototype
   *
   * @type {number[]}
   * @readonly
   */
  weights: {
    get: function () {
      return this._weights;
    },
  },
});

/**
 * 在 <code>times</code> 中查找索引 <code>i</code>，使得参数
 * <code>time</code> 位于区间 <code>[times[i], times[i + 1]]</code> 内。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 区间起始元素的索引。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 的最后一个元素。
 */
MorphWeightSpline.prototype.findTimeInterval =
  Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 环绕更新后的动画时间。
 */
MorphWeightSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间钳制到样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 钳制到动画周期的时间。
 */
MorphWeightSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {number[]} [result] 存储结果的对象。
 * @returns {number[]} 修改后的结果参数，或给定时间曲线上的新点实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 的最后一个元素。
 */
MorphWeightSpline.prototype.evaluate = function (time, result) {
  const weights = this.weights;
  const times = this.times;

  const i = (this._lastTimeIndex = this.findTimeInterval(
    time,
    this._lastTimeIndex,
  ));
  const u = (time - times[i]) / (times[i + 1] - times[i]);

  if (!defined(result)) {
    result = new Array(this._count);
  }

  for (let j = 0; j < this._count; j++) {
    const index = i * this._count + j;
    result[j] = weights[index] * (1.0 - u) + weights[index + this._count] * u;
  }

  return result;
};
export default MorphWeightSpline;
