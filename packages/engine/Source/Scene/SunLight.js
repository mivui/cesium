import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";

/**
 * 源自太阳的定向光源。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Color} [options.color=Color.WHITE] The light's color.
 * @param {number} [options.intensity=2.0] The light's intensity.
 *
 * @alias SunLight
 * @constructor
 */
function SunLight(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  /**
   * 光的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.color = Color.clone(defaultValue(options.color, Color.WHITE));

  /**
   * 光线的强度。
   * @type {number}
   * @default 2.0
   */
  this.intensity = defaultValue(options.intensity, 2.0);
}

export default SunLight;
