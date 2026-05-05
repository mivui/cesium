import DeveloperError from "./DeveloperError.js";

/**
 * 用于代理{@link Resource}发出的请求的基础类。
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
 * 获取用于请求给定资源的最终URL。
 *
 * @param {string} resource 要请求的资源。
 * @returns {string} 代理后的资源URL。
 * @function
 */
Proxy.prototype.getURL = DeveloperError.throwInstantiationError;

export default Proxy;
