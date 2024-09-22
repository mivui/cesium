/**
 * 此枚举类型用于确定如何压缩地形网格的顶点。
 *
 * @enum {number}
 *
 * @private
 */
const TerrainQuantization = {
  /**
   * 顶点未压缩。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 顶点被压缩为 12 位。
   *
   * @type {number}
   * @constant
   */
  BITS12: 1,
};
export default Object.freeze(TerrainQuantization);
