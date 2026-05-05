import Check from "./Check.js";
import Credit from "./Credit.js";
import Frozen from "./Frozen.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

const url = "https://dev.virtualearth.net/REST/v1/Locations";

/**
 * 通过必应地图提供地理编码服务。
 *
 * @see {@link https://www.microsoft.com/en-us/maps/bing-maps/product|Microsoft Bing Maps Platform APIs Terms Of Use}
 * @alias BingMapsGeocoderService
 * @constructor
 *
 * @param {object} options 具有下列属性的对象：
 * @param {string} options.key 用于必应地图地理编码服务的密钥
 * @param {string} [options.culture] 必应地图{@link https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes|文化代码}，用于以特定文化和语言返回结果。
 */
function BingMapsGeocoderService(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const key = options.key;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(key)) {
    throw new DeveloperError("options.key is required.");
  }
  //>>includeEnd('debug');

  this._key = key;

  const queryParameters = {
    key: key,
  };

  if (defined(options.culture)) {
    queryParameters.culture = options.culture;
  }

  this._resource = new Resource({
    url: url,
    queryParameters: queryParameters,
  });

  this._credit = new Credit(
    `<img src="http:\/\/dev.virtualearth.net\/Branding\/logo_powered_by.png"\/>`,
    false,
  );
}

Object.defineProperties(BingMapsGeocoderService.prototype, {
  /**
   * 必应地理编码服务的URL端点
   * @type {string}
   * @memberof BingMapsGeocoderService.prototype
   * @readonly
   */
  url: {
    get: function () {
      return url;
    },
  },

  /**
   * 必应地理编码服务的密钥
   * @type {string}
   * @memberof BingMapsGeocoderService.prototype
   * @readonly
   */
  key: {
    get: function () {
      return this._key;
    },
  },
  /**
   * 获取地理编码执行后要显示的信用信息。通常用于给地理编码服务署名。
   * @memberof BingMapsGeocoderService.prototype
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
 * @function
 *
 * @param {string} query 要发送到地理编码服务的查询
 * @returns {Promise<GeocoderService.Result[]>}
 */
BingMapsGeocoderService.prototype.geocode = async function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      query: query,
    },
  });

  return resource.fetchJsonp("jsonp").then(function (result) {
    if (result.resourceSets.length === 0) {
      return [];
    }

    const results = result.resourceSets[0].resources;

    return results.map(function (resource) {
      const bbox = resource.bbox;
      const south = bbox[0];
      const west = bbox[1];
      const north = bbox[2];
      const east = bbox[3];
      return {
        displayName: resource.name,
        destination: Rectangle.fromDegrees(west, south, east, north),
      };
    });
  });
};
export default BingMapsGeocoderService;
