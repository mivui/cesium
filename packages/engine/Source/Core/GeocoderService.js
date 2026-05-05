import Credit from "./Credit.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * @typedef {object} GeocoderService.Result
 * @property {string} displayName 位置的显示名称
 * @property {Rectangle|Cartesian3} destination 位置的边界框
 * @property {object[]} [attributions]
 */

/**
 * 通过外部服务提供地理编码。此类型描述了一个接口，不打算直接使用。
 * @alias GeocoderService
 * @constructor
 *
 * @see BingMapsGeocoderService
 * @see PeliasGeocoderService
 * @see OpenCageGeocoderService
 */
function GeocoderService() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(GeocoderService.prototype, {
  /**
   * 获取地理编码执行后要显示的信用信息。通常用于给地理编码服务署名。
   * @memberof GeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 从地理编码结果属性中解析信用信息（如果存在）。
 * @param {GeocoderService.Result} geocoderResult 地理编码结果
 * @returns {Credit[]|undefined} 如果结果中存在信用信息则返回信用列表，否则返回undefined
 */
GeocoderService.getCreditsFromResult = function (geocoderResult) {
  if (defined(geocoderResult.attributions)) {
    return geocoderResult.attributions.map(Credit.getIonCredit);
  }

  return undefined;
};

/**
 * @function
 *
 * @param {string} query 要发送到地理编码服务的查询
 * @param {GeocodeType} [type=GeocodeType.SEARCH] 要执行的地理编码类型。
 * @returns {Promise<GeocoderService.Result[]>}
 */
GeocoderService.prototype.geocode = DeveloperError.throwInstantiationError;
export default GeocoderService;
