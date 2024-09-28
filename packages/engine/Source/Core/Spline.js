import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import CesiumMath from "./Math.js";
import defaultValue from "./defaultValue.js";
import DeveloperError from "./DeveloperError.js";
import Quaternion from "./Quaternion.js";

/**
 * 创建按时间参数化和计算的曲线。此类型描述接口
 * ，并且不打算直接实例化。
 *
 * @alias Spline
 * @constructor
 *
 * @see CatmullRomSpline
 * @see LinearSpline
 * @see HermiteSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function Spline() {
  /**
   * 控制点的时间数组。
   * @type {number[]}
   * @default undefined
   */
  this.times = undefined;

  /**
   * 控制点数组。
   * @type {Cartesian3[]|Quaternion[]}
   * @default undefined
   */
  this.points = undefined;

  DeveloperError.throwInstantiationError();
}

/**
 * 获取点的类型。这有助于样条确定如何插值
 * 并返回其值。
 *
 * @param {number|Cartesian3|Quaternion} point
 * @returns {*} 点的类型。
 *
 * @exception {DeveloperError} 值必须是笛卡尔 3、四元数或数字。
 *
 * @private
 */
Spline.getPointType = function (point) {
  if (typeof point === "number") {
    return Number;
  }
  if (point instanceof Cartesian3) {
    return Cartesian3;
  }
  if (point instanceof Quaternion) {
    return Quaternion;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "point must be a Cartesian3, Quaternion, or number.",
  );
  //>>includeEnd('debug');
};

/**
 * 在给定时间计算曲线。
 * @function
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3|Quaternion|number[]} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3|Quaternion|number[]} 修改后的结果参数或给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>时间</code>。
 */
Spline.prototype.evaluate = DeveloperError.throwInstantiationError;

/**
 * 在<code>时间</code>中查找索引 <code>i</code>，使得参数
 * <code>时间</code>在区间 <code>[times[i]， times[i + 1]]</code> 中。
 *
 * @param {number} time 时间。
 * @param {number} startIndex 开始搜索的索引。
 * @returns {number} 区间开始时元素的索引。
 *
 * @exception {DeveloperError} 时间必须在 <code>[t<sub>0</sub>， t<sub>n</sub>]</code> 范围内，其中 <code>t<sub>0</sub></code>
 * 是数组中的第一个元素 <code>times</code> 和 <code>t<sub>n</sub></code> 是最后一个元素
 * 在数组<code>时间</code>。
 */
Spline.prototype.findTimeInterval = function (time, startIndex) {
  const times = this.times;
  const length = times.length;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  if (time < times[0] || time > times[length - 1]) {
    throw new DeveloperError("time is out of range.");
  }
  //>>includeEnd('debug');

  // Take advantage of temporal coherence by checking current, next and previous intervals
  // for containment of time.
  startIndex = defaultValue(startIndex, 0);

  if (time >= times[startIndex]) {
    if (startIndex + 1 < length && time < times[startIndex + 1]) {
      return startIndex;
    } else if (startIndex + 2 < length && time < times[startIndex + 2]) {
      return startIndex + 1;
    }
  } else if (startIndex - 1 >= 0 && time >= times[startIndex - 1]) {
    return startIndex - 1;
  }

  // The above failed so do a linear search. For the use cases so far, the
  // length of the list is less than 10. In the future, if there is a bottle neck,
  // it might be here.

  let i;
  if (time > times[startIndex]) {
    for (i = startIndex; i < length - 1; ++i) {
      if (time >= times[i] && time < times[i + 1]) {
        break;
      }
    }
  } else {
    for (i = startIndex - 1; i >= 0; --i) {
      if (time >= times[i] && time < times[i + 1]) {
        break;
      }
    }
  }

  if (i === length - 1) {
    i = length - 2;
  }

  return i;
};

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕动画周期。
 */
Spline.prototype.wrapTime = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  const times = this.times;
  const timeEnd = times[times.length - 1];
  const timeStart = times[0];
  const timeStretch = timeEnd - timeStart;
  let divs;
  if (time < timeStart) {
    divs = Math.floor((timeStart - time) / timeStretch) + 1;
    time += divs * timeStretch;
  }
  if (time > timeEnd) {
    divs = Math.floor((time - timeEnd) / timeStretch) + 1;
    time -= divs * timeStretch;
  }
  return time;
};

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
Spline.prototype.clampTime = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  const times = this.times;
  return CesiumMath.clamp(time, times[0], times[times.length - 1]);
};

export default Spline;
