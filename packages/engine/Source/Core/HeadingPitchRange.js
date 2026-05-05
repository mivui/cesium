import defined from "./defined.js";

/**
 * 在局部帧中定义偏航角、俯仰角和距离。
 * 偏航角是从局部东方向开始的旋转角度，正角度表示向南增加。
 * 俯仰角是从局部 xy 平面开始的旋转角度。正俯仰角在平面上方，负俯仰角在平面下方。距离是距帧中心的距离。
 * @alias HeadingPitchRange
 * @constructor
 *
 * @param {number} [heading=0.0] 偏航角（弧度）。
 * @param {number} [pitch=0.0] 俯仰角（弧度）。
 * @param {number} [range=0.0] 距中心的距离（米）。
 */
function HeadingPitchRange(heading, pitch, range) {
  /**
   * 偏航角是从局部东方向开始的旋转角度，正角度表示向南增加。
   * @type {number}
   * @default 0.0
   */
  this.heading = heading ?? 0.0;

  /**
   * 俯仰角是从局部 xy 平面开始的旋转角度。正俯仰角在平面上方，负俯仰角在平面下方。
   * @type {number}
   * @default 0.0
   */
  this.pitch = pitch ?? 0.0;

  /**
   * 距离是局部帧中心的距离。
   * @type {number}
   * @default 0.0
   */
  this.range = range ?? 0.0;
}

/**
 * 复制一个 HeadingPitchRange 实例。
 *
 * @param {HeadingPitchRange} hpr 要复制的 HeadingPitchRange。
 * @param {HeadingPitchRange} [result] 用于存储结果的对象。
 * @returns {HeadingPitchRange} 修改后的 result 参数，如果未提供则返回新的 HeadingPitchRange 实例。（如果 hpr 未定义则返回 undefined）
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
