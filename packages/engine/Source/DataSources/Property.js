import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";

/**
 * 所有属性的接口，表示可以随时间可选变化的值。
 * 此类型定义接口，无法直接实例化。
 *
 * @alias Property
 * @constructor
 * @abstract
 *
 * @see CompositeProperty
 * @see ConstantProperty
 * @see SampledProperty
 * @see TimeIntervalCollectionProperty
 * @see MaterialProperty
 * @see PositionProperty
 * @see ReferenceProperty
 */
function Property() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(Property.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则属性被视为常量。
   * @memberof Property.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取当此属性的定义更改时引发的事件。如果对 getValue 的调用对相同时间返回不同结果，则认为定义已更改。
   * @memberof Property.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取属性在指定时间的值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
Property.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
Property.prototype.equals = DeveloperError.throwInstantiationError;

/**
 * @private
 */
Property.equals = function (left, right) {
  return left === right || (defined(left) && left.equals(right));
};

/**
 * @private
 */
Property.arrayEquals = function (left, right) {
  if (left === right) {
    return true;
  }
  if (!defined(left) || !defined(right) || left.length !== right.length) {
    return false;
  }
  const length = left.length;
  for (let i = 0; i < length; i++) {
    if (!Property.equals(left[i], right[i])) {
      return false;
    }
  }
  return true;
};

/**
 * @private
 */
Property.isConstant = function (property) {
  return !defined(property) || property.isConstant;
};

/**
 * @private
 */
Property.getValueOrUndefined = function (property, time, result) {
  return defined(property) ? property.getValue(time, result) : undefined;
};

/**
 * @private
 */
Property.getValueOrDefault = function (property, time, valueDefault, result) {
  return defined(property)
    ? (property.getValue(time, result) ?? valueDefault)
    : valueDefault;
};

/**
 * @private
 */
Property.getValueOrClonedDefault = function (
  property,
  time,
  valueDefault,
  result,
) {
  let value;
  if (defined(property)) {
    value = property.getValue(time, result);
  }
  if (!defined(value)) {
    value = valueDefault.clone(value);
  }
  return value;
};
export default Property;
