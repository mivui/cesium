/**
 * @alias KmlLookAt
 * @constructor
 *
 * @param {Cartesian3} position 摄像机位置
 * @param {HeadingPitchRange} headingPitchRange 相机方向
 */
function KmlLookAt(position, headingPitchRange) {
  this.position = position;
  this.headingPitchRange = headingPitchRange;
}
export default KmlLookAt;
