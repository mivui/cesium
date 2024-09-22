import WebGLConstants from "./WebGLConstants.js";

/**
 * 缠绕顺序 定义将三角形视为正面的顶点顺序。
 *
 * @enum {number}
 */
const WindingOrder = {
  /**
   * 顶点按顺时针顺序排列。
   *
   * @type {number}
   * @constant
   */
  CLOCKWISE: WebGLConstants.CW,

  /**
   * 顶点按逆时针顺序排列。
   *
   * @type {number}
   * @constant
   */
  COUNTER_CLOCKWISE: WebGLConstants.CCW,
};

/**
 * @private
 */
WindingOrder.validate = function (windingOrder) {
  return (
    windingOrder === WindingOrder.CLOCKWISE ||
    windingOrder === WindingOrder.COUNTER_CLOCKWISE
  );
};

export default Object.freeze(WindingOrder);
