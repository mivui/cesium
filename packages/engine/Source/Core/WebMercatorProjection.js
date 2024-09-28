import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";

/**
 * Google 地图、Bing 地图和大多数 ArcGIS Online 使用的地图投影，EPSG：3857。 这
 * 投影使用用 WGS84 表示的经度和纬度，并使用
 * 球形（而不是椭球体）方程。
 *
 * @alias WebMercatorProjection
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid.
 *
 * @see GeographicProjection
 */
function WebMercatorProjection(ellipsoid) {
  this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
  this._semimajorAxis = this._ellipsoid.maximumRadius;
  this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
}

Object.defineProperties(WebMercatorProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}。
   *
   * @memberof WebMercatorProjection.prototype
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
 * 将 -PI 到 PI 范围内的墨卡托角转换为大地纬度
 * 在 -PI/2 到 PI/2 范围内。
 *
 * @param {number} mercatorAngle 要转换的角度。
 * @returns {number} 以弧度为单位的大地纬度。
 */
WebMercatorProjection.mercatorAngleToGeodeticLatitude = function (
  mercatorAngle,
) {
  return CesiumMath.PI_OVER_TWO - 2.0 * Math.atan(Math.exp(-mercatorAngle));
};

/**
 * 将 -PI/2 到 PI/2 范围内的弧度（以弧度为单位）转换为墨卡托
 * 角度在 -PI 到 PI 范围内。
 *
 * @param {number} latitude 以弧度为单位的大地纬度。
 * @returns {number} 墨卡托角。
 */
WebMercatorProjection.geodeticLatitudeToMercatorAngle = function (latitude) {
  // Clamp the latitude coordinate to the valid Mercator bounds.
  if (latitude > WebMercatorProjection.MaximumLatitude) {
    latitude = WebMercatorProjection.MaximumLatitude;
  } else if (latitude < -WebMercatorProjection.MaximumLatitude) {
    latitude = -WebMercatorProjection.MaximumLatitude;
  }
  const sinLatitude = Math.sin(latitude);
  return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
};

/**
 * Web 墨卡托支持的最大纬度（北纬和南纬）
 * （EPSG：3857） 预测。 从技术上讲，墨卡托投影是定义的
 * 对于任何纬度，最高可达（但不包括）90 度，但这是有道理的
 * 以更早地切断它，因为它随着纬度的增加呈指数增长。
 * 此特定截止值背后的逻辑，即
 * Google Maps、Bing Maps 和 Esri 是它进行投影
 * 广场。 也就是说，矩形在 X 和 Y 方向上相等。
 *
 * 常量值通过调用来计算：
 * WebMercatorProjection.mercatorAngleToGeodeticLatitude （Math.PI）
 *
 * @type {number}
 */
WebMercatorProjection.MaximumLatitude =
  WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);

/**
 * 将大地椭球坐标（以弧度为单位）转换为等效的 Web 墨卡托
 * X、Y、Z 坐标以米表示，并以 {@link Cartesian3} 返回。 高度
 * 将原封不动地复制到 z坐标。
 *
 * @param {Cartographic} cartographic 以弧度为单位的制图坐标。
 * @param {Cartesian3} [result] 要将结果复制到的实例，如果
 * 应创建新实例。
 * @returns {Cartesian3} 等效的网页墨卡托 X、Y、Z 坐标，单位为米。
 */
WebMercatorProjection.prototype.project = function (cartographic, result) {
  const semimajorAxis = this._semimajorAxis;
  const x = cartographic.longitude * semimajorAxis;
  const y =
    WebMercatorProjection.geodeticLatitudeToMercatorAngle(
      cartographic.latitude,
    ) * semimajorAxis;
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
 * 将 Web 墨卡托 X、Y 坐标（以米表示）转换为 {@link 制图}
 * 包含大地椭球体坐标。 Z 坐标将原封不动地复制到
 *高度。
 *
 * @param {Cartesian3} cartesian Web 墨卡托笛卡尔位置与高度 （z） 展开投影，以米为单位。
 * @param {Cartographic} [result] 要将结果复制到的实例，如果
 * 应创建新实例。
 * @returns {Cartographic} 等效的制图坐标。
 */
WebMercatorProjection.prototype.unproject = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required");
  }
  //>>includeEnd('debug');

  const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
  const longitude = cartesian.x * oneOverEarthSemimajorAxis;
  const latitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(
    cartesian.y * oneOverEarthSemimajorAxis,
  );
  const height = cartesian.z;

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};
export default WebMercatorProjection;
