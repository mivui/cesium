/**
 * 一个枚举，用于控制 {@link CustomShader} 如何处理与原始
 *原始。
 *
 * @enum {number}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const CustomShaderTranslucencyMode = {
  /**
   * 从基本体的材质继承半透明设置。如果原语使用了
   * Translucent 材质，则自定义着色器也将被视为 Translucent。如果 primitive
   * 使用了不透明材质，则自定义着色器将被视为不透明。
   *
   * @type {number}
   * @constant
   */
  INHERIT: 0,
  /**
   * 强制基元将基元渲染为不透明，忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  OPAQUE: 1,
  /**
   * 强制基元将基元渲染为半透明，忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  TRANSLUCENT: 2,
};

export default Object.freeze(CustomShaderTranslucencyMode);
