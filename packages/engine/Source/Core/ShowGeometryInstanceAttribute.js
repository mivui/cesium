import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 每个实例几何图形属性的值和类型信息，用于确定是否显示几何图形实例。
 *
 * @alias ShowGeometryInstanceAttribute
 * @constructor
 *
 * @param {boolean} [show=true] 确定是否显示几何实例。
 *
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.BoxGeometry({
 *     vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL,
 *     minimum : new Cesium.Cartesian3(-250000.0, -250000.0, -250000.0),
 *     maximum : new Cesium.Cartesian3(250000.0, 250000.0, 250000.0)
 *   }),
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   id : 'box',
 *   attributes : {
 *     show : new Cesium.ShowGeometryInstanceAttribute(false)
 *   }
 * });
 *
 * @see GeometryInstance
 * @see GeometryInstanceAttribute
 */
function ShowGeometryInstanceAttribute(show) {
  show = defaultValue(show, true);

  /**
   * 存储在类型化数组中的属性的值。
   *
   * @type Uint8Array
   *
   * @default [1.0]
   */
  this.value = ShowGeometryInstanceAttribute.toValue(show);
}

Object.defineProperties(ShowGeometryInstanceAttribute.prototype, {
  /**
   * 属性中每个组件的数据类型，例如，其中的单个元素
   * {@link ColorGeometryInstanceAttribute#value}.
   *
   * @memberof ShowGeometryInstanceAttribute.prototype
   *
   * @type {ComponentDatatype}
   * @readonly
   *
   * @default {@link ComponentDatatype.UNSIGNED_BYTE}
   */
  componentDatatype: {
    get: function () {
      return ComponentDatatype.UNSIGNED_BYTE;
    },
  },

  /**
   * 属性中的组件数，即 {@link ColorGeometryInstanceAttribute#value}。
   *
   * @memberof ShowGeometryInstanceAttribute.prototype
   *
   * @type {number}
   * @readonly
   *
   * @default 1
   */
  componentsPerAttribute: {
    get: function () {
      return 1;
    },
  },

  /**
   * 当 <code>true</code> 且 <code>componentDatatype</code> 为整数格式时，
   * 表示组件应映射到范围 [0， 1]（无符号）
   * 或 [-1， 1]（带符号）当它们作为浮点进行访问以进行渲染时。
   *
   * @memberof ShowGeometryInstanceAttribute.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  normalize: {
    get: function () {
      return false;
    },
  },
});

/**
 * 将布尔值 show 转换为可用于分配 show 属性的类型化数组。
 *
 * @param {boolean} show 显示值。
 * @param {Uint8Array} [result] 用于存储结果的数组，如果未定义，将创建一个新实例。
 * @returns {Uint8Array} 修改后的结果参数或者如果 result 未定义，则为新实例。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true, attributes.show);
 */
ShowGeometryInstanceAttribute.toValue = function (show, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(show)) {
    throw new DeveloperError("show is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Uint8Array([show]);
  }
  result[0] = show;
  return result;
};
export default ShowGeometryInstanceAttribute;
