/**
 * 用于配置 {@link AlphaPipelineStage} 的选项
 *
 * @alias ModelAlphaOptions
 * @constructor
 *
 * @private
 */
function ModelAlphaOptions() {
  /**
   * 哪个渲染通道将渲染模型。
   *
   * @type {通行证}
   * @private
   */
  this.pass = undefined;
  /**
   * 确定 Alpha 阈值，低于该阈值时，将丢弃片段
   *
   * @type {number}
   * @private
   */
  this.alphaCutoff = undefined;
}

export default ModelAlphaOptions;
