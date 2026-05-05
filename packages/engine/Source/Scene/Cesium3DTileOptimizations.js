import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Cesium3DTileOptimizationHint from "./Cesium3DTileOptimizationHint.js";
import TileBoundingRegion from "./TileBoundingRegion.js";
import TileOrientedBoundingBox from "./TileOrientedBoundingBox.js";

/**
 * Utility functions for computing optimization hints for a {@link Cesium3DTileset}.
 *
 * @namespace Cesium3DTileOptimizations
 *
 * @private
 */
const Cesium3DTileOptimizations = {};

const scratchAxis = new Cartesian3();

/**
 * 评估对 childrenWithinParent 优化的支持。此优化用于在子级边界完全包含在父级内时更紧密地裁剪瓦片集。目前，该优化仅适用于定向包围盒，因此子瓦片和父瓦片都必须是 {@link TileOrientedBoundingBox} 或 {@link TileBoundingRegion}。此检查的目的是防止在子级边界超出父级时使用裁剪优化。如果子级边界更大，则优化更可能浪费 CPU 周期。不支持包围球的原因是子级边界经常部分超出父级边界。
 *
 * @param {Cesium3DTile} tile 要检查的瓦片。
 * @returns {boolean} childrenWithinParent 优化是否受支持。
 */
Cesium3DTileOptimizations.checkChildrenWithinParent = function (tile) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("tile", tile);
  //>>includeEnd('debug');

  const children = tile.children;
  const length = children.length;

  // Check if the parent has an oriented bounding box.
  const boundingVolume = tile.boundingVolume;
  if (
    boundingVolume instanceof TileOrientedBoundingBox ||
    boundingVolume instanceof TileBoundingRegion
  ) {
    const orientedBoundingBox = boundingVolume._orientedBoundingBox;
    tile._optimChildrenWithinParent =
      Cesium3DTileOptimizationHint.USE_OPTIMIZATION;
    for (let i = 0; i < length; ++i) {
      const child = children[i];

      // Check if the child has an oriented bounding box.
      const childBoundingVolume = child.boundingVolume;
      if (
        !(
          childBoundingVolume instanceof TileOrientedBoundingBox ||
          childBoundingVolume instanceof TileBoundingRegion
        )
      ) {
        // Do not support if the parent and child both do not have oriented bounding boxes.
        tile._optimChildrenWithinParent =
          Cesium3DTileOptimizationHint.SKIP_OPTIMIZATION;
        break;
      }

      const childOrientedBoundingBox = childBoundingVolume._orientedBoundingBox;

      // Compute the axis from the parent to the child.
      const axis = Cartesian3.subtract(
        childOrientedBoundingBox.center,
        orientedBoundingBox.center,
        scratchAxis,
      );
      const axisLength = Cartesian3.magnitude(axis);
      Cartesian3.divideByScalar(axis, axisLength, axis);

      // Project the bounding box of the parent onto the axis. Because the axis is a ray from the parent
      // to the child, the projection parameterized along the ray will be (+/- proj1).
      const proj1 =
        Math.abs(orientedBoundingBox.halfAxes[0] * axis.x) +
        Math.abs(orientedBoundingBox.halfAxes[1] * axis.y) +
        Math.abs(orientedBoundingBox.halfAxes[2] * axis.z) +
        Math.abs(orientedBoundingBox.halfAxes[3] * axis.x) +
        Math.abs(orientedBoundingBox.halfAxes[4] * axis.y) +
        Math.abs(orientedBoundingBox.halfAxes[5] * axis.z) +
        Math.abs(orientedBoundingBox.halfAxes[6] * axis.x) +
        Math.abs(orientedBoundingBox.halfAxes[7] * axis.y) +
        Math.abs(orientedBoundingBox.halfAxes[8] * axis.z);

      // Project the bounding box of the child onto the axis. Because the axis is a ray from the parent
      // to the child, the projection parameterized along the ray will be (+/- proj2) + axis.length.
      const proj2 =
        Math.abs(childOrientedBoundingBox.halfAxes[0] * axis.x) +
        Math.abs(childOrientedBoundingBox.halfAxes[1] * axis.y) +
        Math.abs(childOrientedBoundingBox.halfAxes[2] * axis.z) +
        Math.abs(childOrientedBoundingBox.halfAxes[3] * axis.x) +
        Math.abs(childOrientedBoundingBox.halfAxes[4] * axis.y) +
        Math.abs(childOrientedBoundingBox.halfAxes[5] * axis.z) +
        Math.abs(childOrientedBoundingBox.halfAxes[6] * axis.x) +
        Math.abs(childOrientedBoundingBox.halfAxes[7] * axis.y) +
        Math.abs(childOrientedBoundingBox.halfAxes[8] * axis.z);

      // If the child extends the parent's bounds, the optimization is not valid and we skip it.
      if (proj1 <= proj2 + axisLength) {
        tile._optimChildrenWithinParent =
          Cesium3DTileOptimizationHint.SKIP_OPTIMIZATION;
        break;
      }
    }
  }

  return (
    tile._optimChildrenWithinParent ===
    Cesium3DTileOptimizationHint.USE_OPTIMIZATION
  );
};
export default Cesium3DTileOptimizations;
