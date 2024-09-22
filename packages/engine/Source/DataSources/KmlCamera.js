/**
 * <Camera> 来自 KML 的代表
 * @alias KmlCamera
 * @constructor
 *
 * @param {Cartesian3} position 相机位置
 * @param {HeadingPitchRoll} headingPitchRoll 相机方向
 */
function KmlCamera(position, headingPitchRoll) {
  this.position = position;
  this.headingPitchRoll = headingPitchRoll;
}
export default KmlCamera;
