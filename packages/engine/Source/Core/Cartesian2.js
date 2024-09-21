import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 一个二维笛卡尔点。
 * @alias Cartesian2
 * @constructor
 *
 * @param {number} [x=0.0] X分量。
 * @param {number} [y=0.0] Y分量。
 *
 * @see Cartesian3
 * @see Cartesian4
 * @see Packable
 */
function Cartesian2(x, y) {
  /**
   * X分量。
   * @type {number}
   * @default 0.0
   */
  this.x = defaultValue(x, 0.0);

  /**
   * Y分量。
   * @type {number}
   * @default 0.0
   */
  this.y = defaultValue(y, 0.0);
}

/**
 * 从x和y坐标创建一个笛卡尔实例。
 *
 * @param {number} x x坐标。
 * @param {number} y y坐标。
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 */
Cartesian2.fromElements = function (x, y, result) {
  if (!defined(result)) {
    return new Cartesian2(x, y);
  }

  result.x = x;
  result.y = y;
  return result;
};

/**
 * 复制Cartesian2 instance.
 *
 * @param {Cartesian2} cartesian 复制的笛卡尔坐标。
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。 (如果cartesian未定义则返回未定义)
 */
Cartesian2.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian2(cartesian.x, cartesian.y);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  return result;
};

/**
 * 从现有的Cartesian3创建Cartesian2实例。这只需要
 * Cartesian3的x和y的性质。
 * @function
 *
 * @param {Cartesian3} cartesian 创建Cartesian2实例的Cartesian3实例。
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 */
Cartesian2.fromCartesian3 = Cartesian2.clone;

/**
 * 从现有的Cartesian4创建Cartesian2实例。这只需要
 * Cartesian4坐标系的x和y的属性。
 * @function
 *
 * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian2 instance from.
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 */
Cartesian2.fromCartesian4 = Cartesian2.clone;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Cartesian2.packedLength = 2;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Cartesian2} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Cartesian2.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.x;
  array[startingIndex] = value.y;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Cartesian2} [result] 要在其中存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 */
Cartesian2.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Cartesian2();
  }
  result.x = array[startingIndex++];
  result.y = array[startingIndex];
  return result;
};

/**
 * 将Cartesian2的数组平展为一个分量数组。
 *
 * @param {Cartesian2[]} array 要打包的笛卡儿数组。
 * @param {number[]} [result] 要在其中存储结果的数组。如果这是一个类型化数组，它必须有array.length * 2个组件，否则将抛出 {@link DeveloperError} 。如果它是一个常规数组，它的大小将被调整为(array.length * 2)元素。
 * @returns {number[]} 打包数组。
 */
Cartesian2.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 2;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 2 elements"
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Cartesian2.pack(array[i], result, i * 2);
  }
  return result;
};

/**
 * 将笛卡尔分量的数组解包为笛卡尔分量的数组。
 *
 * @param {number[]} array 要解包的组件数组。
 * @param {Cartesian2[]} [result] 要在其中存储结果的数组。
 * @returns {Cartesian2[]} 未打包的数组。
 */
Cartesian2.unpackArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 2);
  if (array.length % 2 !== 0) {
    throw new DeveloperError("array length must be a multiple of 2.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  if (!defined(result)) {
    result = new Array(length / 2);
  } else {
    result.length = length / 2;
  }

  for (let i = 0; i < length; i += 2) {
    const index = i / 2;
    result[index] = Cartesian2.unpack(array, i, result[index]);
  }
  return result;
};

/**
 * 从数组中两个连续的元素创建一个Cartesian2。
 * @function
 *
 * @param {number[]} array 数组，其两个连续的元素分别对应x和y分量。
 * @param {number} [startingIndex=0] 第一个元素在数组中的偏移量，对应于x分量。
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 *
 * @example
 * // Create a Cartesian2 with (1.0, 2.0)
 * const v = [1.0, 2.0];
 * const p = Cesium.Cartesian2.fromArray(v);
 *
 * // Create a Cartesian2 with (1.0, 2.0) using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 2.0];
 * const p2 = Cesium.Cartesian2.fromArray(v2, 2);
 */
Cartesian2.fromArray = Cartesian2.unpack;

/**
 * 计算所提供的笛卡尔坐标的最大分量的值。
 *
 * @param {Cartesian2} cartesian 用笛卡尔坐标。
 * @returns {number} 最大分量的值。
 */
Cartesian2.maximumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.max(cartesian.x, cartesian.y);
};

/**
 * 为所提供的笛卡尔坐标计算最小分量的值。
 *
 * @param {Cartesian2} cartesian 用笛卡尔坐标。
 * @returns {number} 最小分量的值。
 */
Cartesian2.minimumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.min(cartesian.x, cartesian.y);
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最小分量的笛卡尔坐标。
 *
 * @param {Cartesian2} first 用笛卡尔坐标来比较。
 * @param {Cartesian2} second 用笛卡尔坐标来比较。
 * @param {Cartesian2} result 要在其中存储结果的对象。
 * @returns {Cartesian2} 具有最小分量的笛卡尔曲线。
 */
Cartesian2.minimumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.min(first.x, second.x);
  result.y = Math.min(first.y, second.y);

  return result;
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最大分量的笛卡尔坐标。
 *
 * @param {Cartesian2} first 用笛卡尔坐标来比较。
 * @param {Cartesian2} second 用笛卡尔坐标来比较。
 * @param {Cartesian2} result 要在其中存储结果的对象。
 * @returns {Cartesian2} A cartesian with the maximum components.
 */
Cartesian2.maximumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.max(first.x, second.x);
  result.y = Math.max(first.y, second.y);
  return result;
};

/**
 * 将一个值约束在两个值之间。
 *
 * @param {Cartesian2} value 夹位的值。
 * @param {Cartesian2} min 最小值。
 * @param {Cartesian2} max 最大值。
 * @param {Cartesian2} result 要在其中存储结果的对象。
 * @returns {Cartesian2} 使min <= result <= max的固定值。
 */
Cartesian2.clamp = function (value, min, max, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.typeOf.object("min", min);
  Check.typeOf.object("max", max);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = CesiumMath.clamp(value.x, min.x, max.x);
  const y = CesiumMath.clamp(value.y, min.y, max.y);

  result.x = x;
  result.y = y;

  return result;
};

/**
 * 计算给定的笛卡尔坐标的平方幅度。
 *
 * @param {Cartesian2} cartesian 要计算其模的平方的笛卡尔实例。
 * @returns {number} 大小的平方。
 */
Cartesian2.magnitudeSquared = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
};

/**
 * 计算笛卡尔的大小(长度)。
 *
 * @param {Cartesian2} cartesian 要计算其大小的笛卡尔实例。
 * @returns {number} 的大小。
 */
Cartesian2.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
};

const distanceScratch = new Cartesian2();

/**
 * 计算两点之间的距离。
 *
 * @param {Cartesian2} left 第一个计算距离的点。
 * @param {Cartesian2} right 计算距离的第二个点。
 * @returns {number} 两点之间的距离
 *
 * @example
 * // Returns 1.0
 * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(2.0, 0.0));
 */
Cartesian2.distance = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.subtract(left, right, distanceScratch);
  return Cartesian2.magnitude(distanceScratch);
};

/**
 * 计算两点之间距离的平方。比较平方距离
 * 使用此函数比使用 {@link Cartesian2#distance}.
 *
 * @param {Cartesian2} left 第一个计算距离的点。
 * @param {Cartesian2} right 计算距离的第二个点。
 * @returns {number} 两点之间的距离
 *
 * @example
 * // Returns 4.0, not 2.0
 * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(3.0, 0.0));
 */
Cartesian2.distanceSquared = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.subtract(left, right, distanceScratch);
  return Cartesian2.magnitudeSquared(distanceScratch);
};

/**
 * 计算提供的笛卡尔坐标的规范化形式。
 *
 * @param {Cartesian2} cartesian 笛卡尔坐标被归一化。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.normalize = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const magnitude = Cartesian2.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;

  //>>includeStart('debug', pragmas.debug);
  if (isNaN(result.x) || isNaN(result.y)) {
    throw new DeveloperError("normalized result is not a number");
  }
  //>>includeEnd('debug');

  return result;
};

/**
 * 计算两个笛卡尔坐标的点(标量)积。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @returns {number} 点积。
 */
Cartesian2.dot = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return left.x * right.x + left.y * right.y;
};

/**
 * 计算将输入向量的Z坐标隐式设置为0所产生的外积的大小
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @returns {number} 叉乘
 */
Cartesian2.cross = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return left.x * right.y - left.y * right.x;
};

/**
 * 计算两个笛卡尔坐标的分量积。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.multiplyComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x * right.x;
  result.y = left.y * right.y;
  return result;
};

/**
 * 计算两个笛卡尔的分量商。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.divideComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x / right.x;
  result.y = left.y / right.y;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量和。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.add = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x + right.x;
  result.y = left.y + right.y;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量差。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.subtract = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x - right.x;
  result.y = left.y - right.y;
  return result;
};

/**
 * 将所提供的笛卡尔分量与所提供的标量相乘。
 *
 * @param {Cartesian2} cartesian 要缩放的笛卡尔坐标。
 * @param {number} scalar 与之相乘的标量。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.multiplyByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  return result;
};

/**
 * 将给定的笛卡尔分量除以给定的标量。
 *
 * @param {Cartesian2} cartesian 要划分的笛卡尔坐标。
 * @param {number} scalar 要除以的标量。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.divideByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  return result;
};

/**
 * 否定提供的笛卡尔坐标。
 *
 * @param {Cartesian2} cartesian 笛卡尔坐标被否定了。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.negate = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -cartesian.x;
  result.y = -cartesian.y;
  return result;
};

/**
 * 计算所提供的笛卡尔坐标的绝对值。
 *
 * @param {Cartesian2} cartesian 要计算其绝对值的笛卡尔坐标系。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.abs = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.abs(cartesian.x);
  result.y = Math.abs(cartesian.y);
  return result;
};

const lerpScratch = new Cartesian2();
/**
 * 使用提供的笛卡儿计算t处的线性插值或外推。
 *
 * @param {Cartesian2} start 对应于t在0.0处的值。
 * @param {Cartesian2} end 对应于1.0时t的值。
 * @param {number} t 沿着t进行插值的点。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数。
 */
Cartesian2.lerp = function (start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  Cartesian2.multiplyByScalar(end, t, lerpScratch);
  result = Cartesian2.multiplyByScalar(start, 1.0 - t, result);
  return Cartesian2.add(lerpScratch, result, result);
};

const angleBetweenScratch = new Cartesian2();
const angleBetweenScratch2 = new Cartesian2();
/**
 * 返回所提供的笛卡尔之间的角度，以弧度为单位。
 *
 * @param {Cartesian2} left 第一个笛卡尔坐标系。
 * @param {Cartesian2} right 第二个笛卡尔坐标系。
 * @returns {number} 笛卡尔角之间的夹角。
 */
Cartesian2.angleBetween = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.normalize(left, angleBetweenScratch);
  Cartesian2.normalize(right, angleBetweenScratch2);
  return CesiumMath.acosClamped(
    Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2)
  );
};

const mostOrthogonalAxisScratch = new Cartesian2();
/**
 * 返回与所提供的笛卡尔坐标最正交的轴。
 *
 * @param {Cartesian2} cartesian 在笛卡尔坐标系上找到最正交的轴。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 最正交的轴。
 */
Cartesian2.mostOrthogonalAxis = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const f = Cartesian2.normalize(cartesian, mostOrthogonalAxisScratch);
  Cartesian2.abs(f, f);

  if (f.x <= f.y) {
    result = Cartesian2.clone(Cartesian2.UNIT_X, result);
  } else {
    result = Cartesian2.clone(Cartesian2.UNIT_Y, result);
  }

  return result;
};

/**
 * 比较所提供的笛卡尔分量并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartesian2} [left] 第一个Cartesian.
 * @param {Cartesian2} [right] 第二个 Cartesian.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Cartesian2.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y)
  );
};

/**
 * @private
 */
Cartesian2.equalsArray = function (cartesian, array, offset) {
  return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
};

/**
 * 比较所提供的笛卡尔分量并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * <code>false</code> 否则。
 *
 * @param {Cartesian2} [left] 第一个Cartesian.
 * @param {Cartesian2} [right] 第二个 Cartesian.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，<code>false</code>否则。
 */
Cartesian2.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.x,
        right.x,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        left.y,
        right.y,
        relativeEpsilon,
        absoluteEpsilon
      ))
  );
};

/**
 * 初始化为(0.0,0.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ZERO = Object.freeze(new Cartesian2(0.0, 0.0));

/**
 * 初始化为(1.0,1.0)的不可变cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ONE = Object.freeze(new Cartesian2(1.0, 1.0));

/**
 * 初始化为(1.0,0.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_X = Object.freeze(new Cartesian2(1.0, 0.0));

/**
 * 初始化为(0.0,1.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_Y = Object.freeze(new Cartesian2(0.0, 1.0));

/**
 * 复制Cartesian2 instance.
 *
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。
 */
Cartesian2.prototype.clone = function (result) {
  return Cartesian2.clone(this, result);
};

/**
 * 将此笛卡尔与提供的笛卡尔分量进行比较并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartesian2} [right] 右边 Cartesian.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
Cartesian2.prototype.equals = function (right) {
  return Cartesian2.equals(this, right);
};

/**
 * 将此笛卡尔与提供的笛卡尔分量进行比较并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * <code>false</code> 否则。
 *
 * @param {Cartesian2} [right] 右边 Cartesian.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，<code>false</code>否则。
 */
Cartesian2.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return Cartesian2.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon
  );
};

/**
 * 以'(x, y)'的格式创建一个表示此笛卡尔坐标的字符串。
 *
 * @returns {string} 以'(x, y)'格式表示所提供的笛卡尔坐标的字符串。
 */
Cartesian2.prototype.toString = function () {
  return `(${this.x}, ${this.y})`;
};
export default Cartesian2;
