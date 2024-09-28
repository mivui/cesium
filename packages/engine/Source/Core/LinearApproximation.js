import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 用于执行线性插值的 {@link InterpolationAlgorithm}。
 *
 * @namespace LinearApproximation
 */
const LinearApproximation = {
  type: "Linear",
};

/**
 * 给定所需的度数，返回插值所需的数据点数。
 * 由于线性插值只能生成一阶多项式，因此此函数
 * 始终返回 2。
 * @param {number} degree 所需的插值度数。
 * @returns {number} 此函数始终返回 2。
 *
 */
LinearApproximation.getRequiredDataPoints = function (degree) {
  return 2;
};

/**
 * 使用线性近似法对值进行插值。
 *
 * @param {number} x 将为其插值因变量的自变量。
 * @param {number[]} xTable 用于插值的自变量数组。 值
 * 必须按递增顺序排列，并且相同的值不得在数组中出现两次。
 * @param {number[]} yTable 用于插值的因变量数组。 一套三件
 * 时间 1 和时间 2 的依赖值 （p，q，w） 应如下所示：{p1， q1， w1， p2， q2， w2}。
 * @param {number} yStride yTable 中对应的因变量值的数量
 * xTable 中的每个自变量值。
 * @param {number[]} [result] 存储结果的现有数组。
 * @returns {number[]} 插值数组，或 result 参数（如果提供了）。
 */
LinearApproximation.interpolateOrderZero = function (
  x,
  xTable,
  yTable,
  yStride,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (xTable.length !== 2) {
    throw new DeveloperError(
      "The xTable provided to the linear interpolator must have exactly two elements.",
    );
  } else if (yStride <= 0) {
    throw new DeveloperError(
      "There must be at least 1 dependent variable for each independent variable.",
    );
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Array(yStride);
  }

  let i;
  let y0;
  let y1;
  const x0 = xTable[0];
  const x1 = xTable[1];

  //>>includeStart('debug', pragmas.debug);
  if (x0 === x1) {
    throw new DeveloperError(
      "Divide by zero error: xTable[0] and xTable[1] are equal",
    );
  }
  //>>includeEnd('debug');

  for (i = 0; i < yStride; i++) {
    y0 = yTable[i];
    y1 = yTable[i + yStride];
    result[i] = ((y1 - y0) * x + x1 * y0 - x0 * y1) / (x1 - x0);
  }

  return result;
};
export default LinearApproximation;
