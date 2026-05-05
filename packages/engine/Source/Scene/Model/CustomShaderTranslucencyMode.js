// @ts-check

/**
 * 描述 {@link CustomShader} 如何处理与原始图元相比的透明度的枚举。
 *
 * @enum {number}
 *
 * @experimental 此功能使用了 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用策略的情况下更改。
 */
const CustomShaderTranslucencyMode = {
  /**
   * 从图元的材质继承透明度设置。如果图元使用了半透明材质，自定义着色器也将被视为半透明。如果图元使用了不透明材质，自定义着色器将被视为不透明。
   *
   * @type {number}
   * @constant
   */
  INHERIT: 0,
  /**
   * 强制图元渲染为不透明，忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  OPAQUE: 1,
  /**
   * 强制图元渲染为半透明，忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  TRANSLUCENT: 2,
};

Object.freeze(CustomShaderTranslucencyMode);

export default CustomShaderTranslucencyMode;
