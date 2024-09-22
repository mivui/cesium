import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定剔除哪些三角形（如果有）。
 *
 * @enum {number}
 */
const CullFace = {
  /**
   * 正面三角形被剔除。
   *
   * @type {number}
   * @constant
   */
  FRONT: WebGLConstants.FRONT,

  /**
   * 背面三角形被剔除。
   *
   * @type {number}
   * @constant
   */
  BACK: WebGLConstants.BACK,

  /**
   * 正面和背面三角形都被剔除。
   *
   * @type {number}
   * @constant
   */
  FRONT_AND_BACK: WebGLConstants.FRONT_AND_BACK,
};
export default Object.freeze(CullFace);
