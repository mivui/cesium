// @ts-check

/**
 * 在高动态范围渲染时使用的色调映射算法。
 *
 * @enum {string}
 */
const Tonemapper = {
  /**
   * 使用Reinhard色调映射。
   *
   * @type {string}
   * @constant
   */
  REINHARD: "REINHARD",

  /**
   * 使用修正的Reinhard色调映射。
   *
   * @type {string}
   * @constant
   */
  MODIFIED_REINHARD: "MODIFIED_REINHARD",

  /**
   * 使用电影色调映射。
   *
   * @type {string}
   * @constant
   */
  FILMIC: "FILMIC",

  /**
   * 使用ACES色调映射。
   *
   * @type {string}
   * @constant
   */
  ACES: "ACES",

  /**
   * 使用PBR中性色调映射 {@link https://github.com/KhronosGroup/ToneMapping/tree/main/PBR_Neutral|来自Khronos}。
   *
   * @type {string}
   * @constant
   */
  PBR_NEUTRAL: "PBR_NEUTRAL",
};

/**
 * Validate whether the provided value is a known Tonemapper type
 * @private
 *
 * @param {string} tonemapper
 */
export function validateTonemapper(tonemapper) {
  return (
    tonemapper === Tonemapper.REINHARD ||
    tonemapper === Tonemapper.MODIFIED_REINHARD ||
    tonemapper === Tonemapper.FILMIC ||
    tonemapper === Tonemapper.ACES ||
    tonemapper === Tonemapper.PBR_NEUTRAL
  );
}

Object.freeze(Tonemapper);

export default Tonemapper;
