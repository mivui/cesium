// @ts-check

import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个键值对集合，存储为哈希表以便快速查找，
 * 同时提供数组以支持快速迭代。
 *
 * @template T = unknown
 */
class AssociativeArray {
  constructor() {
    /**
     * @type {T[]}
     * @private
     */
    this._array = [];
    /**
     * @type {Object<string|number, T>}
     * @private
     */
    this._hash = {};
  }

  /**
   * 获取集合中的项目数量。
   *
   * @type {number}
   */
  get length() {
    return this._array.length;
  }

  /**
   * 获取集合中所有值的无序数组。
   * 这是一个实时数组，会自动反映集合中的值，
   * 不应直接修改。
   *
   * @type {Array<T>}
   */
  get values() {
    return this._array;
  }

  /**
   * 从集合中移除键值对。
   *
   * @param {string|number} key 要移除的键。
   * @returns {boolean} 如果已移除则返回true，如果键不在集合中则返回false。
   */
  contains(key) {
    //>>includeStart('debug', pragmas.debug);
    if (typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');
    return defined(this._hash[key]);
  }

  /**
   * 将提供的键与提供的值关联。如果键已存在，
   * 则使用新值覆盖。
   *
   * @param {string|number} key 唯一标识符。
   * @param {T} value 要与提供的键关联的值。
   */
  set(key, value) {
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
  }

  /**
   * 检索与提供的键关联的值。
   *
   * @param {string|number} key 要检索其值的键。
   * @returns {T} 关联的值；如果键不存在于集合中则返回undefined。
   */
  get(key) {
    //>>includeStart('debug', pragmas.debug);
    if (typeof key !== "string" && typeof key !== "number") {
      throw new DeveloperError("key is required to be a string or number.");
    }
    //>>includeEnd('debug');
    return this._hash[key];
  }

  /**
   * 确定提供的键是否存在于数组中。
   *
   * @param {string|number} key 要检查的键。
   * @returns {boolean} 如果键存在于数组中则返回<code>true</code>，否则返回<code>false</code>。
   */
  remove(key) {
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
  }

  /**
   * 清空集合。
   */
  removeAll() {
    const array = this._array;
    if (array.length > 0) {
      this._hash = {};
      array.length = 0;
    }
  }
}

export default AssociativeArray;
