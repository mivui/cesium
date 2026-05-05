/**
 * 一个简单的代理，它将所需的资源作为唯一的查询参数附加到给定的代理URL。
 *
 * @alias DefaultProxy
 * @constructor
 * @extends {Proxy}
 *
 * @param {string} proxy 用于请求所有资源的代理URL。
 */
function DefaultProxy(proxy) {
  this.proxy = proxy;
}

/**
 * 获取用于请求给定资源的最终URL。
 *
 * @param {string} resource 要请求的资源。
 * @returns {string} 代理后的资源URL。
 */
DefaultProxy.prototype.getURL = function (resource) {
  const prefix = this.proxy.indexOf("?") === -1 ? "?" : "";
  return this.proxy + prefix + encodeURIComponent(resource);
};

export default DefaultProxy;
