import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Matrix4 from "./Matrix4.js";

/**
 * 几何实例化允许一个 {@link Geometry} 对象位于多个
 * 不同的位置和独特的颜色。 例如，一个 {@link BoxGeometry} 可以
 * 实例化多次，每次实例化都有不同的 <code>modelMatrix</code> 进行更改
 * 它的位置、旋转和缩放。
 *
 * @alias GeometryInstance
 * @constructor
 *
 * @param {object} options 对象，具有以下属性：
 * @param {Geometry|GeometryFactory} options.geometry 要实例的几何体。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 转换以将几何体从模型坐标转换为世界坐标的模型矩阵。
 * @param {object} [options.id] 使用 {@link Scene#pick} 选取实例或使用 {@link Primitive#getGeometryInstanceAttributes} 获取/设置每个实例的属性时返回的用户定义对象。
 * @param {object} [options.attributes] 每个实例的属性，如以下示例中所示的 show 或 color 属性。
 *
 *
 * @example
 * // Create geometry for a box, and two instances that refer to it.
 * // One instance positions the box on the bottom and colored aqua.
 * // The other instance positions the box on the top and color white.
 * const geometry = Cesium.BoxGeometry.fromDimensions({
 *   vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL,
 *   dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
 * });
 * const instanceBottom = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   attributes : {
 *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
 *   },
 *   id : 'bottom'
 * });
 * const instanceTop = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 3000000.0), new Cesium.Matrix4()),
 *   attributes : {
 *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
 *   },
 *   id : 'top'
 * });
 *
 * @see Geometry
 */
function GeometryInstance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.geometry)) {
    throw new DeveloperError("options.geometry is required.");
  }
  //>>includeEnd('debug');

  /**
   * 正在实例化的几何体。
   *
   * @type Geometry
   *
   */
  this.geometry = options.geometry;

  /**
   * 将几何体从模型转换为世界坐标的 4x4 转换矩阵。
   * 当这是单位矩阵时，几何图形在世界坐标中绘制，即地球的 WGS84 坐标。
   * 可以通过提供不同的转换矩阵来使用本地参考帧，就像返回的矩阵一样
   * by {@link Transforms.eastNorthUpToFixedFrame}.
   *
   * @type Matrix4
   *
   * @default Matrix4.IDENTITY
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY)
  );

  /**
   * 选取实例或用于获取/设置每个实例属性时返回的用户定义对象。
   *
   * @type {object|undefined}
   *
   * @default undefined
   *
   * @see Scene#pick
   * @see Primitive#getGeometryInstanceAttributes
   */
  this.id = options.id;

  /**
   * 用于拾取包裹几何体实例的基元。
   *
   * @private
   */
  this.pickPrimitive = options.pickPrimitive;

  /**
   * 每个实例的属性，如 {@link ColorGeometryInstanceAttribute} 或 {@link ShowGeometryInstanceAttribute}。
   * {@link Geometry} 属性因顶点而异;这些属性对于整个实例都是常量。
   *
   * @type {object}
   *
   * @default {}
   */
  this.attributes = defaultValue(options.attributes, {});

  /**
   * @private
   */
  this.westHemisphereGeometry = undefined;
  /**
   * @private
   */
  this.eastHemisphereGeometry = undefined;
}
export default GeometryInstance;
