import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，其值是一个数组，其项是计算值
 * 的其他 PositionProperty 实例。
 *
 * @alias PositionPropertyArray
 * @constructor
 *
 * @param {Property[]} [value] Property 实例的数组。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function PositionPropertyArray(value, referenceFrame) {
  this._value = undefined;
  this._definitionChanged = new Event();
  this._eventHelper = new EventHelper();
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
  this.setValue(value);
}

Object.defineProperties(PositionPropertyArray.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 此属性
   * 如果数组中的所有属性项都是常量，则被视为常量。
   * @memberof PositionPropertyArray.prototype
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
   * @memberof PositionPropertyArray.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取定义位置的参考帧。
   * @memberof PositionPropertyArray.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * Gets the value of the property.
 *
 * @param {JulianDate} [time=JulianDate.now()] The time for which to retrieve the value. If omitted, the current system time is used.
 * @param {Cartesian3[]} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {Cartesian3[]} 修改后的结果参数 or a new instance if the result parameter was not supplied.
 */
PositionPropertyArray.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * Gets the value of the property at the provided time and in the provided reference frame.
 *
 * @param {JulianDate} time The time for which to retrieve the value.
 * @param {ReferenceFrame} referenceFrame The desired referenceFrame of the result.
 * @param {Cartesian3[]} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {Cartesian3[]} 修改后的结果参数 or a new instance if the result parameter was not supplied.
 */
PositionPropertyArray.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  if (!defined(referenceFrame)) {
    throw new DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

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
    const property = value[i];
    const itemValue = property.getValueInReferenceFrame(
      time,
      referenceFrame,
      result[i]
    );
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
 * Sets the value of the property.
 *
 * @param {Property[]} value An array of Property instances.
 */
PositionPropertyArray.prototype.setValue = function (value) {
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
          PositionPropertyArray.prototype._raiseDefinitionChanged,
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
 * Compares this property to the provided property and returns
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
PositionPropertyArray.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PositionPropertyArray && //
      this._referenceFrame === other._referenceFrame && //
      Property.arrayEquals(this._value, other._value))
  );
};

PositionPropertyArray.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default PositionPropertyArray;
