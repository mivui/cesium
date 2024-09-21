import Cartesian3 from "./Cartesian3.js";
import defined from "./defined.js";
import Iau2000Orientation from "./Iau2000Orientation.js";
import JulianDate from "./JulianDate.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import Quaternion from "./Quaternion.js";

/**
 * 表示数据所表示的地球仪方向的轴
 * 来自 IAU/IAG 工作组关于旋转元件的报告。
 * @alias IauOrientationAxes
 * @constructor
 *
 * @param {IauOrientationAxes.ComputeFunction} [computeFunction] 在给定 {@link JulianDate} 的情况下计算 {@link IauOrientationParameters} 的函数。
 *
 * @see Iau2000Orientation
 *
 * @private
 */
function IauOrientationAxes(computeFunction) {
  if (!defined(computeFunction) || typeof computeFunction !== "function") {
    computeFunction = Iau2000Orientation.ComputeMoon;
  }

  this._computeFunction = computeFunction;
}

const xAxisScratch = new Cartesian3();
const yAxisScratch = new Cartesian3();
const zAxisScratch = new Cartesian3();

function computeRotationMatrix(alpha, delta, result) {
  const xAxis = xAxisScratch;
  xAxis.x = Math.cos(alpha + CesiumMath.PI_OVER_TWO);
  xAxis.y = Math.sin(alpha + CesiumMath.PI_OVER_TWO);
  xAxis.z = 0.0;

  const cosDec = Math.cos(delta);

  const zAxis = zAxisScratch;
  zAxis.x = cosDec * Math.cos(alpha);
  zAxis.y = cosDec * Math.sin(alpha);
  zAxis.z = Math.sin(delta);

  const yAxis = Cartesian3.cross(zAxis, xAxis, yAxisScratch);

  if (!defined(result)) {
    result = new Matrix3();
  }

  result[0] = xAxis.x;
  result[1] = yAxis.x;
  result[2] = zAxis.x;
  result[3] = xAxis.y;
  result[4] = yAxis.y;
  result[5] = zAxis.y;
  result[6] = xAxis.z;
  result[7] = yAxis.z;
  result[8] = zAxis.z;

  return result;
}

const rotMtxScratch = new Matrix3();
const quatScratch = new Quaternion();

/**
 * 计算从 ICRF 到地球仪固定轴的旋转。
 *
 * @param {JulianDate} date 计算矩阵的日期。
 * @param {Matrix3} result 要在其上存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数或从 ICRF 到 Fixed 的旋转的新实例。
 */
IauOrientationAxes.prototype.evaluate = function (date, result) {
  if (!defined(date)) {
    date = JulianDate.now();
  }

  const alphaDeltaW = this._computeFunction(date);
  const precMtx = computeRotationMatrix(
    alphaDeltaW.rightAscension,
    alphaDeltaW.declination,
    result
  );

  const rot = CesiumMath.zeroToTwoPi(alphaDeltaW.rotation);
  const quat = Quaternion.fromAxisAngle(Cartesian3.UNIT_Z, rot, quatScratch);
  const rotMtx = Matrix3.fromQuaternion(
    Quaternion.conjugate(quat, quat),
    rotMtxScratch
  );

  const cbi2cbf = Matrix3.multiply(rotMtx, precMtx, precMtx);
  return cbi2cbf;
};

/**
 * 计算 {@link JulianDate} 的 {@link IauOrientationParameters} 的函数。
 * @callback IauOrientationAxes.ComputeFunction
 * @param {JulianDate} date 评估参数的日期。
 * @returns {IauOrientationParameters} 方向参数。
 * @private
 */
export default IauOrientationAxes;
