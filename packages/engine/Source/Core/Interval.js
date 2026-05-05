/**
 * 表示闭区间 [start, stop]。
 * @alias Interval
 * @constructor
 *
 * @param {number} [start=0.0] 区间的起点。
 * @param {number} [stop=0.0] 区间的终点。
 */
function Interval(start, stop) {
  /**
   * 区间的起点。
   * @type {number}
   * @default 0.0
   */
  this.start = start ?? 0.0;
  /**
   * 区间的终点。
   * @type {number}
   * @default 0.0
   */
  this.stop = stop ?? 0.0;
}
export default Interval;
