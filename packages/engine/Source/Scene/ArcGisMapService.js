import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "AAPTarorp_WgBbyDABMqDfNsSWg..ykf3buvvbFduVL73NrRrnqBR8lO4ndPrO94nF7-3rfUWF5n3sbUe2Xe0d4rhAGa-sOTDpE-AI5kom4O4ixK3QFkTnjaGpFtDOxyrPXZUj1vRmsZAaIMZlzC5TWfBDr-RYeD9NCRMq8JwaP2Fp9blpXTqYVCWpENJLiCJ3pUlQ7XSrnJYNlPwph4B3k1FAK_j3DTlLDd2xbHwcMRbVYq8iJqt7vGuWHw3otSkmltdnNAgMaVQ366Rf0YUAT1_Hbd2aXK9";
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
