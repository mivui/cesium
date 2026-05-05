import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";

/**
 * 源自太阳的定向光源。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Color} [options.color=Color.WHITE] 光源的颜色。
 * @param {number} [options.intensity=2.0] 光源的强度。
 *
 * @alias SunLight
 * @constructor
 */
function SunLight(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  /**
   * 光源的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.color = Color.clone(options.color ?? Color.WHITE);

  /**
   * 光源的强度。
   * @type {number}
   * @default 2.0
   */
  this.intensity = options.intensity ?? 2.0;
}

export default SunLight;
