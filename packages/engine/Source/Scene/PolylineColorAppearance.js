import defaultValue from "../Core/defaultValue.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PolylineColorAppearanceVS from "../Shaders/Appearances/PolylineColorAppearanceVS.js";
import PolylineCommon from "../Shaders/PolylineCommon.js";
import Appearance from "./Appearance.js";

let defaultVertexShaderSource = `${PolylineCommon}\n${PolylineColorAppearanceVS}`;
const defaultFragmentShaderSource = PerInstanceFlatColorAppearanceFS;

if (!FeatureDetection.isInternetExplorer()) {
  defaultVertexShaderSource = `#define CLIP_POLYLINE \n${defaultVertexShaderSource}`;
}

/**
 * 具有颜色属性的 {@link GeometryInstance} 实例的外观，以及
 * {@link PolylineGeometry} 或 {@link GroundPolylineGeometry}。
 * 这允许多个几何体实例（每个实例具有不同的颜色）执行以下操作
 * 使用相同的 {@link Primitive} 绘制。
 *
 * @alias PolylineColorAppearance
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.translucent=true] 如果<code>为 true</code>，则几何体应显示为半透明，因此 {@link PolylineColorAppearance#renderState} 启用了 Alpha 混合。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态来覆盖默认的渲染状态。
 *
 * @example
 * // A solid white line segment
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = false;
  const vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;

  /**
   * 此属性是 {@link Appearance} 接口的一部分，但不是
   * 由 {@link PolylineColorAppearance} 使用，因为使用了完全自定义的片段着色器。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * 如果<code>为 true</code>，则几何体应显示为半透明，因此
   * {@link PolylineColorAppearance#renderState} 已启用 Alpha 混合。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = translucent;

  this._vertexShaderSource = defaultValue(
    options.vertexShaderSource,
    defaultVertexShaderSource,
  );
  this._fragmentShaderSource = defaultValue(
    options.fragmentShaderSource,
    defaultFragmentShaderSource,
  );
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
   * 顶点着色器的 GLSL 源代码。
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
   * 片段着色器的 GLSL 源代码。
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
   * 渲染几何体时使用的 WebGL 固定函数状态。
   * <p>
   * 在构造 {@link PolylineColorAppearance} 时，可以显式定义渲染状态
   * 实例，或者通过 {@link PolylineColorAppearance#translucent} 隐式设置。
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
   * 如果<code>为 true</code>，则几何体应被关闭，因此
   * {@link PolylineColorAppearance#renderState} 已启用背面剔除。
   * 对于 <code>PolylineColorAppearance</code>，此参数始终为 <code>false</code>。
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
   * 与此外观实例兼容的 {@link VertexFormat}。
   * 几何体可以具有更多顶点属性，并且仍然兼容 - 在
   * 潜在的性能成本 - 但不能更少。
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
 * 所有 {@link PolylineColorAppearance} 实例的 {@link VertexFormat}
 * 兼容。这只需要 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PolylineColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
PolylineColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PolylineColorAppearance#translucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观为半透明，<code>则为 true</code>。
 */
PolylineColorAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。 这不是最终的渲染状态实例;相反
 * 它可以包含与渲染状态相同的渲染状态属性的子集
 * 在上下文中创建。
 *
 * @function
 *
 * @returns {object} render 状态。
 */
PolylineColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PolylineColorAppearance;
