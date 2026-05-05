// @ts-check

/**
 * 确定如何混合广告牌、点和标签的不透明和半透明部分与场景。
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
    * 集合中的广告牌、点或标签是完全半透明的。
    * @type {number}
    * @constant
    */
  TRANSLUCENT: 1,

   /**
    * 集合中的广告牌、点或标签同时包含不透明和半透明。
    * @type {number}
    * @constant
    */
  OPAQUE_AND_TRANSLUCENT: 2,
};

Object.freeze(BlendOption);

export default BlendOption;
