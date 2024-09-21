import Credit from "./Credit.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * @typedef {object} GeocoderService.Result
 * @property {string} displayName 位置的显示名称
 * @property {Rectangle|Cartesian3} destination 位置的边界框
 * @property {object[]} [属性]
 */

/**
 * 通过外部服务提供地理编码。此类型描述接口和
 * 不打算使用。
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
   * 获取要在执行地理代码后显示的信用项。 这通常用于信贷
   * 地理编码器服务。
   * @memberof GeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 解析地理编码器结果属性（如果存在）中的制作者名单。
 * @param {GeocoderService.Result} geocoderResult 地理编码器结果
 * @returns {Credit[]|undefined} 结果中存在的积分列表，否则为 undefined
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
 * @param {string} query 要发送到地理编码器服务的查询
 * @param {GeocodeType} [type=GeocodeType.SEARCH] 要执行的地理编码类型。
 * @returns {Promise<GeocoderService.Result[]>}
 */
GeocoderService.prototype.geocode = DeveloperError.throwInstantiationError;
export default GeocoderService;
