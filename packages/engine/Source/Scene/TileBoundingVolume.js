import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义平铺的边界体积。此类型描述接口
 * ，并且不打算直接实例化。
 *
 * @alias TileBoundingVolume
 * @constructor
 *
 * @see TileBoundingRegion
 * @see TileBoundingSphere
 * @see TileOrientedBoundingBox
 *
 * @private
 */
function TileBoundingVolume() {}

/**
 * 底层边界体积。
 *
 * @type {object}
 * @readonly
 */
TileBoundingVolume.prototype.boundingVolume = undefined;

/**
 * 底层边界球体。
 *
 * @type {BoundingSphere}
 * @readonly
 */
TileBoundingVolume.prototype.boundingSphere = undefined;

/**
 * 计算图块和相机之间的距离。
 *
 * @param {FrameState} frameState 帧状态。
 * @return {number} 瓦片与相机之间的距离，以米为单位。
 * 如果摄像机位于平铺内，则返回 0.0。
 */
TileBoundingVolume.prototype.distanceToCamera = function (frameState) {
  DeveloperError.throwInstantiationError();
};

/**
 * 确定此卷位于平面的哪一侧。
 *
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect} {@link Intersect.INSIDE} 如果整个体积位于平面的一侧
 * 法线指向，@link如果整个体积为
 * 在另一侧，@link如果体积
 * 与平面相交。
 */
TileBoundingVolume.prototype.intersectPlane = function (plane) {
  DeveloperError.throwInstantiationError();
};

/**
 * 创建显示平铺边界轮廓的调试基元
 *卷。
 *
 * @param {Color} color 基元网格的所需颜色
 * @return {Primitive}
 */
TileBoundingVolume.prototype.createDebugVolume = function (color) {
  DeveloperError.throwInstantiationError();
};
export default TileBoundingVolume;
