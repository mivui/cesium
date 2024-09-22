import BlendEquation from "./BlendEquation.js";
import BlendFunction from "./BlendFunction.js";

/**
 * 混合状态结合了 {@link BlendEquation} 和 {@link BlendFunction} 以及
 * <code>enabled</code> 标志来定义将 source 和
 * 渲染时的目标片段。
 * <p>
 * 当使用 {@link Appearance#renderState} 的自定义渲染状态时，这是一个帮助程序。
 * </p>
 *
 * @namespace
 */
const BlendingState = {
  /**
   * 混合已禁用。
   *
   * @type {object}
   * @constant
   */
  DISABLED: Object.freeze({
    enabled: false,
  }),

  /**
   * 使用 alpha 混合 <code>source（source.alpha） + destination（1 - source.alpha）</code> 启用混合。
   *
   * @type {object}
   * @constant
   */
  ALPHA_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.SOURCE_ALPHA,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
    functionDestinationAlpha: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
  }),

  /**
   * 使用预乘 Alpha 的 alpha 混合启用 <code>source + destination（1 - source.alpha）</code> 的混合。
   *
   * @type {object}
   * @constant
   */
  PRE_MULTIPLIED_ALPHA_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.ONE,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
    functionDestinationAlpha: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
  }),

  /**
   * 使用加法混合 <code>source（source.alpha） + destination</code> 启用混合。
   *
   * @type {object}
   * @constant
   */
  ADDITIVE_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.SOURCE_ALPHA,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE,
    functionDestinationAlpha: BlendFunction.ONE,
  }),
};
export default Object.freeze(BlendingState);
