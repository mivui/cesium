// @ts-check

import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

const factorial = CesiumMath.factorial;

/**
 * @param {number} x
 * @param {number[]} zIndices
 * @param {number[]} xTable
 * @param {number} derivOrder
 * @param {number} termOrder
 * @param {number[]} reservedIndices
 * @returns {number}
 *
 * @private
 */
function calculateCoefficientTerm(
  x,
  zIndices,
  xTable,
  derivOrder,
  termOrder,
  reservedIndices,
) {
  let result = 0;
  let reserved;
  let i;
  let j;

  if (derivOrder > 0) {
    for (i = 0; i < termOrder; i++) {
      reserved = false;
      for (j = 0; j < reservedIndices.length && !reserved; j++) {
        if (i === reservedIndices[j]) {
          reserved = true;
        }
      }

      if (!reserved) {
        reservedIndices.push(i);
        result += calculateCoefficientTerm(
          x,
          zIndices,
          xTable,
          derivOrder - 1,
          termOrder,
          reservedIndices,
        );
        reservedIndices.splice(reservedIndices.length - 1, 1);
      }
    }

    return result;
  }

  result = 1;
  for (i = 0; i < termOrder; i++) {
    reserved = false;
    for (j = 0; j < reservedIndices.length && !reserved; j++) {
      if (i === reservedIndices[j]) {
        reserved = true;
      }
    }

    if (!reserved) {
      result *= x - xTable[zIndices[i]];
    }
  }

  return result;
}

/**
 * @type {number[]}
 *
 * @private
 */
const arrayScratch = [];

/**
* 用于执行Hermite插值的{@link InterpolationAlgorithm}。
 *
 * @namespace HermitePolynomialApproximation
 */
class HermitePolynomialApproximation {
  /**
   * Gets the name of this interpolation algorithm.
   * @type {string}
   */
  static get type() {
    return "Hermite";
  }

  /**
   * 给定所需的次数，返回插值所需的数据点数量。
   *
   * @param {number} degree 所需的插值次数。
   * @param {number} [inputOrder=0] 输入的阶数（0 表示仅数据，1 表示数据及其导数，依此类推）。
   * @returns {number} 所需的插值次数所需的数据点数。
   * @exception {DeveloperError} degree 必须大于或等于 0。
   * @exception {DeveloperError} inputOrder 必须大于或等于 0。
   */
  static getRequiredDataPoints(degree, inputOrder) {
    inputOrder = inputOrder ?? 0;

    //>>includeStart('debug', pragmas.debug);
    if (!defined(degree)) {
      throw new DeveloperError("degree is required.");
    }
    if (degree < 0) {
      throw new DeveloperError("degree must be 0 or greater.");
    }
    if (inputOrder < 0) {
      throw new DeveloperError("inputOrder must be 0 or greater.");
    }
    //>>includeEnd('debug');

    return Math.max(Math.floor((degree + 1) / (inputOrder + 1)), 2);
  }

/**
   * 使用赫米特多项式近似插值。
   *
   * @param {number} x 要进行插值的自变量。
   * @param {number[]} xTable 用于插值的自变量数组。该数组中的值必须按升序排列，且相同的值不得重复。
   * @param {number[]} yTable 用于插值的因变量数组。对于在时间 1 和时间 2 的三个因变量值 (p,q,w) 的集合，应如下排列：{p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable 中每个自变量值对应的因变量值的数量。
   * @param {number[]} [result] 用于存储结果的现有数组。
   * @returns {number[]} 插值后的值数组，如果提供了 result 参数，则返回该参数。
   */
  static interpolateOrderZero(x, xTable, yTable, yStride, result) {
    if (!defined(result)) {
      result = new Array(yStride);
    }

    let i;
    let j;
    let d;
    let s;
    let len;
    let index;
    const length = xTable.length;
    const coefficients = new Array(yStride);

    for (i = 0; i < yStride; i++) {
      result[i] = 0;

      const l = new Array(length);
      coefficients[i] = l;
      for (j = 0; j < length; j++) {
        l[j] = [];
      }
    }

    const zIndicesLength = length,
      zIndices = new Array(zIndicesLength);

    for (i = 0; i < zIndicesLength; i++) {
      zIndices[i] = i;
    }

    let highestNonZeroCoef = length - 1;
    for (s = 0; s < yStride; s++) {
      for (j = 0; j < zIndicesLength; j++) {
        index = zIndices[j] * yStride + s;
        coefficients[s][0].push(yTable[index]);
      }

      for (i = 1; i < zIndicesLength; i++) {
        let nonZeroCoefficients = false;
        for (j = 0; j < zIndicesLength - i; j++) {
          const zj = xTable[zIndices[j]];
          const zn = xTable[zIndices[j + i]];

          let numerator;
          if (zn - zj <= 0) {
            index = zIndices[j] * yStride + yStride * i + s;
            numerator = yTable[index];
            coefficients[s][i].push(numerator / factorial(i));
          } else {
            numerator =
              coefficients[s][i - 1][j + 1] - coefficients[s][i - 1][j];
            coefficients[s][i].push(numerator / (zn - zj));
          }
          nonZeroCoefficients = nonZeroCoefficients || numerator !== 0;
        }

        if (!nonZeroCoefficients) {
          highestNonZeroCoef = i - 1;
        }
      }
    }

    for (d = 0, len = 0; d <= len; d++) {
      for (i = d; i <= highestNonZeroCoef; i++) {
        const tempTerm = calculateCoefficientTerm(
          x,
          zIndices,
          xTable,
          d,
          i,
          [],
        );
        for (s = 0; s < yStride; s++) {
          const coeff = coefficients[s][i][0];
          result[s + d * yStride] += coeff * tempTerm;
        }
      }
    }

    return result;
  }

 /**
   * 使用赫尔米特多项式近似进行值的插值。
   *
   * @param {number} x 要插值的自变量。
   * @param {number[]} xTable 用于插值的自变量数组。该数组中的值必须按升序排列，并且数组中不能出现重复值。
   * @param {number[]} yTable 用于插值的因变量数组。对于在时间1和时间2处的一组三个因变量值 (p,q,w)，应如下：{p1, q1, w1, p2, q2, w2}。
   * @param {number} yStride yTable 中每个自变量值在 xTable 中对应的因变量值的数量。
   * @param {number} inputOrder 输入提供的导数数量。
   * @param {number} outputOrder 输出所需的导数数量。
   * @param {number[]} [result] 一个现有数组，用于存储结果。
   *
   * @returns {number[]} 插值后的值数组，或者如果提供了 result 参数，则返回该参数。
   */
  static interpolate(
    x,
    xTable,
    yTable,
    yStride,
    inputOrder,
    outputOrder,
    result,
  ) {
    const resultLength = yStride * (outputOrder + 1);
    if (!defined(result)) {
      result = new Array(resultLength);
    }
    for (let r = 0; r < resultLength; r++) {
      result[r] = 0;
    }

    const length = xTable.length;
    // The zIndices array holds copies of the addresses of the xTable values
    // in the range we're looking at. Even though this just holds information already
    // available in xTable this is a much more convenient format.
    const zIndices = new Array(length * (inputOrder + 1));
    let i;
    for (i = 0; i < length; i++) {
      for (let j = 0; j < inputOrder + 1; j++) {
        zIndices[i * (inputOrder + 1) + j] = i;
      }
    }

    const zIndiceslength = zIndices.length;
    const coefficients = arrayScratch;
    const highestNonZeroCoef = fillCoefficientList(
      coefficients,
      zIndices,
      xTable,
      yTable,
      yStride,
      inputOrder,
    );
    /** @type {number[]} */
    const reservedIndices = [];

    const tmp = (zIndiceslength * (zIndiceslength + 1)) / 2;
    const loopStop = Math.min(highestNonZeroCoef, outputOrder);
    for (let d = 0; d <= loopStop; d++) {
      for (i = d; i <= highestNonZeroCoef; i++) {
        reservedIndices.length = 0;
        const tempTerm = calculateCoefficientTerm(
          x,
          zIndices,
          xTable,
          d,
          i,
          reservedIndices,
        );
        const dimTwo = Math.floor((i * (1 - i)) / 2) + zIndiceslength * i;

        for (let s = 0; s < yStride; s++) {
          const dimOne = Math.floor(s * tmp);
          const coef = coefficients[dimOne + dimTwo];
          result[s + d * yStride] += coef * tempTerm;
        }
      }
    }

    return result;
  }
}

/**
 * @param {number[]} coefficients
 * @param {number[]} zIndices
 * @param {number[]} xTable
 * @param {number[]} yTable
 * @param {number} yStride
 * @param {number} inputOrder
 * @returns {number}
 *
 * @private
 */
function fillCoefficientList(
  coefficients,
  zIndices,
  xTable,
  yTable,
  yStride,
  inputOrder,
) {
  let j;
  let index;
  let highestNonZero = -1;
  const zIndiceslength = zIndices.length;
  const tmp = (zIndiceslength * (zIndiceslength + 1)) / 2;

  for (let s = 0; s < yStride; s++) {
    const dimOne = Math.floor(s * tmp);

    for (j = 0; j < zIndiceslength; j++) {
      index = zIndices[j] * yStride * (inputOrder + 1) + s;
      coefficients[dimOne + j] = yTable[index];
    }

    for (let i = 1; i < zIndiceslength; i++) {
      let coefIndex = 0;
      const dimTwo = Math.floor((i * (1 - i)) / 2) + zIndiceslength * i;
      let nonZeroCoefficients = false;

      for (j = 0; j < zIndiceslength - i; j++) {
        const zj = xTable[zIndices[j]];
        const zn = xTable[zIndices[j + i]];

        let numerator;
        let coefficient;
        if (zn - zj <= 0) {
          index = zIndices[j] * yStride * (inputOrder + 1) + yStride * i + s;
          numerator = yTable[index];
          coefficient = numerator / CesiumMath.factorial(i);
          coefficients[dimOne + dimTwo + coefIndex] = coefficient;
          coefIndex++;
        } else {
          const dimTwoMinusOne =
            Math.floor(((i - 1) * (2 - i)) / 2) + zIndiceslength * (i - 1);
          numerator =
            coefficients[dimOne + dimTwoMinusOne + j + 1] -
            coefficients[dimOne + dimTwoMinusOne + j];
          coefficient = numerator / (zn - zj);
          coefficients[dimOne + dimTwo + coefIndex] = coefficient;
          coefIndex++;
        }
        nonZeroCoefficients = nonZeroCoefficients || numerator !== 0.0;
      }

      if (nonZeroCoefficients) {
        highestNonZero = Math.max(highestNonZero, i);
      }
    }
  }

  return highestNonZero;
}

export default HermitePolynomialApproximation;
