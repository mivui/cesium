import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import AllMaterialAppearanceFS from "../Shaders/Appearances/AllMaterialAppearanceFS.js";
import AllMaterialAppearanceVS from "../Shaders/Appearances/AllMaterialAppearanceVS.js";
import BasicMaterialAppearanceFS from "../Shaders/Appearances/BasicMaterialAppearanceFS.js";
import BasicMaterialAppearanceVS from "../Shaders/Appearances/BasicMaterialAppearanceVS.js";
import TexturedMaterialAppearanceFS from "../Shaders/Appearances/TexturedMaterialAppearanceFS.js";
import TexturedMaterialAppearanceVS from "../Shaders/Appearances/TexturedMaterialAppearanceVS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

    /**
     * 一种用于任意几何体的外观（例如，与 {@link EllipsoidSurfaceAppearance} 不同），支持使用材质进行着色。
     *
     * @alias MaterialAppearance
     * @constructor
     *
     * @param {object} [options] 包含以下属性的对象：
     * @param {boolean} [options.flat=false] 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照。
     * @param {boolean} [options.faceForward=!options.closed] 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。当几何体的两侧都需要着色（如 {@link WallGeometry}）时，此属性非常有用。
     * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期为半透明，因此 {@link MaterialAppearance#renderState} 会启用 alpha 混合。
     * @param {boolean} [options.closed=false] 当 <code>true</code> 时，几何体预期为闭合的，因此 {@link MaterialAppearance#renderState} 会启用背面剔除。
     * @param {MaterialAppearance.MaterialSupportType} [options.materialSupport=MaterialAppearance.MaterialSupport.TEXTURED] 支持的材质类型。
     * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
     * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源码，用于覆盖默认顶点着色器。
     * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源码，用于覆盖默认片段着色器。
     * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
     *
     * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
     * @demo {@link https://sandcastle.cesium.com/index.html?id=materials|Cesium Sandcastle Material Appearance Demo}
     *
     * @example
     * const primitive = new Cesium.Primitive({
     *   geometryInstances : new Cesium.GeometryInstance({
     *     geometry : new Cesium.WallGeometry({
             materialSupport :  Cesium.MaterialAppearance.MaterialSupport.BASIC.vertexFormat,
     *       // ...
     *     })
     *   }),
     *   appearance : new Cesium.MaterialAppearance({
     *     material : Cesium.Material.fromType('Color'),
     *     faceForward : true
     *   })
     *
     * });
     */
function MaterialAppearance(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const translucent = options.translucent ?? true;
  const closed = options.closed ?? false;
  const materialSupport =
    options.materialSupport ?? MaterialAppearance.MaterialSupport.TEXTURED;

    /**
     * 用于确定片段颜色的材质。与 {@link MaterialAppearance} 的其他属性不同，此属性不是只读的，因此外观的材质可以动态更改。
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
  this.translucent = translucent;

  this._vertexShaderSource =
    options.vertexShaderSource ?? materialSupport.vertexShaderSource;
  this._fragmentShaderSource =
    options.fragmentShaderSource ?? materialSupport.fragmentShaderSource;
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._materialSupport = materialSupport;
  this._vertexFormat = materialSupport.vertexFormat;
  this._flat = options.flat ?? false;
  this._faceForward = options.faceForward ?? !closed;
}

Object.defineProperties(MaterialAppearance.prototype, {
  /**
   * 顶点着色器的GLSL源代码。
   *
   * @memberof MaterialAppearance.prototype
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
   * 片段着色器的GLSL源代码。完整的片段着色器源码是根据 {@link MaterialAppearance#material}、
   * {@link MaterialAppearance#flat} 和 {@link MaterialAppearance#faceForward} 程序化构建的。
   * 使用 {@link MaterialAppearance#getFragmentShaderSource} 获取完整源码。
   *
   * @memberof MaterialAppearance.prototype
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
   * 渲染状态可以在构造 {@link MaterialAppearance} 实例时显式定义，也可以通过
   * {@link MaterialAppearance#translucent} 和 {@link MaterialAppearance#closed} 隐式设置。
   * </p>
   *
   * @memberof MaterialAppearance.prototype
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
   * 当 <code>true</code> 时，几何体预期为闭合的，因此 {@link MaterialAppearance#renderState} 会启用背面剔除。
   * 如果观察者进入几何体内部，将无法看到它。
   *
   * @memberof MaterialAppearance.prototype
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
   * 此实例支持的材质类型。这会影响所需的 {@link VertexFormat} 以及顶点和片段着色器的复杂度。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @readonly
   *
   * @default {@link MaterialAppearance.MaterialSupport.TEXTURED}
   */
  materialSupport: {
    get: function () {
      return this._materialSupport;
    },
  },

  /**
   * 此外观实例兼容的 {@link VertexFormat}。几何体可以拥有更多顶点属性并仍然保持兼容（但可能会有性能损耗），但不能少于所需的属性。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat}
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器使用平面着色，即不考虑光照。
   *
   * @memberof MaterialAppearance.prototype
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
   * 当 <code>true</code> 时，片段着色器会按需翻转表面法线，确保法线朝向观察者以避免暗斑。
   * 当几何体的两侧都需要着色（如 {@link WallGeometry}）时，此属性非常有用。
   *
   * @memberof MaterialAppearance.prototype
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
 * 程序化创建完整的GLSL片段着色器源码。对于 {@link MaterialAppearance}，
 * 这是从 {@link MaterialAppearance#fragmentShaderSource}、{@link MaterialAppearance#material}、
 * {@link MaterialAppearance#flat} 和 {@link MaterialAppearance#faceForward} 派生而来的。
 *
 * @function
 *
 * @returns {string} 完整的GLSL片段着色器源码。
 */
MaterialAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link MaterialAppearance#translucent} 和 {@link Material#isTranslucent} 判断几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观是半透明的，则返回 <code>true</code>。
 */
MaterialAppearance.prototype.isTranslucent = Appearance.prototype.isTranslucent;

/**
 * 创建一个渲染状态。这不是最终的渲染状态实例，而是可以包含与上下文中创建的渲染状态相同的渲染状态属性的子集。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */
MaterialAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;

/**
 * @typedef MaterialAppearance.MaterialSupportType
 * @type {object}
 * @property {VertexFormat} vertexFormat
 * @property {string} vertexShaderSource
 * @property {string} fragmentShaderSource
 */

/**
 * 确定 {@link MaterialAppearance} 实例支持的 {@link Material} 类型。这是在灵活性（广泛的材质选择）与内存/性能（所需的顶点格式和GLSL着色器复杂度）之间的权衡。
 * @namespace
 */
MaterialAppearance.MaterialSupport = {
  /**
   * 仅支持基础材质，仅需 <code>position</code> 和 <code>normal</code> 顶点属性。
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */
  BASIC: Object.freeze({
    vertexFormat: VertexFormat.POSITION_AND_NORMAL,
    vertexShaderSource: BasicMaterialAppearanceVS,
    fragmentShaderSource: BasicMaterialAppearanceFS,
  }),
  /**
   * Materials with textures, which require <code>position</code>,
   * <code>normal</code>, and <code>st</code> vertex attributes,
   * are supported.  The vast majority of materials fall into this category.
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */
  TEXTURED: Object.freeze({
    vertexFormat: VertexFormat.POSITION_NORMAL_AND_ST,
    vertexShaderSource: TexturedMaterialAppearanceVS,
    fragmentShaderSource: TexturedMaterialAppearanceFS,
  }),
  /**
   * All materials, including those that work in tangent space, are supported.
   * This requires <code>position</code>, <code>normal</code>, <code>st</code>,
   * <code>tangent</code>, and <code>bitangent</code> vertex attributes.
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */
  ALL: Object.freeze({
    vertexFormat: VertexFormat.ALL,
    vertexShaderSource: AllMaterialAppearanceVS,
    fragmentShaderSource: AllMaterialAppearanceFS,
  }),
};
export default MaterialAppearance;
