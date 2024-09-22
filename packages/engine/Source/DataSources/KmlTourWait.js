import defined from "../Core/defined.js";
/**
 * 将 KmlTour 暂停给定的秒数。
 *
 * @alias KmlTourWait
 * @constructor
 *
 * @param {number} duration 参赛时长
 *
 * @see KmlTour
 * @see KmlTourFlyTo
 */
function KmlTourWait(duration) {
  this.type = "KmlTourWait";
  this.blocking = true;
  this.duration = duration;

  this.timeout = null;
}

/**
 * 播放此播放列表条目
 *
 * @param {KmlTourWait.DoneCallback} done 播放结束时将调用的函数
 */
KmlTourWait.prototype.play = function (done) {
  const self = this;
  this.activeCallback = done;
  this.timeout = setTimeout(function () {
    delete self.activeCallback;
    done(false);
  }, this.duration * 1000);
};

/**
 * 停止执行当前输入，取消当前超时
 */
KmlTourWait.prototype.stop = function () {
  clearTimeout(this.timeout);
  if (defined(this.activeCallback)) {
    this.activeCallback(true);
  }
};

/**
 *播放结束时将调用的函数。
 *
 * @callback KmlTourWait.DoneCallback
 * @param {boolean} terminated 如果 {@link KmlTourWait#stop} 为
 * 在 Entry done 播放之前调用。
 */
export default KmlTourWait;
