import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 每个实例几何体属性的值和类型信息。
 *
 * @alias GeometryInstanceAttribute
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {ComponentDatatype} options.componentDatatype 属性中每个组件的数据类型，例如value中的单个元素。
 * @param {number} options.componentsPerAttribute 定义属性中组件数量的1到4之间的数字。
 * @param {boolean} [options.normalize=false] 当<code>true</code>且<code>componentDatatype</code>为整数格式时，表示在作为浮点数访问以进行渲染时，组件应映射到范围[0, 1]（无符号）或[-1, 1]（有符号）。
 * @param {number[]} options.value 属性的值。
 *
 * @exception {DeveloperError} options.componentsPerAttribute必须在1到4之间。
 *
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : Cesium.BoxGeometry.fromDimensions({
 *     dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
 *   }),
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(0.0, 0.0)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   id : 'box',
 *   attributes : {
 *     color : new Cesium.GeometryInstanceAttribute({
 *       componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
 *       componentsPerAttribute : 4,
 *       normalize : true,
 *       value : [255, 255, 0, 255]
 *     })
 *   }
 * });
 *
 * @see ColorGeometryInstanceAttribute
 * @see ShowGeometryInstanceAttribute
 * @see DistanceDisplayConditionGeometryInstanceAttribute
 */
function GeometryInstanceAttribute(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.componentDatatype)) {
    throw new DeveloperError("options.componentDatatype is required.");
  }
  if (!defined(options.componentsPerAttribute)) {
    throw new DeveloperError("options.componentsPerAttribute is required.");
  }
  if (
    options.componentsPerAttribute < 1 ||
    options.componentsPerAttribute > 4
  ) {
    throw new DeveloperError(
      "options.componentsPerAttribute must be between 1 and 4.",
    );
  }
  if (!defined(options.value)) {
    throw new DeveloperError("options.value is required.");
  }
  //>>includeEnd('debug');

  /**
   * 属性中每个组件的数据类型，例如
   * {@link GeometryInstanceAttribute#value}中的单个元素。
   *
   * @type ComponentDatatype
   *
   */
  this.componentDatatype = options.componentDatatype;

  /**
   * 定义属性中组件数量的1到4之间的数字。
   * 例如，具有x、y和z组件的位置属性将具有3，如
   * 代码示例所示。
   *
   * @type {number}
   *
   * @example
   * show : new Cesium.GeometryInstanceAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
   *   componentsPerAttribute : 1,
   *   normalize : true,
   *   value : [1.0]
   * })
   */
  this.componentsPerAttribute = options.componentsPerAttribute;

  /**
   * 当<code>true</code>且<code>componentDatatype</code>为整数格式时，
   * 表示在作为浮点数访问以进行渲染时，组件应映射到范围[0, 1]（无符号）
   * 或[-1, 1]（有符号）。
   * <p>
   * 使用{@link ComponentDatatype.UNSIGNED_BYTE}存储颜色时通常使用此属性。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   *
   * @example
   * attribute.componentDatatype = Cesium.ComponentDatatype.UNSIGNED_BYTE;
   * attribute.componentsPerAttribute = 4;
   * attribute.normalize = true;
   * attribute.value = [
   *   Cesium.Color.floatToByte(color.red),
   *   Cesium.Color.floatToByte(color.green),
   *   Cesium.Color.floatToByte(color.blue),
   *   Cesium.Color.floatToByte(color.alpha)
   * ];
   */
  this.normalize = options.normalize ?? false;

  /**
   * 存储在类型化数组中的属性值。在代码示例中，
   * 由于<code>componentsPerAttribute</code>为3，所以<code>values</code>中的每三个元素定义一个属性。
   *
   * @type {number[]}
   *
   * @example
   * show : new Cesium.GeometryInstanceAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
   *   componentsPerAttribute : 1,
   *   normalize : true,
   *   value : [1.0]
   * })
   */
  this.value = options.value;
}
export default GeometryInstanceAttribute;
