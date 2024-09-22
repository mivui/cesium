/**
 * 描述如何将 {@link CustomShader} 添加到
 * 片段着色器。这决定了着色器如何与材质交互。
 *
 * @enum {string}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const CustomShaderMode = {
  /**
   * 自定义着色器将用于修改材质阶段的结果
   * 在应用照明之前。
   *
   * @type {string}
   * @constant
   */
  MODIFY_MATERIAL: "MODIFY_MATERIAL",
  /**
   * 将使用自定义着色器而不是材质阶段。这是一个提示
   * 优化材质处理代码。
   *
   * @type {string}
   * @constant
   */
  REPLACE_MATERIAL: "REPLACE_MATERIAL",
};

/**
 * 将着色器模式转换为大写标识符，以便在 GLSL 定义中使用
 *指令。例如：<code>#define CUSTOM_SHADER_MODIFY_MATERIAL</code>
 * @param {CustomShaderMode} customShaderMode 着色器模式
 * @return {string} 要使用的 GLSL 宏的名称
 *
 * @private
 */
CustomShaderMode.getDefineName = function (customShaderMode) {
  return `CUSTOM_SHADER_${customShaderMode}`;
};

export default Object.freeze(CustomShaderMode);
