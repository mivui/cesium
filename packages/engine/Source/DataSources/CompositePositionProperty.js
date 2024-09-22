import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 一个 {@link CompositeProperty}，也是一个 {@link PositionProperty}。
 *
 * @alias CompositePositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] The reference frame in which the position is defined.
 */
function CompositePositionProperty(referenceFrame) {
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositePositionProperty.prototype._raiseDefinitionChanged,
    this
  );
}

Object.defineProperties(CompositePositionProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof CompositePositionProperty.prototype
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
   * @memberof CompositePositionProperty.prototype
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
   * @memberof CompositePositionProperty.prototype
   *
   * @type {TimeIntervalCollection}
   */
  intervals: {
    get: function () {
      return this._composite.intervals;
    },
  },
  /**
   * 获取或设置这个位置所表现的参考系。
   * 组成此对象的每个 PositionProperty 都有自己的参考系
   * 所以这个属性只是为 Client 端公开一个 “preferred” 参考框架
   * 使用。
   * @memberof CompositePositionProperty.prototype
   *
   * @type {ReferenceFrame}
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
    set: function (value) {
      this._referenceFrame = value;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取固定帧中给定时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CompositePositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在提供的时间和提供的参考框架中的属性值。
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
CompositePositionProperty.prototype.getValueInReferenceFrame = function (
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

  const innerProperty = this._composite._intervals.findDataForIntervalContainingDate(
    time
  );
  if (defined(innerProperty)) {
    return innerProperty.getValueInReferenceFrame(time, referenceFrame, result);
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
CompositePositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CompositePositionProperty && //
      this._referenceFrame === other._referenceFrame && //
      this._composite.equals(other._composite, Property.equals))
  );
};

/**
 * @private
 */
CompositePositionProperty.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default CompositePositionProperty;
