import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

function initialize(ellipsoid, x, y, z) {
  x = defaultValue(x, 0.0);
  y = defaultValue(y, 0.0);
  z = defaultValue(z, 0.0);

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
    z * z * z * z
  );

  ellipsoid._oneOverRadii = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / x,
    y === 0.0 ? 0.0 : 1.0 / y,
    z === 0.0 ? 0.0 : 1.0 / z
  );

  ellipsoid._oneOverRadiiSquared = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / (x * x),
    y === 0.0 ? 0.0 : 1.0 / (y * y),
    z === 0.0 ? 0.0 : 1.0 / (z * z)
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
 * 由方程
 * <code>（x / a）^2 + （y / b）^2 + （z / c）^2 = 1</code>. 主要用途
 * 由 Cesium 表示行星体的形状。
 *
 * 而不是直接构造此对象，而是提供的
 * 常量。
 * @alias 椭球体
 * @constructor
 *
 * @param {number} [x=0] x 方向的半径。
 * @param {number} [y=0] y 方向的半径。
 * @param {number} [z=0] z 方向的半径。
 *
 * @exception {DeveloperError} All radii components must be greater than or equal to zero.
 *
 * @see Ellipsoid.fromCartesian3
 * @see Ellipsoid.WGS84
 * @see Ellipsoid.UNIT_SPHERE
 */
function Ellipsoid(x, y, z) {
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

Object.defineProperties(Ellipsoid.prototype, {
  /**
   * Gets the radii of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radii: {
    get: function () {
      return this._radii;
    },
  },
  /**
   * 获取椭球体的平方半径。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radiiSquared: {
    get: function () {
      return this._radiiSquared;
    },
  },
  /**
   * 获取椭球体的半径提高到四次方。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radiiToTheFourth: {
    get: function () {
      return this._radiiToTheFourth;
    },
  },
  /**
   * 在椭球体的半径上获取 1。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  oneOverRadii: {
    get: function () {
      return this._oneOverRadii;
    },
  },
  /**
   * 在椭球体的平方半径上获取 1。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  oneOverRadiiSquared: {
    get: function () {
      return this._oneOverRadiiSquared;
    },
  },
  /**
   * 获取椭球体的最小半径。
   * @memberof Ellipsoid.prototype
   * @type {number}
   * @readonly
   */
  minimumRadius: {
    get: function () {
      return this._minimumRadius;
    },
  },
  /**
   * 获取椭球体的最大半径。
   * @memberof Ellipsoid.prototype
   * @type {number}
   * @readonly
   */
  maximumRadius: {
    get: function () {
      return this._maximumRadius;
    },
  },
});

/**
 * 复制 Ellipsoid 实例。
 *
 * @param {Ellipsoid} ellipsoid 要复制的椭球体。
 * @param {Ellipsoid} [result] 存储结果的对象，如果新的、
 * 实例。
 * @returns {Ellipsoid} 克隆的 Ellipsoid。（如果省略球体为 undefined，则返回 undefined）
 */
Ellipsoid.clone = function (ellipsoid, result) {
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
  Cartesian3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
  result._minimumRadius = ellipsoid._minimumRadius;
  result._maximumRadius = ellipsoid._maximumRadius;
  result._centerToleranceSquared = ellipsoid._centerToleranceSquared;

  return result;
};

/**
 * 根据指定 x、y 和 z 方向半径的笛卡尔计算椭球体。
 *
 * @param {Cartesian3} [cartesian=Cartesian3.ZERO] 椭球体在 x、y 和 z 方向上的半径。
 * @param {Ellipsoid} [result] 存储结果的对象，如果新的、
 * 实例。
 * @returns {Ellipsoid} 一个新的 Ellipsoid 实例。
 *
 * @exception {DeveloperError} All radii components must be greater than or equal to zero.
 *
 * @see Ellipsoid.WGS84
 * @see Ellipsoid.UNIT_SPHERE
 */
Ellipsoid.fromCartesian3 = function (cartesian, result) {
  if (!defined(result)) {
    result = new Ellipsoid();
  }

  if (!defined(cartesian)) {
    return result;
  }

  initialize(result, cartesian.x, cartesian.y, cartesian.z);
  return result;
};

/**
 * 初始化为 WGS84 标准的 Ellipsoid 实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.WGS84 = Object.freeze(
  new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793)
);

/**
 * 初始化为半径 （1.0， 1.0， 1.0） 的 Ellipsoid 实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.UNIT_SPHERE = Object.freeze(new Ellipsoid(1.0, 1.0, 1.0));

/**
 * 初始化为具有月球半径的球体的 Ellipsoid 实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.MOON = Object.freeze(
  new Ellipsoid(
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS
  )
);

Ellipsoid._default = Ellipsoid.WGS84;
Object.defineProperties(Ellipsoid, {
  /**
   * 未另行指定时使用的默认椭球体。
   * @memberof Ellipsoid
   * @type {Ellipsoid}
   * @example
   * Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON;
   *
   * // Apollo 11 landing site
   * const position = Cesium.Cartesian3.fromRadians(
   *   0.67416,
   *   23.47315,
   * );
   */
  default: {
    get: function () {
      return Ellipsoid._default;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      Ellipsoid._default = value;
      Cartesian3._ellipsoidRadiiSquared = value.radiiSquared;
      Cartographic._ellipsoidOneOverRadii = value.oneOverRadii;
      Cartographic._ellipsoidOneOverRadiiSquared = value.oneOverRadiiSquared;
      Cartographic._ellipsoidCenterToleranceSquared =
        value._centerToleranceSquared;
    },
  },
});

/**
 * 复制 Ellipsoid 实例。
 *
 * @param {Ellipsoid} [result] 存储结果的对象，如果新的、
 * 实例。
 * @returns {Ellipsoid} 克隆的 Ellipsoid。
 */
Ellipsoid.prototype.clone = function (result) {
  return Ellipsoid.clone(this, result);
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Ellipsoid.packedLength = Cartesian3.packedLength;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Ellipsoid} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Ellipsoid.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  Cartesian3.pack(value._radii, array, startingIndex);

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Ellipsoid} [result] 要在其中存储结果的对象。
 * @returns {Ellipsoid} 修改后的结果参数 或者一个新的 Ellipsoid 实例（如果未提供）。
 */
Ellipsoid.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const radii = Cartesian3.unpack(array, startingIndex);
  return Ellipsoid.fromCartesian3(radii, result);
};

/**
 * 计算从此椭球体中心指向提供的笛卡尔位置的单位向量。
 * @function
 *
 * @param {Cartesian3} 笛卡尔 用于确定地心法线的笛卡尔。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供）。
 */
Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;

/**
 * 计算在给定位置处与椭球体表面相切的平面的法线。
 *
 * @param {Cartographic} 制图：用于确定大地法线的制图位置。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供）。
 */
Ellipsoid.prototype.geodeticSurfaceNormalCartographic = function (
  cartographic,
  result
) {
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
};

/**
 * 计算在给定位置处与椭球体表面相切的平面的法线。
 *
 * @param {Cartesian3} 笛卡尔 用于确定表面法线的笛卡尔位置。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供），则为 undefined（如果未找到法线）。
 */
Ellipsoid.prototype.geodeticSurfaceNormal = function (cartesian, result) {
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
    result
  );
  return Cartesian3.normalize(result, result);
};

const cartographicToCartesianNormal = new Cartesian3();
const cartographicToCartesianK = new Cartesian3();

/**
 * 将提供的制图转换为笛卡尔表示。
 *
 * @param {Cartographic} cartographic 制图位置。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供）。
 *
 * @example
 * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
 * const position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
 * const cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
 */
Ellipsoid.prototype.cartographicToCartesian = function (cartographic, result) {
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
};

/**
 * 将提供的制图数组转换为笛卡尔数组。
 *
 * @param {Cartographic[]} cartographics 制图位置数组。
 * @param {Cartesian3[]} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3[]} 修改后的结果参数或新的 Array 实例（如果未提供）。
 *
 * @example
 * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
 * const positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
 *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
 *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
 * const cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
 */
Ellipsoid.prototype.cartographicArrayToCartesianArray = function (
  cartographics,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartographics", cartographics);
  //>>includeEnd('debug')

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
};

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

/**
 * 将提供的笛卡尔表示转换为制图表示。
 * 笛卡尔坐标在椭球体的中心未定义。
 *
 * @param {Cartesian3} 笛卡尔 要转换为制图表示的笛卡尔位置。
 * @param {Cartographic} [result] 要在其上存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数，如果未提供任何实例，则为新制图实例，如果笛卡尔位于椭球体的中心，则为 undefined。
 *
 * @example
 * //Create a Cartesian and determine it's Cartographic representation on a WGS84 ellipsoid.
 * const position = new Cesium.Cartesian3(17832.12, 83234.52, 952313.73);
 * const cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
 */
Ellipsoid.prototype.cartesianToCartographic = function (cartesian, result) {
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
};

/**
 * 将提供的笛卡尔数组转换为制图数组。
 *
 * @param {Cartesian3[]} 笛卡尔位置数组。
 * @param {Cartographic[]} [result] 要在其上存储结果的对象。
 * @returns {Cartographic[]} 修改后的结果参数或新的 Array 实例（如果未提供）。
 *
 * @example
 * //Create an array of Cartesians and determine their Cartographic representation on a WGS84 ellipsoid.
 * const positions = [new Cesium.Cartesian3(17832.12, 83234.52, 952313.73),
 *                  new Cesium.Cartesian3(17832.13, 83234.53, 952313.73),
 *                  new Cesium.Cartesian3(17832.14, 83234.54, 952313.73)]
 * const cartographicPositions = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
 */
Ellipsoid.prototype.cartesianArrayToCartographicArray = function (
  cartesians,
  result
) {
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
};

/**
 * 沿大地测量表面法线缩放提供的笛卡尔位置
 * 使其位于此椭球体的表面上。 如果位置为
 * 在椭球体的中心，此函数返回 undefined。
 *
 * @param {Cartesian3} 笛卡尔 刻度的笛卡尔位置。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供，则为新的 Cartesian3 实例，如果位置位于中心，则为 undefined。
 */
Ellipsoid.prototype.scaleToGeodeticSurface = function (cartesian, result) {
  return scaleToGeodeticSurface(
    cartesian,
    this._oneOverRadii,
    this._oneOverRadiiSquared,
    this._centerToleranceSquared,
    result
  );
};

/**
 * 沿地心表面法线缩放提供的笛卡尔位置
 * 使其位于此椭球体的表面上。
 *
 * @param {Cartesian3} 笛卡尔 刻度的笛卡尔位置。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供）。
 */
Ellipsoid.prototype.scaleToGeocentricSurface = function (cartesian, result) {
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
        positionZ * positionZ * oneOverRadiiSquared.z
    );

  return Cartesian3.multiplyByScalar(cartesian, beta, result);
};

/**
 * 通过乘法将笛卡尔 X、Y、Z 位置转换为椭球标度空间
 * 其组件由 {@link Ellipsoid#oneOverRadii} 的结果。
 *
 * @param {Cartesian3} position 要转换的位置。
 * @param {Cartesian3} [result] 将结果复制到的位置，或 undefined 创建 和
 * 返回一个新实例。
 * @returns {Cartesian3} 在缩放空间中表示的位置。 返回的实例是
 * 如果它不是 undefined，则作为 result 参数传递的，或者它是它的新实例。
 */
Ellipsoid.prototype.transformPositionToScaledSpace = function (
  position,
  result
) {
  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
};

/**
 * 通过乘以
 * 其分量由 {@link Ellipsoid#radii} 的结果。
 *
 * @param {Cartesian3} position 要转换的位置。
 * @param {Cartesian3} [result] 将结果复制到的位置，或 undefined 创建 和
 * 返回一个新实例。
 * @returns {Cartesian3} 在未缩放空间中表示的位置。 返回的实例是
 * 如果它不是 undefined，则作为 result 参数传递的，或者它是它的新实例。
 */
Ellipsoid.prototype.transformPositionFromScaledSpace = function (
  position,
  result
) {
  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.multiplyComponents(position, this._radii, result);
};

/**
 * 将此 Ellipsoid 与提供的 Ellipsoid 组件进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Ellipsoid} [right] 另一个椭球体。
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
Ellipsoid.prototype.equals = function (right) {
  return (
    this === right ||
    (defined(right) && Cartesian3.equals(this._radii, right._radii))
  );
};

/**
 * 创建一个字符串，表示此椭球体，格式为 '（radii.x， radii.y， radii.z）'。
 *
 * @returns {string} 表示此椭球体的字符串，格式为 '（radii.x， radii.y， radii.z）'。
 */
Ellipsoid.prototype.toString = function () {
  return this._radii.toString();
};

/**
 * 计算一个点，该点是曲面法线与 z 轴的交点。
 *
 * @param {Cartesian3} 定位位置。必须位于椭球体的表面上。
 * @param {number} [buffer = 0.0] 检查点是否在椭球体内时要从椭球大小中减去的缓冲区。
 * 在地球情况下，对于公共地球基准面，不需要此缓冲区，因为交点总是（相对）非常靠近中心。
 * 在 WGS84 基准面中，交点位于最大 z = +-42841.31151331382（z 轴的 0.673%）处。
 * 如果 MajorAxis / AxisOfRotation 的比率大于 2 的平方根，则交点可能位于椭球体之外
 * @param {Cartesian3} [result] 要将结果复制到的笛卡尔坐标，或 undefined 来创建 和
 * 返回一个新实例。
 * @returns {Cartesian3 | undefined} 如果交点位于椭球体内部，则为 undefined，否则为 undefined
 *
 * @exception {DeveloperError} 位置是必需的。
 * @exception {DeveloperError} 椭球体必须是公转的椭球体 （radii.x == radii.y）。
 * @exception {DeveloperError} Ellipsoid.radii.z 必须大于 0。
 */
Ellipsoid.prototype.getSurfaceNormalIntersectionWithZAxis = function (
  position,
  buffer,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("position", position);

  if (
    !CesiumMath.equalsEpsilon(
      this._radii.x,
      this._radii.y,
      CesiumMath.EPSILON15
    )
  ) {
    throw new DeveloperError(
      "Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)"
    );
  }

  Check.typeOf.number.greaterThan("Ellipsoid.radii.z", this._radii.z, 0);
  //>>includeEnd('debug');

  buffer = defaultValue(buffer, 0.0);

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
};

const scratchEndpoint = new Cartesian3();

/**
 * 计算曲面上给定位置的椭球体曲率。
 *
 * @param {Cartesian3} surfacePosition 椭球体曲面上将计算曲率的位置。
 * @param {Cartesian2} [result] 要将结果复制到的笛卡尔坐标，或 undefined 以创建并返回新实例。
 * @returns {笛卡尔2} 椭球体表面在提供位置（东向和北向）的局部曲率。
 *
 * @exception {DeveloperError} position is required.
 */
Ellipsoid.prototype.getLocalCurvature = function (surfacePosition, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("surfacePosition", surfacePosition);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian2();
  }

  const primeVerticalEndpoint = this.getSurfaceNormalIntersectionWithZAxis(
    surfacePosition,
    0.0,
    scratchEndpoint
  );
  const primeVerticalRadius = Cartesian3.distance(
    surfacePosition,
    primeVerticalEndpoint
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
    result
  );
};

const abscissas = [
  0.14887433898163,
  0.43339539412925,
  0.67940956829902,
  0.86506336668898,
  0.97390652851717,
  0.0,
];
const weights = [
  0.29552422471475,
  0.26926671930999,
  0.21908636251598,
  0.14945134915058,
  0.066671344308684,
  0.0,
];

/**
 * Compute the 10th order Gauss-Legendre Quadrature of the given definite integral.
 *
 * @param {number} a The lower bound for the integration.
 * @param {number} b The upper bound for the integration.
 * @param {Ellipsoid~RealValuedScalarFunction} func The function to integrate.
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

/**
 * 实值标量函数。
 * @callback 椭球体~RealValuedScalarFunction
 *
 * @param {number} x 用于计算函数的值。
 * @returns {number} 函数在 x 处的值。
 *
 * @private
 */

/**
 * 计算矩形在椭球体表面上的表面积的近似值
 * Gauss-Legendre 10 阶求积。
 *
 * @param {Rectangle} rectangle 用于计算表面积的矩形。
 * @returns {number} 矩形在这个椭球体表面上的近似面积。
 */
Ellipsoid.prototype.surfaceArea = function (rectangle) {
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
              sinPhi
        );
      })
    );
  });
};

export default Ellipsoid;
