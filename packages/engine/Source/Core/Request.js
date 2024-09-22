import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import RequestState from "./RequestState.js";
import RequestType from "./RequestType.js";

/**
* 存储用于发出请求的信息。通常，这不需要直接构造。
 *
 * @alias Request
 * @constructor

 * @param {object} [options]  对象，具有以下属性:
* @param {string} [options.url] 要请求的 URL。
 * @param {Request.RequestCallback} [options.requestFunction] 发出实际数据请求的函数。
 * @param {Request.CancelCallback} [options.cancelFunction] 取消请求时调用的函数。
 * @param {Request.PriorityCallback} [options.priorityFunction] 为更新请求的优先级而调用的函数，每帧发生一次。
 * @param {number} [options.priority=0.0] 请求的初始优先级。
 * @param {boolean} [options.throttle=false] 是否限制请求并确定其优先级。如果为 false，则会立即发送请求。如果为 true，则请求将被限制并根据优先级发送。
 * @param {boolean} [options.throttleByServer=false] 是否按服务器限制请求。
 * @param {RequestType} [options.type=RequestType.OTHER] 请求的类型。
 * @param {string} [options.serverKey] 用于标识请求将要发送到的服务器的键。
 */
function Request(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const throttleByServer = defaultValue(options.throttleByServer, false);
  const throttle = defaultValue(options.throttle, false);

  /**
   * 要请求的 URL。
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
   * 取消请求时调用的函数。
   *
   * @type {Request.CancelCallback}
   */
  this.cancelFunction = options.cancelFunction;

  /**
   * 为更新请求的优先级而调用的函数，每帧发生一次。
   *
   * @type {Request.PriorityCallback}
   */
  this.priorityFunction = options.priorityFunction;

  /**
   * 优先级是无单位的值，其中较低的值表示较高的优先级。
   * 对于基于世界的对象，这通常是与摄像机的距离。
   * 没有优先级函数的请求默认为优先级 0。
   *
   * 如果定义了 priorityFunction，则使用该调用的结果在每一帧中更新此值。
   *
   * @type {number}
   * @default 0.0
   */
  this.priority = defaultValue(options.priority, 0.0);

  /**
   * 是否限制请求并确定请求的优先级。如果为 false，则会立即发送请求。如果为 true，则
   * 请求将受到限制，并根据优先级发送。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttle = throttle;

  /**
   * 是否按服务器限制请求。浏览器通常支持大约 6-8 个并行连接
   * 对于 HTTP/1 服务器，对于 HTTP/2 服务器，连接数量不受限制。设置此值
   * 对于通过 HTTP/1 服务器的请求，最好设置为 <code>true</code>。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttleByServer = throttleByServer;

  /**
   * Type of request.
   *
   * @type {RequestType}
   * @readonly
   *
   * @default RequestType.OTHER
   */
  this.type = defaultValue(options.type, RequestType.OTHER);

  /**
   * 用于标识请求将要发送到的服务器的密钥。它派生自 url 的 authority 和 scheme。
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
   * 请求的延迟承诺。
   *
   * @type {object}
   *
   * @private
   */
  this.deferred = undefined;

  /**
   * 请求是否已明确取消。
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
 * 复制Request实例。
 *
 * @param {Request} [result] 要在其上存储结果的对象。
 *
 * @returns {Request} 修改后的结果参数或者新的 Resource 实例（如果未提供）。
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
 * @returns {Promise<void>} 请求数据的 Promise。
 */

/**
 * 在 the request is cancelled.
 * @callback Request.CancelCallback
 */

/**
 * 为更新请求的优先级而调用的函数，每帧发生一次。
 * @callback Request.PriorityCallback
 * @returns {number} 更新的优先级值。
 */
export default Request;
