import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";

/**
 * {@link DataSource} 实例的集合。
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
   * 获取此集合中的数据源数。
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
   * 将数据源添加到集合时引发的事件。
   * 事件处理程序将传递已添加的数据源。
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
   * 从集合中删除数据源时引发的事件。
   * 事件处理程序将传递已删除的数据源。
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
   * 数据源在集合中的位置发生更改时引发的事件。 事件处理程序将数据源传递给
   * 已移动，移动后的新索引，以及移动前的旧索引。
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
 * @param {DataSource|Promise<DataSource>} dataSource 数据源或对要添加到集合的数据源的承诺。
 * 传递 Promise 时，实际上不会添加数据源
 * 添加到集合中，直到 Promise 成功解析。
 * @returns {Promise<DataSource>} 在将数据源添加到集合后解析的 Promise。
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
 * 从此集合中删除数据源（如果存在）。
 *
 * @param {DataSource} dataSource 要删除的数据源。
 * @param {boolean} [destroy=false] 是否除了删除数据源之外还要销毁数据源。
 * @returns {boolean} true，如果数据源位于集合中并被删除，
 * 如果数据源不在集合中，则为 false。
 */
DataSourceCollection.prototype.remove = function (dataSource, destroy) {
  destroy = defaultValue(destroy, false);

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
 * 从此集合中删除所有数据源。
 *
 * @param {boolean} [destroy=false] 是否除了删除数据源之外还要销毁数据源。
 */
DataSourceCollection.prototype.removeAll = function (destroy) {
  destroy = defaultValue(destroy, false);

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
 * 检查集合是否包含给定数据源。
 *
 * @param {DataSource} dataSource 要检查的数据源。
 * 如果集合包含数据源，则@returns {boolean} true，否则为 false。
 */
DataSourceCollection.prototype.contains = function (dataSource) {
  return this.indexOf(dataSource) !== -1;
};

/**
 * 确定集合中给定数据源的索引。
 *
 * @param {DataSource} dataSource 要查找其索引的数据源。
 * @returns {number} 集合中数据源的索引，如果集合中不存在数据源，则为 -1。
 */
DataSourceCollection.prototype.indexOf = function (dataSource) {
  return this._dataSources.indexOf(dataSource);
};

/**
 * 按索引从集合中获取数据源。
 *
 * @param {number} index 要检索的索引。
 * @returns {DataSource} 位于指定索引的数据源。
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
 * 按名称从集合中获取数据源。
 *
 * @param {string} name 要检索的名称。
 * @returns {DataSource[]} 与提供的名称匹配的所有数据源的列表。
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
 * 将数据源在集合中提升一个位置。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.raise = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index + 1);
};

/**
 * 将数据源在集合中降低一个位置。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} dataSource is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DataSourceCollection.prototype.lower = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index - 1);
};

/**
 * 将数据源提升到集合的顶部。
 *
 * @param {DataSource} dataSource 要移动的数据源。
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
    index
  );
};

/**
 * 将数据源降低到集合的底部。
 *
 * @param {DataSource} dataSource 要移动的数据源。
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
 * 如果此对象已销毁，则返回 true;否则为 false。
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} true if this object was destroyed; otherwise, false.
 *
 * @see DataSourceCollection#destroy
 */
DataSourceCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中所有数据源所持有的资源。 显式销毁此
 * 对象允许确定性地释放 WebGL 资源，而不是依赖垃圾
 *收藏家。一旦此对象被销毁，就不应使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
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
