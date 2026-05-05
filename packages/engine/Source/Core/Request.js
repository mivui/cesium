import Frozen from "./Frozen.js";
import defined from "./defined.js";
import RequestState from "./RequestState.js";
import RequestType from "./RequestType.js";

/**
 * 存储用于发出请求的信息。通常不需要直接构造。
 *
 * @alias Request
 * @constructor

 * @param {object} [options] 具有下列属性的对象：
 * @param {string} [options.url] 要请求的URL。
 * @param {Request.RequestCallback} [options.requestFunction] 发出实际数据请求的函数。
 * @param {Request.CancelCallback} [options.cancelFunction] 请求取消时调用的函数。
 * @param {Request.PriorityCallback} [options.priorityFunction] 用于更新请求优先级的函数，每帧调用一次。
 * @param {number} [options.priority=0.0] 请求初始优先级。
 * @param {boolean} [options.throttle=false] 是否限制并优先处理请求。如果为false，请求将立即发送。如果为true，请求将根据优先级被限制并发送。
 * @param {boolean} [options.throttleByServer=false] 是否按服务器限制请求。
 * @param {RequestType} [options.type=RequestType.OTHER] 请求类型。
 * @param {string} [options.serverKey] 用于标识请求目标服务器的键。
 */
function Request(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const throttleByServer = options.throttleByServer ?? false;
  const throttle = options.throttle ?? false;

  /**
   * 要请求的URL。
   *
   * @type {string}
   */
  this.url = options.url;

  /**
   * 发出实际数据请求的函数。
   *
   * @type {Request.RequestCallback}
   */
  this.requestFunction = options.requestFunction;

  /**
   * 请求取消时调用的函数。
   *
   * @type {Request.CancelCallback}
   */
  this.cancelFunction = options.cancelFunction;

  /**
   * 用于更新请求优先级的函数，每帧调用一次。
   *
   * @type {Request.PriorityCallback}
   */
  this.priorityFunction = options.priorityFunction;

  /**
   * 优先级是一个无单位的值，较低的值表示较高的优先级。
   * 对于基于世界的对象，这通常是距相机的距离。
   * 没有优先级函数的请求默认优先级为0。
   *
   * 如果定义了priorityFunction，则此值每帧都会使用该调用的结果进行更新。
   *
   * @type {number}
   * @default 0.0
   */
  this.priority = options.priority ?? 0.0;

  /**
   * 是否限制并优先处理请求。如果为false，请求将立即发送。如果为true，
   * 请求将根据优先级被限制并发送。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttle = throttle;

  /**
   * 是否按服务器限制请求。浏览器通常为HTTP/1服务器支持约6-8个并行连接，
   * 而为HTTP/2服务器支持无限数量的连接。对于通过HTTP/1服务器的请求，
   * 将此值设置为<code>true</code>是更佳选择。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttleByServer = throttleByServer;

  /**
   * 请求类型。
   *
   * @type {RequestType}
   * @readonly
   *
   * @default RequestType.OTHER
   */
  this.type = options.type ?? RequestType.OTHER;

  /**
   * 用于标识请求目标服务器的键。它从URL的authority和scheme派生。
   *
   * @type {string}
   *
   * @private
   */
  this.serverKey = options.serverKey;

  /**
   * 请求的当前状态。
   *
   * @type {RequestState}
   * @readonly
   */
  this.state = RequestState.UNISSUED;

  /**
   * 请求的延迟Promise。
   *
   * @type {object}
   *
   * @private
   */
  this.deferred = undefined;

  /**
   * Whether the request was explicitly cancelled.
   *
   * @type {boolean}
   *
   * @private
   */
  this.cancelled = false;
}

/**
 * 将请求标记为已取消。
 *
 * @private
 */
Request.prototype.cancel = function () {
  this.cancelled = true;
};

/**
 * 复制请求实例。
 *
 * @param {Request} [result] 存储结果的对象。
 *
 * @returns {Request} 修改后的结果参数，如果未提供则返回新的Resource实例。
 */
Request.prototype.clone = function (result) {
  if (!defined(result)) {
    return new Request(this);
  }

  result.url = this.url;
  result.requestFunction = this.requestFunction;
  result.cancelFunction = this.cancelFunction;
  result.priorityFunction = this.priorityFunction;
  result.priority = this.priority;
  result.throttle = this.throttle;
  result.throttleByServer = this.throttleByServer;
  result.type = this.type;
  result.serverKey = this.serverKey;

  // These get defaulted because the cloned request hasn't been issued
  result.state = RequestState.UNISSUED;
  result.deferred = undefined;
  result.cancelled = false;

  return result;
};

/**
 * 发出实际数据请求的函数。
 * @callback Request.RequestCallback
 * @returns {Promise<void>} 请求数据的Promise。
 */

/**
 * 请求取消时调用的函数。
 * @callback Request.CancelCallback
 */

/**
 * 用于更新请求优先级的函数，每帧调用一次。
 * @callback Request.PriorityCallback
 * @returns {number} 更新后的优先级值。
 */
export default Request;
