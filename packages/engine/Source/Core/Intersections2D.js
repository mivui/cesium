import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 包含用于操作 2D 三角形的函数。
 *
 * @namespace Intersections2D
 */
const Intersections2D = {};

/**
 * 在给定的轴对齐阈值处分割 2D 三角形，并返回结果
 * 阈值给定一侧的多边形。 生成的多边形可能具有 0、1、2、
 * 3 或 4 个顶点。
 *
 * @param {number} threshold 剪切三角形的阈值坐标值。
 * @param {boolean} keepAbove true 保持三角形的部分高于阈值，或 false
 * 保留以下部分。
 * @param {number} u0 三角形中第一个顶点的坐标，按逆时针顺序排列。
 * @param {number} u1 三角形中第二个顶点的坐标，按逆时针顺序排列。
 * @param {number} u2 三角形中第三个顶点的坐标，按逆时针顺序排列。
 * @param {number[]} [result] 要将结果复制到其中的数组。 如果未提供此参数，则
 * 构造并返回一个新数组。
 * @returns {number[]} 剪辑后生成的多边形，指定为
 * 顶点。 顶点按逆时针顺序指定。
 * 每个顶点都是现有列表中的索引（标识为
 * 0、1 或 2）或 -1 表示不在原始三角形中的新顶点。
 * 对于新顶点，-1 后跟三个附加数字：
 * 两个原始顶点中每个顶点的索引，该索引构成线段
 * 新顶点位于 上，与第一个顶点的距离分数
 * 顶点分配给第二个。
 *
 * @example
 * const result = Cesium.Intersections2D.clipTriangleAtAxisAlignedThreshold(0.5, false, 0.2, 0.6, 0.4);
 * // result === [2, 0, -1, 1, 0, 0.25, -1, 1, 2, 0.5]
 */
Intersections2D.clipTriangleAtAxisAlignedThreshold = function (
  threshold,
  keepAbove,
  u0,
  u1,
  u2,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(threshold)) {
    throw new DeveloperError("threshold is required.");
  }
  if (!defined(keepAbove)) {
    throw new DeveloperError("keepAbove is required.");
  }
  if (!defined(u0)) {
    throw new DeveloperError("u0 is required.");
  }
  if (!defined(u1)) {
    throw new DeveloperError("u1 is required.");
  }
  if (!defined(u2)) {
    throw new DeveloperError("u2 is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = [];
  } else {
    result.length = 0;
  }

  let u0Behind;
  let u1Behind;
  let u2Behind;
  if (keepAbove) {
    u0Behind = u0 < threshold;
    u1Behind = u1 < threshold;
    u2Behind = u2 < threshold;
  } else {
    u0Behind = u0 > threshold;
    u1Behind = u1 > threshold;
    u2Behind = u2 > threshold;
  }

  const numBehind = u0Behind + u1Behind + u2Behind;

  let u01Ratio;
  let u02Ratio;
  let u12Ratio;
  let u10Ratio;
  let u20Ratio;
  let u21Ratio;

  if (numBehind === 1) {
    if (u0Behind) {
      u01Ratio = (threshold - u0) / (u1 - u0);
      u02Ratio = (threshold - u0) / (u2 - u0);

      result.push(1);

      result.push(2);

      if (u02Ratio !== 1.0) {
        result.push(-1);
        result.push(0);
        result.push(2);
        result.push(u02Ratio);
      }

      if (u01Ratio !== 1.0) {
        result.push(-1);
        result.push(0);
        result.push(1);
        result.push(u01Ratio);
      }
    } else if (u1Behind) {
      u12Ratio = (threshold - u1) / (u2 - u1);
      u10Ratio = (threshold - u1) / (u0 - u1);

      result.push(2);

      result.push(0);

      if (u10Ratio !== 1.0) {
        result.push(-1);
        result.push(1);
        result.push(0);
        result.push(u10Ratio);
      }

      if (u12Ratio !== 1.0) {
        result.push(-1);
        result.push(1);
        result.push(2);
        result.push(u12Ratio);
      }
    } else if (u2Behind) {
      u20Ratio = (threshold - u2) / (u0 - u2);
      u21Ratio = (threshold - u2) / (u1 - u2);

      result.push(0);

      result.push(1);

      if (u21Ratio !== 1.0) {
        result.push(-1);
        result.push(2);
        result.push(1);
        result.push(u21Ratio);
      }

      if (u20Ratio !== 1.0) {
        result.push(-1);
        result.push(2);
        result.push(0);
        result.push(u20Ratio);
      }
    }
  } else if (numBehind === 2) {
    if (!u0Behind && u0 !== threshold) {
      u10Ratio = (threshold - u1) / (u0 - u1);
      u20Ratio = (threshold - u2) / (u0 - u2);

      result.push(0);

      result.push(-1);
      result.push(1);
      result.push(0);
      result.push(u10Ratio);

      result.push(-1);
      result.push(2);
      result.push(0);
      result.push(u20Ratio);
    } else if (!u1Behind && u1 !== threshold) {
      u21Ratio = (threshold - u2) / (u1 - u2);
      u01Ratio = (threshold - u0) / (u1 - u0);

      result.push(1);

      result.push(-1);
      result.push(2);
      result.push(1);
      result.push(u21Ratio);

      result.push(-1);
      result.push(0);
      result.push(1);
      result.push(u01Ratio);
    } else if (!u2Behind && u2 !== threshold) {
      u02Ratio = (threshold - u0) / (u2 - u0);
      u12Ratio = (threshold - u1) / (u2 - u1);

      result.push(2);

      result.push(-1);
      result.push(0);
      result.push(2);
      result.push(u02Ratio);

      result.push(-1);
      result.push(1);
      result.push(2);
      result.push(u12Ratio);
    }
  } else if (numBehind !== 3) {
    // Completely in front of threshold
    result.push(0);
    result.push(1);
    result.push(2);
  }
  // else Completely behind threshold

  return result;
};

/**
 * 计算 2D 三角形内 2D 位置的重心坐标。
 *
 * @param {number} x x坐标位置，以找到其重心坐标。
 * @param {number} y y坐标位置，以查找其重心坐标。
 * @param {number} x1 x坐标 三角形的第一个顶点。
 * @param {number} y1 y坐标 三角形的第一个顶点。
 * @param {number} x2 x坐标 三角形的第二个顶点。
 * @param {number} y2 y坐标 三角形的第二个顶点。
 * @param {number} x3 x坐标 三角形的第三个顶点。
 * @param {number} y3 y坐标 三角形的第三个顶点。
 * @param {Cartesian3} [result] 要将结果复制到的实例。 如果此参数
 * 未定义，则会创建并返回一个新实例。
 * @returns {Cartesian3} 三角形内位置的重心坐标。
 *
 * @example
 * const result = Cesium.Intersections2D.computeBarycentricCoordinates(0.0, 0.0, 0.0, 1.0, -1, -0.5, 1, -0.5);
 * // result === new Cesium.Cartesian3(1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0);
 */
Intersections2D.computeBarycentricCoordinates = function (
  x,
  y,
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(x)) {
    throw new DeveloperError("x is required.");
  }
  if (!defined(y)) {
    throw new DeveloperError("y is required.");
  }
  if (!defined(x1)) {
    throw new DeveloperError("x1 is required.");
  }
  if (!defined(y1)) {
    throw new DeveloperError("y1 is required.");
  }
  if (!defined(x2)) {
    throw new DeveloperError("x2 is required.");
  }
  if (!defined(y2)) {
    throw new DeveloperError("y2 is required.");
  }
  if (!defined(x3)) {
    throw new DeveloperError("x3 is required.");
  }
  if (!defined(y3)) {
    throw new DeveloperError("y3 is required.");
  }
  //>>includeEnd('debug');

  const x1mx3 = x1 - x3;
  const x3mx2 = x3 - x2;
  const y2my3 = y2 - y3;
  const y1my3 = y1 - y3;
  const inverseDeterminant = 1.0 / (y2my3 * x1mx3 + x3mx2 * y1my3);
  const ymy3 = y - y3;
  const xmx3 = x - x3;
  const l1 = (y2my3 * xmx3 + x3mx2 * ymy3) * inverseDeterminant;
  const l2 = (-y1my3 * xmx3 + x1mx3 * ymy3) * inverseDeterminant;
  const l3 = 1.0 - l1 - l2;

  if (defined(result)) {
    result.x = l1;
    result.y = l2;
    result.z = l3;
    return result;
  }
  return new Cartesian3(l1, l2, l3);
};

/**
 * 计算 2 条线段之间的交点
 *
 * @param {number} x00 x坐标 第一行的第一个顶点。
 * @param {number} y00 y坐标 第一行的第一个顶点。
 * @param {number} x01 x坐标 第一行的第二个顶点。
 * @param {number} y01 y坐标 第一行的第二个顶点。
 * @param {number} x10 x坐标 第二行的第一个顶点。
 * @param {number} y10 y坐标 第二行的第一个顶点。
 * @param {number} x11 x坐标 第二行的第二个顶点。
 * @param {number} y11 y坐标 第二行的第二个顶点。
 * @param {Cartesian2} [result] 要将结果复制到的实例。如果此参数
 * 未定义，则会创建并返回一个新实例。
 * @returns {Cartesian2} 交点，如果没有交点或线条重合，则未定义。
 *
 * @example
 * const result = Cesium.Intersections2D.computeLineSegmentLineSegmentIntersection(0.0, 0.0, 0.0, 2.0, -1, 1, 1, 1);
 * // result === new Cesium.Cartesian2(0.0, 1.0);
 */
Intersections2D.computeLineSegmentLineSegmentIntersection = function (
  x00,
  y00,
  x01,
  y01,
  x10,
  y10,
  x11,
  y11,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("x00", x00);
  Check.typeOf.number("y00", y00);
  Check.typeOf.number("x01", x01);
  Check.typeOf.number("y01", y01);
  Check.typeOf.number("x10", x10);
  Check.typeOf.number("y10", y10);
  Check.typeOf.number("x11", x11);
  Check.typeOf.number("y11", y11);
  //>>includeEnd('debug');

  const numerator1A = (x11 - x10) * (y00 - y10) - (y11 - y10) * (x00 - x10);
  const numerator1B = (x01 - x00) * (y00 - y10) - (y01 - y00) * (x00 - x10);
  const denominator1 = (y11 - y10) * (x01 - x00) - (x11 - x10) * (y01 - y00);

  // If denominator = 0, then lines are parallel. If denominator = 0 and both numerators are 0, then coincident
  if (denominator1 === 0) {
    return;
  }

  const ua1 = numerator1A / denominator1;
  const ub1 = numerator1B / denominator1;

  if (ua1 >= 0 && ua1 <= 1 && ub1 >= 0 && ub1 <= 1) {
    if (!defined(result)) {
      result = new Cartesian2();
    }

    result.x = x00 + ua1 * (x01 - x00);
    result.y = y00 + ua1 * (y01 - y00);

    return result;
  }
};
export default Intersections2D;
