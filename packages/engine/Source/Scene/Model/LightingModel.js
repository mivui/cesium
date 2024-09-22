/**
 * 用于照亮 {@link Model} 的照明模型。
 *
 * @enum {number}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const LightingModel = {
  /**
   * 使用无光照着色，即跳过光照计算。模型的
   * 直接使用漫射颜色（假设为线性 RGB，而不是 sRGB）
   * 计算 <code>out_FragColor</code> 时。Alpha 模式仍然是
   *应用的。
   *
   * @type {number}
   * @constant
   */
  UNLIT: 0,
  /**
   * 使用基于物理的渲染照明计算。这包括
   * PBR 金属粗糙度和 PBR 镜面反射光泽度。基于图像
   * 如果可能，也会应用照明。
   *
   * @type {number}
   * @constant
   */
  PBR: 1,
};

export default Object.freeze(LightingModel);
