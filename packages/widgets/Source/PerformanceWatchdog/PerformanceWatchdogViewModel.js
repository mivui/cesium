import {
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  FrameRateMonitor,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * 视图模型 {@link PerformanceWatchdog}.
 *
 * @alias PerformanceWatchdogViewModel
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Scene} options.scene The Scene instance 用于监视性能。
 * @param {string} [options.lowFrameRateMessage='This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.'] The
 *        当检测到低帧率时显示的消息。该消息被解释为HTML，因此请确保
 *        它来自可信来源，因此您的应用程序不易受到跨站点脚本攻击。
 */
function PerformanceWatchdogViewModel(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = options.scene;

  /**
   * 获取或设置当检测到低帧率时显示的消息。这个字符串将被解释为HTML。
   * @type {string}
   */
  this.lowFrameRateMessage = defaultValue(
    options.lowFrameRateMessage,
    "This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.",
  );

  /**
   * 获取或设置一个值，该值指示低帧率消息先前是否已被用户驳回。如果有的话
   * 被驳回，消息将不会被重新显示，无论帧速率如何。
   * @type {boolean}
   */
  this.lowFrameRateMessageDismissed = false;

  /**
   * 获取或设置一个值，该值指示当前是否显示低帧率消息。
   * @type {boolean}
   */
  this.showingLowFrameRateMessage = false;

  knockout.track(this, [
    "lowFrameRateMessage",
    "lowFrameRateMessageDismissed",
    "showingLowFrameRateMessage",
  ]);

  const that = this;
  this._dismissMessage = createCommand(function () {
    that.showingLowFrameRateMessage = false;
    that.lowFrameRateMessageDismissed = true;
  });

  const monitor = FrameRateMonitor.fromScene(options.scene);

  this._unsubscribeLowFrameRate = monitor.lowFrameRate.addEventListener(
    function () {
      if (!that.lowFrameRateMessageDismissed) {
        that.showingLowFrameRateMessage = true;
      }
    },
  );

  this._unsubscribeNominalFrameRate = monitor.nominalFrameRate.addEventListener(
    function () {
      that.showingLowFrameRateMessage = false;
    },
  );
}

Object.defineProperties(PerformanceWatchdogViewModel.prototype, {
  /**
   * 获取 {@link Scene} 实例 用于监视性能。
   * @memberof PerformanceWatchdogViewModel.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取一个命令，该命令驳回低帧率消息。一旦它被驳回，信息
   * 不会被重新显示。
   * @memberof PerformanceWatchdogViewModel.prototype
   * @type {Command}
   */
  dismissMessage: {
    get: function () {
      return this._dismissMessage;
    },
  },
});

PerformanceWatchdogViewModel.prototype.destroy = function () {
  this._unsubscribeLowFrameRate();
  this._unsubscribeNominalFrameRate();

  return destroyObject(this);
};
export default PerformanceWatchdogViewModel;
