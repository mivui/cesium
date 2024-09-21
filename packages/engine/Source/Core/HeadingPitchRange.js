import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 定义局部帧中的航向角、俯仰角和范围。
 * 航向是从局部东方向的旋转，其中正角度向南增加。
 * 俯仰是相对于局部 xy 平面的旋转。正俯仰角位于平面上方。负螺距
 * 角度低于平面。Range 是距帧中心的距离。
 * @alias HeadingPitchRange
 * @constructor
 *
 * @param {number} [heading=0.0] 航向角，以弧度为单位。
 * @param {number} [pitch=0.0] 以弧度为单位的俯仰角。
 * @param {number} [range=0.0] 距中心的距离，单位为米。
 */
function HeadingPitchRange(heading, pitch, range) {
  /**
   * 航向是从局部东方向的旋转，其中正角度向南增加。
   * @type {number}
   * @default 0.0
   */
  this.heading = defaultValue(heading, 0.0);

  /**
   * 俯仰是相对于局部 xy 平面的旋转。正俯仰角
   * 位于平面上方。负俯仰角位于平面下方。
   * @type {number}
   * @default 0.0
   */
  this.pitch = defaultValue(pitch, 0.0);

  /**
   * Range 是距本地帧中心的距离。
   * @type {number}
   * @default 0.0
   */
  this.range = defaultValue(range, 0.0);
}

/**
 * 复制HeadingPitchRange instance.
 *
 * @param {HeadingPitchRange} hpr The HeadingPitchRange to duplicate.
 * @param {HeadingPitchRange} [result] 要在其上存储结果的对象。
 * @returns {HeadingPitchRange} 修改后的结果参数或者新的 HeadingPitchRange 实例（如果未提供）。（如果 hpr 未定义，则返回 undefined）
 */
HeadingPitchRange.clone = function (hpr, result) {
  if (!defined(hpr)) {
    return undefined;
  }
  if (!defined(result)) {
    result = new HeadingPitchRange();
  }

  result.heading = hpr.heading;
  result.pitch = hpr.pitch;
  result.range = hpr.range;
  return result;
};
export default HeadingPitchRange;
