import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipsoidGeometry from "./EllipsoidGeometry.js";
import VertexFormat from "./VertexFormat.js";

/**
 * A description of a sphere centered at the origin.
 *
 * @alias SphereGeometry
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {number} [options.radius=1.0] The radius of the sphere.
 * @param {number} [options.stackPartitions=64] The number of times to partition the ellipsoid into stacks.
 * @param {number} [options.slicePartitions=64] The number of times to partition the ellipsoid into radial slices.
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 *
 * @exception {DeveloperError} options.slicePartitions cannot be less than three.
 * @exception {DeveloperError} options.stackPartitions cannot be less than three.
 *
 * @see SphereGeometry#createGeometry
 *
 * @example
 * const sphere = new Cesium.SphereGeometry({
 *   radius : 100.0,
 *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY
 * });
 * const geometry = Cesium.SphereGeometry.createGeometry(sphere);
 */
function SphereGeometry(options) {
  const radius = defaultValue(options.radius, 1.0);
  const radii = new Cartesian3(radius, radius, radius);
  const ellipsoidOptions = {
    radii: radii,
    stackPartitions: options.stackPartitions,
    slicePartitions: options.slicePartitions,
    vertexFormat: options.vertexFormat,
  };

  this._ellipsoidGeometry = new EllipsoidGeometry(ellipsoidOptions);
  this._workerName = "createSphereGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
SphereGeometry.packedLength = EllipsoidGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {SphereGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
SphereGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');

  return EllipsoidGeometry.pack(value._ellipsoidGeometry, array, startingIndex);
};

const scratchEllipsoidGeometry = new EllipsoidGeometry();
const scratchOptions = {
  radius: undefined,
  radii: new Cartesian3(),
  vertexFormat: new VertexFormat(),
  stackPartitions: undefined,
  slicePartitions: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {SphereGeometry} [result] 要在其中存储结果的对象。
 * @returns {SphereGeometry} 修改后的结果参数 or a new SphereGeometry instance if one was not provided.
 */
SphereGeometry.unpack = function (array, startingIndex, result) {
  const ellipsoidGeometry = EllipsoidGeometry.unpack(
    array,
    startingIndex,
    scratchEllipsoidGeometry
  );
  scratchOptions.vertexFormat = VertexFormat.clone(
    ellipsoidGeometry._vertexFormat,
    scratchOptions.vertexFormat
  );
  scratchOptions.stackPartitions = ellipsoidGeometry._stackPartitions;
  scratchOptions.slicePartitions = ellipsoidGeometry._slicePartitions;

  if (!defined(result)) {
    scratchOptions.radius = ellipsoidGeometry._radii.x;
    return new SphereGeometry(scratchOptions);
  }

  Cartesian3.clone(ellipsoidGeometry._radii, scratchOptions.radii);
  result._ellipsoidGeometry = new EllipsoidGeometry(scratchOptions);
  return result;
};

/**
 * Computes the geometric representation of a sphere, including its vertices, indices, and a bounding sphere.
 *
 * @param {SphereGeometry} sphereGeometry A description of the sphere.
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
SphereGeometry.createGeometry = function (sphereGeometry) {
  return EllipsoidGeometry.createGeometry(sphereGeometry._ellipsoidGeometry);
};
export default SphereGeometry;
