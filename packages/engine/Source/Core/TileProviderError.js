import defined from "./defined.js";
import formatError from "./formatError.js";

/**
 * 提供有关{@link ImageryProvider}或{@link TerrainProvider}中发生的错误的详细信息。
 *
 * @alias TileProviderError
 * @constructor
 *
 * @param {ImageryProvider|TerrainProvider} provider 遇到错误的影像或地形提供程序。
 * @param {string} message 描述错误的消息。
 * @param {number} [x] 遇到错误的瓦片的X坐标，如果错误
 *        不是特定于某个瓦片，则为undefined。
 * @param {number} [y] 遇到错误的瓦片的Y坐标，如果错误
 *        不是特定于某个瓦片，则为undefined。
 * @param {number} [level] 遇到错误的瓦片的层级，如果错误
 *        不是特定于某个瓦片，则为undefined。
 * @param {number} [timesRetried=0] 此操作已重试的次数。
 * @param {Error} [error] 发生的错误或异常（如果有）。
 */
function TileProviderError(
  provider,
  message,
  x,
  y,
  level,
  timesRetried,
  error,
) {
  /**
   * 遇到错误的{@link ImageryProvider}或{@link TerrainProvider}。
   * @type {ImageryProvider|TerrainProvider}
   */
  this.provider = provider;

  /**
   * 描述错误的消息。
   * @type {string}
   */
  this.message = message;

  /**
   * 遇到错误的瓦片的X坐标。如果错误不是特定于
   * 某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.x = x;

  /**
   * 遇到错误的瓦片的Y坐标。如果错误不是特定于
   * 某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.y = y;

  /**
   * 遇到错误的瓦片的细节层级。如果错误不是特定于
   * 某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.level = level;

  /**
   * 此操作已重试的次数。
   * @type {number}
   * @default 0
   */
  this.timesRetried = timesRetried ?? 0;

  /**
   * 如果失败的操作应该重试则为true；否则为false。影像或地形提供程序
   * 将在引发事件之前设置此属性的初始值，但任何侦听器
   * 都可以更改它。调用最后一个侦听器后的值将被执行。
   * @type {boolean}
   * @default false
   */
  this.retry = false;

  /**
   * 发生的错误或异常（如果有）。
   * @type {Error}
   */
  this.error = error;
}

/**
 * 通过引发事件（如果有侦听器）或
 * 将错误记录到控制台（如果事件没有侦听器）来报告{@link ImageryProvider}或{@link TerrainProvider}中的错误。此方法还跟踪
 * 操作已重试的次数。
 *
 * @param {TileProviderError} previousError 上次为这个错误调用此函数时返回的错误实例，
 *        如果这是第一次发生此错误，则为undefined。
 * @param {ImageryProvider|TerrainProvider} [provider] 遇到错误的影像或地形提供程序。
 * @param {Event} [event] 要引发以通知侦听器错误的事件。
 * @param {string} [message] 描述错误的消息。
 * @param {number} [x] 遇到错误的瓦片的X坐标，如果
 *        错误不是特定于某个瓦片，则为undefined。
 * @param {number} [y] 遇到错误的瓦片的Y坐标，如果
 *        错误不是特定于某个瓦片，则为undefined。
 * @param {number} [level] 遇到错误的瓦片的细节层级，如果
 *        错误不是特定于某个瓦片，则为undefined。
 * @param {Error} [errorDetails] 发生的错误或异常（如果有）。
 * @returns {TileProviderError} 传递给事件侦听器的错误实例，并且
 *          下次为同一错误调用此函数时应传递给它，
 *          以便跟踪重试次数。
 */
TileProviderError.reportError = function (
  previousError,
  provider,
  event,
  message,
  x,
  y,
  level,
  errorDetails,
) {
  let error = previousError;
  if (!defined(previousError)) {
    error = new TileProviderError(
      provider,
      message,
      x,
      y,
      level,
      0,
      errorDetails,
    );
  } else {
    error.provider = provider;
    error.message = message;
    error.x = x;
    error.y = y;
    error.level = level;
    error.retry = false;
    error.error = errorDetails;
    ++error.timesRetried;
  }

  if (defined(event) && event.numberOfListeners > 0) {
    event.raiseEvent(error);
  } else if (defined(provider)) {
    console.log(
      `An error occurred in "${provider.constructor.name}": ${formatError(
        message,
      )}`,
    );
  }

  return error;
};

/**
 * 通过重置先前错误的重试计数（如果有）来报告操作成功。这样，
 * 如果将来再次发生错误，侦听器将被告知该错误尚未重试。
 *
 * @param {TileProviderError} previousError 先前的错误，如果此操作之前
 *        未导致错误，则为undefined。
 */
TileProviderError.reportSuccess = function (previousError) {
  if (defined(previousError)) {
    previousError.timesRetried = -1;
  }
};

/**
 * A function that will be called to retry the operation.
 * @callback TileProviderError.RetryFunction
 */
export default TileProviderError;
