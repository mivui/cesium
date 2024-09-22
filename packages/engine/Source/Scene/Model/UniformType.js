/**
 * 基本 GLSL uniform 类型的枚举。这些可与
 * {@link CustomShader} 来声明用户定义的 uniform。
 *
 * @enum {string}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const UniformType = {
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
   * 单个整数值
   *
   * @type {string}
   * @constant
   */
  INT: "int",
  /**
   * 一个 2 个整数值的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC2: "ivec2",
  /**
   * 3 个整数值的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC3: "ivec3",
  /**
   * 4 个整数值的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC4: "ivec4",
  /**
   * 单个布尔值。
   *
   * @type {string}
   * @constant
   */
  BOOL: "bool",
  /**
   * 包含 2 个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC2: "bvec2",
  /**
   * 包含 3 个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC3: "bvec3",
  /**
   * 4 个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC4: "bvec4",
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
  MAT3: "mat3",
  /**
   * 浮点值的 3x3 矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT4: "mat4",
  /**
   * 2D 采样纹理。
   * @type {string}
   * @constant
   */
  SAMPLER_2D: "sampler2D",
  SAMPLER_CUBE: "samplerCube",
};

export default Object.freeze(UniformType);
