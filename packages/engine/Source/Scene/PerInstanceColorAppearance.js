import Frozen from "../Core/Frozen.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceColorAppearanceFS from "../Shaders/Appearances/PerInstanceColorAppearanceFS.js";
import PerInstanceColorAppearanceVS from "../Shaders/Appearances/PerInstanceColorAppearanceVS.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PerInstanceFlatColorAppearanceVS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceVS.js";
import Appearance from "./Appearance.js";

/**
 * 用于带有颜色属性的 {@link GeometryInstance} 实例的外观。
 * 这允许将多个具有不同颜色的几何体实例与同一个 {@link Primitive} 一起绘制，如下方第二个示例所示。
 *
 * @alias PerInstanceColorAppearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.flat=false] 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照影响。
 * @param {boolean} [options.faceForward=!options.closed] 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。当几何体需要双面着色（如 {@link WallGeometry}）时，此属性非常有用。
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期为半透明，因此 {@link PerInstanceColorAppearance#renderState} 会启用 alpha 混合。
 * @param {boolean} [options.closed=false] 当 <code>true</code> 时，几何体预期为闭合的，因此 {@link PerInstanceColorAppearance#renderState} 会启用背面剔除。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源代码，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源代码，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
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
  options = options ?? Frozen.EMPTY_OBJECT;

  const translucent = options.translucent ?? true;
  const closed = options.closed ?? false;
  const flat = options.flat ?? false;
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
 * 该属性是 {@link Appearance} 接口的一部分，但由于 {@link PerInstanceColorAppearance} 使用了完全自定义的片段着色器，因此未被使用。
 *
 * @type Material
 *
 * @default undefined
 */
  this.material = undefined;

/**
 * 当 <code>true</code> 时，几何体预期为半透明，因此 {@link PerInstanceColorAppearance#renderState} 会启用 alpha 混合。
 *
 * @type {boolean}
 *
 * @default true
 */
  this.translucent = translucent;

  this._vertexShaderSource = options.vertexShaderSource ?? vs;
  this._fragmentShaderSource = options.fragmentShaderSource ?? fs;
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._vertexFormat = vertexFormat;
  this._flat = flat;
  this._faceForward = options.faceForward ?? !closed;
}

Object.defineProperties(PerInstanceColorAppearance.prototype, {
  /**
   * 顶点着色器的GLSL源代码。
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
   * 片段着色器的GLSL源代码。
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
   * 渲染几何体时使用的WebGL固定功能状态。
   * <p>
   * 渲染状态可以在构造 {@link PerInstanceColorAppearance} 实例时显式定义，也可以通过 {@link PerInstanceColorAppearance#translucent} 和 {@link PerInstanceColorAppearance#closed} 隐式设置。
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
   * 当 <code>true</code> 时，几何体预期为闭合的，因此 {@link PerInstanceColorAppearance#renderState} 会启用背面剔除。
   * 如果观察者进入几何体内部，它将不可见。
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
   * 此外观实例兼容的 {@link VertexFormat}。
   * 几何体可以拥有更多顶点属性但仍保持兼容（可能会有性能损耗），但不能少于所需属性。
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
   * 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照影响。
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
   * 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。当几何体需要双面着色（如 {@link WallGeometry}）时，此属性非常有用。
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
 * 所有 {@link PerInstanceColorAppearance} 实例兼容的 {@link VertexFormat}。仅需要 <code>position</code> 和 <code>normal</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PerInstanceColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_NORMAL;

/**
 * 当 {@link PerInstanceColorAppearance#flat} 为 <code>true</code> 时，所有 {@link PerInstanceColorAppearance} 实例兼容的 {@link VertexFormat}。仅需要 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PerInstanceColorAppearance.FLAT_VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 程序化生成完整的GLSL片段着色器源代码。对于 {@link PerInstanceColorAppearance}，
 * 源代码派生自 {@link PerInstanceColorAppearance#fragmentShaderSource}、{@link PerInstanceColorAppearance#flat}
 * 和 {@link PerInstanceColorAppearance#faceForward}。
 *
 * @function
 *
 * @returns {string} 完整的GLSL片段着色器源代码。
 */
PerInstanceColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PerInstanceColorAppearance#translucent} 判断几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观是半透明的，则返回 <code>true</code>。
 */
PerInstanceColorAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。这不是最终的渲染状态实例；相反，
 * 它可以包含与上下文中创建的渲染状态相同的子集属性。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
PerInstanceColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PerInstanceColorAppearance;
