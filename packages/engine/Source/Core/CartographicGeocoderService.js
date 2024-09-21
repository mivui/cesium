import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";

/**
 * Geocodes queries containing longitude and latitude coordinates and an optional height.
 * Query format: `longitude latitude (height)` with longitude/latitude in degrees and height in meters.
 *
 * @alias CartographicGeocoderService
 * @constructor
 */
function CartographicGeocoderService() {}

Object.defineProperties(CartographicGeocoderService.prototype, {
  /**
   * 获取要在执行地理代码后显示的信用项。这通常用于信贷
   * 地理编码器服务。
   * @memberof CartographicGeocoderService.prototype
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
 * @returns {Promise<GeocoderService.Result[]>}
 */
CartographicGeocoderService.prototype.geocode = function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const splitQuery = query.match(/[^\s,\n]+/g);
  if (splitQuery.length === 2 || splitQuery.length === 3) {
    let longitude = +splitQuery[0];
    let latitude = +splitQuery[1];
    const height = splitQuery.length === 3 ? +splitQuery[2] : 300.0;

    if (isNaN(longitude) && isNaN(latitude)) {
      const coordTest = /^(\d+.?\d*)([nsew])/i;
      for (let i = 0; i < splitQuery.length; ++i) {
        const splitCoord = splitQuery[i].match(coordTest);
        if (coordTest.test(splitQuery[i]) && splitCoord.length === 3) {
          if (/^[ns]/i.test(splitCoord[2])) {
            latitude = /^[n]/i.test(splitCoord[2])
              ? +splitCoord[1]
              : -splitCoord[1];
          } else if (/^[ew]/i.test(splitCoord[2])) {
            longitude = /^[e]/i.test(splitCoord[2])
              ? +splitCoord[1]
              : -splitCoord[1];
          }
        }
      }
    }

    if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(height)) {
      const result = {
        displayName: query,
        destination: Cartesian3.fromDegrees(longitude, latitude, height),
      };
      return Promise.resolve([result]);
    }
  }
  return Promise.resolve([]);
};
export default CartographicGeocoderService;
