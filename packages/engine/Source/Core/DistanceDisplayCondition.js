import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 根据到摄像机的距离确定能见度。
 *
 * @alias DistanceDisplayCondition
 * @constructor
 *
 * @param {number} [near=0.0] 对象可见的间隔中的最小距离。
 * @param {number} [far=Number.MAX_VALUE] 对象可见的间隔中的最大距离。
 *
 * @example
 * // Make a billboard that is only visible when the distance to the camera is between 10 and 20 meters.
 * billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 20.0);
 */
function DistanceDisplayCondition(near, far) {
  near = defaultValue(near, 0.0);
  this._near = near;

  far = defaultValue(far, Number.MAX_VALUE);
  this._far = far;
}

Object.defineProperties(DistanceDisplayCondition.prototype, {
  /**
   * 对象可见的间隔中的最小距离。
   * @memberof DistanceDisplayCondition.prototype
   * @type {number}
   * @default 0.0
   */
  near: {
    get: function () {
      return this._near;
    },
    set: function (value) {
      this._near = value;
    },
  },
  /**
   * 对象可见的间隔中的最大距离。
   * @memberof DistanceDisplayCondition.prototype
   * @type {number}
   * @default Number.MAX_VALUE
   */
  far: {
    get: function () {
      return this._far;
    },
    set: function (value) {
      this._far = value;
    },
  },
});

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
DistanceDisplayCondition.packedLength = 2;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {DistanceDisplayCondition} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
DistanceDisplayCondition.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.near;
  array[startingIndex] = value.far;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {DistanceDisplayCondition} [result] 要在其中存储结果的对象。
 * @returns {DistanceDisplayCondition} 修改后的结果参数或新的 DistanceDisplayCondition 实例（如果未提供）。
 */
DistanceDisplayCondition.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new DistanceDisplayCondition();
  }
  result.near = array[startingIndex++];
  result.far = array[startingIndex];
  return result;
};

/**
 * 确定两个距离显示条件是否相等。
 *
 * @param {DistanceDisplayCondition} left 距离显示条件。
 * @param {DistanceDisplayCondition} right 另一个距离显示条件。
 * @return {boolean} 两个距离显示条件是否相等。
 */
DistanceDisplayCondition.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.near === right.near &&
      left.far === right.far)
  );
};

/**
 * 复制距离显示条件实例。
 *
 * @param {DistanceDisplayCondition} [value] 要复制的距离显示条件。
 * @param {DistanceDisplayCondition} [result] 存储结果的结果。
 * @return {DistanceDisplayCondition} 复制的实例。
 */
DistanceDisplayCondition.clone = function (value, result) {
  if (!defined(value)) {
    return undefined;
  }

  if (!defined(result)) {
    result = new DistanceDisplayCondition();
  }

  result.near = value.near;
  result.far = value.far;
  return result;
};

/**
 * 复制实例。
 *
 * @param {DistanceDisplayCondition} [result] 存储结果的结果。
 * @return {DistanceDisplayCondition} 复制的实例。
 */
DistanceDisplayCondition.prototype.clone = function (result) {
  return DistanceDisplayCondition.clone(this, result);
};

/**
 * 确定此距离显示条件是否等于另一个距离显示条件。
 *
 * @param {DistanceDisplayCondition} 其他 另一个距离显示条件。
 * @return {boolean} 此距离显示条件是否等于另一个。
 */
DistanceDisplayCondition.prototype.equals = function (other) {
  return DistanceDisplayCondition.equals(this, other);
};
export default DistanceDisplayCondition;
