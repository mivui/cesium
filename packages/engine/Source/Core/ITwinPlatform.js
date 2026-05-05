import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Resource from "./Resource.js";
import RuntimeError from "./RuntimeError.js";

/**
 * 用于访问 iTwin 平台的默认设置。
 *
 * @experimental 此功能尚未最终确定，可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 *
 * @see ITwinData
 * @namespace ITwinPlatform
 */
const ITwinPlatform = {};

/**
 * 网格导出（mesh-export）的状态。
 * 有效值为：<code>NotStarted</code>、<code>InProgress</code>、<code>Complete</code>、<code>Invalid</code>
 * @enum {string}
 */
ITwinPlatform.ExportStatus = Object.freeze({
  NotStarted: "NotStarted",
  InProgress: "InProgress",
  Complete: "Complete",
  Invalid: "Invalid",
});

/**
 * 网格导出（mesh-export）的类型。CesiumJS 仅支持加载 <code>3DTILES</code> 类型的导出。
 * 有效值为：<code>IMODEL</code>、<code>CESIUM</code>、<code>3DTILES</code>
 * @enum {string}
 */
ITwinPlatform.ExportType = Object.freeze({
  IMODEL: "IMODEL",
  CESIUM: "CESIUM",
  "3DTILES": "3DTILES",
});

/**
 * 实景数据类型。这是我们知道可以支持的部分类型列表。
 *
 * @see https://developer.bentley.com/apis/reality-management/rm-rd-details/#types
 * @enum {string}
 */
ITwinPlatform.RealityDataType = Object.freeze({
  Cesium3DTiles: "Cesium3DTiles",
  PNTS: "PNTS",
  RealityMesh3DTiles: "RealityMesh3DTiles",
  Terrain3DTiles: "Terrain3DTiles",
  GaussianSplat3DTiles: "GS_3DT",
  KML: "KML",
  GeoJSON: "GeoJSON",
  Unstructured: "Unstructured",
});

/**
 * 获取或设置默认的 iTwin 访问令牌。此令牌应具有 <code>itwin-platform</code> 作用域。
 *
 * 如果定义了 {@link ITwinPlatform.defaultShareKey}，此值将被忽略。
 *
 * @experimental 此功能尚未最终确定，可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 *
 * @type {string|undefined}
 */
ITwinPlatform.defaultAccessToken = undefined;

/**
 * 获取或设置默认的 iTwin 共享密钥。如果提供此值，它将覆盖所有请求中的 {@link ITwinPlatform.defaultAccessToken}。
 *
 * 可以使用 iTwin Shares API 生成共享密钥：
 * https://developer.bentley.com/apis/access-control-v2/operations/create-itwin-share/
 *
 * @experimental 此功能尚未最终确定，可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 *
 * @type {string|undefined}
 */
ITwinPlatform.defaultShareKey = undefined;

/**
 * 根据设置的密钥/令牌创建必要的 Authorization 请求头。
 * 如果设置了 {@link ITwinPlatform.defaultShareKey}，它将优先于 {@link ITwinPlatform.defaultAccessToken} 被使用。
 * @private
 * @returns {string} 包含 basic/bearer 方法的完整 auth 头
 */
ITwinPlatform._getAuthorizationHeader = function () {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(ITwinPlatform.defaultAccessToken) &&
    !defined(ITwinPlatform.defaultShareKey)
  ) {
    throw new DeveloperError(
      "Must set ITwinPlatform.defaultAccessToken or ITwinPlatform.defaultShareKey first",
    );
  }
  //>>includeEnd('debug');

  if (defined(ITwinPlatform.defaultShareKey)) {
    return `Basic ${ITwinPlatform.defaultShareKey}`;
  }
  return `Bearer ${ITwinPlatform.defaultAccessToken}`;
};

/**
 * 获取或设置默认的 iTwin API 端点。
 *
 * @experimental 此功能尚未最终确定，可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 *
 * @type {string|Resource}
 * @default "https://api.bentley.com"
 */
ITwinPlatform.apiEndpoint = new Resource({
  url: "https://api.bentley.com",
});

/**
 * @typedef {object} ExportRequest
 * @private
 * @property {string} iModelId
 * @property {string} changesetId
 * @property {ITwinPlatform.ExportType} exportType 导出的类型。CesiumJS 仅支持 3DTILES 类型
 */

/**
 * @typedef {object} Link
 * @private
 * @property {string} href
 */

/**
 * @typedef {object} ExportRepresentation
 * 使用 return=representation 时从 get-exports 获取的导出对象
 * @private
 * @property {string} id 导出 id
 * @property {string} displayName iModel 的名称
 * @property {ITwinPlatform.ExportStatus} status 此导出的状态
 * @property {string} lastModified
 * @property {ExportRequest} request 包含导出本身信息的对象
 * @property {{mesh: Link}} _links 包含相关链接的对象。对于导出，这包括网格本身的访问 URL
 */

/**
 * @typedef {object} GetExportsResponse
 * @private
 * @property {ExportRepresentation[]} exports 当前页面的导出列表
 * @property {{self: Link, next: Link | undefined, prev: Link | undefined}} _links 分页链接
 */

/**
 * 获取指定 iModel 在其最新版本的导出列表。
 * 这将仅返回最多 5 个 {@link ITwinPlatform.ExportType} 为 <code>3DTILES</code> 的导出。
 *
 * @private
 *
 * @param {string} iModelId iModel id
 * @param {string} [changesetId] 用于过滤结果的 changeset id。如果未提供，将返回最新可用 changeset 的导出。
 * @returns {Promise<GetExportsResponse>}
 *
 * @throws {RuntimeError} 如果 iTwin API 请求不成功
 */
ITwinPlatform.getExports = async function (iModelId, changesetId) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("iModelId", iModelId);
  if (defined(changesetId)) {
    Check.typeOf.string("changesetId", changesetId);
  }
  if (
    !defined(ITwinPlatform.defaultAccessToken) &&
    !defined(ITwinPlatform.defaultShareKey)
  ) {
    throw new DeveloperError(
      "Must set ITwinPlatform.defaultAccessToken or ITwinPlatform.defaultShareKey first",
    );
  }
  //>>includeEnd('debug');

  const resource = new Resource({
    url: `${ITwinPlatform.apiEndpoint}mesh-export`,
    headers: {
      Authorization: ITwinPlatform._getAuthorizationHeader(),
      Accept: "application/vnd.bentley.itwin-platform.v1+json",
      Prefer: "return=representation",
    },
    queryParameters: {
      iModelId: iModelId,
      exportType: ITwinPlatform.ExportType["3DTILES"],
      // 由于导出自动生成功能会自动删除第 6 个导出，因此
      // 结果永远不会超过 5 个。请求所有结果并解析
      // 状态为 COMPLETE 的导出
      $top: "5",
      client: "CesiumJS",
    },
  });
  /* global CESIUM_VERSION */
  if (typeof CESIUM_VERSION !== "undefined") {
    resource.appendQueryParameters({ clientVersion: CESIUM_VERSION });
  }
  if (defined(changesetId) && changesetId !== "") {
    resource.appendQueryParameters({ changesetId: changesetId });
  }

  try {
    const response = await resource.fetchJson();
    return response;
  } catch (error) {
    const result = JSON.parse(error.response);
    if (error.statusCode === 401) {
      const code = result.error.details?.[0].code ?? "";
      throw new RuntimeError(
        `Unauthorized, bad token, wrong scopes or headers bad. ${code}`,
      );
    } else if (error.statusCode === 403) {
      console.error(result.error.code, result.error.message);
      throw new RuntimeError("Not allowed, forbidden");
    } else if (error.statusCode === 422) {
      throw new RuntimeError(
        `Unprocessable Entity:${result.error.code} ${result.error.message}`,
      );
    } else if (error.statusCode === 429) {
      throw new RuntimeError("Too many requests");
    }
    throw new RuntimeError(`Unknown request failure ${error.statusCode}`);
  }
};

/**
 * @typedef {object} RealityDataExtent
 * @private
 * @property {{latitude: number, longitude: number}} southWest
 * @property {{latitude: number, longitude: number}} northEast
 */

/**
 * @typedef {object} RealityDataRepresentation
 * @private
 * @property {string} id "95d8dccd-d89e-4287-bb5f-3219acbc71ae",
 * @property {string} displayName "实景数据名称",
 * @property {string} dataset "数据集",
 * @property {string} group "73d09423-28c3-4fdb-ab4a-03a47a5b04f8",
 * @property {string} description "实景数据描述",
 * @property {string} rootDocument "目录/子目录/realityData.3mx",
 * @property {number} size 6521212,
 * @property {string} classification "模型",
 * @property {ITwinPlatform.RealityDataType} type "3MX",
 * @property {{startDateTime: string, endDateTime: string, acquirer: string}} acquisition
 * @property {RealityDataExtent} extent
 * @property {boolean} authoring false,
 * @property {string} dataCenterLocation "北欧",
 * @property {string} modifiedDateTime "2021-04-09T19:03:12Z",
 * @property {string} lastAccessedDateTime "2021-04-09T00:00:00Z",
 * @property {string} createdDateTime "2021-02-22T20:03:40Z",
 * @property {string} ownerId "f1d49cc7-f9b3-494f-9c67-563ea5597063",
 */

/**
 * 加载给定 iTwin id 和实景数据 id 的完整元数据。
 *
 * @private
 *
 * @param {string} iTwinId 要加载数据的 iTwin id
 * @param {string} realityDataId 要加载的实景数据 id
 * @returns {Promise<RealityDataRepresentation>}
 */
ITwinPlatform.getRealityDataMetadata = async function (iTwinId, realityDataId) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("iTwinId", iTwinId);
  Check.typeOf.string("realityDataId", realityDataId);
  if (
    !defined(ITwinPlatform.defaultAccessToken) &&
    !defined(ITwinPlatform.defaultShareKey)
  ) {
    throw new DeveloperError(
      "Must set ITwinPlatform.defaultAccessToken or ITwinPlatform.defaultShareKey first",
    );
  }
  //>>includeEnd('debug');

  const resource = new Resource({
    url: `${ITwinPlatform.apiEndpoint}reality-management/reality-data/${realityDataId}`,
    headers: {
      Authorization: ITwinPlatform._getAuthorizationHeader(),
      Accept: "application/vnd.bentley.itwin-platform.v1+json",
    },
    queryParameters: { iTwinId: iTwinId },
  });

  try {
    const response = await resource.fetchJson();
    return response.realityData;
  } catch (error) {
    const result = JSON.parse(error.response);
    if (error.statusCode === 401) {
      const code = result.error.details?.[0].code ?? "";
      throw new RuntimeError(
        `Unauthorized, bad token, wrong scopes or headers bad. ${code}`,
      );
    } else if (error.statusCode === 403) {
      console.error(result.error.code, result.error.message);
      throw new RuntimeError("Not allowed, forbidden");
    } else if (error.statusCode === 404) {
      throw new RuntimeError(
        `Reality data not found: ${iTwinId}, ${realityDataId}`,
      );
    } else if (error.statusCode === 422) {
      throw new RuntimeError(
        `Unprocessable Entity:${result.error.code} ${result.error.message}`,
      );
    } else if (error.statusCode === 429) {
      throw new RuntimeError("Too many requests");
    }
    throw new RuntimeError(`Unknown request failure ${error.statusCode}`);
  }
};

/**
 * 请求给定 iTwin id、实景数据 id 和根文档的访问 URL。
 * 可以使用 <code>return=representation</code> 从列表中请求根文档，
 * 或通过 {@link ITwinPlatform.getRealityDataMetadata} 元数据路由获取。
 *
 * @private
 *
 * @param {string} iTwinId 要加载数据的 iTwin id
 * @param {string} realityDataId 要加载的实景数据 id
 * @param {string} rootDocument 此实景数据的根文档路径
 * @returns {Promise<string>}
 */
ITwinPlatform.getRealityDataURL = async function (
  iTwinId,
  realityDataId,
  rootDocument,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("iTwinId", iTwinId);
  Check.typeOf.string("realityDataId", realityDataId);
  Check.typeOf.string("rootDocument", rootDocument);
  if (
    !defined(ITwinPlatform.defaultAccessToken) &&
    !defined(ITwinPlatform.defaultShareKey)
  ) {
    throw new DeveloperError(
      "Must set ITwinPlatform.defaultAccessToken or ITwinPlatform.defaultShareKey first",
    );
  }
  //>>includeEnd('debug');

  const resource = new Resource({
    url: `${ITwinPlatform.apiEndpoint}reality-management/reality-data/${realityDataId}/readaccess`,
    headers: {
      Authorization: ITwinPlatform._getAuthorizationHeader(),
      Accept: "application/vnd.bentley.itwin-platform.v1+json",
    },
    queryParameters: { iTwinId: iTwinId },
  });

  try {
    const result = await resource.fetchJson();

    const containerUrl = result._links.containerUrl.href;
    const tilesetUrl = new URL(containerUrl);
    tilesetUrl.pathname = `${tilesetUrl.pathname}/${rootDocument}`;

    return tilesetUrl.toString();
  } catch (error) {
    const result = JSON.parse(error.response);
    if (error.statusCode === 401) {
      const code = result.error.details?.[0].code ?? "";
      throw new RuntimeError(
        `Unauthorized, bad token, wrong scopes or headers bad. ${code}`,
      );
    } else if (error.statusCode === 403) {
      console.error(result.error.code, result.error.message);
      throw new RuntimeError("Not allowed, forbidden");
    } else if (error.statusCode === 404) {
      throw new RuntimeError(
        `Reality data not found: ${iTwinId}, ${realityDataId}`,
      );
    } else if (error.statusCode === 422) {
      throw new RuntimeError(
        `Unprocessable Entity:${result.error.code} ${result.error.message}`,
      );
    } else if (error.statusCode === 429) {
      throw new RuntimeError("Too many requests");
    }
    throw new RuntimeError(`Unknown request failure ${error.statusCode}`);
  }
};

export default ITwinPlatform;
