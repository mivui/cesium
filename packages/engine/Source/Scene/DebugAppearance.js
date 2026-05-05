import Check from "../Core/Check.js";
import defined from "../Core/defined.js";

/**
 * 用于调试几何体切线空间的 {@link Appearance}。通常用于调试法线贴图问题。
 *
 * @alias DebugAppearance
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {boolean} options.glint 如果为 true，则使用 glint 着色器来调试切线空间。
 *
 * @example
 * const appearance = new Cesium.DebugAppearance({
 *     glint : true
 * });
 * primitive.appearance = appearance;
 */
function DebugAppearance(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  //>>includeEnd('debug');

  this._glint = options.glint ?? false;
}

Object.defineProperties(DebugAppearance.prototype, {
  /**
   * 获取用于渲染此外观的顶点着色源。
   * @memberof DebugAppearance.prototype
   * @type {string}
   * @readonly
   */
  vertexShaderSource: {
    get: function () {
      if (this._glint) {
        return (
          "attribute vec3 position3DHigh;\n" +
          "attribute vec3 position3DLow;\n" +
          "attribute vec3 normal;\n" +
          "attribute vec2 st;\n" +
          "varying vec3 v_normal;\n" +
          "void main() {\n" +
          "    vec4 p = czm_computePosition();\n" +
          "    v_normal = czm_normal * normal;\n" +
          "    gl_Position = czm_modelViewProjectionRelativeToEye * p;\n" +
          "}\n"
        );
      }
      return (
        "attribute vec3 position3DHigh;\n" +
        "attribute vec3 position3DLow;\n" +
        "attribute vec3 normal;\n" +
        "attribute vec2 st;\n" +
        "varying vec3 v_normal;\n" +
        "void main() {\n" +
        "    vec4 p = czm_computePosition();\n" +
        "    v_normal = czm_normal * normal;\n" +
        "    gl_Position = czm_modelViewProjectionRelativeToEye * p;\n" +
        "}\n"
      );
    },
  },

  /**
   * 获取用于渲染此外观的片段着色源。
   * @memberof DebugAppearance.prototype
   * @type {string}
   * @readonly
   */
  fragmentShaderSource: {
    get: function () {
      if (this._glint) {
        return (
          "varying vec3 v_normal;\n" +
          "void main() {\n" +
          "    gl_FragColor = vec4(normalize(v_normal), 1.0);\n" +
          "}\n"
        );
      }
      return (
        "varying vec3 v_normal;\n" +
        "void main() {\n" +
        "    gl_FragColor = vec4(normalize(v_normal), 1.0);\n" +
        "}\n"
      );
    },
  },
});

export default DebugAppearance;
