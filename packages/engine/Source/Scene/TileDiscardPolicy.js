import DeveloperError from "../Core/DeveloperError.js";

/**
 * 根据特定条件丢弃瓦片图像的策略。此类型描述了一个接口，不打算直接实例化。
 *
 * @alias TileDiscardPolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 * @see NeverTileDiscardPolicy
 */
function TileDiscardPolicy(options) {
  DeveloperError.throwInstantiationError();
}

/**
 * 确定丢弃策略是否已准备好处理图像。
 * @function
 *
 * @returns {boolean} 如果丢弃策略已准备好处理图像则返回 true，否则返回 false。
 */
TileDiscardPolicy.prototype.isReady = DeveloperError.throwInstantiationError;

/**
 * 给定瓦片图像，决定是否丢弃该图像。
 * @function
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果图像应被丢弃则返回 true，否则返回 false。
 */
TileDiscardPolicy.prototype.shouldDiscardImage =
  DeveloperError.throwInstantiationError;
export default TileDiscardPolicy;
