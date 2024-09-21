import defaultValue from "./defaultValue.js";

/**
 * 属性，构成几何体的顶点。 此对象中的每个属性都对应于一个
 * {@link GeometryAttribute} 包含属性的数据。
 * <p>
 * 属性始终以非交错方式存储在 Geometry 中。
 * </p>
 *
 * @alias GeometryAttributes
 * @constructor
 */
function GeometryAttributes(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 3D 位置属性。
   * <p>
   * 64 位浮点（用于精度）。 每个属性 3 个组件。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.position = options.position;

  /**
   * 法线属性（规格化），通常用于照明。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.normal = options.normal;

  /**
   * 2D 纹理坐标属性。
   * <p>
   * 32 位浮点。 每个属性 2 个组件
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.st = options.st;

  /**
   * 双切线属性（规格化），用于凹凸贴图等切线空间效果。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.bitangent = options.bitangent;

  /**
   * 切线属性（规格化），用于凹凸贴图等切线空间效果。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.tangent = options.tangent;

  /**
   * color 属性。
   * <p>
   * 8 位无符号整数。每个属性 4 个组件。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.color = options.color;
}
export default GeometryAttributes;
