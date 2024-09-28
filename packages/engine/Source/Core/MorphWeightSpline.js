import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * A spline that linearly interpolates over an array of weight values used by morph targets.
 *
 * @alias MorphWeightSpline
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number[]} options.times An array of strictly increasing, unit-less, floating-point times at each point.
 *                The values are in no way connected to the clock time. They are the parameterization for the curve.
 * @param {number[]} options.weights The array of floating-point control weights given. The weights are ordered such
 *                that all weights for the targets are given in chronological order and order in which they appear in
 *                the glTF from which the morph targets come. This means for 2 targets, weights = [w(0,0), w(0,1), w(1,0), w(1,1) ...]
 *                where i and j in w(i,j) are the time indices and target indices, respectively.
 *
 * @exception {DeveloperError} weights.length must be greater than or equal to 2.
 * @exception {DeveloperError} times.length must be a factor of weights.length.
 *
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const weights = [0.0, 1.0, 0.25, 0.75, 0.5, 0.5, 0.75, 0.25, 1.0, 0.0]; //Two targets
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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
   * 浮点数组控制权重数组。
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
 * 在<code>times</code>中查找索引 <code>i</code>，使得参数
 * <code>times</code>在区间 <code>[times[i]， times[i + 1]]</code> 中。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 区间开始时元素的索引。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>times</code>。
 */
MorphWeightSpline.prototype.findTimeInterval =
  Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕到更新的动画。
 */
MorphWeightSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
MorphWeightSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间计算曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {number[]} [result] 要在其上存储结果的对象。
 * @returns {number[]} 修改后的结果参数 或给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>times</code>。
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
