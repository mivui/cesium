/**
 * 表示 KML 中的 <LookAt>。
 * @alias KmlLookAt
 * @constructor
 *
 * @param {Cartesian3} pointToWatch 要观察的点。
 * @param {HeadingPitchRange} headingPitchRange 观察方向。
 */
function KmlLookAt(position, headingPitchRange) {
  this.position = position;
  this.headingPitchRange = headingPitchRange;
}
export default KmlLookAt;
