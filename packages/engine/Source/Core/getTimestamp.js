// @ts-check

/**
 * 获取一个时间戳，可用于测量事件之间的时间。时间戳
 * 以毫秒表示，但未指定这些毫秒是从何时起算的。
 * 如果可用，该函数使用 performance.now()，否则使用 Date.now()。
 * @type {Function}
 * @function getTimestamp
 * @returns {number} 自某个未指定的参考时间以来的毫秒时间戳。
 */
let getTimestamp;

if (
  typeof performance !== "undefined" &&
  typeof performance.now === "function" &&
  isFinite(performance.now())
) {
  getTimestamp = function () {
    return performance.now();
  };
} else {
  getTimestamp = function () {
    return Date.now();
  };
}

export default getTimestamp;
