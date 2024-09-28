import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 几何属性的值和类型信息。 {@link Geometry}
 * 通常包含一个或多个属性。 所有属性一起形成
 * 几何体的顶点。
 *
 * @alias GeometryAttribute
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {ComponentDatatype} options.componentDatatype 属性中每个组件的数据类型，例如，值中的单个元素。
 * @param {number} options.componentsPerAttribute 一个介于 1 和 4 之间的数字，用于定义属性中的组件数量。
 * @param {boolean} [options.normalize=false] 当 <code>true</code> 且 <code>componentDatatype</code> 为整数格式时，指示当组件作为浮点访问以进行渲染时，应将组件映射到范围 [0， 1] （无符号） 或 [-1， 1] （有符号）。
 * @param {number[]|Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} options.values 存储在类型化数组中的属性的值。
 *
 * @exception {DeveloperError} options.componentsPerAttribute must be between 1 and 4.
 *
 *
 * @example
 * const geometry = new Cesium.Geometry({
 *   attributes : {
 *     position : new Cesium.GeometryAttribute({
 *       componentDatatype : Cesium.ComponentDatatype.FLOAT,
 *       componentsPerAttribute : 3,
 *       values : new Float32Array([
 *         0.0, 0.0, 0.0,
 *         7500000.0, 0.0, 0.0,
 *         0.0, 7500000.0, 0.0
 *       ])
 *     })
 *   },
 *   primitiveType : Cesium.PrimitiveType.LINE_LOOP
 * });
 *
 * @see Geometry
 */
function GeometryAttribute(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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
  if (!defined(options.values)) {
    throw new DeveloperError("options.values is required.");
  }
  //>>includeEnd('debug');

  /**
   * 属性中每个组件的数据类型，例如，其中的单个元素
   * {@link GeometryAttribute#values}.
   *
   * @type {ComponentDatatype}
   *
   */
  this.componentDatatype = options.componentDatatype;

  /**
   * 一个介于 1 和 4 之间的数字，用于定义属性中的组件数。
   * 例如，具有 x、y 和 z 分量的 position 属性将具有 3 作为
   * 如代码示例所示。
   *
   * @type {number}
   *
   * @example
   * attribute.componentDatatype = Cesium.ComponentDatatype.FLOAT;
   * attribute.componentsPerAttribute = 3;
   * attribute.values = new Float32Array([
   *   0.0, 0.0, 0.0,
   *   7500000.0, 0.0, 0.0,
   *   0.0, 7500000.0, 0.0
   * ]);
   */
  this.componentsPerAttribute = options.componentsPerAttribute;

  /**
   * 当 <code>true</code> 且 <code>componentDatatype</code> 为整数格式时，
   * 表示组件应映射到范围 [0， 1]（无符号）
   * 或 [-1， 1]（带符号）当它们作为浮点进行访问以进行渲染时。
   * <p>
   * 这在使用 {@link ComponentDatatype.UNSIGNED_BYTE} 存储颜色时常用。
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
   * attribute.values = new Uint8Array([
   *   Cesium.Color.floatToByte(color.red),
   *   Cesium.Color.floatToByte(color.green),
   *   Cesium.Color.floatToByte(color.blue),
   *   Cesium.Color.floatToByte(color.alpha)
   * ]);
   */
  this.normalize = defaultValue(options.normalize, false);

  /**
   * 存储在类型化数组中的属性的值。 在代码示例中，
   * <code>values</code> 中的每 3 个元素定义一个属性，因为
   * <code>componentsPerAttribute</code> 为 3。
   *
   * @type {number[]|Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array}
   *
   * @example
   * attribute.componentDatatype = Cesium.ComponentDatatype.FLOAT;
   * attribute.componentsPerAttribute = 3;
   * attribute.values = new Float32Array([
   *   0.0, 0.0, 0.0,
   *   7500000.0, 0.0, 0.0,
   *   0.0, 7500000.0, 0.0
   * ]);
   */
  this.values = options.values;
}
export default GeometryAttribute;
