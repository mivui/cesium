import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 包含用于检查提供的参数是否为指定类型
 * 或满足指定条件的函数
 */
const Check = {};

/**
 * 包含类型检查函数，均使用typeof运算符
 */
Check.typeOf = {};

function getUndefinedErrorMessage(name) {
  return `${name} is required, actual value was undefined`;
}

function getFailedTypeErrorMessage(actual, expected, name) {
  return `Expected ${name} to be typeof ${expected}, actual typeof was ${actual}`;
}

/**
 * 如果test未定义则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要检查的值
 * @exception {DeveloperError} test必须已定义
 */
Check.defined = function (name, test) {
  if (!defined(test)) {
    throw new DeveloperError(getUndefinedErrorMessage(name));
  }
};

/**
 * 如果test的类型不是'function'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'function'
 */
Check.typeOf.func = function (name, test) {
  if (typeof test !== "function") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "function", name),
    );
  }
};

/**
 * 如果test的类型不是'string'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'string'
 */
Check.typeOf.string = function (name, test) {
  if (typeof test !== "string") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "string", name),
    );
  }
};

/**
 * 如果test的类型不是'number'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'number'
 */
Check.typeOf.number = function (name, test) {
  if (typeof test !== "number") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "number", name),
    );
  }
};

/**
 * 如果test的类型不是'number'或小于限制值则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} test的类型必须是'number'且小于限制值
 */
Check.typeOf.number.lessThan = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test >= limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than ${limit}, actual value was ${test}`,
    );
  }
};

/**
 * 如果test的类型不是'number'或小于等于限制值则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} test的类型必须是'number'且小于等于限制值
 */
Check.typeOf.number.lessThanOrEquals = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test > limit) {
    throw new DeveloperError(
      `Expected ${name} to be less than or equal to ${limit}, actual value was ${test}`,
    );
  }
};

/**
 * 如果test的类型不是'number'或大于限制值则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} test的类型必须是'number'且大于限制值
 */
Check.typeOf.number.greaterThan = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test <= limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than ${limit}, actual value was ${test}`,
    );
  }
};

/**
 * 如果test的类型不是'number'或大于等于限制值则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @param {number} limit 要比较的限制值
 * @exception {DeveloperError} test的类型必须是'number'且大于等于限制值
 */
Check.typeOf.number.greaterThanOrEquals = function (name, test, limit) {
  Check.typeOf.number(name, test);
  if (test < limit) {
    throw new DeveloperError(
      `Expected ${name} to be greater than or equal to ${limit}, actual value was ${test}`,
    );
  }
};

/**
 * 如果test的类型不是'object'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'object'
 */
Check.typeOf.object = function (name, test) {
  if (typeof test !== "object") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "object", name),
    );
  }
};

/**
 * 如果test的类型不是'boolean'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'boolean'
 */
Check.typeOf.bool = function (name, test) {
  if (typeof test !== "boolean") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "boolean", name),
    );
  }
};

/**
 * 如果test的类型不是'bigint'则抛出异常
 *
 * @param {string} name 被测试变量的名称
 * @param {*} test 要测试的值
 * @exception {DeveloperError} test的类型必须是'bigint'
 */
Check.typeOf.bigint = function (name, test) {
  if (typeof test !== "bigint") {
    throw new DeveloperError(
      getFailedTypeErrorMessage(typeof test, "bigint", name),
    );
  }
};

/**
 * 如果test1和test2的类型不是'number'或值不相等则抛出异常
 *
 * @param {string} name1 第一个被测试变量的名称
 * @param {string} name2 第二个被测试变量的名称
 * @param {*} test1 要测试的值
 * @param {*} test2 要比较的值
 * @exception {DeveloperError} test1和test2的类型必须是'number'且值相等
 */
Check.typeOf.number.equals = function (name1, name2, test1, test2) {
  Check.typeOf.number(name1, test1);
  Check.typeOf.number(name2, test2);
  if (test1 !== test2) {
    throw new DeveloperError(
      `${name1} must be equal to ${name2}, the actual values are ${test1} and ${test2}`,
    );
  }
};
export default Check;
