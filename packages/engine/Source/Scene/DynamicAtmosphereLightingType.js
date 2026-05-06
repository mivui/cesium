/**
 * 大气照明效果（天空大气、地面大气、雾）可以通过来自太阳或其他随时间变化的光源的动态照明进一步修改。此枚举确定使用哪种光源。
 *
 * @enum {number}
 */
const DynamicAtmosphereLightingType = {
  /**
   * 不使用动态大气照明。大气照明效果将从正上方照明，而不是使用场景的光源。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,
  /**
   * 使用场景的当前光源进行动态大气照明。
   *
   * @type {number}
   * @constant
   */
  SCENE_LIGHT: 1,
  /**
   * 强制动态大气照明始终使用日光方向，即使场景使用不同的光源。
   *
   * @type {number}
   * @constant
   */
  SUNLIGHT: 2,
};

/**
 * Get the lighting enum from the older globe flags
 *
 * @param {Globe} globe The globe
 * @return {DynamicAtmosphereLightingType} The corresponding enum value
 *
 * @private
 */
DynamicAtmosphereLightingType.fromGlobeFlags = function (globe) {
  const lightingOn = globe.enableLighting && globe.dynamicAtmosphereLighting;
  if (!lightingOn) {
    return DynamicAtmosphereLightingType.NONE;
  }

  // Force sunlight
  if (globe.dynamicAtmosphereLightingFromSun) {
    return DynamicAtmosphereLightingType.SUNLIGHT;
  }

  return DynamicAtmosphereLightingType.SCENE_LIGHT;
};

Object.freeze(DynamicAtmosphereLightingType);

export default DynamicAtmosphereLightingType;
