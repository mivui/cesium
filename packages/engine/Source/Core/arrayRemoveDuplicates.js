import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import CesiumMath from "./Math.js";

const removeDuplicatesEpsilon = CesiumMath.EPSILON10;

/**
 * 移除值数组中相邻的重复值。
 *
 * @param {any[]} [values] 值的数组。
 * @param {Function} equalsEpsilon 函数来比较值。布尔值 equalsEpsilon(left, right, epsilon)
 * @param {boolean} [wrapAround=false] 将数组中的最后一个值与第一个值进行比较。如果它们相等，则删除最后一个值。
 * @param {number[]} [removedIndices=undefined] 存储与从数组中删除的重复项对应的索引(如果有的话)。
 * @returns {any[]|undefined} 没有相邻重复值的新值数组，如果没有发现重复值，则返回输入数组。
 *
 * @example
 * // Returns [(1.0, 1.0, 1.0), (2.0, 2.0, 2.0), (3.0, 3.0, 3.0), (1.0, 1.0, 1.0)]
 * const values = [
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(2.0, 2.0, 2.0),
 *     new Cesium.Cartesian3(3.0, 3.0, 3.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0)];
 * const nonDuplicatevalues = Cesium.PolylinePipeline.removeDuplicates(values, Cartesian3.equalsEpsilon);
 *
 * @example
 * // Returns [(1.0, 1.0, 1.0), (2.0, 2.0, 2.0), (3.0, 3.0, 3.0)]
 * const values = [
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(2.0, 2.0, 2.0),
 *     new Cesium.Cartesian3(3.0, 3.0, 3.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0)];
 * const nonDuplicatevalues = Cesium.PolylinePipeline.removeDuplicates(values, Cartesian3.equalsEpsilon, true);
 *
 * @example
 * // Returns [(1.0, 1.0, 1.0), (2.0, 2.0, 2.0), (3.0, 3.0, 3.0)]
 * // removedIndices will be equal to [1, 3, 5]
 * const values = [
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0),
 *     new Cesium.Cartesian3(2.0, 2.0, 2.0),
 *     new Cesium.Cartesian3(2.0, 2.0, 2.0),
 *     new Cesium.Cartesian3(3.0, 3.0, 3.0),
 *     new Cesium.Cartesian3(1.0, 1.0, 1.0)];
 * const nonDuplicatevalues = Cesium.PolylinePipeline.removeDuplicates(values, Cartesian3.equalsEpsilon, true);
 * @private
 */
function arrayRemoveDuplicates(
  values,
  equalsEpsilon,
  wrapAround,
  removedIndices,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("equalsEpsilon", equalsEpsilon);
  //>>includeEnd('debug');

  if (!defined(values)) {
    return undefined;
  }

  wrapAround = defaultValue(wrapAround, false);
  const storeRemovedIndices = defined(removedIndices);

  const length = values.length;
  if (length < 2) {
    return values;
  }

  let i;
  let v0 = values[0];
  let v1;

  // We only want to create a new array if there are duplicates in the array.
  // As such, cleanedValues is undefined until it encounters the first duplicate, if it exists.
  let cleanedValues;
  let lastCleanIndex = 0;

  // removedIndexLCI keeps track of where lastCleanIndex would be if it were sorted into the removedIndices array.
  // In case of arrays such as [A, B, C, ..., A, A, A], removedIndices will not be sorted properly without this.
  let removedIndexLCI = -1;

  for (i = 1; i < length; ++i) {
    v1 = values[i];
    if (equalsEpsilon(v0, v1, removeDuplicatesEpsilon)) {
      if (!defined(cleanedValues)) {
        cleanedValues = values.slice(0, i);
        lastCleanIndex = i - 1;
        removedIndexLCI = 0;
      }
      if (storeRemovedIndices) {
        removedIndices.push(i);
      }
    } else {
      if (defined(cleanedValues)) {
        cleanedValues.push(v1);
        lastCleanIndex = i;
        if (storeRemovedIndices) {
          removedIndexLCI = removedIndices.length;
        }
      }
      v0 = v1;
    }
  }

  if (
    wrapAround &&
    equalsEpsilon(values[0], values[length - 1], removeDuplicatesEpsilon)
  ) {
    if (storeRemovedIndices) {
      if (defined(cleanedValues)) {
        removedIndices.splice(removedIndexLCI, 0, lastCleanIndex);
      } else {
        removedIndices.push(length - 1);
      }
    }

    if (defined(cleanedValues)) {
      cleanedValues.length -= 1;
    } else {
      cleanedValues = values.slice(0, -1);
    }
  }

  return defined(cleanedValues) ? cleanedValues : values;
}

export default arrayRemoveDuplicates;
