import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import Event from "../../Core/Event.js";
import JulianDate from "../../Core/JulianDate.js";
import ModelAnimationLoop from "../ModelAnimationLoop.js";
import ModelAnimationState from "../ModelAnimationState.js";
import ModelAnimationChannel from "./ModelAnimationChannel.js";

/**
 * <div class="notice">
 * 通过调用 {@link ModelAnimationCollection#add} 创建动画。 不要直接调用构造函数。
 * </div>
 *
 * 从 glTF 资源派生的活动动画。活动动画是
 * 当前正在播放或计划播放的动画，因为
 * 被添加到模型的 {@link ModelAnimationCollection} 中。活动动画
 * 是动画的实例;例如，可以有多个活动
 * 同一 glTF 动画的动画，每个动画具有不同的开始时间。
 *
 * @alias ModelAnimation
 * @internalConstructor
 * @class
 *
 * @see ModelAnimationCollection#add
 */
function ModelAnimation(model, animation, options) {
  this._animation = animation;
  this._name = animation.name;
  this._runtimeChannels = undefined;

  this._startTime = JulianDate.clone(options.startTime);
  this._delay = defaultValue(options.delay, 0.0); // in seconds
  this._stopTime = JulianDate.clone(options.stopTime);

  /**
   * 如果为 <code>true</code>，则动画在停止播放后将被删除。
   * 这比不删除它的效率略高，但如果，例如，
   * 时间倒转，动画不再播放。
   *
   * @type {boolean}
   * @default false
   */
  this.removeOnStop = defaultValue(options.removeOnStop, false);
  this._multiplier = defaultValue(options.multiplier, 1.0);
  this._reverse = defaultValue(options.reverse, false);
  this._loop = defaultValue(options.loop, ModelAnimationLoop.NONE);
  this._animationTime = options.animationTime;
  this._prevAnimationDelta = undefined;

  /**
   * 启动此动画时触发的事件。 这可用于
   * 例如，在动画开始时播放声音或启动粒子系统。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * animation.start.addEventListener(function(model, animation) {
   *   console.log(`Animation started: ${animation.name}`);
   * });
   */
  this.start = new Event();

  /**
   * 更新此动画时，在每一帧上触发的事件。 这
   * 动画的当前时间（相对于 glTF 动画时间跨度）为
   * 传递给事件，例如，它允许在
   * 相对于播放动画的特定时间。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * animation.update.addEventListener(function(model, animation, time) {
   *   console.log(`Animation updated: ${animation.name}. glTF animation time: ${time}`);
   * });
   */
  this.update = new Event();

  /**
   * 此动画停止时触发的事件。 这可用于
   * 例如，在动画停止时播放声音或启动粒子系统。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * animation.stop.addEventListener(function(model, animation) {
   *   console.log(`Animation stopped: ${animation.name}`);
   * });
   */
  this.stop = new Event();

  this._state = ModelAnimationState.STOPPED;

  // Set during animation update
  this._computedStartTime = undefined;
  this._duration = undefined;

  // To avoid allocations in ModelAnimationCollection.update
  const that = this;
  this._raiseStartEvent = function () {
    that.start.raiseEvent(model, that);
  };
  this._updateEventTime = 0.0;
  this._raiseUpdateEvent = function () {
    that.update.raiseEvent(model, that, that._updateEventTime);
  };
  this._raiseStopEvent = function () {
    that.stop.raiseEvent(model, that);
  };

  this._model = model;

  this._localStartTime = undefined;
  this._localStopTime = undefined;

  initialize(this);
}

Object.defineProperties(ModelAnimation.prototype, {
  /**
   * glTF 动画。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {ModelComponents.Animation}
   * @readonly
   *
   * @private
   */
  animation: {
    get: function () {
      return this._animation;
    },
  },

  /**
   * 在模型中标识此动画的名称 （如果存在）。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 此动画的运行时动画通道。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {ModelAnimationChannel[]}
   * @readonly
   *
   * @private
   */
  runtimeChannels: {
    get: function () {
      return this._runtimeChannels;
    },
  },

  /**
   * 拥有此动画的 {@link Model}。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {Model}
   * @readonly
   *
   * @private
   */
  model: {
    get: function () {
      return this._model;
    },
  },

  /**
   * 动画的起点（以本地动画时间表示）。这是最小值
   * 时间值。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {number}
   * @readonly
   *
   * @private
   */
  localStartTime: {
    get: function () {
      return this._localStartTime;
    },
  },

  /**
   * 动画在本地动画时间中的停止点。这是最大值
   * 时间值。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {number}
   * @readonly
   *
   * @private
   */
  localStopTime: {
    get: function () {
      return this._localStopTime;
    },
  },

  /**
   * 开始播放此动画的场景时间。当 this<code> undefined</code>时，
   * 动画从下一帧开始。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {JulianDate}
   * @readonly
   *
   * @default undefined
   */
  startTime: {
    get: function () {
      return this._startTime;
    },
  },

  /**
   * 从 {@link ModelAnimation#startTime} 开始播放的延迟（以秒为单位）。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {number}
   * @readonly
   *
   * @default undefined
   */
  delay: {
    get: function () {
      return this._delay;
    },
  },

  /**
   * 停止播放此动画的场景时间。当 <code>this 未定义</code>时，
   * 动画将在整个持续时间内播放，并且可能会重复播放，具体取决于
   * {@link ModelAnimation#loop}.
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {JulianDate}
   * @readonly
   *
   * @default undefined
   */
  stopTime: {
    get: function () {
      return this._stopTime;
    },
  },

  /**
   * 大于 <code>1.0</code> 的值会增加动画的相对播放速度
   * 到场景时钟速度;小于 <code>1.0</code> 的值会降低速度。 值
   * <code>1.0</code> 以映射到场景的 glTF 动画中的速度播放动画
   * 时钟速度。 例如，如果场景以 2 倍实时播放，则 2 秒的 glTF 动画
   * 即使<code>乘数</code>为 <code>1.0</code>，也会在 1 秒内播放。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {number}
   * @readonly
   *
   * @default 1.0
   */
  multiplier: {
    get: function () {
      return this._multiplier;
    },
  },

  /**
   * 如果<code>为 true</code>，则动画将反向播放。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  reverse: {
    get: function () {
      return this._reverse;
    },
  },

  /**
   * 确定是否以及如何循环播放动画。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {ModelAnimationLoop}
   * @readonly
   *
   * @default {@link ModelAnimationLoop.NONE}
   */
  loop: {
    get: function () {
      return this._loop;
    },
  },

  /**
   * 如果已定义，它将用于计算本地动画时间
   * 而不是场景的时间。
   *
   * @memberof ModelAnimation.prototype
   *
   * @type {ModelAnimation.AnimationTimeCallback}
   * @default undefined
   */
  animationTime: {
    get: function () {
      return this._animationTime;
    },
  },
});

function initialize(runtimeAnimation) {
  let localStartTime = Number.MAX_VALUE;
  let localStopTime = -Number.MAX_VALUE;

  const sceneGraph = runtimeAnimation._model.sceneGraph;
  const animation = runtimeAnimation._animation;
  const channels = animation.channels;
  const length = channels.length;

  const runtimeChannels = [];
  for (let i = 0; i < length; i++) {
    const channel = channels[i];
    const target = channel.target;

    // Ignore this channel if the target is invalid, i.e. if the node
    // it references doesn't exist.
    if (!defined(target)) {
      continue;
    }

    const nodeIndex = target.node.index;
    const runtimeNode = sceneGraph._runtimeNodes[nodeIndex];

    const runtimeChannel = new ModelAnimationChannel({
      channel: channel,
      runtimeAnimation: runtimeAnimation,
      runtimeNode: runtimeNode,
    });

    const times = channel.sampler.input;
    localStartTime = Math.min(localStartTime, times[0]);
    localStopTime = Math.max(localStopTime, times[times.length - 1]);

    runtimeChannels.push(runtimeChannel);
  }

  runtimeAnimation._runtimeChannels = runtimeChannels;
  runtimeAnimation._localStartTime = localStartTime;
  runtimeAnimation._localStopTime = localStopTime;
}

/**
 * 评估所有动画通道以推进此动画。
 *
 * @param {number} time 本地动画时间。
 *
 * @private
 */
ModelAnimation.prototype.animate = function (time) {
  const runtimeChannels = this._runtimeChannels;
  const length = runtimeChannels.length;
  for (let i = 0; i < length; i++) {
    runtimeChannels[i].animate(time);
  }
};

/**
 * 用于计算 ModelAnimation 的本地动画时间的函数。
 * @callback ModelAnimation.AnimationTimeCallback
 *
 * @param {number} duration 动画的原始持续时间（以秒为单位）。
 * @param {number} seconds 自动画开始以来的秒数（以场景时间表示）。
 * @returns {number} 返回本地动画时间。
 *
 * @example
 * // Use real time for model animation (assuming animateWhilePaused was set to true)
 * function animationTime(duration) {
 *     return Date.now() / 1000 / duration;
 * }
 *
 * @example
 * // Offset the phase of the animation, so it starts halfway through its cycle.
 * function animationTime(duration, seconds) {
 *     return seconds / duration + 0.5;
 * }
 */
export default ModelAnimation;
