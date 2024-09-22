import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义数据源的接口，该接口将任意数据转换为
 * {@link EntityCollection} 用于通用使用。此对象是一个接口
 * 用于文档目的，不打算直接实例化。
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
   * 获取此实例的可读名称。
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
   * 获取一个值，该值指示数据源当前是否正在加载数据。
   * @memberof DataSource.prototype
   * @type {boolean}
   */
  isLoading: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取将在基础数据更改时引发的事件。
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
   * 获取在 isLoading 的值更改时将引发的事件。
   * @memberof DataSource.prototype
   * @type {Event<function(this, boolean)>}
   */
  loadingEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取是否 this data source should be displayed.
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
 * 将数据源更新为提供的时间。 此功能是可选的，并且
 * 不需要实施。 它适用于以下数据源
 * 根据当前动画时间或场景状态检索数据。
 * 如果实现，则 {@link DataSourceDisplay} 将每帧调用一次 update。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果此数据源已准备好在提供的时间显示，则为 True，否则为 false。
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
