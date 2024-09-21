import Credit from "./Credit.js";
import Resource from "./Resource.js";

/**
 * 访问 Google Maps API 的默认设置。
 * <br/>
 * 仅当您直接使用任何 Google 地图 API 时（例如通过 {@link createGooglePhotorealistic3DTileset}），才需要 API 密钥。
 * 按照 {@link https://developers.google.com/maps/documentation/embed/get-api-key} 中有关 Google Maps Platform 的 API 密钥管理说明进行操作
 *
 * @see createGooglePhotorealistic3DTileset
 * @see https://developers.google.com/maps/documentation/embed/get-api-key
 *
 * @namespace GoogleMaps
 */
const GoogleMaps = {};

/**
 * 获取或设置默认 Google Maps API 密钥。
 *
 * @type {undefined|string}
 */
GoogleMaps.defaultApiKey = undefined;

/**
 * 获取或设置默认的 Google 地图瓦片 API 端点。
 *
 * @type {string|Resource}
 * @default https://tile.googleapis.com/v1/
 */
GoogleMaps.mapTilesApiEndpoint = new Resource({
  url: "https://tile.googleapis.com/v1/",
});

GoogleMaps.getDefaultCredit = function () {
  return new Credit(
    `<img src="https://assets.ion.cesium.com/google-credit.png" style="vertical-align: -5px" alt="Google">`,
    true
  );
};
export default GoogleMaps;
