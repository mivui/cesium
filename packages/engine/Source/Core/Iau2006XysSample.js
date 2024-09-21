/**
 * 在特定时间采样的 IAU 2006 XYS 值。
 *
 * @alias Iau2006XysSample
 * @constructor
 *
 * @param {number} x X 值。
 * @param {number} y Y 值。
 * @param {number} s S 值。
 *
 * @private
 */
function Iau2006XysSample(x, y, s) {
  /**
   * X 值。
   * @type {number}
   */
  this.x = x;

  /**
   * Y 值。
   * @type {number}
   */
  this.y = y;

  /**
   * S 值。
   * @type {number}
   */
  this.s = s;
}
export default Iau2006XysSample;
