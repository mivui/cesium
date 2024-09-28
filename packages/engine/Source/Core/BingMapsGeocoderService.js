import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

const url = "https://dev.virtualearth.net/REST/v1/Locations";

/**
 * 通过 Bing 地图提供地理编码。
 * @alias BingMapsGeocoderService
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string} options.key 与必应地图地理编码服务一起使用的键
 * @param {string} [options.culture] Bing Maps {@link https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes|Culture Code} 返回特定文化和语言的结果
 */
function BingMapsGeocoderService(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
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
   * Bing地理编码器服务的URL端点
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
   * Bing地理编码器服务的关键字
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
   * 获取要在执行地理代码后显示的信用项。这通常用于信贷
   * 地理编码器服务。
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
 * @param {string} query 要发送到地理编码器服务的查询
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
