import Check from "./Check.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 计算结果为常量值的样条曲线。虽然这遵循 {@link Spline} 接口，
 * 它不维护内部时间数组，因为它的值永远不会改变。
 *
 * @alias ConstantSpline
 * @constructor
 *
 * @param {number|Cartesian3|Quaternion} value 样条计算结果的常量值。
 *
 * @example
 * const position = new Cesium.Cartesian3(1.0, 2.0, 3.0);
 * const spline = new Cesium.ConstantSpline(position);
 *
 * const p0 = spline.evaluate(0.0);
 *
 * @see LinearSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function ConstantSpline(value) {
  this._value = value;
  this._valueType = Spline.getPointType(value);
}

Object.defineProperties(ConstantSpline.prototype, {
  /**
   * 样条计算结果的常量值。
   *
   * @memberof ConstantSpline.prototype
   *
   * @type {number|Cartesian3|Quaternion}
   * @readonly
   */
  value: {
    get: function () {
      return this._value;
    },
  },
});

/**
 * 在<code>times</code>中查找索引 <code>i</code>，使得参数
 * <code>times</code>在区间 <code>[times[i]， times[i + 1]]</code> 中。
 *
 * 由于常量样条没有内部 times 数组，这将引发错误。
 *
 * @function
 *
 * @param {number} time  time.
 *
 * @exception {DeveloperError} findTimeInterval cannot be called on a ConstantSpline.
 */
ConstantSpline.prototype.findTimeInterval = function (time) {
  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "findTimeInterval cannot be called on a ConstantSpline."
  );
  //>>includeEnd('debug');
};

/**
 * 将给定时间环绕到样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，环绕到更新的动画。
 */
ConstantSpline.prototype.wrapTime = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  return 0.0;
};

/**
 * 将给定时间限制为样条所覆盖的时间段。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，固定到动画周期。
 */
ConstantSpline.prototype.clampTime = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  return 0.0;
};

/**
 * 在给定时间计算曲线。
 * @function
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3|Quaternion} [result] 要在其上存储结果的对象。
 * @returns {number|Cartesian3|Quaternion} 修改后的结果参数 或常量样条所表示的值。
 */
ConstantSpline.prototype.evaluate = function (time, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  const value = this._value;
  const ValueType = this._valueType;

  if (ValueType === Number) {
    return value;
  }

  return ValueType.clone(value, result);
};

export default ConstantSpline;
