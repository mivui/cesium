/**
 * 由 {@link Visualizer} 执行的 BoundingSphere 计算的状态。
 * @enum {number}
 * @private
 */
const BoundingSphereState = Object.freeze({
  /**
   * BoundingSphere 已计算完成。
   * @type BoundingSphereState
   * @constant
   */
  DONE: 0,
  /**
   * BoundingSphere 正在计算中。
   * @type BoundingSphereState
   * @constant
   */
  PENDING: 1,
  /**
   * BoundingSphere 不存在。
   * @type BoundingSphereState
   * @constant
   */
  FAILED: 2,
});
export default BoundingSphereState;
