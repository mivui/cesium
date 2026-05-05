import BlendEquation from "./BlendEquation.js";
import BlendFunction from "./BlendFunction.js";

/**
 * 指定用于组合源颜色和目标颜色的 {@link BlendFunction}、{@link BlendEquation} 和常量值。
 *
 * @alias BlendingState
 * @constructor
 *
 * @private
 */
function BlendingState() {
  this.enabled = false;
  this.colorBlendFunction = BlendFunction.ONE;
  this.alphaBlendFunction = BlendFunction.ONE;
  this.colorBlendEquation = BlendEquation.ADD;
  this.alphaBlendEquation = BlendEquation.ADD;
  this.constantColor = [0.0, 0.0, 0.0, 0.0];
}

export default BlendingState;
