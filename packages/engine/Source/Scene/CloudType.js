/**
 * 指定添加到 {@link CloudCollection#add} 中 {@link CloudCollection} 的云的类型。
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
 * @returns {boolean} <code>true</code>（如果提供的云类型为有效值）;否则为 <code>false</code>。
 *
 * @example
 * 如果 （！Cesium.CloudType.validate（cloudType）） {
 * throw new Cesium.DeveloperError（'cloudType must a valid value.'）;
 * }
 */

CloudType.validate = function (cloudType) {
  return cloudType === CloudType.CUMULUS;
};

export default Object.freeze(CloudType);
