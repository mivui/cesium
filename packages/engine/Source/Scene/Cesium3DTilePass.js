/**
 * 3D Tiles 渲染过程中使用的通道。
 *
 * @enum {number}
 * @private
 */
const Cesium3DTilePass = {
  /**
   * 默认渲染通道。
   * @type {number}
   * @constant
   */
  RENDER: 0,

  /**
   * 用于选择拾取的通道。
   * @type {number}
   * @constant
   */
  PICK: 1,
};

/**
 * 获取给定通道所需的帧缓冲区类型。
 *
 * @param {Cesium3DTilePass} pass 通道。
 * @returns {number} 帧缓冲区类型。
 *
 * @private
 */
Cesium3DTilePass.getFramebufferType = function (pass) {
  return pass;
};

Object.freeze(Cesium3DTilePass);

export default Cesium3DTilePass;
