import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";

const defaultColor = new Color(1.0, 1.0, 1.0, 0.4);
const defaultGlowColor = new Color(0.0, 1.0, 0.0, 0.05);
const defaultBackgroundColor = new Color(0.0, 0.5, 0.0, 0.2);

/**
 * @typedef {object} GridImageryProvider.ConstructorOptions
 *
 * GridImageryProvider 构造函数的初始化选项
 *
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 要为其绘制瓦片的平铺方案。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。 如果指定了 tilingScheme，则
 * 此参数将被忽略，而使用切片方案的椭球体。如果两者都不是
 * 参数，则使用默认椭球。
 * @property {number} [cells=8] 网格单元格的数量。
 * @property {Color} [color=Color(1.0, 1.0, 1.0, 0.4)] 绘制网格线的颜色。
 * @property {Color} [glowColor=Color(0.0, 1.0, 0.0, 0.05)] 为网格线绘制发光的颜色。
 * @property {number} [glowWidth=6] 用于渲染线条发光效果的线条宽度。
 * @property {Color} [backgroundColor=Color(0.0, 0.5, 0.0, 0.2)] 背景填充颜色。
 * @property {number} [tileWidth=256] 宽度 用于详细级别选择的平铺.
 * @property {number} [tileHeight=256] 高度 用于详细级别选择的平铺.
 * @property {number} [canvasSize=256] The 用于渲染的画布的大小.
 */

/**
 * 一个 {@link ImageryProvider}，用于在每个图块上绘制具有可控背景和发光的线框网格。
 * 可能对自定义渲染效果或调试地形有用。
 *
 * @alias GridImageryProvider
 * @constructor
 * @param {GridImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 */
function GridImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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

  this._tilingScheme = defined(options.tilingScheme)
    ? options.tilingScheme
    : new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._cells = defaultValue(options.cells, 8);
  this._color = defaultValue(options.color, defaultColor);
  this._glowColor = defaultValue(options.glowColor, defaultGlowColor);
  this._glowWidth = defaultValue(options.glowWidth, 6);
  this._backgroundColor = defaultValue(
    options.backgroundColor,
    defaultBackgroundColor,
  );
  this._errorEvent = new Event();

  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);

  // A little larger than tile size so lines are sharper
  // Note: can't be too much difference otherwise texture blowout
  this._canvasSize = defaultValue(options.canvasSize, 256);

  // We only need a single canvas since all tiles will be the same
  this._canvas = this._createGridCanvas();
}

Object.defineProperties(GridImageryProvider.prototype, {
  /**
   * 获取此提供程序使用的代理。
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * 返回 undefined，不过滤任何瓦片.
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * @memberof GridImageryProvider.prototype
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
   * 就好像它们的 alpha 在所有地方都是 1.0 一样。 当此属性为 false 时，内存使用情况
   * 和纹理上传时间缩短。
   * @memberof GridImageryProvider.prototype
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
 * 在画布中绘制线条网格。
 */
GridImageryProvider.prototype._drawGrid = function (context) {
  const minPixel = 0;
  const maxPixel = this._canvasSize;
  for (let x = 0; x <= this._cells; ++x) {
    const nx = x / this._cells;
    const val = 1 + nx * (maxPixel - 1);

    context.moveTo(val, minPixel);
    context.lineTo(val, maxPixel);
    context.moveTo(minPixel, val);
    context.lineTo(maxPixel, val);
  }
  context.stroke();
};

/**
 * 将网格渲染到具有背景和发光的画布中
 */
GridImageryProvider.prototype._createGridCanvas = function () {
  const canvas = document.createElement("canvas");
  canvas.width = this._canvasSize;
  canvas.height = this._canvasSize;
  const minPixel = 0;
  const maxPixel = this._canvasSize;

  const context = canvas.getContext("2d");

  // Fill the background
  const cssBackgroundColor = this._backgroundColor.toCssColorString();
  context.fillStyle = cssBackgroundColor;
  context.fillRect(minPixel, minPixel, maxPixel, maxPixel);

  // Glow for grid lines
  const cssGlowColor = this._glowColor.toCssColorString();
  context.strokeStyle = cssGlowColor;
  // Wide
  context.lineWidth = this._glowWidth;
  context.strokeRect(minPixel, minPixel, maxPixel, maxPixel);
  this._drawGrid(context);
  // Narrow
  context.lineWidth = this._glowWidth * 0.5;
  context.strokeRect(minPixel, minPixel, maxPixel, maxPixel);
  this._drawGrid(context);

  // Grid lines
  const cssColor = this._color.toCssColorString();
  // Border
  context.strokeStyle = cssColor;
  context.lineWidth = 2;
  context.strokeRect(minPixel, minPixel, maxPixel, maxPixel);
  // Inner
  context.lineWidth = 1;
  this._drawGrid(context);

  return canvas;
};

/**
 * 获取在显示给定磁贴时要显示的制作者名单。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别;
 * @returns {Credit[]} 显示磁贴时要显示的制作者名单。
 */
GridImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * 请求给定磁贴的图像。
 *
 * @param {number} x 瓦片 X 坐标。
 * @param {number} y 瓦片 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<HTMLCanvasElement>} 解析后的图像为 Canvas DOM 对象。
 */
GridImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return Promise.resolve(this._canvas);
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
GridImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default GridImageryProvider;
