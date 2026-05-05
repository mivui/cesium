import Check from "../Core/Check.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import CesiumMath from "../Core/Math.js";
import PolygonGeometry from "../Core/PolygonGeometry.js";
import Rectangle from "../Core/Rectangle.js";

/**
 * 测地多边形，用于与 {@link ClippingPlaneCollection} 配合，选择性地隐藏模型、3D tileset 或地球体中的区域。
 * @alias ClippingPolygon
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3[]} options.positions 定义裁剪多边形外环的三个或更多笛卡尔坐标列表。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default]
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * const polygon = new Cesium.ClippingPolygon({
 *     positions: positions
 * });
 */
function ClippingPolygon(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.positions", options.positions);
  Check.typeOf.number.greaterThanOrEquals(
    "options.positions.length",
    options.positions.length,
    3,
  );
  //>>includeEnd('debug');

  this._ellipsoid = options.ellipsoid ?? Ellipsoid.default;
  this._positions = copyArrayCartesian3(options.positions);

  /**
   * A copy of the input positions.
   *
   * This is used to detect modifications of the positions in
   * <code>coputeRectangle</code>: The rectangle only has
   * to be re-computed when these positions have changed.
   *
   * @type {Cartesian3[]|undefined}
   * @private
   */
  this._cachedPositions = undefined;

  /**
   * A cached version of the rectangle that is computed in
   * <code>computeRectangle</code>.
   *
   * This is only re-computed when the positions have changed, as
   * determined  by comparing the <code>_positions</code> to the
   * <code>_cachedPositions</code>
   *
   * @type {Rectangle|undefined}
   * @private
   */
  this._cachedRectangle = undefined;
}

/**
 * 返回给定数组的深拷贝。
 *
 * 如果输入为 undefined，则返回 <code>undefined</code>。
 *
 * 否则，结果将是给定数组的副本，其中
 * 每个元素都使用 <code>Cartesian3.clone</code> 复制。
 *
 * @param {Cartesian3[]|undefined} input 输入数组
 * @returns {Cartesian3[]|undefined} 副本
 */
function copyArrayCartesian3(input) {
  if (!defined(input)) {
    return undefined;
  }
  const n = input.length;
  const output = Array(n);
  for (let i = 0; i < n; i++) {
    output[i] = Cartesian3.clone(input[i]);
  }
  return output;
}

/**
 * 返回给定数组是否逐分量相等。
 *
 * 当两个数组均为 undefined 时，返回 <code>true</code>。
 * 当仅定义了一个数组，或它们都已定义但长度
 * 不同时，返回 <code>false</code>。
 *
 * 否则，返回数组的对应元素是否
 * 相等（根据 <code>Cartesian3.equals</code>）。
 *
 * @param {Cartesian3[]|undefined} a 第一个数组
 * @param {Cartesian3[]|undefined} b 第二个数组
 * @returns {boolean} 数组是否相等
 */
function equalsArrayCartesian3(a, b) {
  if (!defined(a) && !defined(b)) {
    return true;
  }
  if (defined(a) !== defined(b)) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const ca = a[i];
    const cb = b[i];
    if (!Cartesian3.equals(ca, cb)) {
      return false;
    }
  }
  return true;
}

Object.defineProperties(ClippingPolygon.prototype, {
  /**
   * 返回多边形中的位置总数，包括任何孔洞。
   *
   * @memberof ClippingPolygon.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._positions.length;
    },
  },
  /**
   * 返回外环位置。
   *
   * @memberof ClippingPolygon.prototype
   * @type {Cartesian3[]}
   * @readonly
   */
  positions: {
    get: function () {
      return this._positions;
    },
  },
  /**
   * 返回用于在裁剪时将多边形投影到表面的椭球体。
   *
   * @memberof ClippingPolygon.prototype
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
});

/**
 * 克隆 ClippingPolygon 而不设置其所有权。
 * @param {ClippingPolygon} polygon 要克隆的 ClippingPolygon
 * @param {ClippingPolygon} [result] 用于存储克隆参数的对象。
 * @returns {ClippingPolygon} 输入 ClippingPolygon 的克隆
 */
ClippingPolygon.clone = function (polygon, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new ClippingPolygon({
      positions: polygon.positions,
      ellipsoid: polygon.ellipsoid,
    });
  }

  result._ellipsoid = polygon.ellipsoid;
  result._positions.length = 0;
  result._positions.push(...polygon.positions);
  return result;
};

/**
 * 比较提供的 ClippingPolygon，如果
 * 相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {ClippingPolygon} left 第一个多边形。
 * @param {ClippingPolygon} right 第二个多边形。
 * @returns {boolean} 如果 left 和 right 相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
ClippingPolygon.equals = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.ellipsoid.equals(right.ellipsoid) && left.positions === right.positions
  );
};

/**
 * 计算包围位置列表定义的多边形的矩形，包括跨越国际日期变更线和极点的情况。
 *
 * @param {Rectangle} [result] 用于存储结果的对象。
 * @returns {Rectangle} 结果矩形
 */
ClippingPolygon.prototype.computeRectangle = function (result) {
  if (equalsArrayCartesian3(this._positions, this._cachedPositions)) {
    return Rectangle.clone(this._cachedRectangle, result);
  }
  const rectangle = PolygonGeometry.computeRectangleFromPositions(
    this.positions,
    this.ellipsoid,
    undefined,
    result,
  );
  this._cachedPositions = copyArrayCartesian3(this._positions);
  this._cachedRectangle = Rectangle.clone(rectangle);
  return rectangle;
};

const scratchRectangle = new Rectangle();
const spherePointScratch = new Cartesian3();
/**
 * Computes a rectangle with the spherical extents that encloses the polygon defined by the list of positions, including cases over the international date line and the poles.
 *
 * @private
 *
 * @param {Rectangle} [result] An object in which to store the result.
 * @returns {Rectangle} The result rectangle with spherical extents.
 */
ClippingPolygon.prototype.computeSphericalExtents = function (result) {
  if (!defined(result)) {
    result = new Rectangle();
  }

  const rectangle = this.computeRectangle(scratchRectangle);

  let spherePoint = Cartographic.toCartesian(
    Rectangle.southwest(rectangle),
    this.ellipsoid,
    spherePointScratch,
  );

  // Project into plane with vertical for latitude
  let magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y,
  );

  // Use fastApproximateAtan2 for alignment with shader
  let sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  let sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y,
  );

  result.south = sphereLatitude;
  result.west = sphereLongitude;

  spherePoint = Cartographic.toCartesian(
    Rectangle.northeast(rectangle),
    this.ellipsoid,
    spherePointScratch,
  );

  // Project into plane with vertical for latitude
  magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y,
  );

  // Use fastApproximateAtan2 for alignment with shader
  sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y,
  );

  result.north = sphereLatitude;
  result.east = sphereLongitude;

  return result;
};

export default ClippingPolygon;
