import { Frozen, defined, DeveloperError } from "@cesium/engine";
import PerformanceWatchdog from "../PerformanceWatchdog/PerformanceWatchdog.js";

/**
 * 添加 {@link PerformanceWatchdog} 控件到 {@link Viewer} 控件的 mixin。
 * 此函数通常不直接调用，而是作为参数传递给 {@link Viewer#extend}，如下面的示例所示。
 * @function
 *
 * @param {Viewer} viewer Viewer 实例。
 * @param {object} [options] 具有属性的对象。
 * @param {string} [options.lowFrameRateMessage='This application appears to be performing poorly on your system.  Please try using a different web browser or updating your video drivers.'] 检测到低帧率时显示的消息。该消息被解释为 HTML，因此请确保它来自可信来源，以免应用程序受到跨站脚本攻击。
 *
 * @exception {DeveloperError} viewer 是必需的。
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

  options = options ?? Frozen.EMPTY_OBJECT;

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
