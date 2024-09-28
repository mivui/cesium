import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import DeveloperError from "./DeveloperError.js";
import defined from "./defined.js";

/**
 * @private
 */
const VerticalExaggeration = {};

/**
 * 相对于偏移缩放高度。
 *
 * @param {number} height 高度。
 * @param {number} scale 用于夸大地形的标量。如果值为 1.0，则不会产生任何影响。
 * @param {number} relativeHeight 相对于哪个地形被夸大的高度。如果值为 0.0，则 terrain 将相对于椭球体表面进行夸大。
 */
VerticalExaggeration.getHeight = function (height, scale, relativeHeight) {
  //>>includeStart('debug', pragmas.debug);
  if (!Number.isFinite(scale)) {
    throw new DeveloperError("scale must be a finite number.");
  }
  if (!Number.isFinite(relativeHeight)) {
    throw new DeveloperError("relativeHeight must be a finite number.");
  }
  //>>includeEnd('debug')
  return (height - relativeHeight) * scale + relativeHeight;
};

const scratchCartographic = new Cartographic();

/**
 * 通过夸大缩放位置。
 *
 * @param {Cartesian3} position 位置。
 * @param {Ellipsoid} ellipsoid 椭球体。
 * @param {number} verticalExaggeration 用于夸大地形的标量。如果值为 1.0，则不会产生任何影响。
 * @param {number} verticalExaggerationRelativeHeight 地形被夸大的相对高度。如果值为 0.0，则 terrain 将相对于椭球体表面进行夸大。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 */
VerticalExaggeration.getPosition = function (
  position,
  ellipsoid,
  verticalExaggeration,
  verticalExaggerationRelativeHeight,
  result,
) {
  const cartographic = ellipsoid.cartesianToCartographic(
    position,
    scratchCartographic,
  );
  // If the position is too near the center of the ellipsoid, exaggeration is undefined.
  if (!defined(cartographic)) {
    return Cartesian3.clone(position, result);
  }
  const newHeight = VerticalExaggeration.getHeight(
    cartographic.height,
    verticalExaggeration,
    verticalExaggerationRelativeHeight,
  );
  return Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    newHeight,
    ellipsoid,
    result,
  );
};

export default VerticalExaggeration;
