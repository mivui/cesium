import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import HermiteSpline from "./HermiteSpline.js";
import Matrix4 from "./Matrix4.js";
import Spline from "./Spline.js";

const scratchTimeVec = new Cartesian4();
const scratchTemp0 = new Cartesian3();
const scratchTemp1 = new Cartesian3();

function createEvaluateFunction(spline) {
  const points = spline.points;
  const times = spline.times;

  if (points.length < 3) {
    const t0 = times[0];
    const invSpan = 1.0 / (times[1] - t0);

    const p0 = points[0];
    const p1 = points[1];

    return function (time, result) {
      if (!defined(result)) {
        result = new Cartesian3();
      }
      const u = (time - t0) * invSpan;
      return Cartesian3.lerp(p0, p1, u, result);
    };
  }

  return function (time, result) {
    if (!defined(result)) {
      result = new Cartesian3();
    }
    const i = (spline._lastTimeIndex = spline.findTimeInterval(
      time,
      spline._lastTimeIndex,
    ));
    const u = (time - times[i]) / (times[i + 1] - times[i]);

    const timeVec = scratchTimeVec;
    timeVec.z = u;
    timeVec.y = u * u;
    timeVec.x = timeVec.y * u;
    timeVec.w = 1.0;

    let p0;
    let p1;
    let p2;
    let p3;
    let coefs;

    if (i === 0) {
      p0 = points[0];
      p1 = points[1];
      p2 = spline.firstTangent;

      p3 = Cartesian3.subtract(points[2], p0, scratchTemp0);
      Cartesian3.multiplyByScalar(p3, 0.5, p3);

      coefs = Matrix4.multiplyByVector(
        HermiteSpline.hermiteCoefficientMatrix,
        timeVec,
        timeVec,
      );
    } else if (i === points.length - 2) {
      p0 = points[i];
      p1 = points[i + 1];
      p3 = spline.lastTangent;

      p2 = Cartesian3.subtract(p1, points[i - 1], scratchTemp0);
      Cartesian3.multiplyByScalar(p2, 0.5, p2);

      coefs = Matrix4.multiplyByVector(
        HermiteSpline.hermiteCoefficientMatrix,
        timeVec,
        timeVec,
      );
    } else {
      p0 = points[i - 1];
      p1 = points[i];
      p2 = points[i + 1];
      p3 = points[i + 2];
      coefs = Matrix4.multiplyByVector(
        CatmullRomSpline.catmullRomCoefficientMatrix,
        timeVec,
        timeVec,
      );
    }
    result = Cartesian3.multiplyByScalar(p0, coefs.x, result);
    Cartesian3.multiplyByScalar(p1, coefs.y, scratchTemp1);
    Cartesian3.add(result, scratchTemp1, result);
    Cartesian3.multiplyByScalar(p2, coefs.z, scratchTemp1);
    Cartesian3.add(result, scratchTemp1, result);
    Cartesian3.multiplyByScalar(p3, coefs.w, scratchTemp1);
    return Cartesian3.add(result, scratchTemp1, result);
  };
}

const firstTangentScratch = new Cartesian3();
const lastTangentScratch = new Cartesian3();

/**
 * Catmull-Rom样条是三次样条，其中控制点的切线，
 * 除第一个和最后一个控制点外，使用前一个和下一个控制点计算。
 * Catmull-Rom样条在C<sup>1</sup>类中。
 *
 * @alias CatmullRomSpline
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {number[]} options.times 在每个点上严格递增的、无单位的浮点时间的数组。
 *                这些值与时钟时间没有任何关系。它们是曲线的参数化。
 * @param {Cartesian3[]} options.points {@link Cartesian3} 控制点数组。
 * @param {Cartesian3} [options.firstTangent] 曲线在第一个控制点处的切线。
 *                     如果正切值没有给出，它将被估计。
 * @param {Cartesian3} [options.lastTangent] 曲线在最后一个控制点的切线。
 *                     如果正切值没有给出，它将被估计。
 *
 * @exception {DeveloperError} points.length must be greater than or equal to 2.
 * @exception {DeveloperError} times.length must be equal to points.length.
 *
 *
 * @example
 * // spline above the earth from Philadelphia to Los Angeles
 * const spline = new Cesium.CatmullRomSpline({
 *     times : [ 0.0, 1.5, 3.0, 4.5, 6.0 ],
 *     points : [
 *         new Cesium.Cartesian3(1235398.0, -4810983.0, 4146266.0),
 *         new Cesium.Cartesian3(1372574.0, -5345182.0, 4606657.0),
 *         new Cesium.Cartesian3(-757983.0, -5542796.0, 4514323.0),
 *         new Cesium.Cartesian3(-2821260.0, -5248423.0, 4021290.0),
 *         new Cesium.Cartesian3(-2539788.0, -4724797.0, 3620093.0)
 *     ]
 * });
 *
 * const p0 = spline.evaluate(times[i]);         // equal to positions[i]
 * const p1 = spline.evaluate(times[i] + delta); // interpolated value when delta < times[i + 1] - times[i]
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see LinearSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function CatmullRomSpline(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const points = options.points;
  const times = options.times;
  let firstTangent = options.firstTangent;
  let lastTangent = options.lastTangent;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("points", points);
  Check.defined("times", times);
  Check.typeOf.number.greaterThanOrEquals("points.length", points.length, 2);
  Check.typeOf.number.equals(
    "times.length",
    "points.length",
    times.length,
    points.length,
  );
  //>>includeEnd('debug');

  if (points.length > 2) {
    if (!defined(firstTangent)) {
      firstTangent = firstTangentScratch;
      Cartesian3.multiplyByScalar(points[1], 2.0, firstTangent);
      Cartesian3.subtract(firstTangent, points[2], firstTangent);
      Cartesian3.subtract(firstTangent, points[0], firstTangent);
      Cartesian3.multiplyByScalar(firstTangent, 0.5, firstTangent);
    }

    if (!defined(lastTangent)) {
      const n = points.length - 1;
      lastTangent = lastTangentScratch;
      Cartesian3.multiplyByScalar(points[n - 1], 2.0, lastTangent);
      Cartesian3.subtract(points[n], lastTangent, lastTangent);
      Cartesian3.add(lastTangent, points[n - 2], lastTangent);
      Cartesian3.multiplyByScalar(lastTangent, 0.5, lastTangent);
    }
  }

  this._times = times;
  this._points = points;
  this._firstTangent = Cartesian3.clone(firstTangent);
  this._lastTangent = Cartesian3.clone(lastTangent);

  this._evaluateFunction = createEvaluateFunction(this);
  this._lastTimeIndex = 0;
}

Object.defineProperties(CatmullRomSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof CatmullRomSpline.prototype
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
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3[]}
   * @readonly
   */
  points: {
    get: function () {
      return this._points;
    },
  },

  /**
   * 在第一个控制点的切线。
   *
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */
  firstTangent: {
    get: function () {
      return this._firstTangent;
    },
  },

  /**
   * 最后一个控制点的切线。
   *
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */
  lastTangent: {
    get: function () {
      return this._lastTangent;
    },
  },
});

/**
 * @private
 */
CatmullRomSpline.catmullRomCoefficientMatrix = new Matrix4(
  -0.5,
  1.0,
  -0.5,
  0.0,
  1.5,
  -2.5,
  0.0,
  1.0,
  -1.5,
  2.0,
  0.5,
  0.0,
  0.5,
  -0.5,
  0.0,
  0.0,
);

/**
 * 在<code>times</code>中查找索引<code>i</code>，使得参数
 * <code>time</code> is in the interval <code>[times[i], times[i + 1]]</code>.
 * @function
 *
 * @param {number} time  time.
 * @returns {number} 区间开始处元素的索引。
 *
 * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
 *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
 *                             in the array <code>times</code>.
 */
CatmullRomSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定的时间包裹到样条所覆盖的周期。
 * @function
 *
 * @param {number} time  time.
 * @return {number} 时间，绕来绕去更新动画。
 */
CatmullRomSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定的时间夹紧到样条所覆盖的周期。
 * @function
 *
 * @param {number} time  time.
 * @return {number} 时间，被夹到了动画时期。
 */
CatmullRomSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间对曲线求值。
 *
 * @param {number} time 计算曲线的时间。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或给定时间曲线上该点的新实例。
 *
 * @exception {DeveloperError} 时间必须在范围内 <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
 *                             是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code>是最后一个元素
 *                            在数组中 <code>times</code>.
 */
CatmullRomSpline.prototype.evaluate = function (time, result) {
  return this._evaluateFunction(time, result);
};
export default CatmullRomSpline;
