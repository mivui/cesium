// @ts-check

import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/** @import {TypedArray} from "./globalTypes.js"; */
/** @import Color from "./Color.js"; */

/**
 * 四维笛卡尔点。
 *
 * @see Cartesian2
 * @see Cartesian3
 * @see Packable
 */
class Cartesian4 {
  /**
   * @param {number} [x=0.0] The X component.
   * @param {number} [y=0.0] The Y component.
   * @param {number} [z=0.0] The Z component.
   * @param {number} [w=0.0] The W component.
   */
  constructor(x, y, z, w) {
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

  /**
   * W分量。
   * @type {number}
   * @default 0.0
   */
    this.w = w ?? 0.0;
  }

  /**
   * 从x、y、z和w坐标创建Cartesian4实例。
   *
   * @param {number} x x坐标。
   * @param {number} y y坐标。
   * @param {number} z z坐标。
   * @param {number} w w坐标。
   * @param {Cartesian4} [result] 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。
   */
  static fromElements(x, y, z, w, result) {
    if (!defined(result)) {
      return new Cartesian4(x, y, z, w);
    }

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  /**
   * 从{@link Color}创建Cartesian4实例。<code>red</code>、<code>green</code>、<code>blue</code>、
   * 和<code>alpha</code>分别映射到<code>x</code>、<code>y</code>、<code>z</code>和<code>w</code>。
   *
   * @param {Color} color 源颜色。
   * @param {Cartesian4} [result] 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。
   */
  static fromColor(color, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("color", color);
    //>>includeEnd('debug');
    if (!defined(result)) {
      return new Cartesian4(color.red, color.green, color.blue, color.alpha);
    }

    result.x = color.red;
    result.y = color.green;
    result.z = color.blue;
    result.w = color.alpha;
    return result;
  }

  /**
   * 复制Cartesian4实例。
   *
   * @param {Cartesian4} cartesian 要复制的笛卡尔坐标。
   * @param {Cartesian4} [result] 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。（如果cartesian未定义则返回undefined）
   */
  static clone(cartesian, result) {
    if (!defined(cartesian)) {
      return undefined;
    }

    if (!defined(result)) {
      return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    }

    result.x = cartesian.x;
    result.y = cartesian.y;
    result.z = cartesian.z;
    result.w = cartesian.w;
    return result;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {Cartesian4} value 要打包的值。
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
    array[startingIndex++] = value.z;
    array[startingIndex] = value.w;

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {Cartesian4} [result] 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new Cartesian4();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex++];
    result.z = array[startingIndex++];
    result.w = array[startingIndex];
    return result;
  }

  /**
   * 将Cartesian4数组展平为分量数组。
   *
   * @param {Cartesian4[]} array 要打包的笛卡尔坐标数组。
   * @param {number[]} [result] 存储结果的数组。如果是类型化数组，则必须包含array.length * 4个分量，否则将抛出{@link DeveloperError}。如果是常规数组，则会调整大小以具有(array.length * 4)个元素。
   * @returns {number[]} 打包后的数组。
   */
  static packArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    const length = array.length;
    const resultLength = length * 4;
    if (!defined(result)) {
      result = new Array(resultLength);
      // @ts-expect-error TODO(tsd-jsdoc): See https://github.com/CesiumGS/cesium/pull/13302.
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(
        "If result is a typed array, it must have exactly array.length * 4 elements",
      );
      //>>includeEnd('debug');
    } else if (result.length !== resultLength) {
      /** @type {number[]} */ (result).length = resultLength;
    }

    for (let i = 0; i < length; ++i) {
      Cartesian4.pack(array[i], result, i * 4);
    }

    return result;
  }

  /**
   * 将笛卡尔分量数组解包为Cartesian4数组。
   *
   * @param {number[]} array 要解包的分量数组。
   * @param {Cartesian4[]} [result] 存储结果的数组。
   * @returns {Cartesian4[]} 解包后的数组。
   */
  static unpackArray(array, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 4);
    if (array.length % 4 !== 0) {
      throw new DeveloperError("array length must be a multiple of 4.");
    }
    //>>includeEnd('debug');

    const length = array.length;
    if (!defined(result)) {
      result = new Array(length / 4);
    } else {
      result.length = length / 4;
    }

    for (let i = 0; i < length; i += 4) {
      const index = i / 4;
      result[index] = Cartesian4.unpack(array, i, result[index]);
    }
    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的最大分量值。
   *
   * @param {Cartesian4} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最大分量的值。
   */
  static maximumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }

  /**
   * 计算提供的笛卡尔坐标的最小分量值。
   *
   * @param {Cartesian4} cartesian 要使用的笛卡尔坐标。
   * @returns {number} 最小分量的值。
   */
  static minimumComponent(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最小分量的笛卡尔坐标。
   *
   * @param {Cartesian4} first 要比较的笛卡尔坐标。
   * @param {Cartesian4} second 要比较的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 包含最小分量的笛卡尔坐标。
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
    result.w = Math.min(first.w, second.w);

    return result;
  }

  /**
   * 比较两个笛卡尔坐标并计算包含两者最大分量的笛卡尔坐标。
   *
   * @param {Cartesian4} first 要比较的笛卡尔坐标。
   * @param {Cartesian4} second 要比较的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 包含最大分量的笛卡尔坐标。
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
    result.w = Math.max(first.w, second.w);

    return result;
  }

  /**
   * 将值限制在两个值之间。
   *
   * @param {Cartesian4} value 要限制的值。
   * @param {Cartesian4} min 最小边界。
   * @param {Cartesian4} max 最大边界。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 限制后的值，满足 min <= result <= max。
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
    const w = CesiumMath.clamp(value.w, min.w, max.w);

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;

    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的平方模长。
   *
   * @param {Cartesian4} cartesian 要计算平方模长的笛卡尔实例。
   * @returns {number} 平方模长。
   */
  static magnitudeSquared(cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    return (
      cartesian.x * cartesian.x +
      cartesian.y * cartesian.y +
      cartesian.z * cartesian.z +
      cartesian.w * cartesian.w
    );
  }

  /**
   * 计算笛卡尔坐标的模长（长度）。
   *
   * @param {Cartesian4} cartesian 要计算模长的笛卡尔实例。
   * @returns {number} 模长。
   */
  static magnitude(cartesian) {
    return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
  }

  /**
   * 计算两点之间的4维空间距离。
   *
   * @param {Cartesian4} left 要计算距离的的第一个点。
   * @param {Cartesian4} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离。
   *
   * @example
   * // 返回 1.0
   * const d = Cesium.Cartesian4.distance(
   *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
   *   new Cesium.Cartesian4(2.0, 0.0, 0.0, 0.0));
   */
  static distance(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian4.subtract(left, right, distanceScratch);
    return Cartesian4.magnitude(distanceScratch);
  }

  /**
   * 计算两点之间的平方距离。使用此函数
   * 比较平方距离比使用{@link Cartesian4#distance}比较距离更高效。
   *
   * @param {Cartesian4} left 要计算距离的的第一个点。
   * @param {Cartesian4} right 要计算距离的第二个点。
   * @returns {number} 两点之间的距离平方。
   *
   * @example
   * // 返回 4.0，不是 2.0
   * const d = Cesium.Cartesian4.distance(
   *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
   *   new Cesium.Cartesian4(3.0, 0.0, 0.0, 0.0));
   */
  static distanceSquared(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    Cartesian4.subtract(left, right, distanceScratch);
    return Cartesian4.magnitudeSquared(distanceScratch);
  }

  /**
   * 计算提供的笛卡尔坐标的归一化形式。
   *
   * @param {Cartesian4} cartesian 要归一化的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   */
  static normalize(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const magnitude = Cartesian4.magnitude(cartesian);

    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    result.z = cartesian.z / magnitude;
    result.w = cartesian.w / magnitude;

    //>>includeStart('debug', pragmas.debug);
    if (
      isNaN(result.x) ||
      isNaN(result.y) ||
      isNaN(result.z) ||
      isNaN(result.w)
    ) {
      throw new DeveloperError("normalized result is not a number");
    }
    //>>includeEnd('debug');

    return result;
  }

  /**
   * 计算两个笛卡尔坐标的点积（标量积）。
   *
   * @param {Cartesian4} left 第一个笛卡尔坐标。
   * @param {Cartesian4} right 第二个笛卡尔坐标。
   * @returns {number} 点积。
   */
  static dot(left, right) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("left", left);
    Check.typeOf.object("right", right);
    //>>includeEnd('debug');

    return (
      left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w
    );
  }

  /**
   * 计算两个笛卡尔坐标的分量积。
   *
   * @param {Cartesian4} left 第一个笛卡尔坐标。
   * @param {Cartesian4} right 第二个笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = left.w * right.w;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量商。
   *
   * @param {Cartesian4} left 第一个笛卡尔坐标。
   * @param {Cartesian4} right 第二个笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = left.w / right.w;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量和。
   *
   * @param {Cartesian4} left 第一个笛卡尔坐标。
   * @param {Cartesian4} right 第二个笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = left.w + right.w;
    return result;
  }

  /**
   * 计算两个笛卡尔坐标的分量差。
   *
   * @param {Cartesian4} left 第一个笛卡尔坐标。
   * @param {Cartesian4} right 第二个笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = left.w - right.w;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量乘以提供的标量。
   *
   * @param {Cartesian4} cartesian 要缩放的笛卡尔坐标。
   * @param {number} scalar 要相乘的标量。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = cartesian.w * scalar;
    return result;
  }

  /**
   * 将提供的笛卡尔坐标按分量除以提供的标量。
   *
   * @param {Cartesian4} cartesian 要除的笛卡尔坐标。
   * @param {number} scalar 要除以的标量。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
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
    result.w = cartesian.w / scalar;
    return result;
  }

  /**
   * 对提供的笛卡尔坐标取反。
   *
   * @param {Cartesian4} cartesian 要取反的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   */
  static negate(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = -cartesian.x;
    result.y = -cartesian.y;
    result.z = -cartesian.z;
    result.w = -cartesian.w;
    return result;
  }

  /**
   * 计算提供的笛卡尔坐标的绝对值。
   *
   * @param {Cartesian4} cartesian 要计算绝对值的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   */
  static abs(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    result.z = Math.abs(cartesian.z);
    result.w = Math.abs(cartesian.w);
    return result;
  }

  /**
   * 使用提供的笛卡尔坐标计算t处的线性插值或外推。
   *
   * @param {Cartesian4} start t为0.0时对应的值。
   * @param {Cartesian4}end t为1.0时对应的值。
   * @param {number} t 要插值的t点。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数。
   */
  static lerp(start, end, t, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("start", start);
    Check.typeOf.object("end", end);
    Check.typeOf.number("t", t);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    Cartesian4.multiplyByScalar(end, t, lerpScratch);
    result = Cartesian4.multiplyByScalar(start, 1.0 - t, result);
    return Cartesian4.add(lerpScratch, result, result);
  }

  /**
   * 返回与提供的笛卡尔坐标最正交的轴。
   *
   * @param {Cartesian4} cartesian 要在其上查找最正交轴的笛卡尔坐标。
   * @param {Cartesian4} result 存储结果的对象。
   * @returns {Cartesian4} 最正交的轴。
   */
  static mostOrthogonalAxis(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("cartesian", cartesian);
    Check.typeOf.object("result", result);
    //>>includeEnd('debug');

    const f = Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch);
    Cartesian4.abs(f, f);

    if (f.x <= f.y) {
      if (f.x <= f.z) {
        if (f.x <= f.w) {
          result = Cartesian4.clone(Cartesian4.UNIT_X, result);
        } else {
          result = Cartesian4.clone(Cartesian4.UNIT_W, result);
        }
      } else if (f.z <= f.w) {
        result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
      } else {
        result = Cartesian4.clone(Cartesian4.UNIT_W, result);
      }
    } else if (f.y <= f.z) {
      if (f.y <= f.w) {
        result = Cartesian4.clone(Cartesian4.UNIT_Y, result);
      } else {
        result = Cartesian4.clone(Cartesian4.UNIT_W, result);
      }
    } else if (f.z <= f.w) {
      result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
    } else {
      result = Cartesian4.clone(Cartesian4.UNIT_W, result);
    }

    return result;
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian4} [left] 第一个笛卡尔坐标。
   * @param {Cartesian4} [right] 第二个笛卡尔坐标。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y &&
        left.z === right.z &&
        left.w === right.w)
    );
  }

  /**
   * @param {Cartesian4} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @private
   */
  static equalsArray(cartesian, array, offset) {
    return (
      cartesian.x === array[offset] &&
      cartesian.y === array[offset + 1] &&
      cartesian.z === array[offset + 2] &&
      cartesian.w === array[offset + 3]
    );
  }

  /**
   * 逐分量比较提供的笛卡尔坐标，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian4} [left] 第一个笛卡尔坐标。
   * @param {Cartesian4} [right] 第二个笛卡尔坐标。
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
        ) &&
        CesiumMath.equalsEpsilon(
          left.w,
          right.w,
          relativeEpsilon,
          absoluteEpsilon,
        ))
    );
  }

  /**
   * 复制此Cartesian4实例。
   *
   * @param {Cartesian4} [result] 存储结果的对象。
   * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。
   */
  clone(result) {
    return Cartesian4.clone(this, result);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian4} [right] 右侧的笛卡尔坐标。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return Cartesian4.equals(this, right);
  }

  /**
   * 逐分量将此笛卡尔坐标与提供的笛卡尔坐标进行比较，如果通过绝对或相对容差测试则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {Cartesian4} [right] 右侧的笛卡尔坐标。
   * @param {number} [relativeEpsilon=0] 用于相等性测试的相对epsilon容差。
   * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对epsilon容差。
   * @returns {boolean} 如果它们在提供的epsilon范围内则返回<code>true</code>，否则返回<code>false</code>。
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return Cartesian4.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon,
    );
  }

  /**
   * 创建表示此笛卡尔坐标的字符串，格式为'(x, y, z, w)'。
   *
   * @returns {string} 表示此笛卡尔坐标的字符串，格式为'(x, y, z, w)'。
   */
  toString() {
    return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  /**
   * 将任意浮点值打包为可使用uint8表示的4个值。
   *
   * @param {number} value 浮点数。
   * @param {Cartesian4} [result] 将包含打包浮点数的Cartesian4。
   * @returns {Cartesian4} 表示打包到x、y、z和w值中的浮点数的Cartesian4。
   */
  static packFloat(value, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number("value", value);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Cartesian4();
    }

    // scratchU8Array and scratchF32Array are views into the same buffer
    scratchF32Array[0] = value;

    if (littleEndian) {
      result.x = scratchU8Array[0];
      result.y = scratchU8Array[1];
      result.z = scratchU8Array[2];
      result.w = scratchU8Array[3];
    } else {
      // convert from big-endian to little-endian
      result.x = scratchU8Array[3];
      result.y = scratchU8Array[2];
      result.z = scratchU8Array[1];
      result.w = scratchU8Array[0];
    }
    return result;
  }

  /**
   * 解包使用Cartesian4.packFloat打包的浮点数。
   *
   * @param {Cartesian4} packedFloat 包含打包为可使用uint8表示的4个值的浮点数的Cartesian4。
   * @returns {number} 解包后的浮点数。
   * @private
   */
  static unpackFloat(packedFloat) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("packedFloat", packedFloat);
    //>>includeEnd('debug');

    // scratchU8Array and scratchF32Array are views into the same buffer
    if (littleEndian) {
      scratchU8Array[0] = packedFloat.x;
      scratchU8Array[1] = packedFloat.y;
      scratchU8Array[2] = packedFloat.z;
      scratchU8Array[3] = packedFloat.w;
    } else {
      // convert from little-endian to big-endian
      scratchU8Array[0] = packedFloat.w;
      scratchU8Array[1] = packedFloat.z;
      scratchU8Array[2] = packedFloat.y;
      scratchU8Array[3] = packedFloat.x;
    }
    return scratchF32Array[0];
  }
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Cartesian4.packedLength = 4;

/**
 * 从数组中四个连续元素创建Cartesian4。
 * @function
 *
 * @param {number[]} array 其四个连续元素分别对应x、y、z和w分量的数组。
 * @param {number} [startingIndex=0] 第一个元素（对应x分量）在数组中的偏移量。
 * @param {Cartesian4} [result] 存储结果的对象。
 * @returns {Cartesian4} 修改后的结果参数；如果未提供则返回新的Cartesian4实例。
 *
 * @example
 * // 创建具有(1.0, 2.0, 3.0, 4.0)的Cartesian4
 * const v = [1.0, 2.0, 3.0, 4.0];
 * const p = Cesium.Cartesian4.fromArray(v);
 *
 * // 使用数组偏移量创建具有(1.0, 2.0, 3.0, 4.0)的Cartesian4
 * const v2 = [0.0, 0.0, 1.0, 2.0, 3.0, 4.0];
 * const p2 = Cesium.Cartesian4.fromArray(v2, 2);
 */
Cartesian4.fromArray = Cartesian4.unpack;

const distanceScratch = new Cartesian4();

const lerpScratch = new Cartesian4();

const mostOrthogonalAxisScratch = new Cartesian4();

/**
 * 初始化为(0.0, 0.0, 0.0, 0.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.ZERO = Object.freeze(new Cartesian4(0.0, 0.0, 0.0, 0.0));

/**
 * 初始化为(1.0, 1.0, 1.0, 1.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.ONE = Object.freeze(new Cartesian4(1.0, 1.0, 1.0, 1.0));

/**
 * 初始化为(1.0, 0.0, 0.0, 0.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_X = Object.freeze(new Cartesian4(1.0, 0.0, 0.0, 0.0));

/**
 * 初始化为(0.0, 1.0, 0.0, 0.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_Y = Object.freeze(new Cartesian4(0.0, 1.0, 0.0, 0.0));

/**
 * 初始化为(0.0, 0.0, 1.0, 0.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_Z = Object.freeze(new Cartesian4(0.0, 0.0, 1.0, 0.0));

/**
 * 初始化为(0.0, 0.0, 0.0, 1.0)的不可变Cartesian4实例。
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_W = Object.freeze(new Cartesian4(0.0, 0.0, 0.0, 1.0));

// scratchU8Array and scratchF32Array are views into the same buffer
const scratchF32Array = new Float32Array(1);
const scratchU8Array = new Uint8Array(scratchF32Array.buffer);

const testU32 = new Uint32Array([0x11223344]);
const testU8 = new Uint8Array(testU32.buffer);
const littleEndian = testU8[0] === 0x44;

export default Cartesian4;
