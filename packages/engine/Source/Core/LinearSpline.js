import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 使用分段线性插值创建曲线的样条曲线。
 *
 * @alias LinearSpline
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number[]} options.times 每个点的严格递增、无单位的浮点时间数组。
 * 这些值与 clock time 无关。它们是曲线的参数化。
 * @param {number[]|Cartesian3[]} options.points 控制点数组。
 *
 * @exception {DeveloperError} points.length must be greater than or equal to 2.
 * @exception {DeveloperError} times.length must be equal to points.length.
 *
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const spline = new Cesium.LinearSpline({
 *     times : times,
 *     points : [
 *         new Cesium.Cartesian3(1235398.0, -4810983.0, 4146266.0),
 *         new Cesium.Cartesian3(1372574.0, -5345182.0, 4606657.0),
 *         new Cesium.Cartesian3(-757983.0, -5542796.0, 4514323.0),
 *         new Cesium.Cartesian3(-2821260.0, -5248423.0, 4021290.0),
 *         new Cesium.Cartesian3(-2539788.0, -4724797.0, 3620093.0)
 *     ]
 * });
 *
 * const p0 = spline.evaluate(times[0]);
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function LinearSpline(options) {
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
  this._pointType = Spline.getPointType(points[0]);

  this._lastTimeIndex = 0;
}

Object.defineProperties(LinearSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof LinearSpline.prototype
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
   * {@link 个 Cartesian3} 控制点数组。
   *
   * @memberof LinearSpline.prototype
   *
   * @type {number[]|Cartesian3[]}
   * @readonly
   */
  points: {
    get: function () {
      return this._points;
    },
  },
});

/**
 * 在<code>时间</code>中查找索引 <code>i</code>，使得参数
 * <code>时间</code>在区间 <code>[times[i]， times[i + 1]]</code> 中。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 区间开始时元素的索引。
 *
 * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
 *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
 *                             in the array <code>times</code>.
 */
LinearSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕到更新的动画。
 */
LinearSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
LinearSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间计算曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {number|Cartesian3} 修改后的结果参数 或给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
 *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
 *                             in the array <code>times</code>.
 */
LinearSpline.prototype.evaluate = function (time, result) {
  const points = this.points;
  const times = this.times;

  const i = (this._lastTimeIndex = this.findTimeInterval(
    time,
    this._lastTimeIndex,
  ));
  const u = (time - times[i]) / (times[i + 1] - times[i]);

  const PointType = this._pointType;
  if (PointType === Number) {
    return (1.0 - u) * points[i] + u * points[i + 1];
  }

  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.lerp(points[i], points[i + 1], u, result);
};

export default LinearSpline;
