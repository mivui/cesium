import DeveloperError from "../Core/DeveloperError.js";

/**
 * 用于指示要显示传感器体积的哪一部分的常量。
 *
 * @enum {Number}
 */
const SensorVolumePortionToDisplay = {
  /**
   * 0x0000.  Display the complete sensor volume.
   *
   * @type {Number}
   * @constant
   */
  COMPLETE: 0x0000,
  /**
   * 0x0001.  显示传感器体积中位于椭球体真实水平线以下的部分。
   *
   * @type {Number}
   * @constant
   */
  BELOW_ELLIPSOID_HORIZON: 0x0001,
  /**
   * 0x0002. 显示位于椭球体真实水平上方的传感器体积部分。
   *
   * @type {Number}
   * @constant
   */
  ABOVE_ELLIPSOID_HORIZON: 0x0002,
};

/**
 * 验证提供的值是否为有效的 {@link SensorVolumePortionToDisplay} 枚举值。
 *
 * @param {SensorVolumePortionToDisplay} portionToDisplay 要验证的值。
 *
 * @returns {Boolean} 如果提供的值是有效的枚举值，<code>则为 true</code>;否则为 <code>false</code>。
 */
SensorVolumePortionToDisplay.validate = function (portionToDisplay) {
  return (
    portionToDisplay === SensorVolumePortionToDisplay.COMPLETE ||
    portionToDisplay === SensorVolumePortionToDisplay.BELOW_ELLIPSOID_HORIZON ||
    portionToDisplay === SensorVolumePortionToDisplay.ABOVE_ELLIPSOID_HORIZON
  );
};

/**
 *将提供的值转换为其相应的枚举字符串。
 *
 * @param {SensorVolumePortionToDisplay} portionToDisplay 要转换为其相应枚举字符串的值。
 *
 * @returns {String} 与值对应的枚举字符串。
 */
SensorVolumePortionToDisplay.toString = function (portionToDisplay) {
  switch (portionToDisplay) {
    case SensorVolumePortionToDisplay.COMPLETE:
      return "COMPLETE";
    case SensorVolumePortionToDisplay.BELOW_ELLIPSOID_HORIZON:
      return "BELOW_ELLIPSOID_HORIZON";
    case SensorVolumePortionToDisplay.ABOVE_ELLIPSOID_HORIZON:
      return "ABOVE_ELLIPSOID_HORIZON";
    default:
      throw new DeveloperError(
        "SensorVolumePortionToDisplay value is not valid and cannot be converted to a String.",
      );
  }
};

export default SensorVolumePortionToDisplay;
