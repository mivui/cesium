/**
 * 获取可用于测量事件之间时间的时间戳。 时间 戳
 * 以毫秒表示，但没有指定毫秒数
 * 测量起始。 此函数使用 performance.now（）（如果可用）或 Date.now（）
 * 否则。
 *
 * @function getTimestamp
 *
 * @returns {number} 自某个未指定的引用时间以来的时间戳（以毫秒为单位）。
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
