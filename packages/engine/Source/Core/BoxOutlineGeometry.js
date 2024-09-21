import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryOffsetAttribute from "./GeometryOffsetAttribute.js";
import PrimitiveType from "./PrimitiveType.js";

const diffScratch = new Cartesian3();

/**
 * 以原点为中心的立方体轮廓的描述。
 *
 * @alias BoxOutlineGeometry
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Cartesian3} options.minimum 最小x, y, z坐标来自 box.
 * @param {Cartesian3} options.maximum 最大x, y, z坐标来自 box.
 *
 * @see BoxOutlineGeometry.fromDimensions
 * @see BoxOutlineGeometry.createGeometry
 * @see Packable
 *
 * @example
 * const box = new Cesium.BoxOutlineGeometry({
 *   maximum : new Cesium.Cartesian3(250000.0, 250000.0, 250000.0),
 *   minimum : new Cesium.Cartesian3(-250000.0, -250000.0, -250000.0)
 * });
 * const geometry = Cesium.BoxOutlineGeometry.createGeometry(box);
 */
function BoxOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const min = options.minimum;
  const max = options.maximum;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("min", min);
  Check.typeOf.object("max", max);
  if (
    defined(options.offsetAttribute) &&
    options.offsetAttribute === GeometryOffsetAttribute.TOP
  ) {
    throw new DeveloperError(
      "GeometryOffsetAttribute.TOP is not a supported options.offsetAttribute for this geometry."
    );
  }
  //>>includeEnd('debug');

  this._min = Cartesian3.clone(min);
  this._max = Cartesian3.clone(max);
  this._offsetAttribute = options.offsetAttribute;
  this._workerName = "createBoxOutlineGeometry";
}

/**
 * 创建给定尺寸的以原点为中心的立方体的轮廓。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Cartesian3} options.dimensions 盒子的宽度、深度和高度分别存储在<code>Cartesian3</code>的x、y和z坐标中。
 * @returns {BoxOutlineGeometry}
 *
 * @exception {DeveloperError} All dimensions components must be greater than or equal to zero.
 *
 *
 * @example
 * const box = Cesium.BoxOutlineGeometry.fromDimensions({
 *   dimensions : new Cesium.Cartesian3(500000.0, 500000.0, 500000.0)
 * });
 * const geometry = Cesium.BoxOutlineGeometry.createGeometry(box);
 *
 * @see BoxOutlineGeometry.createGeometry
 */
BoxOutlineGeometry.fromDimensions = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const dimensions = options.dimensions;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("dimensions", dimensions);
  Check.typeOf.number.greaterThanOrEquals("dimensions.x", dimensions.x, 0);
  Check.typeOf.number.greaterThanOrEquals("dimensions.y", dimensions.y, 0);
  Check.typeOf.number.greaterThanOrEquals("dimensions.z", dimensions.z, 0);
  //>>includeEnd('debug');

  const corner = Cartesian3.multiplyByScalar(dimensions, 0.5, new Cartesian3());

  return new BoxOutlineGeometry({
    minimum: Cartesian3.negate(corner, new Cartesian3()),
    maximum: corner,
    offsetAttribute: options.offsetAttribute,
  });
};

/**
 * 根据AxisAlignedBoundingBox的尺寸创建立方体的轮廓。
 *
 * @param {AxisAlignedBoundingBox} boundingBox A description of the AxisAlignedBoundingBox.
 * @returns {BoxOutlineGeometry}
 *
 *
 *
 * @example
 * const aabb = Cesium.AxisAlignedBoundingBox.fromPoints(Cesium.Cartesian3.fromDegreesArray([
 *      -72.0, 40.0,
 *      -70.0, 35.0,
 *      -75.0, 30.0,
 *      -70.0, 30.0,
 *      -68.0, 40.0
 * ]));
 * const box = Cesium.BoxOutlineGeometry.fromAxisAlignedBoundingBox(aabb);
 *
 *  @see BoxOutlineGeometry.createGeometry
 */
BoxOutlineGeometry.fromAxisAlignedBoundingBox = function (boundingBox) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("boundindBox", boundingBox);
  //>>includeEnd('debug');

  return new BoxOutlineGeometry({
    minimum: boundingBox.minimum,
    maximum: boundingBox.maximum,
  });
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
BoxOutlineGeometry.packedLength = 2 * Cartesian3.packedLength + 1;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {BoxOutlineGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
BoxOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  Cartesian3.pack(value._min, array, startingIndex);
  Cartesian3.pack(value._max, array, startingIndex + Cartesian3.packedLength);
  array[startingIndex + Cartesian3.packedLength * 2] = defaultValue(
    value._offsetAttribute,
    -1
  );

  return array;
};

const scratchMin = new Cartesian3();
const scratchMax = new Cartesian3();
const scratchOptions = {
  minimum: scratchMin,
  maximum: scratchMax,
  offsetAttribute: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {BoxOutlineGeometry} [result] 要在其中存储结果的对象。
 * @returns {BoxOutlineGeometry} 修改后的结果参数 or a new BoxOutlineGeometry instance if one was not provided.
 */
BoxOutlineGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const min = Cartesian3.unpack(array, startingIndex, scratchMin);
  const max = Cartesian3.unpack(
    array,
    startingIndex + Cartesian3.packedLength,
    scratchMax
  );
  const offsetAttribute = array[startingIndex + Cartesian3.packedLength * 2];

  if (!defined(result)) {
    scratchOptions.offsetAttribute =
      offsetAttribute === -1 ? undefined : offsetAttribute;
    return new BoxOutlineGeometry(scratchOptions);
  }

  result._min = Cartesian3.clone(min, result._min);
  result._max = Cartesian3.clone(max, result._max);
  result._offsetAttribute =
    offsetAttribute === -1 ? undefined : offsetAttribute;

  return result;
};

/**
 * 计算框的轮廓的几何表示，包括其顶点、索引和边界球。
 *
 * @param {BoxOutlineGeometry} boxGeometry 盒子轮廓的描述。
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
BoxOutlineGeometry.createGeometry = function (boxGeometry) {
  const min = boxGeometry._min;
  const max = boxGeometry._max;

  if (Cartesian3.equals(min, max)) {
    return;
  }

  const attributes = new GeometryAttributes();
  const indices = new Uint16Array(12 * 2);
  const positions = new Float64Array(8 * 3);

  positions[0] = min.x;
  positions[1] = min.y;
  positions[2] = min.z;
  positions[3] = max.x;
  positions[4] = min.y;
  positions[5] = min.z;
  positions[6] = max.x;
  positions[7] = max.y;
  positions[8] = min.z;
  positions[9] = min.x;
  positions[10] = max.y;
  positions[11] = min.z;

  positions[12] = min.x;
  positions[13] = min.y;
  positions[14] = max.z;
  positions[15] = max.x;
  positions[16] = min.y;
  positions[17] = max.z;
  positions[18] = max.x;
  positions[19] = max.y;
  positions[20] = max.z;
  positions[21] = min.x;
  positions[22] = max.y;
  positions[23] = max.z;

  attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions,
  });

  // top
  indices[0] = 4;
  indices[1] = 5;
  indices[2] = 5;
  indices[3] = 6;
  indices[4] = 6;
  indices[5] = 7;
  indices[6] = 7;
  indices[7] = 4;

  // bottom
  indices[8] = 0;
  indices[9] = 1;
  indices[10] = 1;
  indices[11] = 2;
  indices[12] = 2;
  indices[13] = 3;
  indices[14] = 3;
  indices[15] = 0;

  // left
  indices[16] = 0;
  indices[17] = 4;
  indices[18] = 1;
  indices[19] = 5;

  //right
  indices[20] = 2;
  indices[21] = 6;
  indices[22] = 3;
  indices[23] = 7;

  const diff = Cartesian3.subtract(max, min, diffScratch);
  const radius = Cartesian3.magnitude(diff) * 0.5;

  if (defined(boxGeometry._offsetAttribute)) {
    const length = positions.length;
    const offsetValue =
      boxGeometry._offsetAttribute === GeometryOffsetAttribute.NONE ? 0 : 1;
    const applyOffset = new Uint8Array(length / 3).fill(offsetValue);
    attributes.applyOffset = new GeometryAttribute({
      componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
      componentsPerAttribute: 1,
      values: applyOffset,
    });
  }

  return new Geometry({
    attributes: attributes,
    indices: indices,
    primitiveType: PrimitiveType.LINES,
    boundingSphere: new BoundingSphere(Cartesian3.ZERO, radius),
    offsetAttribute: boxGeometry._offsetAttribute,
  });
};
export default BoxOutlineGeometry;
