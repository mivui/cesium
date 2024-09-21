import Check from "./Check.js";

/**
 * 在已排序的数组中查找项。
 *
 * @function
 * @param {Array} array 要搜索的排序数组。
 * @param {*} itemToFind 要在数组中查找的项。
 * @param {binarySearchComparator} comparator 用于比较项的函数
 *        数组中的元素。
 * @returns {number} <code>itemToFind</code>在数组中的索引(如果存在)。如果<code>itemToFind</code>
 * 不存在，返回值是一个负数，是位补码(~)
 * 在索引之前插入itemToFind以维护索引的
 * 数组的排序顺序。
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
 * 在执行二分查找时比较两个项的函数。
 * @callback binarySearchComparator
 *
 * @param {*} a 数组中的一项。
 * @param {*} b 正在搜索的项目。
 * @returns {number} 如果<code>a</code>小于<code>b</code>，则返回负值;
 * 如果<code>a</code>大于<code>b</code>，则为正数
 * 当<code>a</code>等于<code>b</code>时为0。
 *
 * @example
 * function compareNumbers(a, b) {
 *     return a - b;
 * }
 */
export default binarySearch;
