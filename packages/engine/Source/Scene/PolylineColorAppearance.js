import Frozen from "../Core/Frozen.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PolylineColorAppearanceVS from "../Shaders/Appearances/PolylineColorAppearanceVS.js";
import PolylineCommon from "../Shaders/PolylineCommon.js";
import Appearance from "./Appearance.js";

const defaultVertexShaderSource = `#define CLIP_POLYLINE \n${PolylineCommon}\n${PolylineColorAppearanceVS}`;
const defaultFragmentShaderSource = PerInstanceFlatColorAppearanceFS;

/**
 * 用于具有颜色属性的 {@link GeometryInstance} 实例以及 {@link PolylineGeometry} 或 {@link GroundPolylineGeometry} 的外观。
 * 这允许使用同一个 {@link Primitive} 绘制多个具有不同颜色的几何实例。
 *
 * @alias PolylineColorAppearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何图形将呈现半透明效果，因此 {@link PolylineColorAppearance#renderState} 会启用 alpha 混合。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源码，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源码，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
 *
 * @example
 * // 一条纯白色线段
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.PolylineGeometry({
 *       positions : Cesium.Cartesian3.fromDegreesArray([
 *         0.0, 0.0,
 *         5.0, 0.0
 *       ]),
 *       width : 10.0,
 *       vertexFormat : Cesium.PolylineColorAppearance.VERTEX_FORMAT
 *     }),
 *     attributes : {
 *       color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
 *     }
 *   }),
 *   appearance : new Cesium.PolylineColorAppearance({
 *     translucent : false
 *   })
 * });
 */
function PolylineColorAppearance(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const translucent = options.translucent ?? true;
  const closed = false;
  const vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;

  /**
   * 此属性是 {@link Appearance} 接口的一部分，但由于使用了完全自定义的片段着色器，
   * {@link PolylineColorAppearance} 不会使用它。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * 当 <code>true</code> 时，几何图形将呈现半透明效果，因此
   * {@link PolylineColorAppearance#renderState} 会启用 alpha 混合。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = translucent;

  this._vertexShaderSource =
    options.vertexShaderSource ?? defaultVertexShaderSource;
  this._fragmentShaderSource =
    options.fragmentShaderSource ?? defaultFragmentShaderSource;
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._vertexFormat = vertexFormat;
}

Object.defineProperties(PolylineColorAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源码。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 片段着色器的 GLSL 源码。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 渲染几何图形时使用的 WebGL 固定功能状态。
   * <p>
   * 渲染状态可以在构造 {@link PolylineColorAppearance} 实例时显式定义，
   * 也可以通过 {@link PolylineColorAppearance#translucent} 隐式设置。
   * </p>
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 当 <code>true</code> 时，几何图形将被认为是闭合的，因此
   * {@link PolylineColorAppearance#renderState} 会启用背面剔除。
   * 对于 <code>PolylineColorAppearance</code>，此属性始终为 <code>false</code>。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 此外观实例兼容的 {@link VertexFormat}。
   * 几何图形可以拥有更多顶点属性并仍然保持兼容（但可能会产生性能开销），
   * 但不能拥有更少的顶点属性。
   *
   * @memberof PolylineColorAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link PolylineColorAppearance.VERTEX_FORMAT}
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },
});

/**
 * 所有 {@link PolylineColorAppearance} 实例兼容的 {@link VertexFormat}。
 * 仅需 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PolylineColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 以编程方式创建完整的 GLSL 片段着色器源码。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源码。
 */
PolylineColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PolylineColorAppearance#translucent} 判断几何图形是否半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观是半透明的则返回 <code>true</code>。
 */
PolylineColorAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。这不是最终的渲染状态实例，而是包含与上下文中创建的
 * 渲染状态相同的部分渲染状态属性。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
PolylineColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PolylineColorAppearance;
