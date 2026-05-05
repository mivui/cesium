import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import EllipsoidOutlineGeometry from "./EllipsoidOutlineGeometry.js";

/**
 * 球体轮廓的描述。
 *
 * @alias SphereOutlineGeometry
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.radius=1.0] 球体的半径。
 * @param {number} [options.stackPartitions=10] 球体的堆栈数量（比平行线条数大1）。
 * @param {number} [options.slicePartitions=8] 球体的切片数量（等于径向线条数）。
 * @param {number} [options.subdivisions=200] 每条线的点数，决定曲率的粒度。
 *
 * @exception {DeveloperError} options.stackPartitions必须大于或等于一。
 * @exception {DeveloperError} options.slicePartitions必须大于或等于零。
 * @exception {DeveloperError} options.subdivisions必须大于或等于零。
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
  const radius = options.radius ?? 1.0;
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
 * @param {number[]} array 要打包到的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组索引。
 *
 * @returns {number[]} 被打包到的数组
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
 * 从打包的数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解包的元素起始索引。
 * @param {SphereOutlineGeometry} [result] 存储结果的对象。
 * @returns {SphereOutlineGeometry} 修改后的结果参数，如果未提供则返回新的SphereOutlineGeometry实例。
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
 * 计算球体轮廓的几何表示，包括其顶点、索引和边界球。
 *
 * @param {SphereOutlineGeometry} sphereGeometry 球体轮廓的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */
SphereOutlineGeometry.createGeometry = function (sphereGeometry) {
  return EllipsoidOutlineGeometry.createGeometry(
    sphereGeometry._ellipsoidGeometry,
  );
};
export default SphereOutlineGeometry;
