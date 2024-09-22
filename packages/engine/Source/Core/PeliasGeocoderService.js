import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import GeocodeType from "./GeocodeType.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";

/**
 * 通过 {@link https://pelias.io/|Pelias} 服务器。
 * @alias PeliasGeocoderService
 * @constructor
 *
 * @param {Resource|string} url Pelias 服务器的终端节点。
 *
 * @example
 * // Configure a Viewer to use the Pelias server hosted by https://geocode.earth/
 * const viewer = new Cesium.Viewer('cesiumContainer', {
 *   geocoder: new Cesium.PeliasGeocoderService(new Cesium.Resource({
 *     url: 'https://api.geocode.earth/v1/',
 *       queryParameters: {
 *         api_key: '<Your geocode.earth API key>'
 *     }
 *   }))
 * });
 */
function PeliasGeocoderService(url) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  this._url = Resource.createIfNeeded(url);
  this._url.appendForwardSlash();
}

Object.defineProperties(PeliasGeocoderService.prototype, {
  /**
   * 用于访问 Pelias 端点的 Resource。
   * @type {Resource}
   * @memberof PeliasGeocoderService.prototype
   * @readonly
   */
  url: {
    get: function () {
      return this._url;
    },
  },
  /**
   * 获取要在执行地理代码后显示的信用项。这通常用于信贷
   * 地理编码器服务。
   * @memberof PeliasGeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * @function
 *
 * @param {string} query 要发送到地理编码器服务的查询
 * @param {GeocodeType} [type=GeocodeType.SEARCH] 要执行的地理编码类型。
 * @returns {Promise<GeocoderService.Result[]>}
 */
PeliasGeocoderService.prototype.geocode = async function (query, type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._url.getDerivedResource({
    url: type === GeocodeType.AUTOCOMPLETE ? "autocomplete" : "search",
    queryParameters: {
      text: query,
    },
  });

  return resource.fetchJson().then(function (results) {
    return results.features.map(function (resultObject) {
      let destination;
      const bboxDegrees = resultObject.bbox;

      if (defined(bboxDegrees)) {
        destination = Rectangle.fromDegrees(
          bboxDegrees[0],
          bboxDegrees[1],
          bboxDegrees[2],
          bboxDegrees[3]
        );
      } else {
        const lon = resultObject.geometry.coordinates[0];
        const lat = resultObject.geometry.coordinates[1];
        destination = Cartesian3.fromDegrees(lon, lat);
      }

      return {
        displayName: resultObject.properties.label,
        destination: destination,
        attributions: results.attributions,
      };
    });
  });
};
export default PeliasGeocoderService;
