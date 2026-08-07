// @ts-check

import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 用于执行线性插值的 {@link InterpolationAlgorithm}。
 *
 * @namespace LinearApproximation
 */
class LinearApproximation {
  /**
   * Gets the name of this interpolation algorithm.
   * @type {string}
   */
  static get type() {
    return "Linear";
  }

  /**
   * 给定所需的次数，返回插值所需的数据点数量。
   * 由于线性插值只能生成一阶多项式，该函数
   * 总是返回 2。
   * @param {number} degree 所需的插值次数。
   * @returns {number} 该函数总是返回 2。
   *
   */
  static getRequiredDataPoints(degree) {
    return 2;
  }

  /**
   * 使用线性近似插值数值。
   *
   * @param {number} x 自变量，用于插值对应的因变量。
   * @param {number[]} xTable 用于插值的自变量数组。该数组中的值必须按递增顺序排列，且同一值不得出现两次。
   * @param {number[]} yTable 用于插值的因变量数组。对于时间1和时间2的一组三个因变量值(p,q,w)，应如下排列：{p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable中对应于xTable每个自变量值的因变量值的数量。
   * @param {number[]} [result] 一个现有数组，用于存储结果。
   * @returns {number[]} 插值后的值数组，如果提供了result参数，则返回该参数。
   */
  static interpolateOrderZero(x, xTable, yTable, yStride, result) {
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
  }
}

export default LinearApproximation;
