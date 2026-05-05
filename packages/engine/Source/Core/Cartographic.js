// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

/** @import Ellipsoid from "./Ellipsoid.js"; */

/**
 * 由经度、纬度和高度定义的位置。
 *
 * @see Ellipsoid
 */
class Cartographic {
  /**
   * @param {number} [longitude=0.0] 经度，以弧度为单位。
   * @param {number} [latitude=0.0] 纬度，以弧度为单位。
   * @param {number} [height=0.0] 椭球上方的高度，以米为单位。
   */
  constructor(longitude, latitude, height) {
  /**
   * 经度，以弧度为单位。
   * @type {number}
   * @default 0.0
   */
    this.longitude = longitude ?? 0.0;

  /**
   * 纬度，以弧度为单位。
   * @type {number}
   * @default 0.0
   */
    this.latitude = latitude ?? 0.0;

  /**
   * 椭球上方的高度，以米为单位。
   * @type {number}
   * @default 0.0
   */
    this.height = height ?? 0.0;
  }

  /**
   * 从以弧度指定的经度和纬度创建新的Cartographic实例。
   *
   * @param {number} longitude 经度，以弧度为单位。
   * @param {number} latitude 纬度，以弧度为单位。
   * @param {number} [height=0.0] 椭球上方的高度，以米为单位。
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数；如果未提供则返回新的Cartographic实例。
   */
  static fromRadians(longitude, latitude, height, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    height = height ?? 0.0;

    if (!defined(result)) {
      return new Cartographic(longitude, latitude, height);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }

  /**
   * 从以度指定的经度和纬度创建新的Cartographic实例。
   * 结果对象中的值将以弧度为单位。
   *
   * @param {number} longitude 经度，以度为单位。
   * @param {number} latitude 纬度，以度为单位。
   * @param {number} [height=0.0] 椭球上方的高度，以米为单位。
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数；如果未提供则返回新的Cartographic实例。
   */
  static fromDegrees(longitude, latitude, height, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    longitude = CesiumMath.toRadians(longitude);
    latitude = CesiumMath.toRadians(latitude);

    return Cartographic.fromRadians(longitude, latitude, height, result);
  }

  /**
   * 从笛卡尔坐标位置创建新的Cartographic实例。结果
   * 对象中的值将以弧度为单位。
   *
   * @param {Cartesian3} cartesian 要转换为制图表示的笛卡尔坐标位置。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球。
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数；如果未提供则返回新的Cartographic实例；如果笛卡尔坐标位于椭球中心则返回undefined。
   */
  static fromCartesian(cartesian, ellipsoid, result) {
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
  }

  /**
   * 从Cartographic输入创建新的Cartesian3实例。输入
   * 对象中的值应以弧度为单位。
   *
   * @param {Cartographic} cartographic 要转换为Cartesian3输出的输入。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 位置
   */
  static toCartesian(cartographic, ellipsoid, result) {
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
  }

  /**
   * 复制Cartographic实例。
   *
   * @param {Cartographic} cartographic 要复制的制图坐标。
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数；如果未提供则返回新的Cartographic实例。（如果cartographic未定义则返回undefined）
   */
  static clone(cartographic, result) {
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
  }

  /**
   * 逐分量比较提供的制图坐标，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartographic} [left] 第一个制图坐标。
   * @param {Cartographic} [right] 第二个制图坐标。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.longitude === right.longitude &&
        left.latitude === right.latitude &&
        left.height === right.height)
    );
  }

  /**
   * 逐分量比较提供的制图坐标，如果它们在提供的epsilon范围内则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartographic} [left] 第一个制图坐标。
   * @param {Cartographic} [right] 第二个制图坐标。
   * @param {number} [epsilon=0] 用于相等性测试的epsilon。
   * @returns {boolean} 如果left和right在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;

    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left.longitude - right.longitude) <= epsilon &&
        Math.abs(left.latitude - right.latitude) <= epsilon &&
        Math.abs(left.height - right.height) <= epsilon)
    );
  }

  /**
   * 复制此实例。
   *
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数；如果未提供则返回新的Cartographic实例。
   */
  clone(result) {
    return Cartographic.clone(this, result);
  }

  /**
   * 逐分量将此制图坐标与提供的制图坐标进行比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartographic} [right] 第二个制图坐标。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return Cartographic.equals(this, right);
  }

  /**
   * 逐分量将此制图坐标与提供的制图坐标进行比较，如果它们在提供的epsilon范围内则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartographic} [right] 第二个制图坐标。
   * @param {number} [epsilon=0] 用于相等性测试的epsilon。
   * @returns {boolean} 如果它们在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  equalsEpsilon(right, epsilon) {
    return Cartographic.equalsEpsilon(this, right, epsilon);
  }

  /**
   * 创建表示此制图坐标的字符串，格式为'(经度, 纬度, 高度)'。
   *
   * @returns {string} 表示此制图坐标的字符串，格式为'(经度, 纬度, 高度)'。
   */
  toString() {
    return `(${this.longitude}, ${this.latitude}, ${this.height})`;
  }

  // To avoid circular dependencies, these are set by Ellipsoid when Ellipsoid.default is set.
  static _ellipsoidOneOverRadii = new Cartesian3(
    1.0 / 6378137.0,
    1.0 / 6378137.0,
    1.0 / 6356752.3142451793,
  );

  static _ellipsoidOneOverRadiiSquared = new Cartesian3(
    1.0 / (6378137.0 * 6378137.0),
    1.0 / (6378137.0 * 6378137.0),
    1.0 / (6356752.3142451793 * 6356752.3142451793),
  );

  static _ellipsoidCenterToleranceSquared = CesiumMath.EPSILON1;
}

/**
 * 初始化为(0.0, 0.0, 0.0)的不可变Cartographic实例。
 *
 * @type {Cartographic}
 * @constant
 */
Cartographic.ZERO = Object.freeze(new Cartographic(0.0, 0.0, 0.0));

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

export default Cartographic;
