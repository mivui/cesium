import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 同时也是 {@link MaterialProperty} 的 {@link CompositeProperty}。
 *
 * @alias CompositeMaterialProperty
 * @constructor
 */
function CompositeMaterialProperty() {
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositeMaterialProperty.prototype._raiseDefinitionChanged,
    this,
  );
}

Object.defineProperties(CompositeMaterialProperty.prototype, {
  /**
   * 获取指示此属性是否为常量的值。如果 getValue 始终对当前定义返回相同结果，则认为属性是常量。
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
   * 获取每当此属性定义更改时触发的事件。
   * 每当使用与当前值不同的数据调用 setValue 时定义都会更改。
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
   * 获取间隔集合。
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
 * 获取给定时间处的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要获取类型的时间。
 * @returns {string} 材质类型。
 */
CompositeMaterialProperty.prototype.getType = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required");
  }
  //>>includeEnd('debug');

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getType(time);
  }
  return undefined;
};

const timeScratch = new JulianDate();

/**
 * 获取给定时间处的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数则为新实例。
 */
CompositeMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getValue(time, result);
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则为 <code>true</code>，否则为 <code>false</code>。
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
