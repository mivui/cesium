import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Matrix4 from "./Matrix4.js";

/**
 * 几何实例化允许一个 {@link Geometry} 对象在多个不同位置定位并着色。
 * 例如，一个 {@link BoxGeometry} 可以被实例化多次，每次使用不同的 <code>modelMatrix</code> 来改变其位置、旋转和缩放。
 *
 * @alias GeometryInstance
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Geometry|GeometryFactory} options.geometry 要实例化的几何体。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标转换到世界坐标的模型矩阵。
 * @param {object} [options.id] 用户定义的对象，当使用 {@link Scene#pick} 拾取实例或使用 {@link Primitive#getGeometryInstanceAttributes} 获取/设置每个实例的属性时返回。
 * @param {object} [options.attributes] 每个实例的属性，如下例所示的颜色或显示属性。
 *
 *
 * @example
 * // 为盒子创建几何体，以及两个引用它的实例。
 * // 一个实例将盒子定位在底部并着色为水色。
 * // 另一个实例将盒子定位在顶部并着色为白色。
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
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.geometry)) {
    throw new DeveloperError("options.geometry is required.");
  }
  //>>includeEnd('debug');

  /**
   * 正在被实例化的几何体。
   *
   * @type Geometry
   *
   */
  this.geometry = options.geometry;

  /**
   * 将几何体从模型坐标转换到世界坐标的4x4变换矩阵。
   * 当这是单位矩阵时，几何体在世界坐标（即地球的WGS84坐标）中绘制。
   * 可以通过提供不同的变换矩阵（如 {@link Transforms.eastNorthUpToFixedFrame} 返回的矩阵）来使用局部参考系。
   *
   * @type Matrix4
   *
   * @default Matrix4.IDENTITY
   */
  this.modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);

  /**
   * 拾取实例或用于获取/设置每个实例的属性时返回的用户定义对象。
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
   * 用于拾取包装几何体实例的图元。
   *
   * @private
   */
  this.pickPrimitive = options.pickPrimitive;

  /**
   * 每个实例的属性，如 {@link ColorGeometryInstanceAttribute} 或 {@link ShowGeometryInstanceAttribute}。
   * {@link Geometry} 属性随顶点变化；这些属性对于整个实例是常数。
   *
   * @type {object}
   *
   * @default {}
   */
  this.attributes = options.attributes ?? {};

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
