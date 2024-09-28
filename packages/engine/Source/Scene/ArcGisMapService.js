import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "AAPTxy8BH1VEsoebNVZXo8HurEOF051kAEKlhkOhBEc9BmSXu8_pRnGhnW6yZLct-ukUzbJaZRAVfnmUrxDcAu_FaFDIC3M57EwfRm_DuTw9D5oHdLBTYIMD3tpUeFsNDjHHqar5fb1FGIN9KIV1Gk64dNBmhHhuOHY8cq2IhI0XFLj2qnAlqtKnM-lLsO6JpHuHPVD799V1o9VFm9vMW6a66vEi8-e--2QzKQecPYiaq98.AT1_p4pHwb3n";
/**
 * 用于访问 ArcGIS 图像切片服务的默认选项。
 *
 * 访问 ArcGIS 图像切片图层需要 ArcGIS 访问令牌。
 * 默认令牌仅用于评估目的。
 * 要获取访问令牌，请转到 {@link https://developers.arcgis.com} 并创建一个免费帐户。
 * 更多信息可以在{@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security/ | ArcGIS developer guide}.
 *
 * @see ArcGisMapServerImageryProvider
 * @namespace ArcGisMapService
 */

const ArcGisMapService = {};
/**
 * 获取或设置默认 ArcGIS 访问令牌。
 *
 * @type {string}
 */
ArcGisMapService.defaultAccessToken = defaultAccessToken;

/**
 * 获取或设置ArcGIS World Imagery 切片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer
 */
ArcGisMapService.defaultWorldImageryServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer",
});

/**
 * 获取或设置ArcGIS World Hillshade 切片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer
 */
ArcGisMapService.defaultWorldHillshadeServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
});

/**
 * 获取或设置ArcGIS World Oceans 切片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer
 */
ArcGisMapService.defaultWorldOceanServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer",
});

/**
 *
 * @param {string} providedKey
 * @return {string|undefined}
 */
ArcGisMapService.getDefaultTokenCredit = function (providedKey) {
  if (providedKey !== defaultAccessToken) {
    return undefined;
  }

  if (!defined(defaultTokenCredit)) {
    const defaultTokenMessage =
      '<b> \
            This application is using a default ArcGIS access token. Please assign <i>Cesium.ArcGisMapService.defaultAccessToken</i> \
            with an API key from your ArcGIS Developer account before using the ArcGIS tile services. \
            You can sign up for a free ArcGIS Developer account at <a href="https://developers.arcgis.com/">https://developers.arcgis.com/</a>.</b>';

    defaultTokenCredit = new Credit(defaultTokenMessage, true);
  }

  return defaultTokenCredit;
};
export default ArcGisMapService;
