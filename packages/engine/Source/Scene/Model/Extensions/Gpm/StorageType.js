// @ts-check

/**
 * 协方差信息的存储类型枚举。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展中
 * `gltfGpmLocal.storageType` 的定义。
 *
 * @enum {string}
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下更改。
 */
const StorageType = {
  /**
   * 存储锚点的完整误差协方差，包括交叉协方差项
   *
   * @type {string}
   * @constant
   */
  Direct: "Direct",

  /**
   * 为每个锚点存储完整的协方差矩阵。但在这种情况下，交叉协方差项不直接存储，
   * 而是可以通过元数据中存储的一组空间相关函数参数来计算。
   *
   * @type {string}
   * @constant
   */
  Indirect: "Indirect",
};

Object.freeze(StorageType);

export default StorageType;
