import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Quaternion from "./Quaternion.js";
import Spline from "./Spline.js";

function createEvaluateFunction(spline) {
  const points = spline.points;
  const times = spline.times;

  // use slerp interpolation
  return function (time, result) {
    if (!defined(result)) {
      result = new Quaternion();
    }
    const i = (spline._lastTimeIndex = spline.findTimeInterval(
      time,
      spline._lastTimeIndex,
    ));
    const u = (time - times[i]) / (times[i + 1] - times[i]);

    const q0 = points[i];
    const q1 = points[i + 1];

    return Quaternion.fastSlerp(q0, q1, u, result);
  };
}

/**
 * 使用球形线性 （slerp） 插值创建四元数曲线的样条曲线。
 * 生成的曲线属于 C<sup>类 1</sup>。
 *
 * @alias QuaternionSpline
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number[]} options.times 每个点的严格递增、无单位的浮点时间数组。
 * 这些值与 clock time 无关。它们是曲线的参数化。
 * @param {Quaternion[]} options.points {@link 个四元数} 个控制点的数组。
 *
 * 需要 @exception {DeveloperError} 个时间点和时间
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。

 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see LinearSpline
 * @see MorphWeightSpline
 */
function QuaternionSpline(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const points = options.points;
  const times = options.times;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(points) || !defined(times)) {
    throw new DeveloperError("points and times are required.");
  }
  if (points.length < 2) {
    throw new DeveloperError(
      "points.length must be greater than or equal to 2.",
    );
  }
  if (times.length !== points.length) {
    throw new DeveloperError("times.length must be equal to points.length.");
  }
  //>>includeEnd('debug');

  this._times = times;
  this._points = points;

  this._evaluateFunction = createEvaluateFunction(this);
  this._lastTimeIndex = 0;
}

Object.defineProperties(QuaternionSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof QuaternionSpline.prototype
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
   * {@link Quaternion} 个控制点的数组。
   *
   * @memberof QuaternionSpline.prototype
   *
   * @type {Quaternion[]}
   * @readonly
   */
  points: {
    get: function () {
      return this._points;
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
QuaternionSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕到更新的动画。
 */
QuaternionSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
QuaternionSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间计算曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Quaternion} [result] 要在其上存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
 *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
 *                             in the array <code>times</code>.
 */
QuaternionSpline.prototype.evaluate = function (time, result) {
  return this._evaluateFunction(time, result);
};
export default QuaternionSpline;
