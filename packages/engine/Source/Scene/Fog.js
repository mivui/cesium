import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";
import SceneMode from "./SceneMode.js";

/**
 * 将大气层与远离摄像机的几何体混合，用于地平线视图。允许通过渲染更少的几何体和发送更少的地形请求来获得额外的性能提升。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=fog|Cesium Sandcastle Fog Demo}
 *
 * @alias Fog
 * @constructor
 */
function Fog() {
  /**
   * 如果启用雾则为 <code>true</code>，否则为 <code>false</code>。
   * @type {boolean}
   * @default true
   * @example
   * // 在场景中禁用雾
   * viewer.scene.fog.enabled = false;
   */
  this.enabled = true;
  /**
   * 如果雾在着色器中可渲染则为 <code>true</code>，否则为 <code>false</code>。
   * 这允许基于雾密度优化瓦片加载策略，而无需实际的视觉渲染。
   * @type {boolean}
   * @default true
   * @example
   * // 使用雾剔除但不渲染它
   * viewer.scene.fog.enabled = true;
   * viewer.scene.fog.renderable = false;
   */
  this.renderable = true;
  /**
   * 确定雾的密度的标量。完全处于雾中的地形将被剔除。
   * 当该数值接近 1.0 时，雾的密度增加；当接近零时，雾变得稀疏。
   * 雾越密集，地形剔除越激进。例如，如果摄像机距椭球体高度为 1000.0 米，
   * 将该值增加到 3.0e-3 会导致许多靠近观察者的瓦片被剔除。
   * 减小该值会将雾推离观察者更远，但会降低性能，因为更多地形会被渲染。
   * @type {number}
   * @default 0.0006
   * @example
   * // 将默认雾密度加倍
   * viewer.scene.fog.density = 0.0012;
   */
  this.density = 0.0006;
  /**
   * 用于根据摄像机高于地形的高度调整密度的函数中的标量。
   * @type {number}
   * @default 0.001
   */
  this.heightScalar = 0.001;
  this._heightFalloff = 0.59;
  /**
   * 应用雾的最大高度。如果摄像机高于此高度，雾将被禁用。
   * @type {number}
   * @default 800000.0
   */
  this.maxHeight = 800000.0;
  /**
   * 影响雾颜色视觉密度的标量。该值不影响地形的剔除。
   * 与 {@link Fog.density} 结合使用可使雾看起来更浓或更淡。
   * @type {number}
   * @default 0.15
   * @experimental 该标量的值可能不是最终值，可能会发生变化。
   * @example
   * // 增加雾外观效果
   * viewer.scene.fog.visualDensityScalar = 0.6;
   */
  this.visualDensityScalar = 0.15;
  /**
   * 用于增加部分处于雾中的地形瓦片的屏幕空间误差的因子。效果是减少
   * 需要渲染的地形瓦片数量。如果设置为零，该功能将被禁用。如果在山区增加该值，
   * 需要请求的瓦片会更少，但靠近地平线的地形网格可能明显分辨率较低。
   * 如果在相对平坦的区域增加该值，地平线上几乎不会注意到变化。
   * @type {number}
   * @default 2.0
   */
  this.screenSpaceErrorFactor = 2.0;
  /**
   * 雾颜色因光照产生的最小亮度。值为 0.0 可能导致雾完全变黑。值为 1.0 不会影响亮度。
   * @type {number}
   * @default 0.03
   */
  this.minimumBrightness = 0.03;
}

Object.defineProperties(Fog.prototype, {
  /**
   * 用于根据摄像机高于椭球体的高度调整密度变化方式的指数因子。较小的值会产生更平缓的过渡效果。
   * 值必须大于 0。
   * @memberof Fog.prototype
   * @type {number}
   * @default 0.59
   */
  heightFalloff: {
    get: function () {
      return this._heightFalloff;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value < 0) {
        throw new DeveloperError("value 必须为正数。");
      }
      //>>includeEnd('debug');

      this._heightFalloff = value;
    },
  },
});

const scratchPositionNormal = new Cartesian3();

/**
 * @param {FrameState} frameState
 * @private
 */
Fog.prototype.update = function (frameState) {
  const enabled = (frameState.fog.enabled = this.enabled);
  if (!enabled) {
    return;
  }

  frameState.fog.renderable = this.renderable;

  const camera = frameState.camera;
  const positionCartographic = camera.positionCartographic;

  // 在太空中关闭雾。
  if (
    !defined(positionCartographic) ||
    positionCartographic.height > this.maxHeight ||
    frameState.mode !== SceneMode.SCENE3D
  ) {
    frameState.fog.enabled = false;
    frameState.fog.density = 0;
    return;
  }

  const height = positionCartographic.height;
  let density =
    this.density *
    this.heightScalar *
    Math.pow(
      Math.max(height / this.maxHeight, CesiumMath.EPSILON4),
      -Math.max(this._heightFalloff, 0.0),
    );

  // 当摄像机向地平线倾斜时，逐渐显示雾效果。
  const positionNormal = Cartesian3.normalize(
    camera.positionWC,
    scratchPositionNormal,
  );
  const dot = Math.abs(Cartesian3.dot(camera.directionWC, positionNormal));
  density *= 1.0 - dot;

  frameState.fog.density = density;
  frameState.fog.visualDensityScalar = this.visualDensityScalar;
  frameState.fog.sse = this.screenSpaceErrorFactor;
  frameState.fog.minimumBrightness = this.minimumBrightness;
};
export default Fog;
