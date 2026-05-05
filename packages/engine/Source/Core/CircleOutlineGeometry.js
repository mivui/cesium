import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import EllipseOutlineGeometry from "./EllipseOutlineGeometry.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 椭球上圆形轮廓的描述。
 *
 * @alias CircleOutlineGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3} options.center 固定坐标系中的圆心点。
 * @param {number} options.radius 半径（米）。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 圆形所在的椭球体。
 * @param {number} [options.height=0.0] 圆形与椭球表面之间的距离（米）。
 * @param {number} [options.granularity=0.02] 圆形上点之间的角距离（弧度）。
 * @param {number} [options.extrudedHeight=0.0] 圆形拉伸面与椭球表面之间的距离（米）。
 * @param {number} [options.numberOfVerticalLines=16] 在拉伸圆形顶部和底部之间绘制的线条数。
 *
 * @exception {DeveloperError} 半径必须大于零。
 * @exception {DeveloperError} 粒度必须大于零。
 *
 * @see CircleOutlineGeometry.createGeometry
 * @see Packable
 *
 * @example
 * // 创建一个圆形。
 * const circle = new Cesium.CircleOutlineGeometry({
 *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
 *   radius : 100000.0
 * });
 * const geometry = Cesium.CircleOutlineGeometry.createGeometry(circle);
 */
function CircleOutlineGeometry(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
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
 * @param {number[]} array 要打包到的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组索引。
 *
 * @returns {number[]} 被打包到的数组
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
 * 从打包的数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解包的元素起始索引。
 * @param {CircleOutlineGeometry} [result] 存储结果的对象。
 * @returns {CircleOutlineGeometry} 修改后的结果参数，如果未提供则返回新的CircleOutlineGeometry实例。
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
 * 计算椭球上圆形轮廓的几何表示，包括其顶点、索引和边界球。
 *
 * @param {CircleOutlineGeometry} circleGeometry 圆形的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */
CircleOutlineGeometry.createGeometry = function (circleGeometry) {
  return EllipseOutlineGeometry.createGeometry(circleGeometry._ellipseGeometry);
};
export default CircleOutlineGeometry;
