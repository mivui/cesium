/**
 * 材质的 Alpha 渲染模式。
 *
 * @enum {string}
 * @private
 */
const AlphaMode = {
  /**
   * 忽略 alpha 值，渲染输出完全不透明。
   *
   * @type {string}
   * @constant
   */
  OPAQUE: "OPAQUE",

  /**
   * 渲染的输出是完全不透明或完全透明的，具体取决于 Alpha 值和指定的 Alpha 截止值。
   *
   * @type {string}
   * @constant
   */
  MASK: "MASK",

  /**
   * 渲染的输出通过 Alpha 混合合成到目标上。
   *
   * @type {string}
   * @constant
   */
  BLEND: "BLEND",
};

export default Object.freeze(AlphaMode);
