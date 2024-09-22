import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import JulianDate from "../Core/JulianDate.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，其值是一个数组，其项是计算值
 * 的其他属性实例。
 *
 * @alias PropertyArray
 * @constructor
 *
 * @param {Property[]} [value] Property 实例的数组。
 */
function PropertyArray(value) {
  this._value = undefined;
  this._definitionChanged = new Event();
  this._eventHelper = new EventHelper();
  this.setValue(value);
}

Object.defineProperties(PropertyArray.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 此属性
   * 如果数组中的所有属性项都是常量，则被视为常量。
   * @memberof PropertyArray.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      const value = this._value;
      if (!defined(value)) {
        return true;
      }
      const length = value.length;
      for (let i = 0; i < length; i++) {
        if (!Property.isConstant(value[i])) {
          return false;
        }
      }
      return true;
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 每当使用不同的数据调用 setValue 时，定义都会更改
   * 时，当前值或数组中的某个属性也会更改。
   * @memberof PropertyArray.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取属性的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Object[]} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {Object[]} 修改后的结果参数, 这是通过在给定时间计算每个包含的属性生成的值数组，如果未提供 result 参数，则为新实例。
 */
PropertyArray.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const value = this._value;
  if (!defined(value)) {
    return undefined;
  }

  const length = value.length;
  if (!defined(result)) {
    result = new Array(length);
  }
  let i = 0;
  let x = 0;
  while (i < length) {
    const property = this._value[i];
    const itemValue = property.getValue(time, result[i]);
    if (defined(itemValue)) {
      result[x] = itemValue;
      x++;
    }
    i++;
  }
  result.length = x;
  return result;
};

/**
 * 设置属性的值。
 *
 * @param {Property[]} value Property 实例的数组。
 */
PropertyArray.prototype.setValue = function (value) {
  const eventHelper = this._eventHelper;
  eventHelper.removeAll();

  if (defined(value)) {
    this._value = value.slice();
    const length = value.length;
    for (let i = 0; i < length; i++) {
      const property = value[i];
      if (defined(property)) {
        eventHelper.add(
          property.definitionChanged,
          PropertyArray.prototype._raiseDefinitionChanged,
          this
        );
      }
    }
  } else {
    this._value = undefined;
  }
  this._definitionChanged.raiseEvent(this);
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
PropertyArray.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PropertyArray && //
      Property.arrayEquals(this._value, other._value))
  );
};

PropertyArray.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default PropertyArray;
