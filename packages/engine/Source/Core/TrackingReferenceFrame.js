// @ts-check

/**
 * 用于标识已知跟踪参考系的常量。
 *
 * @enum {number}
 */
const TrackingReferenceFrame = {
  /**
   * 自动检测算法。用于跟踪实体的参考系将
   * 根据其轨迹自动选择：近地表慢速移动
   * 对象将在实体的局部东-北-上参考系中跟踪，
   * 而卫星等快速对象将使用 VVLH（载体速度，
   * 局部水平）。
   *
   * @type {number}
   * @constant
   */
  AUTODETECT: 0,

  /**
   * 实体的局部东-北-上参考系。
   *
   * @type {number}
   * @constant
   */
  ENU: 1,

  /**
   * 实体的惯性参考系。如果实体没有定义方向
   * 属性，则回退到自动检测算法。
   *
   * @type {number}
   * @constant
   */
  INERTIAL: 2,

  /**
   * 实体的惯性参考系，其方向固定为
   * {@link VelocityOrientationProperty}，忽略其自身方向。
   *
   * @type {number}
   * @constant
   */
  VELOCITY: 3,
};

Object.freeze(TrackingReferenceFrame);

export default TrackingReferenceFrame;
