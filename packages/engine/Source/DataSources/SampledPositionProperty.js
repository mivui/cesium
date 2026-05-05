import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";
import SampledProperty from "./SampledProperty.js";

/**
 * 一个 {@link SampledProperty}，同时也是 {@link PositionProperty}。
 *
 * @alias SampledPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考系。
 * @param {number} [numberOfDerivatives=0] 每个位置伴随的导数数量；例如速度、加速度等。
 */
function SampledPositionProperty(referenceFrame, numberOfDerivatives) {
  numberOfDerivatives = numberOfDerivatives ?? 0;

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
  this._referenceFrame = referenceFrame ?? ReferenceFrame.FIXED;

  this._property._definitionChanged.addEventListener(function () {
    this._definitionChanged.raiseEvent(this);
  }, this);
}

Object.defineProperties(SampledPositionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则属性被视为常量。
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
   * 获取当此属性的定义更改时引发的事件。如果对 getValue 的调用对相同时间返回不同结果，则认为定义已更改。
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
   * 获取定义位置的参考系。
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
   * 获取检索值时执行的插值次数。调用 <code>setInterpolationOptions</code> 来设置此项。
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
   * 获取检索值时使用的插值算法。调用 <code>setInterpolationOptions</code> 来设置此项。
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
   * 此属性包含的导数数量；例如，0 表示仅位置，1 表示速度，等等。
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
   * 获取或设置当在任何可用样本之后的时间请求值时执行的推断类型。
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
   * 获取或设置在属性变为undefined之前向前推断的时间量。值为0将永远推断。
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
   * 获取或设置当在任何可用样本之前的时间请求值时执行的推断类型。
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
   * 获取或设置在属性变为undefined之前向后推断的时间量。值为0将永远推断。
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
 * 获取指定时间的position。
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
SampledPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取指定时间和指定参考系中的position。
 *
 * @param {JulianDate} time 用于检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果的所需参考系。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
SampledPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
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
      result,
    );
  }
  return undefined;
};

/**
 * 设置插值position时使用的算法和次数。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {InterpolationAlgorithm} [options.interpolationAlgorithm] 新的插值算法。如果为undefined，则现有属性不变。
 * @param {number} [options.interpolationDegree] 新的插值次数。如果为undefined，则现有属性不变。
 */
SampledPositionProperty.prototype.setInterpolationOptions = function (options) {
  this._property.setInterpolationOptions(options);
};

/**
 * 添加新样本。
 *
 * @param {JulianDate} time 样本时间。
 * @param {Cartesian3} position 指定时间的position。
 * @param {Cartesian3[]} [derivatives] 指定时间的导数值数组。
 */
SampledPositionProperty.prototype.addSample = function (
  time,
  position,
  derivatives,
) {
  const numberOfDerivatives = this._numberOfDerivatives;
  //>>includeStart('debug', pragmas.debug);
  if (
    numberOfDerivatives > 0 &&
    (!defined(derivatives) || derivatives.length !== numberOfDerivatives)
  ) {
    throw new DeveloperError(
      "derivatives length must be equal to the number of derivatives.",
    );
  }
  //>>includeEnd('debug');
  this._property.addSample(time, position, derivatives);
};

/**
 * 通过并行数组添加多个样本。
 *
 * @param {JulianDate[]} times JulianDate 实例数组，每个索引是一个样本时间。
 * @param {Cartesian3[]} positions Cartesian3 position 实例数组，每个值对应提供的时间索引。
 * @param {Array[]} [derivatives] 一个数组，其中每个值是包含对应时间索引的导数的数组。
 *
 * @exception {DeveloperError} 所有数组的长度必须相同。
 */
SampledPositionProperty.prototype.addSamples = function (
  times,
  positions,
  derivatives,
) {
  this._property.addSamples(times, positions, derivatives);
};

/**
 * 以单个打包数组的形式添加样本，其中每个新样本表示为一个日期，
 * 后跟相应值和导出的打包表示。
 *
 * @param {number[]} packedSamples 打包样本数组。
 * @param {JulianDate} [epoch] 如果 packedSamples 中的任何日期是数字，则它们被视为从此纪元开始的偏移量（秒）。
 */
SampledPositionProperty.prototype.addSamplesPackedArray = function (
  packedSamples,
  epoch,
) {
  this._property.addSamplesPackedArray(packedSamples, epoch);
};

/**
 * 移除给定时间的样本（如果存在）。
 *
 * @param {JulianDate} time 样本时间。
 * @returns {boolean} 如果移除了time的样本则返回 <code>true</code>，否则返回 <code>false</code>。
 */
SampledPositionProperty.prototype.removeSample = function (time) {
  return this._property.removeSample(time);
};

/**
 * 移除给定时间间隔内的所有样本。
 *
 * @param {TimeInterval} time 要移除所有样本的时间间隔。
 */
SampledPositionProperty.prototype.removeSamples = function (timeInterval) {
  this._property.removeSamples(timeInterval);
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
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
