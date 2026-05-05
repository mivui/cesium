// @ts-check

import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/** @import {TypedArray} from "./globalTypes.js"; */
/** @import Cartesian4 from "./Cartesian4.js"; */
/** @import Ellipsoid from "./Ellipsoid.js"; */
/** @import Spherical from "./Spherical.js"; */

/**
 * 三维笛卡尔点。
 *
 * @see Cartesian2
 * @see Cartesian4
 * @see Packable
 */
class Cartesian3 {
  /**
   * @param {number} [x=0.0]  X 分量。
   * @param {number} [y=0.0]  Y 分量。
   * @param {number} [z=0.0]  Z 分量。
   */
  constructor(x, y, z) {
  /**
   * X分量。
   * @type {number}
   * @default 0.0
   */
    this.x = x ?? 0.0;

  /**
   * Y分量。
   * @type {number}
   * @default 0.0
   */
    this.y = y ?? 0.0;

  /**
   * Z分量。
   * @type {number}
   * @default 0.0
   */
    this.z = z ?? 0.0;
  }

  /**
   * 将提供的球面坐标转换为Cartesian3坐标。
   *
   * @param {Spherical} spherical 要转换为Cartesian3的球面坐标。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数；如果未提供则返回新的Cartesian3实例。
   */
  static fromSpherical(spherical, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("spherical", spherical);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian3();
    }

    const clock = spherical.clock;
    const cone = spherical.cone;
    const magnitude = spherical.magnitude ?? 1.0;
    const radial = magnitude * Math.sin(cone);
    result.x = radial * Math.cos(clock);
    result.y = radial * Math.sin(clock);
    result.z = magnitude * Math.cos(cone);
    return result;
  }

  /**
   * 从x、y和z坐标创建Cartesian3实例。
   *
   * @param {number} x x坐标。
   * @param {number} y y坐标。
   * @param {number} z z坐标。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数；如果未提供则返回新的Cartesian3实例。
   */
  static fromElements(x, y, z, result) {
    if (!defined(result)) {
      return new Cartesian3(x, y, z);
    }

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * 复制Cartesian3实例。
   *
   * @param {Cartesian3} cartesian 要复制的笛卡尔坐标。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数；如果未提供则返回新的Cartesian3实例。（如果cartesian未定义则返回undefined）
   */
  static clone(cartesian, result) {
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
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Cartesian3} value 要打包的值。
   * @param {number[]} array 要打包到的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组索引。
   *
   * @returns {number[]} 已打包的数组
   */
  static pack(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    array[startingIndex++] = value.x;
    array[startingIndex++] = value.y;
    array[startingIndex] = value.z;

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数；如果未提供则返回新的Cartesian3实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Cartesian3();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex++];
    result.z = array[startingIndex];
    return result;
  }

  /**
   * 将Cartesian3数组展平为分量数组。
   *
   * @param {Cartesian3[]} array 要打包的笛卡尔坐标数组。
   * @param {number[]} [result] 存储结果的数组。如果是类型化数组，则必须包含array.length * 3个分量，否则将抛出{@link DeveloperError}。如果是常规数组，则会调整大小以具有(array.length * 3)个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 3;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): See https://github.com/CesiumGS/cesium/pull/13302.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "If result is a typed array, it must have exactly array.length * 3 elements",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Cartesian3.pack(array[i], result, i * 3);
    }

    return result;
  }

  /**
   * 将笛卡尔分量数组解包为Cartesian3数组。
   *
   * @param {number[]} array 要解包的分量数组。
   * @param {Cartesian3[]} [result] 存储结果的数组。
   * @returns {Cartesian3[]} 解包后的数组。
   */
  static unpackArray(array, result) {
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
  }

  /**
   * 计算提供的笛卡尔坐标的最大分量值。
   *
   * @param {Cartesian3} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最大分量的值。
   */
  static maximumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.max(cartesian.x, cartesian.y, cartesian.z);
  }

  /**
   * 计算提供的笛卡尔坐标的最小分量值。
   *
   * @param {Cartesian3} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最小分量的值。
   */
  static minimumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.min(cartesian.x, cartesian.y, cartesian.z);
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最小分量的笛卡尔坐标。
   *
   * @param {Cartesian3} first 要比较的笛卡尔坐标。
   * @param {Cartesian3} second 要比较的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 包含最小分量的笛卡尔坐标。
   */
  static minimumByComponent(first, second, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("first", first);
    Check.typeOf.object("second", second);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);
    result.z = Math.min(first.z, second.z);

    return result;
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最大分量的笛卡尔坐标。
   *
   * @param {Cartesian3} first 要比较的笛卡尔坐标。
   * @param {Cartesian3} second 要比较的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 包含最大分量的笛卡尔坐标。
   */
  static maximumByComponent(first, second, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("first", first);
    Check.typeOf.object("second", second);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    result.z = Math.max(first.z, second.z);
    return result;
  }

  /**
   * 将值限制在两个值之间。
   *
   * @param {Cartesian3} value 要限制的值。
   * @param {Cartesian3} min 最小边界。
   * @param {Cartesian3} max 最大边界。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 限制后的值，满足 min <= result <= max。
   */
  static clamp(value, min, max, result) {
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
  }

  /**
   * 计算提供的笛卡尔坐标的平方模长。
   *
   * @param {Cartesian3} cartesian 要计算平方模长的笛卡尔实例。
   * @returns {number} 平方模长。
   */
  static magnitudeSquared(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return (
      cartesian.x * cartesian.x +
      cartesian.y * cartesian.y +
      cartesian.z * cartesian.z
    );
  }

  /**
   * 计算笛卡尔坐标的模长（长度）。
   *
   * @param {Cartesian3} cartesian 要计算模长的笛卡尔实例。
   * @returns {number} 模长。
   */
  static magnitude(cartesian) {
    return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
  }

  /**
   * 计算两点之间的距离。
   *
   * @param {Cartesian3} left 要计算距离的的第一个点。
   * @param {Cartesian3} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离。
   *
   * @example
   * // 返回 1.0
   * const d = Cesium.Cartesian3.distance(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(2.0, 0.0, 0.0));
   */
  static distance(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian3.subtract(left, right, distanceScratch);
    return Cartesian3.magnitude(distanceScratch);
  }

  /**
   * 计算两点之间的平方距离。使用此函数
   * 比较平方距离比使用{@link Cartesian3#distance}比较距离更高效。
   *
   * @param {Cartesian3} left 要计算距离的的第一个点。
   * @param {Cartesian3} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离平方。
   *
   * @example
   * // 返回 4.0，不是 2.0
   * const d = Cesium.Cartesian3.distanceSquared(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(3.0, 0.0, 0.0));
   */
  static distanceSquared(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian3.subtract(left, right, distanceScratch);
    return Cartesian3.magnitudeSquared(distanceScratch);
  }

  /**
   * 计算提供的笛卡尔坐标的归一化形式。
   *
   * @param {Cartesian3} cartesian 要归一化的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static normalize(cartesian, result) {
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
  }

  /**
   * 计算两个笛卡尔坐标的点积（标量积）。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @returns {number} 点积。
   */
  static dot(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    return left.x * right.x + left.y * right.y + left.z * right.z;
  }

  /**
   * 计算两个笛卡尔坐标的分量积。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static multiplyComponents(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x * right.x;
    result.y = left.y * right.y;
    result.z = left.z * right.z;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量商。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static divideComponents(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x / right.x;
    result.y = left.y / right.y;
    result.z = left.z / right.z;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量和。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static add(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量差。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static subtract(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量乘以提供的标量。
   *
   * @param {Cartesian3} cartesian 要缩放的笛卡尔坐标。
   * @param {number} scalar 要相乘的标量。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static multiplyByScalar(cartesian, scalar, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量除以提供的标量。
   *
   * @param {Cartesian3} cartesian 要除的笛卡尔坐标。
   * @param {number} scalar 要除以的标量。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static divideByScalar(cartesian, scalar, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    result.z = cartesian.z / scalar;
    return result;
  }

  /**
   * 对提供的笛卡尔坐标取反。
   *
   * @param {Cartesian3} cartesian 要取反的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static negate(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = -cartesian.x;
    result.y = -cartesian.y;
    result.z = -cartesian.z;
    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的绝对值。
   *
   * @param {Cartesian3} cartesian 要计算绝对值的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static abs(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    result.z = Math.abs(cartesian.z);
    return result;
  }

  /**
   * 使用提供的笛卡尔坐标计算t处的线性插值或外推。
   *
   * @param {Cartesian3} start t为0.0时对应的值。
   * @param {Cartesian3} end t为1.0时对应的值。
   * @param {number} t 要插值的t点。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数。
   */
  static lerp(start, end, t, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("start", start);
    Check.typeOf.object("end", end);
    Check.typeOf.number("t", t);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    Cartesian3.multiplyByScalar(end, t, lerpScratch);
    result = Cartesian3.multiplyByScalar(start, 1.0 - t, result);
    return Cartesian3.add(lerpScratch, result, result);
  }

  /**
   * 返回提供的笛卡尔坐标之间的角度（弧度）。
   *
   * @param {Cartesian3} left 第一个笛卡尔坐标。
   * @param {Cartesian3} right 第二个笛卡尔坐标。
   * @returns {number} 笛卡尔坐标之间的角度。
   */
  static angleBetween(left, right) {
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
  }

  /**
   * 返回与提供的笛卡尔坐标最正交的轴。
   *
   * @param {Cartesian3} cartesian 要在其上查找最正交轴的笛卡尔坐标。
   * @param {Cartesian3} result 存储结果的对象。
   * @returns {Cartesian3} 最正交的轴。
   */
  static mostOrthogonalAxis(cartesian, result) {
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
  }

  /**
   * Projects vector a onto vector b
   * @param {Cartesian3} a The vector that needs projecting
   * @param {Cartesian3} b The vector to project onto
   * @param {Cartesian3} result The result cartesian
   * @returns {Cartesian3} The modified result parameter
   */
  static projectVector(a, b, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("a", a);
    Check.defined("b", b);
    Check.defined("result", result);
    //>>includeEnd('debug');

    const scalar = Cartesian3.dot(a, b) / Cartesian3.dot(b, b);
    return Cartesian3.multiplyByScalar(b, scalar, result);
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian3} [left] 第一个笛卡尔坐标。
   * @param {Cartesian3} [right] 第二个笛卡尔坐标。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y &&
        left.z === right.z)
    );
  }

  /**
   * @param {Cartesian3} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @private
   */
  static equalsArray(cartesian, array, offset) {
    return (
      cartesian.x === array[offset] &&
      cartesian.y === array[offset + 1] &&
      cartesian.z === array[offset + 2]
    );
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian3} [left] 第一个笛卡尔坐标。
   * @param {Cartesian3} [right] 第二个笛卡尔坐标。
   * @param {number} [relativeEpsilon=0] 用于相等性测试的相对epsilon容差。
   * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对epsilon容差。
   * @returns {boolean} 如果left和right在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equalsEpsilon(left, right, relativeEpsilon, absoluteEpsilon) {
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
  }

  /**
   * Computes the cross (outer) product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The cross product.
   */
  static cross(left, right, result) {
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
  }

  /**
   * Computes the midpoint between the right and left Cartesian.
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The midpoint.
   */
  static midpoint(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = (left.x + right.x) * 0.5;
    result.y = (left.y + right.y) * 0.5;
    result.z = (left.z + right.z) * 0.5;

    return result;
  }

  /**
   * Returns a Cartesian3 position from longitude and latitude values given in degrees.
   *
   * @param {number} longitude The longitude, in degrees
   * @param {number} latitude The latitude, in degrees
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromDegrees(-115.0, 37.0);
   */
  static fromDegrees(longitude, latitude, height, ellipsoid, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    longitude = CesiumMath.toRadians(longitude);
    latitude = CesiumMath.toRadians(latitude);
    return Cartesian3.fromRadians(
      longitude,
      latitude,
      height,
      ellipsoid,
      result,
    );
  }

  /**
   * Returns a Cartesian3 position from longitude and latitude values given in radians.
   *
   * @param {number} longitude The longitude, in radians
   * @param {number} latitude The latitude, in radians
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromRadians(-2.007, 0.645);
   */
  static fromRadians(longitude, latitude, height, ellipsoid, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("longitude", longitude);
    Check.typeOf.number("latitude", latitude);
    //>>includeEnd('debug');

    height = height ?? 0.0;

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
  }

  /**
   * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in degrees.
   *
   * @param {number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the coordinates lie.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0, -107.0, 33.0]);
   */
  static fromDegreesArray(coordinates, ellipsoid, result) {
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
  }

  /**
   * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in radians.
   *
   * @param {number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the coordinates lie.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromRadiansArray([-2.007, 0.645, -1.867, .575]);
   */
  static fromRadiansArray(coordinates, ellipsoid, result) {
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
  }

  /**
   * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in degrees.
   *
   * @param {number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromDegreesArrayHeights([-115.0, 37.0, 100000.0, -107.0, 33.0, 150000.0]);
   */
  static fromDegreesArrayHeights(coordinates, ellipsoid, result) {
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
  }

  /**
   * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in radians.
   *
   * @param {number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromRadiansArrayHeights([-2.007, 0.645, 100000.0, -1.867, .575, 150000.0]);
   */
  static fromRadiansArrayHeights(coordinates, ellipsoid, result) {
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
  }

  /**
   * 复制此Cartesian3实例。
   *
   * @param {Cartesian3} [result] 存储结果的对象。
   * @returns {Cartesian3} 修改后的结果参数；如果未提供则返回新的Cartesian3实例。
   */
  clone(result) {
    return Cartesian3.clone(this, result);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian3} [right] 右侧的笛卡尔坐标。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return Cartesian3.equals(this, right);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian3} [right] 右侧的笛卡尔坐标。
   * @param {number} [relativeEpsilon=0] 用于相等性测试的相对epsilon容差。
   * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对epsilon容差。
   * @returns {boolean} 如果它们在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return Cartesian3.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon,
    );
  }

  /**
   * 创建表示此笛卡尔坐标的字符串，格式为'(x, y, z)'。
   *
   * @returns {string} 表示此笛卡尔坐标的字符串，格式为'(x, y, z)'。
   */
  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}

/**
 * Creates a Cartesian3 instance from an existing Cartesian4.  This simply takes the
 * x, y, and z properties of the Cartesian4 and drops w.
 * @function
 *
 * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian3 instance from.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.fromCartesian4 = Cartesian3.clone;

/**
 * The number of elements used to pack the object into an array.
 * @type {number}
 */
Cartesian3.packedLength = 3;

/**
 * Creates a Cartesian3 from three consecutive elements in an array.
 * @function
 *
 * @param {number[]} array The array whose three consecutive elements correspond to the x, y, and z components, respectively.
 * @param {number} [startingIndex=0] The offset into the array of the first element, which corresponds to the x component.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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

const distanceScratch = new Cartesian3();

const lerpScratch = new Cartesian3();

const angleBetweenScratch = new Cartesian3();
const angleBetweenScratch2 = new Cartesian3();

const mostOrthogonalAxisScratch = new Cartesian3();

let scratchN = new Cartesian3();
let scratchK = new Cartesian3();

// To prevent a circular dependency, this value is overridden by Ellipsoid when Ellipsoid.default is set
Cartesian3._ellipsoidRadiiSquared = new Cartesian3(
  6378137.0 * 6378137.0,
  6378137.0 * 6378137.0,
  6356752.3142451793 * 6356752.3142451793,
);

/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ZERO = Object.freeze(new Cartesian3(0.0, 0.0, 0.0));

/**
 * An immutable Cartesian3 instance initialized to (1.0, 1.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ONE = Object.freeze(new Cartesian3(1.0, 1.0, 1.0));

/**
 * An immutable Cartesian3 instance initialized to (1.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_X = Object.freeze(new Cartesian3(1.0, 0.0, 0.0));

/**
 * An immutable Cartesian3 instance initialized to (0.0, 1.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Y = Object.freeze(new Cartesian3(0.0, 1.0, 0.0));

/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Z = Object.freeze(new Cartesian3(0.0, 0.0, 1.0));

export default Cartesian3;
