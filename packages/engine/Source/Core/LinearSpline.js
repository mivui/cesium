import Cartesian3 from "./Cartesian3.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 使用分段线性插值创建曲线的样条。
 *
 * @alias LinearSpline
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number[]} options.times 每个点的严格递增、无单位浮点时间数组。
 *                这些值与时钟时间无关，它们是曲线的参数化。
 * @param {number[]|Cartesian3[]} options.points 控制点数组。
 *
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。
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
  options = options ?? Frozen.EMPTY_OBJECT;

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
   * {@link Cartesian3} 控制点数组。
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
LinearSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 环绕更新后的动画时间。
 */
LinearSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间钳制到样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 钳制到动画周期的时间。
 */
LinearSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {number|Cartesian3} 修改后的结果参数，或给定时间曲线上的新点实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 的最后一个元素。
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
