/**
 * 请求的状态。
 *
 * @enum {number}
 */
const RequestState = {
  /**
   * 初始未颁发状态。
   *
   * @type {number}
   * @constant
   */
  UNISSUED: 0,

  /**
   * 已发布但尚未激活。当空位可用时，将变为激活状态。
   *
   * @type {number}
   * @constant
   */
  ISSUED: 1,

  /**
   * 实际的 http 请求已发送。
   *
   * @type {number}
   * @constant
   */
  ACTIVE: 2,

  /**
   * 请求已成功完成。
   *
   * @type {number}
   * @constant
   */
  RECEIVED: 3,

  /**
   * 由于优先级低，请求已显式或自动取消。
   *
   * @type {number}
   * @constant
   */
  CANCELLED: 4,

  /**
   * 请求失败。
   *
   * @type {number}
   * @constant
   */
  FAILED: 5,
};
export default Object.freeze(RequestState);
