import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import createWorldImageryAsync from "../Scene/createWorldImageryAsync.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import IndexDatatype from "../Core/IndexDatatype.js";
import CesiumMath from "../Core/Math.js";
import PixelFormat from "../Core/PixelFormat.js";
import Rectangle from "../Core/Rectangle.js";
import Request from "../Core/Request.js";
import RequestState from "../Core/RequestState.js";
import RequestType from "../Core/RequestType.js";
import TerrainProvider from "../Core/TerrainProvider.js";
import TileProviderError from "../Core/TileProviderError.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import Buffer from "../Renderer/Buffer.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import ComputeCommand from "../Renderer/ComputeCommand.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import MipmapHint from "../Renderer/MipmapHint.js";
import Sampler from "../Renderer/Sampler.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import VertexArray from "../Renderer/VertexArray.js";
import ReprojectWebMercatorFS from "../Shaders/ReprojectWebMercatorFS.js";
import ReprojectWebMercatorVS from "../Shaders/ReprojectWebMercatorVS.js";
import Imagery from "./Imagery.js";
import ImageryState from "./ImageryState.js";
import SplitDirection from "./SplitDirection.js";
import TileImagery from "./TileImagery.js";

/**
 * @typedef {object} ImageryLayer.ConstructorOptions
 *
 * ImageryLayer 构造器的初始化选项。
 *
 * @property {Rectangle} [rectangle=imageryProvider.rectangle] 图层的矩形区域。此矩形
 *        可以限制影像提供者的可见部分。
 * @property {number|Function} [alpha=1.0] 此图层的 alpha 混合值，从 0.0 到 1.0。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及 alpha 所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的 alpha 值。
 * @property {number|Function} [nightAlpha=1.0] 此图层在地球夜半球的 alpha 混合值，从 0.0 到 1.0。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及 alpha 所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的 alpha 值。仅当 <code>enableLighting</code> 为 <code>true</code> 时生效。
 * @property {number|Function} [dayAlpha=1.0] 此图层在地球昼半球的 alpha 混合值，从 0.0 到 1.0。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及 alpha 所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的 alpha 值。仅当 <code>enableLighting</code> 为 <code>true</code> 时生效。
 * @property {number|Function} [brightness=1.0] 此图层的亮度。1.0 使用未修改的影像
 *                          颜色。小于 1.0 使影像变暗，大于 1.0 使其变亮。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及亮度所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的亮度值。函数对每一帧和每个瓦片执行，
 *                          因此必须快速。
 * @property {number|Function} [contrast=1.0] 此图层的对比度。1.0 使用未修改的影像颜色。
 *                          小于 1.0 降低对比度，大于 1.0 增加对比度。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及对比度所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的对比度值。函数对每一帧和每个瓦片执行，
 *                          因此必须快速。
 * @property {number|Function} [hue=0.0] 此图层的色相。0.0 使用未修改的影像颜色。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及色相所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的色相值。函数对每一帧和每个瓦片执行，
 *                          因此必须快速。
 * @property {number|Function} [saturation=1.0] 此图层的饱和度。1.0 使用未修改的影像颜色。
 *                          小于 1.0 降低饱和度，大于 1.0 增加饱和度。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及饱和度所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的饱和度值。函数对每一帧和每个瓦片执行，
 *                          因此必须快速。
 * @property {number|Function} [gamma=1.0] 应用于此图层的伽马校正。1.0 使用未修改的影像颜色。
 *                          这可以是一个简单的数字或具有签名
 *                          <code>function(frameState, layer, x, y, level)</code> 的函数。函数被传递
 *                          当前帧状态、此图层以及伽马所需的影像瓦片的 x、y 和 level 坐标，
 *                          它应返回要用于瓦片的伽马值。函数对每一帧和每个瓦片执行，
 *                          因此必须快速。
 * @property {SplitDirection|Function} [splitDirection=SplitDirection.NONE] 应用于此图层的 {@link SplitDirection} 分割方向。
 * @property {TextureMinificationFilter} [minificationFilter=TextureMinificationFilter.LINEAR] 应用于此图层的
 *                                    纹理缩小过滤器。可能的值
 *                                    为 <code>TextureMinificationFilter.LINEAR</code> 和
 *                                    <code>TextureMinificationFilter.NEAREST</code>。
 * @property {TextureMagnificationFilter} [magnificationFilter=TextureMagnificationFilter.LINEAR] 应用于此图层的
 *                                     纹理放大过滤器。可能的值
 *                                     为 <code>TextureMagnificationFilter.LINEAR</code> 和
 *                                     <code>TextureMagnificationFilter.NEAREST</code>。
 * @property {boolean} [show=true] 如果显示图层则为 true；否则为 false。
 * @property {number} [maximumAnisotropy=最大支持] 用于
 *        纹理过滤的最大各向异性级别。如果未指定此参数，将使用
 *        WebGL 堆栈支持的最大各向异性。较大的值使影像在地平线
 *        视图中看起来更好。
 * @property {number} [minimumTerrainLevel] 显示此影像图层的最低地形细节级别，
 *                 如果未定义则在所有级别显示。级别零是细节最少的级别。
 * @property {number} [maximumTerrainLevel] 显示此影像图层的最高地形细节级别，
 *                 如果未定义则在所有级别显示。级别零是细节最少的级别。
 * @property {Rectangle} [cutoutRectangle] 用于切除此 ImageryLayer 部分的笛卡尔矩形。
 * @property {Color} [colorToAlpha] 用作 alpha 的颜色。
 * @property {number} [colorToAlphaThreshold=0.004] 颜色转 alpha 的阈值。
 */

/**
 * 在 {@link Globe} 或 {@link Cesium3DTileset} 上显示来自单个影像提供者的
 * 平铺影像数据的影像图层。
 *
 * @alias ImageryLayer
 * @constructor
 *
 * @param {ImageryProvider} [imageryProvider] 要使用的影像提供者。
 * @param {ImageryLayer.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see {@link ImageryLayer.fromProviderAsync} 用于从异步影像提供者创建影像图层。
 * @see {@link ImageryLayer.fromWorldImagery} 用于创建 Cesium ion 的默认全球基础影像图层。
 * @see {@link Scene#imageryLayers} 用于将影像图层添加到地球。
 * @see {@link Cesium3DTileset#imageryLayers} 用于将影像图层添加到 3D 瓦片集。
 *
 * @example
 * // 添加 OpenStreetMaps 图层
 * const imageryLayer = new Cesium.ImageryLayer(new Cesium.OpenStreetMapImageryProvider({
 *   url: "https://tile.openstreetmap.org/"
 * }));
 * scene.imageryLayers.add(imageryLayer);
 *
 * @example
 * // 添加 Cesium ion 的默认世界影像图层
 * const imageryLayer = Cesium.ImageryLayer.fromWorldImagery();
 * scene.imageryLayers.add(imageryLayer);
 *
 * @example
 * // 从 Cesium ion 添加新的透明图层
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * imageryLayer.alpha = 0.5;
 * scene.imageryLayers.add(imageryLayer);
 *
 * @example
 * // 将 Bing Maps Aerial 影像覆盖在 3D 瓦片集上
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json"
 * );
 * scene.primitives.add(tileset);
 *
 * const imageryProvider = await Cesium.createWorldImageryAsync({
 *   style: Cesium.IonWorldImageryStyle.AERIAL,
 * });
 * const imageryLayer = new ImageryLayer(imageryProvider);
 * tileset.imageryLayers.add(imageryLayer);
 */
function ImageryLayer(imageryProvider, options) {
  this._imageryProvider = imageryProvider;

  this._readyEvent = new Event();
  this._errorEvent = new Event();

  options = options ?? Frozen.EMPTY_OBJECT;
  imageryProvider = imageryProvider ?? Frozen.EMPTY_OBJECT;

  /**
   * 此图层的 alpha 混合值，0.0 表示完全透明，
   * 1.0 表示完全不透明。
   *
   * @type {number}
   * @default 1.0
   */
  this.alpha = options.alpha ?? imageryProvider._defaultAlpha ?? 1.0;

  /**
   * 此图层在地球夜半球的 alpha 混合值，0.0 表示完全透明，
   * 1.0 表示完全不透明。仅当 {@link Globe#enableLighting} 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 1.0
   */
  this.nightAlpha =
    options.nightAlpha ?? imageryProvider._defaultNightAlpha ?? 1.0;

  /**
   * 此图层在地球昼半球的 alpha 混合值，0.0 表示完全透明，
   * 1.0 表示完全不透明。仅当 {@link Globe#enableLighting} 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 1.0
   */
  this.dayAlpha = options.dayAlpha ?? imageryProvider._defaultDayAlpha ?? 1.0;

  /**
   * 此图层的亮度。1.0 使用未修改的影像颜色。小于 1.0
   * 使影像变暗，大于 1.0 使其变亮。
   *
   * @type {number}
   * @default {@link ImageryLayer.DEFAULT_BRIGHTNESS}
   */
  this.brightness =
    options.brightness ??
    imageryProvider._defaultBrightness ??
    ImageryLayer.DEFAULT_BRIGHTNESS;

  /**
   * 此图层的对比度。1.0 使用未修改的影像颜色。小于 1.0 降低
   * 对比度，大于 1.0 增加对比度。
   *
   * @type {number}
   * @default {@link ImageryLayer.DEFAULT_CONTRAST}
   */
  this.contrast =
    options.contrast ??
    imageryProvider._defaultContrast ??
    ImageryLayer.DEFAULT_CONTRAST;

  /**
   * 此图层的色相（以弧度为单位）。0.0 使用未修改的影像颜色。
   *
   * @type {number}
   * @default {@link ImageryLayer.DEFAULT_HUE}
   */
  this.hue =
    options.hue ?? imageryProvider._defaultHue ?? ImageryLayer.DEFAULT_HUE;

  /**
   * 此图层的饱和度。1.0 使用未修改的影像颜色。小于 1.0 降低
   * 饱和度，大于 1.0 增加饱和度。
   *
   * @type {number}
   * @default {@link ImageryLayer.DEFAULT_SATURATION}
   */
  this.saturation =
    options.saturation ??
    imageryProvider._defaultSaturation ??
    ImageryLayer.DEFAULT_SATURATION;

  /**
   * 应用于此图层的伽马校正。1.0 使用未修改的影像颜色。
   *
   * @type {number}
   * @default {@link ImageryLayer.DEFAULT_GAMMA}
   */
  this.gamma =
    options.gamma ??
    imageryProvider._defaultGamma ??
    ImageryLayer.DEFAULT_GAMMA;

  /**
   * 应用于此图层的 {@link SplitDirection} 分割方向。
   *
   * @type {SplitDirection}
   * @default {@link ImageryLayer.DEFAULT_SPLIT}
   */
  this.splitDirection = options.splitDirection ?? ImageryLayer.DEFAULT_SPLIT;

  /**
   * 应用于此图层的 {@link TextureMinificationFilter} 纹理缩小过滤器。
   * 可能的值为 {@link TextureMinificationFilter.LINEAR}（默认值）
   * 和 {@link TextureMinificationFilter.NEAREST}。
   *
   * 要生效，此属性必须在添加影像图层后立即设置。
   * 纹理加载后，将无法更改使用的纹理过滤器。
   *
   * @type {TextureMinificationFilter}
   * @default {@link ImageryLayer.DEFAULT_MINIFICATION_FILTER}
   */
  this.minificationFilter =
    options.minificationFilter ??
    imageryProvider._defaultMinificationFilter ??
    ImageryLayer.DEFAULT_MINIFICATION_FILTER;

  /**
   * 应用于此图层的 {@link TextureMagnificationFilter} 纹理放大过滤器。
   * 可能的值为 {@link TextureMagnificationFilter.LINEAR}（默认值）
   * 和 {@link TextureMagnificationFilter.NEAREST}。
   *
   * 要生效，此属性必须在添加影像图层后立即设置。
   * 纹理加载后，将无法更改使用的纹理过滤器。
   *
   * @type {TextureMagnificationFilter}
   * @default {@link ImageryLayer.DEFAULT_MAGNIFICATION_FILTER}
   */
  this.magnificationFilter =
    options.magnificationFilter ??
    imageryProvider._defaultMagnificationFilter ??
    ImageryLayer.DEFAULT_MAGNIFICATION_FILTER;

  /**
   * 确定是否显示此图层。
   *
   * @type {boolean}
   * @default true
   */
  this.show = options.show ?? true;

  this._minimumTerrainLevel = options.minimumTerrainLevel;
  this._maximumTerrainLevel = options.maximumTerrainLevel;

  this._rectangle = options.rectangle ?? Rectangle.MAX_VALUE;
  this._maximumAnisotropy = options.maximumAnisotropy;

  this._imageryCache = {};

  this._skeletonPlaceholder = new TileImagery(Imagery.createPlaceholder(this));

  // 上次更新时 show 属性的值。
  this._show = true;

  // 此图层在 ImageryLayerCollection 中的索引。
  this._layerIndex = -1;

  // 如果这是基础（最低显示）图层则为 true。
  this._isBaseLayer = false;

  this._requestImageError = undefined;

  this._reprojectComputeCommands = [];

  /**
   * 此图层中影像的矩形切出区域。
   *
   * @type {Rectangle}
   */
  this.cutoutRectangle = options.cutoutRectangle;

  /**
   * 应设置为透明的颜色值。
   *
   * @type {Color}
   */
  this.colorToAlpha = options.colorToAlpha;

  /**
   * 颜色转 alpha 的归一化（0-1）阈值。
   *
   * @type {number}
   */
  this.colorToAlphaThreshold =
    options.colorToAlphaThreshold ??
    ImageryLayer.DEFAULT_APPLY_COLOR_TO_ALPHA_THRESHOLD;
}

Object.defineProperties(ImageryLayer.prototype, {
  /**
   * 获取此图层的影像提供者。在 {@link ImageryLayer#ready} 返回 true 之前不应调用此方法。
   * @memberof ImageryLayer.prototype
   * @type {ImageryProvider}
   * @readonly
   */
  imageryProvider: {
    get: function () {
      return this._imageryProvider;
    },
  },

  /**
   * 当地形提供者成功创建时返回 true。否则返回 false。
   * @memberof ImageryLayer.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return defined(this._imageryProvider);
    },
  },

  /**
   * 获取影像提供者遇到异步错误时触发的事件。通过订阅
   * 该事件，您将收到错误通知并可能从中恢复。事件监听器
   * 被传递抛出的错误的实例。
   * @memberof ImageryLayer.prototype
   * @type {Event<ImageryLayer.ErrorEventCallback>}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取影像提供者成功创建时触发的事件。事件监听器
   * 被传递创建的 {@link ImageryProvider} 实例。
   * @memberof ImageryLayer.prototype
   * @type {Event<ImageryLayer.ReadyEventCallback>}
   * @readonly
   */
  readyEvent: {
    get: function () {
      return this._readyEvent;
    },
  },

  /**
   * 获取此图层的矩形区域。如果此矩形小于
   * {@link ImageryProvider} 的矩形，则仅显示影像提供者的一部分。
   * @memberof ImageryLayer.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },
});

/**
 * 如果在构造期间或影像提供者未提供亮度值，则此值用作影像图层的默认亮度。此值不修改影像的亮度。
 * @type {number}
 * @default 1.0
 */
ImageryLayer.DEFAULT_BRIGHTNESS = 1.0;
/**
 * 如果在构造期间或影像提供者未提供对比度值，则此值用作影像图层的默认对比度。此值不修改影像的对比度。
 * @type {number}
 * @default 1.0
 */
ImageryLayer.DEFAULT_CONTRAST = 1.0;
/**
 * 如果在构造期间或影像提供者未提供色相值，则此值用作影像图层的默认色相。此值不修改影像的色相。
 * @type {number}
 * @default 0.0
 */
ImageryLayer.DEFAULT_HUE = 0.0;
/**
 * 如果在构造期间或影像提供者未提供饱和度值，则此值用作影像图层的默认饱和度。此值不修改影像的饱和度。
 * @type {number}
 * @default 1.0
 */
ImageryLayer.DEFAULT_SATURATION = 1.0;
/**
 * 如果在构造期间或影像提供者未提供伽马值，则此值用作影像图层的默认伽马。此值不修改影像的伽马。
 * @type {number}
 * @default 1.0
 */
ImageryLayer.DEFAULT_GAMMA = 1.0;

/**
 * 如果在构造期间或影像提供者未提供分割方向值，则此值用作影像图层的默认分割方向。
 * @type {SplitDirection}
 * @default SplitDirection.NONE
 */
ImageryLayer.DEFAULT_SPLIT = SplitDirection.NONE;

/**
 * 如果在构造期间或影像提供者未提供纹理缩小过滤器值，则此值用作影像图层的默认纹理缩小过滤器。
 * @type {TextureMinificationFilter}
 * @default TextureMinificationFilter.LINEAR
 */
ImageryLayer.DEFAULT_MINIFICATION_FILTER = TextureMinificationFilter.LINEAR;

/**
 * 如果在构造期间或影像提供者未提供纹理放大过滤器值，则此值用作影像图层的默认纹理放大过滤器。
 * @type {TextureMagnificationFilter}
 * @default TextureMagnificationFilter.LINEAR
 */
ImageryLayer.DEFAULT_MAGNIFICATION_FILTER = TextureMagnificationFilter.LINEAR;

/**
 * 如果在构造期间或影像提供者未提供颜色转 alpha 阈值，则此值用作影像图层的默认颜色转 alpha 阈值。
 * @type {number}
 * @default 0.004
 */
ImageryLayer.DEFAULT_APPLY_COLOR_TO_ALPHA_THRESHOLD = 0.004;

/**
 * 从异步影像提供者创建新的影像图层。该图层将处理任何异步加载或错误，并在准备就绪后开始渲染影像图层。
 *
 * @param {Promise<ImageryProvider>} imageryProviderPromise 解析为影像提供者的 Promise
 * @param {ImageryLayer.ConstructorOptions} [options] 描述初始化选项的对象
 * @returns {ImageryLayer} 创建的影像图层。
 *
 * @example
 * // 创建新的基础图层
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * });
 *
 * @example
 * // 添加新的透明图层
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * imageryLayer.alpha = 0.5;
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @example
 * // 处理加载事件
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * imageryLayer.readyEvent.addEventListener(provider => {
 *   imageryLayer.imageryProvider.errorEvent.addEventListener(error => {
 *     alert(`加载影像瓦片时遇到错误！${error}`);
 *   });
 * });
 *
 * imageryLayer.errorEvent.addEventListener(error => {
 *   alert(`创建影像图层时遇到错误！${error}`);
 * });
 *
 * @see ImageryLayer#errorEvent
 * @see ImageryLayer#readyEvent
 * @see ImageryLayer#imageryProvider
 * @see ImageryLayer.fromWorldImagery
 */
ImageryLayer.fromProviderAsync = function (imageryProviderPromise, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("imageryProviderPromise", imageryProviderPromise);
  //>>includeEnd('debug');

  const layer = new ImageryLayer(undefined, options);

  handlePromise(layer, Promise.resolve(imageryProviderPromise));

  return layer;
};

/**
 * @typedef {ImageryLayer.ConstructorOptions} ImageryLayer.WorldImageryConstructorOptions
 *
 * ImageryLayer.fromWorldImagery 的初始化选项
 *
 * @property {IonWorldImageryStyle} [options.style=IonWorldImageryStyle] 基础影像的样式，目前仅支持 AERIAL、AERIAL_WITH_LABELS 和 ROAD。
 */

/**
 * 为 ion 的默认全球基础影像图层（目前为 Bing Maps）创建新的影像图层。该图层将处理任何异步加载或错误，并在准备就绪后开始渲染影像图层。
 *
 * @param {ImageryLayer.WorldImageryConstructorOptions} options 描述初始化选项的对象
 * @returns {ImageryLayer} 创建的影像图层。
 *
 * * @example
 * // 创建新的基础图层
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromWorldImagery();
 * });
 *
 * @example
 * // 添加新的透明图层
 * const imageryLayer = Cesium.ImageryLayer.fromWorldImagery();
 * imageryLayer.alpha = 0.5;
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @example
 * // 处理加载事件
 * const imageryLayer = Cesium.ImageryLayer.fromWorldImagery();
 * viewer.imageryLayers.add(imageryLayer);
 *
 * imageryLayer.readyEvent.addEventListener(provider => {
 *   imageryLayer.imageryProvider.errorEvent.addEventListener(error => {
 *     alert(`加载影像瓦片时遇到错误！${error}`);
 *   });
 * });
 *
 * imageryLayer.errorEvent.addEventListener(error => {
 *   alert(`创建影像图层时遇到错误！${error}`);
 * });
 *
 * @see ImageryLayer#errorEvent
 * @see ImageryLayer#readyEvent
 * @see ImageryLayer#imageryProvider
 */
ImageryLayer.fromWorldImagery = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  return ImageryLayer.fromProviderAsync(
    createWorldImageryAsync({
      style: options.style,
    }),
    options,
  );
};

/**
 * 获取一个值，该值指示此图层是否为 {@link ImageryLayerCollection} 中的基础图层。
 * 基础图层是位于所有其他图层之下的图层。它很特殊，因为即使它实际上没有全局矩形，
 * 也会将其视为具有全局矩形，通过将边缘的纹理拉伸到整个矩形。
 * globe.
 *
 * @returns {boolean} true if this is the base layer; otherwise, false.
 */
ImageryLayer.prototype.isBaseLayer = function () {
  return this._isBaseLayer;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {boolean} True if this object was destroyed; otherwise, false.
 *
 * @see ImageryLayer#destroy
 */
ImageryLayer.prototype.isDestroyed = function () {
  return false;
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * imageryLayer = imageryLayer && imageryLayer.destroy();
 *
 * @see ImageryLayer#isDestroyed
 */
ImageryLayer.prototype.destroy = function () {
  return destroyObject(this);
};

const imageryBoundsScratch = new Rectangle();
const tileImageryBoundsScratch = new Rectangle();
const clippedRectangleScratch = new Rectangle();
const terrainRectangleScratch = new Rectangle();

/**
 * Computes the intersection of this layer's rectangle with the imagery provider's availability rectangle,
 * producing the overall bounds of imagery that can be produced by this layer.
 *
 * @returns {Rectangle} A rectangle which defines the overall bounds of imagery that can be produced by this layer.
 *
 * @example
 * // Zoom to an imagery layer.
 * const imageryRectangle = imageryLayer.getImageryRectangle();
 * scene.camera.flyTo({
 *     destination: rectangle
 * });
 *
 */
ImageryLayer.prototype.getImageryRectangle = function () {
  const imageryProvider = this._imageryProvider;
  const rectangle = this._rectangle;
  return Rectangle.intersection(imageryProvider.rectangle, rectangle);
};

/**
 * Create skeletons for the imagery tiles that partially or completely overlap a given terrain
 * tile.
 *
 * @private
 *
 * @param {QuadtreeTile} tile The terrain tile.
 * @param {TerrainProvider|undefined} terrainProvider The terrain provider associated with the terrain tile.
 * @param {number} insertionPoint The position to insert new skeletons before in the tile's imagery list.
 * @returns {boolean} true if this layer overlaps any portion of the terrain tile; otherwise, false.
 */
ImageryLayer.prototype._createTileImagerySkeletons = function (
  tile,
  terrainProvider,
  insertionPoint,
) {
  const surfaceTile = tile.data;

  if (
    !defined(terrainProvider) ||
    (defined(this._minimumTerrainLevel) &&
      tile.level < this._minimumTerrainLevel)
  ) {
    return false;
  }
  if (
    defined(this._maximumTerrainLevel) &&
    tile.level > this._maximumTerrainLevel
  ) {
    return false;
  }

  if (!defined(insertionPoint)) {
    insertionPoint = surfaceTile.imagery.length;
  }

  const imageryProvider = this._imageryProvider;
  if (!this.ready) {
    // The imagery provider is not ready, so we can't create skeletons, yet.
    // Instead, add a placeholder so that we'll know to create
    // the skeletons once the provider is ready.
    this._skeletonPlaceholder.loadingImagery.addReference();
    surfaceTile.imagery.splice(insertionPoint, 0, this._skeletonPlaceholder);
    return true;
  }

  // Use Web Mercator for our texture coordinate computations if this imagery layer uses
  // that projection and the terrain tile falls entirely inside the valid bounds of the
  // projection.
  const useWebMercatorT =
    imageryProvider.tilingScheme.projection instanceof WebMercatorProjection &&
    tile.rectangle.north < WebMercatorProjection.MaximumLatitude &&
    tile.rectangle.south > -WebMercatorProjection.MaximumLatitude;

  // Compute the rectangle of the imagery from this imageryProvider that overlaps
  // the geometry tile.  The ImageryProvider and ImageryLayer both have the
  // opportunity to constrain the rectangle.  The imagery TilingScheme's rectangle
  // always fully contains the ImageryProvider's rectangle.
  const imageryBounds = Rectangle.intersection(
    imageryProvider.rectangle,
    this._rectangle,
    imageryBoundsScratch,
  );
  let rectangle = Rectangle.intersection(
    tile.rectangle,
    imageryBounds,
    tileImageryBoundsScratch,
  );

  if (!defined(rectangle)) {
    // There is no overlap between this terrain tile and this imagery
    // provider.  Unless this is the base layer, no skeletons need to be created.
    // We stretch texels at the edge of the base layer over the entire globe.
    if (!this.isBaseLayer()) {
      return false;
    }

    const baseImageryRectangle = imageryBounds;
    const baseTerrainRectangle = tile.rectangle;
    rectangle = tileImageryBoundsScratch;

    if (baseTerrainRectangle.south >= baseImageryRectangle.north) {
      rectangle.north = rectangle.south = baseImageryRectangle.north;
    } else if (baseTerrainRectangle.north <= baseImageryRectangle.south) {
      rectangle.north = rectangle.south = baseImageryRectangle.south;
    } else {
      rectangle.south = Math.max(
        baseTerrainRectangle.south,
        baseImageryRectangle.south,
      );
      rectangle.north = Math.min(
        baseTerrainRectangle.north,
        baseImageryRectangle.north,
      );
    }

    if (baseTerrainRectangle.west >= baseImageryRectangle.east) {
      rectangle.west = rectangle.east = baseImageryRectangle.east;
    } else if (baseTerrainRectangle.east <= baseImageryRectangle.west) {
      rectangle.west = rectangle.east = baseImageryRectangle.west;
    } else {
      rectangle.west = Math.max(
        baseTerrainRectangle.west,
        baseImageryRectangle.west,
      );
      rectangle.east = Math.min(
        baseTerrainRectangle.east,
        baseImageryRectangle.east,
      );
    }
  }

  let latitudeClosestToEquator = 0.0;
  if (rectangle.south > 0.0) {
    latitudeClosestToEquator = rectangle.south;
  } else if (rectangle.north < 0.0) {
    latitudeClosestToEquator = rectangle.north;
  }

  // Compute the required level in the imagery tiling scheme.
  // The errorRatio should really be imagerySSE / terrainSSE rather than this hard-coded value.
  // But first we need configurable imagery SSE and we need the rendering to be able to handle more
  // images attached to a terrain tile than there are available texture units.  So that's for the future.
  const errorRatio = 1.0;
  const targetGeometricError =
    errorRatio * terrainProvider.getLevelMaximumGeometricError(tile.level);
  let imageryLevel = getLevelWithMaximumTexelSpacing(
    this,
    targetGeometricError,
    latitudeClosestToEquator,
  );
  imageryLevel = Math.max(0, imageryLevel);
  const maximumLevel = imageryProvider.maximumLevel;
  if (imageryLevel > maximumLevel) {
    imageryLevel = maximumLevel;
  }

  if (defined(imageryProvider.minimumLevel)) {
    const minimumLevel = imageryProvider.minimumLevel;
    if (imageryLevel < minimumLevel) {
      imageryLevel = minimumLevel;
    }
  }

  const imageryTilingScheme = imageryProvider.tilingScheme;
  const northwestTileCoordinates = imageryTilingScheme.positionToTileXY(
    Rectangle.northwest(rectangle),
    imageryLevel,
  );
  const southeastTileCoordinates = imageryTilingScheme.positionToTileXY(
    Rectangle.southeast(rectangle),
    imageryLevel,
  );

  // If the southeast corner of the rectangle lies very close to the north or west side
  // of the southeast tile, we don't actually need the southernmost or easternmost
  // tiles.
  // Similarly, if the northwest corner of the rectangle lies very close to the south or east side
  // of the northwest tile, we don't actually need the northernmost or westernmost tiles.

  // We define "very close" as being within 1/512 of the width of the tile.
  let veryCloseX = tile.rectangle.width / 512.0;
  let veryCloseY = tile.rectangle.height / 512.0;

  const northwestTileRectangle = imageryTilingScheme.tileXYToRectangle(
    northwestTileCoordinates.x,
    northwestTileCoordinates.y,
    imageryLevel,
  );
  if (
    Math.abs(northwestTileRectangle.south - tile.rectangle.north) <
      veryCloseY &&
    northwestTileCoordinates.y < southeastTileCoordinates.y
  ) {
    ++northwestTileCoordinates.y;
  }
  if (
    Math.abs(northwestTileRectangle.east - tile.rectangle.west) < veryCloseX &&
    northwestTileCoordinates.x < southeastTileCoordinates.x
  ) {
    ++northwestTileCoordinates.x;
  }

  const southeastTileRectangle = imageryTilingScheme.tileXYToRectangle(
    southeastTileCoordinates.x,
    southeastTileCoordinates.y,
    imageryLevel,
  );
  if (
    Math.abs(southeastTileRectangle.north - tile.rectangle.south) <
      veryCloseY &&
    southeastTileCoordinates.y > northwestTileCoordinates.y
  ) {
    --southeastTileCoordinates.y;
  }
  if (
    Math.abs(southeastTileRectangle.west - tile.rectangle.east) < veryCloseX &&
    southeastTileCoordinates.x > northwestTileCoordinates.x
  ) {
    --southeastTileCoordinates.x;
  }

  // Create TileImagery instances for each imagery tile overlapping this terrain tile.
  // We need to do all texture coordinate computations in the imagery tile's tiling scheme.

  const terrainRectangle = Rectangle.clone(
    tile.rectangle,
    terrainRectangleScratch,
  );
  let imageryRectangle = imageryTilingScheme.tileXYToRectangle(
    northwestTileCoordinates.x,
    northwestTileCoordinates.y,
    imageryLevel,
  );
  let clippedImageryRectangle = Rectangle.intersection(
    imageryRectangle,
    imageryBounds,
    clippedRectangleScratch,
  );

  let imageryTileXYToRectangle;
  if (useWebMercatorT) {
    imageryTilingScheme.rectangleToNativeRectangle(
      terrainRectangle,
      terrainRectangle,
    );
    imageryTilingScheme.rectangleToNativeRectangle(
      imageryRectangle,
      imageryRectangle,
    );
    imageryTilingScheme.rectangleToNativeRectangle(
      clippedImageryRectangle,
      clippedImageryRectangle,
    );
    imageryTilingScheme.rectangleToNativeRectangle(
      imageryBounds,
      imageryBounds,
    );
    imageryTileXYToRectangle =
      imageryTilingScheme.tileXYToNativeRectangle.bind(imageryTilingScheme);
    veryCloseX = terrainRectangle.width / 512.0;
    veryCloseY = terrainRectangle.height / 512.0;
  } else {
    imageryTileXYToRectangle =
      imageryTilingScheme.tileXYToRectangle.bind(imageryTilingScheme);
  }

  let minU;
  let maxU = 0.0;

  let minV = 1.0;
  let maxV;

  // If this is the northern-most or western-most tile in the imagery tiling scheme,
  // it may not start at the northern or western edge of the terrain tile.
  // Calculate where it does start.
  if (
    !this.isBaseLayer() &&
    Math.abs(clippedImageryRectangle.west - terrainRectangle.west) >= veryCloseX
  ) {
    maxU = Math.min(
      1.0,
      (clippedImageryRectangle.west - terrainRectangle.west) /
        terrainRectangle.width,
    );
  }

  if (
    !this.isBaseLayer() &&
    Math.abs(clippedImageryRectangle.north - terrainRectangle.north) >=
      veryCloseY
  ) {
    minV = Math.max(
      0.0,
      (clippedImageryRectangle.north - terrainRectangle.south) /
        terrainRectangle.height,
    );
  }

  const initialMinV = minV;

  for (
    let i = northwestTileCoordinates.x;
    i <= southeastTileCoordinates.x;
    i++
  ) {
    minU = maxU;

    imageryRectangle = imageryTileXYToRectangle(
      i,
      northwestTileCoordinates.y,
      imageryLevel,
    );
    clippedImageryRectangle = Rectangle.simpleIntersection(
      imageryRectangle,
      imageryBounds,
      clippedRectangleScratch,
    );

    if (!defined(clippedImageryRectangle)) {
      continue;
    }

    maxU = Math.min(
      1.0,
      (clippedImageryRectangle.east - terrainRectangle.west) /
        terrainRectangle.width,
    );

    // If this is the eastern-most imagery tile mapped to this terrain tile,
    // and there are more imagery tiles to the east of this one, the maxU
    // should be 1.0 to make sure rounding errors don't make the last
    // image fall shy of the edge of the terrain tile.
    if (
      i === southeastTileCoordinates.x &&
      (this.isBaseLayer() ||
        Math.abs(clippedImageryRectangle.east - terrainRectangle.east) <
          veryCloseX)
    ) {
      maxU = 1.0;
    }

    minV = initialMinV;

    for (
      let j = northwestTileCoordinates.y;
      j <= southeastTileCoordinates.y;
      j++
    ) {
      maxV = minV;

      imageryRectangle = imageryTileXYToRectangle(i, j, imageryLevel);
      clippedImageryRectangle = Rectangle.simpleIntersection(
        imageryRectangle,
        imageryBounds,
        clippedRectangleScratch,
      );

      if (!defined(clippedImageryRectangle)) {
        continue;
      }

      minV = Math.max(
        0.0,
        (clippedImageryRectangle.south - terrainRectangle.south) /
          terrainRectangle.height,
      );

      // If this is the southern-most imagery tile mapped to this terrain tile,
      // and there are more imagery tiles to the south of this one, the minV
      // should be 0.0 to make sure rounding errors don't make the last
      // image fall shy of the edge of the terrain tile.
      if (
        j === southeastTileCoordinates.y &&
        (this.isBaseLayer() ||
          Math.abs(clippedImageryRectangle.south - terrainRectangle.south) <
            veryCloseY)
      ) {
        minV = 0.0;
      }

      const texCoordsRectangle = new Cartesian4(minU, minV, maxU, maxV);
      const imagery = this.getImageryFromCache(i, j, imageryLevel);
      surfaceTile.imagery.splice(
        insertionPoint,
        0,
        new TileImagery(imagery, texCoordsRectangle, useWebMercatorT),
      );
      ++insertionPoint;
    }
  }

  return true;
};

/**
 * Calculate the translation and scale for a particular {@link TileImagery} attached to a
 * particular terrain tile.
 *
 * @private
 *
 * @param {Tile} tile The terrain tile.
 * @param {TileImagery} tileImagery The imagery tile mapping.
 * @returns {Cartesian4} The translation and scale where X and Y are the translation and Z and W
 *          are the scale.
 */
ImageryLayer.prototype._calculateTextureTranslationAndScale = function (
  tile,
  tileImagery,
) {
  let imageryRectangle = tileImagery.readyImagery.rectangle;
  let terrainRectangle = tile.rectangle;

  if (tileImagery.useWebMercatorT) {
    const tilingScheme =
      tileImagery.readyImagery.imageryLayer.imageryProvider.tilingScheme;
    imageryRectangle = tilingScheme.rectangleToNativeRectangle(
      imageryRectangle,
      imageryBoundsScratch,
    );
    terrainRectangle = tilingScheme.rectangleToNativeRectangle(
      terrainRectangle,
      terrainRectangleScratch,
    );
  }

  const terrainWidth = terrainRectangle.width;
  const terrainHeight = terrainRectangle.height;

  const scaleX = terrainWidth / imageryRectangle.width;
  const scaleY = terrainHeight / imageryRectangle.height;
  return new Cartesian4(
    (scaleX * (terrainRectangle.west - imageryRectangle.west)) / terrainWidth,
    (scaleY * (terrainRectangle.south - imageryRectangle.south)) /
      terrainHeight,
    scaleX,
    scaleY,
  );
};

/**
 * Request a particular piece of imagery from the imagery provider.  This method handles raising an
 * error event if the request fails, and retrying the request if necessary.
 *
 * @private
 *
 * @param {Imagery} imagery The imagery to request.
 */
ImageryLayer.prototype._requestImagery = function (imagery) {
  const imageryProvider = this._imageryProvider;

  const that = this;

  function success(image) {
    if (!defined(image)) {
      return failure();
    }

    imagery.image = image;
    imagery.state = ImageryState.RECEIVED;
    imagery.request = undefined;

    TileProviderError.reportSuccess(that._requestImageError);
  }

  function failure(e) {
    if (imagery.request.state === RequestState.CANCELLED) {
      // Cancelled due to low priority - try again later.
      imagery.state = ImageryState.UNLOADED;
      imagery.request = undefined;
      return;
    }

    // Initially assume failure. An error handler may retry, in which case the state will
    // change to TRANSITIONING.
    imagery.state = ImageryState.FAILED;
    imagery.request = undefined;

    const message = `Failed to obtain image tile X: ${imagery.x} Y: ${imagery.y} Level: ${imagery.level}.`;
    that._requestImageError = TileProviderError.reportError(
      that._requestImageError,
      imageryProvider,
      imageryProvider.errorEvent,
      message,
      imagery.x,
      imagery.y,
      imagery.level,
      e,
    );
    if (that._requestImageError.retry) {
      doRequest();
    }
  }

  function doRequest() {
    const request = new Request({
      throttle: false,
      throttleByServer: true,
      type: RequestType.IMAGERY,
    });
    imagery.request = request;
    imagery.state = ImageryState.TRANSITIONING;
    const imagePromise = imageryProvider.requestImage(
      imagery.x,
      imagery.y,
      imagery.level,
      request,
    );

    if (!defined(imagePromise)) {
      // Too many parallel requests, so postpone loading tile.
      imagery.state = ImageryState.UNLOADED;
      imagery.request = undefined;
      return;
    }

    if (defined(imageryProvider.getTileCredits)) {
      imagery.credits = imageryProvider.getTileCredits(
        imagery.x,
        imagery.y,
        imagery.level,
      );
    }

    imagePromise
      .then(function (image) {
        success(image);
      })
      .catch(function (e) {
        failure(e);
      });
  }

  doRequest();
};

ImageryLayer.prototype._createTextureWebGL = function (context, imagery) {
  const sampler = new Sampler({
    minificationFilter: this.minificationFilter,
    magnificationFilter: this.magnificationFilter,
  });

  const image = imagery.image;

  if (defined(image.internalFormat)) {
    return new Texture({
      context: context,
      pixelFormat: image.internalFormat,
      width: image.width,
      height: image.height,
      source: {
        arrayBufferView: image.bufferView,
      },
      sampler: sampler,
    });
  }
  return new Texture({
    context: context,
    source: image,
    pixelFormat: this._imageryProvider.hasAlphaChannel
      ? PixelFormat.RGBA
      : PixelFormat.RGB,
    sampler: sampler,
  });
};

/**
 * Create a WebGL texture for a given {@link Imagery} instance.
 *
 * @private
 *
 * @param {Context} context The rendered context to use to create textures.
 * @param {Imagery} imagery The imagery for which to create a texture.
 */
ImageryLayer.prototype._createTexture = function (context, imagery) {
  const imageryProvider = this._imageryProvider;
  const image = imagery.image;

  // If this imagery provider has a discard policy, use it to check if this
  // image should be discarded.
  if (defined(imageryProvider.tileDiscardPolicy)) {
    const discardPolicy = imageryProvider.tileDiscardPolicy;
    if (defined(discardPolicy)) {
      // If the discard policy is not ready yet, transition back to the
      // RECEIVED state and we'll try again next time.
      if (!discardPolicy.isReady()) {
        imagery.state = ImageryState.RECEIVED;
        return;
      }

      // Mark discarded imagery tiles invalid.  Parent imagery will be used instead.
      if (discardPolicy.shouldDiscardImage(image)) {
        imagery.state = ImageryState.INVALID;
        return;
      }
    }
  }

  //>>includeStart('debug', pragmas.debug);
  if (
    this.minificationFilter !== TextureMinificationFilter.NEAREST &&
    this.minificationFilter !== TextureMinificationFilter.LINEAR
  ) {
    throw new DeveloperError(
      "ImageryLayer minification filter must be NEAREST or LINEAR",
    );
  }
  //>>includeEnd('debug');

  // Imagery does not need to be discarded, so upload it to WebGL.
  const texture = this._createTextureWebGL(context, imagery);

  if (
    imageryProvider.tilingScheme.projection instanceof WebMercatorProjection
  ) {
    imagery.textureWebMercator = texture;
  } else {
    imagery.texture = texture;
  }
  imagery.image = undefined;
  imagery.state = ImageryState.TEXTURE_LOADED;
};

function getSamplerKey(
  minificationFilter,
  magnificationFilter,
  maximumAnisotropy,
) {
  return `${minificationFilter}:${magnificationFilter}:${maximumAnisotropy}`;
}

ImageryLayer.prototype._finalizeReprojectTexture = function (context, texture) {
  let minificationFilter = this.minificationFilter;
  const magnificationFilter = this.magnificationFilter;
  const usesLinearTextureFilter =
    minificationFilter === TextureMinificationFilter.LINEAR &&
    magnificationFilter === TextureMagnificationFilter.LINEAR;
  // Use mipmaps if this texture has power-of-two dimensions.
  // In addition, mipmaps are only generated if the texture filters are both LINEAR.
  if (
    usesLinearTextureFilter &&
    !PixelFormat.isCompressedFormat(texture.pixelFormat) &&
    CesiumMath.isPowerOfTwo(texture.width) &&
    CesiumMath.isPowerOfTwo(texture.height)
  ) {
    minificationFilter = TextureMinificationFilter.LINEAR_MIPMAP_LINEAR;
    const maximumSupportedAnisotropy =
      ContextLimits.maximumTextureFilterAnisotropy;
    const maximumAnisotropy = Math.min(
      maximumSupportedAnisotropy,
      this._maximumAnisotropy ?? maximumSupportedAnisotropy,
    );
    const mipmapSamplerKey = getSamplerKey(
      minificationFilter,
      magnificationFilter,
      maximumAnisotropy,
    );
    let mipmapSamplers = context.cache.imageryLayerMipmapSamplers;
    if (!defined(mipmapSamplers)) {
      mipmapSamplers = {};
      context.cache.imageryLayerMipmapSamplers = mipmapSamplers;
    }
    let mipmapSampler = mipmapSamplers[mipmapSamplerKey];
    if (!defined(mipmapSampler)) {
      mipmapSampler = mipmapSamplers[mipmapSamplerKey] = new Sampler({
        wrapS: TextureWrap.CLAMP_TO_EDGE,
        wrapT: TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: minificationFilter,
        magnificationFilter: magnificationFilter,
        maximumAnisotropy: maximumAnisotropy,
      });
    }
    texture.generateMipmap(MipmapHint.NICEST);
    texture.sampler = mipmapSampler;
  } else {
    const nonMipmapSamplerKey = getSamplerKey(
      minificationFilter,
      magnificationFilter,
      0,
    );
    let nonMipmapSamplers = context.cache.imageryLayerNonMipmapSamplers;
    if (!defined(nonMipmapSamplers)) {
      nonMipmapSamplers = {};
      context.cache.imageryLayerNonMipmapSamplers = nonMipmapSamplers;
    }
    let nonMipmapSampler = nonMipmapSamplers[nonMipmapSamplerKey];
    if (!defined(nonMipmapSampler)) {
      nonMipmapSampler = nonMipmapSamplers[nonMipmapSamplerKey] = new Sampler({
        wrapS: TextureWrap.CLAMP_TO_EDGE,
        wrapT: TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: minificationFilter,
        magnificationFilter: magnificationFilter,
      });
    }
    texture.sampler = nonMipmapSampler;
  }
};

/**
 * Enqueues a command re-projecting a texture to a {@link GeographicProjection} on the next update, if necessary, and generate
 * mipmaps for the geographic texture.
 *
 * @private
 *
 * @param {FrameState} frameState The frameState.
 * @param {Imagery} imagery The imagery instance to reproject.
 * @param {boolean} [needGeographicProjection=true] True to reproject to geographic, or false if Web Mercator is fine.
 */
ImageryLayer.prototype._reprojectTexture = function (
  frameState,
  imagery,
  needGeographicProjection,
) {
  const texture = imagery.textureWebMercator || imagery.texture;
  const rectangle = imagery.rectangle;
  const context = frameState.context;

  needGeographicProjection = needGeographicProjection ?? true;

  // Reproject this texture if it is not already in a geographic projection and
  // the pixels are more than 1e-5 radians apart.  The pixel spacing cutoff
  // avoids precision problems in the reprojection transformation while making
  // no noticeable difference in the georeferencing of the image.
  if (
    needGeographicProjection &&
    !(
      this._imageryProvider.tilingScheme.projection instanceof
      GeographicProjection
    ) &&
    rectangle.width / texture.width > 1e-5
  ) {
    const that = this;
    imagery.addReference();
    const computeCommand = new ComputeCommand({
      persists: true,
      owner: this,
      // Update render resources right before execution instead of now.
      // This allows different ImageryLayers to share the same vao and buffers.
      preExecute: function (command) {
        reprojectToGeographic(command, context, texture, imagery.rectangle);
      },
      postExecute: function (outputTexture) {
        imagery.texture = outputTexture;
        that._finalizeReprojectTexture(context, outputTexture);
        imagery.state = ImageryState.READY;
        imagery.releaseReference();
      },
      canceled: function () {
        imagery.state = ImageryState.TEXTURE_LOADED;
        imagery.releaseReference();
      },
    });
    this._reprojectComputeCommands.push(computeCommand);
  } else {
    if (needGeographicProjection) {
      imagery.texture = texture;
    }
    this._finalizeReprojectTexture(context, texture);
    imagery.state = ImageryState.READY;
  }
};

/**
 * Updates frame state to execute any queued texture re-projections.
 *
 * @private
 *
 * @param {FrameState} frameState The frameState.
 */
ImageryLayer.prototype.queueReprojectionCommands = function (frameState) {
  const computeCommands = this._reprojectComputeCommands;
  const length = computeCommands.length;
  for (let i = 0; i < length; ++i) {
    frameState.commandList.push(computeCommands[i]);
  }
  computeCommands.length = 0;
};

/**
 * Cancels re-projection commands queued for the next frame.
 *
 * @private
 */
ImageryLayer.prototype.cancelReprojections = function () {
  this._reprojectComputeCommands.forEach(function (command) {
    if (defined(command.canceled)) {
      command.canceled();
    }
  });
  this._reprojectComputeCommands.length = 0;
};

ImageryLayer.prototype.getImageryFromCache = function (
  x,
  y,
  level,
  imageryRectangle,
) {
  const cacheKey = getImageryCacheKey(x, y, level);
  let imagery = this._imageryCache[cacheKey];

  if (!defined(imagery)) {
    imagery = new Imagery(this, x, y, level, imageryRectangle);
    this._imageryCache[cacheKey] = imagery;
  }

  imagery.addReference();
  return imagery;
};

ImageryLayer.prototype.removeImageryFromCache = function (imagery) {
  const cacheKey = getImageryCacheKey(imagery.x, imagery.y, imagery.level);
  delete this._imageryCache[cacheKey];
};

function getImageryCacheKey(x, y, level) {
  return JSON.stringify([x, y, level]);
}

const uniformMap = {
  u_textureDimensions: function () {
    return this.textureDimensions;
  },
  u_texture: function () {
    return this.texture;
  },

  textureDimensions: new Cartesian2(),
  texture: undefined,
};

const float32ArrayScratch = FeatureDetection.supportsTypedArrays()
  ? new Float32Array(2 * 64)
  : undefined;

function reprojectToGeographic(command, context, texture, rectangle) {
  // This function has gone through a number of iterations, because GPUs are awesome.
  //
  // Originally, we had a very simple vertex shader and computed the Web Mercator texture coordinates
  // per-fragment in the fragment shader.  That worked well, except on mobile devices, because
  // fragment shaders have limited precision on many mobile devices.  The result was smearing artifacts
  // at medium zoom levels because different geographic texture coordinates would be reprojected to Web
  // Mercator as the same value.
  //
  // Our solution was to reproject to Web Mercator in the vertex shader instead of the fragment shader.
  // This required far more vertex data.  With fragment shader reprojection, we only needed a single quad.
  // But to achieve the same precision with vertex shader reprojection, we needed a vertex for each
  // output pixel.  So we used a grid of 256x256 vertices, because most of our imagery
  // tiles are 256x256.  Fortunately the grid could be created and uploaded to the GPU just once and
  // re-used for all reprojections, so the performance was virtually unchanged from our original fragment
  // shader approach.  See https://github.com/CesiumGS/cesium/pull/714.
  //
  // Over a year later, we noticed (https://github.com/CesiumGS/cesium/issues/2110)
  // that our reprojection code was creating a rare but severe artifact on some GPUs (Intel HD 4600
  // for one).  The problem was that the GLSL sin function on these GPUs had a discontinuity at fine scales in
  // a few places.
  //
  // We solved this by implementing a more reliable sin function based on the CORDIC algorithm
  // (https://github.com/CesiumGS/cesium/pull/2111).  Even though this was a fair
  // amount of code to be executing per vertex, the performance seemed to be pretty good on most GPUs.
  // Unfortunately, on some GPUs, the performance was absolutely terrible
  // (https://github.com/CesiumGS/cesium/issues/2258).
  //
  // So that brings us to our current solution, the one you see here.  Effectively, we compute the Web
  // Mercator texture coordinates on the CPU and store the T coordinate with each vertex (the S coordinate
  // is the same in Geographic and Web Mercator).  To make this faster, we reduced our reprojection mesh
  // to be only 2 vertices wide and 64 vertices high.  We should have reduced the width to 2 sooner,
  // because the extra vertices weren't buying us anything.  The height of 64 means we are technically
  // doing a slightly less accurate reprojection than we were before, but we can't see the difference
  // so it's worth the 4x speedup.

  let reproject = context.cache.imageryLayer_reproject;

  if (!defined(reproject)) {
    reproject = context.cache.imageryLayer_reproject = {
      vertexArray: undefined,
      shaderProgram: undefined,
      sampler: undefined,
      destroy: function () {
        if (defined(this.framebuffer)) {
          this.framebuffer.destroy();
        }
        if (defined(this.vertexArray)) {
          this.vertexArray.destroy();
        }
        if (defined(this.shaderProgram)) {
          this.shaderProgram.destroy();
        }
      },
    };

    const positions = new Float32Array(2 * 64 * 2);
    let index = 0;
    for (let j = 0; j < 64; ++j) {
      const y = j / 63.0;
      positions[index++] = 0.0;
      positions[index++] = y;
      positions[index++] = 1.0;
      positions[index++] = y;
    }

    const reprojectAttributeIndices = {
      position: 0,
      webMercatorT: 1,
    };

    const indices = TerrainProvider.getRegularGridIndices(2, 64);
    const indexBuffer = Buffer.createIndexBuffer({
      context: context,
      typedArray: indices,
      usage: BufferUsage.STATIC_DRAW,
      indexDatatype: IndexDatatype.UNSIGNED_SHORT,
    });

    reproject.vertexArray = new VertexArray({
      context: context,
      attributes: [
        {
          index: reprojectAttributeIndices.position,
          vertexBuffer: Buffer.createVertexBuffer({
            context: context,
            typedArray: positions,
            usage: BufferUsage.STATIC_DRAW,
          }),
          componentsPerAttribute: 2,
        },
        {
          index: reprojectAttributeIndices.webMercatorT,
          vertexBuffer: Buffer.createVertexBuffer({
            context: context,
            sizeInBytes: 64 * 2 * 4,
            usage: BufferUsage.STREAM_DRAW,
          }),
          componentsPerAttribute: 1,
        },
      ],
      indexBuffer: indexBuffer,
    });

    const vs = new ShaderSource({
      sources: [ReprojectWebMercatorVS],
    });

    reproject.shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vs,
      fragmentShaderSource: ReprojectWebMercatorFS,
      attributeLocations: reprojectAttributeIndices,
    });

    reproject.sampler = new Sampler({
      wrapS: TextureWrap.CLAMP_TO_EDGE,
      wrapT: TextureWrap.CLAMP_TO_EDGE,
      minificationFilter: TextureMinificationFilter.LINEAR,
      magnificationFilter: TextureMagnificationFilter.LINEAR,
    });
  }

  texture.sampler = reproject.sampler;

  const width = texture.width;
  const height = texture.height;

  uniformMap.textureDimensions.x = width;
  uniformMap.textureDimensions.y = height;
  uniformMap.texture = texture;

  let sinLatitude = Math.sin(rectangle.south);
  const southMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));

  sinLatitude = Math.sin(rectangle.north);
  const northMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
  const oneOverMercatorHeight = 1.0 / (northMercatorY - southMercatorY);

  const outputTexture = new Texture({
    context: context,
    width: width,
    height: height,
    pixelFormat: texture.pixelFormat,
    pixelDatatype: texture.pixelDatatype,
    preMultiplyAlpha: texture.preMultiplyAlpha,
  });

  // Allocate memory for the mipmaps.  Failure to do this before rendering
  // to the texture via the FBO, and calling generateMipmap later,
  // will result in the texture appearing blank.  I can't pretend to
  // understand exactly why this is.
  if (CesiumMath.isPowerOfTwo(width) && CesiumMath.isPowerOfTwo(height)) {
    outputTexture.generateMipmap(MipmapHint.NICEST);
  }

  const south = rectangle.south;
  const north = rectangle.north;

  const webMercatorT = float32ArrayScratch;

  let outputIndex = 0;
  for (let webMercatorTIndex = 0; webMercatorTIndex < 64; ++webMercatorTIndex) {
    const fraction = webMercatorTIndex / 63.0;
    const latitude = CesiumMath.lerp(south, north, fraction);
    sinLatitude = Math.sin(latitude);
    const mercatorY = 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
    const mercatorFraction =
      (mercatorY - southMercatorY) * oneOverMercatorHeight;
    webMercatorT[outputIndex++] = mercatorFraction;
    webMercatorT[outputIndex++] = mercatorFraction;
  }

  reproject.vertexArray
    .getAttribute(1)
    .vertexBuffer.copyFromArrayView(webMercatorT);

  command.shaderProgram = reproject.shaderProgram;
  command.outputTexture = outputTexture;
  command.uniformMap = uniformMap;
  command.vertexArray = reproject.vertexArray;
}

/**
 * Gets the level with the specified world coordinate spacing between texels, or less.
 *
 * @param {ImageryLayer} layer The imagery layer to use.
 * @param {number} texelSpacing The texel spacing for which to find a corresponding level.
 * @param {number} latitudeClosestToEquator The latitude closest to the equator that we're concerned with.
 * @returns {number} The level with the specified texel spacing or less.
 * @private
 */
function getLevelWithMaximumTexelSpacing(
  layer,
  texelSpacing,
  latitudeClosestToEquator,
) {
  // PERFORMANCE_IDEA: factor out the stuff that doesn't change.
  const imageryProvider = layer._imageryProvider;
  const tilingScheme = imageryProvider.tilingScheme;
  const ellipsoid = tilingScheme.ellipsoid;
  const latitudeFactor = !(
    layer._imageryProvider.tilingScheme.projection instanceof
    GeographicProjection
  )
    ? Math.cos(latitudeClosestToEquator)
    : 1.0;
  const tilingSchemeRectangle = tilingScheme.rectangle;
  const levelZeroMaximumTexelSpacing =
    (ellipsoid.maximumRadius * tilingSchemeRectangle.width * latitudeFactor) /
    (imageryProvider.tileWidth * tilingScheme.getNumberOfXTilesAtLevel(0));

  const twoToTheLevelPower = levelZeroMaximumTexelSpacing / texelSpacing;
  const level = Math.log(twoToTheLevelPower) / Math.log(2);
  const rounded = Math.round(level);
  return rounded | 0;
}

function handleError(errorEvent, error) {
  if (errorEvent.numberOfListeners > 0) {
    errorEvent.raiseEvent(error);
  } else {
    // Default handler is to log to the console
    console.error(error);
  }
}

async function handlePromise(instance, promise) {
  let provider;
  try {
    provider = await Promise.resolve(promise);
    if (instance.isDestroyed()) {
      return;
    }
    instance._imageryProvider = provider;
    instance._readyEvent.raiseEvent(provider);
  } catch (error) {
    handleError(instance._errorEvent, error);
  }
}

export default ImageryLayer;

/**
 * A function that is called when an error occurs.
 * @callback ImageryLayer.ErrorEventCallback
 *
 * @this ImageryLayer
 * @param {Error} err An object holding details about the error that occurred.
 */

/**
 * A function that is called when the provider has been created
 * @callback ImageryLayer.ReadyEventCallback
 *
 * @this ImageryLayer
 * @param {ImageryProvider} provider The created imagery provider.
 */
