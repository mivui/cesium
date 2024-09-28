import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import VertexFormat from "../Core/VertexFormat.js";
import PolylineMaterialAppearanceVS from "../Shaders/Appearances/PolylineMaterialAppearanceVS.js";
import PolylineCommon from "../Shaders/PolylineCommon.js";
import PolylineFS from "../Shaders/PolylineFS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

let defaultVertexShaderSource = `${PolylineCommon}\n${PolylineMaterialAppearanceVS}`;
const defaultFragmentShaderSource = PolylineFS;

if (!FeatureDetection.isInternetExplorer()) {
  defaultVertexShaderSource = `#define CLIP_POLYLINE \n${defaultVertexShaderSource}`;
}

/**
 * {@link PolylineGeometry} 的外观，支持使用材质进行着色。
 *
 * @alias PolylineMaterialAppearance
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.translucent=true] 如果<code>为 true</code>，则几何体应显示为半透明，因此 {@link PolylineMaterialAppearance#renderState} 启用了 Alpha 混合。
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = false;
  const vertexFormat = PolylineMaterialAppearance.VERTEX_FORMAT;

  /**
   * 用于确定片段颜色的材料。 与其他 {@link PolylineMater 不同ialAppearance}
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
   * 如果<code>为 true</code>，则几何体应显示为半透明，因此
   * {@link PolylineMaterialAppearance#renderState} 已启用 Alpha 混合。
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

Object.defineProperties(PolylineMaterialAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
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
   * 片段着色器的 GLSL 源代码。
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
   * 渲染几何体时使用的 WebGL 固定函数状态。
   * <p>
   * 在构造 {@link PolylineMaterialAppearance} 时，可以显式定义渲染状态
   * 实例，或者通过 {@link PolylineMaterialAppearance#translucent} 隐式设置
   * 和 {@link PolylineMaterialAppearance#closed} 的 Package。
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
   * 如果<code>为 true</code>，则几何体应被关闭，因此
   * {@link PolylineMaterialAppearance#renderState} 启用了背面剔除。
   * 对于 <code>PolylineMaterialAppearance</code>，此参数始终为 <code>false</code>。
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
   * 与此外观实例兼容的 {@link VertexFormat}。
   * 几何体可以具有更多顶点属性，并且仍然兼容 - 在
   * 潜在的性能成本 - 但不能更少。
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
 * 所有 {@link PolylineMaterialAppearance} 实例的 {@link VertexFormat}
 * 兼容。这需要 <code>position</code> 和 <code>st</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PolylineMaterialAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。 对于 {@link PolylineMaterialAppearance}，
 * 此数据源自 {@link PolylineMaterialAppearance#fragmentShaderSource} 和 {@link PolylineMaterialAppearance#material}。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
PolylineMaterialAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PolylineMaterialAppearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code>，如果外观是半透明的。
 */
PolylineMaterialAppearance.prototype.isTranslucent =
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
PolylineMaterialAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PolylineMaterialAppearance;
