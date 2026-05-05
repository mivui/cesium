import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import JulianDate from "../Core/JulianDate.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，其值是数组，数组项是其他属性实例的计算值。
 *
 * @alias PropertyArray
 * @constructor
 *
 * @param {Property[]} [value] Property 实例数组。
 */
function PropertyArray(value) {
  this._value = undefined;
  this._definitionChanged = new Event();
  this._eventHelper = new EventHelper();
  this.setValue(value);
}

Object.defineProperties(PropertyArray.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果数组中的所有属性项都是常量，则此属性被视为常量。
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
   * 获取当此属性的定义更改时引发的事件。
   * 只要使用与当前值不同的数据调用 setValue，或者数组中的某个属性发生更改，定义就会更改。
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
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {object[]} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object[]} 修改后的结果参数，即通过在给定时间评估每个包含的属性而产生的值数组；如果未提供结果参数，则返回新实例。
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
 * @param {Property[]} value Property 实例数组。
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
          this,
        );
      }
    }
  } else {
    this._value = undefined;
  }
  this._definitionChanged.raiseEvent(this);
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
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
