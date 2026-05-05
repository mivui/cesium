// @ts-check

import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

/** @import Rectangle from "./Rectangle.js"; */

/**
 * A real valued scalar function.
 * @callback EllipsoidRealValuedScalarFunction
 *
 * @param {number} x The value used to evaluate the function.
 * @returns {number} The value of the function at x.
 *
 * @private
 */

/**
 * @param {Ellipsoid} ellipsoid
 * @param {number} x
 * @param {number} y
 * @param {number} z
 *
 * @ignore
 */
function initialize(ellipsoid, x, y, z) {
  x = x ?? 0.0;
  y = y ?? 0.0;
  z = z ?? 0.0;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("x", x, 0.0);
  Check.typeOf.number.greaterThanOrEquals("y", y, 0.0);
  Check.typeOf.number.greaterThanOrEquals("z", z, 0.0);
  //>>includeEnd('debug');

  ellipsoid._radii = new Cartesian3(x, y, z);

  ellipsoid._radiiSquared = new Cartesian3(x * x, y * y, z * z);

  ellipsoid._radiiToTheFourth = new Cartesian3(
    x * x * x * x,
    y * y * y * y,
    z * z * z * z,
  );

  ellipsoid._oneOverRadii = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / x,
    y === 0.0 ? 0.0 : 1.0 / y,
    z === 0.0 ? 0.0 : 1.0 / z,
  );

  ellipsoid._oneOverRadiiSquared = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / (x * x),
    y === 0.0 ? 0.0 : 1.0 / (y * y),
    z === 0.0 ? 0.0 : 1.0 / (z * z),
  );

  ellipsoid._minimumRadius = Math.min(x, y, z);

  ellipsoid._maximumRadius = Math.max(x, y, z);

  ellipsoid._centerToleranceSquared = CesiumMath.EPSILON1;

  if (ellipsoid._radiiSquared.z !== 0) {
    ellipsoid._squaredXOverSquaredZ =
      ellipsoid._radiiSquared.x / ellipsoid._radiiSquared.z;
  }
}

/**
 * 在笛卡尔坐标系中由方程
 * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>定义的二次曲面。主要由
 * Cesium用来表示行星体的形状。
 *
 * 通常不直接构造此对象，而是使用提供的
 * 常量之一。
 *
 * @see Ellipsoid.fromCartesian3
 * @see Ellipsoid.WGS84
 * @see Ellipsoid.UNIT_SPHERE
 */
class Ellipsoid {
  /**
   * @param {Cartographic[]} cartographics 地理坐标位置数组。
   * @param {Cartesian3[]} [result] 存储结果的对象。
   * @returns {Cartesian3[]} 修改后的结果参数，如果未提供则返回新的数组实例。
   *
   * @example
   * //转换地理坐标数组并确定其在WGS84椭球上的笛卡尔表示。
   * const positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
   * const cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
   */
  constructor(x, y, z) {
    this._radii = undefined;
    this._radiiSquared = undefined;
    this._radiiToTheFourth = undefined;
    this._oneOverRadii = undefined;
    this._oneOverRadiiSquared = undefined;
    this._minimumRadius = undefined;
    this._maximumRadius = undefined;
    this._centerToleranceSquared = undefined;
    this._squaredXOverSquaredZ = undefined;

    initialize(this, x, y, z);
  }

  /**
   * 获取椭球的半径。
   * @type {Cartesian3}
   * @readonly
   */
  get radii() {
    return this._radii;
  }

  /**
   * 获取椭球的平方半径。
   * @type {Cartesian3}
   * @readonly
   */
  get radiiSquared() {
    return this._radiiSquared;
  }

  /**
   * 获取椭球半径的四次方。
   * @type {Cartesian3}
   * @readonly
   */
  get radiiToTheFourth() {
    return this._radiiToTheFourth;
  }

  /**
   * 获取椭球半径的倒数。
   * @type {Cartesian3}
   * @readonly
   */
  get oneOverRadii() {
    return this._oneOverRadii;
  }

  /**
   * 获取椭球平方半径的倒数。
   * @type {Cartesian3}
   * @readonly
   */
  get oneOverRadiiSquared() {
    return this._oneOverRadiiSquared;
  }

  /**
   * 获取椭球的最小半径。
   * @type {number}
   * @readonly
   */
  get minimumRadius() {
    return this._minimumRadius;
  }

  /**
   * 获取椭球的最大半径。
   * @type {number}
   * @readonly
   */
  get maximumRadius() {
    return this._maximumRadius;
  }

  /**
   * 复制椭球实例。
   *
   * @param {Ellipsoid} ellipsoid 要复制的椭球。
   * @param {Ellipsoid} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Ellipsoid} 被克隆的椭球。（如果椭球未定义则返回undefined）
   */
  static clone(ellipsoid, result) {
    if (!defined(ellipsoid)) {
      return undefined;
    }
    const radii = ellipsoid._radii;

    if (!defined(result)) {
      return new Ellipsoid(radii.x, radii.y, radii.z);
    }

    Cartesian3.clone(radii, result._radii);
    Cartesian3.clone(ellipsoid._radiiSquared, result._radiiSquared);
    Cartesian3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
    Cartesian3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
    Cartesian3.clone(
      ellipsoid._oneOverRadiiSquared,
      result._oneOverRadiiSquared,
    );
    result._minimumRadius = ellipsoid._minimumRadius;
    result._maximumRadius = ellipsoid._maximumRadius;
    result._centerToleranceSquared = ellipsoid._centerToleranceSquared;

    return result;
  }

  /**
   * 从指定x、y和z方向半径的笛卡尔坐标计算椭球。
   *
   * @param {Cartesian3} [cartesian=Cartesian3.ZERO] 椭球在x、y和z方向的半径。
   * @param {Ellipsoid} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Ellipsoid} 新的椭球实例。
   *
   * @exception {DeveloperError} 所有半径分量必须大于或等于零。
   *
   * @see Ellipsoid.WGS84
   * @see Ellipsoid.UNIT_SPHERE
   */
  static fromCartesian3(cartesian, result) {
    if (!defined(result)) {
      result = new Ellipsoid();
    }

    if (!defined(cartesian)) {
      return result;
    }

    initialize(result, cartesian.x, cartesian.y, cartesian.z);
    return result;
  }

  /**
   * 未指定时使用的默认椭球。
   * @type {Ellipsoid}
   * @example
   * Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON;
   *
   * // 阿波罗11号着陆点
   * const position = Cesium.Cartesian3.fromRadians(
   *   0.67416,
   *   23.47315,
   * );
   */
  static get default() {
    return Ellipsoid._default;
  }

  static set default(value) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    //>>includeEnd('debug');

    Ellipsoid._default = value;
    Cartesian3._ellipsoidRadiiSquared = value.radiiSquared;
    Cartographic._ellipsoidOneOverRadii = value.oneOverRadii;
    Cartographic._ellipsoidOneOverRadiiSquared = value.oneOverRadiiSquared;
    Cartographic._ellipsoidCenterToleranceSquared =
      value._centerToleranceSquared;
  }

  /**
   * 复制椭球实例。
   *
   * @param {Ellipsoid} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Ellipsoid} 被克隆的椭球。
   */
  clone(result) {
    return Ellipsoid.clone(this, result);
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Ellipsoid} value 要打包的值。
   * @param {number[]} array 要打包到的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组索引。
   *
   * @returns {number[]} 被打包到的数组
   */
  static pack(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    Cartesian3.pack(value._radii, array, startingIndex);

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Ellipsoid} [result] 存储结果的对象。
   * @returns {Ellipsoid} 修改后的结果参数，如果未提供则返回新的椭球实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    const radii = Cartesian3.unpack(array, startingIndex);
    return Ellipsoid.fromCartesian3(radii, result);
  }

  /**
   * 计算在给定位置上与椭球表面相切的平面法向量。
   *
   * @param {Cartographic} cartographic 要确定大地法向量的地理坐标位置。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的Cartesian3实例。
   */
  geodeticSurfaceNormalCartographic(cartographic, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartographic", cartographic);
    //>>includeEnd('debug');

    const longitude = cartographic.longitude;
    const latitude = cartographic.latitude;
    const cosLatitude = Math.cos(latitude);

    const x = cosLatitude * Math.cos(longitude);
    const y = cosLatitude * Math.sin(longitude);
    const z = Math.sin(latitude);

    if (!defined(result)) {
      result = new Cartesian3();
    }
    result.x = x;
    result.y = y;
    result.z = z;
    return Cartesian3.normalize(result, result);
  }

  /**
   * 计算在给定位置上与椭球表面相切的平面法向量。
   *
   * @param {Cartesian3} cartesian 要确定表面法向量的笛卡尔坐标位置。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的Cartesian3实例，如果找不到法向量则返回undefined。
   */
  geodeticSurfaceNormal(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    if (isNaN(cartesian.x) || isNaN(cartesian.y) || isNaN(cartesian.z)) {
      throw new DeveloperError("cartesian has a NaN component");
    }
    //>>includeEnd('debug');
    if (
      Cartesian3.equalsEpsilon(cartesian, Cartesian3.ZERO, CesiumMath.EPSILON14)
    ) {
      return undefined;
    }
    if (!defined(result)) {
      result = new Cartesian3();
    }
    result = Cartesian3.multiplyComponents(
      cartesian,
      this._oneOverRadiiSquared,
      result,
    );
    return Cartesian3.normalize(result, result);
  }

  /**
   * 将提供的地理坐标转换为笛卡尔表示。
   *
   * @param {Cartographic} cartographic 地理坐标位置。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的Cartesian3实例。
   *
   * @example
   * //创建地理坐标并确定其在WGS84椭球上的笛卡尔表示。
   * const position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
   * const cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
   */
  cartographicToCartesian(cartographic, result) {
    //`cartographic is required` is thrown from geodeticSurfaceNormalCartographic.
    const n = cartographicToCartesianNormal;
    const k = cartographicToCartesianK;
    this.geodeticSurfaceNormalCartographic(cartographic, n);
    Cartesian3.multiplyComponents(this._radiiSquared, n, k);
    const gamma = Math.sqrt(Cartesian3.dot(n, k));
    Cartesian3.divideByScalar(k, gamma, k);
    Cartesian3.multiplyByScalar(n, cartographic.height, n);

    if (!defined(result)) {
      result = new Cartesian3();
    }
    return Cartesian3.add(k, n, result);
  }

  /**
   * Converts the provided array of cartographics to an array of Cartesians.
   *
   * @param {Cartographic[]} cartographics An array of cartographic positions.
   * @param {Cartesian3[]} [result] The object onto which to store the result.
   * @returns {Cartesian3[]} The modified result parameter or a new Array instance if none was provided.
   *
   * @example
   * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
   * const positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
   * const cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
   */
  cartographicArrayToCartesianArray(cartographics, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("cartographics", cartographics);
    //>>includeEnd('debug');

    const length = cartographics.length;
    if (!defined(result)) {
      result = new Array(length);
    } else {
      result.length = length;
    }
    for (let i = 0; i < length; i++) {
      result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
    }
    return result;
  }

  /**
   * 将提供的笛卡尔坐标转换为地理坐标表示。
   * 笛卡尔坐标在椭球中心时为undefined。
   *
   * @param {Cartesian3} cartesian 要转换为地理坐标表示的笛卡尔位置。
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例，如果笛卡尔坐标在椭球中心则返回undefined。
   *
   * @example
   * //创建笛卡尔坐标并确定其在WGS84椭球上的地理坐标表示。
   * const position = new Cesium.Cartesian3(17832.12, 83234.52, 952313.73);
   * const cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
   */
  cartesianToCartographic(cartesian, result) {
    //`cartesian is required.` is thrown from scaleToGeodeticSurface
    const p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);

    if (!defined(p)) {
      return undefined;
    }

    const n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
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
   * 将提供的笛卡尔坐标数组转换为地理坐标数组。
   *
   * @param {Cartesian3[]} cartesians 笛卡尔位置数组。
   * @param {Cartographic[]} [result] 存储结果的对象。
   * @returns {Cartographic[]} 修改后的结果参数，如果未提供则返回新的数组实例。
   *
   * @example
   * //创建笛卡尔坐标数组并确定其在WGS84椭球上的地理坐标表示。
   * const positions = [new Cesium.Cartesian3(17832.12, 83234.52, 952313.73),
   *                  new Cesium.Cartesian3(17832.13, 83234.53, 952313.73),
   *                  new Cesium.Cartesian3(17832.14, 83234.54, 952313.73)]
   * const cartographicPositions = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
   */
  cartesianArrayToCartographicArray(cartesians, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("cartesians", cartesians);
    //>>includeEnd('debug');

    const length = cartesians.length;
    if (!defined(result)) {
      result = new Array(length);
    } else {
      result.length = length;
    }
    for (let i = 0; i < length; ++i) {
      result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
    }
    return result;
  }

  /**
   * 沿大地表面法向量缩放提供的笛卡尔坐标
   * 使其位于此椭球表面上。如果位置
   * 在椭球中心，此函数返回undefined。
   *
   * @param {Cartesian3} cartesian 要缩放的笛卡尔坐标。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的Cartesian3实例，如果位置在中心则返回undefined。
   */
  scaleToGeodeticSurface(cartesian, result) {
    return scaleToGeodeticSurface(
      cartesian,
      this._oneOverRadii,
      this._oneOverRadiiSquared,
      this._centerToleranceSquared,
      result,
    );
  }

  /**
   * 沿地心表面法向量缩放提供的笛卡尔坐标
   * 使其位于此椭球表面上。
   *
   * @param {Cartesian3} cartesian 要缩放的笛卡尔坐标。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新的Cartesian3实例。
   */
  scaleToGeocentricSurface(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian3();
    }

    const positionX = cartesian.x;
    const positionY = cartesian.y;
    const positionZ = cartesian.z;
    const oneOverRadiiSquared = this._oneOverRadiiSquared;

    const beta =
      1.0 /
      Math.sqrt(
        positionX * positionX * oneOverRadiiSquared.x +
          positionY * positionY * oneOverRadiiSquared.y +
          positionZ * positionZ * oneOverRadiiSquared.z,
      );

    return Cartesian3.multiplyByScalar(cartesian, beta, result);
  }

  /**
   * 将笛卡尔X、Y、Z位置转换到椭球缩放空间，将其各分量乘以
   * {@link Ellipsoid#oneOverRadii}的结果。
   *
   * @param {Cartesian3} position 要转换的位置。
   * @param {Cartesian3} [result] 复制结果到的位置，如果为undefined则创建并返回新实例。
   * @returns {Cartesian3} 在缩放空间中表示的位置。返回的实例是
   *          作为参数传递的result（如果不为undefined），否则是新实例。
   */
  transformPositionToScaledSpace(position, result) {
    if (!defined(result)) {
      result = new Cartesian3();
    }

    return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
  }

  /**
   * 将笛卡尔X、Y、Z位置从椭球缩放空间转换回来，将其各分量乘以
   * {@link Ellipsoid#radii}的结果。
   *
   * @param {Cartesian3} position 要转换的位置。
   * @param {Cartesian3} [result] 复制结果到的位置，如果为undefined则创建并返回新实例。
   * @returns {Cartesian3} 在非缩放空间中表示的位置。返回的实例是
   *          作为参数传递的result（如果不为undefined），否则是新实例。
   */
  transformPositionFromScaledSpace(position, result) {
    if (!defined(result)) {
      result = new Cartesian3();
    }

    return Cartesian3.multiplyComponents(position, this._radii, result);
  }

  /**
   * 将此椭球与提供的椭球进行逐分量比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Ellipsoid} [right] 另一个椭球。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return (
      this === right ||
      (defined(right) && Cartesian3.equals(this._radii, right._radii))
    );
  }

  /**
   * 创建表示此椭球的字符串，格式为'(radii.x, radii.y, radii.z)'。
   *
   * @returns {string} 表示此椭球的字符串，格式为'(radii.x, radii.y, radii.z)'。
   */
  toString() {
    return this._radii.toString();
  }

  /**
   * 计算表面法线与z轴相交的点。
   *
   * @param {Cartesian3} position 位置。必须在椭球表面上。
   * @param {number} [buffer = 0.0] 检查点是否在椭球内时从椭球大小中减去的缓冲区。
   *                                在地球情况下，使用常见的地球基准面时，不需要此缓冲区，因为交点总是（相对）非常接近中心。
   *                                在WGS84基准面中，交点位于最大z = +-42841.31151331382（z轴的0.673%）。
   *                                如果长轴/旋转轴的比率大于2的平方根，交点可能在椭球外部。
   * @param {Cartesian3} [result] 复制结果到的笛卡尔坐标，如果为undefined则创建并返回新实例。
   * @returns {Cartesian3 | undefined} 如果交点在椭球内则返回交点，否则返回undefined
   *
   * @exception {DeveloperError} position是必需的。
   * @exception {DeveloperError} 椭球必须是旋转椭球（radii.x == radii.y）。
   * @exception {DeveloperError} Ellipsoid.radii.z必须大于0。
   */
  getSurfaceNormalIntersectionWithZAxis(position, buffer, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("position", position);

    if (
      !CesiumMath.equalsEpsilon(
        this._radii.x,
        this._radii.y,
        CesiumMath.EPSILON15,
      )
    ) {
      throw new DeveloperError(
        "Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)",
      );
    }

    Check.typeOf.number.greaterThan("Ellipsoid.radii.z", this._radii.z, 0);
    //>>includeEnd('debug');

    buffer = buffer ?? 0.0;

    const squaredXOverSquaredZ = this._squaredXOverSquaredZ;

    if (!defined(result)) {
      result = new Cartesian3();
    }

    result.x = 0.0;
    result.y = 0.0;
    result.z = position.z * (1 - squaredXOverSquaredZ);

    if (Math.abs(result.z) >= this._radii.z - buffer) {
      return undefined;
    }

    return result;
  }

  /**
   * 计算表面给定位置处的椭球曲率。
   *
   * @param {Cartesian3} surfacePosition 将计算曲率的椭球表面位置。
   * @param {Cartesian2} [result] 复制结果到的笛卡尔坐标，如果为undefined则创建并返回新实例。
   * @returns {Cartesian2} 在提供位置处的椭球表面局部曲率，方向为东和北。
   *
   * @exception {DeveloperError} position是必需的。
   */
  getLocalCurvature(surfacePosition, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("surfacePosition", surfacePosition);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian2();
    }

    const primeVerticalEndpoint = this.getSurfaceNormalIntersectionWithZAxis(
      surfacePosition,
      0.0,
      scratchEndpoint,
    );
    const primeVerticalRadius = Cartesian3.distance(
      surfacePosition,
      primeVerticalEndpoint,
    );
    // meridional radius = (1 - e^2) * primeVerticalRadius^3 / a^2
    // where 1 - e^2 = b^2 / a^2,
    // so meridional = b^2 * primeVerticalRadius^3 / a^4
    //   = (b * primeVerticalRadius / a^2)^2 * primeVertical
    const radiusRatio =
      (this.minimumRadius * primeVerticalRadius) / this.maximumRadius ** 2;
    const meridionalRadius = primeVerticalRadius * radiusRatio ** 2;

    return Cartesian2.fromElements(
      1.0 / primeVerticalRadius,
      1.0 / meridionalRadius,
      result,
    );
  }

  /**
   * 使用Gauss-Legendre 10阶求积计算椭球表面矩形面积的近似值。
   *
   * @param {Rectangle} rectangle 用于计算表面面积的矩形。
   * @returns {number} 此椭球表面上矩形的近似面积。
   */
  surfaceArea(rectangle) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');
    const minLongitude = rectangle.west;
    let maxLongitude = rectangle.east;
    const minLatitude = rectangle.south;
    const maxLatitude = rectangle.north;

    while (maxLongitude < minLongitude) {
      maxLongitude += CesiumMath.TWO_PI;
    }

    const radiiSquared = this._radiiSquared;
    const a2 = radiiSquared.x;
    const b2 = radiiSquared.y;
    const c2 = radiiSquared.z;
    const a2b2 = a2 * b2;
    return gaussLegendreQuadrature(minLatitude, maxLatitude, function (lat) {
      // phi represents the angle measured from the north pole
      // sin(phi) = sin(pi / 2 - lat) = cos(lat), cos(phi) is similar
      const sinPhi = Math.cos(lat);
      const cosPhi = Math.sin(lat);
      return (
        Math.cos(lat) *
        gaussLegendreQuadrature(minLongitude, maxLongitude, function (lon) {
          const cosTheta = Math.cos(lon);
          const sinTheta = Math.sin(lon);
          return Math.sqrt(
            a2b2 * cosPhi * cosPhi +
              c2 *
                (b2 * cosTheta * cosTheta + a2 * sinTheta * sinTheta) *
                sinPhi *
                sinPhi,
          );
        })
      );
    });
  }
}

/**
 * 初始化为WGS84标准的椭球实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.WGS84 = Object.freeze(
  new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793),
);

/**
 * 初始化为半径(1.0, 1.0, 1.0)的椭球实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.UNIT_SPHERE = Object.freeze(new Ellipsoid(1.0, 1.0, 1.0));

/**
 * 初始化为月球半径球体的椭球实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.MOON = Object.freeze(
  new Ellipsoid(
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS,
  ),
);

/**
 * 初始化为火星平均半径球体的椭球实例。
 * 来源：https://epsg.io/104905
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.MARS = Object.freeze(new Ellipsoid(3396190.0, 3396190.0, 3376200.0));

Ellipsoid._default = Ellipsoid.WGS84;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Ellipsoid.packedLength = Cartesian3.packedLength;

/**
 * Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.
 * @function
 *
 * @param {Cartesian3} cartesian The Cartesian for which to to determine the geocentric normal.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
 */
Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;

const cartographicToCartesianNormal = new Cartesian3();
const cartographicToCartesianK = new Cartesian3();

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

const scratchEndpoint = new Cartesian3();

const abscissas = [
  0.14887433898163, 0.43339539412925, 0.67940956829902, 0.86506336668898,
  0.97390652851717, 0.0,
];
const weights = [
  0.29552422471475, 0.26926671930999, 0.21908636251598, 0.14945134915058,
  0.066671344308684, 0.0,
];

/**
 * Compute the 10th order Gauss-Legendre Quadrature of the given definite integral.
 *
 * @param {number} a The lower bound for the integration.
 * @param {number} b The upper bound for the integration.
 * @param {EllipsoidRealValuedScalarFunction} func The function to integrate.
 * @returns {number} The value of the integral of the given function over the given domain.
 *
 * @private
 */
function gaussLegendreQuadrature(a, b, func) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("a", a);
  Check.typeOf.number("b", b);
  Check.typeOf.func("func", func);
  //>>includeEnd('debug');

  // The range is half of the normal range since the five weights add to one (ten weights add to two).
  // The values of the abscissas are multiplied by two to account for this.
  const xMean = 0.5 * (b + a);
  const xRange = 0.5 * (b - a);

  let sum = 0.0;
  for (let i = 0; i < 5; i++) {
    const dx = xRange * abscissas[i];
    sum += weights[i] * (func(xMean + dx) + func(xMean - dx));
  }

  // Scale the sum to the range of x.
  sum *= xRange;
  return sum;
}

export default Ellipsoid;
