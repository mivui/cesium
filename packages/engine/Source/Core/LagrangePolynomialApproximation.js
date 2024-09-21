import defined from "./defined.js";

/**
 * 用于执行拉格朗日插值的 {@link InterpolationAlgorithm}。
 *
 * @namespace LagrangePolynomialApproximation
 */
const LagrangePolynomialApproximation = {
  type: "Lagrange",
};

/**
 * 给定所需的度数，返回插值所需的数据点数。
 *
 * @param {number} degree 所需的插值度数。
 * @returns {number} 所需插值度所需的数据点数量。
 */
LagrangePolynomialApproximation.getRequiredDataPoints = function (degree) {
  return Math.max(degree + 1.0, 2);
};

/**
 * 使用拉格朗日多项式近似对值进行插值。
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
LagrangePolynomialApproximation.interpolateOrderZero = function (
  x,
  xTable,
  yTable,
  yStride,
  result
) {
  if (!defined(result)) {
    result = new Array(yStride);
  }

  let i;
  let j;
  const length = xTable.length;

  for (i = 0; i < yStride; i++) {
    result[i] = 0;
  }

  for (i = 0; i < length; i++) {
    let coefficient = 1;

    for (j = 0; j < length; j++) {
      if (j !== i) {
        const diffX = xTable[i] - xTable[j];
        coefficient *= (x - xTable[j]) / diffX;
      }
    }

    for (j = 0; j < yStride; j++) {
      result[j] += coefficient * yTable[i * yStride + j];
    }
  }

  return result;
};
export default LagrangePolynomialApproximation;
