import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import PerformanceWatchdog from "../PerformanceWatchdog/PerformanceWatchdog.js";

/**
 * A mixin which adds the {@link PerformanceWatchdog} widget to the {@link Viewer} widget.
 * Rather than being called directly, this function is normally passed as
 * a parameter to {@link Viewer#extend}, as shown in the example below.
 * @function
 *
 * @param {Viewer} viewer The viewer instance.
 * @param {object} [options] An object with properties.
 * @param {string} [options.lowFrameRateMessage='This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.'] The
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
