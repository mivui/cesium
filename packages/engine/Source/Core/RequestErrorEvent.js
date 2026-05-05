import defined from "./defined.js";
import parseResponseHeaders from "./parseResponseHeaders.js";

/**
 * 请求遇到错误时引发的事件。
 *
 * @constructor
 * @alias RequestErrorEvent
 *
 * @param {number} [statusCode] HTTP错误状态码，例如404。
 * @param {object} [response] 随错误一起包含的响应。
 * @param {string|object} [responseHeaders] 响应标头，表示为对象字面量或
 *                        XMLHttpRequest的getAllResponseHeaders()函数返回的格式的字符串。
 */
function RequestErrorEvent(statusCode, response, responseHeaders) {
  /**
   * HTTP错误状态码，例如404。如果错误没有特定的
   * HTTP代码，此属性将为undefined。
   *
   * @type {number}
   */
  this.statusCode = statusCode;

  /**
   * 随错误一起包含的响应。如果错误不包含响应，
   * 此属性将为undefined。
   *
   * @type {object}
   */
  this.response = response;

  /**
   * 响应中包含的标头，表示为键值对的对象字面量。
   * 如果错误不包含任何标头，此属性将为undefined。
   *
   * @type {object}
   */
  this.responseHeaders = responseHeaders;

  if (typeof this.responseHeaders === "string") {
    this.responseHeaders = parseResponseHeaders(this.responseHeaders);
  }
}

/**
 * 创建表示此RequestErrorEvent的字符串。
 * @memberof RequestErrorEvent
 *
 * @returns {string} 表示提供的RequestErrorEvent的字符串。
 */
RequestErrorEvent.prototype.toString = function () {
  let str = "Request has failed.";
  if (defined(this.statusCode)) {
    str += ` Status Code: ${this.statusCode}`;
  }
  return str;
};
export default RequestErrorEvent;
