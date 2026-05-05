import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义数据源的接口，将任意数据转换为 {@link EntityCollection} 以供通用处理。
 * 此对象是用于文档说明的接口，不应直接实例化。
 * @alias DataSource
 * @constructor
 *
 * @see Entity
 * @see DataSourceDisplay
 */
function DataSource() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(DataSource.prototype, {
  /**
   * 获取此实例的人类可读名称。
   * @memberof DataSource.prototype
   * @type {string}
   */
  name: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取此数据源的首选时钟设置。
   * @memberof DataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取 {@link Entity} 实例的集合。
   * @memberof DataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取一个值，指示数据源是否正在加载数据。
   * @memberof DataSource.prototype
   * @type {boolean}
   */
  isLoading: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取当底层数据发生变化时将引发的事件。
   * @memberof DataSource.prototype
   * @type {Event}
   */
  changedEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取在处理过程中遇到错误时将引发的事件。
   * @memberof DataSource.prototype
   * @type {Event<function(this, RequestErrorEvent)>}
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取 isLoading 值改变时将引发的事件。
   * @memberof DataSource.prototype
   * @type {Event<function(this, boolean)>}
   */
  loadingEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取是否应显示此数据源。
   * @memberof DataSource.prototype
   * @type {boolean}
   */
  show: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取或设置此数据源的聚类选项。此对象可以在多个数据源之间共享。
   *
   * @memberof DataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 将数据源更新到指定时间。此函数是可选的，不需要实现。
 * 它为那些基于当前动画时间或场景状态检索数据的数据源提供。
 * 如果实现，{@link DataSourceDisplay} 将在每帧调用 update。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果此数据源在提供的时间已准备好显示，则为 true，否则为 false。
 */
DataSource.prototype.update = function (time) {
  DeveloperError.throwInstantiationError();
};

/**
 * @private
 */
DataSource.setLoading = function (dataSource, isLoading) {
  if (dataSource._isLoading !== isLoading) {
    if (isLoading) {
      dataSource._entityCollection.suspendEvents();
    } else {
      dataSource._entityCollection.resumeEvents();
    }
    dataSource._isLoading = isLoading;
    dataSource._loading.raiseEvent(dataSource, isLoading);
  }
};
export default DataSource;
