import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 一种简单的地图投影，其中经度和纬度通过乘以线性映射到 X 和 Y
 * 它们按 {@link Ellipsoid#maximumRadius} 分配。 此投影
 * 通常称为地理、等距矩形、等距圆柱形或板状圆柱形。使用 WGS84 椭球体时，它
 * 也称为 EPSG：4326。
 *
 * @alias GeographicProjection
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default]  ellipsoid.
 *
 * @see WebMercatorProjection
 */
function GeographicProjection(ellipsoid) {
  this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  this._semimajorAxis = this._ellipsoid.maximumRadius;
  this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
}

Object.defineProperties(GeographicProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}。
   *
   * @memberof GeographicProjection.prototype
   *
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
 * 投影一组 {@link Cartographic} 坐标（以弧度为单位）以映射坐标（以米为单位）。
 * X 和 Y 分别是经度和纬度乘以
 * 椭圆体。 Z 是未修改的高度。
 *
 * @param {Cartographic} cartographic 要投影的坐标。
 * @param {Cartesian3} [result] 要将结果复制到的实例。 如果该参数为
 * undefined，则创建并返回一个新实例。
 * @returns {Cartesian3} 投影坐标。 如果 result 参数不是 undefined，则
 * 坐标将复制到那里，并返回该实例。 否则，新实例为
 * created 并返回。
 */
GeographicProjection.prototype.project = function (cartographic, result) {
  // Actually this is the special case of equidistant cylindrical called the plate carree
  const semimajorAxis = this._semimajorAxis;
  const x = cartographic.longitude * semimajorAxis;
  const y = cartographic.latitude * semimajorAxis;
  const z = cartographic.height;

  if (!defined(result)) {
    return new Cartesian3(x, y, z);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 将一组投影的 {@link Cartesian3} 坐标（以米为单位）取消投影到 {@link Cartographic}
 * 坐标，以弧度为单位。 Longitude 和 Latitude 分别是 X 和 Y 坐标。
 * 除以椭球体的最大半径。 Height 是未修改的 Z 坐标。
 *
 * @param {Cartesian3} 笛卡尔 高度 （z） 取消投影的笛卡尔位置，以米为单位。
 * @param {Cartographic} [result] 要将结果复制到其中的实例。 如果该参数为
 * undefined，则创建并返回一个新实例。
 * @returns {Cartographic} 未投影的坐标。 如果 result 参数不是 undefined，则
 * 坐标将复制到那里，并返回该实例。 否则，新实例为
 * created 并返回。
 */
GeographicProjection.prototype.unproject = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required");
  }
  //>>includeEnd('debug');

  const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
  const longitude = cartesian.x * oneOverEarthSemimajorAxis;
  const latitude = cartesian.y * oneOverEarthSemimajorAxis;
  const height = cartesian.z;

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

export default GeographicProjection;
