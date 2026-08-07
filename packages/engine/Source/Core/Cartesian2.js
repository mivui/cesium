// @ts-check

import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/** @import {TypedArray} from "./globalTypes.js"; */
/** @import Cartesian3 from "./Cartesian3.js"; */
/** @import Cartesian4 from "./Cartesian4.js"; */

/**
 * 二维笛卡尔点。
 *
 * @see Cartesian3
 * @see Cartesian4
 * @see Packable
 */
class Cartesian2 {
  /**
   * @param {number} [x=0.0] X分量。
   * @param {number} [y=0.0] Y分量。
   */
  constructor(x, y) {
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
  }

  /**
   * 从x和y坐标创建Cartesian2实例。
   *
   * @param {number} x x坐标。
   * @param {number} y y坐标。
   * @param {Cartesian2} [result] 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
   */
  static fromElements(x, y, result) {
    if (!defined(result)) {
      return new Cartesian2(x, y);
    }

    result.x = x;
    result.y = y;
    return result;
  }

  /**
   * 复制Cartesian2实例。
   *
   * @param {Cartesian2} cartesian 要复制的笛卡尔坐标。
   * @param {Cartesian2} [result] 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。（如果cartesian未定义则返回undefined）
   */
  static clone(cartesian, result) {
    if (!defined(cartesian)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Cartesian2(cartesian.x, cartesian.y);
    }

    result.x = cartesian.x;
    result.y = cartesian.y;
    return result;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Cartesian2} value 要打包的值。
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
    array[startingIndex] = value.y;

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Cartesian2} [result] 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Cartesian2();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex];
    return result;
  }

  /**
   * 将Cartesian2数组展平为分量数组。
   *
   * @param {Cartesian2[]} array 要打包的笛卡尔坐标数组。
   * @param {number[]} [result] 存储结果的数组。如果是类型化数组，则必须包含array.length * 2个分量，否则将抛出{@link DeveloperError}。如果是常规数组，则会调整大小以具有(array.length * 2)个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 2;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): See https://github.com/CesiumGS/cesium/pull/13302.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "If result is a typed array, it must have exactly array.length * 2 elements",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Cartesian2.pack(array[i], result, i * 2);
    }

    return result;
  }

  /**
   * 将笛卡尔分量数组解包为Cartesian2数组。
   *
   * @param {number[]} array 要解包的分量数组。
   * @param {Cartesian2[]} [result] 存储结果的数组。
   * @returns {Cartesian2[]} 解包后的数组。
   */
  static unpackArray(array, result) {
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
  }

  /**
   * 计算提供的笛卡尔坐标的最大分量值。
   *
   * @param {Cartesian2} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最大分量的值。
   */
  static maximumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.max(cartesian.x, cartesian.y);
  }

  /**
   * 计算提供的笛卡尔坐标的最小分量值。
   *
   * @param {Cartesian2} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最小分量的值。
   */
  static minimumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.min(cartesian.x, cartesian.y);
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最小分量的笛卡尔坐标。
   *
   * @param {Cartesian2} first 要比较的笛卡尔坐标。
   * @param {Cartesian2} second 要比较的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 包含最小分量的笛卡尔坐标。
   */
  static minimumByComponent(first, second, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("first", first);
    Check.typeOf.object("second", second);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);

    return result;
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最大分量的笛卡尔坐标。
   *
   * @param {Cartesian2} first 要比较的笛卡尔坐标。
   * @param {Cartesian2} second 要比较的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 包含最大分量的笛卡尔坐标。
   */
  static maximumByComponent(first, second, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("first", first);
    Check.typeOf.object("second", second);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    return result;
  }

  /**
   * 将值限制在两个值之间。
   *
   * @param {Cartesian2} value 要限制的值。
   * @param {Cartesian2} min 最小边界。
   * @param {Cartesian2} max 最大边界。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 限制后的值，满足 min <= result <= max。
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

    result.x = x;
    result.y = y;

    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的平方模长。
   *
   * @param {Cartesian2} cartesian 要计算平方模长的笛卡尔实例。
   * @returns {number} 平方模长。
   */
  static magnitudeSquared(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
  }

  /**
   * 计算笛卡尔坐标的模长（长度）。
   *
   * @param {Cartesian2} cartesian 要计算模长的笛卡尔实例。
   * @returns {number} 模长。
   */
  static magnitude(cartesian) {
    return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
  }

  /**
   * 计算两点之间的距离。
   *
   * @param {Cartesian2} left 要计算距离的的第一个点。
   * @param {Cartesian2} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离。
   *
   * @example
   * // 返回 1.0
   * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(2.0, 0.0));
   */
  static distance(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian2.subtract(left, right, distanceScratch);
    return Cartesian2.magnitude(distanceScratch);
  }

  /**
   * 计算两点之间的平方距离。使用此函数
   * 比较平方距离比使用{@link Cartesian2#distance}比较距离更高效。
   *
   * @param {Cartesian2} left 要计算距离的的第一个点。
   * @param {Cartesian2} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离平方。
   *
   * @example
   * // 返回 4.0，不是 2.0
   * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(3.0, 0.0));
   */
  static distanceSquared(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian2.subtract(left, right, distanceScratch);
    return Cartesian2.magnitudeSquared(distanceScratch);
  }

  /**
   * 计算提供的笛卡尔坐标的归一化形式。
   *
   * @param {Cartesian2} cartesian 要归一化的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static normalize(cartesian, result) {
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
  }

  /**
   * 计算两个笛卡尔坐标的点积（标量积）。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @returns {number} 点积。
   */
  static dot(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    return left.x * right.x + left.y * right.y;
  }

  /**
   * 计算将输入向量的Z坐标隐式设为0后得到的叉积模长。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @returns {number} 叉积。
   */
  static cross(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    return left.x * right.y - left.y * right.x;
  }

  /**
   * 计算两个笛卡尔坐标的分量积。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static multiplyComponents(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x * right.x;
    result.y = left.y * right.y;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量商。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static divideComponents(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x / right.x;
    result.y = left.y / right.y;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量和。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static add(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x + right.x;
    result.y = left.y + right.y;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量差。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static subtract(left, right, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = left.x - right.x;
    result.y = left.y - right.y;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量乘以提供的标量。
   *
   * @param {Cartesian2} cartesian 要缩放的笛卡尔坐标。
   * @param {number} scalar 要相乘的标量。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static multiplyByScalar(cartesian, scalar, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量除以提供的标量。
   *
   * @param {Cartesian2} cartesian 要除的笛卡尔坐标。
   * @param {number} scalar 要除以的标量。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static divideByScalar(cartesian, scalar, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.number("scalar", scalar);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    return result;
  }

  /**
   * 对提供的笛卡尔坐标取反。
   *
   * @param {Cartesian2} cartesian 要取反的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static negate(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = -cartesian.x;
    result.y = -cartesian.y;
    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的绝对值。
   *
   * @param {Cartesian2} cartesian 要计算绝对值的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static abs(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    return result;
  }

  /**
   * 使用提供的笛卡尔坐标计算t处的线性插值或外推。
   *
   * @param {Cartesian2} start t为0.0时对应的值。
   * @param {Cartesian2} end t为1.0时对应的值。
   * @param {number} t 要插值的t点。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数。
   */
  static lerp(start, end, t, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("start", start);
    Check.typeOf.object("end", end);
    Check.typeOf.number("t", t);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    Cartesian2.multiplyByScalar(end, t, lerpScratch);
    result = Cartesian2.multiplyByScalar(start, 1.0 - t, result);
    return Cartesian2.add(lerpScratch, result, result);
  }

  /**
   * 返回提供的笛卡尔坐标之间的角度（弧度）。
   *
   * @param {Cartesian2} left 第一个笛卡尔坐标。
   * @param {Cartesian2} right 第二个笛卡尔坐标。
   * @returns {number} 笛卡尔坐标之间的角度。
   */
  static angleBetween(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian2.normalize(left, angleBetweenScratch);
    Cartesian2.normalize(right, angleBetweenScratch2);
    return CesiumMath.acosClamped(
      Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2),
    );
  }

  /**
   * 返回与提供的笛卡尔坐标最正交的轴。
   *
   * @param {Cartesian2} cartesian 要在其上查找最正交轴的笛卡尔坐标。
   * @param {Cartesian2} result 存储结果的对象。
   * @returns {Cartesian2} 最正交的轴。
   */
  static mostOrthogonalAxis(cartesian, result) {
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
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian2} [left] 第一个笛卡尔坐标。
   * @param {Cartesian2} [right] 第二个笛卡尔坐标。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y)
    );
  }

  /**
   * @param {Cartesian2} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(cartesian, array, offset) {
    return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian2} [left] 第一个笛卡尔坐标。
   * @param {Cartesian2} [right] 第二个笛卡尔坐标。
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
        ))
    );
  }

  /**
   * 复制此Cartesian2实例。
   *
   * @param {Cartesian2} [result] 存储结果的对象。
   * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
   */
  clone(result) {
    return Cartesian2.clone(this, result);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian2} [right] 右侧的笛卡尔坐标。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return Cartesian2.equals(this, right);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian2} [right] 右侧的笛卡尔坐标。
   * @param {number} [relativeEpsilon=0] 用于相等性测试的相对epsilon容差。
   * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对epsilon容差。
   * @returns {boolean} 如果它们在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return Cartesian2.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon,
    );
  }

  /**
   * 创建表示此笛卡尔坐标的字符串，格式为'(x, y)'。
   *
   * @returns {string} 表示此笛卡尔坐标的字符串，格式为'(x, y)'。
   */
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

/**
 * 从现有Cartesian3创建Cartesian2实例。这只需
 * 取Cartesian3的x和y属性并丢弃z。
 * @function
 *
 * @param {Cartesian3} cartesian 要从中创建Cartesian2实例的Cartesian3实例。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
 */
Cartesian2.fromCartesian3 = Cartesian2.clone;

/**
 * 从现有Cartesian4创建Cartesian2实例。这只需
 * 取Cartesian4的x和y属性并丢弃z和w。
 * @function
 *
 * @param {Cartesian4} cartesian 要从中创建Cartesian2实例的Cartesian4实例。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
 */
Cartesian2.fromCartesian4 = Cartesian2.clone;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Cartesian2.packedLength = 2;

/**
 * 从数组中两个连续元素创建Cartesian2。
 * @function
 *
 * @param {number[]} array 其两个连续元素分别对应x和y分量的数组。
 * @param {number} [startingIndex=0] 第一个元素（对应x分量）在数组中的偏移量。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数；如果未提供则返回新的Cartesian2实例。
 *
 * @example
 * // 创建具有(1.0, 2.0)的Cartesian2
 * const v = [1.0, 2.0];
 * const p = Cesium.Cartesian2.fromArray(v);
 *
 * // 使用数组偏移量创建具有(1.0, 2.0)的Cartesian2
 * const v2 = [0.0, 0.0, 1.0, 2.0];
 * const p2 = Cesium.Cartesian2.fromArray(v2, 2);
 */
Cartesian2.fromArray = Cartesian2.unpack;

const distanceScratch = new Cartesian2();

const lerpScratch = new Cartesian2();

const angleBetweenScratch = new Cartesian2();
const angleBetweenScratch2 = new Cartesian2();

const mostOrthogonalAxisScratch = new Cartesian2();

/**
 * 初始化为(0.0, 0.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ZERO = Object.freeze(new Cartesian2(0.0, 0.0));

/**
 * 初始化为(1.0, 1.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ONE = Object.freeze(new Cartesian2(1.0, 1.0));

/**
 * 初始化为(1.0, 0.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_X = Object.freeze(new Cartesian2(1.0, 0.0));

/**
 * 初始化为(0.0, 1.0)的不可变Cartesian2实例。
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_Y = Object.freeze(new Cartesian2(0.0, 1.0));

export default Cartesian2;
