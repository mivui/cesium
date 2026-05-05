/**
 * 用于为参数设置默认值的实用工具。
 *
 * @namespace Frozen
 */
const Frozen = {};

/**
 * 一个冻结的空对象，可用作以对象字面量形式传递的选项的默认值。
 * @type {object}
 * @memberof Frozen
 */
Frozen.EMPTY_OBJECT = Object.freeze({});

/**
 * 一个冻结的空数组，可用作以数组字面量形式传递的选项的默认值。
 * @type {array}
 * @memberof Frozen
 */
Frozen.EMPTY_ARRAY = Object.freeze([]);

export default Frozen;
