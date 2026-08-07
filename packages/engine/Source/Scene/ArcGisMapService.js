import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "AAPTa7BPWL4PoZRFPJ2CM2YRclg..ub1vMOBXctC7ozMMKNnmx3ZwVTsDJAXo2GLomQ2CZjuOc2HLr1-CryeuRo9ZsV65cuZ9xN1yFKeLTu7Cxld7B97aI28os_NnuC9nvWde_l4G1DTApSHmhrVoZfKgO0bqOrsDfvvSgO-cdkUEvBASNX_4Lb9tB5fEY7lbYaWdOOWBXyZylR9il0-biB248V6HdDT1kgkSwz9esfKialRTLgxJx8AFM9is--UXK0CLvZn6JUU44PZSFuMyAT1_rgxsirsZ";
/**
 * 访问 ArcGIS 图像瓦片服务的默认选项。
 *
 * 访问 ArcGIS 图像瓦片图层需要 ArcGIS 访问令牌。
 * 提供默认令牌仅用于评估目的。
 * 要获取访问令牌，请访问 {@link https://developers.arcgis.com} 并创建免费帐户。
 * 更多信息可在 {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security/ | ArcGIS 开发者指南} 中找到。
 *
 * @see ArcGisMapServerImageryProvider
 * @namespace ArcGisMapService
 */

const ArcGisMapService = {};
/**
 * 获取或设置默认的 ArcGIS 访问令牌。
 *
 * @type {string}
 */
ArcGisMapService.defaultAccessToken = defaultAccessToken;

/**
 * 获取或设置 ArcGIS World Imagery 瓦片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer
 */
ArcGisMapService.defaultWorldImageryServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer",
});

/**
 * 获取或设置 ArcGIS World Hillshade 瓦片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer
 */
ArcGisMapService.defaultWorldHillshadeServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
});

/**
 * 获取或设置 ArcGIS World Oceans 瓦片服务的 URL。
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer
 */
ArcGisMapService.defaultWorldOceanServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer",
});

/**
 * 获取默认的令牌署名（如果使用默认访问令牌）。
 *
 * @param {string} providedKey 提供的访问令牌
 * @return {Credit|undefined} 如果使用默认令牌则返回署名 Credit，否则返回 undefined
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
