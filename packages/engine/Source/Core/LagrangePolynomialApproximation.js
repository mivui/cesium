// @ts-check

import defined from "./defined.js";

/**
 * 用于执行拉格朗日插值的 {@link InterpolationAlgorithm}。
 *
 * @namespace LagrangePolynomialApproximation
 */
class LagrangePolynomialApproximation {
  /**
   * Gets the name of this interpolation algorithm.
   * @type {string}
   */
  static get type() {
    return "Lagrange";
  }

  /**
   * 给定所需的次数，返回插值所需的数据点数量。
   *
   * @param {number} degree 所需的插值次数。
   * @returns {number} 所需数据点的数量，以满足所需的插值次数。
   */
  static getRequiredDataPoints(degree) {
    return Math.max(degree + 1.0, 2);
  }

  /**
   * 使用拉格朗日多项式逼近进行插值。
   *
   * @param {number} x 要插值的自变量。
   * @param {number[]} xTable 用于插值的自变量数组。该数组中的值必须按升序排列，且同一值不能重复出现。
   * @param {number[]} yTable 用于插值的因变量数组。对于时间1和时间2的一组三个因变量值 (p,q,w)，应如下所示: {p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable 中对应于 xTable 中每个自变量值的因变量值数量。
   * @param {number[]} [result] 可选的现有数组，用于存储结果。
   * @returns {number[]} 插值后的值数组，或者如果提供了 result 参数，则返回该参数。
   */
  static interpolateOrderZero(x, xTable, yTable, yStride, result) {
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
  }
}

export default LagrangePolynomialApproximation;
