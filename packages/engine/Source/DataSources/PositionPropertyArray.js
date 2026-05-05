import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，其值是数组，数组项是其他 PositionProperty 实例的计算值。
 *
 * @alias PositionPropertyArray
 * @constructor
 *
 * @param {Property[]} [value] Property 实例数组。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function PositionPropertyArray(value, referenceFrame) {
  this._value = undefined;
  this._definitionChanged = new Event();
  this._eventHelper = new EventHelper();
  this._referenceFrame = referenceFrame ?? ReferenceFrame.FIXED;
  this.setValue(value);
}

Object.defineProperties(PositionPropertyArray.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果数组中的所有属性项都是常量，则此属性被视为常量。
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
   * 获取当此属性的定义更改时引发的事件。
   * 只要使用与当前值不同的数据调用 setValue，或者数组中的某个属性发生更改，定义就会更改。
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
   * 获取定义位置的参考系。
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
 * 获取属性的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3[]} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3[]} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
PositionPropertyArray.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取属性在指定时间和指定参考系中的值。
 *
 * @param {JulianDate} time 用于检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果的所需参考系。
 * @param {Cartesian3[]} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3[]} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
PositionPropertyArray.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
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
      result[i],
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
 * 设置属性的值。
 *
 * @param {Property[]} value Property 实例数组。
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
