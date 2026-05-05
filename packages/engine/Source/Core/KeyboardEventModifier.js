// @ts-check

/**
 * 此枚举类型表示键盘修饰键。这些是除其他事件类型外按下的键。
 *
 * @enum {number}
 */
const KeyboardEventModifier = {
  /**
   * 表示shift键被按下。
   *
   * @type {number}
   * @constant
   */
  SHIFT: 0,

  /**
   * 表示control键被按下。
   *
   * @type {number}
   * @constant
   */
  CTRL: 1,

  /**
   * 表示alt键被按下。
   *
   * @type {number}
   * @constant
   */
  ALT: 2,
};

Object.freeze(KeyboardEventModifier);

export default KeyboardEventModifier;
