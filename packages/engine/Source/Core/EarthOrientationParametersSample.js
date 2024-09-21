/**
 * 一次采样的一组地球方向参数 （EOP）。
 *
 * @alias EarthOrientationParametersSample
 * @constructor
 *
 * @param {number} xPoleWander 极点绕 X 轴漂移，以弧度为单位。
 * @param {number} yPoleWander 极点绕 Y 轴徘徊，以弧度为单位。
 * @param {number} xPoleOffset 到天体中间极 （CIP） 绕 X 轴的偏移量，以弧度为单位。
 * @param {number} yPoleOffset 到天体中间极 （CIP） 绕 Y 轴的偏移量，以弧度为单位。
 * @param {number} ut1MinusUtc 时间标准的差异，UT1 - UTC，以秒为单位。
 *
 * @private
 */
function EarthOrientationParametersSample(
  xPoleWander,
  yPoleWander,
  xPoleOffset,
  yPoleOffset,
  ut1MinusUtc
) {
  /**
   * 极点绕 X 轴徘徊，以弧度为单位。
   * @type {number}
   */
  this.xPoleWander = xPoleWander;

  /**
   * 极点绕 Y 轴徘徊，以弧度为单位。
   * @type {number}
   */
  this.yPoleWander = yPoleWander;

  /**
   * 到天体中间极 （CIP） 绕 X 轴的偏移量，以弧度为单位。
   * @type {number}
   */
  this.xPoleOffset = xPoleOffset;

  /**
   * 到天体中间极 （CIP） 绕 Y 轴的偏移量，以弧度为单位。
   * @type {number}
   */
  this.yPoleOffset = yPoleOffset;

  /**
   * 时间标准（UT1 - UTC）的差异，单位为秒。
   * @type {number}
   */
  this.ut1MinusUtc = ut1MinusUtc;
}
export default EarthOrientationParametersSample;
