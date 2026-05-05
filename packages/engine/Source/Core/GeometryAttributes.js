import Frozen from "./Frozen.js";

/**
 * 构成几何体顶点的属性。此对象中的每个属性对应于一个
 * {@link GeometryAttribute}，包含该属性的数据。
 * <p>
 * 在几何体中，属性始终以非交错方式存储。
 * </p>
 *
 * @alias GeometryAttributes
 * @constructor
 */
function GeometryAttributes(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  /**
   * 3D位置属性。
   * <p>
   * 64位浮点数（用于精度）。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.position = options.position;

  /**
   * 法线属性（归一化），通常用于光照。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.normal = options.normal;

  /**
   * 2D纹理坐标属性。
   * <p>
   * 32位浮点数。每个属性2个分量
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.st = options.st;

  /**
   * 副切线属性（归一化），用于切线空间效果，如凹凸贴图。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.bitangent = options.bitangent;

  /**
   * 切线属性（归一化），用于切线空间效果，如凹凸贴图。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.tangent = options.tangent;

  /**
   * 颜色属性。
   * <p>
   * 8位无符号整数。每个属性4个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.color = options.color;
}
export default GeometryAttributes;
