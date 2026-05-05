// @ts-check

/**
 * 枚举可用于与相机交互的输入。
 *
 * @enum {number}
 */
const CameraEventType = {
  /**
   * 按下鼠标左键,移动鼠标,然后释放按钮。
   *
   * @type {number}
   * @constant
   */
  LEFT_DRAG: 0,

  /**
   * 按下鼠标右键,移动鼠标,然后释放按钮。
   *
   * @type {number}
   * @constant
   */
  RIGHT_DRAG: 1,

  /**
   * 按下鼠标中键,移动鼠标,然后释放按钮。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_DRAG: 2,

  /**
   * 滚动鼠标中键。
   *
   * @type {number}
   * @constant
   */
  WHEEL: 3,

  /**
   * 在触控表面上的双指触控。
   *
   * @type {number}
   * @constant
   */
  PINCH: 4,
};

Object.freeze(CameraEventType);

export default CameraEventType;
