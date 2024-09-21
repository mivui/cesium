import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import PerformanceWatchdog from "../PerformanceWatchdog/PerformanceWatchdog.js";

/**
 * 将 {@link PerformanceWatchdog} 部件添加到 {@link Viewer} 部件的mixin。
 * 不是直接调用，这个函数通常作为
 * {@link Viewer#extend} 的参数，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例。
 * @param {object} [options] An object with properties.
 * @param {string} [options.lowFrameRateMessage='This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.'] 
 *        当检测到低帧率时显示的消息。该消息被解释为HTML，因此请确保
 *        它来自可信来源，因此您的应用程序不易受到跨站点脚本攻击。
 *
 * @exception {DeveloperError} viewer is required.
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerPerformanceWatchdogMixin, {
 *     lowFrameRateMessage : 'Why is this going so <em>slowly</em>?'
 * });
 */
function viewerPerformanceWatchdogMixin(viewer, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(viewer)) {
    throw new DeveloperError("viewer is required.");
  }
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const performanceWatchdog = new PerformanceWatchdog({
    scene: viewer.scene,
    container: viewer.bottomContainer,
    lowFrameRateMessage: options.lowFrameRateMessage,
  });

  Object.defineProperties(viewer, {
    performanceWatchdog: {
      get: function () {
        return performanceWatchdog;
      },
    },
  });
}
export default viewerPerformanceWatchdogMixin;
