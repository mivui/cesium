/**
 * 描述 {@link CustomShader} 如何添加到片段着色器的枚举。
 * 这决定了着色器如何与材质交互。
 *
 * @enum {string}
 *
 * @experimental 此功能使用了 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用策略的情况下更改。
 */
const CustomShaderMode = {
  /**
   * 自定义着色器将用于在应用光照之前修改材质阶段的结果。
   *
   * @type {string}
   * @constant
   */
  MODIFY_MATERIAL: "MODIFY_MATERIAL",
  /**
   * 自定义着色器将替代材质阶段使用。这是一个用于优化掉材质处理代码的提示。
   *
   * @type {string}
   * @constant
   */
  REPLACE_MATERIAL: "REPLACE_MATERIAL",
};

/**
 * Convert the shader mode to an uppercase identifier for use in GLSL define
 * directives. For example:  <code>#define CUSTOM_SHADER_MODIFY_MATERIAL</code>
 * @param {CustomShaderMode} customShaderMode The shader mode
 * @return {string} The name of the GLSL macro to use
 *
 * @private
 */
CustomShaderMode.getDefineName = function (customShaderMode) {
  return `CUSTOM_SHADER_${customShaderMode}`;
};

Object.freeze(CustomShaderMode);

export default CustomShaderMode;
