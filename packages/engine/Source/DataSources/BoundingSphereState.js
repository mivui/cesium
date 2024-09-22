/**
 * 由 {@link Visualizer} 执行的 BoundingSphere 计算的状态。
 * @enum {number}
 * @private
 */
const BoundingSphereState = {
  /**
   * 已计算 BoundingSphere。
   * @type BoundingSphereState
   * @constant
   */
  DONE: 0,
  /**
   * BoundingSphere 仍在计算中。
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
};
export default Object.freeze(BoundingSphereState);
