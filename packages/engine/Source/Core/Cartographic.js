import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

/**
 * 由经度、纬度和高度定义的位置。
 * @alias Cartographic
 * @constructor
 *
 * @param {number} [longitude=0.0] 经度，以弧度为单位.
 * @param {number} [latitude=0.0] 纬度，以弧度为单位.
 * @param {number} [height=0.0] 椭球体上方的高度，单位为米。
 *
 * @see Ellipsoid
 */
function Cartographic(longitude, latitude, height) {
  /**
   * 经度，以弧度为单位.
   * @type {number}
   * @default 0.0
   */
  this.longitude = defaultValue(longitude, 0.0);

  /**
   * 纬度，以弧度为单位.
   * @type {number}
   * @default 0.0
   */
  this.latitude = defaultValue(latitude, 0.0);

  /**
   * 椭球体上方的高度，单位为米。
   * @type {number}
   * @default 0.0
   */
  this.height = defaultValue(height, 0.0);
}

/**
 * 根据经度和纬度创建新的Cartographic实例
 * 以弧度指定。
 *
 * @param {number} longitude 经度，以弧度为单位.
 * @param {number} latitude 纬度，以弧度为单位.
 * @param {number} [height=0.0] 椭球体上方的高度，单位为米。
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数 或新的Cartographic实例(如果没有提供的话)。
 */
Cartographic.fromRadians = function (longitude, latitude, height, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  height = defaultValue(height, 0.0);

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

/**
 * 根据经度和纬度创建新的Cartographic实例
 * 以度数指定。结果对象中的值将
 * 以弧度为单位。
 *
 * @param {number} longitude 经度，以度为单位。
 * @param {number} latitude 纬度，以度为单位.
 * @param {number} [height=0.0] 椭球体上方的高度，单位为米。
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数 或新的Cartographic实例(如果没有提供的话)。
 */
Cartographic.fromDegrees = function (longitude, latitude, height, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  longitude = CesiumMath.toRadians(longitude);
  latitude = CesiumMath.toRadians(latitude);

  return Cartographic.fromRadians(longitude, latitude, height, result);
};

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

// To avoid circular dependencies, these are set by Ellipsoid when Ellipsoid.default is set.
Cartographic._ellipsoidOneOverRadii = new Cartesian3(
  1.0 / 6378137.0,
  1.0 / 6378137.0,
  1.0 / 6356752.3142451793,
);
Cartographic._ellipsoidOneOverRadiiSquared = new Cartesian3(
  1.0 / (6378137.0 * 6378137.0),
  1.0 / (6378137.0 * 6378137.0),
  1.0 / (6356752.3142451793 * 6356752.3142451793),
);
Cartographic._ellipsoidCenterToleranceSquared = CesiumMath.EPSILON1;

/**
 * 从笛卡尔位置创建一个新的Cartographic实例。中的值
 * 结果对象将以弧度为单位。
 *
 * @param {Cartesian3} cartesian 要转换为地图表示法的笛卡尔位置。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数, 如果没有提供，则为新的Cartographic实例;如果直角坐标位于椭球体的中心，则为未定义的。
 */
Cartographic.fromCartesian = function (cartesian, ellipsoid, result) {
  const oneOverRadii = defined(ellipsoid)
    ? ellipsoid.oneOverRadii
    : Cartographic._ellipsoidOneOverRadii;
  const oneOverRadiiSquared = defined(ellipsoid)
    ? ellipsoid.oneOverRadiiSquared
    : Cartographic._ellipsoidOneOverRadiiSquared;
  const centerToleranceSquared = defined(ellipsoid)
    ? ellipsoid._centerToleranceSquared
    : Cartographic._ellipsoidCenterToleranceSquared;

  //`cartesian is required.` is thrown from scaleToGeodeticSurface
  const p = scaleToGeodeticSurface(
    cartesian,
    oneOverRadii,
    oneOverRadiiSquared,
    centerToleranceSquared,
    cartesianToCartographicP,
  );

  if (!defined(p)) {
    return undefined;
  }

  let n = Cartesian3.multiplyComponents(
    p,
    oneOverRadiiSquared,
    cartesianToCartographicN,
  );
  n = Cartesian3.normalize(n, n);

  const h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

  const longitude = Math.atan2(n.y, n.x);
  const latitude = Math.asin(n.z);
  const height =
    CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }
  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

/**
 * 从一个制图输入创建一个新的Cartesian3实例。输入的值
 * 物体应该以弧度为单位。
 *
 * @param {Cartographic} cartographic 将输入转换为笛卡尔输出。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 位置
 */
Cartographic.toCartesian = function (cartographic, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartographic", cartographic);
  //>>includeEnd('debug');

  return Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height,
    ellipsoid,
    result,
  );
};

/**
 * 复制Cartographic instance.
 *
 * @param {Cartographic} cartographic 要复制的Cartographic。
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数 或新的Cartographic实例(如果没有提供的话)。 (如果cartographic未定义则返回未定义)
 */
Cartographic.clone = function (cartographic, result) {
  if (!defined(cartographic)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartographic(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height,
    );
  }
  result.longitude = cartographic.longitude;
  result.latitude = cartographic.latitude;
  result.height = cartographic.height;
  return result;
};

/**
 * 比较所提供的地图组件并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartographic} [left] 第一个cartographic.
 * @param {Cartographic} [right] 第二个 cartographic.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Cartographic.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.longitude === right.longitude &&
      left.latitude === right.latitude &&
      left.height === right.height)
  );
};

/**
 * 比较所提供的地图组件并返回
 * <code>true</code> 如果它们在给定的范围内，
 * 否则 <code>false</code>。
 *
 * @param {Cartographic} [left] 第一个cartographic.
 * @param {Cartographic} [right] 第二个 cartographic.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
Cartographic.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.longitude - right.longitude) <= epsilon &&
      Math.abs(left.latitude - right.latitude) <= epsilon &&
      Math.abs(left.height - right.height) <= epsilon)
  );
};

/**
 * 初始化为。的不可变Cartographic 实例 (0.0, 0.0, 0.0).
 *
 * @type {Cartographic}
 * @constant
 */
Cartographic.ZERO = Object.freeze(new Cartographic(0.0, 0.0, 0.0));

/**
 * 复制instance.
 *
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数 或新的Cartographic实例(如果没有提供的话)。
 */
Cartographic.prototype.clone = function (result) {
  return Cartographic.clone(this, result);
};

/**
 * 将所提供的与此cartographic 组件进行比较并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartographic} [right] 第二个 cartographic.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Cartographic.prototype.equals = function (right) {
  return Cartographic.equals(this, right);
};

/**
 * 将所提供的与此cartographic 组件进行比较并返回
 * <code>true</code> 如果它们在给定的范围内，
 * 否则 <code>false</code>。
 *
 * @param {Cartographic} [right] 第二个 cartographic.
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
Cartographic.prototype.equalsEpsilon = function (right, epsilon) {
  return Cartographic.equalsEpsilon(this, right, epsilon);
};

/**
 * 以'(经度，纬度，高度)'的格式创建表示此Cartographic的字符串。
 *
 * @returns {string} 表示所提供Cartographic的字符串，格式为'(经度，纬度，高度)'。
 */
Cartographic.prototype.toString = function () {
  return `(${this.longitude}, ${this.latitude}, ${this.height})`;
};
export default Cartographic;
