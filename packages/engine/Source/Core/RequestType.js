// @ts-check

/**
 * 标识请求类型的枚举。用于更细粒度的日志记录和优先级排序。
 *
 * @enum {number}
 */
const RequestType = {
  /**
   * 地形请求。
   *
   * @type {number}
   * @constant
   */
  TERRAIN: 0,

  /**
   * 影像请求。
   *
   * @type {number}
   * @constant
   */
  IMAGERY: 1,

  /**
   * 3D瓦片请求。
   *
   * @type {number}
   * @constant
   */
  TILES3D: 2,

  /**
   * 其他请求。
   *
   * @type {number}
   * @constant
   */
  OTHER: 3,
};

Object.freeze(RequestType);

export default RequestType;
