import BoundingSphere from "../Core/BoundingSphere.js";
import combine from "../Core/combine.js";
import defined from "../Core/defined.js";
import EasingFunction from "../Core/EasingFunction.js";
/**
 * 将 KmlTour 过渡到下一个目的地。这种转变是便利的
 * 在给定的秒数内使用指定的 flyToMode。
 *
 * @alias KmlTourFlyTo
 * @constructor
 *
 * @param {number} duration 参赛时长
 * @param {string} flyToMode KML 飞向模式：弹跳、平滑等
 * @param {KmlCamera|KmlLookAt} view KmlCamera 或 KmlLookAt
 *
 * @see KmlTour
 * @see KmlTourWait
 */
function KmlTourFlyTo(duration, flyToMode, view) {
  this.type = "KmlTourFlyTo";
  this.blocking = true;
  this.activeCamera = null;
  this.activeCallback = null;

  this.duration = duration;
  this.view = view;
  this.flyToMode = flyToMode;
}

/**
 * 播放此播放列表条目
 *
 * @param {KmlTourFlyTo.DoneCallback} done 播放结束时将调用的函数
 * @param {Camera} camera Cesium 相机
 * @param {object} [cameraOptions] ，该选项将与相机 flyTo 选项合并。看 {@link Camera#flyTo}
 */
KmlTourFlyTo.prototype.play = function (done, camera, cameraOptions) {
  this.activeCamera = camera;
  if (defined(done) && done !== null) {
    const self = this;
    this.activeCallback = function (terminated) {
      delete self.activeCallback;
      delete self.activeCamera;
      done(defined(terminated) ? false : terminated);
    };
  }

  const options = this.getCameraOptions(cameraOptions);
  if (this.view.headingPitchRoll) {
    camera.flyTo(options);
  } else if (this.view.headingPitchRange) {
    const target = new BoundingSphere(this.view.position);
    camera.flyToBoundingSphere(target, options);
  }
};

/**
 * 停止执行当前输入。取消相机 flyTo
 */
KmlTourFlyTo.prototype.stop = function () {
  if (defined(this.activeCamera)) {
    this.activeCamera.cancelFlight();
  }
  if (defined(this.activeCallback)) {
    this.activeCallback(true);
  }
};

/**
 * 返回 {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 的选项
 * 依赖于 this.view 类型。
 *
 * @param {object} cameraOptions 选项与 generated 合并。 See {@link Camera#flyTo}
 * @returns {object} {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 选项
 */
KmlTourFlyTo.prototype.getCameraOptions = function (cameraOptions) {
  let options = {
    duration: this.duration,
  };

  if (defined(this.activeCallback)) {
    options.complete = this.activeCallback;
  }

  if (this.flyToMode === "smooth") {
    options.easingFunction = EasingFunction.LINEAR_NONE;
  }

  if (this.view.headingPitchRoll) {
    options.destination = this.view.position;
    options.orientation = this.view.headingPitchRoll;
  } else if (this.view.headingPitchRange) {
    options.offset = this.view.headingPitchRange;
  }

  if (defined(cameraOptions)) {
    options = combine(options, cameraOptions);
  }
  return options;
};

/**
 * 飞行结束时将执行的函数。
 * @callback KmlTourFlyTo.DoneCallback
 *
 * @param {boolean} terminated 如果 {@link KmlTourFlyTo#stop} 为
 * 在 Entry 完成播放之前调用。
 */
export default KmlTourFlyTo;
