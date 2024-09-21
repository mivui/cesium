import defaultValue from "./defaultValue.js";

/**
 * 表示封闭区间 [start， stop]。
 * @alias Interval
 * @constructor
 *
 * @param {number} [start=0.0] 区间的开始。
 * @param {number} [stop=0.0] 区间结束。
 */
function Interval(start, stop) {
  /**
   * 区间的开始。
   * @type {number}
   * @default 0.0
   */
  this.start = defaultValue(start, 0.0);
  /**
   * 区间结束。
   * @type {number}
   * @default 0.0
   */
  this.stop = defaultValue(stop, 0.0);
}
export default Interval;
