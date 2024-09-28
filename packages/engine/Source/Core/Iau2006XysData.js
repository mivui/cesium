import buildModuleUrl from "./buildModuleUrl.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Iau2006XysSample from "./Iau2006XysSample.js";
import JulianDate from "./JulianDate.js";
import Resource from "./Resource.js";
import TimeStandard from "./TimeStandard.js";

/**
 * 一组 IAU2006 XYS 数据，用于评估国际
 * 天体参考系 （ICRF） 和国际地面参考系 （ITRF）。
 *
 * @alias Iau2006XysData
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性：
 * @param {Resource|string} [options.xysFileUrlTemplate='Assets/IAU2006_XYS/IAU2006_XYS_{0}.json'] 用于获取 XYS 数据的模板 URL。 在模板中，
 * '{0}' 将替换为文件索引。
 * @param {number} [options.interpolationOrder=9] 对 XYS 数据执行的插值顺序。
 * @param {number} [options.sampleZeroJulianEphemerisDate=2442396.5] 儒略历日期 （JED）
 * 第一个 XYS 样品。
 * @param {number} [options.stepSizeDays=1.0] 连续 XYS 样本之间的步长（以天为单位）。
 * @param {number} [options.samplesPerXysFile=1000] 每个 XYS 文件中的样本数。
 * @param {number} [options.totalSamples=27426] 所有 XYS 文件中的样本总数。
 *
 * @private
 */
function Iau2006XysData(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._xysFileUrlTemplate = Resource.createIfNeeded(
    options.xysFileUrlTemplate,
  );
  this._interpolationOrder = defaultValue(options.interpolationOrder, 9);
  this._sampleZeroJulianEphemerisDate = defaultValue(
    options.sampleZeroJulianEphemerisDate,
    2442396.5,
  );
  this._sampleZeroDateTT = new JulianDate(
    this._sampleZeroJulianEphemerisDate,
    0.0,
    TimeStandard.TAI,
  );
  this._stepSizeDays = defaultValue(options.stepSizeDays, 1.0);
  this._samplesPerXysFile = defaultValue(options.samplesPerXysFile, 1000);
  this._totalSamples = defaultValue(options.totalSamples, 27426);
  this._samples = new Array(this._totalSamples * 3);
  this._chunkDownloadsInProgress = [];

  const order = this._interpolationOrder;

  // Compute denominators and X values for interpolation.
  const denom = (this._denominators = new Array(order + 1));
  const xTable = (this._xTable = new Array(order + 1));

  const stepN = Math.pow(this._stepSizeDays, order);

  for (let i = 0; i <= order; ++i) {
    denom[i] = stepN;
    xTable[i] = i * this._stepSizeDays;

    for (let j = 0; j <= order; ++j) {
      if (j !== i) {
        denom[i] *= i - j;
      }
    }

    denom[i] = 1.0 / denom[i];
  }

  // Allocate scratch arrays for interpolation.
  this._work = new Array(order + 1);
  this._coef = new Array(order + 1);
}

const julianDateScratch = new JulianDate(0, 0.0, TimeStandard.TAI);

function getDaysSinceEpoch(xys, dayTT, secondTT) {
  const dateTT = julianDateScratch;
  dateTT.dayNumber = dayTT;
  dateTT.secondsOfDay = secondTT;
  return JulianDate.daysDifference(dateTT, xys._sampleZeroDateTT);
}

/**
 * 预加载指定日期范围的 XYS 数据。
 *
 * @param {number} startDayTT 预加载区间开始的儒略日数，以
 * 地球时间 （TT） 时间标准。
 * @param {number} startSecondTT 预加载间隔开始后中午的秒数，表示为
 * 地球时间 （TT） 时间标准。
 * @param {number} stopDayTT 预加载区间结束的儒略日数，以
 * 地球时间 （TT） 时间标准。
 * @param {number} stopSecondTT 预加载间隔结束后中午的秒数，表示为
 * 地球时间 （TT） 时间标准。
 * @returns {Promise<void>} 一个 Promise，当解析时，表示请求的间隔已被
 *预 加载。
 */
Iau2006XysData.prototype.preload = function (
  startDayTT,
  startSecondTT,
  stopDayTT,
  stopSecondTT,
) {
  const startDaysSinceEpoch = getDaysSinceEpoch(
    this,
    startDayTT,
    startSecondTT,
  );
  const stopDaysSinceEpoch = getDaysSinceEpoch(this, stopDayTT, stopSecondTT);

  let startIndex =
    (startDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2) |
    0;
  if (startIndex < 0) {
    startIndex = 0;
  }

  let stopIndex =
    (stopDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2) |
    (0 + this._interpolationOrder);
  if (stopIndex >= this._totalSamples) {
    stopIndex = this._totalSamples - 1;
  }

  const startChunk = (startIndex / this._samplesPerXysFile) | 0;
  const stopChunk = (stopIndex / this._samplesPerXysFile) | 0;

  const promises = [];
  for (let i = startChunk; i <= stopChunk; ++i) {
    promises.push(requestXysChunk(this, i));
  }

  return Promise.all(promises);
};

/**
 * 通过插值计算给定日期的 XYS 值。 如果尚未下载所需的数据，
 * 此方法将返回 undefined。
 *
 * @param {number} dayTT 计算 XYS 值的儒略日数，以
 * 地球时间 （TT） 时间标准。
 * @param {number} secondTT 计算 XYS 值的日期中午之后的秒数，以
 * 地球时间 （TT） 时间标准。
 * @param {Iau2006XysSample} [result] 要将插值结果复制到的实例。 如果此参数
 * 未定义，则会分配并返回一个新实例。
 * @returns {Iau2006XysSample} 插值的 XYS 值，如果此所需的数据为 undefined
 * 计算结果尚未下载。
 *
 * @see Iau2006XysData#preload
 */
Iau2006XysData.prototype.computeXysRadians = function (
  dayTT,
  secondTT,
  result,
) {
  const daysSinceEpoch = getDaysSinceEpoch(this, dayTT, secondTT);
  if (daysSinceEpoch < 0.0) {
    // Can't evaluate prior to the epoch of the data.
    return undefined;
  }

  const centerIndex = (daysSinceEpoch / this._stepSizeDays) | 0;
  if (centerIndex >= this._totalSamples) {
    // Can't evaluate after the last sample in the data.
    return undefined;
  }

  const degree = this._interpolationOrder;

  let firstIndex = centerIndex - ((degree / 2) | 0);
  if (firstIndex < 0) {
    firstIndex = 0;
  }
  let lastIndex = firstIndex + degree;
  if (lastIndex >= this._totalSamples) {
    lastIndex = this._totalSamples - 1;
    firstIndex = lastIndex - degree;
    if (firstIndex < 0) {
      firstIndex = 0;
    }
  }

  // Are all the samples we need present?
  // We can assume so if the first and last are present
  let isDataMissing = false;
  const samples = this._samples;
  if (!defined(samples[firstIndex * 3])) {
    requestXysChunk(this, (firstIndex / this._samplesPerXysFile) | 0);
    isDataMissing = true;
  }

  if (!defined(samples[lastIndex * 3])) {
    requestXysChunk(this, (lastIndex / this._samplesPerXysFile) | 0);
    isDataMissing = true;
  }

  if (isDataMissing) {
    return undefined;
  }

  if (!defined(result)) {
    result = new Iau2006XysSample(0.0, 0.0, 0.0);
  } else {
    result.x = 0.0;
    result.y = 0.0;
    result.s = 0.0;
  }

  const x = daysSinceEpoch - firstIndex * this._stepSizeDays;

  const work = this._work;
  const denom = this._denominators;
  const coef = this._coef;
  const xTable = this._xTable;

  let i, j;
  for (i = 0; i <= degree; ++i) {
    work[i] = x - xTable[i];
  }

  for (i = 0; i <= degree; ++i) {
    coef[i] = 1.0;

    for (j = 0; j <= degree; ++j) {
      if (j !== i) {
        coef[i] *= work[j];
      }
    }

    coef[i] *= denom[i];

    let sampleIndex = (firstIndex + i) * 3;
    result.x += coef[i] * samples[sampleIndex++];
    result.y += coef[i] * samples[sampleIndex++];
    result.s += coef[i] * samples[sampleIndex];
  }

  return result;
};

function requestXysChunk(xysData, chunkIndex) {
  if (xysData._chunkDownloadsInProgress[chunkIndex]) {
    // Chunk has already been requested.
    return xysData._chunkDownloadsInProgress[chunkIndex];
  }

  let chunkUrl;
  const xysFileUrlTemplate = xysData._xysFileUrlTemplate;
  if (defined(xysFileUrlTemplate)) {
    chunkUrl = xysFileUrlTemplate.getDerivedResource({
      templateValues: {
        0: chunkIndex,
      },
    });
  } else {
    chunkUrl = new Resource({
      url: buildModuleUrl(`Assets/IAU2006_XYS/IAU2006_XYS_${chunkIndex}.json`),
    });
  }

  const promise = chunkUrl.fetchJson().then(function (chunk) {
    xysData._chunkDownloadsInProgress[chunkIndex] = false;

    const samples = xysData._samples;
    const newSamples = chunk.samples;
    const startIndex = chunkIndex * xysData._samplesPerXysFile * 3;

    for (let i = 0, len = newSamples.length; i < len; ++i) {
      samples[startIndex + i] = newSamples[i];
    }
  });
  xysData._chunkDownloadsInProgress[chunkIndex] = promise;

  return promise;
}
export default Iau2006XysData;
