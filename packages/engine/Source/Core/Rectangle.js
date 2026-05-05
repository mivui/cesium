// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";
import Transforms from "./Transforms.js";
import Matrix4 from "./Matrix4.js";

/** @import BoundingSphere from "./BoundingSphere.js"; */

/**
 * 一个以经度和纬度坐标指定的二维区域。
 * @see Packable
 */
class Rectangle {
  /**
   * @param {number} [west=0.0] 最西端经度（弧度），范围 [-Pi, Pi]。
   * @param {number} [south=0.0] 最南端纬度（弧度），范围 [-Pi/2, Pi/2]。
   * @param {number} [east=0.0] 最东端经度（弧度），范围 [-Pi, Pi]。
   * @param {number} [north=0.0] 最北端纬度（弧度），范围 [-Pi/2, Pi/2]。
   */
  constructor(west, south, east, north) {
    /**
     * 最西端经度（弧度），范围 [-Pi, Pi]。
     *
     * @type {number}
     * @default 0.0
     */
    this.west = west ?? 0.0;

    /**
     * 最南端纬度（弧度），范围 [-Pi/2, Pi/2]。
     *
     * @type {number}
     * @default 0.0
     */
    this.south = south ?? 0.0;

    /**
     * 最东端经度（弧度），范围 [-Pi, Pi]。
     *
     * @type {number}
     * @default 0.0
     */
    this.east = east ?? 0.0;

    /**
     * 最北端纬度（弧度），范围 [-Pi/2, Pi/2]。
     *
     * @type {number}
     * @default 0.0
     */
    this.north = north ?? 0.0;
  }

  /**
   * 获取矩形的宽度（弧度）。
   * @type {number}
   * @readonly
   */
  get width() {
    return Rectangle.computeWidth(this);
  }

  /**
   * 获取矩形的高度（弧度）。
   * @type {number}
   * @readonly
   */
  get height() {
    return Rectangle.computeHeight(this);
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Rectangle} value 要打包的值。
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

    array[startingIndex++] = value.west;
    array[startingIndex++] = value.south;
    array[startingIndex++] = value.east;
    array[startingIndex] = value.north;

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Rectangle();
    }

    result.west = array[startingIndex++];
    result.south = array[startingIndex++];
    result.east = array[startingIndex++];
    result.north = array[startingIndex];
    return result;
  }

  /**
   * 计算矩形的宽度（弧度）。
   * @param {Rectangle} rectangle 要计算宽度的矩形。
   * @returns {number} 宽度。
   */
  static computeWidth(rectangle) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');
    let east = rectangle.east;
    const west = rectangle.west;
    if (east < west) {
      east += CesiumMath.TWO_PI;
    }
    return east - west;
  }

  /**
   * 计算矩形的高度（弧度）。
   * @param {Rectangle} rectangle 要计算高度的矩形。
   * @returns {number} 高度。
   */
  static computeHeight(rectangle) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');
    return rectangle.north - rectangle.south;
  }

  /**
   * 根据以度为单位给定的边界经度和纬度创建矩形。
   *
   * @param {number} [west=0.0] 最西端经度（度），范围 [-180.0, 180.0]。
   * @param {number} [south=0.0] 最南端纬度（度），范围 [-90.0, 90.0]。
   * @param {number} [east=0.0] 最东端经度（度），范围 [-180.0, 180.0]。
   * @param {number} [north=0.0] 最北端纬度（度），范围 [-90.0, 90.0]。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   *
   * @example
   * const rectangle = Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
   */
  static fromDegrees(west, south, east, north, result) {
    west = CesiumMath.toRadians(west ?? 0.0);
    south = CesiumMath.toRadians(south ?? 0.0);
    east = CesiumMath.toRadians(east ?? 0.0);
    north = CesiumMath.toRadians(north ?? 0.0);

    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }

    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;

    return result;
  }

  /**
   * 根据以弧度为单位给定的边界经度和纬度创建矩形。
   *
   * @param {number} [west=0.0] 最西端经度（弧度），范围 [-Math.PI, Math.PI]。
   * @param {number} [south=0.0] 最南端纬度（弧度），范围 [-Math.PI/2, Math.PI/2]。
   * @param {number} [east=0.0] 最东端经度（弧度），范围 [-Math.PI, Math.PI]。
   * @param {number} [north=0.0] 最北端纬度（弧度），范围 [-Math.PI/2, Math.PI/2]。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   *
   * @example
   * const rectangle = Cesium.Rectangle.fromRadians(0.0, Math.PI/4, Math.PI/8, 3*Math.PI/4);
   */
  static fromRadians(west, south, east, north, result) {
    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }

    result.west = west ?? 0.0;
    result.south = south ?? 0.0;
    result.east = east ?? 0.0;
    result.north = north ?? 0.0;

    return result;
  }

  /**
   * 创建能包围提供数组中所有位置的最小可能矩形。
   *
   * @param {Cartographic[]} cartographics Cartographic实例列表。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static fromCartographicArray(cartographics, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("cartographics", cartographics);
    //>>includeEnd('debug');

    let west = Number.MAX_VALUE;
    let east = -Number.MAX_VALUE;
    let westOverIDL = Number.MAX_VALUE;
    let eastOverIDL = -Number.MAX_VALUE;
    let south = Number.MAX_VALUE;
    let north = -Number.MAX_VALUE;

    for (let i = 0, len = cartographics.length; i < len; i++) {
      const position = cartographics[i];
      west = Math.min(west, position.longitude);
      east = Math.max(east, position.longitude);
      south = Math.min(south, position.latitude);
      north = Math.max(north, position.latitude);

      const lonAdjusted =
        position.longitude >= 0
          ? position.longitude
          : position.longitude + CesiumMath.TWO_PI;
      westOverIDL = Math.min(westOverIDL, lonAdjusted);
      eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
    }

    if (east - west > eastOverIDL - westOverIDL) {
      west = westOverIDL;
      east = eastOverIDL;

      if (east > CesiumMath.PI) {
        east = east - CesiumMath.TWO_PI;
      }
      if (west > CesiumMath.PI) {
        west = west - CesiumMath.TWO_PI;
      }
    }

    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }

    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  /**
   * 创建能包围提供数组中所有位置的最小可能矩形。
   *
   * @param {Cartesian3[]} cartesians Cartesian实例列表。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 笛卡尔坐标所在的椭球。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static fromCartesianArray(cartesians, ellipsoid, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("cartesians", cartesians);
    //>>includeEnd('debug');
    ellipsoid = ellipsoid ?? Ellipsoid.default;

    let west = Number.MAX_VALUE;
    let east = -Number.MAX_VALUE;
    let westOverIDL = Number.MAX_VALUE;
    let eastOverIDL = -Number.MAX_VALUE;
    let south = Number.MAX_VALUE;
    let north = -Number.MAX_VALUE;

    for (let i = 0, len = cartesians.length; i < len; i++) {
      const position = ellipsoid.cartesianToCartographic(cartesians[i]);
      west = Math.min(west, position.longitude);
      east = Math.max(east, position.longitude);
      south = Math.min(south, position.latitude);
      north = Math.max(north, position.latitude);

      const lonAdjusted =
        position.longitude >= 0
          ? position.longitude
          : position.longitude + CesiumMath.TWO_PI;
      westOverIDL = Math.min(westOverIDL, lonAdjusted);
      eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
    }

    if (east - west > eastOverIDL - westOverIDL) {
      west = westOverIDL;
      east = eastOverIDL;

      if (east > CesiumMath.PI) {
        east = east - CesiumMath.TWO_PI;
      }
      if (west > CesiumMath.PI) {
        west = west - CesiumMath.TWO_PI;
      }
    }

    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }

    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  /**
   * 从边界球创建矩形，忽略高度。
   *
   *
   * @param {BoundingSphere} boundingSphere 边界球。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static fromBoundingSphere(boundingSphere, ellipsoid, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("boundingSphere", boundingSphere);
    //>>includeEnd('debug');

    const center = boundingSphere.center;
    const radius = boundingSphere.radius;

    if (!defined(ellipsoid)) {
      ellipsoid = Ellipsoid.default;
    }

    if (!defined(result)) {
      result = new Rectangle();
    }

    if (Cartesian3.equals(center, Cartesian3.ZERO)) {
      Rectangle.clone(Rectangle.MAX_VALUE, result);
      return result;
    }

    const fromENU = Transforms.eastNorthUpToFixedFrame(
      center,
      ellipsoid,
      fromBoundingSphereMatrixScratch,
    );
    const east = Matrix4.multiplyByPointAsVector(
      fromENU,
      Cartesian3.UNIT_X,
      fromBoundingSphereEastScratch,
    );
    Cartesian3.normalize(east, east);
    const north = Matrix4.multiplyByPointAsVector(
      fromENU,
      Cartesian3.UNIT_Y,
      fromBoundingSphereNorthScratch,
    );
    Cartesian3.normalize(north, north);

    Cartesian3.multiplyByScalar(north, radius, north);
    Cartesian3.multiplyByScalar(east, radius, east);

    const south = Cartesian3.negate(north, fromBoundingSphereSouthScratch);
    const west = Cartesian3.negate(east, fromBoundingSphereWestScratch);

    const positions = fromBoundingSpherePositionsScratch;

    // North
    let corner = positions[0];
    Cartesian3.add(center, north, corner);

    // West
    corner = positions[1];
    Cartesian3.add(center, west, corner);

    // South
    corner = positions[2];
    Cartesian3.add(center, south, corner);

    // East
    corner = positions[3];
    Cartesian3.add(center, east, corner);

    positions[4] = center;

    return Rectangle.fromCartesianArray(positions, ellipsoid, result);
  }

  /**
   * 复制矩形。
   *
   * @param {Rectangle} rectangle 要克隆的矩形。
   * @param {Rectangle} [result] 存储结果的对象，如果应创建新实例则为undefined。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。（如果矩形未定义则返回undefined）
   */
  static clone(rectangle, result) {
    if (!defined(rectangle)) {
      return undefined;
    }

    if (!defined(result)) {
      return new Rectangle(
        rectangle.west,
        rectangle.south,
        rectangle.east,
        rectangle.north,
      );
    }

    result.west = rectangle.west;
    result.south = rectangle.south;
    result.east = rectangle.east;
    result.north = rectangle.north;
    return result;
  }

  /**
   * 逐分量比较两个提供的矩形，如果它们通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Rectangle} [left] 第一个矩形。
   * @param {Rectangle} [right] 第二个矩形。
   * @param {number} [absoluteEpsilon=0] 用于相等性测试的绝对epsilon容差。
   * @returns {boolean} 如果left和right在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equalsEpsilon(left, right, absoluteEpsilon) {
    absoluteEpsilon = absoluteEpsilon ?? 0;

    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left.west - right.west) <= absoluteEpsilon &&
        Math.abs(left.south - right.south) <= absoluteEpsilon &&
        Math.abs(left.east - right.east) <= absoluteEpsilon &&
        Math.abs(left.north - right.north) <= absoluteEpsilon)
    );
  }

  /**
   * 复制此矩形。
   *
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  clone(result) {
    return Rectangle.clone(this, result);
  }

  /**
   * 将此矩形与提供的矩形进行逐分量比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Rectangle} [other] 要比较的矩形。
   * @returns {boolean} 如果矩形相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(other) {
    return Rectangle.equals(this, other);
  }

  /**
   * 比较提供的矩形，如果相等则返回<code>true</code>，
   * 否则返回<code>false</code>。
   *
   * @param {Rectangle} [left] 第一个矩形。
   * @param {Rectangle} [right] 第二个矩形。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>；否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.west === right.west &&
        left.south === right.south &&
        left.east === right.east &&
        left.north === right.north)
    );
  }

  /**
   * 将此矩形与提供的矩形进行逐分量比较，如果在提供的epsilon范围内则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Rectangle} [other] 要比较的矩形。
   * @param {number} [epsilon=0] 用于相等性测试的epsilon。
   * @returns {boolean} 如果矩形在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  equalsEpsilon(other, epsilon) {
    return Rectangle.equalsEpsilon(this, other, epsilon);
  }

  /**
   * 检查矩形的属性，如果不在有效范围内则抛出异常。
   *
   * @param {Rectangle} rectangle 要验证的矩形
   *
   * @exception {DeveloperError} <code>north</code> 必须在区间 [<code>-Pi/2</code>, <code>Pi/2</code>] 内。
   * @exception {DeveloperError} <code>south</code> 必须在区间 [<code>-Pi/2</code>, <code>Pi/2</code>] 内。
   * @exception {DeveloperError} <code>east</code> 必须在区间 [<code>-Pi</code>, <code>Pi</code>] 内。
   * @exception {DeveloperError} <code>west</code> 必须在区间 [<code>-Pi</code>, <code>Pi</code>] 内。
   * @private
   */
  static _validate(rectangle) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);

    const north = rectangle.north;
    Check.typeOf.number.greaterThanOrEquals(
      "north",
      north,
      -CesiumMath.PI_OVER_TWO,
    );
    Check.typeOf.number.lessThanOrEquals(
      "north",
      north,
      CesiumMath.PI_OVER_TWO,
    );

    const south = rectangle.south;
    Check.typeOf.number.greaterThanOrEquals(
      "south",
      south,
      -CesiumMath.PI_OVER_TWO,
    );
    Check.typeOf.number.lessThanOrEquals(
      "south",
      south,
      CesiumMath.PI_OVER_TWO,
    );

    const west = rectangle.west;
    Check.typeOf.number.greaterThanOrEquals("west", west, -Math.PI);
    Check.typeOf.number.lessThanOrEquals("west", west, Math.PI);

    const east = rectangle.east;
    Check.typeOf.number.greaterThanOrEquals("east", east, -Math.PI);
    Check.typeOf.number.lessThanOrEquals("east", east, Math.PI);
    //>>includeEnd('debug');
  }

  /**
   * 计算矩形的西南角。
   *
   * @param {Rectangle} rectangle 要查找角的矩形
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例。
   */
  static southwest(rectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Cartographic(rectangle.west, rectangle.south);
    }
    result.longitude = rectangle.west;
    result.latitude = rectangle.south;
    result.height = 0.0;
    return result;
  }

  /**
   * 计算矩形的西北角。
   *
   * @param {Rectangle} rectangle 要查找角的矩形
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例。
   */
  static northwest(rectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Cartographic(rectangle.west, rectangle.north);
    }
    result.longitude = rectangle.west;
    result.latitude = rectangle.north;
    result.height = 0.0;
    return result;
  }

  /**
   * 计算矩形的东北角。
   *
   * @param {Rectangle} rectangle 要查找角的矩形
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例。
   */
  static northeast(rectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Cartographic(rectangle.east, rectangle.north);
    }
    result.longitude = rectangle.east;
    result.latitude = rectangle.north;
    result.height = 0.0;
    return result;
  }

  /**
   * 计算矩形的东南角。
   *
   * @param {Rectangle} rectangle 要查找角的矩形
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例。
   */
  static southeast(rectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    if (!defined(result)) {
      return new Cartographic(rectangle.east, rectangle.south);
    }
    result.longitude = rectangle.east;
    result.latitude = rectangle.south;
    result.height = 0.0;
    return result;
  }

  /**
   * 计算矩形的中心。
   *
   * @param {Rectangle} rectangle 要查找中心的矩形
   * @param {Cartographic} [result] 存储结果的对象。
   * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的Cartographic实例。
   */
  static center(rectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    let east = rectangle.east;
    const west = rectangle.west;

    if (east < west) {
      east += CesiumMath.TWO_PI;
    }

    const longitude = CesiumMath.negativePiToPi((west + east) * 0.5);
    const latitude = (rectangle.south + rectangle.north) * 0.5;

    if (!defined(result)) {
      return new Cartographic(longitude, latitude);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = 0.0;
    return result;
  }

  /**
   * 计算两个矩形的交集。此函数假设矩形的坐标是经度和纬度（弧度），并考虑同一角度可以用多个值表示以及经度在反子午线的环绕，从而生成正确的交集。对于忽略这些因素并可用于投影坐标的简单交集，请参见 {@link Rectangle.simpleIntersection}。
   *
   * @param {Rectangle} rectangle 要查找交集的矩形
   * @param {Rectangle} otherRectangle 另一个要查找交集的矩形
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle|undefined} 修改后的结果参数，如果未提供则返回新的Rectangle实例，如果没有交集则返回undefined。
   */
  static intersection(rectangle, otherRectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("otherRectangle", otherRectangle);
    //>>includeEnd('debug');

    let rectangleEast = rectangle.east;
    let rectangleWest = rectangle.west;

    let otherRectangleEast = otherRectangle.east;
    let otherRectangleWest = otherRectangle.west;

    if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
      rectangleEast += CesiumMath.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
      otherRectangleEast += CesiumMath.TWO_PI;
    }

    if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
      otherRectangleWest += CesiumMath.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
      rectangleWest += CesiumMath.TWO_PI;
    }

    const west = CesiumMath.negativePiToPi(
      Math.max(rectangleWest, otherRectangleWest),
    );
    const east = CesiumMath.negativePiToPi(
      Math.min(rectangleEast, otherRectangleEast),
    );

    if (
      (rectangle.west < rectangle.east ||
        otherRectangle.west < otherRectangle.east) &&
      east <= west
    ) {
      return undefined;
    }

    const south = Math.max(rectangle.south, otherRectangle.south);
    const north = Math.min(rectangle.north, otherRectangle.north);

    if (south >= north) {
      return undefined;
    }

    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  /**
   * 计算两个矩形的简单交集。与 {@link Rectangle.intersection} 不同，此函数不尝试将角度坐标放入一致的范围或考虑跨越反子午线。因此，它可用于坐标不仅仅是经度和纬度的矩形（即投影坐标）。
   *
   * @param {Rectangle} rectangle 要查找交集的矩形
   * @param {Rectangle} otherRectangle 另一个要查找交集的矩形
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle|undefined} 修改后的结果参数，如果未提供则返回新的Rectangle实例，如果没有交集则返回undefined。
   */
  static simpleIntersection(rectangle, otherRectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("otherRectangle", otherRectangle);
    //>>includeEnd('debug');

    const west = Math.max(rectangle.west, otherRectangle.west);
    const south = Math.max(rectangle.south, otherRectangle.south);
    const east = Math.min(rectangle.east, otherRectangle.east);
    const north = Math.min(rectangle.north, otherRectangle.north);

    if (south >= north || west >= east) {
      return undefined;
    }

    if (!defined(result)) {
      return new Rectangle(west, south, east, north);
    }

    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  /**
   * 计算两个矩形的并集。
   *
   * @param {Rectangle} rectangle 要包含在矩形中的矩形。
   * @param {Rectangle} otherRectangle 要包含在矩形中的另一个矩形。
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static union(rectangle, otherRectangle, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("otherRectangle", otherRectangle);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Rectangle();
    }

    let rectangleEast = rectangle.east;
    let rectangleWest = rectangle.west;

    let otherRectangleEast = otherRectangle.east;
    let otherRectangleWest = otherRectangle.west;

    if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
      rectangleEast += CesiumMath.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
      otherRectangleEast += CesiumMath.TWO_PI;
    }

    if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
      otherRectangleWest += CesiumMath.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
      rectangleWest += CesiumMath.TWO_PI;
    }

    const west = CesiumMath.negativePiToPi(
      Math.min(rectangleWest, otherRectangleWest),
    );
    const east = CesiumMath.negativePiToPi(
      Math.max(rectangleEast, otherRectangleEast),
    );

    result.west = west;
    result.south = Math.min(rectangle.south, otherRectangle.south);
    result.east = east;
    result.north = Math.max(rectangle.north, otherRectangle.north);

    return result;
  }

  /**
   * 通过扩大提供的矩形直到包含提供的地理坐标来计算矩形。
   *
   * @param {Rectangle} rectangle 要扩展的矩形。
   * @param {Cartographic} cartographic 要包含在矩形中的地理坐标。
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static expand(rectangle, cartographic, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("cartographic", cartographic);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Rectangle();
    }

    result.west = Math.min(rectangle.west, cartographic.longitude);
    result.south = Math.min(rectangle.south, cartographic.latitude);
    result.east = Math.max(rectangle.east, cartographic.longitude);
    result.north = Math.max(rectangle.north, cartographic.latitude);

    return result;
  }

  /**
   * 如果地理坐标在矩形上或矩形内则返回true，否则返回false。
   *
   * @param {Rectangle} rectangle 矩形
   * @param {Cartographic} cartographic 要测试的地理坐标。
   * @returns {boolean} 如果提供的地理坐标在矩形内则返回true，否则返回false。
   */
  static contains(rectangle, cartographic) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.object("cartographic", cartographic);
    //>>includeEnd('debug');

    let longitude = cartographic.longitude;
    const latitude = cartographic.latitude;

    const west = rectangle.west;
    let east = rectangle.east;

    if (east < west) {
      east += CesiumMath.TWO_PI;
      if (longitude < 0.0) {
        longitude += CesiumMath.TWO_PI;
      }
    }
    return (
      (longitude > west ||
        CesiumMath.equalsEpsilon(longitude, west, CesiumMath.EPSILON14)) &&
      (longitude < east ||
        CesiumMath.equalsEpsilon(longitude, east, CesiumMath.EPSILON14)) &&
      latitude >= rectangle.south &&
      latitude <= rectangle.north
    );
  }

  /**
   * 对矩形进行采样，使其包含适用于传递给{@link BoundingSphere#fromPoints}的笛卡尔点列表。采样是必要的，以考虑覆盖两极或跨越赤道的矩形。
   *
   * @param {Rectangle} rectangle 要子采样的矩形。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 要使用的椭球。
   * @param {number} [surfaceHeight=0.0] 矩形高于椭球的高度。
   * @param {Cartesian3[]} [result] 存储结果的笛卡尔数组。
   * @returns {Cartesian3[]} 修改后的结果参数，如果未提供则返回新的笛卡尔实例数组。
   */
  static subsample(rectangle, ellipsoid, surfaceHeight, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    //>>includeEnd('debug');

    ellipsoid = ellipsoid ?? Ellipsoid.default;
    surfaceHeight = surfaceHeight ?? 0.0;

    if (!defined(result)) {
      result = [];
    }
    let length = 0;

    const north = rectangle.north;
    const south = rectangle.south;
    const east = rectangle.east;
    const west = rectangle.west;

    const lla = subsampleLlaScratch;
    lla.height = surfaceHeight;

    lla.longitude = west;
    lla.latitude = north;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;

    lla.longitude = east;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;

    lla.latitude = south;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;

    lla.longitude = west;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;

    if (north < 0.0) {
      lla.latitude = north;
    } else if (south > 0.0) {
      lla.latitude = south;
    } else {
      lla.latitude = 0.0;
    }

    for (let i = 1; i < 8; ++i) {
      lla.longitude = -Math.PI + i * CesiumMath.PI_OVER_TWO;
      if (Rectangle.contains(rectangle, lla)) {
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
      }
    }

    if (lla.latitude === 0.0) {
      lla.longitude = west;
      result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
      length++;
      lla.longitude = east;
      result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
      length++;
    }
    result.length = length;
    return result;
  }

  /**
   * 从范围[0.0, 1.0]内的归一化坐标计算矩形的子区域。
   *
   * @param {Rectangle} rectangle 要划分子区域的矩形。
   * @param {number} westLerp 西部插值因子，范围[0.0, 1.0]。必须小于或等于eastLerp。
   * @param {number} southLerp 南部插值因子，范围[0.0, 1.0]。必须小于或等于northLerp。
   * @param {number} eastLerp 东部插值因子，范围[0.0, 1.0]。必须大于或等于westLerp。
   * @param {number} northLerp 北部插值因子，范围[0.0, 1.0]。必须大于或等于southLerp。
   * @param {Rectangle} [result] 存储结果的对象。
   * @returns {Rectangle} 修改后的结果参数，如果未提供则返回新的Rectangle实例。
   */
  static subsection(
    rectangle,
    westLerp,
    southLerp,
    eastLerp,
    northLerp,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("rectangle", rectangle);
    Check.typeOf.number.greaterThanOrEquals("westLerp", westLerp, 0.0);
    Check.typeOf.number.lessThanOrEquals("westLerp", westLerp, 1.0);
    Check.typeOf.number.greaterThanOrEquals("southLerp", southLerp, 0.0);
    Check.typeOf.number.lessThanOrEquals("southLerp", southLerp, 1.0);
    Check.typeOf.number.greaterThanOrEquals("eastLerp", eastLerp, 0.0);
    Check.typeOf.number.lessThanOrEquals("eastLerp", eastLerp, 1.0);
    Check.typeOf.number.greaterThanOrEquals("northLerp", northLerp, 0.0);
    Check.typeOf.number.lessThanOrEquals("northLerp", northLerp, 1.0);

    Check.typeOf.number.lessThanOrEquals("westLerp", westLerp, eastLerp);
    Check.typeOf.number.lessThanOrEquals("southLerp", southLerp, northLerp);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Rectangle();
    }

    // This function doesn't use CesiumMath.lerp because it has floating point precision problems
    // when the start and end values are the same but the t changes.

    if (rectangle.west <= rectangle.east) {
      const width = rectangle.east - rectangle.west;
      result.west = rectangle.west + westLerp * width;
      result.east = rectangle.west + eastLerp * width;
    } else {
      const width = CesiumMath.TWO_PI + rectangle.east - rectangle.west;
      result.west = CesiumMath.negativePiToPi(
        rectangle.west + westLerp * width,
      );
      result.east = CesiumMath.negativePiToPi(
        rectangle.west + eastLerp * width,
      );
    }
    const height = rectangle.north - rectangle.south;
    result.south = rectangle.south + southLerp * height;
    result.north = rectangle.south + northLerp * height;

    // Fix floating point precision problems when t = 1
    if (westLerp === 1.0) {
      result.west = rectangle.east;
    }
    if (eastLerp === 1.0) {
      result.east = rectangle.east;
    }
    if (southLerp === 1.0) {
      result.south = rectangle.north;
    }
    if (northLerp === 1.0) {
      result.north = rectangle.north;
    }

    return result;
  }
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Rectangle.packedLength = 4;

const fromBoundingSphereMatrixScratch = new Matrix4();
const fromBoundingSphereEastScratch = new Cartesian3();
const fromBoundingSphereNorthScratch = new Cartesian3();
const fromBoundingSphereWestScratch = new Cartesian3();
const fromBoundingSphereSouthScratch = new Cartesian3();
const fromBoundingSpherePositionsScratch = new Array(5);
for (let n = 0; n < fromBoundingSpherePositionsScratch.length; ++n) {
  fromBoundingSpherePositionsScratch[n] = new Cartesian3();
}

const subsampleLlaScratch = new Cartographic();

/**
 * 可能的最大矩形。
 *
 * @type {Rectangle}
 * @constant
 */
Rectangle.MAX_VALUE = Object.freeze(
  new Rectangle(
    -Math.PI,
    -CesiumMath.PI_OVER_TWO,
    Math.PI,
    CesiumMath.PI_OVER_TWO,
  ),
);
export default Rectangle;
