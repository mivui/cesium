// @ts-check

import DeveloperError from "./DeveloperError.js";

/**
 * 插值算法的接口。
 *
 * @interface
 *
 * @see LagrangePolynomialApproximation
 * @see LinearApproximation
 * @see HermitePolynomialApproximation
 */
class InterpolationAlgorithm {
  /**
   *获取此插值算法的名称。
   * @type {string}
   */
  type;

  /**
   * 给定所需的次数，返回插值所需的数据点数量。
   *
   * @function
   * @param {number} degree 所需的插值次数。
   * @returns {number} 实现所需插值次数所需的数据点数量。
   */
  getRequiredDataPoints(degree) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 执行零阶插值。
   *
   * @function
   * @param {number} x 要插值的自变量。
   * @param {number[]} xTable 用于插值的自变量数组。该数组中的值必须按升序排列，且不能有重复值。
   * @param {number[]} yTable 用于插值的因变量数组。对于时间1和时间2的三组因变量值(p, q, w)，应如下排列：{p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable中每个自变量值对应的因变量值的数量。
   * @param {number[]} [result] 存储结果的已有数组。
   * @returns {number[]} 插值后的数组，如果提供了result参数，则返回该参数。
   */
  interpolateOrderZero(x, xTable, yTable, yStride, result) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * 执行高阶插值。不是所有的插值器都需要支持高阶插值，
   * 如果在实现对象上未定义此函数，将使用 interpolateOrderZero 代替。
   *
   * @function
   * @optional
   * @param {number} x 独立变量，用于插值计算依赖变量。
   * @param {number[]} xTable 用于插值的独立变量数组。该数组中的值必须按升序排列，且相同的值不得重复出现。
   * @param {number[]} yTable 用于插值的依赖变量数组。对于时间 1 和时间 2 的三组依赖值 (p,q,w)，数组应如下所示：{p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable 中每个独立变量对应的依赖变量值的数量。
   * @param {number} inputOrder 输入提供的导数数量。
   * @param {number} outputOrder 所需输出的导数数量。
   * @param {number[]} [result] 用于存储结果的现有数组。
   * @returns {number[]} 插值值的数组，如果提供了 result 参数，则返回该参数。
   */
  interpolate(x, xTable, yTable, yStride, inputOrder, outputOrder, result) {
    DeveloperError.throwInstantiationError();
  }
}

export default InterpolationAlgorithm;
