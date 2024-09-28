import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipseOutlineGeometry from "./EllipseOutlineGeometry.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 椭球体上圆轮廓的描述。
 *
 * @alias CircleOutlineGeometry
 * @constructor
 *
 * @param {object} options 对象，具有以下属性：
 * @param {Cartesian3} options.center 圆在固定坐标系中的圆心点。
 * @param {number} options.radius 半径（以米为单位）。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 圆圈所在的椭球体。
 * @param {number} [options.height=0.0] 圆与椭球体表面之间的距离（以米为单位）。
 * @param {number} [options.granularity=0.02] 圆上点之间的角距离，以弧度为单位。
 * @param {number} [options.extrudedHeight=0.0] 圆的拉伸面与椭球体表面之间的距离（以米为单位）。
 * @param {number} [options.numberOfVerticalLines=16] 在拉伸圆的顶部和底部之间绘制的线条数。
 *
 * @exception {DeveloperError} radius must be greater than zero.
 * @exception {DeveloperError} granularity must be greater than zero.
 *
 * @see CircleOutlineGeometry.createGeometry
 * @see Packable
 *
 * @example
 * // Create a circle.
 * const circle = new Cesium.CircleOutlineGeometry({
 *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
 *   radius : 100000.0
 * });
 * const geometry = Cesium.CircleOutlineGeometry.createGeometry(circle);
 */
function CircleOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const radius = options.radius;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("radius", radius);
  //>>includeEnd('debug');

  const ellipseGeometryOptions = {
    center: options.center,
    semiMajorAxis: radius,
    semiMinorAxis: radius,
    ellipsoid: options.ellipsoid,
    height: options.height,
    extrudedHeight: options.extrudedHeight,
    granularity: options.granularity,
    numberOfVerticalLines: options.numberOfVerticalLines,
  };
  this._ellipseGeometry = new EllipseOutlineGeometry(ellipseGeometryOptions);
  this._workerName = "createCircleOutlineGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
CircleOutlineGeometry.packedLength = EllipseOutlineGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {CircleOutlineGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
CircleOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');
  return EllipseOutlineGeometry.pack(
    value._ellipseGeometry,
    array,
    startingIndex,
  );
};

const scratchEllipseGeometry = new EllipseOutlineGeometry({
  center: new Cartesian3(),
  semiMajorAxis: 1.0,
  semiMinorAxis: 1.0,
});
const scratchOptions = {
  center: new Cartesian3(),
  radius: undefined,
  ellipsoid: Ellipsoid.clone(Ellipsoid.UNIT_SPHERE),
  height: undefined,
  extrudedHeight: undefined,
  granularity: undefined,
  numberOfVerticalLines: undefined,
  semiMajorAxis: undefined,
  semiMinorAxis: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {CircleOutlineGeometry} [result] 要在其中存储结果的对象。
 * @returns {CircleOutlineGeometry} 修改后的结果参数 或新的 CircleOutlineGeometry 实例（如果未提供）。
 */
CircleOutlineGeometry.unpack = function (array, startingIndex, result) {
  const ellipseGeometry = EllipseOutlineGeometry.unpack(
    array,
    startingIndex,
    scratchEllipseGeometry,
  );
  scratchOptions.center = Cartesian3.clone(
    ellipseGeometry._center,
    scratchOptions.center,
  );
  scratchOptions.ellipsoid = Ellipsoid.clone(
    ellipseGeometry._ellipsoid,
    scratchOptions.ellipsoid,
  );
  scratchOptions.height = ellipseGeometry._height;
  scratchOptions.extrudedHeight = ellipseGeometry._extrudedHeight;
  scratchOptions.granularity = ellipseGeometry._granularity;
  scratchOptions.numberOfVerticalLines = ellipseGeometry._numberOfVerticalLines;

  if (!defined(result)) {
    scratchOptions.radius = ellipseGeometry._semiMajorAxis;
    return new CircleOutlineGeometry(scratchOptions);
  }

  scratchOptions.semiMajorAxis = ellipseGeometry._semiMajorAxis;
  scratchOptions.semiMinorAxis = ellipseGeometry._semiMinorAxis;
  result._ellipseGeometry = new EllipseOutlineGeometry(scratchOptions);
  return result;
};

/**
 * 计算椭球体上圆轮廓的几何表示，包括其顶点、索引和边界球体。
 *
 * @param {CircleOutlineGeometry} circleGeometry 圆的描述。
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
CircleOutlineGeometry.createGeometry = function (circleGeometry) {
  return EllipseOutlineGeometry.createGeometry(circleGeometry._ellipseGeometry);
};
export default CircleOutlineGeometry;
