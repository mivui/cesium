// @ts-check

/**
 * ArcType 定义连接顶点时应采用的路径。
 *
 * @enum {number}
 */
const ArcType = {
  /**
   * 不贴合椭球表面的直线。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 沿测地线（最短路径）行进。
   *
   * @type {number}
   * @constant
   */
  GEODESIC: 1,

  /**
   * 沿等角航线（恒方位角航线）行进。
   *
   * @type {number}
   * @constant
   */
  RHUMB: 2,
};

Object.freeze(ArcType);

export default ArcType;
