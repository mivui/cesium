import arrayRemoveDuplicates from "./arrayRemoveDuplicates.js";
import BoundingRectangle from "./BoundingRectangle.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import ComponentDatatype from "./ComponentDatatype.js";
import CornerType from "./CornerType.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import PolygonPipeline from "./PolygonPipeline.js";
import PolylineVolumeGeometryLibrary from "./PolylineVolumeGeometryLibrary.js";
import PrimitiveType from "./PrimitiveType.js";
import WindingOrder from "./WindingOrder.js";

function computeAttributes(positions, shape) {
  const attributes = new GeometryAttributes();
  attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions,
  });

  const shapeLength = shape.length;
  const vertexCount = attributes.position.values.length / 3;
  const positionLength = positions.length / 3;
  const shapeCount = positionLength / shapeLength;
  const indices = IndexDatatype.createTypedArray(
    vertexCount,
    2 * shapeLength * (shapeCount + 1)
  );
  let i, j;
  let index = 0;
  i = 0;
  let offset = i * shapeLength;
  for (j = 0; j < shapeLength - 1; j++) {
    indices[index++] = j + offset;
    indices[index++] = j + offset + 1;
  }
  indices[index++] = shapeLength - 1 + offset;
  indices[index++] = offset;

  i = shapeCount - 1;
  offset = i * shapeLength;
  for (j = 0; j < shapeLength - 1; j++) {
    indices[index++] = j + offset;
    indices[index++] = j + offset + 1;
  }
  indices[index++] = shapeLength - 1 + offset;
  indices[index++] = offset;

  for (i = 0; i < shapeCount - 1; i++) {
    const firstOffset = shapeLength * i;
    const secondOffset = firstOffset + shapeLength;
    for (j = 0; j < shapeLength; j++) {
      indices[index++] = j + firstOffset;
      indices[index++] = j + secondOffset;
    }
  }

  const geometry = new Geometry({
    attributes: attributes,
    indices: IndexDatatype.createTypedArray(vertexCount, indices),
    boundingSphere: BoundingSphere.fromVertices(positions),
    primitiveType: PrimitiveType.LINES,
  });

  return geometry;
}

/**
 * 具有体积的多段线（沿多段线拉伸的 2D 形状）的描述。
 *
 * @alias PolylineVolumeOutlineGeometry
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Cartesian3[]} options.polylinePositions 定义多段线体积中心的位置数组。
 * @param {Cartesian2[]} options.shapePositions 定义要沿多段线拉伸的形状的位置数组
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 要用作参考的椭球体。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 每个纬度和经度之间的距离，以弧度为单位。确定缓冲区中的位置数。
 * @param {CornerType} [options.cornerType=CornerType.ROUNDED] 确定角的样式。
 *
 * @see PolylineVolumeOutlineGeometry#createGeometry
 *
 * @example
 * function computeCircle(radius) {
 *   const positions = [];
 *   for (let i = 0; i < 360; i++) {
 *     const radians = Cesium.Math.toRadians(i);
 *     positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
 *   }
 *   return positions;
 * }
 *
 * const volumeOutline = new Cesium.PolylineVolumeOutlineGeometry({
 *   polylinePositions : Cesium.Cartesian3.fromDegreesArray([
 *     -72.0, 40.0,
 *     -70.0, 35.0
 *   ]),
 *   shapePositions : computeCircle(100000.0)
 * });
 */
function PolylineVolumeOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const positions = options.polylinePositions;
  const shape = options.shapePositions;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(positions)) {
    throw new DeveloperError("options.polylinePositions is required.");
  }
  if (!defined(shape)) {
    throw new DeveloperError("options.shapePositions is required.");
  }
  //>>includeEnd('debug');

  this._positions = positions;
  this._shape = shape;
  this._ellipsoid = Ellipsoid.clone(
    defaultValue(options.ellipsoid, Ellipsoid.default)
  );
  this._cornerType = defaultValue(options.cornerType, CornerType.ROUNDED);
  this._granularity = defaultValue(
    options.granularity,
    CesiumMath.RADIANS_PER_DEGREE
  );
  this._workerName = "createPolylineVolumeOutlineGeometry";

  let numComponents = 1 + positions.length * Cartesian3.packedLength;
  numComponents += 1 + shape.length * Cartesian2.packedLength;

  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  this.packedLength = numComponents + Ellipsoid.packedLength + 2;
}

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {PolylineVolumeOutlineGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
PolylineVolumeOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  let i;

  const positions = value._positions;
  let length = positions.length;
  array[startingIndex++] = length;

  for (i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
    Cartesian3.pack(positions[i], array, startingIndex);
  }

  const shape = value._shape;
  length = shape.length;
  array[startingIndex++] = length;

  for (i = 0; i < length; ++i, startingIndex += Cartesian2.packedLength) {
    Cartesian2.pack(shape[i], array, startingIndex);
  }

  Ellipsoid.pack(value._ellipsoid, array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  array[startingIndex++] = value._cornerType;
  array[startingIndex] = value._granularity;

  return array;
};

const scratchEllipsoid = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);
const scratchOptions = {
  polylinePositions: undefined,
  shapePositions: undefined,
  ellipsoid: scratchEllipsoid,
  height: undefined,
  cornerType: undefined,
  granularity: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {PolylineVolumeOutlineGeometry} [result] 要在其中存储结果的对象。
 * @returns {PolylineVolumeOutlineGeometry} 修改后的结果参数或新的 PolylineVolumeOutlineGeometry 实例（如果未提供）。
 */
PolylineVolumeOutlineGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  let i;

  let length = array[startingIndex++];
  const positions = new Array(length);

  for (i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
    positions[i] = Cartesian3.unpack(array, startingIndex);
  }

  length = array[startingIndex++];
  const shape = new Array(length);

  for (i = 0; i < length; ++i, startingIndex += Cartesian2.packedLength) {
    shape[i] = Cartesian2.unpack(array, startingIndex);
  }

  const ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
  startingIndex += Ellipsoid.packedLength;

  const cornerType = array[startingIndex++];
  const granularity = array[startingIndex];

  if (!defined(result)) {
    scratchOptions.polylinePositions = positions;
    scratchOptions.shapePositions = shape;
    scratchOptions.cornerType = cornerType;
    scratchOptions.granularity = granularity;
    return new PolylineVolumeOutlineGeometry(scratchOptions);
  }

  result._positions = positions;
  result._shape = shape;
  result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
  result._cornerType = cornerType;
  result._granularity = granularity;

  return result;
};

const brScratch = new BoundingRectangle();

/**
 * 计算具有体积的折线轮廓的几何表示，包括其顶点、索引和边界球体。
 *
 * @param {PolylineVolumeOutlineGeometry} polylineVolumeOutlineGeometry 多段线体积轮廓的描述。
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
PolylineVolumeOutlineGeometry.createGeometry = function (
  polylineVolumeOutlineGeometry
) {
  const positions = polylineVolumeOutlineGeometry._positions;
  const cleanPositions = arrayRemoveDuplicates(
    positions,
    Cartesian3.equalsEpsilon
  );
  let shape2D = polylineVolumeOutlineGeometry._shape;
  shape2D = PolylineVolumeGeometryLibrary.removeDuplicatesFromShape(shape2D);

  if (cleanPositions.length < 2 || shape2D.length < 3) {
    return undefined;
  }

  if (
    PolygonPipeline.computeWindingOrder2D(shape2D) === WindingOrder.CLOCKWISE
  ) {
    shape2D.reverse();
  }
  const boundingRectangle = BoundingRectangle.fromPoints(shape2D, brScratch);

  const computedPositions = PolylineVolumeGeometryLibrary.computePositions(
    cleanPositions,
    shape2D,
    boundingRectangle,
    polylineVolumeOutlineGeometry,
    false
  );
  return computeAttributes(computedPositions, shape2D);
};
export default PolylineVolumeOutlineGeometry;
