import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import CesiumMath from "../Core/Math.js";
import SceneMode from "./SceneMode.js";

/**
 * 将大气与远离摄像机的几何体混合，以获得地平线视图。允许额外的
 * 通过渲染更少的几何体和调度更少的地形请求来提高性能。
 *
 * @alias Fog
 * @constructor
 */
function Fog() {
  /**
   * 如果启用了 fog，则<code>为 true</code>，否则<code>false</code>。
   * @type {boolean}
   * @default true
   */
  this.enabled = true;
  /**
   * 如果雾在着色器中可渲染，则为 <code>true</code>， 否则<code>false</code>。
   * 这允许从基于雾密度的优化平铺加载策略中受益，而无需实际的视觉渲染。
   * @type {boolean}
   * @default true
   */
  this.renderable = true;
  /**
   * 确定雾密度的标量。处于全雾中的地形将被剔除。
   * 当这个数字接近 1.0 时，雾的密度会增加，当它接近 0 时，雾的密度会变得不那么密集。
   * 雾越浓，地形被剔除的程度就越高。例如，如果相机的高度为
   * 在椭球体上方 1000.0m 处，将值增加到 3.0e-3 将导致靠近观察者的许多图块被剔除。
   * 减小该值会将雾推离查看器，但会降低性能，因为渲染的地形更多。
   * @type {number}
   * @default 2.0e-4
   */
  this.density = 2.0e-4;
  /**
   * 当地形瓦片部分处于雾中时，用于增加地形瓦片的屏幕空间误差的系数。效果是减少
   * 请求渲染的地形瓦片的数量。如果设置为 0，该功能将被禁用。如果该值增加
   * 对于山区，需要请求的图块较少，但地平线附近的地形网格可能会明显增加
   * 分辨率较低。如果在相对平坦的区域增加该值，则地平线上几乎没有明显的变化。
   * @type {number}
   * @default 2.0
   */
  this.screenSpaceErrorFactor = 2.0;
  /**
   * 照明产生的雾色的最小亮度。值为 0.0 时，雾将完全变黑。值 1.0 不会影响
   * 亮度。
   * @type {number}
   * @default 0.03
   */
  this.minimumBrightness = 0.03;
}

// These values were found by sampling the density at certain views and finding at what point culled tiles impacted the view at the horizon.
const heightsTable = [
  359.393, 800.749, 1275.6501, 2151.1192, 3141.7763, 4777.5198, 6281.2493,
  12364.307, 15900.765, 49889.0549, 78026.8259, 99260.7344, 120036.3873,
  151011.0158, 156091.1953, 203849.3112, 274866.9803, 319916.3149, 493552.0528,
  628733.5874,
];
const densityTable = [
  2.0e-5, 2.0e-4, 1.0e-4, 7.0e-5, 5.0e-5, 4.0e-5, 3.0e-5, 1.9e-5, 1.0e-5,
  8.5e-6, 6.2e-6, 5.8e-6, 5.3e-6, 5.2e-6, 5.1e-6, 4.2e-6, 4.0e-6, 3.4e-6,
  2.6e-6, 2.2e-6,
];

// Scale densities by 1e6 to bring lowest value to ~1. Prevents divide by zero.
for (let i = 0; i < densityTable.length; ++i) {
  densityTable[i] *= 1.0e6;
}
// Change range to [0, 1].
const tableStartDensity = densityTable[1];
const tableEndDensity = densityTable[densityTable.length - 1];
for (let j = 0; j < densityTable.length; ++j) {
  densityTable[j] =
    (densityTable[j] - tableEndDensity) / (tableStartDensity - tableEndDensity);
}

let tableLastIndex = 0;

function findInterval(height) {
  const heights = heightsTable;
  const length = heights.length;

  if (height < heights[0]) {
    tableLastIndex = 0;
    return tableLastIndex;
  } else if (height > heights[length - 1]) {
    tableLastIndex = length - 2;
    return tableLastIndex;
  }

  // Take advantage of temporal coherence by checking current, next and previous intervals
  // for containment of time.
  if (height >= heights[tableLastIndex]) {
    if (tableLastIndex + 1 < length && height < heights[tableLastIndex + 1]) {
      return tableLastIndex;
    } else if (
      tableLastIndex + 2 < length &&
      height < heights[tableLastIndex + 2]
    ) {
      ++tableLastIndex;
      return tableLastIndex;
    }
  } else if (tableLastIndex - 1 >= 0 && height >= heights[tableLastIndex - 1]) {
    --tableLastIndex;
    return tableLastIndex;
  }

  // The above failed so do a linear search.
  let i;
  for (i = 0; i < length - 2; ++i) {
    if (height >= heights[i] && height < heights[i + 1]) {
      break;
    }
  }

  tableLastIndex = i;
  return tableLastIndex;
}

const scratchPositionNormal = new Cartesian3();

Fog.prototype.update = function (frameState) {
  const enabled = (frameState.fog.enabled = this.enabled);
  if (!enabled) {
    return;
  }

  frameState.fog.renderable = this.renderable;

  const camera = frameState.camera;
  const positionCartographic = camera.positionCartographic;

  // Turn off fog in space.
  if (
    !defined(positionCartographic) ||
    positionCartographic.height > 800000.0 ||
    frameState.mode !== SceneMode.SCENE3D
  ) {
    frameState.fog.enabled = false;
    frameState.fog.density = 0;
    return;
  }

  const height = positionCartographic.height;
  const i = findInterval(height);
  const t = CesiumMath.clamp(
    (height - heightsTable[i]) / (heightsTable[i + 1] - heightsTable[i]),
    0.0,
    1.0,
  );
  let density = CesiumMath.lerp(densityTable[i], densityTable[i + 1], t);

  // Again, scale value to be in the range of densityTable (prevents divide by zero) and change to new range.
  const startDensity = this.density * 1.0e6;
  const endDensity = (startDensity / tableStartDensity) * tableEndDensity;
  density = density * (startDensity - endDensity) * 1.0e-6;

  // Fade fog in as the camera tilts toward the horizon.
  const positionNormal = Cartesian3.normalize(
    camera.positionWC,
    scratchPositionNormal,
  );
  const dot = Math.abs(Cartesian3.dot(camera.directionWC, positionNormal));
  density *= 1.0 - dot;

  frameState.fog.density = density;
  frameState.fog.sse = this.screenSpaceErrorFactor;
  frameState.fog.minimumBrightness = this.minimumBrightness;
};
export default Fog;
