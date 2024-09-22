import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import DataSource from "./DataSource.js";
import EntityCluster from "./EntityCluster.js";
import EntityCollection from "./EntityCollection.js";

/**
 * 一个 {@link DataSource} 实现，可用于手动管理一组实体。
 *
 * @alias CustomDataSource
 * @constructor
 *
 * @param {string} [name] A human-readable name for this instance.
 *
 * @example
 * const dataSource = new Cesium.CustomDataSource('myData');
 *
 * const entity = dataSource.entities.add({
 *    position : Cesium.Cartesian3.fromDegrees(1, 2, 0),
 *    billboard : {
 *        image : 'image.png'
 *    }
 * });
 *
 * viewer.dataSources.add(dataSource);
 */
function CustomDataSource(name) {
  this._name = name;
  this._clock = undefined;
  this._changed = new Event();
  this._error = new Event();
  this._isLoading = false;
  this._loading = new Event();
  this._entityCollection = new EntityCollection(this);
  this._entityCluster = new EntityCluster();
}

Object.defineProperties(CustomDataSource.prototype, {
  /**
   * 获取或设置此实例的可读名称。
   * @memberof CustomDataSource.prototype
   * @type {string}
   */
  name: {
    get: function () {
      return this._name;
    },
    set: function (value) {
      if (this._name !== value) {
        this._name = value;
        this._changed.raiseEvent(this);
      }
    },
  },
  /**
   * 获取或设置clock 的实例。
   * @memberof CustomDataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    get: function () {
      return this._clock;
    },
    set: function (value) {
      if (this._clock !== value) {
        this._clock = value;
        this._changed.raiseEvent(this);
      }
    },
  },
  /**
   * 获取 {@link Entity} 实例的集合。
   * @memberof CustomDataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: function () {
      return this._entityCollection;
    },
  },
  /**
   * 获取或设置数据源当前是否正在加载数据。
   * @memberof CustomDataSource.prototype
   * @type {boolean}
   */
  isLoading: {
    get: function () {
      return this._isLoading;
    },
    set: function (value) {
      DataSource.setLoading(this, value);
    },
  },
  /**
   * 获取将在基础数据更改时引发的事件。
   * @memberof CustomDataSource.prototype
   * @type {Event}
   */
  changedEvent: {
    get: function () {
      return this._changed;
    },
  },
  /**
   * 获取在处理过程中遇到错误时将引发的事件。
   * @memberof CustomDataSource.prototype
   * @type {Event}
   */
  errorEvent: {
    get: function () {
      return this._error;
    },
  },
  /**
   * 获取在数据源开始或停止加载时将引发的事件。
   * @memberof CustomDataSource.prototype
   * @type {Event}
   */
  loadingEvent: {
    get: function () {
      return this._loading;
    },
  },
  /**
   * 获取是否应显示此数据源。
   * @memberof CustomDataSource.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._entityCollection.show;
    },
    set: function (value) {
      this._entityCollection.show = value;
    },
  },

  /**
   * 获取或设置此数据源的聚类选项。此对象可以在多个数据源之间共享。
   *
   * @memberof CustomDataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: function () {
      return this._entityCluster;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value must be defined.");
      }
      //>>includeEnd('debug');
      this._entityCluster = value;
    },
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
CustomDataSource.prototype.update = function (time) {
  return true;
};

export default CustomDataSource;
