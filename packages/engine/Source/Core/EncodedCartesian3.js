import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 具有 64 位浮点分量的 {@link Cartesian3} 的定点编码，作为两个 {@link Cartesian3}
 * 值，当转换为 32 位浮点并添加时，近似于原始输入。
 * <p>
 * 这用于对顶点缓冲区中的位置进行编码，以便在渲染时不会产生抖动伪影
 * 如 {@link http://help.agi.com/AGIComponents/html/BlogPrecisionsPrecisions.htm|Precisions, Precisions}.
 * </p>
 *
 * @alias EncodedCartesian3
 * @constructor
 *
 * @private
 */
function EncodedCartesian3() {
  /**
   * 每个组件的高位。 位 0 到 22 存储整个值。 不使用位 23 到 31。
   *
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.high = Cartesian3.clone(Cartesian3.ZERO);

  /**
   * 每个组件的低位。 第 7 位到第 22 位存储整个值，第 0 位到第 6 位存储小数。 不使用位 23 到 31。
   *
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.low = Cartesian3.clone(Cartesian3.ZERO);
}

/**
 * 将 64 位浮点值编码为两个浮点值，当转换为
 * 32 位浮点并添加，近似于原始输入。 返回的对象
 * 分别具有 high 和 low 位的 <code>high</code> 和 <code>low</code> 属性。
 * <p>
 * 定点编码遵循 {@link http://help.agi.com/AGIComponents/html/BlogPrecisionsPrecisions.htm|Precisions, Precisions}.
 * </p>
 *
 * @param {number} value 要编码的浮点值。
 * @param {object} [result] 要在其上存储结果的对象。
 * @returns {object} 修改后的结果参数或新实例（如果未提供）。
 *
 * @example
 * const value = 1234567.1234567;
 * const splitValue = Cesium.EncodedCartesian3.encode(value);
 */
EncodedCartesian3.encode = function (value, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = {
      high: 0.0,
      low: 0.0,
    };
  }

  let doubleHigh;
  if (value >= 0.0) {
    doubleHigh = Math.floor(value / 65536.0) * 65536.0;
    result.high = doubleHigh;
    result.low = value - doubleHigh;
  } else {
    doubleHigh = Math.floor(-value / 65536.0) * 65536.0;
    result.high = -doubleHigh;
    result.low = value + doubleHigh;
  }

  return result;
};

const scratchEncode = {
  high: 0.0,
  low: 0.0,
};

/**
 * 将具有 64 位浮点分量的 {@link Cartesian3} 编码为两个 {@link Cartesian3}
 * 值，当转换为 32 位浮点并添加时，近似于原始输入。
 * <p>
 * 定点编码遵循 {@link https://help.agi.com/AGIComponents/html/BlogPrecisionsPrecisions.htm|Precisions, Precisions}.
 * </p>
 *
 * @param {Cartesian3} cartesian 要编码的笛卡尔。
 * @param {EncodedCartesian3} [result] 要在其上存储结果的对象。
 * @returns {EncodedCartesian3} 修改后的结果参数或新的 EncodedCartesian3 实例（如果未提供）。
 *
 * @example
 * const cart = new Cesium.Cartesian3(-10000000.0, 0.0, 10000000.0);
 * const encoded = Cesium.EncodedCartesian3.fromCartesian(cart);
 */
EncodedCartesian3.fromCartesian = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new EncodedCartesian3();
  }

  const high = result.high;
  const low = result.low;

  EncodedCartesian3.encode(cartesian.x, scratchEncode);
  high.x = scratchEncode.high;
  low.x = scratchEncode.low;

  EncodedCartesian3.encode(cartesian.y, scratchEncode);
  high.y = scratchEncode.high;
  low.y = scratchEncode.low;

  EncodedCartesian3.encode(cartesian.z, scratchEncode);
  high.z = scratchEncode.high;
  low.z = scratchEncode.low;

  return result;
};

const encodedP = new EncodedCartesian3();

/**
 * 对提供的<code>笛卡尔进行</code>编码，并将其写入一个具有 <code>high</code>
 * 分量后跟<code>低</code>分量，即 <code>[high.x， high.y， high.z， low.x， low.y， low.z]。</code>
 * <p>
 * 用于创建交错的高精度位置顶点属性。
 * </p>
 *
 * @param {Cartesian3} cartesian 要编码的笛卡尔。
 * @param {number[]} cartesianArray 要写入的数组。
 * @param {number} index 数组中的索引以开始写入。 将编写六个要素。
 *
 * @exception {DeveloperError} index must be a number greater than or equal to 0.
 *
 * @example
 * const positions = [
 *    new Cesium.Cartesian3(),
 *    // ...
 * ];
 * const encodedPositions = new Float32Array(2 * 3 * positions.length);
 * let j = 0;
 * for (let i = 0; i < positions.length; ++i) {
 *   Cesium.EncodedCartesian3.writeElement(positions[i], encodedPositions, j);
 *   j += 6;
 * }
 */
EncodedCartesian3.writeElements = function (cartesian, cartesianArray, index) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesianArray", cartesianArray);
  Check.typeOf.number("index", index);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  //>>includeEnd('debug');

  EncodedCartesian3.fromCartesian(cartesian, encodedP);
  const high = encodedP.high;
  const low = encodedP.low;

  cartesianArray[index] = high.x;
  cartesianArray[index + 1] = high.y;
  cartesianArray[index + 2] = high.z;
  cartesianArray[index + 3] = low.x;
  cartesianArray[index + 4] = low.y;
  cartesianArray[index + 5] = low.z;
};
export default EncodedCartesian3;
