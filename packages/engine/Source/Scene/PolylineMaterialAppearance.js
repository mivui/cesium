import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import PolylineMaterialAppearanceVS from "../Shaders/Appearances/PolylineMaterialAppearanceVS.js";
import PolylineCommon from "../Shaders/PolylineCommon.js";
import PolylineFS from "../Shaders/PolylineFS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

const defaultVertexShaderSource = `#define CLIP_POLYLINE \n${PolylineCommon}\n${PolylineMaterialAppearanceVS}`;
const defaultFragmentShaderSource = PolylineFS;

/**
 * 用于 {@link PolylineGeometry} 的外观，支持使用材质进行着色。
 *
 * @alias PolylineMaterialAppearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体将呈现半透明效果，此时 {@link PolylineMaterialAppearance#renderState} 会启用 alpha 混合。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源码，用于覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源码，用于覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
 *
 * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
 *
 * @example
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.PolylineGeometry({
 *       positions : Cesium.Cartesian3.fromDegreesArray([
 *         0.0, 0.0,
 *         5.0, 0.0
 *       ]),
 *       width : 10.0,
 *       vertexFormat : Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
 *     })
 *   }),
 *   appearance : new Cesium.PolylineMaterialAppearance({
 *     material : Cesium.Material.fromType('Color')
 *   })
 * });
 */
function PolylineMaterialAppearance(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const translucent = options.translucent ?? true;
  const closed = false;
  const vertexFormat = PolylineMaterialAppearance.VERTEX_FORMAT;

  /**
   * 用于确定片段颜色的材质。与其他 {@link PolylineMaterialAppearance} 属性不同，
   * 此属性不是只读的，因此外观的材质可以随时更改。
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
   * 当 <code>true</code> 时，几何体将呈现半透明效果，此时
   * {@link PolylineMaterialAppearance#renderState} 会启用 alpha 混合。
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

Object.defineProperties(PolylineMaterialAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源码。
   *
   * @memberof PolylineMaterialAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  vertexShaderSource: {
    get: function () {
      let vs = this._vertexShaderSource;
      if (
        this.material.shaderSource.search(/in\s+float\s+v_polylineAngle;/g) !==
        -1
      ) {
        vs = `#define POLYLINE_DASH\n${vs}`;
      }
      return vs;
    },
  },

  /**
   * 片段着色器的 GLSL 源码。
   *
   * @memberof PolylineMaterialAppearance.prototype
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
   * <p>
   * 渲染状态可以在构造 {@link PolylineMaterialAppearance} 实例时显式定义，
   * 也可以通过 {@link PolylineMaterialAppearance#translucent} 和 {@link PolylineMaterialAppearance#closed} 隐式设置。
   * </p>
   *
   * @memberof PolylineMaterialAppearance.prototype
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
   * 当 <code>true</code> 时，几何体被视为闭合，此时
   * {@link PolylineMaterialAppearance#renderState} 会启用背面剔除。
   * 对于 <code>PolylineMaterialAppearance</code>，此值始终为 <code>false</code>。
   *
   * @memberof PolylineMaterialAppearance.prototype
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
   * 几何体可以拥有更多顶点属性但仍保持兼容——但可能会有性能损耗——但不能少于所需的属性。
   *
   * @memberof PolylineMaterialAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link PolylineMaterialAppearance.VERTEX_FORMAT}
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },
});

/**
 * 所有 {@link PolylineMaterialAppearance} 实例兼容的 {@link VertexFormat}。
 * 需要 <code>position</code> 和 <code>st</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PolylineMaterialAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

/**
 * 以编程方式生成完整的 GLSL 片段着色器源码。对于 {@link PolylineMaterialAppearance}，
 * 此源码派生自 {@link PolylineMaterialAppearance#fragmentShaderSource} 和 {@link PolylineMaterialAppearance#material}。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源码。
 */
PolylineMaterialAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PolylineMaterialAppearance#translucent} 和 {@link Material#isTranslucent} 判断几何体是否半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观是半透明的，则返回 <code>true</code>。
 */
PolylineMaterialAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。这不是最终的渲染状态实例；相反，
 * 它可以包含与上下文中创建的渲染状态相同的部分渲染状态属性。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
PolylineMaterialAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PolylineMaterialAppearance;
