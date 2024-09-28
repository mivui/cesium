/**
 * 包含在特定时间计算的取向数据的结构体。 数据
 * 表示旋转极点的方向和围绕该极点的旋转。
 * <p>
 * 这些参数对应于 IAU/IAG 工作组报告中的参数
 * 只是它们以弧度表示。
 * </p>
 *
 * @namespace IauOrientationParameters
 *
 * @private
 */
function IauOrientationParameters(
  rightAscension,
  declination,
  rotation,
  rotationRate,
) {
  /**
   * 天体北极相对于
   * 国际天体参考系，以弧度为单位。
   * @type {number}
   *
   * @private
   */
  this.rightAscension = rightAscension;

  /**
   * 物体北极相对于
   * 国际天体参考系，以弧度为单位。
   * @type {number}
   *
   * @private
   */
  this.declination = declination;

  /**
   * 用于对齐一组轴的绕北极的旋转
   * IAU 报告定义的子午线，以弧度为单位。
   * @type {number}
   *
   * @private
   */
  this.rotation = rotation;

  /**
   * 绕北极的瞬时旋转速率，以弧度/秒为单位。
   * @type {number}
   *
   * @private
   */
  this.rotationRate = rotationRate;
}
export default IauOrientationParameters;
