import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";

/**
 * 一个 {@link DataSource} 实例的集合。
 * @alias DataSourceCollection
 * @constructor
 */
function DataSourceCollection() {
  this._dataSources = [];
  this._dataSourceAdded = new Event();
  this._dataSourceRemoved = new Event();
  this._dataSourceMoved = new Event();
}

Object.defineProperties(DataSourceCollection.prototype, {
  /**
   * 获取此集合中数据源的数量。
   * @memberof DataSourceCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._dataSources.length;
    },
  },

  /**
   * 当数据源被添加到集合时引发的事件。
   * 事件处理程序会接收到被添加的数据源。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceAdded: {
    get: function () {
      return this._dataSourceAdded;
    },
  },

  /**
   * 当数据源从集合中移除时引发的事件。
   * 事件处理程序会接收到被移除的数据源。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceRemoved: {
    get: function () {
      return this._dataSourceRemoved;
    },
  },

  /**
   * 当数据源在集合中改变位置时引发的事件。事件处理程序会接收到
   * 被移动的数据源、移动后的新索引以及移动前的旧索引。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceMoved: {
    get: function () {
      return this._dataSourceMoved;
    },
  },
});

/**
 * 将数据源添加到集合中。
 *
 * @param {DataSource|Promise<DataSource>} dataSource 要添加到集合中的数据源或数据源 Promise。
 *                                        当传递 Promise 时，数据源在 Promise 成功解析后才会
 *                                        实际添加到集合中。
 * @returns {Promise<DataSource>} 一旦数据源被添加到集合中就解析的 Promise。
 */
DataSourceCollection.prototype.add = function (dataSource) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(dataSource)) {
    throw new DeveloperError("dataSource is required.");
  }
  //>>includeEnd('debug');

  const that = this;
  const dataSources = this._dataSources;
  return Promise.resolve(dataSource).then(function (value) {
    //Only add the data source if removeAll has not been called
    //Since it was added.
    if (dataSources === that._dataSources) {
      that._dataSources.push(value);
      that._dataSourceAdded.raiseEvent(that, value);
    }
    return value;
  });
};

/**
 * 如果数据源存在于集合中，则从集合中移除它。
 *
 * @param {DataSource} dataSource 要移除的数据源。
 * @param {boolean} [destroy=false] 除移除外是否还要销毁数据源。
 * @returns {boolean} 如果数据源在集合中并被移除则返回 true，
 *                    如果数据源不在集合中则返回 false。
 */
DataSourceCollection.prototype.remove = function (dataSource, destroy) {
  destroy = destroy ?? false;

  const index = this._dataSources.indexOf(dataSource);
  if (index !== -1) {
    this._dataSources.splice(index, 1);
    this._dataSourceRemoved.raiseEvent(this, dataSource);

    if (destroy && typeof dataSource.destroy === "function") {
      dataSource.destroy();
    }

    return true;
  }

  return false;
};

/**
 * 从此集合中移除所有数据源。
 *
 * @param {boolean} [destroy=false] 除移除外是否还要销毁数据源。
 */
DataSourceCollection.prototype.removeAll = function (destroy) {
  destroy = destroy ?? false;

  const dataSources = this._dataSources;
  for (let i = 0, len = dataSources.length; i < len; ++i) {
    const dataSource = dataSources[i];
    this._dataSourceRemoved.raiseEvent(this, dataSource);

    if (destroy && typeof dataSource.destroy === "function") {
      dataSource.destroy();
    }
  }
  this._dataSources = [];
};

/**
 * 检查集合是否包含给定的数据源。
 *
 * @param {DataSource} dataSource 要检查的数据源。
 * @returns {boolean} 如果集合包含该数据源则返回 true，否则返回 false。
 */
DataSourceCollection.prototype.contains = function (dataSource) {
  return this.indexOf(dataSource) !== -1;
};

/**
 * 确定给定数据源在集合中的索引。
 *
 * @param {DataSource} dataSource 要查找索引的数据源。
 * @returns {number} 数据源在集合中的索引，如果数据源不存在于集合中则返回 -1。
 */
DataSourceCollection.prototype.indexOf = function (dataSource) {
  return this._dataSources.indexOf(dataSource);
};

/**
 * 通过索引从集合中获取数据源。
 *
 * @param {number} index 要检索的索引。
 * @returns {DataSource} 指定索引处的数据源。
 */
DataSourceCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._dataSources[index];
};

/**
 * 通过名称从集合中获取数据源。
 *
 * @param {string} name 要检索的名称。
 * @returns {DataSource[]} 所有匹配提供名称的数据源列表。
 */
DataSourceCollection.prototype.getByName = function (name) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(name)) {
    throw new DeveloperError("name is required.");
  }
  //>>includeEnd('debug');

  return this._dataSources.filter(function (dataSource) {
    return dataSource.name === name;
  });
};

function getIndex(dataSources, dataSource) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(dataSource)) {
    throw new DeveloperError("dataSource is required.");
  }
  //>>includeEnd('debug');

  const index = dataSources.indexOf(dataSource);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("dataSource is not in this collection.");
  }
  //>>includeEnd('debug');

  return index;
}

function swapDataSources(collection, i, j) {
  const arr = collection._dataSources;
  const length = arr.length - 1;
  i = CesiumMath.clamp(i, 0, length);
  j = CesiumMath.clamp(j, 0, length);

  if (i === j) {
    return;
  }

  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;

  collection.dataSourceMoved.raiseEvent(temp, j, i);
}

/**
 * Raises a data source up one position in the collection.
 *
 * @param {DataSource} dataSource The data source to move.
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.raise = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index + 1);
};

/**
 * Lowers a data source down one position in the collection.
 *
 * @param {DataSource} dataSource The data source to move.
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.lower = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index - 1);
};

/**
 * Raises a data source to the top of the collection.
 *
 * @param {DataSource} dataSource The data source to move.
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.raiseToTop = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  if (index === this._dataSources.length - 1) {
    return;
  }
  this._dataSources.splice(index, 1);
  this._dataSources.push(dataSource);

  this.dataSourceMoved.raiseEvent(
    dataSource,
    this._dataSources.length - 1,
    index,
  );
};

/**
 * Lowers a data source to the bottom of the collection.
 *
 * @param {DataSource} dataSource The data source to move.
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.lowerToBottom = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  if (index === 0) {
    return;
  }
  this._dataSources.splice(index, 1);
  this._dataSources.splice(0, 0, dataSource);

  this.dataSourceMoved.raiseEvent(dataSource, 0, index);
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {boolean} true if this object was destroyed; otherwise, false.
 *
 * @see DataSourceCollection#destroy
 */
DataSourceCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * Destroys the resources held by all data sources in this collection.  Explicitly destroying this
 * object allows for deterministic release of WebGL resources, instead of relying on the garbage
 * collector. Once this object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * dataSourceCollection = dataSourceCollection && dataSourceCollection.destroy();
 *
 * @see DataSourceCollection#isDestroyed
 */
DataSourceCollection.prototype.destroy = function () {
  this.removeAll(true);
  return destroyObject(this);
};
export default DataSourceCollection;
