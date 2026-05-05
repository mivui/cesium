import Check from "./Check.js";

/**
 * 在已排序的数组中查找项目。
 *
 * @function
 * @param {Array|Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} array 要搜索的已排序数组。
 * @param {*} itemToFind 要在数组中查找的项目。
 * @param {binarySearchComparator} comparator 用于将项目与数组中的元素进行比较的函数。
 * @returns {number} 如果项目存在，则返回其在数组中的索引。如果项目不存在，则返回值为负数，该负数是项目应插入位置之前索引的按位补码（~），
 *          以保持数组的排序顺序。
 *
 * @example
 * // Create a comparator function to search through an array of numbers.
 * function comparator(a, b) {
 *     return a - b;
 * };
 * const numbers = [0, 2, 4, 6, 8];
 * const index = Cesium.binarySearch(numbers, 6, comparator); // 3
 */
function binarySearch(array, itemToFind, comparator) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.defined("itemToFind", itemToFind);
  Check.defined("comparator", comparator);
  //>>includeEnd('debug');

  let low = 0;
  let high = array.length - 1;
  let i;
  let comparison;

  while (low <= high) {
    i = ~~((low + high) / 2);
    comparison = comparator(array[i], itemToFind);
    if (comparison < 0) {
      low = i + 1;
      continue;
    }
    if (comparison > 0) {
      high = i - 1;
      continue;
    }
    return i;
  }
  return ~(high + 1);
}

/**
 * 执行二分搜索时用于比较两个项目的函数。
 * @callback binarySearchComparator
 *
 * @param {*} a 数组中的一个项目。
 * @param {*} b 正在搜索的项目。
 * @returns {number} 如果 <code>a</code> 小于 <code>b</code> 则返回负值，
 *          如果 <code>a</code> 大于 <code>b</code> 则返回正值，
 *          如果 <code>a</code> 等于 <code>b</code> 则返回 0。
 *
 * @example
 * function compareNumbers(a, b) {
 *     return a - b;
 * }
 */
export default binarySearch;
