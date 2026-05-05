/**
 * 指定添加到 {@link CloudCollection#add} 中 {@link CloudCollection} 的云类型。
 *
 * @enum {number}
 */

const CloudType = {
  /**
   * 积云。
   *
   * @type {number}
   * @constant
   */
  CUMULUS: 0,
};

/**
 * 验证提供的云类型是否为有效的 {@link CloudType}
 *
 * @param {CloudType} cloudType 要验证的云类型。
 * @returns {boolean} 如果提供的云类型是有效值则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @example
 * if (!Cesium.CloudType.validate(cloudType)) {
 *   throw new Cesium.DeveloperError('cloudType must be a valid value.');
 * }
 */

CloudType.validate = function (cloudType) {
  return cloudType === CloudType.CUMULUS;
};

Object.freeze(CloudType);

export default CloudType;
