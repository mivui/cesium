/**
 * 列举用于与摄像机交互的可用输入。
 *
 * @enum {number}
 */
const CameraEventType = {
  /**
   * 按下鼠标左键，然后移动鼠标并释放按钮。
   *
   * @type {number}
   * @constant
   */
  LEFT_DRAG: 0,

  /**
   * 按下鼠标右键，然后移动鼠标并释放按钮。
   *
   * @type {number}
   * @constant
   */
  RIGHT_DRAG: 1,

  /**
   * 按下鼠标中键，然后移动鼠标并释放按钮。
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
   * 双指触摸表面。
   *
   * @type {number}
   * @constant
   */
  PINCH: 4,
};
export default Object.freeze(CameraEventType);
