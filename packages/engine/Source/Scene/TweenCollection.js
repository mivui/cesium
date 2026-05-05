import clone from "../Core/clone.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import EasingFunction from "../Core/EasingFunction.js";
import getTimestamp from "../Core/getTimestamp.js";
import TimeConstants from "../Core/TimeConstants.js";
import { Tween as TweenJS } from "@tweenjs/tween.js";

/**
 * A tween is an animation that interpolates the properties of two objects using an {@link EasingFunction}.  Create
 * one using {@link Scene#tweens} and {@link TweenCollection#add} and related add functions.
 *
 * @alias Tween
 * @constructor
 *
 * @private
 */
function Tween(
  tweens,
  tweenjs,
  startObject,
  stopObject,
  duration,
  delay,
  easingFunction,
  update,
  complete,
  cancel,
) {
  this._tweens = tweens;
  this._tweenjs = tweenjs;

  this._startObject = clone(startObject);
  this._stopObject = clone(stopObject);

  this._duration = duration;
  this._delay = delay;
  this._easingFunction = easingFunction;

  this._update = update;
  this._complete = complete;

  /**
   * 如果补间动画被取消（无论是由于调用了 {@link Tween#cancelTween}
   * 还是因为补间动画从集合中移除）时调用的回调函数。
   *
   * @type {TweenCollection.TweenCancelledCallback}
   */
  this.cancel = cancel;

  /**
   * @private
   */
  this.needsStart = true;
}

Object.defineProperties(Tween.prototype, {
  /**
   * 包含补间动画初始值属性的对象。该对象的属性会在补间动画过程中被修改。
   * @memberof Tween.prototype
   *
   * @type {object}
   * @readonly
   */
  startObject: {
    get: function () {
      return this._startObject;
    },
  },

  /**
   * 包含补间动画最终值属性的对象。
   * @memberof Tween.prototype
   *
   * @type {object}
   * @readonly
   */
  stopObject: {
    get: function () {
      return this._stopObject;
    },
  },

  /**
   * 补间动画的持续时间（以秒为单位）。补间动画停止时会自动从集合中移除。
   * @memberof Tween.prototype
   *
   * @type {number}
   * @readonly
   */
  duration: {
    get: function () {
      return this._duration;
    },
  },

  /**
   * 补间动画开始前的延迟时间（以秒为单位）。
   * @memberof Tween.prototype
   *
   * @type {number}
   * @readonly
   */
  delay: {
    get: function () {
      return this._delay;
    },
  },

  /**
   * 确定动画的曲线。
   * @memberof Tween.prototype
   *
   * @type {EasingFunction}
   * @readonly
   */
  easingFunction: {
    get: function () {
      return this._easingFunction;
    },
  },

  /**
   * 每次动画更新时调用的回调函数（通常与渲染帧绑定）。
   * @memberof Tween.prototype
   *
   * @type {TweenCollection.TweenUpdateCallback}
   * @readonly
   */
  update: {
    get: function () {
      return this._update;
    },
  },

  /**
   * 补间动画完成时调用的回调函数。
   * @memberof Tween.prototype
   *
   * @type {TweenCollection.TweenCompleteCallback}
   * @readonly
   */
  complete: {
    get: function () {
      return this._complete;
    },
  },

  /**
   * @memberof Tween.prototype
   *
   * @private
   */
  tweenjs: {
    get: function () {
      return this._tweenjs;
    },
  },
});

/**
 * 取消补间动画，如果存在 {@link Tween#cancel} 回调函数则调用它。
 * 如果补间动画已完成或已被取消，则此方法无效。
 */
Tween.prototype.cancelTween = function () {
  this._tweens.remove(this);
};

/**
 * A collection of tweens for animating properties.  Commonly accessed using {@link Scene#tweens}.
 *
 * @alias TweenCollection
 * @constructor
 *
 * @private
 */
function TweenCollection() {
  this._tweens = [];
}

Object.defineProperties(TweenCollection.prototype, {
  /**
   * 集合中的补间动画数量。
   * @memberof TweenCollection.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._tweens.length;
    },
  },
});

/**
 * 创建用于在两个属性集之间进行动画的补间动画。补间动画在下次调用 {@link TweenCollection#update} 时开始，
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时会隐式调用。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {object} options.startObject 包含补间动画初始值属性的对象。该对象的属性会在补间动画过程中被修改。
 * @param {object} options.stopObject 包含补间动画最终值属性的对象。
 * @param {number} options.duration 补间动画的持续时间（以秒为单位）。补间动画停止时会自动从集合中移除。
 * @param {number} [options.delay=0.0] 补间动画开始前的延迟时间（以秒为单位）。
 * @param {EasingFunction} [options.easingFunction=EasingFunction.LINEAR_NONE] 确定动画的曲线。
 * @param {TweenCollection.TweenUpdateCallback} [options.update] 每次动画更新时调用的回调函数（通常与渲染帧绑定）。
 * @param {TweenCollection.TweenCompleteCallback} [options.complete] 补间动画完成时调用的回调函数。
 * @param {TweenCollection.TweenCancelledCallback} [options.cancel] 如果补间动画被取消（无论是由于调用了 {@link Tween#cancelTween} 还是因为补间动画从集合中移除）时调用的回调函数。
 * @returns {Tween} 补间动画。
 *
 * @exception {DeveloperError} options.duration 必须为正数。
 */
TweenCollection.prototype.add = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.startObject) || !defined(options.stopObject)) {
    throw new DeveloperError(
      "options.startObject and options.stopObject are required.",
    );
  }

  if (!defined(options.duration) || options.duration < 0.0) {
    throw new DeveloperError(
      "options.duration is required and must be positive.",
    );
  }
  //>>includeEnd('debug');

  if (options.duration === 0.0) {
    if (defined(options.complete)) {
      options.complete();
    }
    return new Tween(this);
  }

  const duration = options.duration / TimeConstants.SECONDS_PER_MILLISECOND;
  const delayInSeconds = options.delay ?? 0.0;
  const delay = delayInSeconds / TimeConstants.SECONDS_PER_MILLISECOND;
  const easingFunction = options.easingFunction ?? EasingFunction.LINEAR_NONE;

  const value = options.startObject;
  const tweenjs = new TweenJS(value);
  tweenjs.to(clone(options.stopObject), duration);
  tweenjs.delay(delay);
  tweenjs.easing(easingFunction);
  if (defined(options.update)) {
    tweenjs.onUpdate(function () {
      options.update(value);
    });
  }
  tweenjs.onComplete(options.complete ?? null);
  tweenjs.repeat(options._repeat ?? 0.0);

  const tween = new Tween(
    this,
    tweenjs,
    options.startObject,
    options.stopObject,
    options.duration,
    delayInSeconds,
    easingFunction,
    options.update,
    options.complete,
    options.cancel,
  );
  this._tweens.push(tween);
  return tween;
};

/**
 * 创建用于对给定对象上的标量属性进行动画的补间动画。补间动画在下次调用 {@link TweenCollection#update} 时开始，
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时会隐式调用。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {object} options.object 包含要动画的属性的对象。
 * @param {string} options.property 要动画的属性名称。
 * @param {number} options.startValue 初始值。
 * @param {number} options.stopValue 最终值。
 * @param {number} [options.duration=3.0] 补间动画的持续时间（以秒为单位）。补间动画停止时会自动从集合中移除。
 * @param {number} [options.delay=0.0] 补间动画开始前的延迟时间（以秒为单位）。
 * @param {EasingFunction} [options.easingFunction=EasingFunction.LINEAR_NONE] 确定动画的曲线。
 * @param {TweenCollection.TweenUpdateCallback} [options.update] 每次动画更新时调用的回调函数（通常与渲染帧绑定）。
 * @param {TweenCollection.TweenCompleteCallback} [options.complete] 补间动画完成时调用的回调函数。
 * @param {TweenCollection.TweenCancelledCallback} [options.cancel] 如果补间动画被取消（无论是由于调用了 {@link Tween#cancelTween} 还是因为补间动画从集合中移除）时调用的回调函数。
 * @returns {Tween} 补间动画。
 *
 * @exception {DeveloperError} options.object 必须具有指定的属性。
 * @exception {DeveloperError} options.duration 必须为正数。
 */
TweenCollection.prototype.addProperty = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const object = options.object;
  const property = options.property;
  const startValue = options.startValue;
  const stopValue = options.stopValue;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(object) || !defined(options.property)) {
    throw new DeveloperError(
      "options.object and options.property are required.",
    );
  }
  if (!defined(object[property])) {
    throw new DeveloperError(
      "options.object must have the specified property.",
    );
  }
  if (!defined(startValue) || !defined(stopValue)) {
    throw new DeveloperError(
      "options.startValue and options.stopValue are required.",
    );
  }
  //>>includeEnd('debug');

  function update(value) {
    object[property] = value.value;
  }

  return this.add({
    startObject: {
      value: startValue,
    },
    stopObject: {
      value: stopValue,
    },
    duration: options.duration ?? 3.0,
    delay: options.delay,
    easingFunction: options.easingFunction,
    update: update,
    complete: options.complete,
    cancel: options.cancel,
    _repeat: options._repeat,
  });
};

/**
 * 创建用于动画 {@link Material} 上所有颜色统一变量的 alpha 值的补间动画。补间动画在下次调用 {@link TweenCollection#update} 时开始，
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时会隐式调用。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Material} options.material 要动画的材质。
 * @param {number} [options.startValue=0.0] 初始 alpha 值。
 * @param {number} [options.stopValue=1.0] 最终 alpha 值。
 * @param {number} [options.duration=3.0] 补间动画的持续时间（以秒为单位）。补间动画停止时会自动从集合中移除。
 * @param {number} [options.delay=0.0] 补间动画开始前的延迟时间（以秒为单位）。
 * @param {EasingFunction} [options.easingFunction=EasingFunction.LINEAR_NONE] 确定动画的曲线。
 * @param {TweenCollection.TweenUpdateCallback} [options.update] 每次动画更新时调用的回调函数（通常与渲染帧绑定）。
 * @param {TweenCollection.TweenCompleteCallback} [options.complete] 补间动画完成时调用的回调函数。
 * @param {TweenCollection.TweenCancelledCallback} [options.cancel] 如果补间动画被取消（无论是由于调用了 {@link Tween#cancelTween} 还是因为补间动画从集合中移除）时调用的回调函数。
 * @returns {Tween} 补间动画。
 *
 * @exception {DeveloperError} 材质没有包含 alpha 分量的属性。
 * @exception {DeveloperError} options.duration 必须为正数。
 */
TweenCollection.prototype.addAlpha = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const material = options.material;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(material)) {
    throw new DeveloperError("options.material is required.");
  }
  //>>includeEnd('debug');

  const properties = [];

  for (const property in material.uniforms) {
    if (
      material.uniforms.hasOwnProperty(property) &&
      defined(material.uniforms[property]) &&
      defined(material.uniforms[property].alpha)
    ) {
      properties.push(property);
    }
  }

  //>>includeStart('debug', pragmas.debug);
  if (properties.length === 0) {
    throw new DeveloperError(
      "material has no properties with alpha components.",
    );
  }
  //>>includeEnd('debug');

  function update(value) {
    const length = properties.length;
    for (let i = 0; i < length; ++i) {
      material.uniforms[properties[i]].alpha = value.alpha;
    }
  }

  return this.add({
    startObject: {
      alpha: options.startValue ?? 0.0, // Default to fade in
    },
    stopObject: {
      alpha: options.stopValue ?? 1.0,
    },
    duration: options.duration ?? 3.0,
    delay: options.delay,
    easingFunction: options.easingFunction,
    update: update,
    complete: options.complete,
    cancel: options.cancel,
  });
};

/**
 * 创建用于动画 {@link Material} 的 offset 统一变量的补间动画。补间动画在下次调用 {@link TweenCollection#update} 时开始，
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时会隐式调用。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Material} options.material 要动画的材质。
 * @param {number} options.startValue 初始 alpha 值。
 * @param {number} options.stopValue 最终 alpha 值。
 * @param {number} [options.duration=3.0] 补间动画的持续时间（以秒为单位）。补间动画停止时会自动从集合中移除。
 * @param {number} [options.delay=0.0] 补间动画开始前的延迟时间（以秒为单位）。
 * @param {EasingFunction} [options.easingFunction=EasingFunction.LINEAR_NONE] 确定动画的曲线。
 * @param {TweenCollection.TweenUpdateCallback} [options.update] 每次动画更新时调用的回调函数（通常与渲染帧绑定）。
 * @param {TweenCollection.TweenCancelledCallback} [options.cancel] 如果补间动画被取消（无论是由于调用了 {@link Tween#cancelTween} 还是因为补间动画从集合中移除）时调用的回调函数。
 * @returns {Tween} 补间动画。
 *
 * @exception {DeveloperError} material.uniforms 必须具有 offset 属性。
 * @exception {DeveloperError} options.duration 必须为正数。
 */
TweenCollection.prototype.addOffsetIncrement = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const material = options.material;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(material)) {
    throw new DeveloperError("material is required.");
  }
  if (!defined(material.uniforms.offset)) {
    throw new DeveloperError("material.uniforms must have an offset property.");
  }
  //>>includeEnd('debug');

  const uniforms = material.uniforms;
  return this.addProperty({
    object: uniforms,
    property: "offset",
    startValue: uniforms.offset,
    stopValue: uniforms.offset + 1,
    duration: options.duration,
    delay: options.delay,
    easingFunction: options.easingFunction,
    update: options.update,
    cancel: options.cancel,
    _repeat: Infinity,
  });
};

/**
 * 从集合中移除一个补间动画。
 * <p>
 * 如果补间动画有取消回调函数，则会调用 {@link Tween#cancel}。
 * </p>
 *
 * @param {Tween} tween 要移除的补间动画。
 * @returns {boolean} 如果补间动画被移除则返回 <code>true</code>；如果在集合中未找到该补间动画则返回 <code>false</code>。
 */
TweenCollection.prototype.remove = function (tween) {
  if (!defined(tween)) {
    return false;
  }

  const index = this._tweens.indexOf(tween);
  if (index !== -1) {
    tween.tweenjs.stop();
    if (defined(tween.cancel)) {
      tween.cancel();
    }
    this._tweens.splice(index, 1);
    return true;
  }

  return false;
};

/**
 * 从集合中移除所有补间动画。
 * <p>
 * 对于每个有取消回调函数的补间动画，都会调用 {@link Tween#cancel}。
 * </p>
 */
TweenCollection.prototype.removeAll = function () {
  const tweens = this._tweens;

  for (let i = 0; i < tweens.length; ++i) {
    const tween = tweens[i];
    tween.tweenjs.stop();
    if (defined(tween.cancel)) {
      tween.cancel();
    }
  }
  tweens.length = 0;
};

/**
 * 确定此集合是否包含给定的补间动画。
 *
 * @param {Tween} tween 要检查的补间动画。
 * @returns {boolean} 如果集合包含该补间动画则返回 <code>true</code>，否则返回 <code>false</code>。
 */
TweenCollection.prototype.contains = function (tween) {
  return defined(tween) && this._tweens.indexOf(tween) !== -1;
};

/**
 * 返回集合中指定索引处的补间动画。索引从零开始，
 * 并在添加补间动画时递增。移除补间动画会将其后的所有补间动画向左移动，从而改变它们的索引。
 * 此函数通常用于遍历集合中的所有补间动画。
 *
 * @param {number} index 补间动画的从零开始的索引。
 * @returns {Tween} 指定索引处的补间动画。
 *
 * @example
 * // Output the duration of all the tweens in the collection.
 * const tweens = scene.tweens;
 * const length = tweens.length;
 * for (let i = 0; i < length; ++i) {
 *   console.log(tweens.get(i).duration);
 * }
 */
TweenCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._tweens[index];
};

/**
 * 更新集合中的补间动画到指定的时间。当补间动画完成时，它会从集合中移除。
 *
 * @param {number} [time=getTimestamp()] 时间（以秒为单位）。默认情况下，补间动画与系统时钟同步。
 */
TweenCollection.prototype.update = function (time) {
  const tweens = this._tweens;

  let i = 0;
  time = defined(time)
    ? time / TimeConstants.SECONDS_PER_MILLISECOND
    : getTimestamp();
  while (i < tweens.length) {
    const tween = tweens[i];
    const tweenjs = tween.tweenjs;

    if (tween.needsStart) {
      tween.needsStart = false;
      tweenjs.start(time);
    } else if (tweenjs.update(time)) {
      i++;
    } else {
      // there's a chance that the update callback has side effects that clear the list of tweens and/or adds new tweens
      // if it's the case that the update callback 1) clears all tweens held in the scene, then 2) adds new tweens
      // the splice operation below will not be operating on the original tween, but one of the unprocessed tweens added
      // from the update callback
      if (tweens[i]?.needsStart) {
        continue;
      }
      tweenjs.stop();
      tweens.splice(i, 1);
    }
  }
};

/**
 * 补间动画完成时执行的函数。
 * @callback TweenCollection.TweenCompleteCallback
 */

/**
 * 补间动画更新时执行的函数。
 * @callback TweenCollection.TweenUpdateCallback
 */

/**
 * 补间动画被取消时执行的函数。
 * @callback TweenCollection.TweenCancelledCallback
 */
export default TweenCollection;
