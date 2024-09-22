import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import getTimestamp from "../Core/getTimestamp.js";
import TimeConstants from "../Core/TimeConstants.js";

/**
 * 监控 {@link Scene} 中的帧速率（每秒帧数），如果帧速率
 * 低于阈值。 稍后，如果帧速率返回到所需的级别，则会引发一个单独的事件。
 * 为避免为单个 {@link 场景} 创建多个 FrameRateMonitor，请使用 {@link FrameRateMonitor.fromScene}
 * 而不是显式构造实例。
 *
 * @alias FrameRateMonitor
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Scene} options.scene Scene 实例用于监视性能。
 * @param {number} [options.samplingWindow=5.0] 计算平均帧速率的滑动窗口的长度，以秒为单位。
 * @param {number} [options.quietPeriod=2.0] 启动时和每次页面可见时（即当用户
 * 切换回选项卡），然后再开始测量性能（以秒为单位）。
 * @param {number} [options.warmupPeriod=5.0] 预热期的长度，以秒为单位。 在预热期间，单独的
 * （通常较低） 帧速率是必需的。
 * @param {number} [options.minimumFrameRateDuringWarmup=4] 在
 * 预热期。 如果在 warmupPeriod 期间的任何 samplingWindow 期间，帧速率平均值小于此值，则
 * lowFrameRate 事件，并且页面将重定向到 redirectOnLowFrameRateUrl（如果有）。
 * @param {number} [options.minimumFrameRateAfterWarmup=8] 之后可接受的性能所需的最小每秒帧数
 * 预热期结束。 如果在 warmupPeriod 之后的任何 samplingWindow 期间，帧速率平均值小于此值，则
 * lowFrameRate 事件，并且页面将重定向到 redirectOnLowFrameRateUrl（如果有）。
 */
function FrameRateMonitor(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = options.scene;

  /**
   * 获取或设置计算平均帧速率的滑动窗口的长度（以秒为单位）。
   * @type {number}
   */
  this.samplingWindow = defaultValue(
    options.samplingWindow,
    FrameRateMonitor.defaultSettings.samplingWindow
  );

  /**
   * 获取或设置启动时和每次页面可见时（即当用户
   * 切换回选项卡），然后再开始测量性能（以秒为单位）。
   * @type {number}
   */
  this.quietPeriod = defaultValue(
    options.quietPeriod,
    FrameRateMonitor.defaultSettings.quietPeriod
  );

  /**
   * 获取或设置预热期的长度（以秒为单位）。 在预热期间，单独的
   * （通常较低） 帧速率是必需的。
   * @type {number}
   */
  this.warmupPeriod = defaultValue(
    options.warmupPeriod,
    FrameRateMonitor.defaultSettings.warmupPeriod
  );

  /**
   * 获取或设置最小 frames-per-second 在之后实现可接受性能所需的
   * 预热期。 如果在 <code>warmupPeriod</code> 期间的任何 <code>samplingWindow</code> 期间，帧速率平均值小于此值，则
   * <code>lowFrameRate</code> 事件，并且页面将重定向到 <code>redirectOnLowFrameRateUrl</code>（如果有）。
   * @type {number}
   */
  this.minimumFrameRateDuringWarmup = defaultValue(
    options.minimumFrameRateDuringWarmup,
    FrameRateMonitor.defaultSettings.minimumFrameRateDuringWarmup
  );

  /**
   * 获取或设置最小 frames-per-second 之后实现可接受性能所需的
   * 预热期结束。 如果在 <code>warmupPeriod</code> 之后的任何 <code>samplingWindow</code> 期间，帧速率平均值小于此值，则
   * <code>lowFrameRate</code> 事件，并且页面将重定向到 <code>redirectOnLowFrameRateUrl</code>（如果有）。
   * @type {number}
   */
  this.minimumFrameRateAfterWarmup = defaultValue(
    options.minimumFrameRateAfterWarmup,
    FrameRateMonitor.defaultSettings.minimumFrameRateAfterWarmup
  );

  this._lowFrameRate = new Event();
  this._nominalFrameRate = new Event();

  this._frameTimes = [];
  this._needsQuietPeriod = true;
  this._quietPeriodEndTime = 0.0;
  this._warmupPeriodEndTime = 0.0;
  this._frameRateIsLow = false;
  this._lastFramesPerSecond = undefined;
  this._pauseCount = 0;

  const that = this;
  this._preUpdateRemoveListener = this._scene.preUpdate.addEventListener(
    function (scene, time) {
      update(that, time);
    }
  );

  this._hiddenPropertyName =
    document.hidden !== undefined
      ? "hidden"
      : document.mozHidden !== undefined
      ? "mozHidden"
      : document.msHidden !== undefined
      ? "msHidden"
      : document.webkitHidden !== undefined
      ? "webkitHidden"
      : undefined;

  const visibilityChangeEventName =
    document.hidden !== undefined
      ? "visibilitychange"
      : document.mozHidden !== undefined
      ? "mozvisibilitychange"
      : document.msHidden !== undefined
      ? "msvisibilitychange"
      : document.webkitHidden !== undefined
      ? "webkitvisibilitychange"
      : undefined;

  function visibilityChangeListener() {
    visibilityChanged(that);
  }

  this._visibilityChangeRemoveListener = undefined;
  if (defined(visibilityChangeEventName)) {
    document.addEventListener(
      visibilityChangeEventName,
      visibilityChangeListener,
      false
    );

    this._visibilityChangeRemoveListener = function () {
      document.removeEventListener(
        visibilityChangeEventName,
        visibilityChangeListener,
        false
      );
    };
  }
}

/**
 * 默认帧速率监控设置。 当 {@link FrameRateMonitor.fromScene}
 * 需要创建新的帧速率监视器，对于未传递到
 * {@link FrameRateMonitor} 构造函数。
 *
 * @memberof FrameRateMonitor
 * @type {object}
 */
FrameRateMonitor.defaultSettings = {
  samplingWindow: 5.0,
  quietPeriod: 2.0,
  warmupPeriod: 5.0,
  minimumFrameRateDuringWarmup: 4,
  minimumFrameRateAfterWarmup: 8,
};

/**
 * 获取给定场景的 {@link FrameRateMonitor}。 如果场景还没有
 * 一个 {@link FrameRateMonitor}，一个是使用 {@link FrameRateMonitor.defaultSettings} 创建的。
 *
 * @param {Scene} scene 要获取其 {@link FrameRateMonitor} 的场景。
 * @returns {FrameRateMonitor} 场景的 {@link FrameRateMonitor} 的 {FrameRateMonitor} 的监视器。
 */
FrameRateMonitor.fromScene = function (scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  if (
    !defined(scene._frameRateMonitor) ||
    scene._frameRateMonitor.isDestroyed()
  ) {
    scene._frameRateMonitor = new FrameRateMonitor({
      scene: scene,
    });
  }

  return scene._frameRateMonitor;
};

Object.defineProperties(FrameRateMonitor.prototype, {
  /**
   * 获取 {@link Scene} 实例用于监视性能。
   * @memberof FrameRateMonitor.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取在检测到低帧速率时引发的事件。 该函数将被传递
   * {@link Scene} 实例作为其第一个参数和每秒平均帧数
   * 作为其第二个参数。
   * @memberof FrameRateMonitor.prototype
   * @type {Event}
   */
  lowFrameRate: {
    get: function () {
      return this._lowFrameRate;
    },
  },

  /**
   * 获取帧速率在较低水平后恢复到正常水平时引发的事件。
   * 该函数将传递 {@link Scene} 实例作为其第一个参数，并将
   * 采样窗口上每秒的帧数作为其第二个参数。
   * @memberof FrameRateMonitor.prototype
   * @type {Event}
   */
  nominalFrameRate: {
    get: function () {
      return this._nominalFrameRate;
    },
  },

  /**
   * 获取最近计算的最后一个 <code>samplingWindow</code> 的平均每秒帧数。
   * 如果尚未计算帧速率，则此属性可能未定义。
   * @memberof FrameRateMonitor.prototype
   * @type {number}
   */
  lastFramesPerSecond: {
    get: function () {
      return this._lastFramesPerSecond;
    },
  },
});

/**
 * 暂停帧速率的监视。 要恢复监控，{@link FrameRateMonitor#unpause}
 * 每次调用此函数时都必须调用一次。
 * @memberof FrameRateMonitor
 */
FrameRateMonitor.prototype.pause = function () {
  ++this._pauseCount;
  if (this._pauseCount === 1) {
    this._frameTimes.length = 0;
    this._lastFramesPerSecond = undefined;
  }
};

/**
 * 恢复对帧速率的监视。 如果调用了 {@link FrameRateMonitor#pause}
 * 时，此函数必须调用相同的次数，才能
 * 实际上恢复监控。
 * @memberof FrameRateMonitor
 */
FrameRateMonitor.prototype.unpause = function () {
  --this._pauseCount;
  if (this._pauseCount <= 0) {
    this._pauseCount = 0;
    this._needsQuietPeriod = true;
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @memberof FrameRateMonitor
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see FrameRateMonitor#destroy
 */
FrameRateMonitor.prototype.isDestroyed = function () {
  return false;
};

/**
 * 取消订阅此实例正在侦听的所有事件。
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @memberof FrameRateMonitor
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see FrameRateMonitor#isDestroyed
 */
FrameRateMonitor.prototype.destroy = function () {
  this._preUpdateRemoveListener();

  if (defined(this._visibilityChangeRemoveListener)) {
    this._visibilityChangeRemoveListener();
  }

  return destroyObject(this);
};

function update(monitor, time) {
  if (monitor._pauseCount > 0) {
    return;
  }

  const timeStamp = getTimestamp();

  if (monitor._needsQuietPeriod) {
    monitor._needsQuietPeriod = false;
    monitor._frameTimes.length = 0;
    monitor._quietPeriodEndTime =
      timeStamp + monitor.quietPeriod / TimeConstants.SECONDS_PER_MILLISECOND;
    monitor._warmupPeriodEndTime =
      monitor._quietPeriodEndTime +
      (monitor.warmupPeriod + monitor.samplingWindow) /
        TimeConstants.SECONDS_PER_MILLISECOND;
  } else if (timeStamp >= monitor._quietPeriodEndTime) {
    monitor._frameTimes.push(timeStamp);

    const beginningOfWindow =
      timeStamp -
      monitor.samplingWindow / TimeConstants.SECONDS_PER_MILLISECOND;

    if (
      monitor._frameTimes.length >= 2 &&
      monitor._frameTimes[0] <= beginningOfWindow
    ) {
      while (
        monitor._frameTimes.length >= 2 &&
        monitor._frameTimes[1] < beginningOfWindow
      ) {
        monitor._frameTimes.shift();
      }

      const averageTimeBetweenFrames =
        (timeStamp - monitor._frameTimes[0]) / (monitor._frameTimes.length - 1);

      monitor._lastFramesPerSecond = 1000.0 / averageTimeBetweenFrames;

      const maximumFrameTime =
        1000.0 /
        (timeStamp > monitor._warmupPeriodEndTime
          ? monitor.minimumFrameRateAfterWarmup
          : monitor.minimumFrameRateDuringWarmup);
      if (averageTimeBetweenFrames > maximumFrameTime) {
        if (!monitor._frameRateIsLow) {
          monitor._frameRateIsLow = true;
          monitor._needsQuietPeriod = true;
          monitor.lowFrameRate.raiseEvent(
            monitor.scene,
            monitor._lastFramesPerSecond
          );
        }
      } else if (monitor._frameRateIsLow) {
        monitor._frameRateIsLow = false;
        monitor._needsQuietPeriod = true;
        monitor.nominalFrameRate.raiseEvent(
          monitor.scene,
          monitor._lastFramesPerSecond
        );
      }
    }
  }
}

function visibilityChanged(monitor) {
  if (document[monitor._hiddenPropertyName]) {
    monitor.pause();
  } else {
    monitor.unpause();
  }
}
export default FrameRateMonitor;
