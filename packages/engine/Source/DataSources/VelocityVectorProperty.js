import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Property from "./Property.js";

/**
 * 一个根据提供的 {@link PositionProperty} 的速度计算为 {@link Cartesian3} 向量的 {@link Property}。
 *
 * @alias VelocityVectorProperty
 * @constructor
 *
 * @param {PositionProperty} [position] 用于计算速度的位置属性。
 * @param {boolean} [normalize=true] 是否对计算出的速度向量进行归一化。
 *
 * @example
 * //创建一个广告牌，使其旋转方向与速度匹配。
 * const position = new Cesium.SampledProperty();
 * position.addSamples(...);
 * const entity = viewer.entities.add({
 *   position : position,
 *   billboard : {
 *     image : 'image.png',
 *     alignedAxis : new Cesium.VelocityVectorProperty(position, true) // alignedAxis 必须是单位向量
 *   }
 * }));
 */
function VelocityVectorProperty(position, normalize) {
  this._position = undefined;
  this._subscription = undefined;
  this._definitionChanged = new Event();
  this._normalize = normalize ?? true;

  this.position = position;
}

Object.defineProperties(VelocityVectorProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._position);
    },
  },
  /**
   * 获取当此属性的定义发生更改时引发的事件。
   * @memberof VelocityVectorProperty.prototype
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
   * 获取或设置用于计算速度向量的位置属性。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {Property|undefined}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      const oldValue = this._position;
      if (oldValue !== value) {
        if (defined(oldValue)) {
          this._subscription();
        }

        this._position = value;

        if (defined(value)) {
          this._subscription = value._definitionChanged.addEventListener(
            function () {
              this._definitionChanged.raiseEvent(this);
            },
            this,
          );
        }

        this._definitionChanged.raiseEvent(this);
      }
    },
  },
  /**
   * 获取或设置此属性产生的向量是否进行归一化。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {boolean}
   */
  normalize: {
    get: function () {
      return this._normalize;
    },
    set: function (value) {
      if (this._normalize === value) {
        return;
      }

      this._normalize = value;
      this._definitionChanged.raiseEvent(this);
    },
  },
});

const position1Scratch = new Cartesian3();
const position2Scratch = new Cartesian3();
const timeScratch = new JulianDate();
const timeNowScratch = new JulianDate();
const step = 1.0 / 60.0;

/**
 * 获取属性在指定时间的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
VelocityVectorProperty.prototype.getValue = function (time, result) {
  return this._getValue(time, result);
};

/**
 * @private
 */
VelocityVectorProperty.prototype._getValue = function (
  time,
  velocityResult,
  positionResult,
) {
  if (!defined(time)) {
    time = JulianDate.now(timeNowScratch);
  }

  if (!defined(velocityResult)) {
    velocityResult = new Cartesian3();
  }

  const property = this._position;
  if (Property.isConstant(property)) {
    return this._normalize
      ? undefined
      : Cartesian3.clone(Cartesian3.ZERO, velocityResult);
  }

  let position1 = property.getValue(time, position1Scratch);
  let position2 = property.getValue(
    JulianDate.addSeconds(time, step, timeScratch),
    position2Scratch,
  );

  //If we don't have a position for now, return undefined.
  if (!defined(position1)) {
    return undefined;
  }

  //If we don't have a position for now + step, see if we have a position for now - step.
  if (!defined(position2)) {
    position2 = position1;
    position1 = property.getValue(
      JulianDate.addSeconds(time, -step, timeScratch),
      position2Scratch,
    );

    if (!defined(position1)) {
      return undefined;
    }
  }

  if (Cartesian3.equals(position1, position2)) {
    return this._normalize
      ? undefined
      : Cartesian3.clone(Cartesian3.ZERO, velocityResult);
  }

  if (defined(positionResult)) {
    position1.clone(positionResult);
  }

  const velocity = Cartesian3.subtract(position2, position1, velocityResult);
  if (this._normalize) {
    return Cartesian3.normalize(velocity, velocityResult);
  }

  return Cartesian3.divideByScalar(velocity, step, velocityResult);
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
VelocityVectorProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof VelocityVectorProperty &&
      Property.equals(this._position, other._position))
  );
};
export default VelocityVectorProperty;
