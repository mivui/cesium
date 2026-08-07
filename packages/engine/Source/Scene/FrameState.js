import SceneMode from "./SceneMode.js";

/**
 * State information about the current frame.  An instance of this class
 * is provided to update functions.
 *
 * @param {Context} context The rendering context
 * @param {CreditDisplay} creditDisplay Handles adding and removing credits from an HTML element
 * @param {JobScheduler} jobScheduler The job scheduler
 *
 * @alias FrameState
 * @constructor
 *
 * @private
 */
function FrameState(context, creditDisplay, jobScheduler) {
/**
 * 渲染上下文。
 *
 * @type {Context}
 */
  this.context = context;

/**
 * 渲染命令数组。
 *
 * @type {DrawCommand[]}
 */
  this.commandList = [];

/**
 * 全景渲染命令数组。
 *
 * @type {DrawCommand[]}
 */
  this.panoramaCommandList = [];

/**
 * 阴影贴图数组。
 * @type {ShadowMap[]}
 */
  this.shadowMaps = [];

/**
 * 用于 PBR 模型基于图像光照的 BRDF 查找纹理生成器
 * @type {BrdfLutGenerator}
 */
  this.brdfLutGenerator = undefined;

/**
 * 用于 PBR 模型基于图像光照的环境贴图
 * @type {CubeMap}
 */
  this.environmentMap = undefined;

/**
 * 用于 PBR 模型基于图像光照的球谐系数。
 * @type {Cartesian3[]}
 */
  this.sphericalHarmonicCoefficients = undefined;

/**
 * 用于 PBR 模型基于图像光照的镜面环境图集。
 * @type {Texture}
 */
  this.specularEnvironmentMaps = undefined;

/**
 * 用于 PBR 模型基于图像光照的镜面环境图集的最大细节层次。
 * @type {number}
 */
  this.specularEnvironmentMapsMaximumLOD = undefined;

/**
 * 场景的当前模式。
 *
 * @type {SceneMode}
 * @default {@link SceneMode.SCENE3D}
 */
  this.mode = SceneMode.SCENE3D;

/**
 * 2D/哥伦布视图与3D之间的当前变形过渡时间，0.0为2D或哥伦布视图，1.0为3D。
 *
 * @type {number}
 */
  this.morphTime = SceneMode.getMorphTime(SceneMode.SCENE3D);

/**
 * 当前帧编号。
 *
 * @type {number}
 * @default 0
 */
  this.frameNumber = 0;

/**
 * 如果已发出新帧且帧编号已更新，则为 <code>true</code>。
 *
 * @type {boolean}
 * @default false
 */
  this.newFrame = false;

/**
 * 场景的当前时间。
 *
 * @type {JulianDate}
 * @default undefined
 */
  this.time = undefined;

/**
 * 作业调度器。
 *
 * @type {JobScheduler}
 */
  this.jobScheduler = jobScheduler;

/**
 * 2D和哥伦布视图模式下使用的地图投影。
 *
 * @type {MapProjection}
 * @default undefined
 */
  this.mapProjection = undefined;

/**
 * 当前相机。
 *
 * @type {Camera}
 * @default undefined
 */
  this.camera = undefined;

/**
 * 相机是否在地下。
 *
 * @type {boolean}
 * @default false
 */
  this.cameraUnderground = false;

/**
 * 场景使用的 {@link GlobeTranslucencyState} 对象。
 *
 * @type {GlobeTranslucencyState}
 * @default undefined
 */
  this.globeTranslucencyState = undefined;

/**
 * 剔除体。
 *
 * @type {CullingVolume}
 * @default undefined
 */
  this.cullingVolume = undefined;

/**
 * 当前遮挡物。
 *
 * @type {Occluder}
 * @default undefined
 */
  this.occluder = undefined;

/**
 * 用于驱动细节层次细化的最大屏幕空间误差。值越大性能越好，但视觉质量越低。
 *
 * @type {number}
 * @default 2
 */
  this.maximumScreenSpaceError = undefined;

/**
 * 像素与密度无关像素之间的比率。为特定设备提供适用于真实像素测量的标准单位。
 *
 * @type {number}
 * @default 1.0
 */
  this.pixelRatio = 1.0;

  /**
   * @typedef FrameState.Passes
   * @type {object}
   * @property {boolean} render <code>true</code> 如果该原语应在渲染阶段更新，<code>false</code> 否则。
   * @property {boolean} pick <code>true</code> 如果该原语应在拾取阶段更新，<code>false</code> 否则。
   * @property {boolean} pickVoxel <code>true</code> 如果该原语应在体素拾取阶段更新，<code>false</code> 否则。
   * @property {boolean} snap <code>true</code> 如果当前拾取阶段是一个捕捉阶段（参见 {@link Scene#snap}），<code>false</code> 否则。仅在 <code>pick</code> 也为 <code>true</code> 时才为 <code>true</code>。
   * @property {boolean} depth <code>true</code> 如果该原语应在仅深度阶段更新，<code>false</code> 否则。
   * @property {boolean} postProcess <code>true</code> 如果该原语应在每特性后处理阶段更新，<code>false</code> 否则。
   * @property {boolean} offscreen <code>true</code> 如果该原语应为离屏通道更新，否则为 <code>false</code>。
   */

  /**
   * @type {FrameState.Passes}
   */
  this.passes = {
    /**
     * @default false
     */
    render: false,
    /**
     * @default false
     */
    pick: false,
    /**
     * @default false
     */
    pickVoxel: false,
    /**
     * @default false
     */
    snap: false,
    /**
     * @default false
     */
    depth: false,
    /**
     * @default false
     */
    postProcess: false,
    /**
     * @default false
     */
    offscreen: false,
  };

/**
 * 版权信息显示。
 *
 * @type {CreditDisplay}
 */
  this.creditDisplay = creditDisplay;

/**
 * 在帧结束时调用的函数数组。该数组在每帧之后会被清空。
 * <p>
 * 这允许在 <code>update</code> 函数中排队事件，并在订阅者可以自由更改
 * 场景状态（例如操作相机）时触发它们，而不是直接在 <code>update</code> 函数中触发事件。
 * </p>
 * <p>
 * 如果数组中的任何函数返回 <code>true</code>，则在请求渲染模式下
 * 将渲染另一帧。
 * </p>
 *
 * @type {FrameState.AfterRenderCallback[]}
 *
 * @example
 * frameState.afterRender.push(function() {
 *   // take some action, raise an event, etc.
 * });
 */
  this.afterRender = [];

/**
 * 获取是否仅针对3D进行优化。
 *
 * @type {boolean}
 * @default false
 */
  this.scene3DOnly = false;

  /**
   * @typedef FrameState.Fog
   * @type {object}
   * @property {boolean} enabled 如果启用了雾效果则为 <code>true</code>，否则为 <code>false</code>。这会影响雾的剔除和渲染。
   * @property {boolean} renderable 如果应该渲染雾效果则为 <code>true</code>，否则为 <code>false</code>。此标志应与 fog.enabled 结合检查。
   * @property {number | undefined} density 一个正数，用于根据相机距离混合颜色和雾颜色。
   * @property {number | undefined} visualDensityScalar 一个正数，用于根据密度修改雾的视觉效果强度
   * @property {number | undefined} sse 用于修改部分处于雾中的几何体的屏幕空间误差的标量。
   * @property {number | undefined} minimumBrightness 应用雾效果后地形的最小亮度。
   */

  /**
   * @type {FrameState.Fog}
   */

  this.fog = {
    /**
     * @default false
     */
    enabled: false,
    renderable: false,
    density: undefined,
    visualDensityScalar: undefined,
    sse: undefined,
    minimumBrightness: undefined,
  };

/**
 * 当前大气效果
 * @type {Atmosphere}
 */
  this.atmosphere = undefined;

/**
 * 用于垂直夸大场景的标量
 * @type {number}
 * @default 1.0
 */
  this.verticalExaggeration = 1.0;

/**
 * 场景垂直夸大所相对的高度。
 * @type {number}
 * @default 0.0
 */
  this.verticalExaggerationRelativeHeight = 0.0;

  /**
   * @typedef FrameState.ShadowState
   * @type {object}
   * @property {boolean} shadowsEnabled 当前帧是否存在任何活动阴影贴图。
   * @property {boolean} lightShadowsEnabled 是否存在任何源自光源的活动阴影贴图。不包括用于分析目的的阴影贴图。
   * @property {ShadowMap[]} shadowMaps 当前帧启用的所有阴影贴图。
   * @property {ShadowMap[]} lightShadowMaps 源自光源的阴影贴图。不包括用于分析目的的阴影贴图。仅这些阴影贴图将用于生成接收阴影着色器。
   * @property {number} nearPlane 场景视锥体命令的近平面。用于适配级联阴影贴图。
   * @property {number} farPlane 场景视锥体命令的远平面。用于适配级联阴影贴图。
   * @property {number} closestObjectSize 最接近相机的包围体大小。用于在物体附近放置更多阴影细节。
   * @property {number} lastDirtyTime 阴影贴图最后一次变为脏的时间
   * @property {boolean} outOfView 当前帧阴影贴图是否不在视野内
   */

  /**
   * @type {FrameState.ShadowState}
   */

  this.shadowState = {
    /**
     * @default true
     */
    shadowsEnabled: true,
    shadowMaps: [],
    lightShadowMaps: [],
    /**
     * @default 1.0
     */
    nearPlane: 1.0,
    /**
     * @default 5000.0
     */
    farPlane: 5000.0,
    /**
     * @default 1000.0
     */
    closestObjectSize: 1000.0,
    /**
     * @default 0
     */
    lastDirtyTime: 0,
    /**
     * @default true
     */
    outOfView: true,
  };

/**
 * 在分割器两侧渲染不同内容时使用的分割器位置。
 * 该值应在 0.0 到 1.0 之间，0 表示视口最左侧，1 表示视口最右侧。
 * @type {number}
 * @default 0.0
 */
  this.splitPosition = 0.0;

/**
 * 相机视锥体近平面和远平面的距离
 * @type {number[]}
 * @default []
 */
  this.frustumSplits = [];

/**
 * 当前场景背景颜色
 *
 * @type {Color}
 */
  this.backgroundColor = undefined;

/**
 * 用于场景着色的光源。
 *
 * @type {Light}
 */
  this.light = undefined;

/**
 * 禁用广告牌、标签和点深度测试的相机距离，例如用于防止与地形裁剪。
 * 设置为零时，应始终应用深度测试。小于零时，不应应用深度测试。
 * @type {number}
 */
  this.minimumDisableDepthTestDistance = undefined;

/**
 * 当 <code>false</code> 时，3D Tiles 将正常渲染。当 <code>true</code> 时，已分类的 3D Tile 几何体会正常渲染，
 * 未分类的 3D Tile 几何体会以颜色乘以 {@link FrameState#invertClassificationColor} 的方式渲染。
 * @type {boolean}
 * @default false
 */
  this.invertClassification = false;

/**
 * 当 {@link FrameState#invertClassification} 为 <code>true</code> 时，未分类 3D Tile 几何体的高亮颜色。
 * @type {Color}
 */
  this.invertClassificationColor = undefined;

/**
 * 场景是否使用对数深度缓冲区。
 *
 * @type {boolean}
 * @default false
 */
  this.useLogDepth = false;

/**
 * 用于更新 3D Tileset 的附加状态。
 *
 * @type {Cesium3DTilePassState}
 */
  this.tilesetPassState = undefined;

/**
 * 所有已渲染地形瓦片中的最小地形高度。用于改进椭球体下方但地形上方对象的剔除。
 *
 * @type {number}
 * @default 0.0
 */
  this.minimumTerrainHeight = 0.0;

/**
 * 元数据拾取是否当前正在进行中。
 *
 * 在 `Picking.pickMetadata` 函数中，更新和执行绘制命令之前会将其设置为 `true`，
 * 之后立即设置回 `false`。它将用于确定是否应在 `Scene.executeCommand` 函数中
 * 执行元数据拾取绘制命令。
 *
 * @type {boolean}
 * @default false
 */
  this.pickingMetadata = false;

/**
 * 元数据拾取信息。
 *
 * 这描述了在 `Picking.pickMetadata` 调用中应该被拾取的元数据属性。
 *
 * 这存储在帧状态和元数据拾取绘制命令中。在 `Scene.updateDerivedCommands` 调用中，
 * 将检查帧状态中存储的实例是否与绘制命令中的实例不同，如有必要，
 * 将基于此信息更新元数据拾取的派生命令。
 *
 * @type {PickedMetadataInfo|undefined}
 */
  this.pickedMetadataInfo = undefined;

  /**
   * Internal toggle indicating that at least one primitive for this frame requested
   * edge visibility rendering (EXT_mesh_primitive_edge_visibility). This allows
   * lazy allocation/activation of the edge MRT without storing a Scene reference
   * on the frame state (avoids passing entire Scene through internal APIs).
   * Set by model pipeline stages when they encounter edge visibility data.
   * Consumed by Scene to flip its _enableEdgeVisibility flag.
   * @type {boolean}
   * @private
   */
  this.edgeVisibilityRequested = false;
}

/**
 * 将在帧结束时调用的函数。
 *
 * @callback FrameState.AfterRenderCallback
 * @returns {boolean} 如果在请求渲染模式下应请求另一次渲染则为 true
 */
export default FrameState;
