import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";

/**
 * @typedef {object} TileCoordinatesImageryProvider.ConstructorOptions
 *
 * TileCoordinatesImageryProvider 构造函数的初始化选项
 *
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 要为其绘制瓦片的平铺方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。 如果指定了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用 WGS84 椭球体。
 * @property {Color} [color=Color.YELLOW] 绘制瓦片框和标签的颜色。
 * @property {number} [tileWidth=256] 宽度 tile 用于细节层次选择。
 * @property {number} [tileHeight=256] 高度图块，用于细节层次选择。
 */

/**
 * 一个 {@link ImageryProvider}，用于在平铺方案中的每个渲染图块周围绘制一个框，并绘制
 * 内部的标签，指示图块的 X、Y、Level 坐标。 这主要适用于
 * 调试地形和图像渲染问题。
 *
 * @alias TileCoordinatesImageryProvider
 * @constructor
 *
 * @param {TileCoordinatesImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 */
function TileCoordinatesImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = defined(options.tilingScheme)
    ? options.tilingScheme
    : new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._color = defaultValue(options.color, Color.YELLOW);
  this._errorEvent = new Event();
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);

  this._defaultAlpha = undefined;
  this._defaultNightAlpha = undefined;
  this._defaultDayAlpha = undefined;
  this._defaultBrightness = undefined;
  this._defaultContrast = undefined;
  this._defaultHue = undefined;
  this._defaultSaturation = undefined;
  this._defaultGamma = undefined;
  this._defaultMinificationFilter = undefined;
  this._defaultMagnificationFilter = undefined;
}

Object.defineProperties(TileCoordinatesImageryProvider.prototype, {
  /**
   * 获取此提供程序使用的代理。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取每个图块的宽度（以像素为单位）。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个图块的高度（以像素为单位）。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可请求的最大详细级别。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取可请求的最小详细级别。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取此提供程序使用的切片方案。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的图像的矩形（以弧度为单位）。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。 如果未 undefined，则 discard 策略负责
   * 用于通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。 如果此功能
   * 返回 undefined，不过滤任何图块。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取在影像提供程序遇到异步错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取此影像提供程序处于活动状态时要显示的点数。 通常，这用于贷记
   * 图像的来源。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取一个值，该值指示此图像提供程序是否提供图像
   * 包括 Alpha 通道。 如果此属性为 false，则 Alpha 通道（如果存在）将
   * 被忽略。 如果此属性为 true，则将处理任何没有 Alpha 通道的图像
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 将此属性设置为 false 可减少内存使用量
   * 和纹理上传时间。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },
});

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
TileCoordinatesImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 请求给定磁贴的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<HTMLCanvasElement>} 解析为 Canvas DOM 对象的图像。
 */
TileCoordinatesImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  const cssColor = this._color.toCssColorString();

  context.strokeStyle = cssColor;
  context.lineWidth = 2;
  context.strokeRect(1, 1, 255, 255);

  context.font = "bold 25px Arial";
  context.textAlign = "center";
  context.fillStyle = cssColor;
  context.fillText(`L: ${level}`, 124, 86);
  context.fillText(`X: ${x}`, 124, 136);
  context.fillText(`Y: ${y}`, 124, 186);

  return Promise.resolve(canvas);
};

/**
 * 此图像提供程序目前不支持选取功能，因此此函数仅返回
 *定义。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 选取特征的经度。
 * @param {number} latitude 选取特征的纬度。
 * @return {undefined} Undefined，因为不支持拣选。
 */
TileCoordinatesImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default TileCoordinatesImageryProvider;
