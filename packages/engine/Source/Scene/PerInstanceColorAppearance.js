import defaultValue from "../Core/defaultValue.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceColorAppearanceFS from "../Shaders/Appearances/PerInstanceColorAppearanceFS.js";
import PerInstanceColorAppearanceVS from "../Shaders/Appearances/PerInstanceColorAppearanceVS.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PerInstanceFlatColorAppearanceVS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceVS.js";
import Appearance from "./Appearance.js";

/**
 * 具有颜色属性的 {@link GeometryInstance} 实例的外观。
 * 这允许多个几何体实例（每个实例具有不同的颜色）执行以下操作
 * 使用相同的 {@link Primitive} 绘制，如下面的第二个示例所示。
 *
 * @alias PerInstanceColorAppearance
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.flat=false] 如果为 <code>true</code>，则在片段着色器中使用平面着色，这意味着不考虑光照。
 * @param {boolean} [options.faceForward=!options.closed] 如果<code>为 true</code>，则片段着色器会根据需要翻转表面法线，以确保法线面向观察者以避免出现暗点。 当几何体的两侧都应该像 {@link WallGeometry} 一样着色时，这非常有用。
 * @param {boolean} [options.translucent=true] 如果<code>为 true</code>，则几何体应显示为半透明，因此 {@link PerInstanceColorAppearance#renderState} 启用了 Alpha 混合。
 * @param {boolean} [options.closed=false] 如果<code>为 true</code>，则预计几何体将被关闭，因此 {@link PerInstanceColorAppearance#renderState} 启用了背面剔除。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态来覆盖默认的渲染状态。
 *
 * @example
 * // A solid white line segment
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.SimplePolylineGeometry({
 *       positions : Cesium.Cartesian3.fromDegreesArray([
 *         0.0, 0.0,
 *         5.0, 0.0
 *       ])
 *     }),
 *     attributes : {
 *       color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
 *     }
 *   }),
 *   appearance : new Cesium.PerInstanceColorAppearance({
 *     flat : true,
 *     translucent : false
 *   })
 * });
 *
 * // Two rectangles in a primitive, each with a different color
 * const instance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0)
 *   }),
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 0.5)
 *   }
 * });
 *
 * const anotherInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(0.0, 40.0, 10.0, 50.0)
 *   }),
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
 *   }
 * });
 *
 * const rectanglePrimitive = new Cesium.Primitive({
 *   geometryInstances : [instance, anotherInstance],
 *   appearance : new Cesium.PerInstanceColorAppearance()
 * });
 */
function PerInstanceColorAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = defaultValue(options.closed, false);
  const flat = defaultValue(options.flat, false);
  const vs = flat
    ? PerInstanceFlatColorAppearanceVS
    : PerInstanceColorAppearanceVS;
  const fs = flat
    ? PerInstanceFlatColorAppearanceFS
    : PerInstanceColorAppearanceFS;
  const vertexFormat = flat
    ? PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
    : PerInstanceColorAppearance.VERTEX_FORMAT;

  /**
   * 此属性是 {@link Appearance} 接口的一部分，但不是
   * 由 {@link PerInstanceColorAppearance} 使用，因为使用了完全自定义的片段着色器。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * 如果<code>为 true</code>，则几何体应显示为半透明，因此
   * {@link PerInstanceColorAppearance#renderState} 已启用 Alpha 混合。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = translucent;

  this._vertexShaderSource = defaultValue(options.vertexShaderSource, vs);
  this._fragmentShaderSource = defaultValue(options.fragmentShaderSource, fs);
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._vertexFormat = vertexFormat;
  this._flat = flat;
  this._faceForward = defaultValue(options.faceForward, !closed);
}

Object.defineProperties(PerInstanceColorAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * @memberof PerInstanceColorAppearance.prototype
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
   * 在构造 {@link PerInstanceColorAppearance} 时，可以显式定义渲染状态
   * 实例，或者通过 {@link PerInstanceColorAppearance#translucent} 隐式设置
   * and {@link PerInstanceColorAppearance#closed}.
   * </p>
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * {@link PerInstanceColorAppearance#renderState} 已启用背面剔除。
   * 如果查看器进入几何图形，则几何图形将不可见。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * @memberof PerInstanceColorAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },

  /**
   * 如果<code>为 true</code>，则在片段着色器中使用平面着色。
   * 表示未考虑照明。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * @memberof PerInstanceColorAppearance.prototype
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
});

/**
 * 所有 {@link PerInstanceColorAppearance} 实例的 {@link VertexFormat}
 * 兼容。 这只需要 <code>position</code> 和 <code>normal</code>
 *属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PerInstanceColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_NORMAL;

/**
 * 所有 {@link PerInstanceColorAppearance} 实例的 {@link VertexFormat}
 * 与 {@link PerInstanceColorAppearance#flat} 为 <code>true</code> 时兼容。
 * 这只需要 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PerInstanceColorAppearance.FLAT_VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。 对于 {@link PerInstanceColorAppearance}，
 * 这是从 {@link PerInstanceColorAppearance#fragmentShaderSource}、{@link PerInstanceColorAppearance#flat}、
 * 和 {@link PerInstanceColorAppearance#faceForward} 进行转换。
 *
 * @function
 *
 * @returns {string} The full GLSL fragment shader source.
 */
PerInstanceColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PerInstanceColorAppearance#translucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code>，如果外观是半透明的。
 */
PerInstanceColorAppearance.prototype.isTranslucent =
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
PerInstanceColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PerInstanceColorAppearance;
