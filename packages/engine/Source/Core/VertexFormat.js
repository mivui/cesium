import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 顶点格式定义构成顶点的属性。 可以提供 VertexFormat
 * 更改为 {@link Geometry} 以请求计算某些属性，例如，仅计算 position，
 * 位置和法线等。
 *
 * @param {object} [options] 一个具有布尔属性的对象，对应于 VertexFormat 属性，如代码示例所示。
 *
 * @alias VertexFormat
 * @constructor
 *
 * @example
 * // Create a vertex format with position and 2D texture coordinate attributes.
 * const format = new Cesium.VertexFormat({
 *   position : true,
 *   st : true
 * });
 *
 * @see Geometry#attributes
 * @see Packable
 */
function VertexFormat(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 如果<code>为 true</code>，则顶点具有 3D 位置属性。
   * <p>
   * 64 位浮点（用于精度）。 每个属性 3 个组件。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.position = defaultValue(options.position, false);

  /**
   * 如果<code>为 true</code>，则顶点具有 normal 属性（规格化），该属性通常用于照明。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.normal = defaultValue(options.normal, false);

  /**
   * 如果<code>为 true</code>，则顶点具有 2D 纹理坐标属性。
   * <p>
   * 32 位浮点。 每个属性 2 个组件
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.st = defaultValue(options.st, false);

  /**
   * 如果为 <code>true</code>，则顶点具有双切线属性 （规格化），该属性用于凹凸贴图等切线空间效果。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.bitangent = defaultValue(options.bitangent, false);

  /**
   * 如果为 <code>true</code>，则顶点具有切线属性（规格化），该属性用于凹凸贴图等切线空间效果。
   * <p>
   * 32 位浮点。 每个属性 3 个组件。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.tangent = defaultValue(options.tangent, false);

  /**
   * 如果<code>为 true</code>，则顶点具有 RGB 颜色属性。
   * <p>
   * 8 位无符号字节。 每个属性 3 个组件。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.color = defaultValue(options.color, false);
}

/**
 * 仅具有 position 属性的不可变顶点格式。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 */
VertexFormat.POSITION_ONLY = Object.freeze(
  new VertexFormat({
    position: true,
  }),
);

/**
 * 具有 position 和 normal 属性的不可变顶点格式。
 * 这与每个实例的颜色外观兼容，例如 {@link PerInstanceColorAppearance}。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 */
VertexFormat.POSITION_AND_NORMAL = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
  }),
);

/**
 * 具有 position、normal 和 st 属性的不可变顶点格式。
 * 这与 {@link MaterialAppearance} 兼容，当 {@link MaterialAppearance#materialSupport}
 * 为 <code>TEXTURED/code>。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 * @see VertexFormat#st
 */
VertexFormat.POSITION_NORMAL_AND_ST = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
    st: true,
  }),
);

/**
 * 具有 position 和 st 属性的不可变顶点格式。
 * 这与 {@link EllipsoidSurfaceAppearance} 兼容。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#st
 */
VertexFormat.POSITION_AND_ST = Object.freeze(
  new VertexFormat({
    position: true,
    st: true,
  }),
);

/**
 * 具有 position 和 color 属性的不可变顶点格式。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#color
 */
VertexFormat.POSITION_AND_COLOR = Object.freeze(
  new VertexFormat({
    position: true,
    color: true,
  }),
);

/**
 * 具有已知属性的不可变顶点格式：position、normal、st、tangent 和 bitangent。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 * @see VertexFormat#st
 * @see VertexFormat#tangent
 * @see VertexFormat#bitangent
 */
VertexFormat.ALL = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
    st: true,
    tangent: true,
    bitangent: true,
  }),
);

/**
 * 具有 position、normal 和 st 属性的不可变顶点格式。
 * 这与大多数外观和材料兼容;然而
 * normal 和 st 属性并不总是必需的。 当这是
 * 事先知道，应该使用另一个 <code>VertexFormat</code>。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 */
VertexFormat.DEFAULT = VertexFormat.POSITION_NORMAL_AND_ST;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
VertexFormat.packedLength = 6;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {VertexFormat} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
VertexFormat.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.position ? 1.0 : 0.0;
  array[startingIndex++] = value.normal ? 1.0 : 0.0;
  array[startingIndex++] = value.st ? 1.0 : 0.0;
  array[startingIndex++] = value.tangent ? 1.0 : 0.0;
  array[startingIndex++] = value.bitangent ? 1.0 : 0.0;
  array[startingIndex] = value.color ? 1.0 : 0.0;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {VertexFormat} [result] 要在其中存储结果的对象。
 * @returns {VertexFormat} 修改后的结果参数或者一个新的 VertexFormat 实例（如果未提供）。
 */
VertexFormat.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new VertexFormat();
  }

  result.position = array[startingIndex++] === 1.0;
  result.normal = array[startingIndex++] === 1.0;
  result.st = array[startingIndex++] === 1.0;
  result.tangent = array[startingIndex++] === 1.0;
  result.bitangent = array[startingIndex++] === 1.0;
  result.color = array[startingIndex] === 1.0;
  return result;
};

/**
 * 复制VertexFormat实例。
 *
 * @param {VertexFormat} vertexFormat The vertex format to duplicate.
 * @param {VertexFormat} [result] 要在其上存储结果的对象。
 * @returns {VertexFormat} 修改后的结果参数或者一个新的 VertexFormat 实例（如果未提供）。（如果 vertexFormat 未定义，则返回 undefined）
 */
VertexFormat.clone = function (vertexFormat, result) {
  if (!defined(vertexFormat)) {
    return undefined;
  }
  if (!defined(result)) {
    result = new VertexFormat();
  }

  result.position = vertexFormat.position;
  result.normal = vertexFormat.normal;
  result.st = vertexFormat.st;
  result.tangent = vertexFormat.tangent;
  result.bitangent = vertexFormat.bitangent;
  result.color = vertexFormat.color;
  return result;
};
export default VertexFormat;
