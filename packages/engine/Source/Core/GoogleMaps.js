import Credit from "./Credit.js";
import Resource from "./Resource.js";

/**
 * 访问谷歌地图API的默认设置。
 * <br/>
 * 仅当您直接使用任何谷歌地图API（例如通过{@link createGooglePhotorealistic3DTileset}）时才需要API密钥。
 * 请按照{@link https://developers.google.com/maps/documentation/embed/get-api-key}中的说明管理谷歌地图平台的API密钥。
 * <br/>
 * 您可以在单个API密钥上启用多个谷歌地图平台API。
 * 不过，如果您希望为街景静态API使用专用密钥，可以使用单独的{@link GoogleMaps.defaultStreetViewStaticApiKey}。
 *
 * @see createGooglePhotorealistic3DTileset
 * @see https://developers.google.com/maps/documentation/embed/get-api-key
 *
 * @namespace GoogleMaps
 */
const GoogleMaps = {};

/**
 * 获取或设置默认的谷歌地图API密钥。
 *
 * @type {undefined|string}
 */
GoogleMaps.defaultApiKey = undefined;

/**
 * 获取或设置默认的谷歌地图瓦片API端点。
 *
 * @type {string|Resource}
 * @default https://tile.googleapis.com/
 */
GoogleMaps.mapTilesApiEndpoint = new Resource({
  url: "https://tile.googleapis.com/",
});

/**
 * 获取或设置默认的谷歌地图街景静态API密钥。
 *
 * @type {undefined|string}
 */
GoogleMaps.defaultStreetViewStaticApiKey = undefined;

/**
 * 获取或设置默认的谷歌街景静态API端点。
 *
 * @type {string|Resource}
 * @default https://maps.googleapis.com/maps/api/streetview
 */
GoogleMaps.streetViewStaticApiEndpoint = new Resource({
  url: "https://maps.googleapis.com/maps/api/streetview",
});

GoogleMaps.getDefaultCredit = function () {
  return new Credit(
    `<img alt=\"Google\" src=\"https://assets.ion.cesium.com/google-credit.png\" style=\"vertical-align:-6px\">`,
    true,
  );
};
export default GoogleMaps;
