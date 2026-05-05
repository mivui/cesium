import BoundingSphere from "../Core/BoundingSphere.js";
import combine from "../Core/combine.js";
import defined from "../Core/defined.js";
import EasingFunction from "../Core/EasingFunction.js";
/**
 * 将KmlTour过渡到下一个目的地。此过渡通过指定的flyToMode在给定秒数内完成。
 *
 * @alias KmlTourFlyTo
 * @constructor
 *
 * @param {number} duration 条目持续时间
 * @param {string} flyToMode KML飞行模式：bounce、smooth等
 * @param {KmlCamera|KmlLookAt} view KmlCamera或KmlLookAt
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
 * @param {KmlTourFlyTo.DoneCallback} done 播放结束时调用的函数
 * @param {Camera} camera Cesium相机
 * @param {object} [cameraOptions] 将与相机flyTo选项合并的选项。参见 {@link Camera#flyTo}
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
 * 停止当前条目的执行。取消相机flyTo
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
 * 根据this.view类型返回 {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 的选项。
 *
 * @param {object} cameraOptions 要与生成的选项合并的选项。参见 {@link Camera#flyTo}
 * @returns {object} {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 的选项
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
 * 飞行完成时执行的函数。
 * @callback KmlTourFlyTo.DoneCallback
 *
 * @param {boolean} terminated 如果 {@link KmlTourFlyTo#stop} 在条目播放完成前被调用则为true。
 */
export default KmlTourFlyTo;
