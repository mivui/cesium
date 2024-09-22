import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";
import Transforms from "./Transforms.js";
import Matrix4 from "./Matrix4.js";

/**
 * 指定为经度和纬度坐标的二维区域。
 *
 * @alias Rectangle
 * @constructor
 *
 * @param {number} [west=0.0] 最西端的经度，以弧度为单位，在 [-Pi， Pi] 范围内。
 * @param {number} [south=0.0] 最南端的纬度，以弧度为单位，在 [-Pi/2， Pi/2] 范围内。
 * @param {number} [east=0.0] 最东的经度，以弧度为单位，在 [-Pi， Pi] 范围内。
 * @param {number} [north=0.0] 最北端的纬度，以弧度为单位，在 [-Pi/2， Pi/2] 范围内。
 *
 * @see Packable
 */
function Rectangle(west, south, east, north) {
  /**
   * [-Pi， Pi] 范围内最西端的弧度经度。
   *
   * @type {number}
   * @default 0.0
   */
  this.west = defaultValue(west, 0.0);

  /**
   * [-Pi/2， Pi/2] 范围内最南端的弧度。
   *
   * @type {number}
   * @default 0.0
   */
  this.south = defaultValue(south, 0.0);

  /**
   * [-Pi， Pi] 范围内最东的弧度经度。
   *
   * @type {number}
   * @default 0.0
   */
  this.east = defaultValue(east, 0.0);

  /**
   * [-Pi/2， Pi/2] 范围内最北的弧度纬度。
   *
   * @type {number}
   * @default 0.0
   */
  this.north = defaultValue(north, 0.0);
}

Object.defineProperties(Rectangle.prototype, {
  /**
   * 获取矩形的宽度（以弧度为单位）。
   * @memberof Rectangle.prototype
   * @type {number}
   * @readonly
   */
  width: {
    get: function () {
      return Rectangle.computeWidth(this);
    },
  },

  /**
   * 获取矩形的高度（以弧度为单位）。
   * @memberof Rectangle.prototype
   * @type {number}
   * @readonly
   */
  height: {
    get: function () {
      return Rectangle.computeHeight(this);
    },
  },
});

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Rectangle.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Rectangle} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Rectangle.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.west;
  array[startingIndex++] = value.south;
  array[startingIndex++] = value.east;
  array[startingIndex] = value.north;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Rectangle} [result] 要在其中存储结果的对象。
 * @returns {Rectangle} 修改后的结果参数或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Rectangle();
  }

  result.west = array[startingIndex++];
  result.south = array[startingIndex++];
  result.east = array[startingIndex++];
  result.north = array[startingIndex];
  return result;
};

/**
 * 以弧度为单位计算矩形的宽度。
 * @param {Rectangle} rectangle 要计算其宽度的矩形。
 * @returns {number} 宽度。
 */
Rectangle.computeWidth = function (rectangle) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  //>>includeEnd('debug');
  let east = rectangle.east;
  const west = rectangle.west;
  if (east < west) {
    east += CesiumMath.TWO_PI;
  }
  return east - west;
};

/**
 * 以弧度为单位计算矩形的高度。
 * @param {Rectangle} rectangle 要计算其高度的矩形。
 * @returns {number} 高度。
 */
Rectangle.computeHeight = function (rectangle) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  //>>includeEnd('debug');
  return rectangle.north - rectangle.south;
};

/**
 * 在给定边界经度和纬度（以度为单位）的情况下创建一个矩形。
 *
 * @param {number} [west=0.0] 最西端的经度，单位为度数，范围在 [-180.0， 180.0] 范围内。
 * @param {number} [south=0.0] 最南端的纬度，以度为单位，范围在 [-90.0， 90.0] 范围内。
 * @param {number} [east=0.0] 最东的经度，在 [-180.0， 180.0] 范围内。
 * @param {number} [north=0.0] 在 [-90.0， 90.0] 范围内最北端的纬度，以度为单位。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数或者一个新的 Rectangle 实例（如果未提供）。
 *
 * @example
 * const rectangle = Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
 */
Rectangle.fromDegrees = function (west, south, east, north, result) {
  west = CesiumMath.toRadians(defaultValue(west, 0.0));
  south = CesiumMath.toRadians(defaultValue(south, 0.0));
  east = CesiumMath.toRadians(defaultValue(east, 0.0));
  north = CesiumMath.toRadians(defaultValue(north, 0.0));

  if (!defined(result)) {
    return new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;

  return result;
};

/**
 * 在给定边界经度和纬度（以弧度为单位）的情况下创建一个矩形。
 *
 * @param {number} [west=0.0] [-Math.PI， Math.PI] 范围内最西端的弧度经度。
 * @param {number} [south=0.0] 在 [-Math.PI/2， Math.PI/2] 范围内最南端的弧度。
 * @param {number} [east=0.0] [-Math.PI， Math.PI] 范围内最东的弧度经度。
 * @param {number} [north=0.0] 在 [-Math.PI/2， Math.PI/2] 范围内最北的弧度。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数或者一个新的 Rectangle 实例（如果未提供）。
 *
 * @example
 * const rectangle = Cesium.Rectangle.fromRadians(0.0, Math.PI/4, Math.PI/8, 3*Math.PI/4);
 */
Rectangle.fromRadians = function (west, south, east, north, result) {
  if (!defined(result)) {
    return new Rectangle(west, south, east, north);
  }

  result.west = defaultValue(west, 0.0);
  result.south = defaultValue(south, 0.0);
  result.east = defaultValue(east, 0.0);
  result.north = defaultValue(north, 0.0);

  return result;
};

/**
 * 创建尽可能小的 Rectangle ，将所提供的数组中的所有位置括起来。
 *
 * @param {Cartographic[]} cartographics 制图实例列表。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.fromCartographicArray = function (cartographics, result) {
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
};

/**
 * 创建尽可能小的 Rectangle ，将所提供的数组中的所有位置括起来。
 *
 * @param {Cartesian3[]} cartesians 数组实例。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 笛卡尔坐标所在的椭球体。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数或新的 Rectangle 实例（如果未提供）。
 */
Rectangle.fromCartesianArray = function (cartesians, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

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
};

const fromBoundingSphereMatrixScratch = new Cartesian3();
const fromBoundingSphereEastScratch = new Cartesian3();
const fromBoundingSphereNorthScratch = new Cartesian3();
const fromBoundingSphereWestScratch = new Cartesian3();
const fromBoundingSphereSouthScratch = new Cartesian3();
const fromBoundingSpherePositionsScratch = new Array(5);
for (let n = 0; n < fromBoundingSpherePositionsScratch.length; ++n) {
  fromBoundingSpherePositionsScratch[n] = new Cartesian3();
}
/**
 * 从边界球体创建一个矩形，忽略高度。
 *
 *
 * @param {BoundingSphere} boundingSphere 边界球体。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数 或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.fromBoundingSphere = function (boundingSphere, ellipsoid, result) {
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
    fromBoundingSphereMatrixScratch
  );
  const east = Matrix4.multiplyByPointAsVector(
    fromENU,
    Cartesian3.UNIT_X,
    fromBoundingSphereEastScratch
  );
  Cartesian3.normalize(east, east);
  const north = Matrix4.multiplyByPointAsVector(
    fromENU,
    Cartesian3.UNIT_Y,
    fromBoundingSphereNorthScratch
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
};

/**
 * 复制Rectangle.
 *
 * @param {Rectangle} rectangle 要克隆的矩形。
 * @param {Rectangle} [result] 存储结果的对象，如果应该创建新实例，则为 undefined。
 * @returns {Rectangle} 修改后的结果参数 或者一个新的 Rectangle 实例（如果未提供）。（如果 rectangle 未定义，则返回 undefined）
 */
Rectangle.clone = function (rectangle, result) {
  if (!defined(rectangle)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Rectangle(
      rectangle.west,
      rectangle.south,
      rectangle.east,
      rectangle.north
    );
  }

  result.west = rectangle.west;
  result.south = rectangle.south;
  result.east = rectangle.east;
  result.north = rectangle.north;
  return result;
};

/**
 * 按组件比较提供的 Rectangles 并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * <code>false</code> 否则。
 *
 * @param {Rectangle} [left] 第一个Rectangle.
 * @param {Rectangle} [right] 第二个 Rectangle.
 * @param {number} [absoluteEpsilon=0] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，<code>false</code>否则。
 */
Rectangle.equalsEpsilon = function (left, right, absoluteEpsilon) {
  absoluteEpsilon = defaultValue(absoluteEpsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.west - right.west) <= absoluteEpsilon &&
      Math.abs(left.south - right.south) <= absoluteEpsilon &&
      Math.abs(left.east - right.east) <= absoluteEpsilon &&
      Math.abs(left.north - right.north) <= absoluteEpsilon)
  );
};

/**
 * 复制Rectangle.
 *
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle} 修改后的结果参数 或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.prototype.clone = function (result) {
  return Rectangle.clone(this, result);
};

/**
 * 将提供的 Rectangle 与此 Rectangle 组件进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Rectangle} [other] 要比较的矩形。
 * @returns {boolean} <code>true</code> 如果 Rectangles 相等, <code>false</code> 否则。
 */
Rectangle.prototype.equals = function (other) {
  return Rectangle.equals(this, other);
};

/**
 * 比较提供的矩形，如果它们相等，则返回 <code>true</code>，
 * <code>false</code> 否则。
 *
 * @param {Rectangle} [left] 第一个Rectangle.
 * @param {Rectangle} [right] 第二个 Rectangle.
 * @returns {boolean} <code>true</code> 如果 left 和 right 相等;否则 <code>false</code>.
 */
Rectangle.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.west === right.west &&
      left.south === right.south &&
      left.east === right.east &&
      left.north === right.north)
  );
};

/**
 * 将提供的 Rectangle 与此 Rectangle 组件进行比较，并返回
 * <code>true</code>，如果它们位于提供的 epsilon 内，
 * <code>false</code> 否则。
 *
 * @param {Rectangle} [other] 要比较的矩形。
 * @param {number} [epsilon=0] 用来检验等式。
 * @returns {boolean} <code>true</code> 如果 Rectangle 位于提供的 epsilon 内，否则 <code>false</code> 。
 */
Rectangle.prototype.equalsEpsilon = function (other, epsilon) {
  return Rectangle.equalsEpsilon(this, other, epsilon);
};

/**
 * 检查 Rectangle 的属性，如果它们不在有效范围内，则抛出 Bracket。
 *
 * @param {Rectangle} rectangle 要验证的矩形
 *
 * @exception {DeveloperError} <code>north</code> 必须在区间 [<code>-Pi/2</code>， <code>Pi/2</code>] 内。
 * @exception {DeveloperError} <code>south</code> 必须在区间 [<code>-Pi/2</code>， <code>Pi/2</code>] 内。
 * @exception {DeveloperError} <code>east</code> 必须在区间 [<code>-Pi</code>， <code>Pi</code>] 内。
 * @exception {DeveloperError} <code>west</code> 必须在区间 [<code>-Pi</code>， <code>Pi</code>] 内。
 */
Rectangle.validate = function (rectangle) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);

  const north = rectangle.north;
  Check.typeOf.number.greaterThanOrEquals(
    "north",
    north,
    -CesiumMath.PI_OVER_TWO
  );
  Check.typeOf.number.lessThanOrEquals("north", north, CesiumMath.PI_OVER_TWO);

  const south = rectangle.south;
  Check.typeOf.number.greaterThanOrEquals(
    "south",
    south,
    -CesiumMath.PI_OVER_TWO
  );
  Check.typeOf.number.lessThanOrEquals("south", south, CesiumMath.PI_OVER_TWO);

  const west = rectangle.west;
  Check.typeOf.number.greaterThanOrEquals("west", west, -Math.PI);
  Check.typeOf.number.lessThanOrEquals("west", west, Math.PI);

  const east = rectangle.east;
  Check.typeOf.number.greaterThanOrEquals("east", east, -Math.PI);
  Check.typeOf.number.lessThanOrEquals("east", east, Math.PI);
  //>>includeEnd('debug');
};

/**
 * 计算矩形的西南角。
 *
 * @param {Rectangle} rectangle 要为其找到角的矩形
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数或者新的制图实例（如果未提供）。
 */
Rectangle.southwest = function (rectangle, result) {
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
};

/**
 * 计算矩形的西北角。
 *
 * @param {Rectangle} rectangle 要为其找到角的矩形
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数或者新的制图实例（如果未提供）。
 */
Rectangle.northwest = function (rectangle, result) {
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
};

/**
 * 计算矩形的东北角。
 *
 * @param {Rectangle} rectangle 要为其找到角的矩形
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数或者新的制图实例（如果未提供）。
 */
Rectangle.northeast = function (rectangle, result) {
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
};

/**
 * 计算矩形的东南角。
 *
 * @param {Rectangle} rectangle 要为其找到角的矩形
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数或者新的制图实例（如果未提供）。
 */
Rectangle.southeast = function (rectangle, result) {
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
};

/**
 * 计算矩形的中心。
 *
 * @param {Rectangle} rectangle 要为其找到中心的矩形
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数或者新的制图实例（如果未提供）。
 */
Rectangle.center = function (rectangle, result) {
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
};

/**
 * 计算两个矩形的交集。 此函数假定矩形的坐标为
 * 纬度和经度（以弧度为单位）并产生正确的交集，同时考虑到
 * 相同的角度可以用多个值表示，并且
 * 反子午线。 对于忽略这些因子且可与投影
 * 坐标，请参阅 {@link Rectangle.simpleIntersection}。
 *
 * @param {Rectangle} rectangle 在 rectangle 上查找交点
 * @param {Rectangle} otherRectangle 另一个矩形，用于查找交集
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle|undefined} 修改后的结果参数, 新的 Rectangle 实例（如果未提供）或 undefined（如果没有交集）。
 */
Rectangle.intersection = function (rectangle, otherRectangle, result) {
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
    Math.max(rectangleWest, otherRectangleWest)
  );
  const east = CesiumMath.negativePiToPi(
    Math.min(rectangleEast, otherRectangleEast)
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
};

/**
 * 计算两个矩形的简单交集。 与 {@link Rectangle.intersection} 不同，此函数
 * 不会尝试将角度坐标置于一致的范围内，也不会考虑与
 * 反子午线。 因此，它可以用于坐标不仅仅是纬度的矩形
 * 和经度（即投影坐标）。
 *
 * @param {Rectangle} rectangle 在 rectangle 上查找交点
 * @param {Rectangle} otherRectangle 另一个矩形，用于查找交集
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle|undefined} 修改后的结果参数，如果未提供，则为新的 Rectangle 实例，如果没有交集，则为 undefined。
 */
Rectangle.simpleIntersection = function (rectangle, otherRectangle, result) {
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
};

/**
 * 计算一个矩形，该矩形是两个矩形的并集。
 *
 * @param {Rectangle} rectangle 要包含在 rectangle 中的矩形。
 * @param {Rectangle} otherRectangle 要包含在矩形中的矩形。
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle} 修改后的结果参数 或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.union = function (rectangle, otherRectangle, result) {
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
    Math.min(rectangleWest, otherRectangleWest)
  );
  const east = CesiumMath.negativePiToPi(
    Math.max(rectangleEast, otherRectangleEast)
  );

  result.west = west;
  result.south = Math.min(rectangle.south, otherRectangle.south);
  result.east = east;
  result.north = Math.max(rectangle.north, otherRectangle.north);

  return result;
};

/**
 * 通过放大提供的矩形来计算矩形，直到它包含提供的制图。
 *
 * @param {Rectangle} rectangle 要扩展的矩形。
 * @param {Cartographic} cartographic 要包含在矩形中的制图。
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle} 修改后的结果参数或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.expand = function (rectangle, cartographic, result) {
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
};

/**
 * 如果制图位于矩形上或矩形内，则返回 true，否则返回 false。
 *
 * @param {Rectangle} rectangle 矩形
 * @param {Cartographic} cartographic 要包含在矩形中的制图。
 * @returns {boolean} true（如果提供的制图位于矩形内），则为 false，否则。
 */
Rectangle.contains = function (rectangle, cartographic) {
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
};

const subsampleLlaScratch = new Cartographic();
/**
 * 对矩形进行采样，使其包含适合传递给的笛卡尔点列表
 * {@link BoundingSphere#fromPoints} 的 BoundingSphere#fromPoints} 中。 需要进行抽样
 * 表示覆盖极点或穿过赤道的矩形。
 *
 * @param {Rectangle} rectangle 要进行子采样的矩形。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 要使用的椭球体。
 * @param {number} [surfaceHeight=0.0] 椭球体上方的高度矩形。
 * @param {Cartesian3[]} [result] 存储结果的笛卡尔数组。
 * @returns {Cartesian3[]} 修改后的结果参数 or a new Array of Cartesians instances if none was provided.
 */
Rectangle.subsample = function (rectangle, ellipsoid, surfaceHeight, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  //>>includeEnd('debug');

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  surfaceHeight = defaultValue(surfaceHeight, 0.0);

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
};

/**
 * 根据 [0.0， 1.0] 范围内的标准化坐标计算矩形的子截面。
 *
 * @param {Rectangle} rectangle 到小节的矩形。
 * @param {number} westLerp 范围 [0.0， 1.0] 内的西插值因子。必须小于或等于 eastLerp。
 * @param {number} southLerp 范围 [0.0， 1.0] 内的南插因子。必须小于或等于 northLerp。
 * @param {number} eastLerp 范围 [0.0， 1.0] 内的东插因子。必须大于或等于 westLerp。
 * @param {number} northLerp 范围 [0.0， 1.0] 内的北插因子。必须大于或等于 southLerp。
 * @param {Rectangle} [result] 要在其上存储结果的对象。
 * @returns {Rectangle} 修改后的结果参数 或者一个新的 Rectangle 实例（如果未提供）。
 */
Rectangle.subsection = function (
  rectangle,
  westLerp,
  southLerp,
  eastLerp,
  northLerp,
  result
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
    result.west = CesiumMath.negativePiToPi(rectangle.west + westLerp * width);
    result.east = CesiumMath.negativePiToPi(rectangle.west + eastLerp * width);
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
};

/**
 * 尽可能大的矩形。
 *
 * @type {Rectangle}
 * @constant
 */
Rectangle.MAX_VALUE = Object.freeze(
  new Rectangle(
    -Math.PI,
    -CesiumMath.PI_OVER_TWO,
    Math.PI,
    CesiumMath.PI_OVER_TWO
  )
);
export default Rectangle;
