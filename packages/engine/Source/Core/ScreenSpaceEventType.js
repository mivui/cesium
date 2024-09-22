/**
 * 此枚举类型用于对鼠标事件进行分类：按下、向上、单击、双击、移动和按住按钮时的移动。
 *
 * @enum {number}
 */
const ScreenSpaceEventType = {
  /**
   * 表示鼠标左键按下事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_DOWN: 0,

  /**
   * 表示鼠标左键松开事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_UP: 1,

  /**
   * 表示鼠标左键单击事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_CLICK: 2,

  /**
   * 表示鼠标左键双击事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_DOUBLE_CLICK: 3,

  /**
   * 表示鼠标左键按下事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_DOWN: 5,

  /**
   * 表示鼠标右键松开事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_UP: 6,

  /**
   * 表示鼠标右键单击事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_CLICK: 7,

  /**
   * 表示鼠标中键按下事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_DOWN: 10,

  /**
   * 表示鼠标中键向上事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_UP: 11,

  /**
   * 表示鼠标中键单击事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_CLICK: 12,

  /**
   * 表示鼠标移动事件。
   *
   * @type {number}
   * @constant
   */
  MOUSE_MOVE: 15,

  /**
   * 表示鼠标滚轮事件。
   *
   * @type {number}
   * @constant
   */
  WHEEL: 16,

  /**
   * 表示触摸表面上双指事件的开始。
   *
   * @type {number}
   * @constant
   */
  PINCH_START: 17,

  /**
   * 表示触摸表面上的双指事件的结束。
   *
   * @type {number}
   * @constant
   */
  PINCH_END: 18,

  /**
   * 表示触摸表面上的双指事件更改。
   *
   * @type {number}
   * @constant
   */
  PINCH_MOVE: 19,
};
export default Object.freeze(ScreenSpaceEventType);
