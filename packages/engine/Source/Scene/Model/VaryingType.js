// @ts-check

/**
 * GLSL varying 类型的枚举。这些可用于在 {@link CustomShader} 中声明 varying 变量
 *
 * @enum {string}
 *
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
const VaryingType = {
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
};

Object.freeze(VaryingType);

export default VaryingType;
