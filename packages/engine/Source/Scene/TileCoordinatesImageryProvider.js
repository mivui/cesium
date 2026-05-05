import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";

/**
 * @typedef {object} TileCoordinatesImageryProvider.ConstructorOptions
 *
 * TileCoordinatesImageryProvider 构造函数的初始化选项
 *
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 要绘制瓦片的切片方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果指定了 tilingScheme，
 *                    则忽略此参数，改用切片方案的椭球体。如果两者都未指定，
 *                    则使用 WGS84 椭球体。
 * @property {Color} [color=Color.YELLOW] 用于绘制瓦片边框和标签的颜色。
 * @property {number} [tileWidth=256] 用于细节层次选择的瓦片宽度。
 * @property {number} [tileHeight=256] 用于细节层次选择的瓦片高度。
 */

/**
 * 一个 {@link ImageryProvider}，在切片方案中的每个已渲染瓦片周围绘制边框，
 * 并在内部绘制标签显示该瓦片的 X、Y、Level 坐标。这主要用于
 * 调试地形和影像渲染问题。
 *
 * @alias TileCoordinatesImageryProvider
 * @constructor
 *
 * @param {TileCoordinatesImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 */
function TileCoordinatesImageryProvider(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._tilingScheme = defined(options.tilingScheme)
    ? options.tilingScheme
    : new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._color = options.color ?? Color.YELLOW;
  this._errorEvent = new Event();
  this._tileWidth = options.tileWidth ?? 256;
  this._tileHeight = options.tileHeight ?? 256;

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
   * 获取此提供者使用的代理。
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
   * 获取每个瓦片的宽度（像素）。
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
   * 获取每个瓦片的高度（像素）。
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
   * 获取可以请求的最大细节层次。
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
   * 获取可以请求的最小细节层次。
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
   * 获取此提供者使用的切片方案。
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
   * 获取此实例提供的影像的矩形范围（弧度）。
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
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉"缺失"的瓦片。如果此函数
   * 返回 undefined，则不过滤任何瓦片。
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
   * 获取当影像提供者遇到异步错误时触发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 会接收到一个 {@link TileProviderError} 实例。
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
   * 获取当此影像提供者激活时显示的归属信息。通常用于归属
   * 影像来源。
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
   * 获取一个值，指示此影像提供者提供的图像是否
   * 包含 alpha 通道。如果此属性为 false，alpha 通道（如果存在）将被
   * 忽略。如果此属性为 true，任何没有 alpha 通道的图像将被视为
   * alpha 值处处为 1.0。将此属性设置为 false 可减少内存使用
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
 * 获取显示给定瓦片时要显示的归属信息。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片层级。
 * @returns {Credit[]} 显示瓦片时要显示的归属信息。
 */
TileCoordinatesImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片层级。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<HTMLCanvasElement>} 已解析的图像，作为 Canvas DOM 对象。
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
 * 此影像提供者当前不支持要素拾取功能，因此此函数仅返回
 * undefined。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片层级。
 * @param {number} longitude 拾取要素的经度。
 * @param {number} latitude 拾取要素的纬度。
 * @return {undefined} 由于不支持拾取功能，返回 undefined。
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
