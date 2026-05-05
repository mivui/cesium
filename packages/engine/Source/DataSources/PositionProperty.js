import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix3 from "../Core/Matrix3.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import Transforms from "../Core/Transforms.js";

/**
 * 所有 {@link Property} 对象的接口，这些对象将世界位置定义为带有相关 {@link ReferenceFrame} 的 {@link Cartesian3}。
 * 此类型定义接口，无法直接实例化。
 *
 * @alias PositionProperty
 * @constructor
 * @abstract
 *
 * @see CallbackPositionProperty
 * @see CompositePositionProperty
 * @see ConstantPositionProperty
 * @see SampledPositionProperty
 * @see TimeIntervalCollectionPositionProperty
 */
function PositionProperty() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(PositionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则属性被视为常量。
   * @memberof PositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取当此属性的定义更改时引发的事件。如果对 getValue 的调用对相同时间返回不同结果，则认为定义已更改。
   * @memberof PositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取定义位置的参考系。
   * @memberof PositionProperty.prototype
   * @type {ReferenceFrame}
   */
  referenceFrame: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取属性在固定系中指定时间的值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
PositionProperty.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 获取属性在指定时间和指定参考系中的值。
 * @function
 *
 * @param {JulianDate} time 用于检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果的所需参考系。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
PositionProperty.prototype.getValueInReferenceFrame =
  DeveloperError.throwInstantiationError;

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PositionProperty.prototype.equals = DeveloperError.throwInstantiationError;

const scratchMatrix3 = new Matrix3();

/**
 * @private
 */
PositionProperty.convertToReferenceFrame = function (
  time,
  value,
  inputFrame,
  outputFrame,
  result,
) {
  if (!defined(value)) {
    return value;
  }
  if (!defined(result)) {
    result = new Cartesian3();
  }

  if (inputFrame === outputFrame) {
    return Cartesian3.clone(value, result);
  }

  const icrfToFixed = Transforms.computeIcrfToCentralBodyFixedMatrix(
    time,
    scratchMatrix3,
  );
  if (inputFrame === ReferenceFrame.INERTIAL) {
    return Matrix3.multiplyByVector(icrfToFixed, value, result);
  }
  if (inputFrame === ReferenceFrame.FIXED) {
    return Matrix3.multiplyByVector(
      Matrix3.transpose(icrfToFixed, scratchMatrix3),
      value,
      result,
    );
  }
};
export default PositionProperty;
