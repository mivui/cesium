import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义可视化工具的界面。可视化工具是
 * {@link DataSourceDisplay} 呈现与
 * {@link DataSource} 实例。
 * 此对象是用于文档目的的接口，并非
 * 直接实例化。
 * @alias Visualizer
 * @constructor
 *
 * @see BillboardVisualizer
 * @see LabelVisualizer
 * @see ModelVisualizer
 * @see PathVisualizer
 * @see PointVisualizer
 * @see GeometryVisualizer
 */
function Visualizer() {
  DeveloperError.throwInstantiationError();
}

/**
 * 将可视化效果更新为提供的时间。
 * @function
 *
 * @param {JulianDate} time 时间。
 *
 * @returns {boolean} 如果显示已更新到提供的时间，则为 True，
 * 如果可视化工具正在等待异步操作
 * 在更新数据之前完成。
 */
Visualizer.prototype.update = DeveloperError.throwInstantiationError;

/**
 * 计算一个边界球体，该球体包含为指定实体生成的可视化效果。
 * 边界球体位于场景地球的固定帧中。
 *
 * @param {Entity} entity 要计算其边界球体的实体。
 * @param {BoundingSphere} result 要存储结果的边界球体。
 * @returns {BoundingSphereState} BoundingSphereState.DONE（如果结果包含边界球体），
 * BoundingSphereState.PENDING（如果结果仍在计算中），或者
 * BoundingSphereState.FAILED，如果实体在当前场景中没有可视化效果。
 * @private
 */
Visualizer.prototype.getBoundingSphere = DeveloperError.throwInstantiationError;

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * @function
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 */
Visualizer.prototype.isDestroyed = DeveloperError.throwInstantiationError;

/**
 * 删除所有可视化并清理与此实例关联的任何资源。
 * @function
 */
Visualizer.prototype.destroy = DeveloperError.throwInstantiationError;
export default Visualizer;
