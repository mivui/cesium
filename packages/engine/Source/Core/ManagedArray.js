import Check from "./Check.js";
import defaultValue from "./defaultValue.js";

/**
 * 数组的包装器，以便可以手动管理数组的内部长度。
 *
 * @alias ManagedArray
 * @constructor
 * @private
 *
 * @param {number} [length=0] 数组的初始长度。
 */
function ManagedArray(length) {
  length = defaultValue(length, 0);
  this._array = new Array(length);
  this._length = length;
}

Object.defineProperties(ManagedArray.prototype, {
  /**
   * 获取或设置数组的长度。
   * 如果设置的长度大于内部数组的长度，则调整内部数组的大小。
   *
   * @memberof ManagedArray.prototype
   * @type {number}
   */
  length: {
    get: function () {
      return this._length;
    },
    set: function (length) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("length", length, 0);
      //>>includeEnd('debug');
      const array = this._array;
      const originalLength = this._length;
      if (length < originalLength) {
        // Remove trailing references
        for (let i = length; i < originalLength; ++i) {
          array[i] = undefined;
        }
      } else if (length > array.length) {
        array.length = length;
      }
      this._length = length;
    },
  },

  /**
   * 获取内部数组。
   *
   * @memberof ManagedArray.prototype
   * @type {Array}
   * @readonly
   */
  values: {
    get: function () {
      return this._array;
    },
  },
});

/**
 * 获取索引处的元素。
 *
 * @param {number} index 要获取的索引。
 */
ManagedArray.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.lessThan("index", index, this._array.length);
  //>>includeEnd('debug');

  return this._array[index];
};

/**
 * 将元素设置为索引。如果 index 大于数组的长度，则调整数组的大小。
 *
 * @param {number} index 要设置的索引。
 * @param {*} element 要在索引处设置的元素。
 */
ManagedArray.prototype.set = function (index, element) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  if (index >= this._length) {
    this.length = index + 1;
  }
  this._array[index] = element;
};

/**
 * 返回数组中的最后一个元素，而不修改数组。
 *
 * @returns {*} 数组中的最后一个元素。
 */
ManagedArray.prototype.peek = function () {
  return this._array[this._length - 1];
};

/**
 * 将元素推送到数组中。
 *
 * @param {*} element 要推送的元素。
 */
ManagedArray.prototype.push = function (element) {
  const index = this.length++;
  this._array[index] = element;
};

/**
 * 从数组中弹出一个元素。
 *
 * @returns {*} 数组中的最后一个元素。
 */
ManagedArray.prototype.pop = function () {
  if (this._length === 0) {
    return undefined;
  }
  const element = this._array[this._length - 1];
  --this.length;
  return element;
};

/**
 * 如果 length > _array.length，则调整内部数组的大小。
 *
 * @param {number} length 长度。
 */
ManagedArray.prototype.reserve = function (length) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("length", length, 0);
  //>>includeEnd('debug');

  if (length > this._array.length) {
    this._array.length = length;
  }
};

/**
 * 调整数组大小。
 *
 * @param {number} length 长度。
 */
ManagedArray.prototype.resize = function (length) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("length", length, 0);
  //>>includeEnd('debug');

  this.length = length;
};

/**
 * 将内部数组修剪到指定的长度。默认为当前长度。
 *
 * @param {number} [length] 长度。
 */
ManagedArray.prototype.trim = function (length) {
  length = defaultValue(length, this._length);
  this._array.length = length;
};
export default ManagedArray;
