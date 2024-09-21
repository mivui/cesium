/**
 * ArcType定义了连接顶点的路径。
 *
 * @enum {number}
 */
const ArcType = {
  /**
   * 不符合椭球表面的直线。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 遵循测地线路径。
   *
   * @type {number}
   * @constant
   */
  GEODESIC: 1,

  /**
   * 沿着弯道或斜路走。
   *
   * @type {number}
   * @constant
   */
  RHUMB: 2,
};
export default Object.freeze(ArcType);
