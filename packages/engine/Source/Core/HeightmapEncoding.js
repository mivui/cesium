// @ts-check

/**
 * 高度图所使用的编码方式
 *
 * @enum {number}
 */
const HeightmapEncoding = {
  /**
   * 无编码
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * LERC 编码
   *
   * @type {number}
   * @constant
   *
   * @see {@link https://github.com/Esri/lerc|LERC 规范}
   */
  LERC: 1,
};

Object.freeze(HeightmapEncoding);

export default HeightmapEncoding;
