import Credit from "./Credit.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * @typedef {object} GeocoderService.Result
 * @property {string} displayName The display name for a location
 * @property {Rectangle|Cartesian3} destination The bounding box for a location
 * @property {object[]} [attributions]
 */

/**
 * Provides geocoding through an external service. This type describes an interface and
 * is not intended to be used.
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
   * 获取要在执行地理代码后显示的信用项。这通常用于信贷
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
 * Parses credits from the geocoder result attributions, if present.
 * @param {GeocoderService.Result} geocoderResult The geocoder result
 * @returns {Credit[]|undefined} A list of credits if present in the result, otherwise undefined
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
 * @param {GeocodeType} [type=GeocodeType.SEARCH] The type of geocode to perform.
 * @returns {Promise<GeocoderService.Result[]>}
 */
GeocoderService.prototype.geocode = DeveloperError.throwInstantiationError;
export default GeocoderService;
