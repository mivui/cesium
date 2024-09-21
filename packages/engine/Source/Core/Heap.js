import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 堆的数组实现。
 *
 * @alias Heap
 * @constructor
 * @private
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Heap.ComparatorCallback} options.comparator 用于堆的 comparator 。如果 comparator（a， b） 小于 0，则将 a 排序到比 b 更低的索引，否则排序到更高的索引。
 */
function Heap(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.defined("options.comparator", options.comparator);
  //>>includeEnd('debug');

  this._comparator = options.comparator;
  this._array = [];
  this._length = 0;
  this._maximumLength = undefined;
}

Object.defineProperties(Heap.prototype, {
  /**
   * 获取堆的长度。
   *
   * @memberof Heap.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._length;
    },
  },

  /**
   * 获取内部数组。
   *
   * @memberof Heap.prototype
   *
   * @type {Array}
   * @readonly
   */
  internalArray: {
    get: function () {
      return this._array;
    },
  },

  /**
   * 获取并设置堆的最大长度。
   *
   * @memberof Heap.prototype
   *
   * @type {number}
   */
  maximumLength: {
    get: function () {
      return this._maximumLength;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("maximumLength", value, 0);
      //>>includeEnd('debug');
      const originalLength = this._length;
      if (value < originalLength) {
        const array = this._array;
        // Remove trailing references
        for (let i = value; i < originalLength; ++i) {
          array[i] = undefined;
        }
        this._length = value;
        array.length = value;
      }
      this._maximumLength = value;
    },
  },

  /**
   * 用于堆的比较器。如果 comparator（a， b） 小于 0，则将 a 排序到比 b 更低的索引，否则排序到更高的索引。
   *
   * @memberof Heap.prototype
   *
   * @type {Heap.ComparatorCallback}
   */
  comparator: {
    get: function () {
      return this._comparator;
    },
  },
});

function swap(array, a, b) {
  const temp = array[a];
  array[a] = array[b];
  array[b] = temp;
}

/**
 * 调整堆的内部数组的大小。
 *
 * @param {number} [length] 将内部数组调整为的长度。默认为堆的当前长度。
 */
Heap.prototype.reserve = function (length) {
  length = defaultValue(length, this._length);
  this._array.length = length;
};

/**
 * 更新堆，以便 index 和所有后代都满足 heap 属性。
 *
 * @param {number} [index=0] 要从中堆化的起始索引。
 */
Heap.prototype.heapify = function (index) {
  index = defaultValue(index, 0);
  const length = this._length;
  const comparator = this._comparator;
  const array = this._array;
  let candidate = -1;
  let inserting = true;

  while (inserting) {
    const right = 2 * (index + 1);
    const left = right - 1;

    if (left < length && comparator(array[left], array[index]) < 0) {
      candidate = left;
    } else {
      candidate = index;
    }

    if (right < length && comparator(array[right], array[candidate]) < 0) {
      candidate = right;
    }
    if (candidate !== index) {
      swap(array, candidate, index);
      index = candidate;
    } else {
      inserting = false;
    }
  }
};

/**
 * Resort the heap.
 */
Heap.prototype.resort = function () {
  const length = this._length;
  for (let i = Math.ceil(length / 2); i >= 0; --i) {
    this.heapify(i);
  }
};

/**
 * 在堆中插入一个元素。如果 length 增长大于 maximumLength
 * 中，额外的元素将被删除。
 *
 * @param {*} element 要插入的元素
 *
 * @return {*} 如果堆已满，则从堆中删除的元素。
 */
Heap.prototype.insert = function (element) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("element", element);
  //>>includeEnd('debug');

  const array = this._array;
  const comparator = this._comparator;
  const maximumLength = this._maximumLength;

  let index = this._length++;
  if (index < array.length) {
    array[index] = element;
  } else {
    array.push(element);
  }

  while (index !== 0) {
    const parent = Math.floor((index - 1) / 2);
    if (comparator(array[index], array[parent]) < 0) {
      swap(array, index, parent);
      index = parent;
    } else {
      break;
    }
  }

  let removedElement;

  if (defined(maximumLength) && this._length > maximumLength) {
    removedElement = array[maximumLength];
    this._length = maximumLength;
  }

  return removedElement;
};

/**
 * 从堆中删除 index 指定的元素并返回它。
 *
 * @param {number} [index=0] 要删除的索引。
 * @returns {*} 堆的指定元素。
 */
Heap.prototype.pop = function (index) {
  index = defaultValue(index, 0);
  if (this._length === 0) {
    return undefined;
  }
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.lessThan("index", index, this._length);
  //>>includeEnd('debug');

  const array = this._array;
  const root = array[index];
  swap(array, index, --this._length);
  this.heapify(index);
  array[this._length] = undefined; // Remove trailing reference
  return root;
};

/**
 * 用于堆的比较器。
 * @callback Heap.ComparatorCallback
 * @param {*} a 堆中的元素。
 * @param {*} b 堆中的一个元素。
 * @returns {number} 如果比较结果小于 0，则将 a 排序到比 b 低的索引，否则排序到更高的索引。
 */
export default Heap;
