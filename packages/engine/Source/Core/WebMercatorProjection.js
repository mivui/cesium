// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";

/** @import MapProjection from "./MapProjection.js"; */

/**
 * Google Maps、Bing Maps和大多数ArcGIS Online使用的地图投影，EPSG:3857。此
 * 投影使用WGS84表示的经度和纬度，并使用
 * 球面（而非椭球面）方程将其转换为墨卡托投影。
 *
 * @see GeographicProjection
 *
 * @implements MapProjection
 */
class WebMercatorProjection {
  /**
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 椭球体。
   */
  constructor(ellipsoid) {
    this._ellipsoid = ellipsoid ?? Ellipsoid.WGS84;
    this._semimajorAxis = this._ellipsoid.maximumRadius;
    this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
  }

  /**
   * 获取{@link Ellipsoid}。
   *
   * @type {Ellipsoid}
   * @readonly
   */
  get ellipsoid() {
    return this._ellipsoid;
  }

  /**
   * 将范围在-PI到PI之间的墨卡托角度转换为
   * 范围在-PI/2到PI/2之间的大地纬度。
   *
   * @param {number} mercatorAngle 要转换的角度。
   * @returns {number} 大地纬度（弧度）。
   */
  static mercatorAngleToGeodeticLatitude(mercatorAngle) {
    return CesiumMath.PI_OVER_TWO - 2.0 * Math.atan(Math.exp(-mercatorAngle));
  }

  /**
   * 将弧度表示的大地纬度（范围-PI/2到PI/2）转换为
   * 范围在-PI到PI之间的墨卡托角度。
   *
   * @param {number} latitude 大地纬度（弧度）。
   * @returns {number} 墨卡托角度。
   */
  static geodeticLatitudeToMercatorAngle(latitude) {
    // Clamp the latitude coordinate to the valid Mercator bounds.
    if (latitude > WebMercatorProjection.MaximumLatitude) {
      latitude = WebMercatorProjection.MaximumLatitude;
    } else if (latitude < -WebMercatorProjection.MaximumLatitude) {
      latitude = -WebMercatorProjection.MaximumLatitude;
    }
    const sinLatitude = Math.sin(latitude);
    return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
  }

  /**
   * 将弧度表示的大地椭球坐标转换为等效的Web墨卡托
   * X、Y、Z坐标（以米为单位），并在{@link Cartesian3}中返回。高度
   * 将未经修改地复制到Z坐标。
   *
   * @param {Cartographic} cartographic 大地坐标（弧度）。
   * @param {Cartesian3} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Cartesian3} 等效的Web墨卡托X、Y、Z坐标（以米为单位）。
   */
  project(cartographic, result) {
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
  }

  /**
   * 将以米为单位表示的Web墨卡托X、Y坐标转换为包含
   * 大地椭球坐标的{@link Cartographic}。Z坐标将未经修改地
   * 复制到高度。
   *
   * @param {Cartesian3} cartesian 要反投影的Web墨卡托笛卡尔位置，高度(z)以米为单位。
   * @param {Cartographic} [result] 要将结果复制到的实例，如果应创建新实例则为undefined。
   * @returns {Cartographic} 等效的大地坐标。
   */
  unproject(cartesian, result) {
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
  }
}

/**
 * Web墨卡托（EPSG:3857）投影支持的最大纬度（北纬和南纬）。从技术上讲，墨卡托投影定义为支持任何纬度最高到（但不包括）90度，但由于纬度增加时投影会指数增长，因此提前截止是合理的。这个特定截止值的逻辑（被Google Maps、Bing Maps和Esri采用）是使投影成为正方形，即矩形在X和Y方向上相等。
 *
 * 该常量值通过调用以下方法计算：
 *    WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI)
 *
 * @type {number}
 */
WebMercatorProjection.MaximumLatitude =
  WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);

export default WebMercatorProjection;
