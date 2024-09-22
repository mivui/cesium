import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 用于确定几何实例偏移的每实例几何属性的值和类型信息
 *
 * @alias OffsetGeometryInstanceAttribute
 * @constructor
 *
 * @param {number} [x=0] The x translation
 * @param {number} [y=0] The y translation
 * @param {number} [z=0] The z translation
 *
 * @private
 *
 * @see GeometryInstance
 * @see GeometryInstanceAttribute
 */
function OffsetGeometryInstanceAttribute(x, y, z) {
  x = defaultValue(x, 0);
  y = defaultValue(y, 0);
  z = defaultValue(z, 0);

  /**
   * 存储在类型化数组中的属性的值。
   *
   * @type Float32Array
   */
  this.value = new Float32Array([x, y, z]);
}

Object.defineProperties(OffsetGeometryInstanceAttribute.prototype, {
  /**
   * 属性中每个组件的数据类型，例如，其中的单个元素
   * {@link OffsetGeometryInstanceAttribute#value}.
   *
   * @memberof OffsetGeometryInstanceAttribute.prototype
   *
   * @type {ComponentDatatype}
   * @readonly
   *
   * @default {@link ComponentDatatype.FLOAT}
   */
  componentDatatype: {
    get: function () {
      return ComponentDatatype.FLOAT;
    },
  },

  /**
   * 属性中的组件数，即 {@link OffsetGeometryInstanceAttribute#value}。
   *
   * @memberof OffsetGeometryInstanceAttribute.prototype
   *
   * @type {number}
   * @readonly
   *
   * @default 3
   */
  componentsPerAttribute: {
    get: function () {
      return 3;
    },
  },

  /**
   * 当 <code>true</code> 且 <code>componentDatatype</code> 为整数格式时，
   * 表示组件应映射到范围 [0， 1]（无符号）
   * 或 [-1， 1]（带符号）当它们作为浮点进行访问以进行渲染时。
   *
   * @memberof OffsetGeometryInstanceAttribute.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  normalize: {
    get: function () {
      return false;
    },
  },
});

/**
 * 在给定提供的已启用标志和 {@link DistanceDisplayCondition} 的情况下，创建新的 {@link OffsetGeometryInstanceAttribute} 实例。
 *
 * @param {Cartesian3} offset 笛卡尔偏移量
 * @returns {OffsetGeometryInstanceAttribute} 新的 {@link OffsetGeometryInstanceAttribute} 实例。
 */
OffsetGeometryInstanceAttribute.fromCartesian3 = function (offset) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("offset", offset);
  //>>includeEnd('debug');

  return new OffsetGeometryInstanceAttribute(offset.x, offset.y, offset.z);
};

/**
 * 将距离显示条件转换为可用于分配距离显示条件属性的类型化数组。
 *
 * @param {Cartesian3} offset 笛卡尔偏移量
 * @param {Float32Array} [result] 用于存储结果的数组，如果未定义，将创建一个新实例。
 * @returns {Float32Array} 修改后的结果参数或新实例（如果 result 未定义）。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.modelMatrix = Cesium.OffsetGeometryInstanceAttribute.toValue(modelMatrix, attributes.modelMatrix);
 */
OffsetGeometryInstanceAttribute.toValue = function (offset, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("offset", offset);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Float32Array([offset.x, offset.y, offset.z]);
  }

  result[0] = offset.x;
  result[1] = offset.y;
  result[2] = offset.z;
  return result;
};
export default OffsetGeometryInstanceAttribute;
