import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";
import SampledProperty from "./SampledProperty.js";

/**
 * 一个 {@link SampledProperty}，它也是一个 {@link PositionProperty}。
 *
 * @alias SampledPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 * @param {number} [numberOfDerivatives=0] 每个仓位附带的衍生品数量;即速度、加速度等......
 */
function SampledPositionProperty(referenceFrame, numberOfDerivatives) {
  numberOfDerivatives = defaultValue(numberOfDerivatives, 0);

  let derivativeTypes;
  if (numberOfDerivatives > 0) {
    derivativeTypes = new Array(numberOfDerivatives);
    for (let i = 0; i < numberOfDerivatives; i++) {
      derivativeTypes[i] = Cartesian3;
    }
  }

  this._numberOfDerivatives = numberOfDerivatives;
  this._property = new SampledProperty(Cartesian3, derivativeTypes);
  this._definitionChanged = new Event();
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);

  this._property._definitionChanged.addEventListener(function () {
    this._definitionChanged.raiseEvent(this);
  }, this);
}

Object.defineProperties(SampledPositionProperty.prototype, {
  /**
   * 获取一个值，该值指示此属性是否为 constant。 将属性视为
   * 常量（如果 getValue 始终为当前定义返回相同的结果）。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._property.isConstant;
    },
  },
  /**
   * 获取此属性的定义发生更改时引发的事件。
   * 如果对 getValue 的调用会返回 getValue，则认为定义已更改
   * 同一时间的不同结果。
   * @memberof SampledPositionProperty.prototype
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
   * @memberof SampledPositionProperty.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
  /**
   * 获取检索值时要执行的插值度数。调用 <code>setInterpolationOptions</code> 进行设置。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {number}
   * @default 1
   * @readonly
   */
  interpolationDegree: {
    get: function () {
      return this._property.interpolationDegree;
    },
  },
  /**
   * 获取检索值时要使用的插值算法。调用 <code>setInterpolationOptions</code> 进行设置。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {InterpolationAlgorithm}
   * @default LinearApproximation
   * @readonly
   */
  interpolationAlgorithm: {
    get: function () {
      return this._property.interpolationAlgorithm;
    },
  },
  /**
   * 此属性包含的衍生数;即 0 表示位置，1 表示速度，依此类推。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {number}
   * @default 0
   */
  numberOfDerivatives: {
    get: function () {
      return this._numberOfDerivatives;
    },
  },
  /**
   * 获取或设置当值
   * 在任何可用样品之后请求。
   * @memberof SampledPositionProperty.prototype
   * @type {ExtrapolationType}
   * @default ExtrapolationType.NONE
   */
  forwardExtrapolationType: {
    get: function () {
      return this._property.forwardExtrapolationType;
    },
    set: function (value) {
      this._property.forwardExtrapolationType = value;
    },
  },
  /**
   * 获取或设置之前向前推断的时间量
   * 属性变为 undefined。 值 0 将永远外推。
   * @memberof SampledPositionProperty.prototype
   * @type {number}
   * @default 0
   */
  forwardExtrapolationDuration: {
    get: function () {
      return this._property.forwardExtrapolationDuration;
    },
    set: function (value) {
      this._property.forwardExtrapolationDuration = value;
    },
  },
  /**
   * 获取或设置当值
   * 在任何可用样品之前请求。
   * @memberof SampledPositionProperty.prototype
   * @type {ExtrapolationType}
   * @default ExtrapolationType.NONE
   */
  backwardExtrapolationType: {
    get: function () {
      return this._property.backwardExtrapolationType;
    },
    set: function (value) {
      this._property.backwardExtrapolationType = value;
    },
  },
  /**
   * 获取或设置向后推断的时间量
   * 之前。 值 0 将永远外推。
   * @memberof SampledPositionProperty.prototype
   * @type {number}
   * @default 0
   */
  backwardExtrapolationDuration: {
    get: function () {
      return this._property.backwardExtrapolationDuration;
    },
    set: function (value) {
      this._property.backwardExtrapolationDuration = value;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取提供时间的位置。
 *
 * @param {JulianDate} [time=JulianDate.now()] 检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
SampledPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在提供的时间和提供的参考系中的位置。
 *
 * @param {JulianDate} time 检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的 referenceFrame。
 * @param {Cartesian3} [result] 要将值存储到的对象，如果省略，则会创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或者，如果未提供 result 参数，则为新实例。
 */
SampledPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);
  Check.defined("referenceFrame", referenceFrame);
  //>>includeEnd('debug');

  result = this._property.getValue(time, result);
  if (defined(result)) {
    return PositionProperty.convertToReferenceFrame(
      time,
      result,
      this._referenceFrame,
      referenceFrame,
      result
    );
  }
  return undefined;
};

/**
 * 设置插值位置时要使用的算法和次数。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {InterpolationAlgorithm} [options.interpolationAlgorithm] 新的插值算法。 如果未定义，则 existing 属性将保持不变。
 * @param {number} [options.interpolationDegree] 新的插值度数。 如果未定义，则 existing 属性将保持不变。
 */
SampledPositionProperty.prototype.setInterpolationOptions = function (options) {
  this._property.setInterpolationOptions(options);
};

/**
 * 添加新样本。
 *
 * @param {JulianDate} time 采样时间。
 * @param {Cartesian3} position 在提供的时间的位置。
 * @param {Cartesian3[]} [derivatives] 提供时间的导数值数组。
 */
SampledPositionProperty.prototype.addSample = function (
  time,
  position,
  derivatives
) {
  const numberOfDerivatives = this._numberOfDerivatives;
  //>>includeStart('debug', pragmas.debug);
  if (
    numberOfDerivatives > 0 &&
    (!defined(derivatives) || derivatives.length !== numberOfDerivatives)
  ) {
    throw new DeveloperError(
      "derivatives length must be equal to the number of derivatives."
    );
  }
  //>>includeEnd('debug');
  this._property.addSample(time, position, derivatives);
};

/**
 * 通过并行数组添加多个样本。
 *
 * @param {JulianDate[]} times 一个 JulianDate 实例的数组，其中每个索引都是一个采样时间。
 * @param {Cartesian3[]} positions 笛卡尔3 位置实例的数组，其中每个值对应于提供的时间索引。
 * @param {Array[]} [derivatives] 一个数组，其中每个值都是另一个数组，其中包含相应时间索引的导数。
 *
 * @exception {DeveloperError} All arrays must be the same length.
 */
SampledPositionProperty.prototype.addSamples = function (
  times,
  positions,
  derivatives
) {
  this._property.addSamples(times, positions, derivatives);
};

/**
 * 将样本添加为单个打包数组，其中每个新样本都表示为日期，
 * 后跟相应值和导数的打包表示形式。
 *
 * @param {number[]} packedSamples 打包样本数组。
 * @param {JulianDate} [epoch] 如果 packedSamples 中的任何日期是数字，则它们被视为与该纪元的偏移量（以秒为单位）。
 */
SampledPositionProperty.prototype.addSamplesPackedArray = function (
  packedSamples,
  epoch
) {
  this._property.addSamplesPackedArray(packedSamples, epoch);
};

/**
 * 在给定时间删除样本（如果存在）。
 *
 * @param {JulianDate} time 采样时间。
 * @returns {boolean} <code>true</code>（如果当时的样本被删除）， <code>false</code> 否则。
 */
SampledPositionProperty.prototype.removeSample = function (time) {
  return this._property.removeSample(time);
};

/**
 * 删除给定时间间隔内的所有样本。
 *
 * @param {TimeInterval} time 删除所有样本的时间间隔。
 */
SampledPositionProperty.prototype.removeSamples = function (timeInterval) {
  this._property.removeSamples(timeInterval);
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
SampledPositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof SampledPositionProperty &&
      Property.equals(this._property, other._property) && //
      this._referenceFrame === other._referenceFrame)
  );
};
export default SampledPositionProperty;
