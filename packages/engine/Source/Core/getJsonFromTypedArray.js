import getStringFromTypedArray from "./getStringFromTypedArray.js";

/**
 * 解析 Uint8Array 中的 JSON。
 *
 * @function
 *
 * @param {Uint8Array} uint8Array 要从中读取的 Uint8Array。
 * @param {number} [byteOffset=0] 开始读取的字节偏移量。
 * @param {number} [byteLength] 要读取的字节长度。如果省略 byteLength，则读取缓冲区的其余部分。
 * @returns {object} 包含已解析的 JSON 的对象。
 *
 * @private
 */
function getJsonFromTypedArray(uint8Array, byteOffset, byteLength) {
  return JSON.parse(
    getStringFromTypedArray(uint8Array, byteOffset, byteLength),
  );
}

export default getJsonFromTypedArray;
