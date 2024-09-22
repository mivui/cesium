import DeveloperError from "./DeveloperError.js";

/**
 * {@link Resource} 发出的代理请求的基类。
 *
 * @alias Proxy
 * @constructor
 *
 * @see DefaultProxy
 */
function Proxy() {
  DeveloperError.throwInstantiationError();
}

/**
 * 获取用于请求给定资源的最终 URL。
 *
 * @param {string} resource 要请求的资源。
 * @returns {string} 代理资源
 * @function
 */
Proxy.prototype.getURL = DeveloperError.throwInstantiationError;

export default Proxy;
