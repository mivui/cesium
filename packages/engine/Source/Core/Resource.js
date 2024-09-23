import Uri from "urijs";
import appendForwardSlash from "./appendForwardSlash.js";
import Check from "./Check.js";
import clone from "./clone.js";
import combine from "./combine.js";
import defaultValue from "./defaultValue.js";
import defer from "./defer.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import getAbsoluteUri from "./getAbsoluteUri.js";
import getBaseUri from "./getBaseUri.js";
import getExtensionFromUri from "./getExtensionFromUri.js";
import getImagePixels from "./getImagePixels.js";
import isBlobUri from "./isBlobUri.js";
import isCrossOriginUrl from "./isCrossOriginUrl.js";
import isDataUri from "./isDataUri.js";
import loadAndExecuteScript from "./loadAndExecuteScript.js";
import CesiumMath from "./Math.js";
import objectToQuery from "./objectToQuery.js";
import queryToObject from "./queryToObject.js";
import Request from "./Request.js";
import RequestErrorEvent from "./RequestErrorEvent.js";
import RequestScheduler from "./RequestScheduler.js";
import RequestState from "./RequestState.js";
import RuntimeError from "./RuntimeError.js";
import TrustedServers from "./TrustedServers.js";

const xhrBlobSupported = (function () {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "#", true);
    xhr.responseType = "blob";
    return xhr.responseType === "blob";
  } catch (e) {
    return false;
  }
})();

/**
 * @typedef {object} Resource.ConstructorOptions
 *
 * Resource 构造函数的初始化选项
 *
 * @property {string} url 资源的 URL。
 * @property {object} [queryParameters] 一个对象，其中包含检索资源时将发送的查询参数。
 * @property {object} [templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @property {object} [headers={}] 将发送的其他 HTTP 标头。
 * @property {Proxy} [proxy] 加载资源时使用的代理。
 * @property {Resource.RetryCallback} [retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @property {number} [retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @property {Request} [request] 将使用的 Request 对象。仅供内部使用。
 * @property {boolean} [parseUrl=true] 如果为 true，则解析查询参数的 url;否则，将 URL 原封不动地存储
 */

/**
 * 一个资源，其中包括位置以及我们检索它或创建派生资源所需的任何其他参数。它还提供重试请求的功能。
 *
 * @alias Resource
 * @constructor
 *
 * @param {string|Resource.ConstructorOptions} options url 或 描述初始化选项的对象
 *
 * @example
 * function refreshTokenRetryCallback(resource, error) {
 *   if (error.statusCode === 403) {
 *     // 403 status code means a new token should be generated
 *     return getNewAccessToken()
 *       .then(function(token) {
 *         resource.queryParameters.access_token = token;
 *         return true;
 *       })
 *       .catch(function() {
 *         return false;
 *       });
 *   }
 *
 *   return false;
 * }
 *
 * const resource = new Resource({
 *    url: 'http://server.com/path/to/resource.json',
 *    proxy: new DefaultProxy('/proxy/'),
 *    headers: {
 *      'X-My-Header': 'valueOfHeader'
 *    },
 *    queryParameters: {
 *      'access_token': '123-435-456-000'
 *    },
 *    retryCallback: refreshTokenRetryCallback,
 *    retryAttempts: 1
 * });
 */
function Resource(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  if (typeof options === "string") {
    options = {
      url: options,
    };
  }

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.url", options.url);
  //>>includeEnd('debug');

  this._url = undefined;
  this._templateValues = defaultClone(options.templateValues, {});
  this._queryParameters = defaultClone(options.queryParameters, {});

  /**
   * 将与请求一起发送的其他 HTTP 标头。
   *
   * @type {object}
   */
  this.headers = defaultClone(options.headers, {});

  /**
   * 将使用的 Request 对象。仅供内部使用。
   *
   * @type {Request}
   */
  this.request = defaultValue(options.request, new Request());

  /**
   * 加载资源时使用的代理。
   *
   * @type {Proxy}
   */
  this.proxy = options.proxy;

  /**
   * 请求此资源失败时调用的函数。如果返回 true 或 Promise 解析为 true，则将重试请求。
   *
   * @type {Function}
   */
  this.retryCallback = options.retryCallback;

  /**
   * 在放弃之前应调用 retryCallback 的次数。
   *
   * @type {number}
   */
  this.retryAttempts = defaultValue(options.retryAttempts, 0);
  this._retryCount = 0;

  const parseUrl = defaultValue(options.parseUrl, true);
  if (parseUrl) {
    this.parseUrl(options.url, true, true);
  } else {
    this._url = options.url;
  }

  this._credits = options.credits;
}

/**
 * 如果已定义值，则克隆该值，否则返回默认值
 *
 * @param {object} [value] 要克隆的值。
 * @param {object} [defaultValue] 默认值。
 *
 * @returns {object} value 或 defaultValue 的克隆。
 *
 * @private
 */
function defaultClone(value, defaultValue) {
  return defined(value) ? clone(value) : defaultValue;
}

/**
 * 一个辅助函数，用于创建资源，具体取决于我们是 String 还是 Resource
 *
 * @param {Resource|string} resource 创建新资源时使用的资源或字符串。
 *
 * @returns {Resource} 如果 resource 是 String，则为 url 和选项构造的 Resource。否则返回 resource 参数。
 *
 * @private
 */
Resource.createIfNeeded = function (resource) {
  if (resource instanceof Resource) {
    // Keep existing request object. This function is used internally to duplicate a Resource, so that it can't
    //  be modified outside of a class that holds it (eg. an imagery or terrain provider). Since the Request objects
    //  are managed outside of the providers, by the tile loading code, we want to keep the request property the same so if it is changed
    //  in the underlying tiling code the requests for this resource will use it.
    return resource.getDerivedResource({
      request: resource.request,
    });
  }

  if (typeof resource !== "string") {
    return resource;
  }

  return new Resource({
    url: resource,
  });
};

let supportsImageBitmapOptionsPromise;
/**
 * 一个辅助函数，用于检查 createImageBitmap 是否支持传入 ImageBitmapOptions。
 *
 * @returns {Promise<boolean>} 如果此浏览器支持使用选项创建 ImageBitmap，则解析为 true 的 Promise。
 *
 * @private
 */
Resource.supportsImageBitmapOptions = function () {
  // Until the HTML folks figure out what to do about this, we need to actually try loading an image to
  // know if this browser supports passing options to the createImageBitmap function.
  // https://github.com/whatwg/html/pull/4248
  //
  // We also need to check whether the colorSpaceConversion option is supported.
  // We do this by loading a PNG with an embedded color profile, first with
  // colorSpaceConversion: "none" and then with colorSpaceConversion: "default".
  // If the pixel color is different then we know the option is working.
  // As of Webkit 17612.3.6.1.6 the createImageBitmap promise resolves but the
  // option is not actually supported.
  if (defined(supportsImageBitmapOptionsPromise)) {
    return supportsImageBitmapOptionsPromise;
  }

  if (typeof createImageBitmap !== "function") {
    supportsImageBitmapOptionsPromise = Promise.resolve(false);
    return supportsImageBitmapOptionsPromise;
  }

  const imageDataUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAABGdBTUEAAE4g3rEiDgAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAADElEQVQI12Ng6GAAAAEUAIngE3ZiAAAAAElFTkSuQmCC";

  supportsImageBitmapOptionsPromise = Resource.fetchBlob({
    url: imageDataUri,
  })
    .then(function (blob) {
      const imageBitmapOptions = {
        imageOrientation: "flipY", // default is "none"
        premultiplyAlpha: "none", // default is "default"
        colorSpaceConversion: "none", // default is "default"
      };
      return Promise.all([
        createImageBitmap(blob, imageBitmapOptions),
        createImageBitmap(blob),
      ]);
    })
    .then(function (imageBitmaps) {
      // Check whether the colorSpaceConversion option had any effect on the green channel
      const colorWithOptions = getImagePixels(imageBitmaps[0]);
      const colorWithDefaults = getImagePixels(imageBitmaps[1]);
      return colorWithOptions[1] !== colorWithDefaults[1];
    })
    .catch(function () {
      return false;
    });

  return supportsImageBitmapOptionsPromise;
};

Object.defineProperties(Resource, {
  /**
   * 如果支持 blob，则返回 true。
   *
   * @memberof Resource
   * @type {boolean}
   *
   * @readonly
   */
  isBlobSupported: {
    get: function () {
      return xhrBlobSupported;
    },
  },
});

Object.defineProperties(Resource.prototype, {
  /**
   * 附加到 URL 的查询参数。
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  queryParameters: {
    get: function () {
      return this._queryParameters;
    },
  },

  /**
   * 用于替换 url 中的模板参数的键/值对。
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  templateValues: {
    get: function () {
      return this._templateValues;
    },
  },

  /**
   * 替换了模板值的资源的 URL，附加了查询字符串，并由代理编码（如果已设置）。
   *
   * @memberof Resource.prototype
   * @type {string}
   */
  url: {
    get: function () {
      return this.getUrlComponent(true, true);
    },
    set: function (value) {
      this.parseUrl(value, false, false);
    },
  },

  /**
   * 资源的文件扩展名。
   *
   * @memberof Resource.prototype
   * @type {string}
   *
   * @readonly
   */
  extension: {
    get: function () {
      return getExtensionFromUri(this._url);
    },
  },

  /**
   * 如果 Resource 引用数据 URI，则为 True。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isDataUri: {
    get: function () {
      return isDataUri(this._url);
    },
  },

  /**
   * 如果 Resource 引用 blob URI，则为 True。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isBlobUri: {
    get: function () {
      return isBlobUri(this._url);
    },
  },

  /**
   * 如果 Resource 引用跨源 URL，则为 True。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isCrossOriginUrl: {
    get: function () {
      return isCrossOriginUrl(this._url);
    },
  },

  /**
   * 如果 Resource 具有请求标头，则为 True。这等效于检查 headers 属性是否有任何键。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  hasHeaders: {
    get: function () {
      return Object.keys(this.headers).length > 0;
    },
  },

  /**
   * 获取资产归因所需的积分。
   * @private
   */
  credits: {
    get: function () {
      return this._credits;
    },
  },
});

/**
 * 覆盖 Object#toString，以便隐式字符串转换给出
 * 此资源表示的完整 URL。
 *
 * @returns {string} 此资源表示的 URL
 */
Resource.prototype.toString = function () {
  return this.getUrlComponent(true, true);
};

/**
 * 解析 url 字符串，并存储其信息
 *
 * @param {string} url 输入 url 字符串。
 * @param {boolean} merge 如果为 true，我们将与资源的现有 queryParameters 合并。否则，它们将被替换。
 * @param {boolean} preserveQuery 如果为 true，则重复的参数将被连接成一个数组。如果为 false，则 url 中的键将优先。
 * @param {string} [baseUrl] 如果提供，并且输入 url 是相对 url，它将相对于 baseUrl 成为绝对 url
 *
 * @private
 */
Resource.prototype.parseUrl = function (url, merge, preserveQuery, baseUrl) {
  let uri = new Uri(url);
  const query = parseQueryString(uri.query());

  this._queryParameters = merge
    ? combineQueryParameters(query, this.queryParameters, preserveQuery)
    : query;

  // Remove unneeded info from the Uri
  uri.search("");
  uri.fragment("");

  if (defined(baseUrl) && uri.scheme() === "") {
    uri = uri.absoluteTo(getAbsoluteUri(baseUrl));
  }

  this._url = uri.toString();
};

/**
 * 解析查询字符串并返回等效对象。
 *
 * @param {string} queryString 查询字符串
 * @returns {object}
 *
 * @private
 */
function parseQueryString(queryString) {
  if (queryString.length === 0) {
    return {};
  }

  // Special case where the querystring is just a string, not key/value pairs
  if (queryString.indexOf("=") === -1) {
    return { [queryString]: undefined };
  }

  return queryToObject(queryString);
}

/**
 * 这结合了查询参数的映射。
 *
 * @param {object} q1 查询参数的第一个映射。如果 preserveQueryParameters 为 false，则此映射中的值将优先。
 * @param {object} q2 查询参数的第二个映射。
 * @param {boolean} preserveQueryParameters 如果为 true，则重复的参数将被连接成一个数组。如果为 false，则 q1 中的键将优先。
 *
 * @returns {object} 查询参数的组合映射。
 *
 * @example
 * const q1 = {
 *   a: 1,
 *   b: 2
 * };
 * const q2 = {
 *   a: 3,
 *   c: 4
 * };
 * const q3 = {
 *   b: [5, 6],
 *   d: 7
 * }
 *
 * // Returns
 * // {
 * //   a: [1, 3],
 * //   b: 2,
 * //   c: 4
 * // };
 * combineQueryParameters(q1, q2, true);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: 2,
 * //   c: 4
 * // };
 * combineQueryParameters(q1, q2, false);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: [2, 5, 6],
 * //   d: 7
 * // };
 * combineQueryParameters(q1, q3, true);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: 2,
 * //   d: 7
 * // };
 * combineQueryParameters(q1, q3, false);
 *
 * @private
 */
function combineQueryParameters(q1, q2, preserveQueryParameters) {
  if (!preserveQueryParameters) {
    return combine(q1, q2);
  }

  const result = clone(q1, true);
  for (const param in q2) {
    if (q2.hasOwnProperty(param)) {
      let value = result[param];
      const q2Value = q2[param];
      if (defined(value)) {
        if (!Array.isArray(value)) {
          value = result[param] = [value];
        }

        result[param] = value.concat(q2Value);
      } else {
        result[param] = Array.isArray(q2Value) ? q2Value.slice() : q2Value;
      }
    }
  }

  return result;
}

/**
 * 返回 url（可选）与查询字符串相同，并由代理处理。
 *
 * @param {boolean} [query=false] 如果为 true，则包含查询字符串。
 * @param {boolean} [proxy=false] 如果为 true，则 url 由代理对象（如果已定义）处理。
 *
 * @returns {string} 包含所有请求组件的 url。
 */
Resource.prototype.getUrlComponent = function (query, proxy) {
  if (this.isDataUri) {
    return this._url;
  }

  let url = this._url;
  if (query) {
    url = `${url}${stringifyQuery(this.queryParameters)}`;
  }

  // Restore the placeholders, which may have been escaped in objectToQuery or elsewhere
  url = url.replace(/%7B/g, "{").replace(/%7D/g, "}");

  const templateValues = this._templateValues;
  if (Object.keys(templateValues).length > 0) {
    url = url.replace(/{(.*?)}/g, function (match, key) {
      const replacement = templateValues[key];
      if (defined(replacement)) {
        // use the replacement value from templateValues if there is one...
        return encodeURIComponent(replacement);
      }
      // otherwise leave it unchanged
      return match;
    });
  }

  if (proxy && defined(this.proxy)) {
    url = this.proxy.getURL(url);
  }

  return url;
};

/**
 * 将查询对象转换为字符串。
 *
 * @param {object} queryObject 带有查询参数的对象
 * @returns {string}
 *
 * @private
 */
function stringifyQuery(queryObject) {
  const keys = Object.keys(queryObject);

  if (keys.length === 0) {
    return "";
  }
  if (keys.length === 1 && !defined(queryObject[keys[0]])) {
    // We have 1 key with an undefined value, so this is just a string, not key/value pairs
    return `?${keys[0]}`;
  }

  return `?${objectToQuery(queryObject)}`;
}

/**
 * 组合指定的对象和现有的查询参数。这允许您一次添加多个参数。
 * 而不是一次将它们添加到 queryParameters 属性中。如果已设置值，则将其替换为新值。
 *
 * @param {object} params 查询参数
 * @param {boolean} [useAsDefault=false] 如果为 true，则参数将用作默认值，因此只有在未定义时才会设置它们。
 */
Resource.prototype.setQueryParameters = function (params, useAsDefault) {
  if (useAsDefault) {
    this._queryParameters = combineQueryParameters(
      this._queryParameters,
      params,
      false
    );
  } else {
    this._queryParameters = combineQueryParameters(
      params,
      this._queryParameters,
      false
    );
  }
};

/**
 * 组合指定的对象和现有的查询参数。这允许您一次添加多个参数。
 * 而不是一次将它们添加到 queryParameters 属性中。
 *
 * @param {object} params 查询参数
 */
Resource.prototype.appendQueryParameters = function (params) {
  this._queryParameters = combineQueryParameters(
    params,
    this._queryParameters,
    true
  );
};

/**
 * 合并指定的对象和现有模板值。这允许您一次添加多个值。
 * 而不是一次将它们添加到 templateValues 属性中。如果已设置值，它将变为数组，并附加新值。
 *
 * @param {object} template 模板值
 * @param {boolean} [useAsDefault=false] 如果为 true，则值将用作默认值，因此只有在未定义时才会设置它们。
 */
Resource.prototype.setTemplateValues = function (template, useAsDefault) {
  if (useAsDefault) {
    this._templateValues = combine(this._templateValues, template);
  } else {
    this._templateValues = combine(template, this._templateValues);
  }
};

/**
 * 返回相对于当前实例的资源。所有属性都与当前实例相同，除非在 options 中被覆盖。
 *
 * @param {object} options 具有以下属性的对象
 * @param {string} [options.url] 将相对于当前实例的 url 解析的 url。
 * @param {object} [options.queryParameters] 一个包含将与当前实例的查询参数合并的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。这些将与当前实例的 API 合并。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 加载资源失败时要调用的函数。
 * @param {number} [options.retryAttempts] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {boolean} [options.preserveQueryParameters=false] 如果为 true，则保留当前资源和派生资源中的所有查询参数。如果为 false，则派生参数将替换当前资源的参数。
 *
 * @returns {Resource} 从当前资源派生的资源。
 */
Resource.prototype.getDerivedResource = function (options) {
  const resource = this.clone();
  resource._retryCount = 0;

  if (defined(options.url)) {
    const preserveQuery = defaultValue(options.preserveQueryParameters, false);
    resource.parseUrl(options.url, true, preserveQuery, this._url);
  }

  if (defined(options.queryParameters)) {
    resource._queryParameters = combine(
      options.queryParameters,
      resource.queryParameters
    );
  }
  if (defined(options.templateValues)) {
    resource._templateValues = combine(
      options.templateValues,
      resource.templateValues
    );
  }
  if (defined(options.headers)) {
    resource.headers = combine(options.headers, resource.headers);
  }
  if (defined(options.proxy)) {
    resource.proxy = options.proxy;
  }
  if (defined(options.request)) {
    resource.request = options.request;
  }
  if (defined(options.retryCallback)) {
    resource.retryCallback = options.retryCallback;
  }
  if (defined(options.retryAttempts)) {
    resource.retryAttempts = options.retryAttempts;
  }

  return resource;
};

/**
 * 在资源加载失败时调用。这将调用 retryCallback 函数（如果已定义），直到达到 retryAttempts。
 *
 * @param {RequestErrorEvent} [error] 遇到的错误。
 *
 * @returns {Promise<boolean>} 对布尔值的承诺，如果为 true，则会导致重试资源请求。
 *
 * @private
 */
Resource.prototype.retryOnError = function (error) {
  const retryCallback = this.retryCallback;
  if (
    typeof retryCallback !== "function" ||
    this._retryCount >= this.retryAttempts
  ) {
    return Promise.resolve(false);
  }

  const that = this;
  return Promise.resolve(retryCallback(this, error)).then(function (result) {
    ++that._retryCount;

    return result;
  });
};

/**
 * 复制Resource实例。
 *
 * @param {Resource} [result] 要在其上存储结果的对象。
 *
 * @returns {Resource} 修改后的结果参数或者新的 Resource 实例（如果未提供）。
 */
Resource.prototype.clone = function (result) {
  if (!defined(result)) {
    return new Resource({
      url: this._url,
      queryParameters: this.queryParameters,
      templateValues: this.templateValues,
      headers: this.headers,
      proxy: this.proxy,
      retryCallback: this.retryCallback,
      retryAttempts: this.retryAttempts,
      request: this.request.clone(),
      parseUrl: false,
      credits: defined(this.credits) ? this.credits.slice() : undefined,
    });
  }

  result._url = this._url;
  result._queryParameters = clone(this._queryParameters);
  result._templateValues = clone(this._templateValues);
  result.headers = clone(this.headers);
  result.proxy = this.proxy;
  result.retryCallback = this.retryCallback;
  result.retryAttempts = this.retryAttempts;
  result._retryCount = 0;
  result.request = this.request.clone();

  return result;
};

/**
 * 返回 Resource 的基路径。
 *
 * @param {boolean} [includeQuery = false] 是否在 uri 中包含查询字符串和片段
 *
 * @returns {string} 资源的基 URI
 */
Resource.prototype.getBaseUri = function (includeQuery) {
  return getBaseUri(this.getUrlComponent(includeQuery), includeQuery);
};

/**
 * 在 URL 后附加一个正斜杠。
 */
Resource.prototype.appendForwardSlash = function () {
  this._url = appendForwardSlash(this._url);
};

/**
 * 异步加载资源作为原始二进制数据。 返回一个 Promise，该 Promise 将解析为
 * 加载后为 ArrayBuffer，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @returns {Promise<ArrayBuffer>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load a single URL asynchronously
 * resource.fetchArrayBuffer().then(function(arrayBuffer) {
 *     // use the data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchArrayBuffer = function () {
  return this.fetch({
    responseType: "arraybuffer",
  });
};

/**
 * 创建一个 Resource 并对其调用 fetchArrayBuffer()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @returns {Promise<ArrayBuffer>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchArrayBuffer = function (options) {
  const resource = new Resource(options);
  return resource.fetchArrayBuffer();
};

/**
 * 以异步方式将给定资源加载为 blob。 返回一个 Promise，该 Promise 将解析为
 * 加载后为 Blob，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @returns {Promise<Blob>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load a single URL asynchronously
 * resource.fetchBlob().then(function(blob) {
 *     // use the data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchBlob = function () {
  return this.fetch({
    responseType: "blob",
  });
};

/**
 * 创建一个 Resource 并对其调用 fetchBlob()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @returns {Promise<Blob>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchBlob = function (options) {
  const resource = new Resource(options);
  return resource.fetchBlob();
};

/**
 * 异步加载给定的图像资源。 返回一个 Promise，该 Promise 将解析为
 * an {@link https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap|ImageBitmap} 如果 <code>preferImageBitmap</code> 为 true，并且浏览器支持 <code>createImageBitmap</code> 或其他
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement|Image}，如果图像加载失败，则为 reject。
 *
 * @param {object} [options] 具有以下属性的对象。
 * @param {boolean} [options.preferBlob=false] 如果为 true，我们将通过 blob 加载图像。
 * @param {boolean} [options.preferImageBitmap=false] 如果为 true，则在获取过程中将对图像进行解码并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.flipY=false] 如果为 true，则图像将在解码过程中垂直翻转。仅当浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为 true，则图像中的任何自定义灰度系数或颜色配置文件都将被忽略。仅当浏览器支持 <code>createImageBitmap</code> 时适用。
 * @returns {Promise<ImageBitmap|HTMLImageElement>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * // load a single image asynchronously
 * resource.fetchImage().then(function(image) {
 *     // use the loaded image
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * // load several images in parallel
 * Promise.all([resource1.fetchImage(), resource2.fetchImage()]).then(function(images) {
 *     // images is an array containing all the loaded images
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchImage = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const preferImageBitmap = defaultValue(options.preferImageBitmap, false);
  const preferBlob = defaultValue(options.preferBlob, false);
  const flipY = defaultValue(options.flipY, false);
  const skipColorSpaceConversion = defaultValue(
    options.skipColorSpaceConversion,
    false
  );

  checkAndResetRequest(this.request);
  // We try to load the image normally if
  // 1. Blobs aren't supported
  // 2. It's a data URI
  // 3. It's a blob URI
  // 4. It doesn't have request headers and we preferBlob is false
  if (
    !xhrBlobSupported ||
    this.isDataUri ||
    this.isBlobUri ||
    (!this.hasHeaders && !preferBlob)
  ) {
    return fetchImage({
      resource: this,
      flipY: flipY,
      skipColorSpaceConversion: skipColorSpaceConversion,
      preferImageBitmap: preferImageBitmap,
    });
  }

  const blobPromise = this.fetchBlob();
  if (!defined(blobPromise)) {
    return;
  }

  let supportsImageBitmap;
  let useImageBitmap;
  let generatedBlobResource;
  let generatedBlob;
  return Resource.supportsImageBitmapOptions()
    .then(function (result) {
      supportsImageBitmap = result;
      useImageBitmap = supportsImageBitmap && preferImageBitmap;
      return blobPromise;
    })
    .then(function (blob) {
      if (!defined(blob)) {
        return;
      }
      generatedBlob = blob;
      if (useImageBitmap) {
        return Resource.createImageBitmapFromBlob(blob, {
          flipY: flipY,
          premultiplyAlpha: false,
          skipColorSpaceConversion: skipColorSpaceConversion,
        });
      }
      const blobUrl = window.URL.createObjectURL(blob);
      generatedBlobResource = new Resource({
        url: blobUrl,
      });

      return fetchImage({
        resource: generatedBlobResource,
        flipY: flipY,
        skipColorSpaceConversion: skipColorSpaceConversion,
        preferImageBitmap: false,
      });
    })
    .then(function (image) {
      if (!defined(image)) {
        return;
      }

      // The blob object may be needed for use by a TileDiscardPolicy,
      // so attach it to the image.
      image.blob = generatedBlob;

      if (useImageBitmap) {
        return image;
      }

      window.URL.revokeObjectURL(generatedBlobResource.url);
      return image;
    })
    .catch(function (error) {
      if (defined(generatedBlobResource)) {
        window.URL.revokeObjectURL(generatedBlobResource.url);
      }

      // If the blob load succeeded but the image decode failed, attach the blob
      // to the error object for use by a TileDiscardPolicy.
      // In particular, BingMapsImageryProvider uses this to detect the
      // zero-length response that is returned when a tile is not available.
      error.blob = generatedBlob;

      return Promise.reject(error);
    });
};

/**
 * 获取图像并返回 Promise。
 *
 * @param {object} [options] 具有以下属性的对象。
 * @param {Resource} [options.resource] 指向要获取的图像的 Resource 对象。
 * @param {boolean} [options.preferImageBitmap] 如果为 true，则在获取过程中将对图像进行解码，并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.flipY] 如果为 true，则图像将在解码过程中垂直翻转。仅当浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为 true，则图像中的任何自定义灰度系数或颜色配置文件都将被忽略。仅当浏览器支持 <code>createImageBitmap</code> 时适用。
 * @private
 */
function fetchImage(options) {
  const resource = options.resource;
  const flipY = options.flipY;
  const skipColorSpaceConversion = options.skipColorSpaceConversion;
  const preferImageBitmap = options.preferImageBitmap;

  const request = resource.request;
  request.url = resource.url;
  request.requestFunction = function () {
    let crossOrigin = false;

    // data URIs can't have crossorigin set.
    if (!resource.isDataUri && !resource.isBlobUri) {
      crossOrigin = resource.isCrossOriginUrl;
    }

    const deferred = defer();
    Resource._Implementations.createImage(
      request,
      crossOrigin,
      deferred,
      flipY,
      skipColorSpaceConversion,
      preferImageBitmap
    );

    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise.catch(function (e) {
    // Don't retry cancelled or otherwise aborted requests
    if (request.state !== RequestState.FAILED) {
      return Promise.reject(e);
    }
    return resource.retryOnError(e).then(function (retry) {
      if (retry) {
        // Reset request so it can try again
        request.state = RequestState.UNISSUED;
        request.deferred = undefined;

        return fetchImage({
          resource: resource,
          flipY: flipY,
          skipColorSpaceConversion: skipColorSpaceConversion,
          preferImageBitmap: preferImageBitmap,
        });
      }
      return Promise.reject(e);
    });
  });
}

/**
 * 创建一个 Resource 并对其调用 fetchImage()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {boolean} [options.flipY=false] 是否在获取和解码时垂直翻转图像。仅在请求图像且浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {boolean} [options.preferBlob=false] 如果为 true，我们将通过 blob 加载图像。
 * @param {boolean} [options.preferImageBitmap=false] 如果为 true，则在获取过程中将对图像进行解码并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为 true，则图像中的任何自定义灰度系数或颜色配置文件都将被忽略。仅在请求图像且浏览器支持 <code>createImageBitmap</code> 时适用。
 * @returns {Promise<ImageBitmap|HTMLImageElement>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchImage = function (options) {
  const resource = new Resource(options);
  return resource.fetchImage({
    flipY: options.flipY,
    skipColorSpaceConversion: options.skipColorSpaceConversion,
    preferBlob: options.preferBlob,
    preferImageBitmap: options.preferImageBitmap,
  });
};

/**
 * 异步加载给定的资源为文本。 返回一个 Promise，该 Promise 将解析为
 * 一个 String，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @returns {Promise<string>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load text from a URL, setting a custom header
 * const resource = new Resource({
 *   url: 'http://someUrl.com/someJson.txt',
 *   headers: {
 *     'X-Custom-Header' : 'some value'
 *   }
 * });
 * resource.fetchText().then(function(text) {
 *     // Do something with the text
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchText = function () {
  return this.fetch({
    responseType: "text",
  });
};

/**
 * 创建一个 Resource 并对其调用 fetchText()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @returns {Promise<string>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchText = function (options) {
  const resource = new Resource(options);
  return resource.fetchText();
};

// note: &#42;&#47;&#42; below is */* but that ends the comment block early
/**
 * 以 JSON 格式异步加载给定资源。 返回一个 Promise，该 Promise 将解析为
 * JSON 对象，如果资源加载失败，则拒绝。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。此功能
 * 添加 'Accept: application/json,&#42;&#47;&#42;;q=0.01' 添加到请求标头中，如果不是
 * 已指定。
 *
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.fetchJson().then(function(jsonData) {
 *     // Do something with the JSON object
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchJson = function () {
  const promise = this.fetch({
    responseType: "text",
    headers: {
      Accept: "application/json,*/*;q=0.01",
    },
  });

  if (!defined(promise)) {
    return undefined;
  }

  return promise.then(function (value) {
    if (!defined(value)) {
      return;
    }
    return JSON.parse(value);
  });
};

/**
 * 创建一个 Resource 并对其调用 fetchJson()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchJson = function (options) {
  const resource = new Resource(options);
  return resource.fetchJson();
};

/**
 * 以 XML 形式异步加载给定的资源。 返回一个 Promise，该 Promise 将解析为
 * XML 文档，如果资源加载失败，则拒绝。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @returns {Promise<XMLDocument>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * // load XML from a URL, setting a custom header
 * Cesium.loadXML('http://someUrl.com/someXML.xml', {
 *   'X-Custom-Header' : 'some value'
 * }).then(function(document) {
 *     // Do something with the document
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchXML = function () {
  return this.fetch({
    responseType: "document",
    overrideMimeType: "text/xml",
  });
};

/**
 * 创建一个 Resource 并对其调用 fetchXML()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @returns {Promise<XMLDocument>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchXML = function (options) {
  const resource = new Resource(options);
  return resource.fetchXML();
};

/**
 * 使用 JSONP 请求资源。
 *
 * @param {string} [callbackParameterName='callback'] 服务器期望的回调参数名称。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * // load a data asynchronously
 * resource.fetchJsonp().then(function(data) {
 *     // use the loaded data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchJsonp = function (callbackParameterName) {
  callbackParameterName = defaultValue(callbackParameterName, "callback");

  checkAndResetRequest(this.request);

  //generate a unique function name
  let functionName;
  do {
    functionName = `loadJsonp${CesiumMath.nextRandomNumber()
      .toString()
      .substring(2, 8)}`;
  } while (defined(window[functionName]));

  return fetchJsonp(this, callbackParameterName, functionName);
};

function fetchJsonp(resource, callbackParameterName, functionName) {
  const callbackQuery = {};
  callbackQuery[callbackParameterName] = functionName;
  resource.setQueryParameters(callbackQuery);

  const request = resource.request;
  const url = resource.url;
  request.url = url;
  request.requestFunction = function () {
    const deferred = defer();

    //assign a function with that name in the global scope
    window[functionName] = function (data) {
      deferred.resolve(data);

      try {
        delete window[functionName];
      } catch (e) {
        window[functionName] = undefined;
      }
    };

    Resource._Implementations.loadAndExecuteScript(url, functionName, deferred);
    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise.catch(function (e) {
    if (request.state !== RequestState.FAILED) {
      return Promise.reject(e);
    }

    return resource.retryOnError(e).then(function (retry) {
      if (retry) {
        // Reset request so it can try again
        request.state = RequestState.UNISSUED;
        request.deferred = undefined;

        return fetchJsonp(resource, callbackParameterName, functionName);
      }

      return Promise.reject(e);
    });
  });
}

/**
 * 从 URL 创建一个 Resource 并对其调用 fetchJsonp()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.callbackParameterName='callback'] 服务器期望的回调参数名称。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetchJsonp = function (options) {
  const resource = new Resource(options);
  return resource.fetchJsonp(options.callbackParameterName);
};

/**
 * @private
 */
Resource.prototype._makeRequest = function (options) {
  const resource = this;
  checkAndResetRequest(resource.request);

  const request = resource.request;
  const url = resource.url;
  request.url = url;

  request.requestFunction = function () {
    const responseType = options.responseType;
    const headers = combine(options.headers, resource.headers);
    const overrideMimeType = options.overrideMimeType;
    const method = options.method;
    const data = options.data;
    const deferred = defer();
    const xhr = Resource._Implementations.loadWithXhr(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    );
    if (defined(xhr) && defined(xhr.abort)) {
      request.cancelFunction = function () {
        xhr.abort();
      };
    }
    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise
    .then(function (data) {
      // explicitly set to undefined to ensure GC of request response data. See #8843
      request.cancelFunction = undefined;
      return data;
    })
    .catch(function (e) {
      request.cancelFunction = undefined;
      if (request.state !== RequestState.FAILED) {
        return Promise.reject(e);
      }

      return resource.retryOnError(e).then(function (retry) {
        if (retry) {
          // Reset request so it can try again
          request.state = RequestState.UNISSUED;
          request.deferred = undefined;

          return resource.fetch(options);
        }

        return Promise.reject(e);
      });
    });
};

/**
 * 检查以确保尚未请求 Resource。
 *
 * @param {Request} request 要检查的请求。
 *
 * @private
 */
function checkAndResetRequest(request) {
  if (
    request.state === RequestState.ISSUED ||
    request.state === RequestState.ACTIVE
  ) {
    throw new RuntimeError("The Resource is already being fetched.");
  }

  request.state = RequestState.UNISSUED;
  request.deferred = undefined;
}

const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;

function decodeDataUriText(isBase64, data) {
  const result = decodeURIComponent(data);
  if (isBase64) {
    return atob(result);
  }
  return result;
}

function decodeDataUriArrayBuffer(isBase64, data) {
  const byteString = decodeDataUriText(isBase64, data);
  const buffer = new ArrayBuffer(byteString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i);
  }
  return buffer;
}

function decodeDataUri(dataUriRegexResult, responseType) {
  responseType = defaultValue(responseType, "");
  const mimeType = dataUriRegexResult[1];
  const isBase64 = !!dataUriRegexResult[2];
  const data = dataUriRegexResult[3];
  let buffer;
  let parser;

  switch (responseType) {
    case "":
    case "text":
      return decodeDataUriText(isBase64, data);
    case "arraybuffer":
      return decodeDataUriArrayBuffer(isBase64, data);
    case "blob":
      buffer = decodeDataUriArrayBuffer(isBase64, data);
      return new Blob([buffer], {
        type: mimeType,
      });
    case "document":
      parser = new DOMParser();
      return parser.parseFromString(
        decodeDataUriText(isBase64, data),
        mimeType
      );
    case "json":
      return JSON.parse(decodeDataUriText(isBase64, data));
    default:
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(`Unhandled responseType: ${responseType}`);
    //>>includeEnd('debug');
  }
}

/**
 * 异步加载给定的资源。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。建议您使用
 * 更具体的功能，例如。fetchJson、fetchBlob 等。
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.fetch()
 *   .then(function(body) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetch = function (options) {
  options = defaultClone(options, {});
  options.method = "GET";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并对其调用 fetch()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.fetch = function (options) {
  const resource = new Resource(options);
  return resource.fetch({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步删除给定的资源。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.delete()
 *   .then(function(body) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.delete = function (options) {
  options = defaultClone(options, {});
  options.method = "DELETE";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建 Resource 并对其调用 delete()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.data] 与资源一起发布的数据。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.delete = function (options) {
  const resource = new Resource(options);
  return resource.delete({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    data: options.data,
  });
};

/**
 * 异步获取给定资源的标头。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.head()
 *   .then(function(headers) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.head = function (options) {
  options = defaultClone(options, {});
  options.method = "HEAD";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并对其调用 head()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.head = function (options) {
  const resource = new Resource(options);
  return resource.head({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步获取给定资源的 options。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.options()
 *   .then(function(headers) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.options = function (options) {
  options = defaultClone(options, {});
  options.method = "OPTIONS";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并对其调用 options()。
 *
 * @param {string|object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.options = function (options) {
  const resource = new Resource(options);
  return resource.options({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步将数据发布到给定的资源。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} data 与资源一起发布的数据。
 * @param {object} [options] 对象，具有以下属性：
 * @param {object} [options.data] 与资源一起发布的数据。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.post(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.post = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "POST";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并对其调用 post()。
 *
 * @param {object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发布的数据。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.post = function (options) {
  const resource = new Resource(options);
  return resource.post(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步将数据放入给定的资源。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} data 与资源一起发布的数据。
 * @param {object} [options] 对象，具有以下属性：
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.put(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.put = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "PUT";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建 Resource 并对其调用 put()。
 *
 * @param {object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发布的数据。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.put = function (options) {
  const resource = new Resource(options);
  return resource.put(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步将数据修补到给定资源。 返回一个 Promise，该 Promise 将解析为
 * 加载后的结果，如果资源加载失败，则为 reject。 数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 *
 * @param {object} data 与资源一起发布的数据。
 * @param {object} [options] 对象，具有以下属性：
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {object} [options.headers] 与请求一起发送的其他 HTTP 标头（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.patch(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.patch = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "PATCH";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并对其调用 patch()。
 *
 * @param {object} options 具有以下属性的 url 或对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发布的数据。
 * @param {object} [options.queryParameters] 一个包含查询参数的对象，将在检索资源时发送。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如。{x}）。
 * @param {object} [options.headers={}] 将发送的其他 HTTP 标头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当对此资源的请求失败时要调用的函数。如果返回 true，则将重试该请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应该调用 retryCallback 的次数。
 * @param {Request} [options.request] 将使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。 这控制返回的项的类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个 Promise，该 Promise 将在加载时解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 */
Resource.patch = function (options) {
  const resource = new Resource(options);
  return resource.patch(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * Contains implementations of functions that can be replaced for testing
 *
 * @private
 */
Resource._Implementations = {};

Resource._Implementations.loadImageElement = function (
  url,
  crossOrigin,
  deferred
) {
  const image = new Image();

  image.onload = function () {
    // work-around a known issue with Firefox and dimensionless SVG, see:
    //   - https://github.com/whatwg/html/issues/3510
    //   - https://bugzilla.mozilla.org/show_bug.cgi?id=700533
    if (
      image.naturalWidth === 0 &&
      image.naturalHeight === 0 &&
      image.width === 0 &&
      image.height === 0
    ) {
      // these values affect rasterization and will likely mar the content
      // until Firefox takes a stance on the issue, marred content is better than no content
      // Chromium uses a more refined heuristic about its choice given nil viewBox, and a better stance and solution is
      // proposed later in the original issue thread:
      //   - Chromium behavior: https://github.com/CesiumGS/cesium/issues/9188#issuecomment-704400825
      //   - Cesium's stance/solve: https://github.com/CesiumGS/cesium/issues/9188#issuecomment-720645777
      image.width = 300;
      image.height = 150;
    }
    deferred.resolve(image);
  };

  image.onerror = function (e) {
    deferred.reject(e);
  };

  if (crossOrigin) {
    if (TrustedServers.contains(url)) {
      image.crossOrigin = "use-credentials";
    } else {
      image.crossOrigin = "";
    }
  }

  image.src = url;
};

Resource._Implementations.createImage = function (
  request,
  crossOrigin,
  deferred,
  flipY,
  skipColorSpaceConversion,
  preferImageBitmap
) {
  const url = request.url;
  // Passing an Image to createImageBitmap will force it to run on the main thread
  // since DOM elements don't exist on workers. We convert it to a blob so it's non-blocking.
  // See:
  //    https://bugzilla.mozilla.org/show_bug.cgi?id=1044102#c38
  //    https://bugs.chromium.org/p/chromium/issues/detail?id=580202#c10
  Resource.supportsImageBitmapOptions()
    .then(function (supportsImageBitmap) {
      // We can only use ImageBitmap if we can flip on decode.
      // See: https://github.com/CesiumGS/cesium/pull/7579#issuecomment-466146898
      if (!(supportsImageBitmap && preferImageBitmap)) {
        Resource._Implementations.loadImageElement(url, crossOrigin, deferred);
        return;
      }
      const responseType = "blob";
      const method = "GET";
      const xhrDeferred = defer();
      const xhr = Resource._Implementations.loadWithXhr(
        url,
        responseType,
        method,
        undefined,
        undefined,
        xhrDeferred,
        undefined,
        undefined,
        undefined
      );

      if (defined(xhr) && defined(xhr.abort)) {
        request.cancelFunction = function () {
          xhr.abort();
        };
      }
      return xhrDeferred.promise
        .then(function (blob) {
          if (!defined(blob)) {
            deferred.reject(
              new RuntimeError(
                `Successfully retrieved ${url} but it contained no content.`
              )
            );
            return;
          }

          return Resource.createImageBitmapFromBlob(blob, {
            flipY: flipY,
            premultiplyAlpha: false,
            skipColorSpaceConversion: skipColorSpaceConversion,
          });
        })
        .then(function (image) {
          deferred.resolve(image);
        });
    })
    .catch(function (e) {
      deferred.reject(e);
    });
};

/**
 * Wrapper for createImageBitmap
 *
 * @private
 */
Resource.createImageBitmapFromBlob = function (blob, options) {
  Check.defined("options", options);
  Check.typeOf.bool("options.flipY", options.flipY);
  Check.typeOf.bool("options.premultiplyAlpha", options.premultiplyAlpha);
  Check.typeOf.bool(
    "options.skipColorSpaceConversion",
    options.skipColorSpaceConversion
  );

  return createImageBitmap(blob, {
    imageOrientation: options.flipY ? "flipY" : "none",
    premultiplyAlpha: options.premultiplyAlpha ? "premultiply" : "none",
    colorSpaceConversion: options.skipColorSpaceConversion ? "none" : "default",
  });
};

function loadWithHttpRequest(
  url,
  responseType,
  method,
  data,
  headers,
  deferred,
  overrideMimeType
) {
  // Note: only the 'json' and 'text' responseTypes transforms the loaded buffer
  fetch(url, {
    method,
    headers,
  })
    .then(async (response) => {
      if (!response.ok) {
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        deferred.reject(
          new RequestErrorEvent(response.status, response, responseHeaders)
        );
        return;
      }

      switch (responseType) {
        case "text":
          deferred.resolve(response.text());
          break;
        case "json":
          deferred.resolve(response.json());
          break;
        default:
          deferred.resolve(new Uint8Array(await response.arrayBuffer()).buffer);
          break;
      }
    })
    .catch(() => {
      deferred.reject(new RequestErrorEvent());
    });
}

const noXMLHttpRequest = typeof XMLHttpRequest === "undefined";
Resource._Implementations.loadWithXhr = function (
  url,
  responseType,
  method,
  data,
  headers,
  deferred,
  overrideMimeType
) {
  const dataUriRegexResult = dataUriRegex.exec(url);
  if (dataUriRegexResult !== null) {
    deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
    return;
  }

  if (noXMLHttpRequest) {
    loadWithHttpRequest(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    );
    return;
  }

  const xhr = new XMLHttpRequest();

  if (TrustedServers.contains(url)) {
    xhr.withCredentials = true;
  }

  xhr.open(method, url, true);

  if (defined(overrideMimeType) && defined(xhr.overrideMimeType)) {
    xhr.overrideMimeType(overrideMimeType);
  }

  if (defined(headers)) {
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
  }

  if (defined(responseType)) {
    xhr.responseType = responseType;
  }

  // While non-standard, file protocol always returns a status of 0 on success
  let localFile = false;
  if (typeof url === "string") {
    localFile =
      url.indexOf("file://") === 0 ||
      (typeof window !== "undefined" && window.location.origin === "file://");
  }

  xhr.onload = function () {
    if (
      (xhr.status < 200 || xhr.status >= 300) &&
      !(localFile && xhr.status === 0)
    ) {
      deferred.reject(
        new RequestErrorEvent(
          xhr.status,
          xhr.response,
          xhr.getAllResponseHeaders()
        )
      );
      return;
    }

    const response = xhr.response;
    const browserResponseType = xhr.responseType;

    if (method === "HEAD" || method === "OPTIONS") {
      const responseHeaderString = xhr.getAllResponseHeaders();
      const splitHeaders = responseHeaderString.trim().split(/[\r\n]+/);

      const responseHeaders = {};
      splitHeaders.forEach(function (line) {
        const parts = line.split(": ");
        const header = parts.shift();
        responseHeaders[header] = parts.join(": ");
      });

      deferred.resolve(responseHeaders);
      return;
    }

    //All modern browsers will go into either the first or second if block or last else block.
    //Other code paths support older browsers that either do not support the supplied responseType
    //or do not support the xhr.response property.
    if (xhr.status === 204) {
      // accept no content
      deferred.resolve(undefined);
    } else if (
      defined(response) &&
      (!defined(responseType) || browserResponseType === responseType)
    ) {
      deferred.resolve(response);
    } else if (responseType === "json" && typeof response === "string") {
      try {
        deferred.resolve(JSON.parse(response));
      } catch (e) {
        deferred.reject(e);
      }
    } else if (
      (browserResponseType === "" || browserResponseType === "document") &&
      defined(xhr.responseXML) &&
      xhr.responseXML.hasChildNodes()
    ) {
      deferred.resolve(xhr.responseXML);
    } else if (
      (browserResponseType === "" || browserResponseType === "text") &&
      defined(xhr.responseText)
    ) {
      deferred.resolve(xhr.responseText);
    } else {
      deferred.reject(
        new RuntimeError("Invalid XMLHttpRequest response type.")
      );
    }
  };

  xhr.onerror = function (e) {
    deferred.reject(new RequestErrorEvent());
  };

  xhr.send(data);

  return xhr;
};

Resource._Implementations.loadAndExecuteScript = function (
  url,
  functionName,
  deferred
) {
  return loadAndExecuteScript(url, functionName).catch(function (e) {
    deferred.reject(e);
  });
};

/**
 * 默认实现
 *
 * @private
 */
Resource._DefaultImplementations = {};
Resource._DefaultImplementations.createImage =
  Resource._Implementations.createImage;
Resource._DefaultImplementations.loadWithXhr =
  Resource._Implementations.loadWithXhr;
Resource._DefaultImplementations.loadAndExecuteScript =
  Resource._Implementations.loadAndExecuteScript;

/**
 * 初始化为当前浏览器位置的资源实例
 *
 * @type {Resource}
 * @constant
 */
Resource.DEFAULT = Object.freeze(
  new Resource({
    url:
      typeof document === "undefined"
        ? ""
        : document.location.href.split("?")[0],
  })
);

/**
 * 返回属性值的函数。
 * @callback Resource.RetryCallback
 *
 * @param {Resource} [resource] 加载失败的资源。
 * @param {RequestErrorEvent} [error] 加载资源期间发生的错误。
 * @returns {boolean|Promise<boolean>} 如果为 true 或解析为 true 的 Promise，则将重试资源。否则将返回失败。
 */
export default Resource;
