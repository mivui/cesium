import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix3 from "../Core/Matrix3.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import Transforms from "../Core/Transforms.js";

/**
 * 定义世界的所有 {@link Property} 对象的接口
 * location 作为 {@link Cartesian3} 与关联的 {@link ReferenceFrame} 进行转换。
 * 此类型定义接口，不能直接实例化。
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
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof PositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof PositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取定义位置的参考帧.
   * @memberof PositionProperty.prototype
   * @type {ReferenceFrame}
   */
  referenceFrame: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取固定帧中给定时间的属性值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供 result 参数，则修改后为新实例。
 */
PositionProperty.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 获取在提供的时间和提供的参考框架中的属性值。
 * @function
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
PositionProperty.prototype.getValueInReferenceFrame =
  DeveloperError.throwInstantiationError;

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
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
  result
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
    scratchMatrix3
  );
  if (inputFrame === ReferenceFrame.INERTIAL) {
    return Matrix3.multiplyByVector(icrfToFixed, value, result);
  }
  if (inputFrame === ReferenceFrame.FIXED) {
    return Matrix3.multiplyByVector(
      Matrix3.transpose(icrfToFixed, scratchMatrix3),
      value,
      result
    );
  }
};
export default PositionProperty;
