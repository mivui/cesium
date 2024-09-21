import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipseGeometry from "./EllipseGeometry.js";
import Ellipsoid from "./Ellipsoid.js";
import VertexFormat from "./VertexFormat.js";

/**
 * A description of a circle on the ellipsoid. Circle geometry can be rendered with both {@link Primitive} and {@link GroundPrimitive}.
 *
 * @alias CircleGeometry
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Cartesian3} options.center The circle's center point in the fixed frame.
 * @param {number} options.radius The radius in meters.
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] The ellipsoid the circle will be on.
 * @param {number} [options.height=0.0] The distance in meters between the circle and the ellipsoid surface.
 * @param {number} [options.granularity=0.02] The angular distance between points on the circle in radians.
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {number} [options.extrudedHeight=0.0] The distance in meters between the circle's extruded face and the ellipsoid surface.
 * @param {number} [options.stRotation=0.0] The rotation of the texture coordinates, in radians. A positive rotation is counter-clockwise.
 *
 * @exception {DeveloperError} radius must be greater than zero.
 * @exception {DeveloperError} granularity must be greater than zero.
 *
 * @see CircleGeometry.createGeometry
 * @see Packable
 *
 * @example
 * // Create a circle.
 * const circle = new Cesium.CircleGeometry({
 *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
 *   radius : 100000.0
 * });
 * const geometry = Cesium.CircleGeometry.createGeometry(circle);
 */
function CircleGeometry(options) {
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
    vertexFormat: options.vertexFormat,
    stRotation: options.stRotation,
    shadowVolume: options.shadowVolume,
  };
  this._ellipseGeometry = new EllipseGeometry(ellipseGeometryOptions);
  this._workerName = "createCircleGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
CircleGeometry.packedLength = EllipseGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {CircleGeometry} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
CircleGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');
  return EllipseGeometry.pack(value._ellipseGeometry, array, startingIndex);
};

const scratchEllipseGeometry = new EllipseGeometry({
  center: new Cartesian3(),
  semiMajorAxis: 1.0,
  semiMinorAxis: 1.0,
});
const scratchOptions = {
  center: new Cartesian3(),
  radius: undefined,
  ellipsoid: Ellipsoid.clone(Ellipsoid.default),
  height: undefined,
  extrudedHeight: undefined,
  granularity: undefined,
  vertexFormat: new VertexFormat(),
  stRotation: undefined,
  semiMajorAxis: undefined,
  semiMinorAxis: undefined,
  shadowVolume: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {CircleGeometry} [result] 要在其中存储结果的对象。
 * @returns {CircleGeometry} 修改后的结果参数 or a new CircleGeometry instance if one was not provided.
 */
CircleGeometry.unpack = function (array, startingIndex, result) {
  const ellipseGeometry = EllipseGeometry.unpack(
    array,
    startingIndex,
    scratchEllipseGeometry
  );
  scratchOptions.center = Cartesian3.clone(
    ellipseGeometry._center,
    scratchOptions.center
  );
  scratchOptions.ellipsoid = Ellipsoid.clone(
    ellipseGeometry._ellipsoid,
    scratchOptions.ellipsoid
  );
  scratchOptions.ellipsoid = Ellipsoid.clone(
    ellipseGeometry._ellipsoid,
    scratchEllipseGeometry._ellipsoid
  );
  scratchOptions.height = ellipseGeometry._height;
  scratchOptions.extrudedHeight = ellipseGeometry._extrudedHeight;
  scratchOptions.granularity = ellipseGeometry._granularity;
  scratchOptions.vertexFormat = VertexFormat.clone(
    ellipseGeometry._vertexFormat,
    scratchOptions.vertexFormat
  );
  scratchOptions.stRotation = ellipseGeometry._stRotation;
  scratchOptions.shadowVolume = ellipseGeometry._shadowVolume;

  if (!defined(result)) {
    scratchOptions.radius = ellipseGeometry._semiMajorAxis;
    return new CircleGeometry(scratchOptions);
  }

  scratchOptions.semiMajorAxis = ellipseGeometry._semiMajorAxis;
  scratchOptions.semiMinorAxis = ellipseGeometry._semiMinorAxis;
  result._ellipseGeometry = new EllipseGeometry(scratchOptions);
  return result;
};

/**
 * Computes the geometric representation of a circle on an ellipsoid, including its vertices, indices, and a bounding sphere.
 *
 * @param {CircleGeometry} circleGeometry A description of the circle.
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
CircleGeometry.createGeometry = function (circleGeometry) {
  return EllipseGeometry.createGeometry(circleGeometry._ellipseGeometry);
};

/**
 * @private
 */
CircleGeometry.createShadowVolume = function (
  circleGeometry,
  minHeightFunc,
  maxHeightFunc
) {
  const granularity = circleGeometry._ellipseGeometry._granularity;
  const ellipsoid = circleGeometry._ellipseGeometry._ellipsoid;

  const minHeight = minHeightFunc(granularity, ellipsoid);
  const maxHeight = maxHeightFunc(granularity, ellipsoid);

  return new CircleGeometry({
    center: circleGeometry._ellipseGeometry._center,
    radius: circleGeometry._ellipseGeometry._semiMajorAxis,
    ellipsoid: ellipsoid,
    stRotation: circleGeometry._ellipseGeometry._stRotation,
    granularity: granularity,
    extrudedHeight: minHeight,
    height: maxHeight,
    vertexFormat: VertexFormat.POSITION_ONLY,
    shadowVolume: true,
  });
};

Object.defineProperties(CircleGeometry.prototype, {
  /**
   * @private
   */
  rectangle: {
    get: function () {
      return this._ellipseGeometry.rectangle;
    },
  },
  /**
   * For remapping texture coordinates when rendering CircleGeometries as GroundPrimitives.
   * @private
   */
  textureCoordinateRotationPoints: {
    get: function () {
      return this._ellipseGeometry.textureCoordinateRotationPoints;
    },
  },
});
export default CircleGeometry;
