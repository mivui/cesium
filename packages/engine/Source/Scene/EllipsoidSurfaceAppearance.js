import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import EllipsoidSurfaceAppearanceFS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceFS.js";
import EllipsoidSurfaceAppearanceVS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceVS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

/**
 * 椭球体表面上的几何体外观，如 {@link PolygonGeometry}
 * 和 {@link RectangleGeometry}，它支持所有材质，如 {@link MaterialAppearance}
 * 替换为 {@link MaterialAppearance.MaterialSupport.ALL}。 但是，此外观需要
 * 由于片段着色器可以程序化地计算<code>法线</code>、
 * <code>tangent</code> 和 <code>bitangent</code> 的 API 请求。
 *
 * @alias EllipsoidSurfaceAppearance
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.flat=false] 如果为 <code>true</code>，则在片段着色器中使用平面着色，这意味着不考虑光照。
 * @param {boolean} [options.faceForward=options.aboveGround] 如果<code>为 true</code>，则片段着色器会根据需要翻转表面法线，以确保法线面向观察者以避免出现黑点。 当几何体的两侧都应该像 {@link WallGeometry} 一样着色时，这非常有用。
 * @param {boolean} [options.translucent=true] 如果<code>为 true</code>，则几何体应显示为半透明，因此 {@link EllipsoidSurfaceAppearance#renderState} 启用了 Alpha 混合。
 * @param {boolean} [options.aboveGround=false] 如果为 <code>true</code>，则几何体应位于椭球体的表面上 - 而不是在其上方的恒定高度 - 因此 {@link EllipsoidSurfaceAppearance#renderState} 启用了背面剔除。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态来覆盖默认的渲染状态。
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const aboveGround = defaultValue(options.aboveGround, false);

  /**
   * 用于确定片段颜色的材料。 与其他 {@link EllipsoidSurfaceAppearance} 不同
   * 属性，这不是只读的，因此外观的材质可以动态更改。
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
   * <code>如果为 true</code>，则几何体应显示为半透明。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = defaultValue(options.translucent, true);

  this._vertexShaderSource = defaultValue(
    options.vertexShaderSource,
    EllipsoidSurfaceAppearanceVS
  );
  this._fragmentShaderSource = defaultValue(
    options.fragmentShaderSource,
    EllipsoidSurfaceAppearanceFS
  );
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    !aboveGround,
    options.renderState
  );
  this._closed = false;

  // Non-derived members

  this._flat = defaultValue(options.flat, false);
  this._faceForward = defaultValue(options.faceForward, aboveGround);
  this._aboveGround = aboveGround;
}

Object.defineProperties(EllipsoidSurfaceAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
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
   * 片段着色器的 GLSL 源代码。 完整的片段着色器
   * source 是按照程序构建的，考虑了 {@link EllipsoidSurfaceAppearance#material}，
   * {@link EllipsoidSurfaceAppearance#flat} 和 {@link EllipsoidSurfaceAppearance#faceForward}。
   * 使用 {@link EllipsoidSurfaceAppearance#getFragmentShaderSource} 获取完整源代码。
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
   * 渲染几何体时使用的 WebGL 固定函数状态。
   * <p>
   * 在构造 {@link EllipsoidSurfaceAppearance} 时，可以显式定义渲染状态
   * 实例，或者通过 {@link EllipsoidSurfaceAppearance#translucent} 隐式设置
   * 和 {@link EllipsoidSurfaceAppearance#aboveGround} 的 SurfaceSurfaceAppearance 中。
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
   * 如果<code>为 true</code>，则几何体应被关闭，因此
   * {@link EllipsoidSurfaceAppearance#renderState} 已启用背面剔除。
   * 如果查看器进入几何图形，则几何图形将不可见。
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
   * 与此外观实例兼容的 {@link VertexFormat}。
   * 几何体可以具有更多顶点属性，并且仍然兼容 - 在
   * 潜在的性能成本 - 但不能更少。
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
   * 如果<code>为 true</code>，则在片段着色器中使用平面着色。
   * 表示未考虑照明。
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
   * 如果<code>为 true</code>，则片段着色器将翻转表面法线
   * 根据需要确保法线面向观看者避免
   * 黑斑。 当几何体的两侧都应该
   * 像 {@link WallGeometry} 一样着色。
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
   * 如果<code>为 true</code>，则几何体应位于椭球体的
   * surface - 不在其上方的恒定高度 - 因此 {@link EllipsoidSurfaceAppearance#renderState}
   * 已启用背面剔除。
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
 * 所有 {@link EllipsoidSurfaceAppearance} 实例的 {@link VertexFormat}
 * 兼容，只需要 <code>POSITION</code> 和 <code>ST</code>
 *属性。 其他属性在片段着色器中按程序计算。
 *
 * @type VertexFormat
 *
 * @constant
 */
EllipsoidSurfaceAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。 对于 {@link EllipsoidSurfaceAppearance}，
 * 这是从 {@link EllipsoidSurfaceAppearance#fragmentShaderSource}、{@link EllipsoidSurfaceAppearance#flat}、
 * 和 {@link EllipsoidSurfaceAppearance#faceForward} 的 SurfaceSurfaceAppearance 中。
 *
 * @function
 *
 * @returns {string} The full GLSL fragment shader source.
 */
EllipsoidSurfaceAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link EllipsoidSurfaceAppearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观为半透明，<code>则为 true</code>。
 */
EllipsoidSurfaceAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。 这不是最终的渲染状态实例;相反
 * 它可以包含与渲染状态相同的渲染状态属性的子集
 * 在上下文中创建。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
EllipsoidSurfaceAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default EllipsoidSurfaceAppearance;
