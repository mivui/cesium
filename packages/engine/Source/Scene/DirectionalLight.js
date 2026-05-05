import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import DeveloperError from "../Core/DeveloperError.js";

/**
 * 从无限远处沿单一方向发射的光源。
 *
 * @param {object} options 包含以下属性的对象:
 * @param {Cartesian3} options.direction 光线的发射方向。
 * @param {Color} [options.color=Color.WHITE] 光线的颜色。
 * @param {number} [options.intensity=1.0] 光线的强度。
 *
 * @exception {DeveloperError} options.direction 不能为零长度向量
 *
 * @alias DirectionalLight
 * @constructor
 */
function DirectionalLight(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.direction", options.direction);
  if (Cartesian3.equals(options.direction, Cartesian3.ZERO)) {
    throw new DeveloperError("options.direction 不能为零长度向量");
  }
  //>>includeEnd('debug');

  /**
   * 光线的发射方向。
   * @type {Cartesian3}
   */
  this.direction = Cartesian3.clone(options.direction);

  /**
   * 光线的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.color = Color.clone(options.color ?? Color.WHITE);

  /**
   * 光线的强度。
   * @type {number}
   * @default 1.0
   */
  this.intensity = options.intensity ?? 1.0;
}

export default DirectionalLight;
