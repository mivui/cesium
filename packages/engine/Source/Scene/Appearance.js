import clone from "../Core/clone.js";
import combine from "../Core/combine.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import BlendingState from "./BlendingState.js";
import CullFace from "./CullFace.js";

/**
 * 外观定义了完整的GLSL顶点和片段着色器
 * 用于绘制的渲染状态 {@link Primitive}.  所有外观实现
 * 基本这个<code>Appearance</code>接口。
 *
 * @alias Appearance
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.translucent=true] 如果<code>为 true</code>，则几何体应显示为半透明，因此 {@link Appearance#renderState} 启用了 Alpha 混合。
 * @param {boolean} [options.closed=false] 如果<code>为 true</code>，则预计几何体将被关闭，因此 {@link Appearance#renderState} 启用了背面剔除。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态来覆盖默认的渲染状态。
 *
 * @see MaterialAppearance
 * @see EllipsoidSurfaceAppearance
 * @see PerInstanceColorAppearance
 * @see DebugAppearance
 * @see PolylineColorAppearance
 * @see PolylineMaterialAppearance
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Geometry%20and%20Appearances.html|Geometry and Appearances Demo}
 */
function Appearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 用于确定片段颜色的材料。 与其他 {@link 外观} 不同
   * 属性，这不是只读的，因此外观的材质可以动态更改。
   *
   * @type Material
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = options.material;

  /**
   * <code>如果为 true</code>，则几何体应显示为半透明。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = defaultValue(options.translucent, true);

  this._vertexShaderSource = options.vertexShaderSource;
  this._fragmentShaderSource = options.fragmentShaderSource;
  this._renderState = options.renderState;
  this._closed = defaultValue(options.closed, false);
}

Object.defineProperties(Appearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof Appearance.prototype
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
   * source 是按照程序构建的，考虑了 {@link Appearance#material}。
   * 使用 {@link Appearance#getFragmentShaderSource} 获取完整源代码。
   *
   * @memberof Appearance.prototype
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
   * @memberof Appearance.prototype
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
   * @memberof Appearance.prototype
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
});

/**
 * 以程序方式为此外观创建完整的 GLSL 片段着色器源
 * 考虑到 {@link Appearance#fragmentShaderSource} 和 {@link Appearance#material}。
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
Appearance.prototype.getFragmentShaderSource = function () {
  const parts = [];
  if (this.flat) {
    parts.push("#define FLAT");
  }
  if (this.faceForward) {
    parts.push("#define FACE_FORWARD");
  }
  if (defined(this.material)) {
    parts.push(this.material.shaderSource);
  }
  parts.push(this.fragmentShaderSource);

  return parts.join("\n");
};

/**
 * 根据 {@link Appearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否为半透明。
 *
 * @returns {boolean} <code>true</code>，如果外观是半透明的。
 */
Appearance.prototype.isTranslucent = function () {
  return (
    (defined(this.material) && this.material.isTranslucent()) ||
    (!defined(this.material) && this.translucent)
  );
};

/**
 * 创建渲染状态。 这不是最终的渲染状态实例;相反
 * 它可以包含与渲染状态相同的渲染状态属性的子集
 * 在上下文中创建。
 *
 * @returns {object} 渲染状态。
 */
Appearance.prototype.getRenderState = function () {
  const translucent = this.isTranslucent();
  const rs = clone(this.renderState, false);
  if (translucent) {
    rs.depthMask = false;
    rs.blending = BlendingState.ALPHA_BLEND;
  } else {
    rs.depthMask = true;
  }
  return rs;
};

/**
 * @private
 */
Appearance.getDefaultRenderState = function (translucent, closed, existing) {
  let rs = {
    depthTest: {
      enabled: true,
    },
  };

  if (translucent) {
    rs.depthMask = false;
    rs.blending = BlendingState.ALPHA_BLEND;
  }

  if (closed) {
    rs.cull = {
      enabled: true,
      face: CullFace.BACK,
    };
  }

  if (defined(existing)) {
    rs = combine(existing, rs, true);
  }

  return rs;
};
export default Appearance;
