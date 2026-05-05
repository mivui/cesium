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
 * 给定所需的阶数，返回插值所需的数据点数量。
 * @function
 *
 * @param {number} degree 所需的插值阶数。
 * @returns {number} 所需插值阶数所需的数据点数量。
 */
InterpolationAlgorithm.getRequiredDataPoints =
  DeveloperError.throwInstantiationError;

/**
 * 执行零阶插值。
 * @function
 *
 * @param {number} x 要插值的因变量的自变量。
 * @param {number[]} xTable 用于插值的自变量数组。此数组中的值
 * 必须按递增顺序排列，且数组中不得出现相同的值两次。
 * @param {number[]} yTable 用于插值的因变量数组。对于时间1和时间2处的一组三个
 * 因变量值(p,q,w)，应如下所示：{p1, q1, w1, p2, q2, w2}。
 * @param {number} yStride yTable中对应于xTable中每个自变量值的
 * 因变量值的数量。
 * @param {number[]} [result] 用于存储结果的现有数组。
 *
 * @returns {number[]} 插值值数组，如果提供了result参数则返回该参数。
 */
InterpolationAlgorithm.interpolateOrderZero =
  DeveloperError.throwInstantiationError;

/**
 * 执行高阶插值。并非所有插值器都需要支持高阶插值，
 * 如果此函数在实现对象上保持未定义，则将改用interpolateOrderZero。
 * @function
 * @param {number} x 要插值的因变量的自变量。
 * @param {number[]} xTable 用于插值的自变量数组。此数组中的值
 * 必须按递增顺序排列，且数组中不得出现相同的值两次。
 * @param {number[]} yTable 用于插值的因变量数组。对于时间1和时间2处的一组三个
 * 因变量值(p,q,w)，应如下所示：{p1, q1, w1, p2, q2, w2}。
 * @param {number} yStride yTable中对应于xTable中每个自变量值的
 * 因变量值的数量。
 * @param {number} inputOrder 输入提供的导数数量。
 * @param {number} outputOrder 输出所需的导数数量。
 * @param {number[]} [result] 用于存储结果的现有数组。
 * @returns {number[]} 插值值数组，如果提供了result参数则返回该参数。
 */
InterpolationAlgorithm.interpolate = DeveloperError.throwInstantiationError;
export default InterpolationAlgorithm;
