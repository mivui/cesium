import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 一个三维笛卡尔点。
 * @alias Cartesian3
 * @constructor
 *
 * @param {number} [x=0.0] X分量。
 * @param {number} [y=0.0] Y分量。
 * @param {number} [z=0.0] Z分量。
 *
 * @see Cartesian2
 * @see Cartesian4
 * @see Packable
 */
function Cartesian3(x, y, z) {
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

  /**
   * Z分量。
   * @type {number}
   * @default 0.0
   */
  this.z = defaultValue(z, 0.0);
}

/**
 * 将提供的球面转换为笛卡尔坐标。
 *
 * @param {Spherical} spherical 将球面转换为Cartesian3坐标系。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 */
Cartesian3.fromSpherical = function (spherical, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("spherical", spherical);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  const clock = spherical.clock;
  const cone = spherical.cone;
  const magnitude = defaultValue(spherical.magnitude, 1.0);
  const radial = magnitude * Math.sin(cone);
  result.x = radial * Math.cos(clock);
  result.y = radial * Math.sin(clock);
  result.z = magnitude * Math.cos(cone);
  return result;
};

/**
 * 从x, y和z坐标创建一个Cartesian3实例。
 *
 * @param {number} x x坐标。
 * @param {number} y y坐标。
 * @param {number} z z坐标。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 */
Cartesian3.fromElements = function (x, y, z, result) {
  if (!defined(result)) {
    return new Cartesian3(x, y, z);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 复制Cartesian3 instance.
 *
 * @param {Cartesian3} cartesian 复制的笛卡尔坐标。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。 (如果cartesian未定义则返回未定义)
 */
Cartesian3.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  result.z = cartesian.z;
  return result;
};

/**
 * 从现有的Cartesian4创建Cartesian3实例。这只需要
 * x, y, z的Cartesian4坐标的性质。
 * @function
 *
 * @param {Cartesian4} cartesian 创建Cartesian3实例的Cartesian4实例。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 */
Cartesian3.fromCartesian4 = Cartesian3.clone;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Cartesian3.packedLength = 3;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {Cartesian3} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
Cartesian3.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.x;
  array[startingIndex++] = value.y;
  array[startingIndex] = value.z;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {Cartesian3} [result] 要在其中存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 */
Cartesian3.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Cartesian3();
  }
  result.x = array[startingIndex++];
  result.y = array[startingIndex++];
  result.z = array[startingIndex];
  return result;
};

/**
 * 将笛Cartesian3的数组平展为一个分量数组。
 *
 * @param {Cartesian3[]} array 要打包的笛卡儿数组。
 * @param {number[]} [result] 要在其中存储结果的数组。 如果这是一个类型化数组，它必须有array。 array.length * 3个组件，否则将抛出{@link DeveloperError}。如果它是一个常规数组，它的大小将被调整为(array.length * 3)元素。
 *
 * @returns {number[]} 打包数组。
 */
Cartesian3.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 3;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 3 elements",
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Cartesian3.pack(array[i], result, i * 3);
  }
  return result;
};

/**
 * 将一个笛卡尔分量数组解包为一个Cartesian3数组。
 *
 * @param {number[]} array 要解包的组件数组。
 * @param {Cartesian3[]} [result] 要在其中存储结果的数组。
 * @returns {Cartesian3[]} 未打包的数组。
 */
Cartesian3.unpackArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 3);
  if (array.length % 3 !== 0) {
    throw new DeveloperError("array length must be a multiple of 3.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  if (!defined(result)) {
    result = new Array(length / 3);
  } else {
    result.length = length / 3;
  }

  for (let i = 0; i < length; i += 3) {
    const index = i / 3;
    result[index] = Cartesian3.unpack(array, i, result[index]);
  }
  return result;
};

/**
 * 从数组中三个连续的元素创建一个Cartesian3坐标系。
 * @function
 *
 * @param {number[]} array 数组，其三个连续的元素分别对应x、y和z分量。
 * @param {number} [startingIndex=0] 第一个元素在数组中的偏移量，对应于X分量。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 *
 * @example
 * // Create a Cartesian3 with (1.0, 2.0, 3.0)
 * const v = [1.0, 2.0, 3.0];
 * const p = Cesium.Cartesian3.fromArray(v);
 *
 * // Create a Cartesian3 with (1.0, 2.0, 3.0) using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 2.0, 3.0];
 * const p2 = Cesium.Cartesian3.fromArray(v2, 2);
 */
Cartesian3.fromArray = Cartesian3.unpack;

/**
 * 计算所提供的笛卡尔坐标的最大分量的值。
 *
 * @param {Cartesian3} cartesian 用笛卡尔坐标。
 * @returns {number} 最大分量的值。
 */
Cartesian3.maximumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.max(cartesian.x, cartesian.y, cartesian.z);
};

/**
 * 为所提供的笛卡尔坐标计算最小分量的值。
 *
 * @param {Cartesian3} cartesian 用笛卡尔坐标。
 * @returns {number} 最小分量的值。
 */
Cartesian3.minimumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.min(cartesian.x, cartesian.y, cartesian.z);
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最小分量的笛卡尔坐标。
 *
 * @param {Cartesian3} first 用笛卡尔坐标来比较。
 * @param {Cartesian3} second 用笛卡尔坐标来比较。
 * @param {Cartesian3} result 要在其中存储结果的对象。
 * @returns {Cartesian3} 具有最小分量的笛卡尔曲线。
 */
Cartesian3.minimumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.min(first.x, second.x);
  result.y = Math.min(first.y, second.y);
  result.z = Math.min(first.z, second.z);

  return result;
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最大分量的笛卡尔坐标。
 *
 * @param {Cartesian3} first 用笛卡尔坐标来比较。
 * @param {Cartesian3} second 用笛卡尔坐标来比较。
 * @param {Cartesian3} result 要在其中存储结果的对象。
 * @returns {Cartesian3} A cartesian with the maximum components.
 */
Cartesian3.maximumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.max(first.x, second.x);
  result.y = Math.max(first.y, second.y);
  result.z = Math.max(first.z, second.z);
  return result;
};

/**
 * 将一个值约束在两个值之间。
 *
 * @param {Cartesian3} cartesian 夹位的值。
 * @param {Cartesian3} min 最小值。
 * @param {Cartesian3} max 最大值。
 * @param {Cartesian3} result 要在其中存储结果的对象。
 * @returns {Cartesian3} 使min <= value <= max的固定值。
 */
Cartesian3.clamp = function (value, min, max, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.typeOf.object("min", min);
  Check.typeOf.object("max", max);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = CesiumMath.clamp(value.x, min.x, max.x);
  const y = CesiumMath.clamp(value.y, min.y, max.y);
  const z = CesiumMath.clamp(value.z, min.z, max.z);

  result.x = x;
  result.y = y;
  result.z = z;

  return result;
};

/**
 * 计算给定的笛卡尔坐标的平方幅度。
 *
 * @param {Cartesian3} cartesian 要计算其模的平方的笛卡尔实例。
 * @returns {number} 大小的平方。
 */
Cartesian3.magnitudeSquared = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return (
    cartesian.x * cartesian.x +
    cartesian.y * cartesian.y +
    cartesian.z * cartesian.z
  );
};

/**
 * 计算笛卡尔的大小(长度)。
 *
 * @param {Cartesian3} cartesian 要计算其大小的笛卡尔实例。
 * @returns {number} 的大小。
 */
Cartesian3.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
};

const distanceScratch = new Cartesian3();

/**
 * 计算两点之间的距离。
 *
 * @param {Cartesian3} left 第一个计算距离的点。
 * @param {Cartesian3} right 计算距离的第二个点。
 * @returns {number} 两点之间的距离
 *
 * @example
 * // Returns 1.0
 * const d = Cesium.Cartesian3.distance(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(2.0, 0.0, 0.0));
 */
Cartesian3.distance = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian3.subtract(left, right, distanceScratch);
  return Cartesian3.magnitude(distanceScratch);
};

/**
 * 计算两点之间距离的平方。比较平方距离
 * 使用此函数比使用 {@link Cartesian3#distance}.
 *
 * @param {Cartesian3} left 第一个计算距离的点。
 * @param {Cartesian3} right 计算距离的第二个点。
 * @returns {number} 两点之间的距离
 *
 * @example
 * // Returns 4.0, not 2.0
 * const d = Cesium.Cartesian3.distanceSquared(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(3.0, 0.0, 0.0));
 */
Cartesian3.distanceSquared = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian3.subtract(left, right, distanceScratch);
  return Cartesian3.magnitudeSquared(distanceScratch);
};

/**
 * 计算提供的笛卡尔坐标的规范化形式。
 *
 * @param {Cartesian3} cartesian 笛卡尔坐标被归一化。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.normalize = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const magnitude = Cartesian3.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;
  result.z = cartesian.z / magnitude;

  //>>includeStart('debug', pragmas.debug);
  if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
    throw new DeveloperError("normalized result is not a number");
  }
  //>>includeEnd('debug');

  return result;
};

/**
 * 计算两个笛卡尔坐标的点(标量)积。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @returns {number} 点积。
 */
Cartesian3.dot = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return left.x * right.x + left.y * right.y + left.z * right.z;
};

/**
 * 计算两个笛卡尔坐标的分量积。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.multiplyComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x * right.x;
  result.y = left.y * right.y;
  result.z = left.z * right.z;
  return result;
};

/**
 * 计算两个笛卡尔的分量商。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.divideComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x / right.x;
  result.y = left.y / right.y;
  result.z = left.z / right.z;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量和。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.add = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量差。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.subtract = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  return result;
};

/**
 * 将所提供的笛卡尔分量与所提供的标量相乘。
 *
 * @param {Cartesian3} cartesian 要缩放的笛卡尔坐标。
 * @param {number} scalar 与之相乘的标量。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.multiplyByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  result.z = cartesian.z * scalar;
  return result;
};

/**
 * 将给定的笛卡尔分量除以给定的标量。
 *
 * @param {Cartesian3} cartesian 要划分的笛卡尔坐标。
 * @param {number} scalar 要除以的标量。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.divideByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  result.z = cartesian.z / scalar;
  return result;
};

/**
 * 否定提供的笛卡尔坐标。
 *
 * @param {Cartesian3} cartesian 笛卡尔坐标被否定了。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.negate = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -cartesian.x;
  result.y = -cartesian.y;
  result.z = -cartesian.z;
  return result;
};

/**
 * 计算所提供的笛卡尔坐标的绝对值。
 *
 * @param {Cartesian3} cartesian 要计算其绝对值的笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.abs = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.abs(cartesian.x);
  result.y = Math.abs(cartesian.y);
  result.z = Math.abs(cartesian.z);
  return result;
};

const lerpScratch = new Cartesian3();
/**
 * 使用提供的笛卡儿计算t处的线性插值或外推。
 *
 * @param {Cartesian3} start 对应于t在0.0处的值。
 * @param {Cartesian3} end 对应于1.0时t的值。
 * @param {number} t 沿着t进行插值的点。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */
Cartesian3.lerp = function (start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  Cartesian3.multiplyByScalar(end, t, lerpScratch);
  result = Cartesian3.multiplyByScalar(start, 1.0 - t, result);
  return Cartesian3.add(lerpScratch, result, result);
};

const angleBetweenScratch = new Cartesian3();
const angleBetweenScratch2 = new Cartesian3();
/**
 * 返回所提供的笛卡尔之间的角度，以弧度为单位。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @returns {number} 笛卡尔角之间的夹角。
 */
Cartesian3.angleBetween = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian3.normalize(left, angleBetweenScratch);
  Cartesian3.normalize(right, angleBetweenScratch2);
  const cosine = Cartesian3.dot(angleBetweenScratch, angleBetweenScratch2);
  const sine = Cartesian3.magnitude(
    Cartesian3.cross(
      angleBetweenScratch,
      angleBetweenScratch2,
      angleBetweenScratch,
    ),
  );
  return Math.atan2(sine, cosine);
};

const mostOrthogonalAxisScratch = new Cartesian3();
/**
 * 返回与所提供的笛卡尔坐标最正交的轴。
 *
 * @param {Cartesian3} cartesian 在笛卡尔坐标系上找到最正交的轴。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 最正交的轴。
 */
Cartesian3.mostOrthogonalAxis = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const f = Cartesian3.normalize(cartesian, mostOrthogonalAxisScratch);
  Cartesian3.abs(f, f);

  if (f.x <= f.y) {
    if (f.x <= f.z) {
      result = Cartesian3.clone(Cartesian3.UNIT_X, result);
    } else {
      result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
    }
  } else if (f.y <= f.z) {
    result = Cartesian3.clone(Cartesian3.UNIT_Y, result);
  } else {
    result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
  }

  return result;
};

/**
 * 将向量a投影到向量b上
 * @param {Cartesian3} a 需要投影的向量
 * @param {Cartesian3} b 要投影到的向量
 * @param {Cartesian3} result cartesian结果
 * @returns {Cartesian3} 修改后的结果参数
 */
Cartesian3.projectVector = function (a, b, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("a", a);
  Check.defined("b", b);
  Check.defined("result", result);
  //>>includeEnd('debug');

  const scalar = Cartesian3.dot(a, b) / Cartesian3.dot(b, b);
  return Cartesian3.multiplyByScalar(b, scalar, result);
};

/**
 * 比较所提供的笛卡尔分量并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartesian3} [left] 第一个Cartesian.
 * @param {Cartesian3} [right] 第二个 Cartesian.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Cartesian3.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z)
  );
};

/**
 * @private
 */
Cartesian3.equalsArray = function (cartesian, array, offset) {
  return (
    cartesian.x === array[offset] &&
    cartesian.y === array[offset + 1] &&
    cartesian.z === array[offset + 2]
  );
};

/**
 * 比较所提供的笛卡尔分量并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {Cartesian3} [left] 第一个Cartesian.
 * @param {Cartesian3} [right] 第二个 Cartesian.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果左和右在提供的epsilon内，否则 <code>false</code>。
 */
Cartesian3.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.x,
        right.x,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.y,
        right.y,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.z,
        right.z,
        relativeEpsilon,
        absoluteEpsilon,
      ))
  );
};

/**
 * 计算两个笛卡尔的叉乘(外)积。
 *
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} 叉乘
 */
Cartesian3.cross = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const leftX = left.x;
  const leftY = left.y;
  const leftZ = left.z;
  const rightX = right.x;
  const rightY = right.y;
  const rightZ = right.z;

  const x = leftY * rightZ - leftZ * rightY;
  const y = leftZ * rightX - leftX * rightZ;
  const z = leftX * rightY - leftY * rightX;

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 计算左右笛卡尔坐标之间的中点。
 * @param {Cartesian3} left 第一个笛卡尔坐标系。
 * @param {Cartesian3} right 第二个笛卡尔坐标系。
 * @param {Cartesian3} result 要在其上存储结果的对象。
 * @returns {Cartesian3} The midpoint.
 */
Cartesian3.midpoint = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = (left.x + right.x) * 0.5;
  result.y = (left.y + right.y) * 0.5;
  result.z = (left.z + right.z) * 0.5;

  return result;
};

/**
 * 从以度表示的经度和纬度值返回笛卡尔位置。
 *
 * @param {number} longitude 经度，以度为单位
 * @param {number} latitude 纬度，以度为单位
 * @param {number} [height=0.0] 椭球体上方的高度，单位为米。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3}  position
 *
 * @example
 * const position = Cesium.Cartesian3.fromDegrees(-115.0, 37.0);
 */
Cartesian3.fromDegrees = function (
  longitude,
  latitude,
  height,
  ellipsoid,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  longitude = CesiumMath.toRadians(longitude);
  latitude = CesiumMath.toRadians(latitude);
  return Cartesian3.fromRadians(longitude, latitude, height, ellipsoid, result);
};

let scratchN = new Cartesian3();
let scratchK = new Cartesian3();

// To prevent a circular dependency, this value is overridden by Ellipsoid when Ellipsoid.default is set
Cartesian3._ellipsoidRadiiSquared = new Cartesian3(
  6378137.0 * 6378137.0,
  6378137.0 * 6378137.0,
  6356752.3142451793 * 6356752.3142451793,
);

/**
 * 从以弧度为单位给出的经度和纬度值返回Cartesian3位置。
 *
 * @param {number} longitude 经度，以弧度为单位
 * @param {number} latitude 纬度，以弧度为单位
 * @param {number} [height=0.0] 椭球体上方的高度，单位为米。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 位置
 *
 * @example
 * const position = Cesium.Cartesian3.fromRadians(-2.007, 0.645);
 */
Cartesian3.fromRadians = function (
  longitude,
  latitude,
  height,
  ellipsoid,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  height = defaultValue(height, 0.0);

  const radiiSquared = !defined(ellipsoid)
    ? Cartesian3._ellipsoidRadiiSquared
    : ellipsoid.radiiSquared;

  const cosLatitude = Math.cos(latitude);
  scratchN.x = cosLatitude * Math.cos(longitude);
  scratchN.y = cosLatitude * Math.sin(longitude);
  scratchN.z = Math.sin(latitude);
  scratchN = Cartesian3.normalize(scratchN, scratchN);

  Cartesian3.multiplyComponents(radiiSquared, scratchN, scratchK);
  const gamma = Math.sqrt(Cartesian3.dot(scratchN, scratchK));
  scratchK = Cartesian3.divideByScalar(scratchK, gamma, scratchK);
  scratchN = Cartesian3.multiplyByScalar(scratchN, height, scratchN);

  if (!defined(result)) {
    result = new Cartesian3();
  }
  return Cartesian3.add(scratchK, scratchN, result);
};

/**
 * 返回Cartesian3位置数组，给定经度和纬度值数组，以度表示。
 *
 * @param {number[]} coordinates 经度和纬度值的列表。值替代 [longitude, latitude, longitude, latitude...].
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 坐标所在的椭球体。
 * @param {Cartesian3[]} [result] 存储结果的笛卡尔对象数组。
 * @returns {Cartesian3[]} 位置数组。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0, -107.0, 33.0]);
 */
Cartesian3.fromDegreesArray = function (coordinates, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("coordinates", coordinates);
  if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
    throw new DeveloperError(
      "the number of coordinates must be a multiple of 2 and at least 2",
    );
  }
  //>>includeEnd('debug');

  const length = coordinates.length;
  if (!defined(result)) {
    result = new Array(length / 2);
  } else {
    result.length = length / 2;
  }

  for (let i = 0; i < length; i += 2) {
    const longitude = coordinates[i];
    const latitude = coordinates[i + 1];
    const index = i / 2;
    result[index] = Cartesian3.fromDegrees(
      longitude,
      latitude,
      0,
      ellipsoid,
      result[index],
    );
  }

  return result;
};

/**
 * 返回一个笛卡尔位置数组，给定以弧度表示的经度和纬度值数组。
 *
 * @param {number[]} coordinates 经度和纬度值的列表。值替代 [longitude, latitude, longitude, latitude...].
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 坐标所在的椭球体。
 * @param {Cartesian3[]} [result] 存储结果的笛卡尔对象数组。
 * @returns {Cartesian3[]} 位置数组。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArray([-2.007, 0.645, -1.867, .575]);
 */
Cartesian3.fromRadiansArray = function (coordinates, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("coordinates", coordinates);
  if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
    throw new DeveloperError(
      "the number of coordinates must be a multiple of 2 and at least 2",
    );
  }
  //>>includeEnd('debug');

  const length = coordinates.length;
  if (!defined(result)) {
    result = new Array(length / 2);
  } else {
    result.length = length / 2;
  }

  for (let i = 0; i < length; i += 2) {
    const longitude = coordinates[i];
    const latitude = coordinates[i + 1];
    const index = i / 2;
    result[index] = Cartesian3.fromRadians(
      longitude,
      latitude,
      0,
      ellipsoid,
      result[index],
    );
  }

  return result;
};

/**
 * 返回一个Cartesian3位置数组，给定经度、纬度和高度值数组，其中经度和纬度以度数表示。
 *
 * @param {number[]} coordinates 经度、纬度和高度值的列表。值替代 [longitude, latitude, height, longitude, latitude, height...].
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartesian3[]} [result] 存储结果的笛卡尔对象数组。
 * @returns {Cartesian3[]} 位置数组。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromDegreesArrayHeights([-115.0, 37.0, 100000.0, -107.0, 33.0, 150000.0]);
 */
Cartesian3.fromDegreesArrayHeights = function (coordinates, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("coordinates", coordinates);
  if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
    throw new DeveloperError(
      "the number of coordinates must be a multiple of 3 and at least 3",
    );
  }
  //>>includeEnd('debug');

  const length = coordinates.length;
  if (!defined(result)) {
    result = new Array(length / 3);
  } else {
    result.length = length / 3;
  }

  for (let i = 0; i < length; i += 3) {
    const longitude = coordinates[i];
    const latitude = coordinates[i + 1];
    const height = coordinates[i + 2];
    const index = i / 3;
    result[index] = Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
      ellipsoid,
      result[index],
    );
  }

  return result;
};

/**
 * 返回一个Cartesian3位置数组，给定经度、纬度和高度值数组，其中经度和纬度以弧度表示。
 *
 * @param {number[]} coordinates 经度、纬度和高度值的列表。值替代 [longitude, latitude, height, longitude, latitude, height...].
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 位置所在的椭球体。
 * @param {Cartesian3[]} [result] 存储结果的笛卡尔对象数组。
 * @returns {Cartesian3[]} 位置数组。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArrayHeights([-2.007, 0.645, 100000.0, -1.867, .575, 150000.0]);
 */
Cartesian3.fromRadiansArrayHeights = function (coordinates, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("coordinates", coordinates);
  if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
    throw new DeveloperError(
      "the number of coordinates must be a multiple of 3 and at least 3",
    );
  }
  //>>includeEnd('debug');

  const length = coordinates.length;
  if (!defined(result)) {
    result = new Array(length / 3);
  } else {
    result.length = length / 3;
  }

  for (let i = 0; i < length; i += 3) {
    const longitude = coordinates[i];
    const latitude = coordinates[i + 1];
    const height = coordinates[i + 2];
    const index = i / 3;
    result[index] = Cartesian3.fromRadians(
      longitude,
      latitude,
      height,
      ellipsoid,
      result[index],
    );
  }

  return result;
};

/**
 * 初始化为的不可变的Cartesian3实例 (0.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ZERO = Object.freeze(new Cartesian3(0.0, 0.0, 0.0));

/**
 * 初始化为的不可变的Cartesian3实例 (1.0, 1.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ONE = Object.freeze(new Cartesian3(1.0, 1.0, 1.0));

/**
 * 初始化为的不可变的Cartesian3实例 (1.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_X = Object.freeze(new Cartesian3(1.0, 0.0, 0.0));

/**
 * 初始化为的不可变的Cartesian3实例 (0.0, 1.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Y = Object.freeze(new Cartesian3(0.0, 1.0, 0.0));

/**
 * 初始化为的不可变的Cartesian3实例 (0.0, 0.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Z = Object.freeze(new Cartesian3(0.0, 0.0, 1.0));

/**
 * 复制Cartesian3 instance.
 *
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3} 如果没有提供新的Cartesian3实例，则使用修改后的结果参数。
 */
Cartesian3.prototype.clone = function (result) {
  return Cartesian3.clone(this, result);
};

/**
 * 将此笛卡尔与提供的笛卡尔分量进行比较并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Cartesian3} [right] 右边 Cartesian.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
Cartesian3.prototype.equals = function (right) {
  return Cartesian3.equals(this, right);
};

/**
 * 将此笛卡尔与提供的笛卡尔分量进行比较并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {Cartesian3} [right] 右边 Cartesian.
 * @param {number} [relativeEpsilon=0] 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code>如果它们在提供的epsilon内，否则 <code>false</code>。
 */
Cartesian3.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return Cartesian3.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon,
  );
};

/**
 * 以'(x, y, z)'的格式创建一个表示此笛卡尔坐标的字符串。
 *
 * @returns {string} 以'(x, y, z)'格式表示此笛卡尔坐标的字符串。
 */
Cartesian3.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z})`;
};
export default Cartesian3;
