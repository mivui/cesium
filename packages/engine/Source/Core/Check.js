import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 包含用于检查提供的参数是否为指定类型的函数
 * 或满足指定条件
 */
const Check = {};

/**
 * 包含类型检查函数，全部使用 typeof 运算符
 */
Check.typeOf = {};

function getUndefinedErrorMessage(name) {
  return `${name} is required, actual value was undefined`;
}

function getFailedTypeErrorMessage(actual, expected, name) {
  return `Expected ${name} to be typeof ${expected}, actual typeof was ${actual}`;
}

/**
 * 如果未定义 test，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 需要检查的值
 * @exception {DeveloperError}  必须定义测试
 */
Check.defined = function (name, test) {
  if (!defined(test)) {
    throw new DeveloperError(getUndefinedErrorMessage(name));
  }
};

/**
 * 如果 test 不是 typeof 'function' 则引发
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test 必须是 typeof 'function'
 */
Check.typeOf.func = function (name, test) {
  if (typeof test !== "function") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "function", name)
    );
  }
};

/**
 * 如果 test 不是 typeof 'string' ，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test 必须是 typeof 'string'
 */
Check.typeOf.string = function (name, test) {
  if (typeof test !== "string") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "string", name)
    );
  }
};

/**
 * 如果 test 不是 typeof 'number' ，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} 测试必须是 typeof 'number'
 */
Check.typeOf.number = function (name, test) {
  if (typeof test !== "number") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "number", name)
    );
  }
};

/**
 * 如果 test 不是 typeof 'number' 且小于 limit，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} 测试必须是 'number' 类型且小于 limit
 */
Check.typeOf.number.lessThan = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test >= limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than ${limit}, actual value was ${test}`
    );
  }
};

/**
 * 如果 test 不是 typeof 'number' 且小于或等于 limit，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} 测试必须是 typeof 'number' 且小于或等于 limit
 */
Check.typeOf.number.lessThanOrEquals = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test > limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than or equal to ${limit}, actual value was ${test}`
    );
  }
};

/**
 * 如果 test 不是 typeof 'number' 且大于 limit，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} 测试必须是 'number' 类型且大于 limit
 */
Check.typeOf.number.greaterThan = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test <= limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than ${limit}, actual value was ${test}`
    );
  }
};

/**
 * 如果 test 不是 typeof 'number' 且大于或等于 limit，则引发
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} 测试必须是 typeof 'number' 且大于或等于 limit
 */
Check.typeOf.number.greaterThanOrEquals = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test < limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than or equal to ${limit}, actual value was ${test}`
    );
  }
};

/**
 * 如果 test 不是 typeof 'object' ，则抛出
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test 必须是 typeof 'object'
 */
Check.typeOf.object = function (name, test) {
  if (typeof test !== "object") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "object", name)
    );
  }
};

/**
 * 如果 test 不是 typeof 'boolean'，则引发
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test 必须是 typeof 'boolean'
 */
Check.typeOf.bool = function (name, test) {
  if (typeof test !== "boolean") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "boolean", name)
    );
  }
};

/**
 * 如果 test 不是 'bigint' 的类型，则引发
 *
 * @param {string} name 正在测试的变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test 必须是 typeof 'bigint'
 */
Check.typeOf.bigint = function (name, test) {
  if (typeof test !== "bigint") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "bigint", name)
    );
  }
};

/**
 * 如果 test1 和 test2 不是 typeof 'number' 且值不相等，则引发
 *
 * @param {string} name1 被测试的第一个变量的名称
 * @param {string} name2 正在测试的第二个变量的名称
 * @param {*} test1 要测试的值
 * @param {*} test2 要测试的值
 * @exception {DeveloperError} test1 和 test2 应为 'number' 类型，且值相等
 */
Check.typeOf.number.equals = function (name1, name2, test1, test2) {
  Check.typeOf.number(name1, test1);
  Check.typeOf.number(name2, test2);
  if (test1 !== test2) {
    throw new DeveloperError(
      `${name1} must be equal to ${name2}, the actual values are ${test1} and ${test2}`
    );
  }
};
export default Check;
