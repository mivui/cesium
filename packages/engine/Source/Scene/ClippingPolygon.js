import Check from "../Core/Check.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import CesiumMath from "../Core/Math.js";
import PolygonGeometry from "../Core/PolygonGeometry.js";
import Rectangle from "../Core/Rectangle.js";

/**
 * 与 {@link ClippingPlaneCollection} 一起使用的测地线多边形，用于选择性地隐藏模型、3D 图块集或地球中的区域。
 * @alias ClippingPolygon
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Cartesian3[]} options.positions 定义剪切多边形外环的三个或多个笛卡尔坐标的列表。
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
    3
  );
  //>>includeEnd('debug');

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._positions = [...options.positions];
}

Object.defineProperties(ClippingPolygon.prototype, {
  /**
   * 返回多边形中的位置总数，包括任何孔。
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
   * 返回位置的外环。
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
   * 返回在裁剪时用于将多边形投影到曲面上的椭球体。
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
 * @param {ClippingPolygon} polygon 需要克隆的 ClippingPolygon
 * @param {ClippingPolygon} [result] 存储克隆参数的对象。
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
 * 将提供的 ClippingPolygons 与nd returns
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Plane} left 第一个多边形。
 * @param {Plane} right 第二个多边形。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
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
 * 计算一个制图矩形，该矩形包含由位置列表定义的多边形，包括国际日期变更线和极点上的情况。
 *
 * @param {Rectangle} [result] 用于存储结果的对象。
 * @returns {Rectangle} 结果 rectangle
 */
ClippingPolygon.prototype.computeRectangle = function (result) {
  return PolygonGeometry.computeRectangleFromPositions(
    this.positions,
    this.ellipsoid,
    undefined,
    result
  );
};

const scratchRectangle = new Rectangle();
const spherePointScratch = new Cartesian3();
/**
 * 计算一个矩形，其球面范围包含由位置列表定义的多边形，包括国际日期变更线和极点上的情况。
 *
 * @private
 *
 * @param {Rectangle} [result] 用于存储结果的对象。
 * @returns {Rectangle} 具有球形范围的结果矩形。
 */
ClippingPolygon.prototype.computeSphericalExtents = function (result) {
  if (!defined(result)) {
    result = new Rectangle();
  }

  const rectangle = this.computeRectangle(scratchRectangle);

  let spherePoint = Cartographic.toCartesian(
    Rectangle.southwest(rectangle),
    this.ellipsoid,
    spherePointScratch
  );

  // Project into plane with vertical for latitude
  let magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y
  );

  // Use fastApproximateAtan2 for alignment with shader
  let sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  let sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y
  );

  result.south = sphereLatitude;
  result.west = sphereLongitude;

  spherePoint = Cartographic.toCartesian(
    Rectangle.northeast(rectangle),
    this.ellipsoid,
    spherePointScratch
  );

  // Project into plane with vertical for latitude
  magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y
  );

  // Use fastApproximateAtan2 for alignment with shader
  sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y
  );

  result.north = sphereLatitude;
  result.east = sphereLongitude;

  return result;
};

export default ClippingPolygon;
