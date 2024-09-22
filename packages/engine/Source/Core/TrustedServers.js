import Uri from "urijs";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 包含所有受信任的服务器的单一实例。凭证将与
 * 对这些服务器的任何请求。
 *
 * @namespace TrustedServers
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
const TrustedServers = {};
let _servers = {};

/**
 * 将受信任的服务器添加到注册表
 *
 * @param {string} host 需要添加的主机。
 * @param {number} port 用于访问主机的端口。
 *
 * @example
 * // Add a trusted server
 * TrustedServers.add('my.server.com', 80);
 */
TrustedServers.add = function (host, port) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(host)) {
    throw new DeveloperError("host is required.");
  }
  if (!defined(port) || port <= 0) {
    throw new DeveloperError("port is required to be greater than 0.");
  }
  //>>includeEnd('debug');

  const authority = `${host.toLowerCase()}:${port}`;
  if (!defined(_servers[authority])) {
    _servers[authority] = true;
  }
};

/**
 * 从注册表中删除受信任的服务器
 *
 * @param {string} host 要删除的主机。
 * @param {number} port 用于访问主机的端口。
 *
 * @example
 * // Remove a trusted server
 * TrustedServers.remove('my.server.com', 80);
 */
TrustedServers.remove = function (host, port) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(host)) {
    throw new DeveloperError("host is required.");
  }
  if (!defined(port) || port <= 0) {
    throw new DeveloperError("port is required to be greater than 0.");
  }
  //>>includeEnd('debug');

  const authority = `${host.toLowerCase()}:${port}`;
  if (defined(_servers[authority])) {
    delete _servers[authority];
  }
};

function getAuthority(url) {
  const uri = new Uri(url);
  uri.normalize();

  // Removes username:password@ so we just have host[:port]
  let authority = uri.authority();
  if (authority.length === 0) {
    return undefined; // Relative URL
  }
  uri.authority(authority);

  if (authority.indexOf("@") !== -1) {
    const parts = authority.split("@");
    authority = parts[1];
  }

  // If the port is missing add one based on the scheme
  if (authority.indexOf(":") === -1) {
    let scheme = uri.scheme();
    if (scheme.length === 0) {
      scheme = window.location.protocol;
      scheme = scheme.substring(0, scheme.length - 1);
    }
    if (scheme === "http") {
      authority += ":80";
    } else if (scheme === "https") {
      authority += ":443";
    } else {
      return undefined;
    }
  }

  return authority;
}

/**
 * 测试服务器是否受信任。如果 URL 中包含端口，则必须使用端口添加服务器。
 *
 * @param {string} url 要针对受信任列表进行测试的 url
 *
 * @returns {boolean} 如果 url 可信，则返回 true，否则返回 false。
 *
 * @example
 * // Add server
 * TrustedServers.add('my.server.com', 81);
 *
 * // Check if server is trusted
 * if (TrustedServers.contains('https://my.server.com:81/path/to/file.png')) {
 *     // my.server.com:81 is trusted
 * }
 * if (TrustedServers.contains('https://my.server.com/path/to/file.png')) {
 *     // my.server.com isn't trusted
 * }
 */
TrustedServers.contains = function (url) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(url)) {
    throw new DeveloperError("url is required.");
  }
  //>>includeEnd('debug');
  const authority = getAuthority(url);
  if (defined(authority) && defined(_servers[authority])) {
    return true;
  }

  return false;
};

/**
 * 清除注册表
 *
 * @example
 * // Remove a trusted server
 * TrustedServers.clear();
 */
TrustedServers.clear = function () {
  _servers = {};
};
export default TrustedServers;
