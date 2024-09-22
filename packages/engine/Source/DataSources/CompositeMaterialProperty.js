import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 一个 {@link CompositeProperty}，它也是一个 {@link MaterialProperty}。
 *
 * @alias CompositeMaterialProperty
 * @constructor
 */
function CompositeMaterialProperty() {
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositeMaterialProperty.prototype._raiseDefinitionChanged,
    this
  );
}

Object.defineProperties(CompositeMaterialProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof CompositeMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._composite.isConstant;
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 每当使用不同的数据调用 setValue 时，定义都会更改
   * 比当前值。
   * @memberof CompositeMaterialProperty.prototype
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
   * 获取 interval 集合。
   * @memberof CompositeMaterialProperty.prototype
   *
   * @type {TimeIntervalCollection}
   */
  intervals: {
    get: function () {
      return this._composite._intervals;
    },
  },
});

/**
 * 在提供的时间获取 {@link Material} 类型。
 *
 * @param {JulianDate} time 检索类型的时间。
 * @returns {string} 材质的类型。
 */
CompositeMaterialProperty.prototype.getType = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required");
  }
  //>>includeEnd('debug');

  const innerProperty = this._composite._intervals.findDataForIntervalContainingDate(
    time
  );
  if (defined(innerProperty)) {
    return innerProperty.getType(time);
  }
  return undefined;
};

const timeScratch = new JulianDate();

/**
 * 获取属性在提供的时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要将值存储到的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或新实例（如果未提供 result 参数）。
 */
CompositeMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const innerProperty = this._composite._intervals.findDataForIntervalContainingDate(
    time
  );
  if (defined(innerProperty)) {
    return innerProperty.getValue(time, result);
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
CompositeMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CompositeMaterialProperty && //
      this._composite.equals(other._composite, Property.equals))
  );
};

/**
 * @private
 */
CompositeMaterialProperty.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default CompositeMaterialProperty;
