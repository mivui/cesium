/**
 * 协方差信息的存储类型的枚举。
 *
 * 这反映了
 * {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展。
 *
 * @enum {string}
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
const StorageType = {
  /**
   * 存储锚点的完整误差协方差，以包含交叉协方差项
   *
   * @type {string}
   * @constant
   */
  Direct: "Direct",

  /**
   * A full covariance matrix is stored for each of the anchor points. However, in this case the
   * cross-covariance terms are not directly stored, but can be computed by a set of spatial
   * correlation function parameters which are stored in the metadata.
   *
   * @type {string}
   * @constant
   */
  Indirect: "Indirect",
};

export default Object.freeze(StorageType);
