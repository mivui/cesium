import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Quaternion from "./Quaternion.js";

const defaultScale = new Cartesian3(1.0, 1.0, 1.0);
const defaultTranslation = Cartesian3.ZERO;
const defaultRotation = Quaternion.IDENTITY;

/**
 * An affine transformation defined by a translation, rotation, and scale.
 * @alias TranslationRotationScale
 * @constructor
 *
 * @param {Cartesian3} [translation=Cartesian3.ZERO] A {@link Cartesian3} specifying the (x, y, z) translation to apply to the node.
 * @param {Quaternion} [rotation=Quaternion.IDENTITY] A {@link Quaternion} specifying the (x, y, z, w) rotation to apply to the node.
 * @param {Cartesian3} [scale=new Cartesian3(1.0, 1.0, 1.0)] A {@link Cartesian3} specifying the (x, y, z) scaling to apply to the node.
 */
function TranslationRotationScale(translation, rotation, scale) {
  /**
   * 获取或设置(x, y, z) translation to apply to the node.
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   */
  this.translation = Cartesian3.clone(
    defaultValue(translation, defaultTranslation)
  );

  /**
   * 获取或设置(x, y, z, w) rotation to apply to the node.
   * @type {Quaternion}
   * @default Quaternion.IDENTITY
   */
  this.rotation = Quaternion.clone(defaultValue(rotation, defaultRotation));

  /**
   * 获取或设置(x, y, z) scaling to apply to the node.
   * @type {Cartesian3}
   * @default new Cartesian3(1.0, 1.0, 1.0)
   */
  this.scale = Cartesian3.clone(defaultValue(scale, defaultScale));
}

/**
 * Compares this instance against the provided instance and returns
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {TranslationRotationScale} [right] 右边 TranslationRotationScale.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
TranslationRotationScale.prototype.equals = function (right) {
  return (
    this === right ||
    (defined(right) &&
      Cartesian3.equals(this.translation, right.translation) &&
      Quaternion.equals(this.rotation, right.rotation) &&
      Cartesian3.equals(this.scale, right.scale))
  );
};
export default TranslationRotationScale;
