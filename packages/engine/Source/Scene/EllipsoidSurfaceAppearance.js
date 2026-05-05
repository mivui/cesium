import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import EllipsoidSurfaceAppearanceFS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceFS.js";
import EllipsoidSurfaceAppearanceVS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceVS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

/**
 * 用于椭球表面几何（如 {@link PolygonGeometry} 和 {@link RectangleGeometry}）的外观，支持所有 {@link MaterialAppearance} 搭配 {@link MaterialAppearance.MaterialSupport.ALL} 的材质。但由于片段着色器可过程化计算 <code>normal</code>、<code>tangent</code> 和 <code>bitangent</code>，此外观所需的顶点属性更少。
 *
 * @alias EllipsoidSurfaceAppearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.flat=false] 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照。
 * @param {boolean} [options.faceForward=options.aboveGround] 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。这在需要为几何体的双面着色（如 {@link WallGeometry}）时非常有用。
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期为半透明，因此 {@link EllipsoidSurfaceAppearance#renderState} 会启用 alpha 混合。
 * @param {boolean} [options.aboveGround=false] 当 <code>true</code> 时，几何体预期位于椭球表面（而非恒定高度上方），因此 {@link EllipsoidSurfaceAppearance#renderState} 会启用背面剔除。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选 GLSL 顶点着色器源码，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选 GLSL 片段着色器源码，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选渲染状态，用于覆盖默认渲染状态。
 *
 * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
 *
 * @example
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.PolygonGeometry({
 *       vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
 *       // ...
 *     })
 *   }),
 *   appearance : new Cesium.EllipsoidSurfaceAppearance({
 *     material : Cesium.Material.fromType('Stripe')
 *   })
 * });
 */
function EllipsoidSurfaceAppearance(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const translucent = options.translucent ?? true;
  const aboveGround = options.aboveGround ?? false;

  /**
   * 用于确定片段颜色的材质。与其他 {@link EllipsoidSurfaceAppearance} 属性不同，此属性不是只读的，因此外观的材质可以随时更改。
   *
   * @type Material
   *
   * @default {@link Material.ColorType}
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = defined(options.material)
    ? options.material
    : Material.fromType(Material.ColorType);

  /**
   * 当 <code>true</code> 时，几何体预期为半透明。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = options.translucent ?? true;

  this._vertexShaderSource =
    options.vertexShaderSource ?? EllipsoidSurfaceAppearanceVS;
  this._fragmentShaderSource =
    options.fragmentShaderSource ?? EllipsoidSurfaceAppearanceFS;
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    !aboveGround,
    options.renderState,
  );
  this._closed = false;

  // Non-derived members

  this._flat = options.flat ?? false;
  this._faceForward = options.faceForward ?? aboveGround;
  this._aboveGround = aboveGround;
}

Object.defineProperties(EllipsoidSurfaceAppearance.prototype, {
  /**
   * 顶点着色器的GLSL源代码。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 片段着色器的GLSL源代码。完整的片段着色器源码是根据 {@link EllipsoidSurfaceAppearance#material}、{@link EllipsoidSurfaceAppearance#flat} 和 {@link EllipsoidSurfaceAppearance#faceForward} 过程化构建的。使用 {@link EllipsoidSurfaceAppearance#getFragmentShaderSource} 获取完整源码。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 渲染几何体时使用的WebGL固定功能状态。
   * <p>
   * 渲染状态可以在构造 {@link EllipsoidSurfaceAppearance} 实例时显式定义，或通过 {@link EllipsoidSurfaceAppearance#translucent} 和 {@link EllipsoidSurfaceAppearance#aboveGround} 隐式设置。
   * </p>
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 当 <code>true</code> 时，几何体预期为闭合的，因此 {@link EllipsoidSurfaceAppearance#renderState} 会启用背面剔除。如果观察者进入几何体内部，它将不可见。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 此外观实例兼容的 {@link VertexFormat}。几何体可以拥有更多顶点属性且仍保持兼容（但可能会有性能开销），但不能少于所需属性。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link EllipsoidSurfaceAppearance.VERTEX_FORMAT}
   */
  vertexFormat: {
    get: function () {
      return EllipsoidSurfaceAppearance.VERTEX_FORMAT;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  flat: {
    get: function () {
      return this._flat;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。这在需要为几何体的双面着色（如 {@link WallGeometry}）时非常有用。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  faceForward: {
    get: function () {
      return this._faceForward;
    },
  },

  /**
   * 当 <code>true</code> 时，几何体预期位于椭球表面（而非恒定高度上方），因此 {@link EllipsoidSurfaceAppearance#renderState} 会启用背面剔除。
   *
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  aboveGround: {
    get: function () {
      return this._aboveGround;
    },
  },
});

/**
 * 所有 {@link EllipsoidSurfaceAppearance} 实例兼容的 {@link VertexFormat}，仅需要 <code>position</code> 和 <code>st</code> 属性。其他属性会在片段着色器中过程化计算。
 *
 * @type VertexFormat
 *
 * @constant
 */
EllipsoidSurfaceAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

/**
 * Procedurally creates the full GLSL fragment shader source.  For {@link EllipsoidSurfaceAppearance},
 * this is derived from {@link EllipsoidSurfaceAppearance#fragmentShaderSource}, {@link EllipsoidSurfaceAppearance#flat},
 * and {@link EllipsoidSurfaceAppearance#faceForward}.
 *
 * @function
 *
 * @returns {string} The full GLSL fragment shader source.
 */
EllipsoidSurfaceAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * Determines if the geometry is translucent based on {@link EllipsoidSurfaceAppearance#translucent} and {@link Material#isTranslucent}.
 *
 * @function
 *
 * @returns {boolean} <code>true</code> if the appearance is translucent.
 */
EllipsoidSurfaceAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * Creates a render state.  This is not the final render state instance; instead,
 * it can contain a subset of render state properties identical to the render state
 * created in the context.
 *
 * @function
 *
 * @returns {object} The render state.
 */
EllipsoidSurfaceAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default EllipsoidSurfaceAppearance;
