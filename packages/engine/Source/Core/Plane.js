import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import Matrix4 from "./Matrix4.js";

/**
 * 海森法线形式的平面，定义为
 * <pre>
 * ax + by + cz + d = 0
 * </pre>
 * 其中 (a, b, c) 是平面的<code>法线</code>，d 是到平面的有符号
 * <code>距离</code>，(x, y, z) 是平面上的任意点。
 *
 * @alias Plane
 * @constructor
 *
 * @param {Cartesian3} normal 平面的法线（已归一化）。
 * @param {number} distance 从原点到平面的最短距离。<code>distance</code> 的符号
 * 决定了原点在平面的哪一侧。如果 <code>distance</code> 为正数，原点位于
 * 法线方向的半空间；如果为负数，原点位于
 * 法线相反的半空间；如果为零，平面通过原点。
 *
 * @example
 * // 平面 x=0
 * const plane = new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0);
 *
 * @exception {DeveloperError} 法线必须归一化
 */
function Plane(normal, distance) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("normal", normal);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  Check.typeOf.number("distance", distance);
  //>>includeEnd('debug');

  /**
   * 平面的法线。
   *
   * @type {Cartesian3}
   */
  this.normal = Cartesian3.clone(normal);

  /**
   * 从原点到平面的最短距离。<code>distance</code> 的符号
   * 决定了原点在平面的哪一侧。如果 <code>distance</code> 为正数，原点位于
   * 法线方向的半空间；如果为负数，原点位于
   * 法线相反的半空间；如果为零，平面通过原点。
   *
   * @type {number}
   */
  this.distance = distance;
}

/**
 * 从法线和平面上的点创建平面。
 *
 * @param {Cartesian3} point 平面上的点。
 * @param {Cartesian3} normal 平面的法线（已归一化）。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 新的平面实例或修改的结果参数。
 *
 * @example
 * const point = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
 * const normal = ellipsoid.geodeticSurfaceNormal(point);
 * const tangentPlane = Cesium.Plane.fromPointNormal(point, normal);
 *
 * @exception {DeveloperError} 法线必须归一化
 */
Plane.fromPointNormal = function (point, normal, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("point", point);
  Check.typeOf.object("normal", normal);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  //>>includeEnd('debug');

  const distance = -Cartesian3.dot(normal, point);

  if (!defined(result)) {
    return new Plane(normal, distance);
  }

  Cartesian3.clone(normal, result.normal);
  result.distance = distance;
  return result;
};

const scratchNormal = new Cartesian3();
/**
 * 从一般方程创建平面。
 *
 * @param {Cartesian4} coefficients 平面的系数（已归一化）。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 新的平面实例或修改的结果参数。
 *
 * @exception {DeveloperError} 法线必须归一化
 */
Plane.fromCartesian4 = function (coefficients, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("coefficients", coefficients);
  //>>includeEnd('debug');

  const normal = Cartesian3.fromCartesian4(coefficients, scratchNormal);
  const distance = coefficients.w;

  //>>includeStart('debug', pragmas.debug);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Plane(normal, distance);
  }
  Cartesian3.clone(normal, result.normal);
  result.distance = distance;
  return result;
};

/**
 * 计算点到平面的有符号最短距离。
 * 距离的符号决定了点在平面的哪一侧。
 * 如果距离为正数，点位于法线方向的半空间；
 * 如果为负数，点位于法线相反的半空间；
 * 如果为零，平面通过该点。
 *
 * @param {Plane} plane 平面。
 * @param {Cartesian3} point 点。
 * @returns {number} 点到平面的有符号最短距离。
 */
Plane.getPointDistance = function (plane, point) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  return Cartesian3.dot(plane.normal, point) + plane.distance;
};

const scratchCartesian = new Cartesian3();
/**
 * 将点投影到平面上。
 * @param {Plane} plane 要投影到的平面。
 * @param {Cartesian3} point 要投影到平面上的点。
 * @param {Cartesian3} [result] 结果点。如果未定义，将创建新的 Cartesian3。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的 Cartesian3 实例。
 */
Plane.projectPointOntoPlane = function (plane, point, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  // projectedPoint = point - (normal.point + scale) * normal
  const pointDistance = Plane.getPointDistance(plane, point);
  const scaledNormal = Cartesian3.multiplyByScalar(
    plane.normal,
    pointDistance,
    scratchCartesian,
  );

  return Cartesian3.subtract(point, scaledNormal, result);
};

const scratchInverseTranspose = new Matrix4();
const scratchPlaneCartesian4 = new Cartesian4();
const scratchTransformNormal = new Cartesian3();
/**
 * 使用给定的变换矩阵变换平面。
 *
 * @param {Plane} plane 平面。
 * @param {Matrix4} transform 变换矩阵。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 经过给定变换矩阵变换后的平面。
 */
Plane.transform = function (plane, transform, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("transform", transform);
  //>>includeEnd('debug');

  const normal = plane.normal;
  const distance = plane.distance;
  const inverseTranspose = Matrix4.inverseTranspose(
    transform,
    scratchInverseTranspose,
  );
  let planeAsCartesian4 = Cartesian4.fromElements(
    normal.x,
    normal.y,
    normal.z,
    distance,
    scratchPlaneCartesian4,
  );
  planeAsCartesian4 = Matrix4.multiplyByVector(
    inverseTranspose,
    planeAsCartesian4,
    planeAsCartesian4,
  );

  // Convert the transformed plane to Hessian Normal Form
  const transformedNormal = Cartesian3.fromCartesian4(
    planeAsCartesian4,
    scratchTransformNormal,
  );

  planeAsCartesian4 = Cartesian4.divideByScalar(
    planeAsCartesian4,
    Cartesian3.magnitude(transformedNormal),
    planeAsCartesian4,
  );

  return Plane.fromCartesian4(planeAsCartesian4, result);
};

/**
 * 复制一个 Plane 实例。
 *
 * @param {Plane} plane 要复制的平面。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 修改后的结果参数，如果未提供则返回新的 Plane 实例。
 */
Plane.clone = function (plane, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Plane(plane.normal, plane.distance);
  }

  Cartesian3.clone(plane.normal, result.normal);
  result.distance = plane.distance;

  return result;
};

/**
 * 比较提供的两个平面（通过法线和距离），如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Plane} left 第一个平面。
 * @param {Plane} right 第二个平面。
 * @returns {boolean} 如果 left 和 right 相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
Plane.equals = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.distance === right.distance &&
    Cartesian3.equals(left.normal, right.normal)
  );
};

/**
 * 初始化为通过原点的 XY 平面，法线方向为正 Z。
 *
 * @type {Plane}
 * @constant
 */
Plane.ORIGIN_XY_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_Z, 0.0));

/**
 * 初始化为通过原点的 YZ 平面，法线方向为正 X。
 *
 * @type {Plane}
 * @constant
 */
Plane.ORIGIN_YZ_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_X, 0.0));

/**
 * 初始化为通过原点的 ZX 平面，法线方向为正 Y。
 *
 * @type {Plane}
 * @constant
 */
Plane.ORIGIN_ZX_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_Y, 0.0));
export default Plane;
