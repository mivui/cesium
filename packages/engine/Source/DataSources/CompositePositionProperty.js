import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 同时也是 {@link PositionProperty} 的 {@link CompositeProperty}。
 *
 * @alias CompositePositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 */
function CompositePositionProperty(referenceFrame) {
  this._referenceFrame = referenceFrame ?? ReferenceFrame.FIXED;
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositePositionProperty.prototype._raiseDefinitionChanged,
    this,
  );
}

Object.defineProperties(CompositePositionProperty.prototype, {
  /**
   * 获取指示此属性是否为常量的值。如果 getValue 始终对当前定义返回相同结果，则认为属性是常量。
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
   * 获取每当此属性定义更改时触发的事件。
   * 每当使用与当前值不同的数据调用 setValue 时定义都会更改。
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
   * 获取间隔集合。
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
   * 获取或设置此位置呈现自身的参考系。
   * 组成此对象的每个 PositionProperty 都有自己的参考系，
   * 因此此属性仅公开供客户端使用的"首选"参考系。
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
 * 获取固定帧中给定时间处的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数则为新实例。
 */
CompositePositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取给定时间和给定参考系中的属性值。
 *
 * @param {JulianDate} time 要获取值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考系。
 * @param {Cartesian3} [result] 存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数则为新实例。
 */
CompositePositionProperty.prototype.getValueInReferenceFrame = function (
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

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getValueInReferenceFrame(time, referenceFrame, result);
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则为 <code>true</code>，否则为 <code>false</code>。
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
