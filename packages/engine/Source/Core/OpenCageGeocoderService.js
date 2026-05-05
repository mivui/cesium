import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import combine from "./combine.js";
import Credit from "./Credit.js";
import defined from "./defined.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";

/**
 * 通过 {@link https://opencagedata.com/|OpenCage} 服务器提供地理编码服务。
 * @alias OpenCageGeocoderService
 * @constructor
 *
 * @param {Resource|string} url 指向 OpenCage 服务器的端点。
 * @param {string} apiKey OpenCage API 密钥。
 * @param {object} [params] 包含以下属性的对象（参见 https://opencagedata.com/api#forward-opt）：
 * @param {number} [params.abbrv] 设置为1时，尝试缩写和缩短返回的格式化字符串。
 * @param {number} [options.add_request] 设置为1时，各种请求参数会添加到响应中以便于调试。
 * @param {string} [options.bounds] 为地理编码器提供查询所在区域的提示。
 * @param {string} [options.countrycode] 将结果限制为指定国家（使用 ISO 3166-1 Alpha 2 标准定义）。
 * @param {string} [options.jsonp] 用函数名包装返回的 JSON。
 * @param {string} [options.language] IETF 格式的语言代码。
 * @param {number} [options.limit] 应返回的最大结果数。
 * @param {number} [options.min_confidence] 1-10 之间的整数。只返回置信度至少为此值的结果。
 * @param {number} [options.no_annotations] 设置为1时，结果将不包含注释。
 * @param {number} [options.no_dedupe] 设置为1时，结果不会被去重。
 * @param {number} [options.no_record] 设置为1时，查询内容不会被记录。
 * @param {number} [options.pretty] 设置为1时，结果会进行"美化"打印以便于阅读。用于调试。
 * @param {string} [options.proximity] 为地理编码器提供提示，使结果偏向靠近指定位置的结果（例如：41.40139,2.12870）。
 *
 * @example
 * // 配置 Viewer 使用 OpenCage 地理编码器
 * const viewer = new Cesium.Viewer('cesiumContainer', {
 *   geocoder: new Cesium.OpenCageGeocoderService('https://api.opencagedata.com/geocode/v1/', '<API key>')
 * });
 */
function OpenCageGeocoderService(url, apiKey, params) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  Check.defined("apiKey", apiKey);
  if (defined(params)) {
    Check.typeOf.object("params", params);
  }
  //>>includeEnd('debug');

  url = Resource.createIfNeeded(url);
  url.appendForwardSlash();
  url.setQueryParameters({ key: apiKey });
  this._url = url;
  this._params = params ?? {};
  this._credit = new Credit(
    `Geodata copyright <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors`,
    false,
  );
}

Object.defineProperties(OpenCageGeocoderService.prototype, {
  /**
   * 用于访问 OpenCage 端点的资源。
   * @type {Resource}
   * @memberof OpenCageGeocoderService.prototype
   * @readonly
   */
  url: {
    get: function () {
      return this._url;
    },
  },
  /**
   * 传递给 OpenCage 的可选参数，用于自定义地理编码。
   * @type {object}
   * @memberof OpenCageGeocoderService.prototype
   * @readonly
   */
  params: {
    get: function () {
      return this._params;
    },
  },
  /**
   * 获取执行地理编码后要显示的版权信息。通常用于注明地理编码服务的来源。
   * @memberof OpenCageGeocoderService.prototype
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
 * @param {string} query 要发送到地理编码服务的查询。
 * @returns {Promise<GeocoderService.Result[]>}
 */
OpenCageGeocoderService.prototype.geocode = async function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._url.getDerivedResource({
    url: "json",
    queryParameters: combine(this._params, { q: query }),
  });
  return resource.fetchJson().then(function (response) {
    return response.results.map(function (resultObject) {
      let destination;
      const bounds = resultObject.bounds;

      if (defined(bounds)) {
        destination = Rectangle.fromDegrees(
          bounds.southwest.lng,
          bounds.southwest.lat,
          bounds.northeast.lng,
          bounds.northeast.lat,
        );
      } else {
        const { lng, lat } = resultObject.geometry;
        destination = Cartesian3.fromDegrees(lng, lat);
      }

      return {
        displayName: resultObject.formatted,
        destination: destination,
      };
    });
  });
};
export default OpenCageGeocoderService;
