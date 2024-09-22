/**
 * 确定如何对 {@link PostProcessStage} 的输入纹理进行采样。
 *
 * @enum {number}
 */
const PostProcessStageSampleMode = {
  /**
   * 通过返回最近的纹素对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  NEAREST: 0,
  /**
   * 通过对四个最近的纹素进行双线性插值对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  LINEAR: 1,
};
export default PostProcessStageSampleMode;
