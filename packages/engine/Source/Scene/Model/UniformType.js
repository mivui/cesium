// @ts-check

/**
 * 基本 GLSL uniform 类型的枚举。这些可与
 * {@link CustomShader} 一起使用来声明用户自定义的 uniform。
 *
 * @enum {string}
 *
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
const UniformType = {
  /**
   * 单个浮点数值。
   *
   * @type {string}
   * @constant
   */
  FLOAT: "float",
  /**
   * 包含2个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC2: "vec2",
  /**
   * 包含3个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC3: "vec3",
  /**
   * 包含4个浮点值的向量。
   *
   * @type {string}
   * @constant
   */
  VEC4: "vec4",
  /**
   * 单个整数值。
   *
   * @type {string}
   * @constant
   */
  INT: "int",
  /**
   * 包含2个整数值的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC2: "ivec2",
  /**
   * 包含3个整数值的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC3: "ivec3",
  /**
   * 包含4个整数值的向量。
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
   * 包含2个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC2: "bvec2",
  /**
   * 包含3个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC3: "bvec3",
  /**
   * 包含4个布尔值的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC4: "bvec4",
  /**
   * 2x2 浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT2: "mat2",
  /**
   * 3x3 浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT3: "mat3",
  /**
   * 4x4 浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT4: "mat4",
  /**
   * 2D采样纹理。
   * @type {string}
   * @constant
   */
  SAMPLER_2D: "sampler2D",
  SAMPLER_CUBE: "samplerCube",
};

Object.freeze(UniformType);

export default UniformType;
