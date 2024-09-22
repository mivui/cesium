import BoundingRectangle from "../Core/BoundingRectangle.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import BoxGeometry from "../Core/BoxGeometry.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import createGuid from "../Core/createGuid.js";
import CullingVolume from "../Core/CullingVolume.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidGeometry from "../Core/EllipsoidGeometry.js";
import Event from "../Core/Event.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import HeightReference from "./HeightReference.js";
import Intersect from "../Core/Intersect.js";
import JulianDate from "../Core/JulianDate.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import mergeSort from "../Core/mergeSort.js";
import Occluder from "../Core/Occluder.js";
import OrthographicFrustum from "../Core/OrthographicFrustum.js";
import OrthographicOffCenterFrustum from "../Core/OrthographicOffCenterFrustum.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import PerspectiveOffCenterFrustum from "../Core/PerspectiveOffCenterFrustum.js";
import Rectangle from "../Core/Rectangle.js";
import RequestScheduler from "../Core/RequestScheduler.js";
import TaskProcessor from "../Core/TaskProcessor.js";
import Transforms from "../Core/Transforms.js";
import ClearCommand from "../Renderer/ClearCommand.js";
import ComputeEngine from "../Renderer/ComputeEngine.js";
import Context from "../Renderer/Context.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import Atmosphere from "./Atmosphere.js";
import BrdfLutGenerator from "./BrdfLutGenerator.js";
import Camera from "./Camera.js";
import Cesium3DTilePass from "./Cesium3DTilePass.js";
import Cesium3DTilePassState from "./Cesium3DTilePassState.js";
import CreditDisplay from "./CreditDisplay.js";
import DebugCameraPrimitive from "./DebugCameraPrimitive.js";
import DepthPlane from "./DepthPlane.js";
import DerivedCommand from "./DerivedCommand.js";
import DeviceOrientationCameraController from "./DeviceOrientationCameraController.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";
import Fog from "./Fog.js";
import FrameState from "./FrameState.js";
import GlobeTranslucencyState from "./GlobeTranslucencyState.js";
import InvertClassification from "./InvertClassification.js";
import JobScheduler from "./JobScheduler.js";
import MapMode2D from "./MapMode2D.js";
import PerformanceDisplay from "./PerformanceDisplay.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Picking from "./Picking.js";
import PostProcessStageCollection from "./PostProcessStageCollection.js";
import Primitive from "./Primitive.js";
import PrimitiveCollection from "./PrimitiveCollection.js";
import SceneMode from "./SceneMode.js";
import SceneTransforms from "./SceneTransforms.js";
import SceneTransitioner from "./SceneTransitioner.js";
import ScreenSpaceCameraController from "./ScreenSpaceCameraController.js";
import ShadowMap from "./ShadowMap.js";
import SpecularEnvironmentCubeMap from "./SpecularEnvironmentCubeMap.js";
import StencilConstants from "./StencilConstants.js";
import SunLight from "./SunLight.js";
import SunPostProcess from "./SunPostProcess.js";
import TweenCollection from "./TweenCollection.js";
import View from "./View.js";
import DebugInspector from "./DebugInspector.js";
import VoxelCell from "./VoxelCell.js";
import VoxelPrimitive from "./VoxelPrimitive.js";

const requestRenderAfterFrame = function (scene) {
  return function () {
    scene.frameState.afterRender.push(function () {
      scene.requestRender();
    });
  };
};

/**
 * Cesium 虚拟场景中所有 3D 图形对象和状态的容器。 一般
 * 场景不是直接创建的;相反，它是由 {@link CesiumWidget} 隐式创建的。
 *
 * @alias Scene
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {HTMLCanvasElement} options.canvas 要为其创建场景的 HTML 画布元素。
 * @param {ContextOptions} [options.contextOptions] 上下文和 WebGL 创建属性。
 * @param {Element} [options.creditContainer] 将在其中显示演职员表的 HTML 元素。
 * @param {Element} [options.creditViewport] 用于显示信用弹出窗口的 HTML 元素。 如果未指定，则视口将添加为画布的同级。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 默认的椭球体。如果未指定，则使用默认椭球体。
 * @param {MapProjection} [options.mapProjection=new GeographicProjection（options.ellipsoid）] 在 2D 和 Columbus View 模式下使用的地图投影。
 * @param {boolean} [options.orderIndependentTranslucency=true] 如果为 true 且配置支持，则使用顺序无关的半透明。
 * @param {boolean} [options.scene3DOnly=false] 如果为 true，则优化 3D 模式的内存使用和性能，但禁用使用 2D 或哥伦布视图的功能。
 * @param {boolean} [options.shadows=false] 确定阴影是否由光源投射。
 * @param {MapMode2D} [options.mapMode2D=MapMode2D.INFINITE_SCROLL] 确定 2D 地图是可旋转的，还是可以在水平方向上无限滚动。
 * @param {boolean} [options.requestRenderMode=false] 如果为 true，则仅在需要时渲染帧，具体取决于场景中的变化。启用可以提高应用程序的性能，但需要使用 {@link Scene#requestRender} 在此模式下显式渲染新帧。在 API 的其他部分对场景进行更改后，这在许多情况下是必需的。参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染提高性能}。
 * @param {number} [options.maximumRenderTimeChange=0.0] 如果 requestRenderMode 为 true，则此值定义在请求渲染之前允许的模拟时间的最大变化。参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染提高性能}。
 * @param {number} [options.depthPlaneEllipsoidOffset=0.0] 调整 DepthPlane，以解决低于椭球零高程的渲染伪影。
 * @param {number} [options.msaaSamples=4] 如果提供，此值将控制多重采样抗锯齿的速率。典型的多重采样率为每像素 2 个、4 个样本，有时甚至 8 个样本。较高的 MSAA 采样率可能会影响性能，以换取提高的视觉质量。此值仅适用于支持多重采样渲染目标的 WebGL2 上下文。设置为 1 可禁用 MSAA。
 *
 * @see CesiumWidget
 * @see {@link http://www.khronos.org/registry/webgl/specs/latest/#5.2|WebGLContextAttributes}
 *
 * @exception {DeveloperError} options and options.canvas are required.
 *
 * @example
 * // Create scene without anisotropic texture filtering
 * const scene = new Cesium.Scene({
 *   canvas : canvas,
 *   contextOptions : {
 *     allowTextureFilterAnisotropic : false
 *   }
 * });
 */
function Scene(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const canvas = options.canvas;
  let creditContainer = options.creditContainer;
  let creditViewport = options.creditViewport;

  const contextOptions = clone(options.contextOptions);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(canvas)) {
    throw new DeveloperError("options and options.canvas are required.");
  }
  //>>includeEnd('debug');
  const hasCreditContainer = defined(creditContainer);
  const context = new Context(canvas, contextOptions);
  if (!hasCreditContainer) {
    creditContainer = document.createElement("div");
    creditContainer.style.position = "absolute";
    creditContainer.style.bottom = "0";
    creditContainer.style["text-shadow"] = "0 0 2px #000000";
    creditContainer.style.color = "#ffffff";
    creditContainer.style["font-size"] = "10px";
    creditContainer.style["padding-right"] = "5px";
    canvas.parentNode.appendChild(creditContainer);
  }
  if (!defined(creditViewport)) {
    creditViewport = canvas.parentNode;
  }

  this._id = createGuid();
  this._jobScheduler = new JobScheduler();
  this._frameState = new FrameState(
    context,
    new CreditDisplay(creditContainer, "•", creditViewport),
    this._jobScheduler
  );
  this._frameState.scene3DOnly = defaultValue(options.scene3DOnly, false);
  this._removeCreditContainer = !hasCreditContainer;
  this._creditContainer = creditContainer;

  this._canvas = canvas;
  this._context = context;
  this._computeEngine = new ComputeEngine(context);

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._globe = undefined;
  this._globeTranslucencyState = new GlobeTranslucencyState();
  this._primitives = new PrimitiveCollection();
  this._groundPrimitives = new PrimitiveCollection();

  this._globeHeight = undefined;
  this._globeHeightDirty = true;
  this._cameraUnderground = false;
  this._removeUpdateHeightCallback = undefined;

  this._logDepthBuffer = Scene.defaultLogDepthBuffer && context.fragmentDepth;
  this._logDepthBufferDirty = true;

  this._tweens = new TweenCollection();

  this._shaderFrameCount = 0;

  this._sunPostProcess = undefined;

  this._computeCommandList = [];
  this._overlayCommandList = [];

  this._useOIT = defaultValue(options.orderIndependentTranslucency, true);
  this._executeOITFunction = undefined;

  this._depthPlane = new DepthPlane(options.depthPlaneEllipsoidOffset);

  this._clearColorCommand = new ClearCommand({
    color: new Color(),
    stencil: 0,
    owner: this,
  });
  this._depthClearCommand = new ClearCommand({
    depth: 1.0,
    owner: this,
  });
  this._stencilClearCommand = new ClearCommand({
    stencil: 0,
  });
  this._classificationStencilClearCommand = new ClearCommand({
    stencil: 0,
    renderState: RenderState.fromCache({
      stencilMask: StencilConstants.CLASSIFICATION_MASK,
    }),
  });

  this._depthOnlyRenderStateCache = {};

  this._transitioner = new SceneTransitioner(this);

  this._preUpdate = new Event();
  this._postUpdate = new Event();

  this._renderError = new Event();
  this._preRender = new Event();
  this._postRender = new Event();

  this._minimumDisableDepthTestDistance = 0.0;
  this._debugInspector = new DebugInspector();

  this._msaaSamples = defaultValue(options.msaaSamples, 4);

  /**
   * 始终捕获 <code>render</code> 中发生的异常，以便引发
   * <code>renderError</code> 事件。 如果此属性为 true，则重新引发错误
   * 在引发事件后。 如果此属性为 false，<code>则 render</code> 函数
   * 在引发事件后正常返回。
   *
   * @type {boolean}
   * @default false
   */
  this.rethrowRenderErrors = false;

  /**
   * 确定是否立即完成
   * 用户输入的场景过渡动画。
   *
   * @type {boolean}
   * @default true
   */
  this.completeMorphOnUserInput = true;

  /**
   * 该事件在场景转换开始时触发。
   * @type {Event}
   * @default Event()
   */
  this.morphStart = new Event();

  /**
   * 该事件在场景转换完成时触发。
   * @type {Event}
   * @default Event()
   */
  this.morphComplete = new Event();

  /**
   * 用于绘制星星的 {@link SkyBox} 。
   *
   * @type {SkyBox}
   * @default undefined
   *
   * @see Scene#backgroundColor
   */
  this.skyBox = undefined;

  /**
   * The sky atmosphere drawn around the globe.
   *
   * @type {SkyAtmosphere}
   * @default undefined
   */
  this.skyAtmosphere = undefined;

  /**
   * The {@link Sun}.
   *
   * @type {Sun}
   * @default undefined
   */
  this.sun = undefined;

  /**
   * 启用后，在太阳上使用泛光过滤器。
   *
   * @type {boolean}
   * @default true
   */
  this.sunBloom = true;
  this._sunBloom = undefined;

  /**
   * The {@link Moon}
   *
   * @type Moon
   * @default undefined
   */
  this.moon = undefined;

  /**
   * 背景颜色，仅在没有天空盒时可见，即 {@link Scene#skyBox} 未定义。
   *
   * @type {Color}
   * @default {@link Color.BLACK}
   *
   * @see Scene#skyBox
   */
  this.backgroundColor = Color.clone(Color.BLACK);

  this._mode = SceneMode.SCENE3D;

  this._mapProjection = defined(options.mapProjection)
    ? options.mapProjection
    : new GeographicProjection(this._ellipsoid);

  /**
   *  2D/Columbus View 和 3D 之间的当前变形过渡时间，
   * 0.0 为 2D 或哥伦布视图，1.0 为 3D。
   *
   * @type {number}
   * @default 1.0
   */
  this.morphTime = 1.0;

  /**
   * 使用正常深度缓冲区时多视锥体的远近比。
   * <p>
   * 此值用于为多视锥体的每个视锥体创建 near 和 far 值。它只被使用
   * 当 {@link Scene#logarithmicDepthBuffer} 为 <code>false</code> 时。当 <code>logarithmicDepthBuffer</code> 为
   * <code>true</code>，请使用 {@link Scene#logarithmicDepthFarToNearRatio}。
   * </p>
   *
   * @type {number}
   * @default 1000.0
   */
  this.farToNearRatio = 1000.0;

  /**
   * 使用对数深度缓冲区时多视锥体的远近比。
   * <p>
   * 此值用于为多视锥体的每个视锥体创建 near 和 far 值。它只被使用
   * 当 {@link Scene#logarithmicDepthBuffer} 为 <code>true</code> 时。当 <code>logarithmicDepthBuffer</code> 为
   * <code>false</code>，请使用 {@link Scene#farToNearRatio}。
   * </p>
   *
   * @type {number}
   * @default 1e9
   */
  this.logarithmicDepthFarToNearRatio = 1e9;

  /**
   * 确定 2D 中多重视锥体的每个视锥体的统一深度大小（以米为单位）。如果基元或模型关闭
   * 显示 Z 冲突，减少此选项将消除伪影，但会降低性能。在
   * 另一方面，增加此值将提高性能，但可能会导致靠近表面的基元之间出现 Z 冲突。
   *
   * @type {number}
   * @default 1.75e6
   */
  this.nearToFarDistance2D = 1.75e6;

  /**
   * 场景的垂直夸大。
   * 设置为 1.0 时，不应用夸大。
   *
   * @type {number}
   * @default 1.0
   */
  this.verticalExaggeration = 1.0;

  /**
   * 场景垂直夸大的参考高度。
   * 设置为 0.0 时，将相对于椭球体表面应用夸大。
   *
   * @type {number}
   * @default 0.0
   */
  this.verticalExaggerationRelativeHeight = 0.0;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 确定执行哪些命令的函数。 如以下示例所示，
   * 该函数接收命令的 <code>owner</code> 作为参数，并返回一个布尔值，指示
   * 命令。
   * </p>
   * <p>
   * 默认为 <code>undefined</code>，表示执行所有命令。
   * </p>
   *
   * @type Function
   *
   * @default undefined
   *
   * @example
   * // Do not execute any commands.
   * scene.debugCommandFilter = function(command) {
   *     return false;
   * };
   *
   * // Execute only the billboard's commands.  That is, only draw the billboard.
   * const billboards = new Cesium.BillboardCollection();
   * scene.debugCommandFilter = function(command) {
   *     return command.owner === billboards;
   * };
   */
  this.debugCommandFilter = undefined;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 如果<code>为 true</code>，则命令会随机着色。 这很有用
   * 用于性能分析，以查看场景或模型的哪些部分是
   * command-dense，并且可以从批处理中受益。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowCommands = false;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 如果<code>为 true</code>，则命令根据 frustums 进行着色
   * 重叠。 最接近的 frustum 中的命令呈红色，命令
   * 次近的命令为绿色，最远的视锥体中的命令为
   * 蓝。 如果命令与多个视锥体重叠，则颜色分量
   * 组合在一起，例如，与前两个视锥体重叠的命令会带有颜色
   * 黄色。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFrustums = false;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 显示每秒帧数和帧之间的时间。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFramesPerSecond = false;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 指示哪个视锥体将显示深度信息。
   * </p>
   *
   * @type {number}
   *
   * @default 1
   */
  this.debugShowDepthFrustum = 1;

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 如果<code>为 true</code>，则绘制轮廓以显示摄像机视锥体的边界
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFrustumPlanes = false;
  this._debugShowFrustumPlanes = false;
  this._debugFrustumPlanes = undefined;

  /**
   * 如果<code>为 true</code>，则启用使用深度缓冲区的拾取。
   *
   * @type {boolean}
   * @default true
   */
  this.useDepthPicking = true;

  /**
   * 如果<code>为 true</code>，则启用使用深度缓冲区拾取半透明几何体。请注意，{@link Scene#useDepthPicking} 也必须为 true，才能使其正常工作。
   *
   * <p>
   * 启用后性能会下降。有额外的绘制调用可以写入深度
   * 半透明几何体。
   * </p>
   *
   * @example
   * // picking the position of a translucent primitive
   * viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
   *      const pickedFeature = viewer.scene.pick(movement.position);
   *      if (!Cesium.defined(pickedFeature)) {
   *          // nothing picked
   *          return;
   *      }
   *      const worldPosition = viewer.scene.pickPosition(movement.position);
   * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
   *
   * @type {boolean}
   * @default false
   */
  this.pickTranslucentDepth = false;

  /**
   * 在检查摄像机是否未移动并触发 cameraMoveEnd 事件之前等待的时间（以毫秒为单位）。
   * @type {number}
   * @default 500.0
   * @private
   */
  this.cameraEventWaitTime = 500.0;

  /**
   * 影响 3D 瓦片和模型渲染的气氛照明效果的设置。这不要与
   * {@link Scene#skyAtmosphere} 负责渲染天空。
   *
   * @type {Atmosphere}
   */
  this.atmosphere = new Atmosphere();

  /**
   * 将大气与远离摄像机的几何体混合，以获得地平线视图。允许额外的
   * 通过渲染更少的几何体和调度更少的地形请求来提高性能。
   *
   * 如果使用 WGS84 以外的椭球体，则默认取消。
   * @type {Fog}
   */
  this.fog = new Fog();
  this.fog.enabled = Ellipsoid.WGS84.equals(this._ellipsoid);

  if (!Ellipsoid.WGS84.equals(this._ellipsoid)) {
    Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
      -45.0,
      -45.0,
      45.0,
      45.0
    );
  }

  this._shadowMapCamera = new Camera(this);

  /**
   * 场景光源的阴影贴图。启用后，模型、基元和地球可能会投射和接收阴影。
   * @type {ShadowMap}
   */
  this.shadowMap = new ShadowMap({
    context: context,
    lightCamera: this._shadowMapCamera,
    enabled: defaultValue(options.shadows, false),
  });

  /**
   * 如果<code>为 false</code>，则 3D 瓦片将正常渲染。如果<code>为 true</code>，则分类的 3D 瓦片几何体将正常渲染，并且
   * 未分类的 3D 瓦片几何体将使用颜色乘以 {@link Scene#invertClassificationColor} 进行渲染。
   * @type {boolean}
   * @default false
   */
  this.invertClassification = false;

  /**
   * 当 {@link Scene#invertClassification} 为 <code>true</code> 时，未分类的 3D 瓦片几何体的高亮颜色。
   * <p>当颜色的 Alpha 小于 1.0 时，3D 瓦片的未分类部分将无法与 3D 瓦片的分类位置正确混合。</p>
   * <p>此外，当颜色的 Alpha 小于 1.0 时，必须支持 WEBGL_depth_texture 和 EXT_frag_depth WebGL 扩展。</p>
   * @type {Color}
   * @default Color.WHITE
   */
  this.invertClassificationColor = Color.clone(Color.WHITE);

  this._actualInvertClassificationColor = Color.clone(
    this._invertClassificationColor
  );
  this._invertClassification = new InvertClassification();

  /**
   * 与 Cardboard 或 WebVR 一起使用时使用的焦距。
   * @type {number}
   */
  this.focalLength = undefined;

  /**
   * 用于 cardboard 或 WebVR 的眼距（以米为单位）。
   * @type {number}
   */
  this.eyeSeparation = undefined;

  /**
   * 应用于最终渲染的后处理效果。
   * @type {PostProcessStageCollection}
   */
  this.postProcessStages = new PostProcessStageCollection();

  this._brdfLutGenerator = new BrdfLutGenerator();

  this._performanceDisplay = undefined;
  this._debugVolume = undefined;

  this._screenSpaceCameraController = new ScreenSpaceCameraController(this);
  this._cameraUnderground = false;
  this._mapMode2D = defaultValue(options.mapMode2D, MapMode2D.INFINITE_SCROLL);

  // Keeps track of the state of a frame. FrameState is the state across
  // the primitives of the scene. This state is for internally keeping track
  // of celestial and environment effects that need to be updated/rendered in
  // a certain order as well as updating/tracking framebuffer usage.
  this._environmentState = {
    skyBoxCommand: undefined,
    skyAtmosphereCommand: undefined,
    sunDrawCommand: undefined,
    sunComputeCommand: undefined,
    moonCommand: undefined,

    isSunVisible: false,
    isMoonVisible: false,
    isReadyForAtmosphere: false,
    isSkyAtmosphereVisible: false,

    clearGlobeDepth: false,
    useDepthPlane: false,
    renderTranslucentDepthForPick: false,

    originalFramebuffer: undefined,
    useGlobeDepthFramebuffer: false,
    useOIT: false,
    useInvertClassification: false,
    usePostProcess: false,
    usePostProcessSelected: false,
    useWebVR: false,
  };

  this._useWebVR = false;
  this._cameraVR = undefined;
  this._aspectRatioVR = undefined;

  /**
   * 如果<code>为 true</code>，则仅在需要时渲染帧，具体取决于场景中的更改。
   * 启用可以提高应用程序的性能，但需要使用 {@link Scene#requestRender}
   * 在此模式下显式渲染新帧。在进行更改后，这在许多情况下是必要的
   * 添加到 API 其他部分的场景。
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#maximumRenderTimeChange
   * @see Scene#requestRender
   *
   * @type {boolean}
   * @default false
   */
  this.requestRenderMode = defaultValue(options.requestRenderMode, false);
  this._renderRequested = true;

  /**
   * 如果 {@link Scene#requestRenderMode} 为 <code>true</code>，则此值定义
   * 在请求渲染之前允许的模拟时间。较低的值会增加渲染的帧数
   * 的值越高，渲染的帧数就越少。<code>如果未定义</code>，则更改为
   * 模拟时间永远不会请求渲染。
   * 此值会影响场景中更改的渲染速率，例如光照、实体属性更新、
   * 和动画。
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#requestRenderMode
   *
   * @type {number}
   * @default 0.0
   */
  this.maximumRenderTimeChange = defaultValue(
    options.maximumRenderTimeChange,
    0.0
  );
  this._lastRenderTime = undefined;
  this._frameRateMonitor = undefined;

  this._removeRequestListenerCallback = RequestScheduler.requestCompletedEvent.addEventListener(
    requestRenderAfterFrame(this)
  );
  this._removeTaskProcessorListenerCallback = TaskProcessor.taskCompletedEvent.addEventListener(
    requestRenderAfterFrame(this)
  );
  this._removeGlobeCallbacks = [];
  this._removeTerrainProviderReadyListener = undefined;

  const viewport = new BoundingRectangle(
    0,
    0,
    context.drawingBufferWidth,
    context.drawingBufferHeight
  );
  const camera = new Camera(this);

  if (this._logDepthBuffer) {
    camera.frustum.near = 0.1;
    camera.frustum.far = 10000000000.0;
  }

  /**
   * 场景摄像机飞行目的地的摄像机视图。用于预加载航班目的地图块。
   * @type {Camera}
   * @private
   */
  this.preloadFlightCamera = new Camera(this);

  /**
   * 场景摄像机飞行目的地的剔除体积。用于预加载航班目的地图块。
   * @type {CullingVolume}
   * @private
   */
  this.preloadFlightCullingVolume = undefined;

  this._picking = new Picking(this);
  this._defaultView = new View(this, camera, viewport);
  this._view = this._defaultView;

  this._hdr = undefined;
  this._hdrDirty = undefined;
  this.highDynamicRange = false;
  this.gamma = 2.2;

  /**
   * PBR 模型基于图像的照明的球谐系数。
   * @type {Cartesian3[]}
   */
  this.sphericalHarmonicCoefficients = undefined;

  /**
   * KTX2 文件的 URL，其中包含镜面反射环境映射和用于 PBR 模型基于图像的照明的复杂 mipmap。
   * @type {string}
   */
  this.specularEnvironmentMaps = undefined;
  this._specularEnvironmentCubeMap = undefined;

  /**
   * 用于着色的光源。默认为来自太阳的平行光。
   * @type {Light}
   */
  this.light = new SunLight();

  // Give frameState, camera, and screen space camera controller initial state before rendering
  updateFrameNumber(this, 0.0, JulianDate.now());
  this.updateFrameState();
  this.initializeFrame();
}

/**
 * 使用此函数可设置新构建的场景中 {@link Scene#logarithmicDepthBuffer} 的默认值
 * 此属性依赖于受支持的 fragmentDepth。
 */
Scene.defaultLogDepthBuffer = true;

function updateGlobeListeners(scene, globe) {
  for (let i = 0; i < scene._removeGlobeCallbacks.length; ++i) {
    scene._removeGlobeCallbacks[i]();
  }
  scene._removeGlobeCallbacks.length = 0;

  const removeGlobeCallbacks = [];
  if (defined(globe)) {
    removeGlobeCallbacks.push(
      globe.imageryLayersUpdatedEvent.addEventListener(
        requestRenderAfterFrame(scene)
      )
    );
    removeGlobeCallbacks.push(
      globe.terrainProviderChanged.addEventListener(
        requestRenderAfterFrame(scene)
      )
    );
  }
  scene._removeGlobeCallbacks = removeGlobeCallbacks;
}

Object.defineProperties(Scene.prototype, {
  /**
   * 获取此场景绑定到的 canvas 元素。
   * @memberof Scene.prototype
   *
   * @type {HTMLCanvasElement}
   * @readonly
   */
  canvas: {
    get: function () {
      return this._canvas;
    },
  },

  /**
   * 基础 GL 上下文的 drawingBufferHeight。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferHeight|drawingBufferHeight}
   */
  drawingBufferHeight: {
    get: function () {
      return this._context.drawingBufferHeight;
    },
  },

  /**
   * 基础 GL 上下文的 drawingBufferWidth。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferWidth|drawingBufferWidth}
   */
  drawingBufferWidth: {
    get: function () {
      return this._context.drawingBufferWidth;
    },
  },

  /**
   * 此 WebGL 实现支持的最大锯齿线宽（以像素为单位）。 至少会是 1 个。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} with <code>ALIASED_LINE_WIDTH_RANGE</code>.
   */
  maximumAliasedLineWidth: {
    get: function () {
      return ContextLimits.maximumAliasedLineWidth;
    },
  },

  /**
   * 此 WebGL 实现支持的立方体贴图一条边的最大长度（以像素为单位）。 至少是 16 岁。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} with <code>GL_MAX_CUBE_MAP_TEXTURE_SIZE</code>.
   */
  maximumCubeMapSize: {
    get: function () {
      return ContextLimits.maximumCubeMapSize;
    },
  },

  /**
   * 如果支持 {@link Scene#pickPosition} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#pickPosition
   */
  pickPositionSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#sampleHeight} 和 {@link Scene#sampleHeightMostDetailed} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#sampleHeight
   * @see Scene#sampleHeightMostDetailed
   */
  sampleHeightSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#clampToHeight} 和 {@link Scene#clampToHeightMostDetailed} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#clampToHeight
   * @see Scene#clampToHeightMostDetailed
   */
  clampToHeightSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#invertClassification}，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#invertClassification
   */
  invertClassificationSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持镜面反射环境贴图，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#specularEnvironmentMaps
   */
  specularEnvironmentMapsSupported: {
    get: function () {
      return SpecularEnvironmentCubeMap.isSupported(this._context);
    },
  },

  /**
   * 椭球体。 如果未指定，则使用默认椭球体。
   * @memberof Scene.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取或设置深度测试椭球体。
   * @memberof Scene.prototype
   *
   * @type {Globe}
   */
  globe: {
    get: function () {
      return this._globe;
    },

    set: function (globe) {
      this._globe = this._globe && this._globe.destroy();
      this._globe = globe;

      updateGlobeListeners(this, globe);
    },
  },

  /**
   * 获取基元的集合。
   * @memberof Scene.prototype
   *
   * @type {PrimitiveCollection}
   * @readonly
   */
  primitives: {
    get: function () {
      return this._primitives;
    },
  },

  /**
   * 获取地面基元的集合。
   * @memberof Scene.prototype
   *
   * @type {PrimitiveCollection}
   * @readonly
   */
  groundPrimitives: {
    get: function () {
      return this._groundPrimitives;
    },
  },

  /**
   * 获取或设置camera.
   * @memberof Scene.prototype
   *
   * @type {Camera}
   * @readonly
   */
  camera: {
    get: function () {
      return this._view.camera;
    },
    set: function (camera) {
      // For internal use only. Documentation is still @readonly.
      this._view.camera = camera;
    },
  },

  /**
   * 获取或设置view.
   * @memberof Scene.prototype
   *
   * @type {View}
   * @readonly
   *
   * @private
   */
  view: {
    get: function () {
      return this._view;
    },
    set: function (view) {
      // For internal use only. Documentation is still @readonly.
      this._view = view;
    },
  },

  /**
   * 获取默认视图。
   * @memberof Scene.prototype
   *
   * @type {View}
   * @readonly
   *
   * @private
   */
  defaultView: {
    get: function () {
      return this._defaultView;
    },
  },

  /**
   * 获取 picking 函数和状态
   * @memberof Scene.prototype
   *
   * @type {Picking}
   * @readonly
   *
   * @private
   */
  picking: {
    get: function () {
      return this._picking;
    },
  },

  /**
   * 获取用于摄像机输入处理的控制器。
   * @memberof Scene.prototype
   *
   * @type {ScreenSpaceCameraController}
   * @readonly
   */
  screenSpaceCameraController: {
    get: function () {
      return this._screenSpaceCameraController;
    },
  },

  /**
   * 获取地图投影以在 2D 和 Columbus View 模式下使用。
   * @memberof Scene.prototype
   *
   * @type {MapProjection}
   * @readonly
   *
   * @default new GeographicProjection()
   */
  mapProjection: {
    get: function () {
      return this._mapProjection;
    },
  },

  /**
   * 获取作业计划程序
   * @memberof Scene.prototype
   * @type {JobScheduler}
   * @readonly
   *
   * @private
   */
  jobScheduler: {
    get: function () {
      return this._jobScheduler;
    },
  },

  /**
   * 获取有关当前场景的状态信息。如果在原始元<code>的更新</code>之外调用
   * 函数时，返回前一帧的状态。
   * @memberof Scene.prototype
   *
   * @type {FrameState}
   * @readonly
   *
   * @private
   */
  frameState: {
    get: function () {
      return this._frameState;
    },
  },

  /**
   * 获取环境状态。
   * @memberof Scene.prototype
   *
   * @type {EnvironmentState}
   * @readonly
   *
   * @private
   */
  environmentState: {
    get: function () {
      return this._environmentState;
    },
  },

  /**
   * 获取场景中发生的补间集合。
   * @memberof Scene.prototype
   *
   * @type {TweenCollection}
   * @readonly
   *
   * @private
   */
  tweens: {
    get: function () {
      return this._tweens;
    },
  },

  /**
   * 获取将在地球上渲染的图像图层的集合。
   * @memberof Scene.prototype
   *
   * @type {ImageryLayerCollection}
   * @readonly
   */
  imageryLayers: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.imageryLayers;
    },
  },

  /**
   * 提供地球表面几何图形的 terrain 提供程序。
   * @memberof Scene.prototype
   *
   * @type {TerrainProvider}
   */
  terrainProvider: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.terrainProvider;
    },
    set: function (terrainProvider) {
      // Cancel any in-progress terrain update
      this._removeTerrainProviderReadyListener =
        this._removeTerrainProviderReadyListener &&
        this._removeTerrainProviderReadyListener();

      if (defined(this.globe)) {
        this.globe.terrainProvider = terrainProvider;
      }
    },
  },

  /**
   * 获取在更改 terrain 提供程序时引发的事件
   * @memberof Scene.prototype
   *
   * @type {Event}
   * @readonly
   */
  terrainProviderChanged: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.terrainProviderChanged;
    },
  },

  /**
   * 获取在更新或渲染场景之前将引发的事件。 事件的订阅者
   * 接收 Scene 实例作为第一个参数，接收当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#postUpdate
   * @see Scene#preRender
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  preUpdate: {
    get: function () {
      return this._preUpdate;
    },
  },

  /**
   * 获取在更新场景后和渲染场景之前将立即引发的事件。
   * 事件的订阅者接收 Scene 实例作为第一个参数，当前时间作为第二个参数
   * 参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#preRender
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  postUpdate: {
    get: function () {
      return this._postUpdate;
    },
  },

  /**
   * 获取在 <code>render</code> 函数中引发错误时将引发的事件。
   * Scene 实例和引发的错误是传递给事件处理程序的仅有的两个参数。
   * 默认情况下，在引发此事件后不会重新引发错误，但可以通过设置
   * <code>rethrowRenderErrors</code> 属性。
   * @memberof Scene.prototype
   *
   * @type {Event}
   * @readonly
   */
  renderError: {
    get: function () {
      return this._renderError;
    },
  },

  /**
   * 获取在更新场景后和渲染场景之前将引发的事件。
   * 事件的订阅者接收 Scene 实例作为第一个参数，当前时间作为第二个参数
   *参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#postUpdate
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  preRender: {
    get: function () {
      return this._preRender;
    },
  },

  /**
   * 获取将在场景渲染后立即引发的事件。 事件的订阅者
   * 接收 Scene 实例作为第一个参数，接收当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#postUpdate
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  postRender: {
    get: function () {
      return this._postRender;
    },
  },

  /**
   * 获取上次渲染场景时的模拟时间。如果场景尚未
   *呈现。
   * @memberof Scene.prototype
   *
   * @type {JulianDate}
   * @readonly
   */
  lastRenderTime: {
    get: function () {
      return this._lastRenderTime;
    },
  },

  /**
   * @memberof Scene.prototype
   * @private
   * @readonly
   */
  context: {
    get: function () {
      return this._context;
    },
  },

  /**
   * 此属性仅用于调试;它不用于生产用途。
   * <p>
   * 当 {@link Scene.debugShowFrustums} 为 <code>true</code> 时，此包含
   * 属性，其中包含有关每个视锥体执行的命令数的统计信息。
   * <code>totalCommands</code> 是执行的命令总数，忽略
   * 重叠。<code>commandsInFrustums</code> 是一个数组，其次数
   * 命令是冗余执行的，例如，有多少命令重叠 2 或
   * 三个平截体。
   * </p>
   *
   * @memberof Scene.prototype
   *
   * @type {object}
   * @readonly
   *
   * @default undefined
   */
  debugFrustumStatistics: {
    get: function () {
      return this._view.debugFrustumStatistics;
    },
  },

  /**
   * 获取是否该场景已针对仅 3D 查看进行了优化。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  scene3DOnly: {
    get: function () {
      return this._frameState.scene3DOnly;
    },
  },

  /**
   * 获取是否场景启用了 Order Independent Translucency。
   * 请注意，这仅反映了原始构造选项，并且有
   * 可能阻止 OIT 在给定系统配置上运行的其他因素。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  orderIndependentTranslucency: {
    get: function () {
      return this._useOIT;
    },
  },

  /**
   * 获取此场景的唯一标识符。
   * @memberof Scene.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 获取或设置场景的当前模式。
   * @memberof Scene.prototype
   * @type {SceneMode}
   * @default {@link SceneMode.SCENE3D}
   */
  mode: {
    get: function () {
      return this._mode;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (this.scene3DOnly && value !== SceneMode.SCENE3D) {
        throw new DeveloperError(
          "Only SceneMode.SCENE3D is valid when scene3DOnly is true."
        );
      }
      //>>includeEnd('debug');
      if (value === SceneMode.SCENE2D) {
        this.morphTo2D(0);
      } else if (value === SceneMode.SCENE3D) {
        this.morphTo3D(0);
      } else if (value === SceneMode.COLUMBUS_VIEW) {
        this.morphToColumbusView(0);
        //>>includeStart('debug', pragmas.debug);
      } else {
        throw new DeveloperError(
          "value must be a valid SceneMode enumeration."
        );
        //>>includeEnd('debug');
      }
      this._mode = value;
    },
  },

  /**
   * 获取最后一帧中使用的视锥体数。
   * @memberof Scene.prototype
   * @type {FrustumCommands[]}
   *
   * @private
   */
  frustumCommandsList: {
    get: function () {
      return this._view.frustumCommandsList;
    },
  },

  /**
   * 获取最后一帧中使用的视锥体数。
   * @memberof Scene.prototype
   * @type {number}
   *
   * @private
   */
  numberOfFrustums: {
    get: function () {
      return this._view.frustumCommandsList.length;
    },
  },

  /**
   * 如果<code>为 true</code>，则将场景分割为两个视口，分别具有左眼和右眼的立体视图。
   * 用于 cardboard 和 WebVR。
   * @memberof Scene.prototype
   * @type {boolean}
   * @default false
   */
  useWebVR: {
    get: function () {
      return this._useWebVR;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (this.camera.frustum instanceof OrthographicFrustum) {
        throw new DeveloperError(
          "VR is unsupported with an orthographic projection."
        );
      }
      //>>includeEnd('debug');
      this._useWebVR = value;
      if (this._useWebVR) {
        this._frameState.creditDisplay.container.style.visibility = "hidden";
        this._cameraVR = new Camera(this);
        if (!defined(this._deviceOrientationCameraController)) {
          this._deviceOrientationCameraController = new DeviceOrientationCameraController(
            this
          );
        }

        this._aspectRatioVR = this.camera.frustum.aspectRatio;
      } else {
        this._frameState.creditDisplay.container.style.visibility = "visible";
        this._cameraVR = undefined;
        this._deviceOrientationCameraController =
          this._deviceOrientationCameraController &&
          !this._deviceOrientationCameraController.isDestroyed() &&
          this._deviceOrientationCameraController.destroy();

        this.camera.frustum.aspectRatio = this._aspectRatioVR;
        this.camera.frustum.xOffset = 0.0;
      }
    },
  },

  /**
   * 确定 2D 贴图是可旋转的还是可以在水平方向上无限滚动的。
   * @memberof Scene.prototype
   * @type {MapMode2D}
   * @readonly
   */
  mapMode2D: {
    get: function () {
      return this._mapMode2D;
    },
  },

  /**
   * 获取或设置Splitter 在视区中的位置。 有效值介于 0.0 和 1.0 之间。
   * @memberof Scene.prototype
   *
   * @type {number}
   */
  splitPosition: {
    get: function () {
      return this._frameState.splitPosition;
    },
    set: function (value) {
      this._frameState.splitPosition = value;
    },
  },

  /**
   * 禁用广告牌、标签和点的深度测试时与相机的距离
   * 以防止与地形进行剪裁。当设置为零时，深度测试应始终
   * 被应用。当小于零时，绝不应用深度测试。设置 disableDepthTestDistance
   * Billboard、Label 或 Point 的属性将覆盖此值。
   * @memberof Scene.prototype
   * @type {number}
   * @default 0.0
   */
  minimumDisableDepthTestDistance: {
    get: function () {
      return this._minimumDisableDepthTestDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value) || value < 0.0) {
        throw new DeveloperError(
          "minimumDisableDepthTestDistance must be greater than or equal to 0.0."
        );
      }
      //>>includeEnd('debug');
      this._minimumDisableDepthTestDistance = value;
    },
  },

  /**
   * 是否使用对数深度缓冲区。启用此选项将允许多视锥体中的视锥体减少。
   * 提高性能。此属性依赖于受支持的 fragmentDepth。
   * @memberof Scene.prototype
   * @type {boolean}
   */
  logarithmicDepthBuffer: {
    get: function () {
      return this._logDepthBuffer;
    },
    set: function (value) {
      value = this._context.fragmentDepth && value;
      if (this._logDepthBuffer !== value) {
        this._logDepthBuffer = value;
        this._logDepthBufferDirty = true;
      }
    },
  },

  /**
   * 用于 Gamma 校正的值。这仅在使用高动态范围渲染时使用。
   * @memberof Scene.prototype
   * @type {number}
   * @default 2.2
   */
  gamma: {
    get: function () {
      return this._context.uniformState.gamma;
    },
    set: function (value) {
      this._context.uniformState.gamma = value;
    },
  },

  /**
   * 是否使用高动态范围渲染。
   * @memberof Scene.prototype
   * @type {boolean}
   * @default false
   */
  highDynamicRange: {
    get: function () {
      return this._hdr;
    },
    set: function (value) {
      const context = this._context;
      const hdr =
        value &&
        context.depthTexture &&
        (context.colorBufferFloat || context.colorBufferHalfFloat);
      this._hdrDirty = hdr !== this._hdr;
      this._hdr = hdr;
    },
  },

  /**
   * 是否支持高动态范围渲染。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   * @default true
   */
  highDynamicRangeSupported: {
    get: function () {
      const context = this._context;
      return (
        context.depthTexture &&
        (context.colorBufferFloat || context.colorBufferHalfFloat)
      );
    },
  },

  /**
   * 相机是否位于地球仪下方。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   * @default false
   */
  cameraUnderground: {
    get: function () {
      return this._cameraUnderground;
    },
  },

  /**
   * 多重采样抗锯齿的采样率（大于 1 的值将启用 MSAA）。
   * @memberof Scene.prototype
   * @type {number}
   * @default 4
   */
  msaaSamples: {
    get: function () {
      return this._msaaSamples;
    },
    set: function (value) {
      value = Math.min(value, ContextLimits.maximumSamples);
      this._msaaSamples = value;
    },
  },

  /**
   * 如果场景的上下文支持 MSAA，则返回 <code>true</code>。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  msaaSupported: {
    get: function () {
      return this._context.msaa;
    },
  },

  /**
   * 像素与密度无关像素之间的比率。提供
   * 测量适合特定设备的真实像素测量值。
   *
   * @memberof Scene.prototype
   * @type {number}
   * @default 1.0
   * @private
   */
  pixelRatio: {
    get: function () {
      return this._frameState.pixelRatio;
    },
    set: function (value) {
      this._frameState.pixelRatio = value;
    },
  },

  /**
   * @private
   */
  opaqueFrustumNearOffset: {
    get: function () {
      return 0.9999;
    },
  },

  /**
   * @private
   */
  globeHeight: {
    get: function () {
      return this._globeHeight;
    },
  },
});

/**
 * 确定是否支持压缩纹理格式。
 * @param {string} format 纹理格式。可以是格式名称或 WebGL 扩展名，例如 s3tc 或 WEBGL_compressed_texture_s3tc。
 * @return {boolean} 是否支持该格式。
 */
Scene.prototype.getCompressedTextureFormatSupported = function (format) {
  const context = this.context;
  return (
    ((format === "WEBGL_compressed_texture_s3tc" || format === "s3tc") &&
      context.s3tc) ||
    ((format === "WEBGL_compressed_texture_pvrtc" || format === "pvrtc") &&
      context.pvrtc) ||
    ((format === "WEBGL_compressed_texture_etc" || format === "etc") &&
      context.etc) ||
    ((format === "WEBGL_compressed_texture_etc1" || format === "etc1") &&
      context.etc1) ||
    ((format === "WEBGL_compressed_texture_astc" || format === "astc") &&
      context.astc) ||
    ((format === "EXT_texture_compression_bptc" || format === "bc7") &&
      context.bc7)
  );
};

function updateDerivedCommands(scene, command, shadowsDirty) {
  const frameState = scene._frameState;
  const context = scene._context;
  const oit = scene._view.oit;
  const lightShadowMaps = frameState.shadowState.lightShadowMaps;
  const lightShadowsEnabled = frameState.shadowState.lightShadowsEnabled;

  let derivedCommands = command.derivedCommands;

  if (defined(command.pickId)) {
    derivedCommands.picking = DerivedCommand.createPickDerivedCommand(
      scene,
      command,
      context,
      derivedCommands.picking
    );
  }

  if (!command.pickOnly) {
    derivedCommands.depth = DerivedCommand.createDepthOnlyDerivedCommand(
      scene,
      command,
      context,
      derivedCommands.depth
    );
  }

  derivedCommands.originalCommand = command;

  if (scene._hdr) {
    derivedCommands.hdr = DerivedCommand.createHdrCommand(
      command,
      context,
      derivedCommands.hdr
    );
    command = derivedCommands.hdr.command;
    derivedCommands = command.derivedCommands;
  }

  if (lightShadowsEnabled && command.receiveShadows) {
    derivedCommands.shadows = ShadowMap.createReceiveDerivedCommand(
      lightShadowMaps,
      command,
      shadowsDirty,
      context,
      derivedCommands.shadows
    );
  }

  if (command.pass === Pass.TRANSLUCENT && defined(oit) && oit.isSupported()) {
    if (lightShadowsEnabled && command.receiveShadows) {
      derivedCommands.oit = defined(derivedCommands.oit)
        ? derivedCommands.oit
        : {};
      derivedCommands.oit.shadows = oit.createDerivedCommands(
        derivedCommands.shadows.receiveCommand,
        context,
        derivedCommands.oit.shadows
      );
    } else {
      derivedCommands.oit = oit.createDerivedCommands(
        command,
        context,
        derivedCommands.oit
      );
    }
  }
}

/**
 * @private
 */
Scene.prototype.updateDerivedCommands = function (command) {
  if (!defined(command.derivedCommands)) {
    // Is not a DrawCommand
    return;
  }

  const frameState = this._frameState;
  const context = this._context;

  // Update derived commands when any shadow maps become dirty
  let shadowsDirty = false;
  const lastDirtyTime = frameState.shadowState.lastDirtyTime;
  if (command.lastDirtyTime !== lastDirtyTime) {
    command.lastDirtyTime = lastDirtyTime;
    command.dirty = true;
    shadowsDirty = true;
  }

  const useLogDepth = frameState.useLogDepth;
  const useHdr = this._hdr;
  const derivedCommands = command.derivedCommands;
  const hasLogDepthDerivedCommands = defined(derivedCommands.logDepth);
  const hasHdrCommands = defined(derivedCommands.hdr);
  const hasDerivedCommands = defined(derivedCommands.originalCommand);
  const needsLogDepthDerivedCommands =
    useLogDepth && !hasLogDepthDerivedCommands;
  const needsHdrCommands = useHdr && !hasHdrCommands;
  const needsDerivedCommands = (!useLogDepth || !useHdr) && !hasDerivedCommands;
  command.dirty =
    command.dirty ||
    needsLogDepthDerivedCommands ||
    needsHdrCommands ||
    needsDerivedCommands;

  if (command.dirty) {
    command.dirty = false;

    const shadowMaps = frameState.shadowState.shadowMaps;
    const shadowsEnabled = frameState.shadowState.shadowsEnabled;
    if (shadowsEnabled && command.castShadows) {
      derivedCommands.shadows = ShadowMap.createCastDerivedCommand(
        shadowMaps,
        command,
        shadowsDirty,
        context,
        derivedCommands.shadows
      );
    }

    if (hasLogDepthDerivedCommands || needsLogDepthDerivedCommands) {
      derivedCommands.logDepth = DerivedCommand.createLogDepthCommand(
        command,
        context,
        derivedCommands.logDepth
      );
      updateDerivedCommands(
        this,
        derivedCommands.logDepth.command,
        shadowsDirty
      );
    }
    if (hasDerivedCommands || needsDerivedCommands) {
      updateDerivedCommands(this, command, shadowsDirty);
    }
  }
};

const renderTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.RENDER,
});

const preloadTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.PRELOAD,
});

const preloadFlightTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.PRELOAD_FLIGHT,
});

const requestRenderModeDeferCheckPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.REQUEST_RENDER_MODE_DEFER_CHECK,
});

const scratchOccluderBoundingSphere = new BoundingSphere();
let scratchOccluder;

function getOccluder(scene) {
  // TODO: The occluder is the top-level globe. When we add
  //       support for multiple central bodies, this should be the closest one.
  const globe = scene.globe;
  if (
    scene._mode === SceneMode.SCENE3D &&
    defined(globe) &&
    globe.show &&
    !scene._cameraUnderground &&
    !scene._globeTranslucencyState.translucent
  ) {
    const ellipsoid = scene.ellipsoid;
    const minimumTerrainHeight = scene.frameState.minimumTerrainHeight;
    scratchOccluderBoundingSphere.radius =
      ellipsoid.minimumRadius + minimumTerrainHeight;
    scratchOccluder = Occluder.fromBoundingSphere(
      scratchOccluderBoundingSphere,
      scene.camera.positionWC,
      scratchOccluder
    );
    return scratchOccluder;
  }

  return undefined;
}

/**
 * @private
 * @param {FrameState.Passes} passes
 */
Scene.prototype.clearPasses = function (passes) {
  passes.render = false;
  passes.pick = false;
  passes.pickVoxel = false;
  passes.depth = false;
  passes.postProcess = false;
  passes.offscreen = false;
};

function updateFrameNumber(scene, frameNumber, time) {
  const frameState = scene._frameState;
  frameState.frameNumber = frameNumber;
  frameState.time = JulianDate.clone(time, frameState.time);
}

/**
 * @private
 */
Scene.prototype.updateFrameState = function () {
  const camera = this.camera;

  const frameState = this._frameState;
  frameState.commandList.length = 0;
  frameState.shadowMaps.length = 0;
  frameState.brdfLutGenerator = this._brdfLutGenerator;
  frameState.environmentMap = this.skyBox && this.skyBox._cubeMap;
  frameState.mode = this._mode;
  frameState.morphTime = this.morphTime;
  frameState.mapProjection = this.mapProjection;
  frameState.camera = camera;
  frameState.cullingVolume = camera.frustum.computeCullingVolume(
    camera.positionWC,
    camera.directionWC,
    camera.upWC
  );
  frameState.occluder = getOccluder(this);
  frameState.minimumTerrainHeight = 0.0;
  frameState.minimumDisableDepthTestDistance = this._minimumDisableDepthTestDistance;
  frameState.invertClassification = this.invertClassification;
  frameState.useLogDepth =
    this._logDepthBuffer &&
    !(
      this.camera.frustum instanceof OrthographicFrustum ||
      this.camera.frustum instanceof OrthographicOffCenterFrustum
    );
  frameState.light = this.light;
  frameState.cameraUnderground = this._cameraUnderground;
  frameState.globeTranslucencyState = this._globeTranslucencyState;

  const { globe } = this;
  if (defined(globe) && globe._terrainExaggerationChanged) {
    // Honor a user-set value for the old deprecated globe.terrainExaggeration.
    // This can be removed when Globe.terrainExaggeration is removed.
    this.verticalExaggeration = globe._terrainExaggeration;
    this.verticalExaggerationRelativeHeight =
      globe._terrainExaggerationRelativeHeight;
    globe._terrainExaggerationChanged = false;
  }
  frameState.verticalExaggeration = this.verticalExaggeration;
  frameState.verticalExaggerationRelativeHeight = this.verticalExaggerationRelativeHeight;

  if (
    defined(this._specularEnvironmentCubeMap) &&
    this._specularEnvironmentCubeMap.ready
  ) {
    frameState.specularEnvironmentMaps = this._specularEnvironmentCubeMap.texture;
    frameState.specularEnvironmentMapsMaximumLOD = this._specularEnvironmentCubeMap.maximumMipmapLevel;
  } else {
    frameState.specularEnvironmentMaps = undefined;
    frameState.specularEnvironmentMapsMaximumLOD = undefined;
  }

  frameState.sphericalHarmonicCoefficients = this.sphericalHarmonicCoefficients;

  this._actualInvertClassificationColor = Color.clone(
    this.invertClassificationColor,
    this._actualInvertClassificationColor
  );
  if (!InvertClassification.isTranslucencySupported(this._context)) {
    this._actualInvertClassificationColor.alpha = 1.0;
  }

  frameState.invertClassificationColor = this._actualInvertClassificationColor;

  if (defined(this.globe)) {
    frameState.maximumScreenSpaceError = this.globe.maximumScreenSpaceError;
  } else {
    frameState.maximumScreenSpaceError = 2;
  }

  this.clearPasses(frameState.passes);

  frameState.tilesetPassState = undefined;
};

/**
 * @private
 */
Scene.prototype.isVisible = function (command, cullingVolume, occluder) {
  return (
    defined(command) &&
    (!defined(command.boundingVolume) ||
      !command.cull ||
      (cullingVolume.computeVisibility(command.boundingVolume) !==
        Intersect.OUTSIDE &&
        (!defined(occluder) ||
          !command.occlude ||
          !command.boundingVolume.isOccluded(occluder))))
  );
};

let transformFrom2D = new Matrix4(
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0
);
transformFrom2D = Matrix4.inverseTransformation(
  transformFrom2D,
  transformFrom2D
);

function debugShowBoundingVolume(command, scene, passState, debugFramebuffer) {
  // Debug code to draw bounding volume for command.  Not optimized!
  // Assumes bounding volume is a bounding sphere or box
  const frameState = scene._frameState;
  const context = frameState.context;
  const boundingVolume = command.boundingVolume;

  if (defined(scene._debugVolume)) {
    scene._debugVolume.destroy();
  }

  let geometry;

  let center = Cartesian3.clone(boundingVolume.center);
  if (frameState.mode !== SceneMode.SCENE3D) {
    center = Matrix4.multiplyByPoint(transformFrom2D, center, center);
    const projection = frameState.mapProjection;
    const centerCartographic = projection.unproject(center);
    center = projection.ellipsoid.cartographicToCartesian(centerCartographic);
  }

  if (defined(boundingVolume.radius)) {
    const radius = boundingVolume.radius;

    geometry = GeometryPipeline.toWireframe(
      EllipsoidGeometry.createGeometry(
        new EllipsoidGeometry({
          radii: new Cartesian3(radius, radius, radius),
          vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
        })
      )
    );

    scene._debugVolume = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: geometry,
        modelMatrix: Matrix4.fromTranslation(center),
        attributes: {
          color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0),
        },
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
      }),
      asynchronous: false,
    });
  } else {
    const halfAxes = boundingVolume.halfAxes;

    geometry = GeometryPipeline.toWireframe(
      BoxGeometry.createGeometry(
        BoxGeometry.fromDimensions({
          dimensions: new Cartesian3(2.0, 2.0, 2.0),
          vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
        })
      )
    );

    scene._debugVolume = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: geometry,
        modelMatrix: Matrix4.fromRotationTranslation(
          halfAxes,
          center,
          new Matrix4()
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0),
        },
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
      }),
      asynchronous: false,
    });
  }

  const savedCommandList = frameState.commandList;
  const commandList = (frameState.commandList = []);
  scene._debugVolume.update(frameState);

  command = commandList[0];

  if (frameState.useLogDepth) {
    const logDepth = DerivedCommand.createLogDepthCommand(command, context);
    command = logDepth.command;
  }

  let framebuffer;
  if (defined(debugFramebuffer)) {
    framebuffer = passState.framebuffer;
    passState.framebuffer = debugFramebuffer;
  }

  command.execute(context, passState);

  if (defined(framebuffer)) {
    passState.framebuffer = framebuffer;
  }

  frameState.commandList = savedCommandList;
}

function executeCommand(command, scene, context, passState, debugFramebuffer) {
  const frameState = scene._frameState;

  if (defined(scene.debugCommandFilter) && !scene.debugCommandFilter(command)) {
    return;
  }

  if (command instanceof ClearCommand) {
    command.execute(context, passState);
    return;
  }

  if (command.debugShowBoundingVolume && defined(command.boundingVolume)) {
    debugShowBoundingVolume(command, scene, passState, debugFramebuffer);
  }

  if (frameState.useLogDepth && defined(command.derivedCommands.logDepth)) {
    command = command.derivedCommands.logDepth.command;
  }

  const passes = frameState.passes;
  if (
    !passes.pick &&
    !passes.pickVoxel &&
    !passes.depth &&
    scene._hdr &&
    defined(command.derivedCommands) &&
    defined(command.derivedCommands.hdr)
  ) {
    command = command.derivedCommands.hdr.command;
  }

  if (passes.pick || passes.depth) {
    if (
      passes.pick &&
      !passes.depth &&
      defined(command.derivedCommands.picking)
    ) {
      command = command.derivedCommands.picking.pickCommand;
      command.execute(context, passState);
      return;
    } else if (defined(command.derivedCommands.depth)) {
      command = command.derivedCommands.depth.depthOnlyCommand;
      command.execute(context, passState);
      return;
    }
  }

  if (scene.debugShowCommands || scene.debugShowFrustums) {
    scene._debugInspector.executeDebugShowFrustumsCommand(
      scene,
      command,
      passState
    );
    return;
  }

  if (
    frameState.shadowState.lightShadowsEnabled &&
    command.receiveShadows &&
    defined(command.derivedCommands.shadows)
  ) {
    // If the command receives shadows, execute the derived shadows command.
    // Some commands, such as OIT derived commands, do not have derived shadow commands themselves
    // and instead shadowing is built-in. In this case execute the command regularly below.
    command.derivedCommands.shadows.receiveCommand.execute(context, passState);
  } else {
    command.execute(context, passState);
  }
}

function executeIdCommand(command, scene, context, passState) {
  const frameState = scene._frameState;
  let derivedCommands = command.derivedCommands;
  if (!defined(derivedCommands)) {
    return;
  }

  if (frameState.useLogDepth && defined(derivedCommands.logDepth)) {
    command = derivedCommands.logDepth.command;
  }

  derivedCommands = command.derivedCommands;
  if (defined(derivedCommands.picking)) {
    command = derivedCommands.picking.pickCommand;
    command.execute(context, passState);
  } else if (defined(derivedCommands.depth)) {
    command = derivedCommands.depth.depthOnlyCommand;
    command.execute(context, passState);
  }
}

function backToFront(a, b, position) {
  return (
    b.boundingVolume.distanceSquaredTo(position) -
    a.boundingVolume.distanceSquaredTo(position)
  );
}

function frontToBack(a, b, position) {
  // When distances are equal equal favor sorting b before a. This gives render priority to commands later in the list.
  return (
    a.boundingVolume.distanceSquaredTo(position) -
    b.boundingVolume.distanceSquaredTo(position) +
    CesiumMath.EPSILON12
  );
}

function executeTranslucentCommandsBackToFront(
  scene,
  executeFunction,
  passState,
  commands,
  invertClassification
) {
  const context = scene.context;

  mergeSort(commands, backToFront, scene.camera.positionWC);

  if (defined(invertClassification)) {
    executeFunction(
      invertClassification.unclassifiedCommand,
      scene,
      context,
      passState
    );
  }

  const length = commands.length;
  for (let i = 0; i < length; ++i) {
    executeFunction(commands[i], scene, context, passState);
  }
}

function executeTranslucentCommandsFrontToBack(
  scene,
  executeFunction,
  passState,
  commands,
  invertClassification
) {
  const context = scene.context;

  mergeSort(commands, frontToBack, scene.camera.positionWC);

  if (defined(invertClassification)) {
    executeFunction(
      invertClassification.unclassifiedCommand,
      scene,
      context,
      passState
    );
  }

  const length = commands.length;
  for (let i = 0; i < length; ++i) {
    executeFunction(commands[i], scene, context, passState);
  }
}

function executeVoxelCommands(scene, executeFunction, passState, commands) {
  const context = scene.context;

  mergeSort(commands, backToFront, scene.camera.positionWC);

  const length = commands.length;
  for (let i = 0; i < length; ++i) {
    executeFunction(commands[i], scene, context, passState);
  }
}

const scratchPerspectiveFrustum = new PerspectiveFrustum();
const scratchPerspectiveOffCenterFrustum = new PerspectiveOffCenterFrustum();
const scratchOrthographicFrustum = new OrthographicFrustum();
const scratchOrthographicOffCenterFrustum = new OrthographicOffCenterFrustum();

function executeCommands(scene, passState) {
  const { camera, context, frameState } = scene;
  const { uniformState } = context;

  uniformState.updateCamera(camera);

  // Create a working frustum from the original camera frustum.
  let frustum;
  if (defined(camera.frustum.fov)) {
    frustum = camera.frustum.clone(scratchPerspectiveFrustum);
  } else if (defined(camera.frustum.infiniteProjectionMatrix)) {
    frustum = camera.frustum.clone(scratchPerspectiveOffCenterFrustum);
  } else if (defined(camera.frustum.width)) {
    frustum = camera.frustum.clone(scratchOrthographicFrustum);
  } else {
    frustum = camera.frustum.clone(scratchOrthographicOffCenterFrustum);
  }

  // Ideally, we would render the sky box and atmosphere last for
  // early-z, but we would have to draw it in each frustum
  frustum.near = camera.frustum.near;
  frustum.far = camera.frustum.far;
  uniformState.updateFrustum(frustum);
  uniformState.updatePass(Pass.ENVIRONMENT);

  const passes = frameState.passes;
  const picking = passes.pick || passes.pickVoxel;
  const environmentState = scene._environmentState;
  const view = scene._view;
  const renderTranslucentDepthForPick =
    environmentState.renderTranslucentDepthForPick;
  const useWebVR = environmentState.useWebVR;

  // Do not render environment primitives during a pick pass since they do not generate picking commands.
  if (!picking) {
    const skyBoxCommand = environmentState.skyBoxCommand;
    if (defined(skyBoxCommand)) {
      executeCommand(skyBoxCommand, scene, context, passState);
    }

    if (environmentState.isSkyAtmosphereVisible) {
      executeCommand(
        environmentState.skyAtmosphereCommand,
        scene,
        context,
        passState
      );
    }

    if (environmentState.isSunVisible) {
      environmentState.sunDrawCommand.execute(context, passState);
      if (scene.sunBloom && !useWebVR) {
        let framebuffer;
        if (environmentState.useGlobeDepthFramebuffer) {
          framebuffer = view.globeDepth.framebuffer;
        } else if (environmentState.usePostProcess) {
          framebuffer = view.sceneFramebuffer.framebuffer;
        } else {
          framebuffer = environmentState.originalFramebuffer;
        }
        scene._sunPostProcess.execute(context);
        scene._sunPostProcess.copy(context, framebuffer);
        passState.framebuffer = framebuffer;
      }
    }

    // Moon can be seen through the atmosphere, since the sun is rendered after the atmosphere.
    if (environmentState.isMoonVisible) {
      environmentState.moonCommand.execute(context, passState);
    }
  }

  // Determine how translucent surfaces will be handled.
  let executeTranslucentCommands;
  if (environmentState.useOIT) {
    if (!defined(scene._executeOITFunction)) {
      scene._executeOITFunction = function (
        scene,
        executeFunction,
        passState,
        commands,
        invertClassification
      ) {
        view.globeDepth.prepareColorTextures(context);
        view.oit.executeCommands(
          scene,
          executeFunction,
          passState,
          commands,
          invertClassification
        );
      };
    }
    executeTranslucentCommands = scene._executeOITFunction;
  } else if (passes.render) {
    executeTranslucentCommands = executeTranslucentCommandsBackToFront;
  } else {
    executeTranslucentCommands = executeTranslucentCommandsFrontToBack;
  }

  const frustumCommandsList = view.frustumCommandsList;
  const numFrustums = frustumCommandsList.length;

  const clearGlobeDepth = environmentState.clearGlobeDepth;
  const useDepthPlane = environmentState.useDepthPlane;
  const globeTranslucencyState = scene._globeTranslucencyState;
  const globeTranslucent = globeTranslucencyState.translucent;
  const globeTranslucencyFramebuffer = scene._view.globeTranslucencyFramebuffer;
  const clearDepth = scene._depthClearCommand;
  const clearStencil = scene._stencilClearCommand;
  const clearClassificationStencil = scene._classificationStencilClearCommand;
  const depthPlane = scene._depthPlane;
  const usePostProcessSelected = environmentState.usePostProcessSelected;

  const height2D = camera.position.z;

  // Execute commands in each frustum in back to front order
  let j;
  for (let i = 0; i < numFrustums; ++i) {
    const index = numFrustums - i - 1;
    const frustumCommands = frustumCommandsList[index];

    if (scene.mode === SceneMode.SCENE2D) {
      // To avoid z-fighting in 2D, move the camera to just before the frustum
      // and scale the frustum depth to be in [1.0, nearToFarDistance2D].
      camera.position.z = height2D - frustumCommands.near + 1.0;
      frustum.far = Math.max(1.0, frustumCommands.far - frustumCommands.near);
      frustum.near = 1.0;
      uniformState.update(frameState);
      uniformState.updateFrustum(frustum);
    } else {
      // Avoid tearing artifacts between adjacent frustums in the opaque passes
      frustum.near =
        index !== 0
          ? frustumCommands.near * scene.opaqueFrustumNearOffset
          : frustumCommands.near;
      frustum.far = frustumCommands.far;
      uniformState.updateFrustum(frustum);
    }

    clearDepth.execute(context, passState);

    if (context.stencilBuffer) {
      clearStencil.execute(context, passState);
    }

    uniformState.updatePass(Pass.GLOBE);
    let commands = frustumCommands.commands[Pass.GLOBE];
    let length = frustumCommands.indices[Pass.GLOBE];

    if (globeTranslucent) {
      globeTranslucencyState.executeGlobeCommands(
        frustumCommands,
        executeCommand,
        globeTranslucencyFramebuffer,
        scene,
        passState
      );
    } else {
      for (j = 0; j < length; ++j) {
        executeCommand(commands[j], scene, context, passState);
      }
    }

    const globeDepth = view.globeDepth;
    if (defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
      globeDepth.executeCopyDepth(context, passState);
    }

    // Draw terrain classification
    if (!environmentState.renderTranslucentDepthForPick) {
      uniformState.updatePass(Pass.TERRAIN_CLASSIFICATION);
      commands = frustumCommands.commands[Pass.TERRAIN_CLASSIFICATION];
      length = frustumCommands.indices[Pass.TERRAIN_CLASSIFICATION];

      if (globeTranslucent) {
        globeTranslucencyState.executeGlobeClassificationCommands(
          frustumCommands,
          executeCommand,
          globeTranslucencyFramebuffer,
          scene,
          passState
        );
      } else {
        for (j = 0; j < length; ++j) {
          executeCommand(commands[j], scene, context, passState);
        }
      }
    }

    if (clearGlobeDepth) {
      clearDepth.execute(context, passState);
      if (useDepthPlane) {
        depthPlane.execute(context, passState);
      }
    }

    if (
      !environmentState.useInvertClassification ||
      picking ||
      environmentState.renderTranslucentDepthForPick
    ) {
      // Common/fastest path. Draw 3D Tiles and classification normally.

      // Draw 3D Tiles
      uniformState.updatePass(Pass.CESIUM_3D_TILE);
      commands = frustumCommands.commands[Pass.CESIUM_3D_TILE];
      length = frustumCommands.indices[Pass.CESIUM_3D_TILE];
      for (j = 0; j < length; ++j) {
        executeCommand(commands[j], scene, context, passState);
      }

      if (length > 0) {
        if (defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
          // When clearGlobeDepth is true, executeUpdateDepth needs
          // a globe depth texture with resolved stencil bits.
          globeDepth.prepareColorTextures(context, clearGlobeDepth);
          globeDepth.executeUpdateDepth(
            context,
            passState,
            clearGlobeDepth,
            globeDepth.depthStencilTexture
          );
        }

        // Draw classifications. Modifies 3D Tiles color.
        if (!environmentState.renderTranslucentDepthForPick) {
          uniformState.updatePass(Pass.CESIUM_3D_TILE_CLASSIFICATION);
          commands =
            frustumCommands.commands[Pass.CESIUM_3D_TILE_CLASSIFICATION];
          length = frustumCommands.indices[Pass.CESIUM_3D_TILE_CLASSIFICATION];
          for (j = 0; j < length; ++j) {
            executeCommand(commands[j], scene, context, passState);
          }
        }
      }
    } else {
      // When the invert classification color is opaque:
      //    Main FBO (FBO1):                   Main_Color   + Main_DepthStencil
      //    Invert classification FBO (FBO2) : Invert_Color + Main_DepthStencil
      //
      //    1. Clear FBO2 color to vec4(0.0) for each frustum
      //    2. Draw 3D Tiles to FBO2
      //    3. Draw classification to FBO2
      //    4. Fullscreen pass to FBO1, draw Invert_Color when:
      //           * Main_DepthStencil has the stencil bit set > 0 (classified)
      //    5. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
      //           * Main_DepthStencil has stencil bit set to 0 (unclassified) and
      //           * Invert_Color !== vec4(0.0)
      //
      // When the invert classification color is translucent:
      //    Main FBO (FBO1):                  Main_Color         + Main_DepthStencil
      //    Invert classification FBO (FBO2): Invert_Color       + Invert_DepthStencil
      //    IsClassified FBO (FBO3):          IsClassified_Color + Invert_DepthStencil
      //
      //    1. Clear FBO2 and FBO3 color to vec4(0.0), stencil to 0, and depth to 1.0
      //    2. Draw 3D Tiles to FBO2
      //    3. Draw classification to FBO2
      //    4. Fullscreen pass to FBO3, draw any color when
      //           * Invert_DepthStencil has the stencil bit set > 0 (classified)
      //    5. Fullscreen pass to FBO1, draw Invert_Color when:
      //           * Invert_Color !== vec4(0.0) and
      //           * IsClassified_Color !== vec4(0.0)
      //    6. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
      //           * Invert_Color !== vec4(0.0) and
      //           * IsClassified_Color === vec4(0.0)
      //
      // NOTE: Step six when translucent invert color occurs after the TRANSLUCENT pass
      //
      scene._invertClassification.clear(context, passState);

      const opaqueClassificationFramebuffer = passState.framebuffer;
      passState.framebuffer = scene._invertClassification._fbo.framebuffer;

      // Draw normally
      uniformState.updatePass(Pass.CESIUM_3D_TILE);
      commands = frustumCommands.commands[Pass.CESIUM_3D_TILE];
      length = frustumCommands.indices[Pass.CESIUM_3D_TILE];
      for (j = 0; j < length; ++j) {
        executeCommand(commands[j], scene, context, passState);
      }

      if (defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
        scene._invertClassification.prepareTextures(context);
        globeDepth.executeUpdateDepth(
          context,
          passState,
          clearGlobeDepth,
          scene._invertClassification._fbo.getDepthStencilTexture()
        );
      }

      // Set stencil
      uniformState.updatePass(Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW);
      commands =
        frustumCommands.commands[
          Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW
        ];
      length =
        frustumCommands.indices[Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW];
      for (j = 0; j < length; ++j) {
        executeCommand(commands[j], scene, context, passState);
      }

      passState.framebuffer = opaqueClassificationFramebuffer;

      // Fullscreen pass to copy classified fragments
      scene._invertClassification.executeClassified(context, passState);
      if (frameState.invertClassificationColor.alpha === 1.0) {
        // Fullscreen pass to copy unclassified fragments when alpha == 1.0
        scene._invertClassification.executeUnclassified(context, passState);
      }

      // Clear stencil set by the classification for the next classification pass
      if (length > 0 && context.stencilBuffer) {
        clearClassificationStencil.execute(context, passState);
      }

      // Draw style over classification.
      uniformState.updatePass(Pass.CESIUM_3D_TILE_CLASSIFICATION);
      commands = frustumCommands.commands[Pass.CESIUM_3D_TILE_CLASSIFICATION];
      length = frustumCommands.indices[Pass.CESIUM_3D_TILE_CLASSIFICATION];
      for (j = 0; j < length; ++j) {
        executeCommand(commands[j], scene, context, passState);
      }
    }

    if (length > 0 && context.stencilBuffer) {
      clearStencil.execute(context, passState);
    }

    uniformState.updatePass(Pass.VOXELS);
    commands = frustumCommands.commands[Pass.VOXELS];
    length = frustumCommands.indices[Pass.VOXELS];
    commands.length = length;
    executeVoxelCommands(scene, executeCommand, passState, commands);

    uniformState.updatePass(Pass.OPAQUE);
    commands = frustumCommands.commands[Pass.OPAQUE];
    length = frustumCommands.indices[Pass.OPAQUE];
    for (j = 0; j < length; ++j) {
      executeCommand(commands[j], scene, context, passState);
    }

    if (index !== 0 && scene.mode !== SceneMode.SCENE2D) {
      // Do not overlap frustums in the translucent pass to avoid blending artifacts
      frustum.near = frustumCommands.near;
      uniformState.updateFrustum(frustum);
    }

    let invertClassification;
    if (
      !picking &&
      environmentState.useInvertClassification &&
      frameState.invertClassificationColor.alpha < 1.0
    ) {
      // Fullscreen pass to copy unclassified fragments when alpha < 1.0.
      // Not executed when undefined.
      invertClassification = scene._invertClassification;
    }

    uniformState.updatePass(Pass.TRANSLUCENT);
    commands = frustumCommands.commands[Pass.TRANSLUCENT];
    commands.length = frustumCommands.indices[Pass.TRANSLUCENT];
    executeTranslucentCommands(
      scene,
      executeCommand,
      passState,
      commands,
      invertClassification
    );

    // Classification for translucent 3D Tiles
    const has3DTilesClassificationCommands =
      frustumCommands.indices[Pass.CESIUM_3D_TILE_CLASSIFICATION] > 0;
    if (
      has3DTilesClassificationCommands &&
      view.translucentTileClassification.isSupported()
    ) {
      view.translucentTileClassification.executeTranslucentCommands(
        scene,
        executeCommand,
        passState,
        commands,
        globeDepth.depthStencilTexture
      );
      view.translucentTileClassification.executeClassificationCommands(
        scene,
        executeCommand,
        passState,
        frustumCommands
      );
    }

    if (
      context.depthTexture &&
      scene.useDepthPicking &&
      (environmentState.useGlobeDepthFramebuffer ||
        renderTranslucentDepthForPick)
    ) {
      // PERFORMANCE_IDEA: Use MRT to avoid the extra copy.
      const depthStencilTexture = globeDepth.depthStencilTexture;
      const pickDepth = scene._picking.getPickDepth(scene, index);
      pickDepth.update(context, depthStencilTexture);
      pickDepth.executeCopyDepth(context, passState);
    }

    if (picking || !usePostProcessSelected) {
      continue;
    }

    const originalFramebuffer = passState.framebuffer;
    passState.framebuffer = view.sceneFramebuffer.getIdFramebuffer();

    // reset frustum
    frustum.near =
      index !== 0
        ? frustumCommands.near * scene.opaqueFrustumNearOffset
        : frustumCommands.near;
    frustum.far = frustumCommands.far;
    uniformState.updateFrustum(frustum);

    uniformState.updatePass(Pass.GLOBE);
    commands = frustumCommands.commands[Pass.GLOBE];
    length = frustumCommands.indices[Pass.GLOBE];

    if (globeTranslucent) {
      globeTranslucencyState.executeGlobeCommands(
        frustumCommands,
        executeIdCommand,
        globeTranslucencyFramebuffer,
        scene,
        passState
      );
    } else {
      for (j = 0; j < length; ++j) {
        executeIdCommand(commands[j], scene, context, passState);
      }
    }

    if (clearGlobeDepth) {
      clearDepth.framebuffer = passState.framebuffer;
      clearDepth.execute(context, passState);
      clearDepth.framebuffer = undefined;
    }

    if (clearGlobeDepth && useDepthPlane) {
      depthPlane.execute(context, passState);
    }

    uniformState.updatePass(Pass.CESIUM_3D_TILE);
    commands = frustumCommands.commands[Pass.CESIUM_3D_TILE];
    length = frustumCommands.indices[Pass.CESIUM_3D_TILE];
    for (j = 0; j < length; ++j) {
      executeIdCommand(commands[j], scene, context, passState);
    }

    uniformState.updatePass(Pass.OPAQUE);
    commands = frustumCommands.commands[Pass.OPAQUE];
    length = frustumCommands.indices[Pass.OPAQUE];
    for (j = 0; j < length; ++j) {
      executeIdCommand(commands[j], scene, context, passState);
    }

    uniformState.updatePass(Pass.TRANSLUCENT);
    commands = frustumCommands.commands[Pass.TRANSLUCENT];
    length = frustumCommands.indices[Pass.TRANSLUCENT];
    for (j = 0; j < length; ++j) {
      executeIdCommand(commands[j], scene, context, passState);
    }

    passState.framebuffer = originalFramebuffer;
  }
}

function executeComputeCommands(scene) {
  const us = scene.context.uniformState;
  us.updatePass(Pass.COMPUTE);

  const sunComputeCommand = scene._environmentState.sunComputeCommand;
  if (defined(sunComputeCommand)) {
    sunComputeCommand.execute(scene._computeEngine);
  }

  const commandList = scene._computeCommandList;
  const length = commandList.length;
  for (let i = 0; i < length; ++i) {
    commandList[i].execute(scene._computeEngine);
  }
}

function executeOverlayCommands(scene, passState) {
  const us = scene.context.uniformState;
  us.updatePass(Pass.OVERLAY);

  const context = scene.context;
  const commandList = scene._overlayCommandList;
  const length = commandList.length;
  for (let i = 0; i < length; ++i) {
    commandList[i].execute(context, passState);
  }
}

function insertShadowCastCommands(scene, commandList, shadowMap) {
  const shadowVolume = shadowMap.shadowMapCullingVolume;
  const isPointLight = shadowMap.isPointLight;
  const passes = shadowMap.passes;
  const numberOfPasses = passes.length;

  const length = commandList.length;
  for (let i = 0; i < length; ++i) {
    const command = commandList[i];
    scene.updateDerivedCommands(command);

    if (
      command.castShadows &&
      (command.pass === Pass.GLOBE ||
        command.pass === Pass.CESIUM_3D_TILE ||
        command.pass === Pass.OPAQUE ||
        command.pass === Pass.TRANSLUCENT)
    ) {
      if (scene.isVisible(command, shadowVolume)) {
        if (isPointLight) {
          for (let k = 0; k < numberOfPasses; ++k) {
            passes[k].commandList.push(command);
          }
        } else if (numberOfPasses === 1) {
          passes[0].commandList.push(command);
        } else {
          let wasVisible = false;
          // Loop over cascades from largest to smallest
          for (let j = numberOfPasses - 1; j >= 0; --j) {
            const cascadeVolume = passes[j].cullingVolume;
            if (scene.isVisible(command, cascadeVolume)) {
              passes[j].commandList.push(command);
              wasVisible = true;
            } else if (wasVisible) {
              // If it was visible in the previous cascade but now isn't
              // then there is no need to check any more cascades
              break;
            }
          }
        }
      }
    }
  }
}

function executeShadowMapCastCommands(scene) {
  const frameState = scene.frameState;
  const shadowMaps = frameState.shadowState.shadowMaps;
  const shadowMapLength = shadowMaps.length;

  if (!frameState.shadowState.shadowsEnabled) {
    return;
  }

  const context = scene.context;
  const uniformState = context.uniformState;

  for (let i = 0; i < shadowMapLength; ++i) {
    const shadowMap = shadowMaps[i];
    if (shadowMap.outOfView) {
      continue;
    }

    // Reset the command lists
    const passes = shadowMap.passes;
    const numberOfPasses = passes.length;
    for (let j = 0; j < numberOfPasses; ++j) {
      passes[j].commandList.length = 0;
    }

    // Insert the primitive/model commands into the command lists
    const sceneCommands = scene.frameState.commandList;
    insertShadowCastCommands(scene, sceneCommands, shadowMap);

    for (let j = 0; j < numberOfPasses; ++j) {
      const pass = shadowMap.passes[j];
      uniformState.updateCamera(pass.camera);
      shadowMap.updatePass(context, j);
      const numberOfCommands = pass.commandList.length;
      for (let k = 0; k < numberOfCommands; ++k) {
        const command = pass.commandList[k];
        // Set the correct pass before rendering into the shadow map because some shaders
        // conditionally render based on whether the pass is translucent or opaque.
        uniformState.updatePass(command.pass);
        executeCommand(
          command.derivedCommands.shadows.castCommands[i],
          scene,
          context,
          pass.passState
        );
      }
    }
  }
}

const scratchEyeTranslation = new Cartesian3();

/**
 * @private
 */
Scene.prototype.updateAndExecuteCommands = function (
  passState,
  backgroundColor
) {
  const frameState = this._frameState;
  const mode = frameState.mode;
  const useWebVR = this._environmentState.useWebVR;

  if (useWebVR) {
    executeWebVRCommands(this, passState, backgroundColor);
  } else if (
    mode !== SceneMode.SCENE2D ||
    this._mapMode2D === MapMode2D.ROTATE
  ) {
    executeCommandsInViewport(true, this, passState, backgroundColor);
  } else {
    updateAndClearFramebuffers(this, passState, backgroundColor);
    execute2DViewportCommands(this, passState);
  }
};

function executeWebVRCommands(scene, passState, backgroundColor) {
  const view = scene._view;
  const camera = view.camera;
  const environmentState = scene._environmentState;
  const renderTranslucentDepthForPick =
    environmentState.renderTranslucentDepthForPick;

  updateAndClearFramebuffers(scene, passState, backgroundColor);

  updateAndRenderPrimitives(scene);

  view.createPotentiallyVisibleSet(scene);

  executeComputeCommands(scene);

  if (!renderTranslucentDepthForPick) {
    executeShadowMapCastCommands(scene);
  }

  // Based on Calculating Stereo pairs by Paul Bourke
  // http://paulbourke.net/stereographics/stereorender/
  const viewport = passState.viewport;
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = viewport.width * 0.5;

  const savedCamera = Camera.clone(camera, scene._cameraVR);
  savedCamera.frustum = camera.frustum;

  const near = camera.frustum.near;
  const fo = near * defaultValue(scene.focalLength, 5.0);
  const eyeSeparation = defaultValue(scene.eyeSeparation, fo / 30.0);
  const eyeTranslation = Cartesian3.multiplyByScalar(
    savedCamera.right,
    eyeSeparation * 0.5,
    scratchEyeTranslation
  );

  camera.frustum.aspectRatio = viewport.width / viewport.height;

  const offset = (0.5 * eyeSeparation * near) / fo;

  Cartesian3.add(savedCamera.position, eyeTranslation, camera.position);
  camera.frustum.xOffset = offset;

  executeCommands(scene, passState);

  viewport.x = viewport.width;

  Cartesian3.subtract(savedCamera.position, eyeTranslation, camera.position);
  camera.frustum.xOffset = -offset;

  executeCommands(scene, passState);

  Camera.clone(savedCamera, camera);
}

const scratch2DViewportCartographic = new Cartographic(
  Math.PI,
  CesiumMath.PI_OVER_TWO
);
const scratch2DViewportMaxCoord = new Cartesian3();
const scratch2DViewportSavedPosition = new Cartesian3();
const scratch2DViewportTransform = new Matrix4();
const scratch2DViewportCameraTransform = new Matrix4();
const scratch2DViewportEyePoint = new Cartesian3();
const scratch2DViewportWindowCoords = new Cartesian3();
const scratch2DViewport = new BoundingRectangle();

function execute2DViewportCommands(scene, passState) {
  const context = scene.context;
  const frameState = scene.frameState;
  const camera = scene.camera;

  const originalViewport = passState.viewport;
  const viewport = BoundingRectangle.clone(originalViewport, scratch2DViewport);
  passState.viewport = viewport;

  const maxCartographic = scratch2DViewportCartographic;
  const maxCoord = scratch2DViewportMaxCoord;

  const projection = scene.mapProjection;
  projection.project(maxCartographic, maxCoord);

  const position = Cartesian3.clone(
    camera.position,
    scratch2DViewportSavedPosition
  );
  const transform = Matrix4.clone(
    camera.transform,
    scratch2DViewportCameraTransform
  );
  const frustum = camera.frustum.clone();

  camera._setTransform(Matrix4.IDENTITY);

  const viewportTransformation = Matrix4.computeViewportTransformation(
    viewport,
    0.0,
    1.0,
    scratch2DViewportTransform
  );
  const projectionMatrix = camera.frustum.projectionMatrix;

  const x = camera.positionWC.y;
  const eyePoint = Cartesian3.fromElements(
    CesiumMath.sign(x) * maxCoord.x - x,
    0.0,
    -camera.positionWC.x,
    scratch2DViewportEyePoint
  );
  const windowCoordinates = Transforms.pointToGLWindowCoordinates(
    projectionMatrix,
    viewportTransformation,
    eyePoint,
    scratch2DViewportWindowCoords
  );

  windowCoordinates.x = Math.floor(windowCoordinates.x);

  const viewportX = viewport.x;
  const viewportWidth = viewport.width;

  if (
    x === 0.0 ||
    windowCoordinates.x <= viewportX ||
    windowCoordinates.x >= viewportX + viewportWidth
  ) {
    executeCommandsInViewport(true, scene, passState);
  } else if (
    Math.abs(viewportX + viewportWidth * 0.5 - windowCoordinates.x) < 1.0
  ) {
    viewport.width = windowCoordinates.x - viewport.x;

    camera.position.x *= CesiumMath.sign(camera.position.x);

    camera.frustum.right = 0.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = windowCoordinates.x;

    camera.position.x = -camera.position.x;

    camera.frustum.right = -camera.frustum.left;
    camera.frustum.left = 0.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  } else if (windowCoordinates.x > viewportX + viewportWidth * 0.5) {
    viewport.width = windowCoordinates.x - viewportX;

    const right = camera.frustum.right;
    camera.frustum.right = maxCoord.x - x;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = windowCoordinates.x;
    viewport.width = viewportX + viewportWidth - windowCoordinates.x;

    camera.position.x = -camera.position.x;

    camera.frustum.left = -camera.frustum.right;
    camera.frustum.right = right - camera.frustum.right * 2.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  } else {
    viewport.x = windowCoordinates.x;
    viewport.width = viewportX + viewportWidth - windowCoordinates.x;

    const left = camera.frustum.left;
    camera.frustum.left = -maxCoord.x - x;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = viewportX;
    viewport.width = windowCoordinates.x - viewportX;

    camera.position.x = -camera.position.x;

    camera.frustum.right = -camera.frustum.left;
    camera.frustum.left = left - camera.frustum.left * 2.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC
    );
    context.uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  }

  camera._setTransform(transform);
  Cartesian3.clone(position, camera.position);
  camera.frustum = frustum.clone();
  passState.viewport = originalViewport;
}

function executeCommandsInViewport(
  firstViewport,
  scene,
  passState,
  backgroundColor
) {
  const environmentState = scene._environmentState;
  const view = scene._view;
  const renderTranslucentDepthForPick =
    environmentState.renderTranslucentDepthForPick;

  if (!firstViewport) {
    scene.frameState.commandList.length = 0;
  }

  updateAndRenderPrimitives(scene);

  view.createPotentiallyVisibleSet(scene);

  if (firstViewport) {
    if (defined(backgroundColor)) {
      updateAndClearFramebuffers(scene, passState, backgroundColor);
    }
    executeComputeCommands(scene);
    if (!renderTranslucentDepthForPick) {
      executeShadowMapCastCommands(scene);
    }
  }

  executeCommands(scene, passState);
}

const scratchCullingVolume = new CullingVolume();

/**
 * @private
 */
Scene.prototype.updateEnvironment = function () {
  const frameState = this._frameState;
  const view = this._view;

  // Update celestial and terrestrial environment effects.
  const environmentState = this._environmentState;
  const renderPass = frameState.passes.render;
  const offscreenPass = frameState.passes.offscreen;
  const atmosphere = this.atmosphere;
  const skyAtmosphere = this.skyAtmosphere;
  const globe = this.globe;
  const globeTranslucencyState = this._globeTranslucencyState;

  if (
    !renderPass ||
    (this._mode !== SceneMode.SCENE2D &&
      view.camera.frustum instanceof OrthographicFrustum) ||
    !globeTranslucencyState.environmentVisible
  ) {
    environmentState.skyAtmosphereCommand = undefined;
    environmentState.skyBoxCommand = undefined;
    environmentState.sunDrawCommand = undefined;
    environmentState.sunComputeCommand = undefined;
    environmentState.moonCommand = undefined;
  } else {
    if (defined(skyAtmosphere)) {
      if (defined(globe)) {
        skyAtmosphere.setDynamicLighting(
          DynamicAtmosphereLightingType.fromGlobeFlags(globe)
        );
        environmentState.isReadyForAtmosphere =
          environmentState.isReadyForAtmosphere ||
          !globe.show ||
          globe._surface._tilesToRender.length > 0;
      } else {
        const dynamicLighting = atmosphere.dynamicLighting;
        skyAtmosphere.setDynamicLighting(dynamicLighting);
        environmentState.isReadyForAtmosphere = true;
      }

      environmentState.skyAtmosphereCommand = skyAtmosphere.update(
        frameState,
        globe
      );
      if (defined(environmentState.skyAtmosphereCommand)) {
        this.updateDerivedCommands(environmentState.skyAtmosphereCommand);
      }
    } else {
      environmentState.skyAtmosphereCommand = undefined;
    }

    environmentState.skyBoxCommand = defined(this.skyBox)
      ? this.skyBox.update(frameState, this._hdr)
      : undefined;
    const sunCommands = defined(this.sun)
      ? this.sun.update(frameState, view.passState, this._hdr)
      : undefined;
    environmentState.sunDrawCommand = defined(sunCommands)
      ? sunCommands.drawCommand
      : undefined;
    environmentState.sunComputeCommand = defined(sunCommands)
      ? sunCommands.computeCommand
      : undefined;
    environmentState.moonCommand = defined(this.moon)
      ? this.moon.update(frameState)
      : undefined;
  }

  const clearGlobeDepth = (environmentState.clearGlobeDepth =
    defined(globe) &&
    globe.show &&
    (!globe.depthTestAgainstTerrain || this.mode === SceneMode.SCENE2D));
  const useDepthPlane = (environmentState.useDepthPlane =
    clearGlobeDepth &&
    this.mode === SceneMode.SCENE3D &&
    globeTranslucencyState.useDepthPlane);
  if (useDepthPlane) {
    // Update the depth plane that is rendered in 3D when the primitives are
    // not depth tested against terrain so primitives on the backface
    // of the globe are not picked.
    this._depthPlane.update(frameState);
  }

  environmentState.renderTranslucentDepthForPick = false;
  environmentState.useWebVR =
    this._useWebVR && this.mode !== SceneMode.SCENE2D && !offscreenPass;

  const occluder =
    frameState.mode === SceneMode.SCENE3D &&
    !globeTranslucencyState.sunVisibleThroughGlobe
      ? frameState.occluder
      : undefined;
  let cullingVolume = frameState.cullingVolume;

  // get user culling volume minus the far plane.
  const planes = scratchCullingVolume.planes;
  for (let k = 0; k < 5; ++k) {
    planes[k] = cullingVolume.planes[k];
  }
  cullingVolume = scratchCullingVolume;

  // Determine visibility of celestial and terrestrial environment effects.
  environmentState.isSkyAtmosphereVisible =
    defined(environmentState.skyAtmosphereCommand) &&
    environmentState.isReadyForAtmosphere;
  environmentState.isSunVisible = this.isVisible(
    environmentState.sunDrawCommand,
    cullingVolume,
    occluder
  );
  environmentState.isMoonVisible = this.isVisible(
    environmentState.moonCommand,
    cullingVolume,
    occluder
  );

  const envMaps = this.specularEnvironmentMaps;
  let specularEnvironmentCubeMap = this._specularEnvironmentCubeMap;
  if (defined(envMaps) && specularEnvironmentCubeMap?.url !== envMaps) {
    specularEnvironmentCubeMap =
      specularEnvironmentCubeMap && specularEnvironmentCubeMap.destroy();
    this._specularEnvironmentCubeMap = new SpecularEnvironmentCubeMap(envMaps);
  } else if (!defined(envMaps) && defined(specularEnvironmentCubeMap)) {
    specularEnvironmentCubeMap.destroy();
    this._specularEnvironmentCubeMap = undefined;
  }

  if (defined(this._specularEnvironmentCubeMap)) {
    this._specularEnvironmentCubeMap.update(frameState);
  }
};

function updateDebugFrustumPlanes(scene) {
  const frameState = scene._frameState;
  if (scene.debugShowFrustumPlanes !== scene._debugShowFrustumPlanes) {
    if (scene.debugShowFrustumPlanes) {
      scene._debugFrustumPlanes = new DebugCameraPrimitive({
        camera: scene.camera,
        updateOnChange: false,
        frustumSplits: frameState.frustumSplits,
      });
    } else {
      scene._debugFrustumPlanes =
        scene._debugFrustumPlanes && scene._debugFrustumPlanes.destroy();
    }
    scene._debugShowFrustumPlanes = scene.debugShowFrustumPlanes;
  }

  if (defined(scene._debugFrustumPlanes)) {
    scene._debugFrustumPlanes.update(frameState);
  }
}

function updateShadowMaps(scene) {
  const frameState = scene._frameState;
  const shadowMaps = frameState.shadowMaps;
  const length = shadowMaps.length;

  const shadowsEnabled =
    length > 0 &&
    !frameState.passes.pick &&
    !frameState.passes.pickVoxel &&
    scene.mode === SceneMode.SCENE3D;
  if (shadowsEnabled !== frameState.shadowState.shadowsEnabled) {
    // Update derived commands when shadowsEnabled changes
    ++frameState.shadowState.lastDirtyTime;
    frameState.shadowState.shadowsEnabled = shadowsEnabled;
  }

  frameState.shadowState.lightShadowsEnabled = false;

  if (!shadowsEnabled) {
    return;
  }

  // Check if the shadow maps are different than the shadow maps last frame.
  // If so, the derived commands need to be updated.
  for (let j = 0; j < length; ++j) {
    if (shadowMaps[j] !== frameState.shadowState.shadowMaps[j]) {
      ++frameState.shadowState.lastDirtyTime;
      break;
    }
  }

  frameState.shadowState.shadowMaps.length = 0;
  frameState.shadowState.lightShadowMaps.length = 0;

  for (let i = 0; i < length; ++i) {
    const shadowMap = shadowMaps[i];
    shadowMap.update(frameState);

    frameState.shadowState.shadowMaps.push(shadowMap);

    if (shadowMap.fromLightSource) {
      frameState.shadowState.lightShadowMaps.push(shadowMap);
      frameState.shadowState.lightShadowsEnabled = true;
    }

    if (shadowMap.dirty) {
      ++frameState.shadowState.lastDirtyTime;
      shadowMap.dirty = false;
    }
  }
}

function updateAndRenderPrimitives(scene) {
  const frameState = scene._frameState;

  scene._groundPrimitives.update(frameState);
  scene._primitives.update(frameState);

  updateDebugFrustumPlanes(scene);
  updateShadowMaps(scene);

  if (scene._globe) {
    scene._globe.render(frameState);
  }
}

function updateAndClearFramebuffers(scene, passState, clearColor) {
  const context = scene._context;
  const frameState = scene._frameState;
  const environmentState = scene._environmentState;
  const view = scene._view;

  const passes = scene._frameState.passes;
  const picking = passes.pick || passes.pickVoxel;
  if (defined(view.globeDepth)) {
    view.globeDepth.picking = picking;
  }
  const useWebVR = environmentState.useWebVR;

  // Preserve the reference to the original framebuffer.
  environmentState.originalFramebuffer = passState.framebuffer;

  // Manage sun bloom post-processing effect.
  if (defined(scene.sun) && scene.sunBloom !== scene._sunBloom) {
    if (scene.sunBloom && !useWebVR) {
      scene._sunPostProcess = new SunPostProcess();
    } else if (defined(scene._sunPostProcess)) {
      scene._sunPostProcess = scene._sunPostProcess.destroy();
    }

    scene._sunBloom = scene.sunBloom;
  } else if (!defined(scene.sun) && defined(scene._sunPostProcess)) {
    scene._sunPostProcess = scene._sunPostProcess.destroy();
    scene._sunBloom = false;
  }

  // Clear the pass state framebuffer.
  const clear = scene._clearColorCommand;
  Color.clone(clearColor, clear.color);
  clear.execute(context, passState);

  // Update globe depth rendering based on the current context and clear the globe depth framebuffer.
  // Globe depth is copied for the pick pass to support picking batched geometries in GroundPrimitives.
  const useGlobeDepthFramebuffer = (environmentState.useGlobeDepthFramebuffer = defined(
    view.globeDepth
  ));
  if (useGlobeDepthFramebuffer) {
    view.globeDepth.update(
      context,
      passState,
      view.viewport,
      scene.msaaSamples,
      scene._hdr,
      environmentState.clearGlobeDepth
    );
    view.globeDepth.clear(context, passState, clearColor);
  }

  // If supported, configure OIT to use the globe depth framebuffer and clear the OIT framebuffer.
  const oit = view.oit;
  const useOIT = (environmentState.useOIT =
    !picking && defined(oit) && oit.isSupported());
  if (useOIT) {
    oit.update(
      context,
      passState,
      view.globeDepth.colorFramebufferManager,
      scene._hdr,
      scene.msaaSamples
    );
    oit.clear(context, passState, clearColor);
    environmentState.useOIT = oit.isSupported();
  }

  const postProcess = scene.postProcessStages;
  let usePostProcess = (environmentState.usePostProcess =
    !picking &&
    (scene._hdr ||
      postProcess.length > 0 ||
      postProcess.ambientOcclusion.enabled ||
      postProcess.fxaa.enabled ||
      postProcess.bloom.enabled));
  environmentState.usePostProcessSelected = false;
  if (usePostProcess) {
    view.sceneFramebuffer.update(
      context,
      view.viewport,
      scene._hdr,
      scene.msaaSamples
    );
    view.sceneFramebuffer.clear(context, passState, clearColor);

    postProcess.update(context, frameState.useLogDepth, scene._hdr);
    postProcess.clear(context);

    usePostProcess = environmentState.usePostProcess = postProcess.ready;
    environmentState.usePostProcessSelected =
      usePostProcess && postProcess.hasSelected;
  }

  if (environmentState.isSunVisible && scene.sunBloom && !useWebVR) {
    passState.framebuffer = scene._sunPostProcess.update(passState);
    scene._sunPostProcess.clear(context, passState, clearColor);
  } else if (useGlobeDepthFramebuffer) {
    passState.framebuffer = view.globeDepth.framebuffer;
  } else if (usePostProcess) {
    passState.framebuffer = view.sceneFramebuffer.framebuffer;
  }

  if (defined(passState.framebuffer)) {
    clear.execute(context, passState);
  }

  const useInvertClassification = (environmentState.useInvertClassification =
    !picking && defined(passState.framebuffer) && scene.invertClassification);
  if (useInvertClassification) {
    let depthFramebuffer;
    if (scene.frameState.invertClassificationColor.alpha === 1.0) {
      if (environmentState.useGlobeDepthFramebuffer) {
        depthFramebuffer = view.globeDepth.framebuffer;
      }
    }

    if (defined(depthFramebuffer) || context.depthTexture) {
      scene._invertClassification.previousFramebuffer = depthFramebuffer;
      scene._invertClassification.update(
        context,
        scene.msaaSamples,
        view.globeDepth.colorFramebufferManager
      );
      scene._invertClassification.clear(context, passState);

      if (scene.frameState.invertClassificationColor.alpha < 1.0 && useOIT) {
        const command = scene._invertClassification.unclassifiedCommand;
        const derivedCommands = command.derivedCommands;
        derivedCommands.oit = oit.createDerivedCommands(
          command,
          context,
          derivedCommands.oit
        );
      }
    } else {
      environmentState.useInvertClassification = false;
    }
  }

  if (scene._globeTranslucencyState.translucent) {
    view.globeTranslucencyFramebuffer.updateAndClear(
      scene._hdr,
      view.viewport,
      context,
      passState
    );
  }
}

/**
 * @private
 */
Scene.prototype.resolveFramebuffers = function (passState) {
  const context = this._context;
  const environmentState = this._environmentState;
  const view = this._view;
  const globeDepth = view.globeDepth;
  if (defined(globeDepth)) {
    globeDepth.prepareColorTextures(context);
  }

  const useOIT = environmentState.useOIT;
  const useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer;
  const usePostProcess = environmentState.usePostProcess;

  const defaultFramebuffer = environmentState.originalFramebuffer;
  const globeFramebuffer = useGlobeDepthFramebuffer
    ? globeDepth.colorFramebufferManager
    : undefined;
  const sceneFramebuffer = view.sceneFramebuffer._colorFramebuffer;
  const idFramebuffer = view.sceneFramebuffer.idFramebuffer;

  if (useOIT) {
    passState.framebuffer = usePostProcess
      ? sceneFramebuffer.framebuffer
      : defaultFramebuffer;
    view.oit.execute(context, passState);
  }

  const translucentTileClassification = view.translucentTileClassification;
  if (
    translucentTileClassification.hasTranslucentDepth &&
    translucentTileClassification.isSupported()
  ) {
    translucentTileClassification.execute(this, passState);
  }

  if (usePostProcess) {
    view.sceneFramebuffer.prepareColorTextures(context);
    let inputFramebuffer = sceneFramebuffer;
    if (useGlobeDepthFramebuffer && !useOIT) {
      inputFramebuffer = globeFramebuffer;
    }

    const postProcess = this.postProcessStages;
    const colorTexture = inputFramebuffer.getColorTexture(0);
    const idTexture = idFramebuffer.getColorTexture(0);
    const depthTexture = defaultValue(
      globeFramebuffer,
      sceneFramebuffer
    ).getDepthStencilTexture();
    postProcess.execute(context, colorTexture, depthTexture, idTexture);
    postProcess.copy(context, defaultFramebuffer);
  }

  if (!useOIT && !usePostProcess && useGlobeDepthFramebuffer) {
    passState.framebuffer = defaultFramebuffer;
    globeDepth.executeCopyColor(context, passState);
  }
};

function callAfterRenderFunctions(scene) {
  // Functions are queued up during primitive update and executed here in case
  // the function modifies scene state that should remain constant over the frame.
  const functions = scene._frameState.afterRender;
  for (let i = 0, length = functions.length; i < length; ++i) {
    const shouldRequestRender = functions[i]();
    if (shouldRequestRender) {
      scene.requestRender();
    }
  }

  functions.length = 0;
}

function getGlobeHeight(scene) {
  if (scene.mode === SceneMode.MORPHING) {
    return;
  }

  const camera = scene.camera;
  const cartographic = camera.positionCartographic;
  return scene.getHeight(cartographic);
}

/**
 * Gets the height of the loaded surface at the cartographic position.
 * @param {Cartographic} cartographic The cartographic position.
 * @param {HeightReference} [heightReference=CLAMP_TO_GROUND] Based on the height reference value, determines whether to ignore heights from 3D Tiles or terrain.
 * @private
 */
Scene.prototype.getHeight = function (cartographic, heightReference) {
  if (!defined(cartographic)) {
    return undefined;
  }

  const ignore3dTiles =
    heightReference === HeightReference.CLAMP_TO_TERRAIN ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN;

  const ignoreTerrain =
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE;

  if (!defined(cartographic)) {
    return;
  }

  let maxHeight = Number.NEGATIVE_INFINITY;

  if (!ignore3dTiles) {
    const length = this.primitives.length;
    for (let i = 0; i < length; ++i) {
      const primitive = this.primitives.get(i);
      if (
        !primitive.isCesium3DTileset ||
        !primitive.show ||
        !primitive.enableCollision
      ) {
        continue;
      }

      const result = primitive.getHeight(cartographic, this);
      if (defined(result) && result > maxHeight) {
        maxHeight = result;
      }
    }
  }

  const globe = this._globe;
  if (!ignoreTerrain && defined(globe) && globe.show) {
    const result = globe.getHeight(cartographic);
    if (result > maxHeight) {
      maxHeight = result;
    }
  }

  if (maxHeight > Number.NEGATIVE_INFINITY) {
    return maxHeight;
  }

  return undefined;
};

const updateHeightScratchCartographic = new Cartographic();
/**
 * 在渲染包含给定制图的新瓦片时调用回调。唯一的参数
 * 是瓦片上的笛卡尔位置。
 *
 * @private
 *
 * @param {Cartographic} cartographic 制图位置。
 * @param {Function} callback 加载包含更新的制图的新瓦片时要调用的函数。
 * @param {HeightReference} [heightReference=CLAMP_TO_GROUND] 根据高度参考值，确定是否忽略 3D 瓦片或地形的高度。
 * @returns {Function} 从四叉树中删除此回调的函数。
 */
Scene.prototype.updateHeight = function (
  cartographic,
  callback,
  heightReference
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("callback", callback);
  //>>includeEnd('debug');

  const callbackWrapper = () => {
    Cartographic.clone(cartographic, updateHeightScratchCartographic);

    const height = this.getHeight(cartographic, heightReference);
    if (defined(height)) {
      updateHeightScratchCartographic.height = height;
      callback(updateHeightScratchCartographic);
    }
  };

  const ignore3dTiles =
    heightReference === HeightReference.CLAMP_TO_TERRAIN ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN;

  const ignoreTerrain =
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE;

  let terrainRemoveCallback;
  if (!ignoreTerrain && defined(this.globe)) {
    terrainRemoveCallback = this.globe._surface.updateHeight(
      cartographic,
      callbackWrapper
    );
  }

  let tilesetRemoveCallbacks = {};
  const ellipsoid = this._ellipsoid;
  const createPrimitiveEventListener = (primitive) => {
    if (
      ignore3dTiles ||
      primitive.isDestroyed() ||
      !primitive.isCesium3DTileset
    ) {
      return;
    }

    const tilesetRemoveCallback = primitive.updateHeight(
      cartographic,
      callbackWrapper,
      ellipsoid
    );
    tilesetRemoveCallbacks[primitive.id] = tilesetRemoveCallback;
  };

  if (!ignore3dTiles) {
    const length = this.primitives.length;
    for (let i = 0; i < length; ++i) {
      const primitive = this.primitives.get(i);
      createPrimitiveEventListener(primitive);
    }
  }

  const removeAddedListener = this.primitives.primitiveAdded.addEventListener(
    createPrimitiveEventListener
  );
  const removeRemovedListener = this.primitives.primitiveRemoved.addEventListener(
    (primitive) => {
      if (primitive.isDestroyed() || !primitive.isCesium3DTileset) {
        return;
      }
      if (defined(tilesetRemoveCallbacks[primitive.id])) {
        tilesetRemoveCallbacks[primitive.id]();
      }
      delete tilesetRemoveCallbacks[primitive.id];
    }
  );

  const removeCallback = () => {
    terrainRemoveCallback = terrainRemoveCallback && terrainRemoveCallback();
    Object.values(tilesetRemoveCallbacks).forEach((tilesetRemoveCallback) =>
      tilesetRemoveCallback()
    );
    tilesetRemoveCallbacks = {};
    removeAddedListener();
    removeRemovedListener();
  };

  return removeCallback;
};

function isCameraUnderground(scene) {
  const camera = scene.camera;
  const mode = scene._mode;
  const cameraController = scene._screenSpaceCameraController;
  const cartographic = camera.positionCartographic;

  if (!defined(cartographic)) {
    return false;
  }

  if (!cameraController.onMap() && cartographic.height < 0.0) {
    // The camera can go off the map while in Columbus View.
    // Make a best guess as to whether it's underground by checking if its height is less than zero.
    return true;
  }

  if (mode === SceneMode.SCENE2D || mode === SceneMode.MORPHING) {
    return false;
  }

  const globeHeight = scene._globeHeight;
  return defined(globeHeight) && cartographic.height < globeHeight;
}

/**
 * @private
 */
Scene.prototype.initializeFrame = function () {
  // Destroy released shaders and textures once every 120 frames to avoid thrashing the cache
  if (this._shaderFrameCount++ === 120) {
    this._shaderFrameCount = 0;
    this._context.shaderCache.destroyReleasedShaderPrograms();
    this._context.textureCache.destroyReleasedTextures();
  }

  this._tweens.update();

  if (this._globeHeightDirty) {
    if (defined(this._removeUpdateHeightCallback)) {
      this._removeUpdateHeightCallback();
      this._removeUpdateHeightCallback = undefined;
    }

    this._globeHeight = getGlobeHeight(this);
    this._globeHeightDirty = false;

    const cartographic = this.camera.positionCartographic;
    this._removeUpdateHeightCallback = this.updateHeight(
      cartographic,
      (updatedCartographic) => {
        if (this.isDestroyed()) {
          return;
        }

        this._globeHeight = updatedCartographic.height;
      }
    );
  }
  this._cameraUnderground = isCameraUnderground(this);
  this._globeTranslucencyState.update(this);

  this._screenSpaceCameraController.update();
  if (defined(this._deviceOrientationCameraController)) {
    this._deviceOrientationCameraController.update();
  }

  this.camera.update(this._mode);
  this.camera._updateCameraChanged();
};

function updateDebugShowFramesPerSecond(scene, renderedThisFrame) {
  if (scene.debugShowFramesPerSecond) {
    if (!defined(scene._performanceDisplay)) {
      const performanceContainer = document.createElement("div");
      performanceContainer.className =
        "cesium-performanceDisplay-defaultContainer";
      const container = scene._canvas.parentNode;
      container.appendChild(performanceContainer);
      const performanceDisplay = new PerformanceDisplay({
        container: performanceContainer,
      });
      scene._performanceDisplay = performanceDisplay;
      scene._performanceContainer = performanceContainer;
    }

    scene._performanceDisplay.throttled = scene.requestRenderMode;
    scene._performanceDisplay.update(renderedThisFrame);
  } else if (defined(scene._performanceDisplay)) {
    scene._performanceDisplay =
      scene._performanceDisplay && scene._performanceDisplay.destroy();
    scene._performanceContainer.parentNode.removeChild(
      scene._performanceContainer
    );
  }
}

function prePassesUpdate(scene) {
  scene._jobScheduler.resetBudgets();

  const frameState = scene._frameState;
  const primitives = scene.primitives;
  primitives.prePassesUpdate(frameState);

  if (defined(scene.globe)) {
    scene.globe.update(frameState);
  }

  scene._picking.update();
  frameState.creditDisplay.update();
}

function postPassesUpdate(scene) {
  const frameState = scene._frameState;
  const primitives = scene.primitives;
  primitives.postPassesUpdate(frameState);

  RequestScheduler.update();
}

const scratchBackgroundColor = new Color();

function render(scene) {
  const frameState = scene._frameState;

  const context = scene.context;
  const us = context.uniformState;

  const view = scene._defaultView;
  scene._view = view;

  scene.updateFrameState();
  frameState.passes.render = true;
  frameState.passes.postProcess = scene.postProcessStages.hasSelected;
  frameState.tilesetPassState = renderTilesetPassState;

  let backgroundColor = defaultValue(scene.backgroundColor, Color.BLACK);
  if (scene._hdr) {
    backgroundColor = Color.clone(backgroundColor, scratchBackgroundColor);
    backgroundColor.red = Math.pow(backgroundColor.red, scene.gamma);
    backgroundColor.green = Math.pow(backgroundColor.green, scene.gamma);
    backgroundColor.blue = Math.pow(backgroundColor.blue, scene.gamma);
  }
  frameState.backgroundColor = backgroundColor;

  frameState.atmosphere = scene.atmosphere;
  scene.fog.update(frameState);

  us.update(frameState);

  const shadowMap = scene.shadowMap;
  if (defined(shadowMap) && shadowMap.enabled) {
    if (!defined(scene.light) || scene.light instanceof SunLight) {
      // Negate the sun direction so that it is from the Sun, not to the Sun
      Cartesian3.negate(us.sunDirectionWC, scene._shadowMapCamera.direction);
    } else {
      Cartesian3.clone(scene.light.direction, scene._shadowMapCamera.direction);
    }
    frameState.shadowMaps.push(shadowMap);
  }

  scene._computeCommandList.length = 0;
  scene._overlayCommandList.length = 0;

  const viewport = view.viewport;
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = context.drawingBufferWidth;
  viewport.height = context.drawingBufferHeight;

  const passState = view.passState;
  passState.framebuffer = undefined;
  passState.blendingEnabled = undefined;
  passState.scissorTest = undefined;
  passState.viewport = BoundingRectangle.clone(viewport, passState.viewport);

  if (defined(scene.globe)) {
    scene.globe.beginFrame(frameState);
  }

  scene.updateEnvironment();
  scene.updateAndExecuteCommands(passState, backgroundColor);
  scene.resolveFramebuffers(passState);

  passState.framebuffer = undefined;
  executeOverlayCommands(scene, passState);

  if (defined(scene.globe)) {
    scene.globe.endFrame(frameState);

    if (!scene.globe.tilesLoaded) {
      scene._renderRequested = true;
    }
  }

  context.endFrame();
}

function tryAndCatchError(scene, functionToExecute) {
  try {
    functionToExecute(scene);
  } catch (error) {
    scene._renderError.raiseEvent(scene, error);

    if (scene.rethrowRenderErrors) {
      throw error;
    }
  }
}

function updateMostDetailedRayPicks(scene) {
  return scene._picking.updateMostDetailedRayPicks(scene);
}

/**
 * 更新并渲染场景。通常不需要调用此函数
 * 直接执行此操作，因为 {@link CesiumWidget} 会自动执行此操作。
 * @param {JulianDate} [time] 渲染的模拟时间。
 */
Scene.prototype.render = function (time) {
  /**
   *
   * Pre pass 更新。在此处执行应在传递之前运行的任何传递不变代码。
   *
   */
  this._preUpdate.raiseEvent(this, time);

  const frameState = this._frameState;
  frameState.newFrame = false;

  if (!defined(time)) {
    time = JulianDate.now();
  }

  const cameraChanged = this._view.checkForCameraUpdates(this);
  if (cameraChanged) {
    this._globeHeightDirty = true;
  }

  // Determine if should render a new frame in request render mode
  let shouldRender =
    !this.requestRenderMode ||
    this._renderRequested ||
    cameraChanged ||
    this._logDepthBufferDirty ||
    this._hdrDirty ||
    this.mode === SceneMode.MORPHING;
  if (
    !shouldRender &&
    defined(this.maximumRenderTimeChange) &&
    defined(this._lastRenderTime)
  ) {
    const difference = Math.abs(
      JulianDate.secondsDifference(this._lastRenderTime, time)
    );
    shouldRender = shouldRender || difference > this.maximumRenderTimeChange;
  }

  if (shouldRender) {
    this._lastRenderTime = JulianDate.clone(time, this._lastRenderTime);
    this._renderRequested = false;
    this._logDepthBufferDirty = false;
    this._hdrDirty = false;

    const frameNumber = CesiumMath.incrementWrap(
      frameState.frameNumber,
      15000000.0,
      1.0
    );
    updateFrameNumber(this, frameNumber, time);
    frameState.newFrame = true;
  }

  tryAndCatchError(this, prePassesUpdate);

  /**
   *
   * 凭证更新。在此处添加任何通行证
   *
   */
  if (this.primitives.show) {
    tryAndCatchError(this, updateMostDetailedRayPicks);
    tryAndCatchError(this, updatePreloadPass);
    tryAndCatchError(this, updatePreloadFlightPass);
    if (!shouldRender) {
      tryAndCatchError(this, updateRequestRenderModeDeferCheckPass);
    }
  }

  this._postUpdate.raiseEvent(this, time);

  if (shouldRender) {
    this._preRender.raiseEvent(this, time);
    frameState.creditDisplay.beginFrame();
    tryAndCatchError(this, render);
  }

  /**
   *
   * 传递后更新。在此处执行应在传递之后运行的任何传递不变代码。
   *
   */
  updateDebugShowFramesPerSecond(this, shouldRender);
  tryAndCatchError(this, postPassesUpdate);

  // Often used to trigger events (so don't want in trycatch) that the user might be subscribed to. Things like the tile load events, promises, etc.
  // We don't want those events to resolve during the render loop because the events might add new primitives
  callAfterRenderFunctions(this);

  if (shouldRender) {
    this._postRender.raiseEvent(this, time);
    frameState.creditDisplay.endFrame();
  }
};

/**
 * 更新并渲染场景。始终强制使用新的渲染帧，无论渲染是否为
 * 之前要求。
 * @param {JulianDate} [time] 渲染的模拟时间。
 *
 * @private
 */
Scene.prototype.forceRender = function (time) {
  this._renderRequested = true;
  this.render(time);
};

/**
 * 当 {@link Scene#requestRenderMode} 设置为 <code>true</code> 时，请求新的渲染帧。
 * 渲染速率不会超过 {@link CesiumWidget#targetFrameRate}。
 *
 * @see Scene#requestRenderMode
 */
Scene.prototype.requestRender = function () {
  this._renderRequested = true;
};

/**
 * @private
 */
Scene.prototype.clampLineWidth = function (width) {
  return Math.max(
    ContextLimits.minimumAliasedLineWidth,
    Math.min(width, ContextLimits.maximumAliasedLineWidth)
  );
};

/**
 * 返回具有 'primitive' 属性的对象，该属性包含场景中的第一个（顶部）基元
 * 在特定窗口坐标处，如果该位置没有任何内容，则为 undefined。其他属性可能
 * 可能根据基元的类型进行设置，并可用于进一步标识拾取的对象。
 * <p>
 * 选取 3D 瓦片集的特征时，<code>pick</code> 返回 {@link Cesium3DTileFeature} 对象。
 * </p>
 *
 * @example
 * // On mouse over, color the feature yellow.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileFeature) {
 *         feature.color = Cesium.Color.YELLOW;
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 *
 * @param {Cartesian2} windowPosition Window coordinates to perform picking on.
 * @param {number} [width=3] Width of the pick rectangle.
 * @param {number} [height=3] Height of the pick rectangle.
 * @returns {object} Object containing the picked primitive.
 */
Scene.prototype.pick = function (windowPosition, width, height) {
  return this._picking.pick(this, windowPosition, width, height);
};

/**
 * 返回在特定窗口坐标处渲染的体素样本的 {@link VoxelCell}，
 * 或 undefined（如果在该位置未渲染体素）。
 *
 * @example
 * On left click, report the value of the "color" property at that voxel sample.
 * handler.setInputAction(function(movement) {
 *   const voxelCell = scene.pickVoxel(movement.position);
 *   if (defined(voxelCell)) {
 *     console.log(voxelCell.getProperty("color"));
 *   }
 * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 *
 * @param {Cartesian2} windowPosition Window coordinates to perform picking on.
 * @param {number} [width=3] Width of the pick rectangle.
 * @param {number} [height=3] Height of the pick rectangle.
 * @returns {VoxelCell|undefined} Information about the voxel cell rendered at the picked position.
 *
 * @experimental This feature is not final and is subject to change without Cesium's standard deprecation policy.
 */
Scene.prototype.pickVoxel = function (windowPosition, width, height) {
  const pickedObject = this.pick(windowPosition, width, height);
  if (!defined(pickedObject)) {
    return;
  }
  const voxelPrimitive = pickedObject.primitive;
  if (!(voxelPrimitive instanceof VoxelPrimitive)) {
    return;
  }
  const voxelCoordinate = this._picking.pickVoxelCoordinate(
    this,
    windowPosition,
    width,
    height
  );
  // Look up the keyframeNode containing this picked cell
  const tileIndex = 255 * voxelCoordinate[0] + voxelCoordinate[1];
  const keyframeNode = voxelPrimitive._traversal.findKeyframeNode(tileIndex);
  if (!defined(keyframeNode)) {
    // The tile rendered at the pick position has since been discarded by
    // a traversal update
    return;
  }
  // Look up the metadata for the picked cell
  const sampleIndex = 255 * voxelCoordinate[2] + voxelCoordinate[3];
  return VoxelCell.fromKeyframeNode(
    voxelPrimitive,
    tileIndex,
    sampleIndex,
    keyframeNode
  );
};

/**
 * 返回从深度缓冲区和窗口位置重建的笛卡尔位置。
 * 返回的位置在世界坐标中。由相机功能在内部用于
 * 防止转换为投影的 2D 坐标，然后再转换回来。
 * <p>
 * 将 {@link Scene#pickTranslucentDepth} 设置为 <code>true</code>，以包含
 * 半透明基元;否则，这基本上会选择 Translucent Primitives。
 * </p>
 *
 * @private
 *
 * @param {Cartesian2} windowPosition 窗口坐标以执行选取。
 * @param {Cartesian3} [result] 要恢复结果的对象。
 * @returns {Cartesian3} 世界坐标中的笛卡尔位置。
 *
 * @exception {DeveloperError} Picking from the depth buffer is not supported. Check pickPositionSupported.
 */
Scene.prototype.pickPositionWorldCoordinates = function (
  windowPosition,
  result
) {
  return this._picking.pickPositionWorldCoordinates(
    this,
    windowPosition,
    result
  );
};

/**
 * 返回从深度缓冲区和窗口位置重建的笛卡尔位置。
 * <p>
 * 从 2D 深度缓冲区重建的位置可能与
 * 以 3D 和哥伦布视图重建。这是由分布的差异引起的
 * 透视和正交投影的深度值。
 * </p>
 * <p>
 * 将 {@link Scene#pickTranslucentDepth} 设置为 <code>true</code>，以包含
 * 半透明基元;否则，这基本上会选择 Translucent Primitives。
 * </p>
 *
 * @param {Cartesian2} windowPosition 窗口坐标以执行选取。
 * @param {Cartesian3} [result] 要恢复结果的对象。
 * @returns {Cartesian3} 笛卡尔位置。
 *
 * @exception {DeveloperError} Picking from the depth buffer is not supported. Check pickPositionSupported.
 */
Scene.prototype.pickPosition = function (windowPosition, result) {
  return this._picking.pickPosition(this, windowPosition, result);
};

/**
 * 返回一个对象列表，每个对象都包含一个 'primitive' 属性，用于
 * 特定的窗口坐标位置。还可以根据
 * 类型，可用于进一步标识选取的对象。中的
 * 列表按它们在场景中的视觉顺序（从前到后）排序。
 *
 * @param {Cartesian2} windowPosition 窗口坐标以执行选取。
 * @param {number} [limit] 如果提供，请在收集这么多镐后停止钻孔。
 * @param {number} [width=3] 拾取矩形的宽度。
 * @param {number} [height=3] 选取矩形的高度。
 * @returns {any[]} 对象数组，每个对象包含 1 个选取的基元。
 *
 * @exception {DeveloperError} windowPosition is undefined.
 *
 * @example
 * const pickedObjects = scene.drillPick(new Cesium.Cartesian2(100.0, 200.0));
 *
 * @see Scene#pick
 */
Scene.prototype.drillPick = function (windowPosition, limit, width, height) {
  return this._picking.drillPick(this, windowPosition, limit, width, height);
};

function updatePreloadPass(scene) {
  const frameState = scene._frameState;
  preloadTilesetPassState.camera = frameState.camera;
  preloadTilesetPassState.cullingVolume = frameState.cullingVolume;

  const primitives = scene.primitives;
  primitives.updateForPass(frameState, preloadTilesetPassState);
}

function updatePreloadFlightPass(scene) {
  const frameState = scene._frameState;
  const camera = frameState.camera;
  if (!camera.canPreloadFlight()) {
    return;
  }

  preloadFlightTilesetPassState.camera = scene.preloadFlightCamera;
  preloadFlightTilesetPassState.cullingVolume =
    scene.preloadFlightCullingVolume;

  const primitives = scene.primitives;
  primitives.updateForPass(frameState, preloadFlightTilesetPassState);
}

function updateRequestRenderModeDeferCheckPass(scene) {
  // Check if any ignored requests are ready to go (to wake rendering up again)
  scene.primitives.updateForPass(
    scene._frameState,
    requestRenderModeDeferCheckPassState
  );
}

/**
 * 返回一个对象，其中包含与射线相交的第一个对象和交点位置，
 * 或 <code>undefined</code>，如果没有交叉点。相交对象具有<code>基元</code>
 * 属性。可以根据基元的类型设置其他属性
 * ，并可用于进一步识别选取的对象。射线必须以世界坐标给出。
 * <p>
 * 此功能仅选取在当前视图中渲染的地球瓦片和 3D 瓦片。选取所有其他
 * 基元，而不管其可见性如何。
 * </p>
 *
 * @private
 *
 * @param {Ray} ray 射线。
 * @param {Object[]} [objectsToExclude] 要从光线交集中排除的基元、实体或 3D 平铺特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {object} 包含第一个交集的对象和位置的对象。
 *
 * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
 */
Scene.prototype.pickFromRay = function (ray, objectsToExclude, width) {
  return this._picking.pickFromRay(this, ray, objectsToExclude, width);
};

/**
 * 返回对象列表，每个对象都包含与光线相交的对象和交集位置。
 * 相交对象具有包含相交基元的 <code>primitive</code> 属性。其他
 * 属性也可以根据基元的类型进行设置，并可用于进一步标识拾取的对象。
 * 列表中的基元按第一个交集到最后一个交集排序。射线必须在
 * 世界坐标。
 * <p>
 * 此功能仅选取在当前视图中渲染的地球瓦片和 3D 瓦片。选取所有其他
 * 基元，而不管其可见性如何。
 * </p>
 *
 * @private
 *
 * @param {Ray} ray 射线。
 * @param {number} [limit=Number.MAX_VALUE] 如果提供，则在此之后停止查找交叉点many intersections.
 * @param {Object[]} [objectsToExclude] 要添加的基元、实体或 3D 瓦片特征的列表 exclude from the ray intersection.
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {Object[]} 包含每个交集的对象和位置的对象列表。
 *
 * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
 */
Scene.prototype.drillPickFromRay = function (
  ray,
  limit,
  objectsToExclude,
  width
) {
  return this._picking.drillPickFromRay(
    this,
    ray,
    limit,
    objectsToExclude,
    width
  );
};

/**
 * 使用 3D 瓦片集的最大细节级别启动异步 {@link Scene#pickFromRay} 请求
 * 无论可见性如何。
 *
 * @private
 *
 * @param {ray} ray 射线。
 * @param {Object[]} [objectsToExclude] 要从光线交集中排除的基元、实体或 3D 平铺特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {Promise<object>} 一个 Promise，它解析为包含第一个交集的对象和位置的对象。
 *
 * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
 */
Scene.prototype.pickFromRayMostDetailed = function (
  ray,
  objectsToExclude,
  width
) {
  return this._picking.pickFromRayMostDetailed(
    this,
    ray,
    objectsToExclude,
    width
  );
};

/**
 * 使用 3D 瓦片集的最大细节级别启动异步 {@link Scene#drillPickFromRay} 请求
 * 无论可见性如何。
 *
 * @private
 *
 * @param {Ray} ray 射线。
 * @param {number} [limit=Number.MAX_VALUE] 如果提供，请在这么多个交叉点之后停止查找交叉点。
 * @param {Object[]} [objectsToExclude] 要从光线交集中排除的基元、实体或 3D 平铺特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {Promise<Object[]>} 一个 Promise，它解析为包含每个交集的对象和位置的对象列表。
 *
 * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
 */
Scene.prototype.drillPickFromRayMostDetailed = function (
  ray,
  limit,
  objectsToExclude,
  width
) {
  return this._picking.drillPickFromRayMostDetailed(
    this,
    ray,
    limit,
    objectsToExclude,
    width
  );
};

/**
 * 返回给定制图位置处场景几何图形的高度，如果没有，<code>则返回 undefined</code>
 * 要从中采样高度的场景几何体。将忽略输入位置的高度。可用于将对象固定到
 * 场景中的地球、3D 瓦片或基元。
 * <p>
 * 此功能仅对当前视图中渲染的地球瓦片和 3D 瓦片的高度进行采样。样品高度
 * 从所有其他基元开始，而不管它们的可见性如何。
 * </p>
 *
 * @param {Cartographic} position 要从中采样高度的制图位置。
 * @param {Object[]} [objectsToExclude] 不从中采样高度的基元、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {number} 高度。如果没有要从中采样高度的场景几何体，则此字段可能<code>未定义</code>。
 *
 * @example
 * const position = new Cesium.Cartographic(-1.31968, 0.698874);
 * const height = viewer.scene.sampleHeight(position);
 * console.log(height);
 *
 * @see Scene#clampToHeight
 * @see Scene#clampToHeightMostDetailed
 * @see Scene#sampleHeightMostDetailed
 *
 * @exception {DeveloperError} sampleHeight is only supported in 3D mode.
 * @exception {DeveloperError} sampleHeight requires depth texture support. Check sampleHeightSupported.
 */
Scene.prototype.sampleHeight = function (position, objectsToExclude, width) {
  return this._picking.sampleHeight(this, position, objectsToExclude, width);
};

/**
 * 沿大地测量表面法线将给定的笛卡尔位置钳制到场景几何体。返回
 * clamped position 或 <code>undefined</code> 如果没有要固定的场景几何体。可用于夹紧
 * 对象添加到场景中的地球、3D 瓦片或基元。
 * <p>
 * 此功能仅钳制到在当前视图中渲染的地球瓦片和 3D 瓦片。Clamps 到
 * 所有其他基元，无论其可见性如何。
 * </p>
 *
 * @param {Cartesian3} cartesian 笛卡尔位置。
 * @param {Object[]} [objectsToExclude] 不固定到的基元、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @param {Cartesian3} [result] 一个可选的对象，用于返回被固定的位置。
 * @returns {Cartesian3} 修改后的结果参数或新的 Cartesian3 实例（如果未提供）。如果没有要钳制的场景几何体，则此字段可能<code>未定义</code>。
 *
 * @example
 * // Clamp an entity to the underlying scene geometry
 * const position = entity.position.getValue(Cesium.JulianDate.now());
 * entity.position = viewer.scene.clampToHeight(position);
 *
 * @see Scene#sampleHeight
 * @see Scene#sampleHeightMostDetailed
 * @see Scene#clampToHeightMostDetailed
 *
 * @exception {DeveloperError} clampToHeight is only supported in 3D mode.
 * @exception {DeveloperError} clampToHeight requires depth texture support. Check clampToHeightSupported.
 */
Scene.prototype.clampToHeight = function (
  cartesian,
  objectsToExclude,
  width,
  result
) {
  return this._picking.clampToHeight(
    this,
    cartesian,
    objectsToExclude,
    width,
    result
  );
};

/**
 * 对 {@link Cartographic} 位置数组启动异步 {@link Scene#sampleHeight} 查询
 * 使用场景中 3D 瓦片集的最大细节级别。将忽略输入位置的高度。
 * 返回在查询完成时解析的 Promise。每个点高度都已就地修改。
 * 如果由于无法在该位置对几何体进行采样而无法确定高度，或者发生其他错误，
 * 高度设置为 undefined。
 *
 * @param {Cartographic[]} positions 要使用采样高度更新的制图位置。
 * @param {Object[]} [objectsToExclude] 不从中采样高度的基元、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {Promise<Cartographic[]>} 一个 Promise，当查询完成时，它解析为提供的位置列表。
 *
 * @example
 * const positions = [
 *     new Cesium.Cartographic(-1.31968, 0.69887),
 *     new Cesium.Cartographic(-1.10489, 0.83923)
 * ];
 * const promise = viewer.scene.sampleHeightMostDetailed(positions);
 * promise.then(function(updatedPosition) {
 *     // positions[0].height and positions[1].height have been updated.
 *     // updatedPositions is just a reference to positions.
 * }
 *
 * @see Scene#sampleHeight
 *
 * @exception {DeveloperError} sampleHeightMostDetailed is only supported in 3D mode.
 * @exception {DeveloperError} sampleHeightMostDetailed requires depth texture support. Check sampleHeightSupported.
 */
Scene.prototype.sampleHeightMostDetailed = function (
  positions,
  objectsToExclude,
  width
) {
  return this._picking.sampleHeightMostDetailed(
    this,
    positions,
    objectsToExclude,
    width
  );
};

/**
 * 对 {@link Cartesian3} 位置数组启动异步 {@link Scene#clampToHeight} 查询
 * 使用场景中 3D 瓦片集的最大细节级别。返回一个 Promise，该 Promise 在
 * 查询完成。每个位置都进行了就地修改。如果由于没有几何体而无法夹紧位置
 * 可以在该位置采样，否则会发生其他错误，则数组中的元素将设置为 undefined。
 *
 * @param {Cartesian3[]} cartesian 笛卡尔位置，以使用夹紧位置进行更新。
 * @param {Object[]} [objectsToExclude] 不固定到的基元、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉口体积的宽度，以米为单位。
 * @returns {Promise<Cartesian3[]>} 当查询完成时，解析为提供的位置列表的 Promise。
 *
 * @example
 * const cartesians = [
 *     entities[0].position.getValue(Cesium.JulianDate.now()),
 *     entities[1].position.getValue(Cesium.JulianDate.now())
 * ];
 * const promise = viewer.scene.clampToHeightMostDetailed(cartesians);
 * promise.then(function(updatedCartesians) {
 *     entities[0].position = updatedCartesians[0];
 *     entities[1].position = updatedCartesians[1];
 * }
 *
 * @see Scene#clampToHeight
 *
 * @exception {DeveloperError} clampToHeightMostDetailed is only supported in 3D mode.
 * @exception {DeveloperError} clampToHeightMostDetailed requires depth texture support. Check clampToHeightSupported.
 */
Scene.prototype.clampToHeightMostDetailed = function (
  cartesians,
  objectsToExclude,
  width
) {
  return this._picking.clampToHeightMostDetailed(
    this,
    cartesians,
    objectsToExclude,
    width
  );
};

/**
 * 将笛卡尔坐标中的位置转换为画布坐标。 这通常用于将
 * HTML 元素与场景中的对象位于相同的屏幕位置。
 *
 * @param {Cartesian3} position 笛卡尔坐标中的位置。
 * @param {Cartesian2} [result] 一个可选对象，用于返回转换为画布坐标的输入位置。
 * @returns {Cartesian2} 如果没有提供新的Cartesian2实例，则使用修改后的结果参数。 如果输入位置靠近椭球体的中心，则此字段可能<code>未定义</code>。
 *
 * @example
 * // Output the canvas position of longitude/latitude (0, 0) every time the mouse moves.
 * const scene = widget.scene;
 * const position = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
 * handler.setInputAction(function(movement) {
 *     console.log(scene.cartesianToCanvasCoordinates(position));
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
Scene.prototype.cartesianToCanvasCoordinates = function (position, result) {
  return SceneTransforms.worldToWindowCoordinates(this, position, result);
};

/**
 * 立即完成活动过渡。
 */
Scene.prototype.completeMorph = function () {
  this._transitioner.completeMorph();
};

/**
 * 异步将场景转换为 2D。
 * @param {number} [duration=2.0] 过渡动画完成的时间（以秒为单位）。
 */
Scene.prototype.morphTo2D = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphTo2D(duration, this._ellipsoid);
};

/**
 * 异步将场景转换为 Columbus 视图。
 * @param {number} [duration=2.0] 过渡动画完成的时间量（以秒为单位）。
 */
Scene.prototype.morphToColumbusView = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphToColumbusView(duration, this._ellipsoid);
};

/**
 * 异步将场景转换为 3D。
 * @param {number} [duration=2.0] 过渡动画完成的时间量（以秒为单位）。
 */
Scene.prototype.morphTo3D = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphTo3D(duration, this._ellipsoid);
};

function setTerrain(scene, terrain) {
  // Cancel any in-progress terrain update
  scene._removeTerrainProviderReadyListener =
    scene._removeTerrainProviderReadyListener &&
    scene._removeTerrainProviderReadyListener();

  // If the terrain is already loaded, set it immediately
  if (terrain.ready) {
    if (defined(scene.globe)) {
      scene.globe.terrainProvider = terrain.provider;
    }
    return;
  }
  // Otherwise, set a placeholder
  scene.globe.terrainProvider = undefined;
  scene._removeTerrainProviderReadyListener = terrain.readyEvent.addEventListener(
    (provider) => {
      if (defined(scene) && defined(scene.globe)) {
        scene.globe.terrainProvider = provider;
      }

      scene._removeTerrainProviderReadyListener();
    }
  );
}

/**
 * 更新地形，为地球提供表面几何图形。
 *
 * @param {Terrain} terrain 地形提供程序异步帮助程序
 * @returns {Terrain} terrain 地形提供程序异步辅助函数
 *
 * @example
 * // Use Cesium World Terrain
 * scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
 *
 * @example
 * // Use a custom terrain provider
 * const terrain = new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 * scene.setTerrain(terrain);
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 */
Scene.prototype.setTerrain = function (terrain) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrain", terrain);
  //>>includeEnd('debug');

  setTerrain(this, terrain);

  return terrain;
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see Scene#destroy
 */
Scene.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * scene = scene && scene.destroy();
 *
 * @see Scene#isDestroyed
 */
Scene.prototype.destroy = function () {
  this._tweens.removeAll();
  this._computeEngine = this._computeEngine && this._computeEngine.destroy();
  this._screenSpaceCameraController =
    this._screenSpaceCameraController &&
    this._screenSpaceCameraController.destroy();
  this._deviceOrientationCameraController =
    this._deviceOrientationCameraController &&
    !this._deviceOrientationCameraController.isDestroyed() &&
    this._deviceOrientationCameraController.destroy();
  this._primitives = this._primitives && this._primitives.destroy();
  this._groundPrimitives =
    this._groundPrimitives && this._groundPrimitives.destroy();
  this._globe = this._globe && this._globe.destroy();
  this._removeTerrainProviderReadyListener =
    this._removeTerrainProviderReadyListener &&
    this._removeTerrainProviderReadyListener();
  this.skyBox = this.skyBox && this.skyBox.destroy();
  this.skyAtmosphere = this.skyAtmosphere && this.skyAtmosphere.destroy();
  this._debugSphere = this._debugSphere && this._debugSphere.destroy();
  this.sun = this.sun && this.sun.destroy();
  this._sunPostProcess = this._sunPostProcess && this._sunPostProcess.destroy();
  this._depthPlane = this._depthPlane && this._depthPlane.destroy();
  this._transitioner = this._transitioner && this._transitioner.destroy();
  this._debugFrustumPlanes =
    this._debugFrustumPlanes && this._debugFrustumPlanes.destroy();
  this._brdfLutGenerator =
    this._brdfLutGenerator && this._brdfLutGenerator.destroy();
  this._picking = this._picking && this._picking.destroy();

  this._defaultView = this._defaultView && this._defaultView.destroy();
  this._view = undefined;

  if (this._removeCreditContainer) {
    this._canvas.parentNode.removeChild(this._creditContainer);
  }

  this.postProcessStages =
    this.postProcessStages && this.postProcessStages.destroy();

  this._context = this._context && this._context.destroy();
  this._frameState.creditDisplay =
    this._frameState.creditDisplay && this._frameState.creditDisplay.destroy();

  if (defined(this._performanceDisplay)) {
    this._performanceDisplay =
      this._performanceDisplay && this._performanceDisplay.destroy();
    this._performanceContainer.parentNode.removeChild(
      this._performanceContainer
    );
  }

  this._removeRequestListenerCallback();
  this._removeTaskProcessorListenerCallback();
  for (let i = 0; i < this._removeGlobeCallbacks.length; ++i) {
    this._removeGlobeCallbacks[i]();
  }
  this._removeGlobeCallbacks.length = 0;

  if (defined(this._removeUpdateHeightCallback)) {
    this._removeUpdateHeightCallback();
    this._removeUpdateHeightCallback = undefined;
  }

  return destroyObject(this);
};
export default Scene;
