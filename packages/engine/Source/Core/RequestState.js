// @ts-check

/**
 * 请求的状态。
 *
 * @enum {number}
 */
const RequestState = {
  /**
   * 初始未发出状态。
   *
   * @type {number}
   * @constant
   */
  UNISSUED: 0,

  /**
   * 已发出但尚未激活。当有可用槽位时将变为激活状态。
   *
   * @type {number}
   * @constant
   */
  ISSUED: 1,

  /**
   * 实际的HTTP请求已发送。
   *
   * @type {number}
   * @constant
   */
  ACTIVE: 2,

  /**
   * 请求成功完成。
   *
   * @type {number}
   * @constant
   */
  RECEIVED: 3,

  /**
   * 请求已取消，无论是显式取消还是因优先级低而自动取消。
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

Object.freeze(RequestState);

export default RequestState;
