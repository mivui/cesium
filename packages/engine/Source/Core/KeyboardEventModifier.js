/**
 * 此枚举类型用于表示键盘修饰符。这些是键
 * 以及其他事件类型一起被按住。
 *
 * @enum {number}
 */
const KeyboardEventModifier = {
  /**
   * 表示按住 Shift 键。
   *
   * @type {number}
   * @constant
   */
  SHIFT: 0,

  /**
   * 表示按住 control 键。
   *
   * @type {number}
   * @constant
   */
  CTRL: 1,

  /**
   * 表示按住的 alt 键。
   *
   * @type {number}
   * @constant
   */
  ALT: 2,
};
export default Object.freeze(KeyboardEventModifier);
