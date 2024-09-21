import DeveloperError from "./DeveloperError.js";

/**
 * 插值算法的接口。
 *
 * @interface InterpolationAlgorithm
 *
 * @see LagrangePolynomialApproximation
 * @see LinearApproximation
 * @see HermitePolynomialApproximation
 */
const InterpolationAlgorithm = {};

/**
 * 获取此插值算法的名称。
 * @type {string}
 */
InterpolationAlgorithm.type = undefined;

/**
 * 给定所需的度数，返回插值所需的数据点数。
 * @function
 *
 * @param {number} degree 所需的插值度数。
 * @returns {number} 所需插值度所需的数据点数量。
 */
InterpolationAlgorithm.getRequiredDataPoints =
  DeveloperError.throwInstantiationError;

/**
 * 执行零阶插值。
 * @function
 *
 * @param {number} x 将为其插值因变量的自变量。
 * @param {number[]} xTable 用于插值的自变量数组。 值
 * 必须按递增顺序排列，并且相同的值不得在数组中出现两次。
 * @param {number[]} yTable 用于插值的因变量数组。 一套三件
 * 时间 1 和时间 2 的依赖值 （p，q，w） 应如下所示：{p1， q1， w1， p2， q2， w2}。
 * @param {number} yStride yTable 中对应的因变量值的数量
 * xTable 中的每个自变量值。
 * @param {number[]} [result] 存储结果的现有数组。
 *
 * @returns {number[]} 插值数组，或 result 参数（如果提供了）。
 */
InterpolationAlgorithm.interpolateOrderZero =
  DeveloperError.throwInstantiationError;

/**
 * 执行高阶插值。 并非所有插值器都需要支持高阶插值，
 * 如果此函数在实现对象时保持未定义状态，则将使用 interpolateOrderZero。
 * @function
 * @param {number} x 将为其插值因变量的自变量。
 * @param {number[]} xTable 用于插值的自变量数组。 值
 * 必须按递增顺序排列，并且相同的值不得在数组中出现两次。
 * @param {number[]} yTable 用于插值的因变量数组。 一套三件
 * 时间 1 和时间 2 的依赖值 （p，q，w） 应如下所示：{p1， q1， w1， p2， q2， w2}。
 * @param {number} yStride yTable 中对应的因变量值的数量
 * xTable 中的每个自变量值。
 * @param {number} inputOrder 为输入提供的导数数量。
 * @param {number} outputOrder 输出所需的导数数量。
 * @param {number[]} [result] 存储结果的现有数组。
 * @returns {number[]} 插值数组，或 result 参数（如果提供了）。
 */
InterpolationAlgorithm.interpolate = DeveloperError.throwInstantiationError;
export default InterpolationAlgorithm;
