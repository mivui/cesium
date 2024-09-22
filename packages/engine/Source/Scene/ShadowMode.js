/**
 * 指定在以下情况下，对象是投射还是接收来自光源的阴影
 * 启用阴影。
 *
 * @enum {number}
 */
const ShadowMode = {
  /**
   * 对象不投射或接收阴影。
   *
   * @type {number}
   * @constant
   */
  DISABLED: 0,

  /**
   * 对象投射和接收阴影。
   *
   * @type {number}
   * @constant
   */
  ENABLED: 1,

  /**
   * 对象仅投射阴影。
   *
   * @type {number}
   * @constant
   */
  CAST_ONLY: 2,

  /**
   * 对象仅接收阴影。
   *
   * @type {number}
   * @constant
   */
  RECEIVE_ONLY: 3,
};

/**
 * @private
 */
ShadowMode.NUMBER_OF_SHADOW_MODES = 4;

/**
 * @private
 */
ShadowMode.castShadows = function (shadowMode) {
  return (
    shadowMode === ShadowMode.ENABLED || shadowMode === ShadowMode.CAST_ONLY
  );
};

/**
 * @private
 */
ShadowMode.receiveShadows = function (shadowMode) {
  return (
    shadowMode === ShadowMode.ENABLED || shadowMode === ShadowMode.RECEIVE_ONLY
  );
};

/**
 * @private
 */
ShadowMode.fromCastReceive = function (castShadows, receiveShadows) {
  if (castShadows && receiveShadows) {
    return ShadowMode.ENABLED;
  } else if (castShadows) {
    return ShadowMode.CAST_ONLY;
  } else if (receiveShadows) {
    return ShadowMode.RECEIVE_ONLY;
  }
  return ShadowMode.DISABLED;
};

export default Object.freeze(ShadowMode);
