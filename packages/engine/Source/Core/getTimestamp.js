/**
 * 获取可用于测量事件之间时间的时间戳。时间戳以毫秒表示，
 * 但未指定毫秒的测量起点。如果可用，此函数使用 performance.now()，
 * 否则使用 Date.now()。
 *
 * @function getTimestamp
 *
 * @returns {number} 自某个未指定参考时间以来的时间戳（以毫秒为单位）。
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
