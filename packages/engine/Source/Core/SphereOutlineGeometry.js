import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipsoidOutlineGeometry from "./EllipsoidOutlineGeometry.js";

/**
 * 对球体轮廓的描述。
 *
 * @alias SphereOutlineGeometry
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {number} [options.radius=1.0] 球体的半径。
 * @param {number} [options.stackPartitions=10] 球体的堆栈数（1 大于平行线的数量）。
 * @param {number} [options.slicePartitions=8] 球体的切片数（等于径向线的数量）。
 * @param {number} [options.subdivisions=200] 每行的点数，确定曲率的粒度。
 *
 * @exception {DeveloperError} options.stackPartitions must be greater than or equal to one.
 * @exception {DeveloperError} options.slicePartitions must be greater than or equal to zero.
 * @exception {DeveloperError} options.subdivisions must be greater than or equal to zero.
 *
 * @example
 * const sphere = new Cesium.SphereOutlineGeometry({
 *   radius : 100.0,
 *   stackPartitions : 6,
 *   slicePartitions: 5
 * });
 * const geometry = Cesium.SphereOutlineGeometry.createGeometry(sphere);
 */
function SphereOutlineGeometry(options) {
  const radius = defaultValue(options.radius, 1.0);
  const radii = new Cartesian3(radius, radius, radius);
  const ellipsoidOptions = {
    radii: radii,
    stackPartitions: options.stackPartitions,
    slicePartitions: options.slicePartitions,
    subdivisions: options.subdivisions,
  };

  this._ellipsoidGeometry = new EllipsoidOutlineGeometry(ellipsoidOptions);
  this._workerName = "createSphereOutlineGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
SphereOutlineGeometry.packedLength = EllipsoidOutlineGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {SphereOutlineGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
SphereOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');

  return EllipsoidOutlineGeometry.pack(
    value._ellipsoidGeometry,
    array,
    startingIndex,
  );
};

const scratchEllipsoidGeometry = new EllipsoidOutlineGeometry();
const scratchOptions = {
  radius: undefined,
  radii: new Cartesian3(),
  stackPartitions: undefined,
  slicePartitions: undefined,
  subdivisions: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {SphereOutlineGeometry} [result] 要在其中存储结果的对象。
 * @returns {SphereOutlineGeometry} 修改后的结果参数或新的 SphereOutlineGeometry 实例（如果未提供）。
 */
SphereOutlineGeometry.unpack = function (array, startingIndex, result) {
  const ellipsoidGeometry = EllipsoidOutlineGeometry.unpack(
    array,
    startingIndex,
    scratchEllipsoidGeometry,
  );
  scratchOptions.stackPartitions = ellipsoidGeometry._stackPartitions;
  scratchOptions.slicePartitions = ellipsoidGeometry._slicePartitions;
  scratchOptions.subdivisions = ellipsoidGeometry._subdivisions;

  if (!defined(result)) {
    scratchOptions.radius = ellipsoidGeometry._radii.x;
    return new SphereOutlineGeometry(scratchOptions);
  }

  Cartesian3.clone(ellipsoidGeometry._radii, scratchOptions.radii);
  result._ellipsoidGeometry = new EllipsoidOutlineGeometry(scratchOptions);
  return result;
};

/**
 * 计算球体轮廓的几何表示，包括其顶点、索引和边界球体。
 *
 * @param {SphereOutlineGeometry} sphereGeometry 球体轮廓的描述。
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
SphereOutlineGeometry.createGeometry = function (sphereGeometry) {
  return EllipsoidOutlineGeometry.createGeometry(
    sphereGeometry._ellipsoidGeometry,
  );
};
export default SphereOutlineGeometry;
