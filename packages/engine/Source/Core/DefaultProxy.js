/**
 * 一个简单的代理，将所需资源附加为唯一的查询参数
 * 添加到给定的代理 URL。
 *
 * @alias DefaultProxy
 * @constructor
 * @extends {Proxy}
 *
 * @param {string} proxy 将用于请求所有资源的代理 URL。
 */
function DefaultProxy(proxy) {
  this.proxy = proxy;
}

/**
 * 获取用于请求给定资源的最终 URL。
 *
 * @param {string} resource 要请求的资源。
 * @returns {string} 代理资源
 */
DefaultProxy.prototype.getURL = function (resource) {
  const prefix = this.proxy.indexOf("?") === -1 ? "?" : "";
  return this.proxy + prefix + encodeURIComponent(resource);
};

export default DefaultProxy;
