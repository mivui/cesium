import Color from "./Color.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 每个实例几何体颜色的值和类型信息。
 *
 * @alias ColorGeometryInstanceAttribute
 * @constructor
 *
 * @param {number} [red=1.0] 红色分量。
 * @param {number} [green=1.0] 绿色分量。
 * @param {number} [blue=1.0] 蓝色分量。
 * @param {number} [alpha=1.0] alpha 分量。
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
 *     color : new Cesium.ColorGeometryInstanceAttribute(red, green, blue, alpha)
 *   }
 * });
 *
 * @see GeometryInstance
 * @see GeometryInstanceAttribute
 */
function ColorGeometryInstanceAttribute(red, green, blue, alpha) {
  red = defaultValue(red, 1.0);
  green = defaultValue(green, 1.0);
  blue = defaultValue(blue, 1.0);
  alpha = defaultValue(alpha, 1.0);

  /**
   * 存储在类型化数组中的属性的值。
   *
   * @type Uint8Array
   *
   * @default [255, 255, 255, 255]
   */
  this.value = new Uint8Array([
    Color.floatToByte(red),
    Color.floatToByte(green),
    Color.floatToByte(blue),
    Color.floatToByte(alpha),
  ]);
}

Object.defineProperties(ColorGeometryInstanceAttribute.prototype, {
  /**
   * 属性中每个组件的数据类型，例如，其中的单个元素
   * {@link ColorGeometryInstanceAttribute#value}.
   *
   * @memberof ColorGeometryInstanceAttribute.prototype
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
   * 属性中的组件数量，即, {@link ColorGeometryInstanceAttribute#value}.
   *
   * @memberof ColorGeometryInstanceAttribute.prototype
   *
   * @type {number}
   * @readonly
   *
   * @default 4
   */
  componentsPerAttribute: {
    get: function () {
      return 4;
    },
  },

  /**
   * 当 <code>true</code> 且 <code>componentDatatype</code> 为整数格式时，
   * 表示组件应映射到范围 [0， 1]（无符号）
   * 或 [-1， 1]（带符号）当它们作为浮点进行访问以进行渲染时。
   *
   * @memberof ColorGeometryInstanceAttribute.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  normalize: {
    get: function () {
      return true;
    },
  },
});

/**
 * 在给定提供的 {@link Color} 的情况下创建新的 {@link ColorGeometryInstanceAttribute} 实例。
 *
 * @param {Color} color 颜色。
 * @returns {ColorGeometryInstanceAttribute} 新的 {@link ColorGeometryInstanceAttribute} 实例。
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   attributes : {
 *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CORNFLOWERBLUE),
 *   }
 * });
 */
ColorGeometryInstanceAttribute.fromColor = function (color) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(color)) {
    throw new DeveloperError("color is required.");
  }
  //>>includeEnd('debug');

  return new ColorGeometryInstanceAttribute(
    color.red,
    color.green,
    color.blue,
    color.alpha
  );
};

/**
 * 将颜色转换为可用于分配 color 属性的类型化数组。
 *
 * @param {Color} color 颜色。
 * @param {Uint8Array} [result] 用于存储结果的数组，如果未定义，将创建一个新实例。
 *
 * @returns {Uint8Array} 修改后的结果参数，如果 result 未定义，则为新实例。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA, attributes.color);
 */
ColorGeometryInstanceAttribute.toValue = function (color, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(color)) {
    throw new DeveloperError("color is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Uint8Array(color.toBytes());
  }
  return color.toBytes(result);
};

/**
 * 比较提供的 ColorGeometryInstanceAttributes 并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {ColorGeometryInstanceAttribute} [left] 第一个ColorGeometryInstanceAttribute.
 * @param {ColorGeometryInstanceAttribute} [right] 第二个 ColorGeometryInstanceAttribute.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
ColorGeometryInstanceAttribute.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.value[0] === right.value[0] &&
      left.value[1] === right.value[1] &&
      left.value[2] === right.value[2] &&
      left.value[3] === right.value[3])
  );
};
export default ColorGeometryInstanceAttribute;
