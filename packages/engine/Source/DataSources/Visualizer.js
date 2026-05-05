import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义可视化器的接口。可视化器是 {@link DataSourceDisplay} 的插件，
 * 用于渲染与 {@link DataSource} 实例相关的数据。
 * 此对象仅用于文档说明，不打算直接实例化。
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
 * 将可视化更新到指定的时间。
 * @function
 *
 * @param {JulianDate} time 时间。
 *
 * @returns {boolean} 如果显示已更新到指定时间则返回 true，
 * 如果可视化器正在等待异步操作完成才能更新数据，则返回 false。
 */
Visualizer.prototype.update = DeveloperError.throwInstantiationError;

/**
 * 计算包围指定实体可视化结果的包围球。
 * 包围球位于场景地球的固定框架中。
 *
 * @param {Entity} entity 要计算包围球的实体。
 * @param {BoundingSphere} result 用于存储结果的包围球。
 * @returns {BoundingSphereState} 如果结果包含包围球则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中则返回 BoundingSphereState.PENDING，
 *                       如果实体在当前场景中没有可视化则返回 BoundingSphereState.FAILED。
 * @private
 */
Visualizer.prototype.getBoundingSphere = DeveloperError.throwInstantiationError;

/**
 * Returns true if this object was destroyed; otherwise, false.
 * @function
 *
 * @returns {boolean} True if this object was destroyed; otherwise, false.
 */
Visualizer.prototype.isDestroyed = DeveloperError.throwInstantiationError;

/**
 * Removes all visualization and cleans up any resources associated with this instance.
 * @function
 */
Visualizer.prototype.destroy = DeveloperError.throwInstantiationError;
export default Visualizer;
