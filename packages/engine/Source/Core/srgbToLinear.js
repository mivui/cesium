import Check from "./Check.js";

/**
 * 将值从 sRGB 色彩空间转换为线性色彩空间。
 *
 * @function
 *
 * @param {number} value sRGB 色彩空间中的颜色值。
 * @returns {number} 返回线性色彩空间中的颜色值。
 *
 * @example
 * const srgbColor = [0.5, 0.5, 0.5];
 * const linearColor = srgbColor.map(function (c) {
 *     return Cesium.srgbToLinear(c);
 * });
 */
function srgbToLinear(value) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("value", value);
  //>>includeEnd('debug');

  if (value <= 0.04045) {
    // eslint-disable-next-line no-loss-of-precision
    return value * 0.07739938080495356037151702786378;
  }
  return Math.pow(
    // eslint-disable-next-line no-loss-of-precision
    (value + 0.055) * 0.94786729857819905213270142180095,
    2.4,
  );
}
export default srgbToLinear;
