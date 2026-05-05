// @ts-check

import WebGLConstants from "./WebGLConstants.js";

/**
 * 几何图元的类型，即点、线和三角形。
 *
 * @enum {number}
 */
const PrimitiveType = {
  /**
   * 点图元，其中每个顶点（或索引）都是一个独立的点。
   *
   * @type {number}
   * @constant
   */
  POINTS: WebGLConstants.POINTS,

  /**
   * 线图元，每两个顶点（或索引）构成一条线段。线段之间不一定相连。
   *
   * @type {number}
   * @constant
   */
  LINES: WebGLConstants.LINES,

  /**
   * 线环图元，第一个顶点之后的每个顶点（或索引）都与前一个顶点连接成线，最后一个顶点隐式连接到第一个顶点。
   *
   * @type {number}
   * @constant
   */
  LINE_LOOP: WebGLConstants.LINE_LOOP,

  /**
   * 线带图元，第一个顶点之后的每个顶点（或索引）都与前一个顶点连接成线。
   *
   * @type {number}
   * @constant
   */
  LINE_STRIP: WebGLConstants.LINE_STRIP,

  /**
   * 三角形图元，每三个顶点（或索引）构成一个三角形。三角形之间不一定共享边。
   *
   * @type {number}
   * @constant
   */
  TRIANGLES: WebGLConstants.TRIANGLES,

  /**
   * 三角形带图元，前两个顶点之后的每个顶点（或索引）都与前两个顶点连接形成一个三角形。例如，这可用于建模墙体。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_STRIP: WebGLConstants.TRIANGLE_STRIP,

  /**
   * 三角形扇图元，前两个顶点之后的每个顶点（或索引）都与前一个顶点和第一个顶点连接形成一个三角形。例如，这可用于建模圆锥体或圆形。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_FAN: WebGLConstants.TRIANGLE_FAN,
};

/**
 * @private
 * @param {PrimitiveType} primitiveType
 */
// @ts-expect-error https://github.com/CesiumGS/cesium/issues/13420
PrimitiveType.isLines = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.LINES ||
    primitiveType === PrimitiveType.LINE_LOOP ||
    primitiveType === PrimitiveType.LINE_STRIP
  );
};

/**
 * @private
 * @param {PrimitiveType} primitiveType
 */
// @ts-expect-error https://github.com/CesiumGS/cesium/issues/13420
PrimitiveType.isTriangles = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLE_FAN
  );
};

/**
 * @private
 * @param {PrimitiveType} primitiveType
 */
// @ts-expect-error https://github.com/CesiumGS/cesium/issues/13420
PrimitiveType.validate = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.POINTS ||
    primitiveType === PrimitiveType.LINES ||
    primitiveType === PrimitiveType.LINE_LOOP ||
    primitiveType === PrimitiveType.LINE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLE_FAN
  );
};

Object.freeze(PrimitiveType);

export default PrimitiveType;
