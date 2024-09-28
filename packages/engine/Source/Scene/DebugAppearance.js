import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Appearance from "./Appearance.js";

/**
 * 通过将顶点属性显示为用于调试的颜色来可视化顶点属性。
 * <p>
 * 已知单位长度向量的分量，即<code>法向</code>向量、
 * <code>切线</code>和<code>双切线</code>是缩放和偏置的
 * 从[-1.0, 1.0] to (-1.0, 1.0).
 * </p>
 *
 * @alias DebugAppearance
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.attributeName 要可视化的属性的名称。
 * @param {boolean} [options.perInstanceAttribute=false] 确定此属性是否为每个实例的几何属性的布尔值。
 * @param {string} [options.glslDatatype='vec3'] 属性的 GLSL 数据类型。 支持的数据类型包括 <code>float</code>、<code>vec2</code>、<code>vec3</code> 和 <code>vec4</code>。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态来覆盖默认的渲染状态。
 *
 * @exception {DeveloperError} options.glslDatatype must be float, vec2, vec3, or vec4.
 *
 * @example
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : // ...
 *   appearance : new Cesium.DebugAppearance({
 *     attributeName : 'normal'
 *   })
 * });
 */
function DebugAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const attributeName = options.attributeName;
  let perInstanceAttribute = options.perInstanceAttribute;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(attributeName)) {
    throw new DeveloperError("options.attributeName is required.");
  }
  //>>includeEnd('debug');

  if (!defined(perInstanceAttribute)) {
    perInstanceAttribute = false;
  }

  let glslDatatype = defaultValue(options.glslDatatype, "vec3");
  const varyingName = `v_${attributeName}`;
  let getColor;

  // Well-known normalized vector attributes in VertexFormat
  if (
    attributeName === "normal" ||
    attributeName === "tangent" ||
    attributeName === "bitangent"
  ) {
    getColor = `vec4 getColor() { return vec4((${varyingName} + vec3(1.0)) * 0.5, 1.0); }\n`;
  } else {
    // All other attributes, both well-known and custom
    if (attributeName === "st") {
      glslDatatype = "vec2";
    }

    switch (glslDatatype) {
      case "float":
        getColor = `vec4 getColor() { return vec4(vec3(${varyingName}), 1.0); }\n`;
        break;
      case "vec2":
        getColor = `vec4 getColor() { return vec4(${varyingName}, 0.0, 1.0); }\n`;
        break;
      case "vec3":
        getColor = `vec4 getColor() { return vec4(${varyingName}, 1.0); }\n`;
        break;
      case "vec4":
        getColor = `vec4 getColor() { return ${varyingName}; }\n`;
        break;
      //>>includeStart('debug', pragmas.debug);
      default:
        throw new DeveloperError(
          "options.glslDatatype must be float, vec2, vec3, or vec4.",
        );
      //>>includeEnd('debug');
    }
  }

  const vs =
    `${
      "in vec3 position3DHigh;\n" +
      "in vec3 position3DLow;\n" +
      "in float batchId;\n"
    }${
      perInstanceAttribute ? "" : `in ${glslDatatype} ${attributeName};\n`
    }out ${glslDatatype} ${varyingName};\n` +
    `void main()\n` +
    `{\n` +
    `vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);\n${
      perInstanceAttribute
        ? `${varyingName} = czm_batchTable_${attributeName}(batchId);\n`
        : `${varyingName} = ${attributeName};\n`
    }gl_Position = czm_modelViewProjectionRelativeToEye * p;\n` +
    `}`;
  const fs =
    `in ${glslDatatype} ${varyingName};\n${getColor}\n` +
    `void main()\n` +
    `{\n` +
    `out_FragColor = getColor();\n` +
    `}`;

  /**
   * 此属性是 {@link Appearance} 接口的一部分，但不是
   * 由 {@link DebugAppearance} 使用，因为使用的是完全自定义的片段着色器。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * <code>如果为 true</code>，则几何体应显示为半透明。
   *
   * @type {boolean}
   *
   * @default false
   */
  this.translucent = defaultValue(options.translucent, false);

  this._vertexShaderSource = defaultValue(options.vertexShaderSource, vs);
  this._fragmentShaderSource = defaultValue(options.fragmentShaderSource, fs);
  this._renderState = Appearance.getDefaultRenderState(
    false,
    false,
    options.renderState,
  );
  this._closed = defaultValue(options.closed, false);

  // Non-derived members

  this._attributeName = attributeName;
  this._glslDatatype = glslDatatype;
}

Object.defineProperties(DebugAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  vertexShaderSource: {
    get: function () {
      return this._vertexShaderSource;
    },
  },

  /**
   * 片段着色器的 GLSL 源代码。 完整的片段着色器
   * source 是按照程序构建的，考虑了 {@link DebugAppearance#material}。
   * 使用 {@link DebugAppearance#getFragmentShaderSource} 获取完整源代码。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  fragmentShaderSource: {
    get: function () {
      return this._fragmentShaderSource;
    },
  },

  /**
   * 渲染几何体时使用的 WebGL 固定函数状态。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {object}
   * @readonly
   */
  renderState: {
    get: function () {
      return this._renderState;
    },
  },

  /**
   * 如果<code>为 true</code>，则几何图形应为闭合。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  closed: {
    get: function () {
      return this._closed;
    },
  },

  /**
   * 正在可视化的属性的名称。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  attributeName: {
    get: function () {
      return this._attributeName;
    },
  },

  /**
   * 正在可视化的属性的 GLSL 数据类型。
   *
   * @memberof DebugAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  glslDatatype: {
    get: function () {
      return this._glslDatatype;
    },
  },
});

/**
 * 返回完整的 GLSL 片段着色器源，对于 {@link DebugAppearance}，它只是
 * {@link DebugAppearance#fragmentShaderSource}.
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
DebugAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link DebugAppearance#translucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code>，如果外观是半透明的。
 */
DebugAppearance.prototype.isTranslucent = Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。 这不是最终的渲染状态实例;相反
 * 它可以包含与渲染状态相同的渲染状态属性的子集
 * 在上下文中创建。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
DebugAppearance.prototype.getRenderState = Appearance.prototype.getRenderState;
export default DebugAppearance;
