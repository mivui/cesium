import WebGLConstants from "./WebGLConstants.js";

/**
 * 缠绕顺序定义了三角形被视为正面时的顶点顺序。
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

Object.freeze(WindingOrder);

export default WindingOrder;
