import Uri from "urijs";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defer from "./defer.js";
import defined from "./defined.js";
import Event from "./Event.js";
import Heap from "./Heap.js";
import isBlobUri from "./isBlobUri.js";
import isDataUri from "./isDataUri.js";
import RequestState from "./RequestState.js";

function sortRequests(a, b) {
  return a.priority - b.priority;
}

const statistics = {
  numberOfAttemptedRequests: 0,
  numberOfActiveRequests: 0,
  numberOfCancelledRequests: 0,
  numberOfCancelledActiveRequests: 0,
  numberOfFailedRequests: 0,
  numberOfActiveRequestsEver: 0,
  lastNumberOfActiveRequests: 0,
};

let priorityHeapLength = 20;
const requestHeap = new Heap({
  comparator: sortRequests,
});
requestHeap.maximumLength = priorityHeapLength;
requestHeap.reserve(priorityHeapLength);

const activeRequests = [];
let numberOfActiveRequestsByServer = {};

const pageUri =
  typeof document !== "undefined" ? new Uri(document.location.href) : new Uri();

const requestCompletedEvent = new Event();

/**
 * 请求调度程序用于跟踪和限制活动请求的数量，以便确定传入请求的优先级。能力
 * 在 CesiumJS 中保持对请求数量的控制很重要，因为由于相机位置的变化等事件，
 * 可能会生成大量新请求，并且许多正在进行的请求可能会变得多余。请求调度程序手动限制
 * 请求数，以便较新的请求在较短的队列中等待，而不必与已过期的请求争夺带宽。
 *
 * @namespace RequestScheduler
 *
 */
function RequestScheduler() {}

/**
 * 同时活动请求的最大数量。未受限制的请求不遵守此限制。
 * @type {number}
 * @default 50
 */
RequestScheduler.maximumRequests = 50;

/**
 * 每个服务器同时活动请求的最大数量。未受限制的请求或服务器
 * {@link requestsByServer} 中列出的 * 不遵守此限制。
 * @type {number}
 * @default 18
 */
RequestScheduler.maximumRequestsPerServer = 18;

/**
 * 用于限制的覆盖的每个服务器密钥列表，而不是 <code>maximumRequestsPerServer</code>。
 * 从已知的 HTTP/2 或 HTTP/3 服务器流式传输数据时很有用。
 * @type {object}
 *
 * @example
 * RequestScheduler.requestsByServer["myserver.com:443"] = 18;
 *
 * @example
 * RequestScheduler.requestsByServer = {
 *   "api.cesium.com:443": 18,
 *   "assets.cesium.com:443": 18,
 * };
 */
RequestScheduler.requestsByServer = {};

/**
 * 指定请求调度程序是应限制传入请求，还是让浏览器将请求置于其控制之下。
 * @type {boolean}
 * @default true
 */
RequestScheduler.throttleRequests = true;

/**
 * 如果为 true，则每帧将统计信息记录到控制台
 * @type {boolean}
 * @default false
 * @private
 */
RequestScheduler.debugShowStatistics = false;

/**
 * 请求完成时引发的事件。 传递事件处理程序
 * 如果请求失败，则为 Error 对象。
 *
 * @type {Event}
 * @default Event()
 * @private
 */
RequestScheduler.requestCompletedEvent = requestCompletedEvent;

Object.defineProperties(RequestScheduler, {
  /**
   * 返回请求调度程序使用的统计信息。
   *
   * @memberof RequestScheduler
   *
   * @type {object}
   * @readonly
   * @private
   */
  statistics: {
    get: function () {
      return statistics;
    },
  },

  /**
   * 优先级堆的最大大小。这限制了按优先级排序的请求数。仅适用于尚未激活的请求。
   *
   * @memberof RequestScheduler
   *
   * @type {number}
   * @default 20
   * @private
   */
  priorityHeapLength: {
    get: function () {
      return priorityHeapLength;
    },
    set: function (value) {
      // If the new length shrinks the heap, need to cancel some of the requests.
      // Since this value is not intended to be tweaked regularly it is fine to just cancel the high priority requests.
      if (value < priorityHeapLength) {
        while (requestHeap.length > value) {
          const request = requestHeap.pop();
          cancelRequest(request);
        }
      }
      priorityHeapLength = value;
      requestHeap.maximumLength = value;
      requestHeap.reserve(value);
    },
  },
});

function updatePriority(request) {
  if (defined(request.priorityFunction)) {
    request.priority = request.priorityFunction();
  }
}

/**
 * 检查特定服务器密钥是否有空位。如果 desiredRequests 大于 1，则检查队列是否有空间来安排多个请求。
 * @param {string} serverKey {@link RequestScheduler.getServerKey} 返回的服务器密钥。
 * @param {number} [desiredRequests=1] 调用方计划请求的请求数
 * @return {boolean} 如果有足够的空隙用于 <code>desiredRequests</code> 更多请求，则为 True。
 * @private
 */
RequestScheduler.serverHasOpenSlots = function (serverKey, desiredRequests) {
  desiredRequests = defaultValue(desiredRequests, 1);

  const maxRequests = defaultValue(
    RequestScheduler.requestsByServer[serverKey],
    RequestScheduler.maximumRequestsPerServer
  );
  const hasOpenSlotsServer =
    numberOfActiveRequestsByServer[serverKey] + desiredRequests <= maxRequests;

  return hasOpenSlotsServer;
};

/**
 * 检查优先级堆是否有开放的插槽，无论它们位于哪个服务器
 * 来自。这在 {@link Multiple3DTileContent} 中用于确定何时
 * 所有请求都可以安排
 * @param {number} desiredRequests 调用方打算发出的请求数
 * 如果堆有足够的可用槽来满足 desiredRequests，则@return {boolean} <code>true</code>。<code>false</code> 否则。
 *
 * @private
 */
RequestScheduler.heapHasOpenSlots = function (desiredRequests) {
  const hasOpenSlotsHeap =
    requestHeap.length + desiredRequests <= priorityHeapLength;
  return hasOpenSlotsHeap;
};

function issueRequest(request) {
  if (request.state === RequestState.UNISSUED) {
    request.state = RequestState.ISSUED;
    request.deferred = defer();
  }
  return request.deferred.promise;
}

function getRequestReceivedFunction(request) {
  return function (results) {
    if (request.state === RequestState.CANCELLED) {
      // If the data request comes back but the request is cancelled, ignore it.
      return;
    }
    // explicitly set to undefined to ensure GC of request response data. See #8843
    const deferred = request.deferred;

    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    requestCompletedEvent.raiseEvent();
    request.state = RequestState.RECEIVED;
    request.deferred = undefined;

    deferred.resolve(results);
  };
}

function getRequestFailedFunction(request) {
  return function (error) {
    if (request.state === RequestState.CANCELLED) {
      // If the data request comes back but the request is cancelled, ignore it.
      return;
    }
    ++statistics.numberOfFailedRequests;
    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    requestCompletedEvent.raiseEvent(error);
    request.state = RequestState.FAILED;
    request.deferred.reject(error);
  };
}

function startRequest(request) {
  const promise = issueRequest(request);
  request.state = RequestState.ACTIVE;
  activeRequests.push(request);
  ++statistics.numberOfActiveRequests;
  ++statistics.numberOfActiveRequestsEver;
  ++numberOfActiveRequestsByServer[request.serverKey];
  request
    .requestFunction()
    .then(getRequestReceivedFunction(request))
    .catch(getRequestFailedFunction(request));
  return promise;
}

function cancelRequest(request) {
  const active = request.state === RequestState.ACTIVE;
  request.state = RequestState.CANCELLED;
  ++statistics.numberOfCancelledRequests;
  // check that deferred has not been cleared since cancelRequest can be called
  // on a finished request, e.g. by clearForSpecs during tests
  if (defined(request.deferred)) {
    const deferred = request.deferred;
    request.deferred = undefined;
    deferred.reject();
  }

  if (active) {
    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    ++statistics.numberOfCancelledActiveRequests;
  }

  if (defined(request.cancelFunction)) {
    request.cancelFunction();
  }
}

/**
 * 按优先级对请求进行排序并启动请求。
 * @private
 */
RequestScheduler.update = function () {
  let i;
  let request;

  // Loop over all active requests. Cancelled, failed, or received requests are removed from the array to make room for new requests.
  let removeCount = 0;
  const activeLength = activeRequests.length;
  for (i = 0; i < activeLength; ++i) {
    request = activeRequests[i];
    if (request.cancelled) {
      // Request was explicitly cancelled
      cancelRequest(request);
    }
    if (request.state !== RequestState.ACTIVE) {
      // Request is no longer active, remove from array
      ++removeCount;
      continue;
    }
    if (removeCount > 0) {
      // Shift back to fill in vacated slots from completed requests
      activeRequests[i - removeCount] = request;
    }
  }
  activeRequests.length -= removeCount;

  // Update priority of issued requests and resort the heap
  const issuedRequests = requestHeap.internalArray;
  const issuedLength = requestHeap.length;
  for (i = 0; i < issuedLength; ++i) {
    updatePriority(issuedRequests[i]);
  }
  requestHeap.resort();

  // Get the number of open slots and fill with the highest priority requests.
  // Un-throttled requests are automatically added to activeRequests, so activeRequests.length may exceed maximumRequests
  const openSlots = Math.max(
    RequestScheduler.maximumRequests - activeRequests.length,
    0
  );
  let filledSlots = 0;
  while (filledSlots < openSlots && requestHeap.length > 0) {
    // Loop until all open slots are filled or the heap becomes empty
    request = requestHeap.pop();
    if (request.cancelled) {
      // Request was explicitly cancelled
      cancelRequest(request);
      continue;
    }

    if (
      request.throttleByServer &&
      !RequestScheduler.serverHasOpenSlots(request.serverKey)
    ) {
      // Open slots are available, but the request is throttled by its server. Cancel and try again later.
      cancelRequest(request);
      continue;
    }

    startRequest(request);
    ++filledSlots;
  }

  updateStatistics();
};

/**
 * 从给定的 url 获取服务器密钥。
 *
 * @param {string} url 网址。
 * @returns {string} 服务器密钥。
 * @private
 */
RequestScheduler.getServerKey = function (url) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("url", url);
  //>>includeEnd('debug');

  let uri = new Uri(url);
  if (uri.scheme() === "") {
    uri = uri.absoluteTo(pageUri);
    uri.normalize();
  }

  let serverKey = uri.authority();
  if (!/:/.test(serverKey)) {
    // If the authority does not contain a port number, add port 443 for https or port 80 for http
    serverKey = `${serverKey}:${uri.scheme() === "https" ? "443" : "80"}`;
  }

  const length = numberOfActiveRequestsByServer[serverKey];
  if (!defined(length)) {
    numberOfActiveRequestsByServer[serverKey] = 0;
  }

  return serverKey;
};

/**
 * 发出请求。如果 request.throttle 为 false，则立即发送请求。否则，请求将为
 * 在发送之前按优先级排队和排序。
 *
 * @param {Request} request 请求对象。
 *
 * @returns {Promise|undefined} 请求数据的 Promise，如果此请求没有足够高的优先级来发出，则为 undefined。
 *
 * @private
 */
RequestScheduler.request = function (request) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("request", request);
  Check.typeOf.string("request.url", request.url);
  Check.typeOf.func("request.requestFunction", request.requestFunction);
  //>>includeEnd('debug');

  if (isDataUri(request.url) || isBlobUri(request.url)) {
    requestCompletedEvent.raiseEvent();
    request.state = RequestState.RECEIVED;
    return request.requestFunction();
  }

  ++statistics.numberOfAttemptedRequests;

  if (!defined(request.serverKey)) {
    request.serverKey = RequestScheduler.getServerKey(request.url);
  }

  if (
    RequestScheduler.throttleRequests &&
    request.throttleByServer &&
    !RequestScheduler.serverHasOpenSlots(request.serverKey)
  ) {
    // Server is saturated. Try again later.
    return undefined;
  }

  if (!RequestScheduler.throttleRequests || !request.throttle) {
    return startRequest(request);
  }

  if (activeRequests.length >= RequestScheduler.maximumRequests) {
    // Active requests are saturated. Try again later.
    return undefined;
  }

  // Insert into the priority heap and see if a request was bumped off. If this request is the lowest
  // priority it will be returned.
  updatePriority(request);
  const removedRequest = requestHeap.insert(request);

  if (defined(removedRequest)) {
    if (removedRequest === request) {
      // Request does not have high enough priority to be issued
      return undefined;
    }
    // A previously issued request has been bumped off the priority heap, so cancel it
    cancelRequest(removedRequest);
  }

  return issueRequest(request);
};

function updateStatistics() {
  if (!RequestScheduler.debugShowStatistics) {
    return;
  }

  if (
    statistics.numberOfActiveRequests === 0 &&
    statistics.lastNumberOfActiveRequests > 0
  ) {
    if (statistics.numberOfAttemptedRequests > 0) {
      console.log(
        `Number of attempted requests: ${statistics.numberOfAttemptedRequests}`
      );
      statistics.numberOfAttemptedRequests = 0;
    }

    if (statistics.numberOfCancelledRequests > 0) {
      console.log(
        `Number of cancelled requests: ${statistics.numberOfCancelledRequests}`
      );
      statistics.numberOfCancelledRequests = 0;
    }

    if (statistics.numberOfCancelledActiveRequests > 0) {
      console.log(
        `Number of cancelled active requests: ${statistics.numberOfCancelledActiveRequests}`
      );
      statistics.numberOfCancelledActiveRequests = 0;
    }

    if (statistics.numberOfFailedRequests > 0) {
      console.log(
        `Number of failed requests: ${statistics.numberOfFailedRequests}`
      );
      statistics.numberOfFailedRequests = 0;
    }
  }

  statistics.lastNumberOfActiveRequests = statistics.numberOfActiveRequests;
}

/**
 * 仅用于测试。清除可能尚未从先前测试中完成的任何请求。
 *
 * @private
 */
RequestScheduler.clearForSpecs = function () {
  while (requestHeap.length > 0) {
    const request = requestHeap.pop();
    cancelRequest(request);
  }
  const length = activeRequests.length;
  for (let i = 0; i < length; ++i) {
    cancelRequest(activeRequests[i]);
  }
  activeRequests.length = 0;
  numberOfActiveRequestsByServer = {};

  // Clear stats
  statistics.numberOfAttemptedRequests = 0;
  statistics.numberOfActiveRequests = 0;
  statistics.numberOfCancelledRequests = 0;
  statistics.numberOfCancelledActiveRequests = 0;
  statistics.numberOfFailedRequests = 0;
  statistics.numberOfActiveRequestsEver = 0;
  statistics.lastNumberOfActiveRequests = 0;
};

/**
 * 仅用于测试。
 *
 * @private
 */
RequestScheduler.numberOfActiveRequestsByServer = function (serverKey) {
  return numberOfActiveRequestsByServer[serverKey];
};

/**
 * 仅用于测试。
 *
 * @private
 */
RequestScheduler.requestHeap = requestHeap;
export default RequestScheduler;
