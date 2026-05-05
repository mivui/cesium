/**
 * 确定光栅化期间是剔除正面、背面还是都不剔除。
 *
 * @enum {number}
 *
 * @see DrawCommand.cull
 */
const CullFace = {
  /**
   * 剔除背面面片。
   * @type {number}
   * @constant
   */
  BACK: 0,

  /**
   * 剔除正面面片。
   * @type {number}
   * @constant
   */
  FRONT: 1,

  /**
   * 不剔除面片。
   * @type {number}
   * @constant
   */
  NONE: 2,
};

/**
 * 获取 WebGL 的 cullFace 值。
 *
 * @param {CullFace} cullFace 要获取对应 WebGL 值的剔除面。
 * @returns {number} 对应的 WebGL 值。
 *
 * @private
 */
CullFace.toWebGLConstant = function (cullFace) {
  return cullFace;
};

Object.freeze(CullFace);

export default CullFace;
