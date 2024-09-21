import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 键值对的集合，以散列形式存储
 * 查找，但也提供了一个数组快速迭代。
 * @alias AssociativeArray
 * @constructor
 */
function AssociativeArray() {
  this._array = [];
  this._hash = {};
}

Object.defineProperties(AssociativeArray.prototype, {
  /**
   * 获取集合中的项数。
   * @memberof AssociativeArray.prototype
   *
   * @type {number}
   */
  length: {
    get: function () {
      return this._array.length;
    },
  },
  /**
   * 获取集合中所有值的无序数组。
   * 这是一个动态数组，将自动反映集合中的值，
   * 不应直接修改。
   * @memberof AssociativeArray.prototype
   *
   * @type {Array}
   */
  values: {
    get: function () {
      return this._array;
    },
  },
});

/**
 * 确定所提供的键是否在数组中。
 *
 * @param {string|number} key 检查的钥匙。
 * @returns {boolean} 如果键在数组中，则<code>为true</code>，否则为false</code>。
 */
AssociativeArray.prototype.contains = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');
  return defined(this._hash[key]);
};

/**
 * 将提供的键与提供的值关联。如果钥匙已经了
 * 存在,它是用新值覆盖的。
 *
 * @param {string|number} key 唯一标识符。
 * @param {*} value 要与所提供的键关联的值。
 */
AssociativeArray.prototype.set = function (key, value) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');

  const oldValue = this._hash[key];
  if (value !== oldValue) {
    this.remove(key);
    this._hash[key] = value;
    this._array.push(value);
  }
};

/**
 * 检索与提供的键相关联的值。
 *
 * @param {string|number} key 要检索其值的键。
 * @returns {*} 关联值，如果键不存在于集合中，则未定义。
 */
AssociativeArray.prototype.get = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');
  return this._hash[key];
};

/**
 * 从集合中删除键值对。
 *
 * @param {string|number} key 删除的key。
 * @returns {boolean} 如果该键被删除，则为True;如果该键不在集合中，则为false。
 */
AssociativeArray.prototype.remove = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (defined(key) && typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');

  const value = this._hash[key];
  const hasValue = defined(value);
  if (hasValue) {
    const array = this._array;
    array.splice(array.indexOf(value), 1);
    delete this._hash[key];
  }
  return hasValue;
};

/**
 * 清除集合。
 */
AssociativeArray.prototype.removeAll = function () {
  const array = this._array;
  if (array.length > 0) {
    this._hash = {};
    array.length = 0;
  }
};
export default AssociativeArray;
