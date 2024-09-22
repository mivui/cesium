import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import formatError from "./formatError.js";

/**
 * 提供有关 {@link ImageryProvider} 或 {@link TerrainProvider} 中发生的错误的详细信息。
 *
 * @alias TileProviderError
 * @constructor
 *
 * @param {ImageryProvider|TerrainProvider} provider 遇到错误的影像或 terrain 提供程序。
 * @param {string} message 描述错误的消息。
 * @param {number} [x] x坐标 磁贴，如果出现错误，则为 undefined
 * 并不特定于特定磁贴。
 * @param {number} [y] y坐标 磁贴，如果出现错误，则为 undefined
 * 并不特定于特定磁贴。
 * @param {number} [level] 遇到错误的磁贴的级别，如果出现错误，则为 undefined
 * 并不特定于特定磁贴。
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
  error
) {
  /**
   * 遇到错误的 {@link ImageryProvider} 或 {@link TerrainProvider}。
   * @type {ImageryProvider|TerrainProvider}
   */
  this.provider = provider;

  /**
   * 描述错误的消息。
   * @type {string}
   */
  this.message = message;

  /**
   * x坐标 磁贴。 如果错误不具体
   * 添加到特定磁贴时，此属性将为 undefined。
   * @type {number}
   */
  this.x = x;

  /**
   * y坐标 磁贴。 如果错误不具体
   * 添加到特定磁贴时，此属性将为 undefined。
   * @type {number}
   */
  this.y = y;

  /**
   * 遇到错误的磁贴的详细程度。 如果错误不具体
   * 添加到特定磁贴时，此属性将为 undefined。
   * @type {number}
   */
  this.level = level;

  /**
   * 此操作已重试的次数。
   * @type {number}
   * @default 0
   */
  this.timesRetried = defaultValue(timesRetried, 0);

  /**
   * 如果应重试失败的操作，则为 True;否则为 false。 影像或 terrain 提供商
   * 将在引发事件之前设置此属性的初始值，但任何侦听器
   * 可以更改它。 调用最后一个侦听器后的值将执行操作。
   * @type {boolean}
   * @default false
   */
  this.retry = false;

  /**
   * The error or exception that occurred, if any.
   * @type {Error}
   */
  this.error = error;
}

/**
 * 报告 {@link ImageryProvider} 或 {@link TerrainProvider} 中的错误，如果它有任何侦听器，则引发事件，或者通过
 * 如果事件没有侦听器，则将错误记录到控制台。 此方法还会跟踪数字
 * 重试操作的次数。
 *
 * @param {TileProviderError} previousError 此函数返回的最后一个错误实例
 * 为此错误调用的时间，如果这是此错误第一次调用，则为 undefined
 *发生。
 * @param {ImageryProvider|TerrainProvider} [provider] 遇到错误的影像或 terrain provider。
 * @param {Event} [event] 为通知侦听器错误而引发的事件。
 * @param {string} [message] 描述错误的消息。
 * @param {number} [x] x坐标 瓦片，或者 undefined 如果
 * 错误并非特定于特定磁贴。
 * @param {number} [y] y坐标 tile 遇到错误，或者 undefined 如果
 * 错误并非特定于特定磁贴。
 * @param {number} [level] 遇到错误的图块的详细程度，如果
 * 错误并非特定于特定磁贴。
 * @param {Error} [errorDetails] 发生的错误或异常（如果有）。
 * @returns {TileProviderError} 传递给事件侦听器的错误实例，并且
 * 应该在下次针对相同的错误调用时按顺序传递给此函数
 * 跟踪重试计数。
 */
TileProviderError.reportError = function (
  previousError,
  provider,
  event,
  message,
  x,
  y,
  level,
  errorDetails
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
      errorDetails
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
        message
      )}`
    );
  }

  return error;
};

/**
 * 通过重置上一个错误的重试计数（如果有）来报告操作成功。 这边
 * 如果将来再次发生该错误，将通知侦听器尚未重试该错误。
 *
 * @param {TileProviderError} previousError 上一个错误，如果此操作具有 undefined
 * 以前未导致错误。
 */
TileProviderError.reportSuccess = function (previousError) {
  if (defined(previousError)) {
    previousError.timesRetried = -1;
  }
};

/**
 * 将调用以重试操作的函数。
 * @callback TileProviderError.RetryFunction
 */
export default TileProviderError;
