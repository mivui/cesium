import DeveloperError from "../Core/DeveloperError.js";

/**
 * 根据某些标准丢弃磁贴图像的策略。 此类型描述
 * 接口，并且不打算直接实例化。
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
 * 确定丢弃策略是否已准备好处理映像。
 * @function
 *
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则为 True;否则为 false。
 */
TileDiscardPolicy.prototype.isReady = DeveloperError.throwInstantiationError;

/**
 * 给定一个平铺图像，决定是否丢弃该图像。
 * @function
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果应该丢弃图像，则为 True;否则为 false。
 */
TileDiscardPolicy.prototype.shouldDiscardImage =
  DeveloperError.throwInstantiationError;
export default TileDiscardPolicy;
