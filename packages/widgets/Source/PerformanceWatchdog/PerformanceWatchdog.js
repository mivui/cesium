import {
  defined,
  destroyObject,
  DeveloperError,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import PerformanceWatchdogViewModel from "./PerformanceWatchdogViewModel.js";

/**
 * 监视应用程序的性能，并在检测到性能不佳时显示一条消息。
 *
 * @alias PerformanceWatchdog
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Element|string} options.container 将包含小部件的DOM元素或ID。
 * @param {Scene} options.scene The {@link Scene} 用于监视性能。
 * @param {string} [options.lowFrameRateMessage='This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.'] The
 *        当检测到低帧率时显示的消息。该消息被解释为HTML，因此请确保
 *        它来自可信来源，因此您的应用程序不易受到跨站点脚本攻击。
 */
function PerformanceWatchdog(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.container)) {
    throw new DeveloperError("options.container is required.");
  }
  if (!defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  const container = getElement(options.container);

  const viewModel = new PerformanceWatchdogViewModel(options);

  const element = document.createElement("div");
  element.className = "cesium-performance-watchdog-message-area";
  element.setAttribute("data-bind", "visible: showingLowFrameRateMessage");

  const dismissButton = document.createElement("button");
  dismissButton.setAttribute("type", "button");
  dismissButton.className = "cesium-performance-watchdog-message-dismiss";
  dismissButton.innerHTML = "&times;";
  dismissButton.setAttribute("data-bind", "click: dismissMessage");
  element.appendChild(dismissButton);

  const message = document.createElement("div");
  message.className = "cesium-performance-watchdog-message";
  message.setAttribute("data-bind", "html: lowFrameRateMessage");
  element.appendChild(message);

  container.appendChild(element);

  knockout.applyBindings(viewModel, element);

  this._container = container;
  this._viewModel = viewModel;
  this._element = element;
}

Object.defineProperties(PerformanceWatchdog.prototype, {
  /**
   * 获取父容器。
   * @memberof PerformanceWatchdog.prototype
   *
   * @type {Element}
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取视图模型。
   * @memberof PerformanceWatchdog.prototype
   *
   * @type {PerformanceWatchdogViewModel}
   */
  viewModel: {
    get: function () {
      return this._viewModel;
    },
  },
});

/**
 * @memberof PerformanceWatchdog
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
PerformanceWatchdog.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。应该叫它永久的吗
 * 从布局中删除小部件。
 * @memberof PerformanceWatchdog
 */
PerformanceWatchdog.prototype.destroy = function () {
  this._viewModel.destroy();
  knockout.cleanNode(this._element);
  this._container.removeChild(this._element);

  return destroyObject(this);
};
export default PerformanceWatchdog;
