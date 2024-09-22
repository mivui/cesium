/**
 * 确定是否以及如何循环 glTF 动画。
 *
 * @enum {number}
 *
 * @see ModelAnimationCollection#add
 */
const ModelAnimationLoop = {
  /**
   * 播放一次动画;不要循环它。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 在动画停止后立即从头开始循环播放动画。
   *
   * @type {number}
   * @constant
   */
  REPEAT: 1,

  /**
   * 循环播放动画。 首先，向前播放，然后反向播放，然后向前播放，依此类推。
   *
   * @type {number}
   * @constant
   */
  MIRRORED_REPEAT: 2,
};
export default Object.freeze(ModelAnimationLoop);
