/**
 * 氛围灯光效果（天空氛围、地面氛围、雾）可以
 * 使用来自太阳或其他光源的动态照明进一步修改
 * 随时间变化。此枚举确定要使用的光源。
 *
 * @enum {number}
 */
const DynamicAtmosphereLightingType = {
  /**
   * 请勿使用动态氛围照明。氛围灯效将
   * 从正上方照亮，而不是使用场景的光源。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,
  /**
   * 将场景的当前光源用于动态氛围照明。
   *
   * @type {number}
   * @constant
   */
  SCENE_LIGHT: 1,
  /**
   * 强制动态氛围照明始终使用阳光方向，
   * 即使场景使用不同的光源。
   *
   * @type {number}
   * @constant
   */
  SUNLIGHT: 2,
};

/**
 * 从较旧的地球标志中获取照明枚举
 *
 * @param {Globe} globe 地球仪
 * @return {DynamicAtmosphereLightingType} 相应的枚举值
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

export default Object.freeze(DynamicAtmosphereLightingType);
