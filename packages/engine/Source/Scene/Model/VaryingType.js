/**
 * GLSL 变体类型的枚举。这些可用于声明 varyings
 * 在 {@link CustomShader} 中
 *
 * @enum {string}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const VaryingType = {
  /**
   * 单个浮点值。
   *
   * @type {string}
   * @constant
   */
  FLOAT: "float",
  /**
   * 2 个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC2: "vec2",
  /**
   * 3 个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC3: "vec3",
  /**
   * 4 个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC4: "vec4",
  /**
   * 浮点值的 2x2 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT2: "mat2",
  /**
   * 浮点值的 3x3 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT3: "mat2",
  /**
   * 浮点值的 3x3 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT4: "mat4",
};

export default Object.freeze(VaryingType);
