// @ts-check

/**
 * 用于 {@link Model} 光照的光照模型。
 *
 * @enum {number}
 *
 * @experimental 此功能使用了尚未最终确定的 3D Tiles 规范部分，可能会在不遵循 Cesium 标准弃用策略的情况下发生变更。
 */
const LightingModel = {
  /**
   * 使用无光照着色，即跳过光照计算。模型的
   * 漫反射颜色（假定为线性 RGB，而非 sRGB）在计算 <code>out_FragColor</code> 时
   * 直接使用。Alpha 模式仍然会应用。
   *
   * @type {number}
   * @constant
   */
  UNLIT: 0,
  /**
   * 使用基于物理的渲染光照计算。这包括
   * PBR 金属粗糙度和 PBR 高光光泽度。在可能的情况下
   * 也会应用基于图像的光照。
   *
   * @type {number}
   * @constant
   */
  PBR: 1,
};

Object.freeze(LightingModel);

export default LightingModel;
