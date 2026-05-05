import clone from "../Core/clone.js";
import combine from "../Core/combine.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import BlendingState from "./BlendingState.js";
import CullFace from "./CullFace.js";

/**
 * 外观（Appearance）定义了完整的 GLSL 顶点和片段着色器以及用于绘制 {@link Primitive} 的渲染状态。所有外观都实现此基础 <code>Appearance</code> 接口。
 *
 * @alias Appearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.translucent=true] 当为 <code>true</code> 时，几何体预计表现为半透明，因此 {@link Appearance#renderState} 会启用 alpha 混合。
 * @param {boolean} [options.closed=false] 当为 <code>true</code> 时，几何体预计是封闭的，因此 {@link Appearance#renderState} 会启用背面剔除。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源代码，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源代码，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
 *
 * @see MaterialAppearance
 * @see EllipsoidSurfaceAppearance
 * @see PerInstanceColorAppearance
 * @see DebugAppearance
 * @see PolylineColorAppearance
 * @see PolylineMaterialAppearance
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=geometry-and-appearances|Geometry and Appearances Demo}
 */
function Appearance(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

   /**
    * 用于确定片段颜色的材质。与其他 {@link Appearance} 属性不同，此属性不是只读的，因此外观的材质可以动态变化。
    *
    * @type Material
    *
    * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
    */
  this.material = options.material;

   /**
    * 当为 <code>true</code> 时，几何体预计表现为半透明。
    *
    * @type {boolean}
    *
    * @default true
    */
  this.translucent = options.translucent ?? true;

  this._vertexShaderSource = options.vertexShaderSource;
  this._fragmentShaderSource = options.fragmentShaderSource;
  this._renderState = options.renderState;
  this._closed = options.closed ?? false;
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
   * 片段着色器的 GLSL 源代码。完整的片段着色器源代码是通过考虑 {@link Appearance#material} 以程序化方式构建的。使用 {@link Appearance#getFragmentShaderSource} 获取完整的源代码。
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
   * 渲染几何体时使用的 WebGL 固定功能状态。
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
   * 当为 <code>true</code> 时，几何体预计是封闭的。
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
 * 通过考虑 {@link Appearance#fragmentShaderSource} 和 {@link Appearance#material}，为此外观程序化地创建完整的 GLSL 片段着色器源代码。
 *
 * @returns {string} 完整的 GLSL 片段着色器源代码。
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
 * 根据 {@link Appearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否半透明。
 *
 * @returns {boolean} 如果外观是半透明的，则返回 <code>true</code>。
 */
Appearance.prototype.isTranslucent = function () {
  return (
    (defined(this.material) && this.material.isTranslucent()) ||
    (!defined(this.material) && this.translucent)
  );
};

/**
 * 创建渲染状态。这不是最终的渲染状态实例；相反，它可以包含与在上下文中创建的渲染状态相同的渲染状态属性子集。
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
