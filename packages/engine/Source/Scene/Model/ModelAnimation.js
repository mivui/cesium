import defined from "../../Core/defined.js";
import Event from "../../Core/Event.js";
import JulianDate from "../../Core/JulianDate.js";
import ModelAnimationLoop from "../ModelAnimationLoop.js";
import ModelAnimationState from "../ModelAnimationState.js";
import ModelAnimationChannel from "./ModelAnimationChannel.js";

/**
 * <div class="notice">
 * 通过调用 {@link ModelAnimationCollection#add} 创建动画。不要直接调用构造函数。
 * </div>
 *
 * 从 glTF 资产派生的活动动画。活动动画是指
 * 当前正在播放或由于被添加到模型的
 * {@link ModelAnimationCollection} 中而计划播放的动画。活动动画是动画的一个实例；
 * 例如，同一个 glTF 动画可以有多个活动动画，每个都有不同的开始时间。
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
  this._delay = options.delay ?? 0.0; // in seconds
  this._stopTime = JulianDate.clone(options.stopTime);

  /**
   * 当 <code>true</code> 时，动画停止播放后会被移除。
   * 这比不移除它稍微更高效，但如果（例如）时间倒退，动画将不会再次播放。
   *
   * @type {boolean}
   * @default false
   */
  this.removeOnStop = options.removeOnStop ?? false;
  this._multiplier = options.multiplier ?? 1.0;
  this._reverse = options.reverse ?? false;
  this._loop = options.loop ?? ModelAnimationLoop.NONE;
  this._animationTime = options.animationTime;
  this._prevAnimationDelta = undefined;

  /**
   * 当此动画开始播放时引发的事件。这可以用于
   * 例如，在动画开始时播放声音或启动粒子系统。
   * <p>
   * 此事件在场景渲染后的帧末尾引发。
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
   * 每帧更新此动画时引发的事件。当前动画时间（相对于 glTF 动画时间范围）
   * 会传递给该事件，这允许例如在播放动画的特定时间启动新动画。
   * <p>
   * 此事件在场景渲染后的帧末尾引发。
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
   * 当此动画停止播放时引发的事件。这可以用于
   * 例如，在动画停止时播放声音或启动粒子系统。
   * <p>
   * 此事件在场景渲染后的帧末尾引发。
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
   * The glTF animation.
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
   * 标识此动画在模型中的名称（如果存在）。
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
   * The runtime animation channels for this animation.
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
   * The {@link Model} that owns this animation.
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
   * 动画在本地动画时间中的起始点。这是属于此动画的所有关键帧中的最小时间值。
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
   * 动画在本地动画时间中的停止点。这是属于此动画的所有关键帧中的最大时间值。
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
   * 开始播放此动画的场景时间。当为 <code>undefined</code> 时，
   * 动画将在下一帧开始播放。
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
   * 从 {@link ModelAnimation#startTime} 到开始播放的延迟时间（以秒为单位）。
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
   * 停止播放此动画的场景时间。当为 <code>undefined</code> 时，
   * 动画将播放其完整时长，并可能根据
   * {@link ModelAnimation#loop} 重复播放。
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
   * 大于 <code>1.0</code> 的值会相对于场景时钟速度增加动画播放速度；
   * 小于 <code>1.0</code> 的值会减慢速度。<code>1.0</code> 的值会按照 glTF 动画中映射到场景时钟速度的速度播放动画。
   * 例如，如果场景以 2 倍实时速度播放，一个两秒的 glTF 动画将在一秒内播放完毕，即使 <code>multiplier</code> 为 <code>1.0</code>。
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
   * When <code>true</code>, the animation is played in reverse.
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
   * 确定动画是否循环播放以及如何循环播放。
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
   * 如果定义了此属性，它将用于计算本地动画时间，
   * 而不是使用场景时间。
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
 * 用于计算 ModelAnimation 本地动画时间的函数。
 * @callback ModelAnimation.AnimationTimeCallback
 *
 * @param {number} duration 动画的原始时长（以秒为单位）。
 * @param {number} seconds 动画开始后的秒数（场景时间）。
 * @returns {number} 返回本地动画时间。
 *
 * @example
 * // 使用实时进行模型动画（假设 animateWhilePaused 设置为 true）
 * function animationTime(duration) {
 *     return Date.now() / 1000 / duration;
 * }
 *
 * @example
 * // 偏移动画的相位，使其在周期中途开始。
 * function animationTime(duration, seconds) {
 *     return seconds / duration + 0.5;
 * }
 */
export default ModelAnimation;
