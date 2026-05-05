import Cartesian3 from "./Cartesian3.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 使用三对角矩阵算法（也称为 Thomas 算法）求解
 * 系数矩阵为三对角矩阵的线性方程组。
 *
 * @namespace TridiagonalSystemSolver
 */
const TridiagonalSystemSolver = {};

/**
 * 求解三对角线性方程组。
 *
 * @param {number[]} diagonal 长度为 <code>n</code> 的数组，包含系数矩阵的对角线。
 * @param {number[]} lower 长度为 <code>n - 1</code> 的数组，包含系数矩阵的下对角线。
 * @param {number[]} upper 长度为 <code>n - 1</code> 的数组，包含系数矩阵的上对角线。
 * @param {Cartesian3[]} right 长度为 <code>n</code> 的笛卡尔坐标数组，表示方程组的右侧。
 *
 * @exception {DeveloperError} diagonal 和 right 必须具有相同的长度。
 * @exception {DeveloperError} lower 和 upper 必须具有相同的长度。
 * @exception {DeveloperError} lower 和 upper 必须比 diagonal 的长度少 1。
 *
 * @performance 线性时间复杂度。
 */
TridiagonalSystemSolver.solve = function (lower, diagonal, upper, right) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(lower) || !(lower instanceof Array)) {
    throw new DeveloperError("The array lower is required.");
  }
  if (!defined(diagonal) || !(diagonal instanceof Array)) {
    throw new DeveloperError("The array diagonal is required.");
  }
  if (!defined(upper) || !(upper instanceof Array)) {
    throw new DeveloperError("The array upper is required.");
  }
  if (!defined(right) || !(right instanceof Array)) {
    throw new DeveloperError("The array right is required.");
  }
  if (diagonal.length !== right.length) {
    throw new DeveloperError("diagonal and right must have the same lengths.");
  }
  if (lower.length !== upper.length) {
    throw new DeveloperError("lower and upper must have the same lengths.");
  } else if (lower.length !== diagonal.length - 1) {
    throw new DeveloperError(
      "lower and upper must be one less than the length of diagonal.",
    );
  }
  //>>includeEnd('debug');

  const c = new Array(upper.length);
  const d = new Array(right.length);
  const x = new Array(right.length);

  let i;
  for (i = 0; i < d.length; i++) {
    d[i] = new Cartesian3();
    x[i] = new Cartesian3();
  }

  c[0] = upper[0] / diagonal[0];
  d[0] = Cartesian3.multiplyByScalar(right[0], 1.0 / diagonal[0], d[0]);

  let scalar;
  for (i = 1; i < c.length; ++i) {
    scalar = 1.0 / (diagonal[i] - c[i - 1] * lower[i - 1]);
    c[i] = upper[i] * scalar;
    d[i] = Cartesian3.subtract(
      right[i],
      Cartesian3.multiplyByScalar(d[i - 1], lower[i - 1], d[i]),
      d[i],
    );
    d[i] = Cartesian3.multiplyByScalar(d[i], scalar, d[i]);
  }

  scalar = 1.0 / (diagonal[i] - c[i - 1] * lower[i - 1]);
  d[i] = Cartesian3.subtract(
    right[i],
    Cartesian3.multiplyByScalar(d[i - 1], lower[i - 1], d[i]),
    d[i],
  );
  d[i] = Cartesian3.multiplyByScalar(d[i], scalar, d[i]);

  x[x.length - 1] = d[d.length - 1];
  for (i = x.length - 2; i >= 0; --i) {
    x[i] = Cartesian3.subtract(
      d[i],
      Cartesian3.multiplyByScalar(x[i + 1], c[i], x[i]),
      x[i],
    );
  }

  return x;
};
export default TridiagonalSystemSolver;
