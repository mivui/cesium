/**
 * 确定公告牌、点和标签的不透明和半透明部分如何与场景混合。
 *
 * @enum {number}
 */
const BlendOption = {
  /**
   * 集合中的广告牌、点或标签是完全不透明的。
   * @type {number}
   * @constant
   */
  OPAQUE: 0,

  /**
   * 集合中的广告牌、点或标签是完全透明的。
   * @type {number}
   * @constant
   */
  TRANSLUCENT: 1,

  /**
   * 集合中的广告牌、点或标签既不透明又半透明。
   * @type {number}
   * @constant
   */
  OPAQUE_AND_TRANSLUCENT: 2,
};
export default Object.freeze(BlendOption);
