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
 * Get the final URL to use to request a given resource.
 *
 * @param {string} resource The resource to request.
 * @returns {string} proxied resource
 */
DefaultProxy.prototype.getURL = function (resource) {
  const prefix = this.proxy.indexOf("?") === -1 ? "?" : "";
  return this.proxy + prefix + encodeURIComponent(resource);
};

export default DefaultProxy;
