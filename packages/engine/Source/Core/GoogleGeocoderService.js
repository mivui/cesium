import Check from "./Check.js";
import Credit from "./Credit.js";
import Frozen from "./Frozen.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import RuntimeError from "./RuntimeError.js";

const API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const CREDIT_HTML = `<img alt="Google" src="https://assets.ion.cesium.com/google-credit.png" style="vertical-align:-5px">`;

/**
 * 通过谷歌提供地理编码服务。
 *
 * @see {@link https://developers.google.com/maps/documentation/geocoding/policies|Google Geocoding Policies}
 * @alias GoogleGeocoderService
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} options.key 用于谷歌地理编码服务的API密钥
 */
function GoogleGeocoderService(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const key = options.key;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(key)) {
    throw new DeveloperError("options.key is required.");
  }
  //>>includeEnd('debug');

  this._resource = new Resource({
    url: API_URL,
    queryParameters: { key },
  });

  this._credit = new Credit(CREDIT_HTML, true);
}

Object.defineProperties(GoogleGeocoderService.prototype, {
  /**
   * 获取地理编码执行后要显示的信用信息。通常用于给地理编码服务署名。
   * @memberof GoogleGeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },
});

/**
 * 获取与搜索字符串匹配的可能位置列表。
 *
 * @function
 *
 * @param {string} query 要发送到地理编码服务的查询
 * @returns {Promise<GeocoderService.Result[]>}
 * @throws {RuntimeError} 如果服务返回的状态不是<code>OK</code>或<code>ZERO_RESULTS</code>
 */
GoogleGeocoderService.prototype.geocode = async function (query) {
  // See API documentation at https://developers.google.com/maps/documentation/geocoding/requests-geocoding

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      address: query,
    },
  });

  const response = await resource.fetchJson();

  if (response.status === "ZERO_RESULTS") {
    return [];
  }

  if (response.status !== "OK") {
    throw new RuntimeError(
      `GoogleGeocoderService got a bad response ${response.status}: ${response.error_message}`,
    );
  }

  const results = response.results.map((result) => {
    const southWest = result.geometry.viewport.southwest;
    const northEast = result.geometry.viewport.northeast;
    return {
      displayName: result.formatted_address,
      destination: Rectangle.fromDegrees(
        southWest.lng,
        southWest.lat,
        northEast.lng,
        northEast.lat,
      ),
      attribution: {
        html: CREDIT_HTML,
        collapsible: false,
      },
    };
  });

  return results;
};

export default GoogleGeocoderService;
