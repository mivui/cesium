import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 由表示阶跃函数的分段常量组成的样条。
 *
 * @alias SteppedSpline
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number[]} options.times 每个点的严格递增、无单位的浮点时间数组。这些值与 clock time 没有任何关系。它们是曲线的参数化。
 * @param {number[]|Cartesian3[]|Quaternion[]} options.points 控制点数组。
 *
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const spline = new Cesium.SteppedSpline({
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
 * @see CatmullRomSpline
 * @see HermiteSpline
 * @see LinearSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function SteppedSpline(options) {
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

Object.defineProperties(SteppedSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof SteppedSpline.prototype
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
   * 控制点数组。
   *
   * @memberof SteppedSpline.prototype
   *
   * @type {number[]|Cartesian3[]|Quaternion[]}
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
 * @param {number} startIndex 开始搜索的索引。
 * @returns {number} 区间开始时元素的索引。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>时间</code>。
 */
SteppedSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕到更新的动画。
 */
SteppedSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
SteppedSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间计算曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3|Quaternion} [result] 要在其上存储结果的对象。
 * @returns {number|Cartesian3|Quaternion} 修改后的结果参数或给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>时间</code>。
 */
SteppedSpline.prototype.evaluate = function (time, result) {
  const points = this.points;

  this._lastTimeIndex = this.findTimeInterval(time, this._lastTimeIndex);
  const i = this._lastTimeIndex;

  const PointType = this._pointType;
  if (PointType === Number) {
    return points[i];
  }

  if (!defined(result)) {
    result = new PointType();
  }

  return PointType.clone(points[i], result);
};

export default SteppedSpline;
