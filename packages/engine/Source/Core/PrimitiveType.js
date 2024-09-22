import WebGLConstants from "./WebGLConstants.js";

/**
 * 几何基元的类型，即点、线和三角形。
 *
 * @enum {number}
 */
const PrimitiveType = {
  /**
   * 每个顶点（或索引）都是单独点的基元点。
   *
   * @type {number}
   * @constant
   */
  POINTS: WebGLConstants.POINTS,

  /**
   * 线基元，其中每两个顶点（或索引）是一个线段。 线段不一定相连。
   *
   * @type {number}
   * @constant
   */
  LINES: WebGLConstants.LINES,

  /**
   * Line loop 基元，其中第一个顶点（或索引）之后的每个顶点（或索引）将一条线连接到
   * 前一个顶点，最后一个顶点隐式连接到第一个顶点。
   *
   * @type {number}
   * @constant
   */
  LINE_LOOP: WebGLConstants.LINE_LOOP,

  /**
   * 线带基元，其中第一个顶点（或索引）之后的每个顶点（或索引）将一条线连接到前一个顶点。
   *
   * @type {number}
   * @constant
   */
  LINE_STRIP: WebGLConstants.LINE_STRIP,

  /**
   * 三角形基元，其中每三个顶点（或索引）是一个三角形。 三角形不一定共享边缘。
   *
   * @type {number}
   * @constant
   */
  TRIANGLES: WebGLConstants.TRIANGLES,

  /**
   * 三角形条带基元，其中前两个顶点（或索引）之后的每个顶点（或索引）都连接到其中
   * 前两个顶点形成一个三角形。 例如，这可用于对墙进行建模。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_STRIP: WebGLConstants.TRIANGLE_STRIP,

  /**
   * 三角形扇形基元，其中前两个顶点（或索引）之后的每个顶点（或索引）都连接到其中
   * 前一个顶点和第一个顶点形成一个三角形。 例如，this can be used
   * 对圆锥体或圆进行建模。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_FAN: WebGLConstants.TRIANGLE_FAN,
};

/**
 * @private
 */
PrimitiveType.isLines = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.LINES ||
    primitiveType === PrimitiveType.LINE_LOOP ||
    primitiveType === PrimitiveType.LINE_STRIP
  );
};

/**
 * @private
 */
PrimitiveType.isTriangles = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLE_FAN
  );
};

/**
 * @private
 */
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

export default Object.freeze(PrimitiveType);
