import {
  BoundingSphere,
  BoundingSphereState,
  Cartesian3,
  CesiumWidget,
  Cesium3DTileFeature,
  Cesium3DTileVectorFeature,
  Clock,
  ConstantPositionProperty,
  Frozen,
  defined,
  destroyObject,
  DeveloperError,
  Entity,
  Event,
  EventHelper,
  getElement,
  JulianDate,
  Math as CesiumMath,
  Property,
  ScreenSpaceEventType,
  IonGeocoderService,
} from "@cesium/engine";
import Animation from "../Animation/Animation.js";
import AnimationViewModel from "../Animation/AnimationViewModel.js";
import BaseLayerPicker from "../BaseLayerPicker/BaseLayerPicker.js";
import createDefaultImageryProviderViewModels from "../BaseLayerPicker/createDefaultImageryProviderViewModels.js";
import createDefaultTerrainProviderViewModels from "../BaseLayerPicker/createDefaultTerrainProviderViewModels.js";
import ClockViewModel from "../ClockViewModel.js";
import FullscreenButton from "../FullscreenButton/FullscreenButton.js";
import Geocoder from "../Geocoder/Geocoder.js";
import HomeButton from "../HomeButton/HomeButton.js";
import InfoBox from "../InfoBox/InfoBox.js";
import NavigationHelpButton from "../NavigationHelpButton/NavigationHelpButton.js";
import ProjectionPicker from "../ProjectionPicker/ProjectionPicker.js";
import SceneModePicker from "../SceneModePicker/SceneModePicker.js";
import SelectionIndicator from "../SelectionIndicator/SelectionIndicator.js";
import subscribeAndEvaluate from "../subscribeAndEvaluate.js";
import Timeline from "../Timeline/Timeline.js";
import VRButton from "../VRButton/VRButton.js";

const boundingSphereScratch = new BoundingSphere();

function onTimelineScrubfunction(e) {
  const clock = e.clock;
  clock.currentTime = e.timeJulian;
  clock.shouldAnimate = false;
}

function getCesium3DTileFeatureDescription(feature) {
  const propertyIds = feature.getPropertyIds();

  let html = "";
  propertyIds.forEach(function (propertyId) {
    const value = feature.getProperty(propertyId);
    if (defined(value)) {
      html += `<tr><th>${propertyId}</th><td>${value}</td></tr>`;
    }
  });

  if (html.length > 0) {
    html = `<table class="cesium-infoBox-defaultTable"><tbody>${html}</tbody></table>`;
  }

  return html;
}

function getCesium3DTileFeatureName(feature) {
  // We need to iterate all property IDs to find potential
  // candidates, but since we prefer some property IDs
  // over others, we store them in an indexed array
  // and then use the first defined element in the array
  // as the preferred choice.

  let i;
  const possibleIds = [];
  const propertyIds = feature.getPropertyIds();
  for (i = 0; i < propertyIds.length; i++) {
    const propertyId = propertyIds[i];
    if (/^name$/i.test(propertyId)) {
      possibleIds[0] = feature.getProperty(propertyId);
    } else if (/name/i.test(propertyId)) {
      possibleIds[1] = feature.getProperty(propertyId);
    } else if (/^title$/i.test(propertyId)) {
      possibleIds[2] = feature.getProperty(propertyId);
    } else if (/^(id|identifier)$/i.test(propertyId)) {
      possibleIds[3] = feature.getProperty(propertyId);
    } else if (/element/i.test(propertyId)) {
      possibleIds[4] = feature.getProperty(propertyId);
    } else if (/(id|identifier)$/i.test(propertyId)) {
      possibleIds[5] = feature.getProperty(propertyId);
    }
  }

  const length = possibleIds.length;
  for (i = 0; i < length; i++) {
    const item = possibleIds[i];
    if (defined(item) && item !== "") {
      return item;
    }
  }
  return "Unnamed Feature";
}

function pickEntity(viewer, e) {
  const picked = viewer.scene.pick(e.position);
  if (defined(picked)) {
    const id = picked.id ?? picked.primitive.id;
    if (id instanceof Entity) {
      return id;
    }

    if (
      picked instanceof Cesium3DTileFeature ||
      picked instanceof Cesium3DTileVectorFeature
    ) {
      return new Entity({
        name: getCesium3DTileFeatureName(picked),
        description: getCesium3DTileFeatureDescription(picked),
        feature: picked,
      });
    }
  }

  // No regular entity picked.  Try picking features from imagery layers.
  if (defined(viewer.scene.globe)) {
    return pickImageryLayerFeature(viewer, e.position);
  }
}

const scratchStopTime = new JulianDate();

function linkTimelineToDataSourceClock(timeline, dataSource) {
  if (defined(dataSource)) {
    const dataSourceClock = dataSource.clock;
    if (defined(dataSourceClock) && defined(timeline)) {
      const startTime = dataSourceClock.startTime;
      let stopTime = dataSourceClock.stopTime;
      // When the start and stop times are equal, set the timeline to the shortest interval
      // starting at the start time. This prevents an invalid timeline configuration.
      if (JulianDate.equals(startTime, stopTime)) {
        stopTime = JulianDate.addSeconds(
          startTime,
          CesiumMath.EPSILON2,
          scratchStopTime,
        );
      }
      timeline.updateFromClock();
      timeline.zoomTo(startTime, stopTime);
    }
  }
}

const cartesian3Scratch = new Cartesian3();

function pickImageryLayerFeature(viewer, windowPosition) {
  const scene = viewer.scene;
  const pickRay = scene.camera.getPickRay(windowPosition);
  const imageryLayerFeaturePromise =
    scene.imageryLayers.pickImageryLayerFeatures(pickRay, scene);
  if (!defined(imageryLayerFeaturePromise)) {
    return;
  }

  // Imagery layer feature picking is asynchronous, so put up a message while loading.
  const loadingMessage = new Entity({
    id: "Loading...",
    description: "Loading feature information...",
  });

  imageryLayerFeaturePromise.then(
    function (features) {
      // Has this async pick been superseded by a later one?
      if (viewer.selectedEntity !== loadingMessage) {
        return;
      }

      if (!defined(features) || features.length === 0) {
        viewer.selectedEntity = createNoFeaturesEntity();
        return;
      }

      // Select the first feature.
      const feature = features[0];

      const entity = new Entity({
        id: feature.name,
        description: feature.description,
      });

      if (defined(feature.position)) {
        const ecfPosition = viewer.scene.ellipsoid.cartographicToCartesian(
          feature.position,
          cartesian3Scratch,
        );
        entity.position = new ConstantPositionProperty(ecfPosition);
      }

      viewer.selectedEntity = entity;
    },
    function () {
      // Has this async pick been superseded by a later one?
      if (viewer.selectedEntity !== loadingMessage) {
        return;
      }
      viewer.selectedEntity = createNoFeaturesEntity();
    },
  );

  return loadingMessage;
}

function createNoFeaturesEntity() {
  return new Entity({
    id: "None",
    description: "No features found.",
  });
}

function enableVRUI(viewer, enabled) {
  const geocoder = viewer._geocoder;
  const homeButton = viewer._homeButton;
  const sceneModePicker = viewer._sceneModePicker;
  const projectionPicker = viewer._projectionPicker;
  const baseLayerPicker = viewer._baseLayerPicker;
  const animation = viewer._animation;
  const timeline = viewer._timeline;
  const fullscreenButton = viewer._fullscreenButton;
  const infoBox = viewer._infoBox;
  const selectionIndicator = viewer._selectionIndicator;

  const visibility = enabled ? "hidden" : "visible";

  if (defined(geocoder)) {
    geocoder.container.style.visibility = visibility;
  }
  if (defined(homeButton)) {
    homeButton.container.style.visibility = visibility;
  }
  if (defined(sceneModePicker)) {
    sceneModePicker.container.style.visibility = visibility;
  }
  if (defined(projectionPicker)) {
    projectionPicker.container.style.visibility = visibility;
  }
  if (defined(baseLayerPicker)) {
    baseLayerPicker.container.style.visibility = visibility;
  }
  if (defined(animation)) {
    animation.container.style.visibility = visibility;
  }
  if (defined(timeline)) {
    timeline.container.style.visibility = visibility;
  }
  if (
    defined(fullscreenButton) &&
    fullscreenButton.viewModel.isFullscreenEnabled
  ) {
    fullscreenButton.container.style.visibility = visibility;
  }
  if (defined(infoBox)) {
    infoBox.container.style.visibility = visibility;
  }
  if (defined(selectionIndicator)) {
    selectionIndicator.container.style.visibility = visibility;
  }

  if (viewer._container) {
    const right =
      enabled || !defined(fullscreenButton)
        ? 0
        : fullscreenButton.container.clientWidth;
    viewer._vrButton.container.style.right = `${right}px`;

    viewer.forceResize();
  }
}

/**
 * @typedef {object} Viewer.ConstructorOptions
 *
 * Viewer 构造函数的初始化选项
 *
 * @property {boolean} [animation=true] 如果设置为 false，将不会创建 Animation 控件。
 * @property {boolean} [baseLayerPicker=true] 如果设置为 false，将不会创建 BaseLayerPicker 控件。
 * @property {boolean} [fullscreenButton=true] 如果设置为 false，将不会创建 FullscreenButton 控件。
 * @property {boolean} [vrButton=false] 如果设置为 true，将创建 VRButton 控件。
 * @property {boolean|IonGeocodeProviderType|GeocoderService[]} [geocoder=IonGeocodeProviderType.DEFAULT] 搜索 Geocoder 控件时使用的地理编码服务。如果设置为 false，将不会创建 Geocoder 控件。
 * @property {boolean} [homeButton=true] 如果设置为 false，将不会创建 HomeButton 控件。
 * @property {boolean} [infoBox=true] 如果设置为 false，将不会创建 InfoBox 控件。
 * @property {boolean} [sceneModePicker=true] 如果设置为 false，将不会创建 SceneModePicker 控件。
 * @property {boolean} [selectionIndicator=true] 如果设置为 false，将不会创建 SelectionIndicator 控件。
 * @property {boolean} [timeline=true] 如果设置为 false，将不会创建 Timeline 控件。
 * @property {boolean} [navigationHelpButton=true] 如果设置为 false，将不会创建导航帮助按钮。
 * @property {boolean} [navigationInstructionsInitiallyVisible=true] 如果为 true，导航说明初始可见；如果为 false，则在用户显式单击按钮之前不会显示。
 * @property {boolean} [scene3DOnly=false] 当为 <code>true</code> 时，每个几何实例将仅在 3D 中渲染以节省 GPU 内存。
 * @property {boolean} [shouldAnimate=false] 如果为 <code>true</code>，时钟默认会尝试推进模拟时间，否则为 <code>false</code>。此选项优先于设置 {@link Viewer#clockViewModel}。
 * @property {ClockViewModel} [clockViewModel=new ClockViewModel(clock)] 用于控制当前时间的时钟视图模型。
 * @property {ProviderViewModel} [selectedImageryProviderViewModel] 当前基础影像图层的视图模型，如果未提供则使用第一个可用的基础图层。此值仅在 `baseLayerPicker` 设置为 true 时有效。
 * @property {ProviderViewModel[]} [imageryProviderViewModels=createDefaultImageryProviderViewModels()] 可在 BaseLayerPicker 中选择的 ProviderViewModel 数组。此值仅在 `baseLayerPicker` 设置为 true 时有效。
 * @property {ProviderViewModel} [selectedTerrainProviderViewModel] 当前基础地形图层的视图模型，如果未提供则使用第一个可用的基础图层。此值仅在 `baseLayerPicker` 设置为 true 时有效。
 * @property {ProviderViewModel[]} [terrainProviderViewModels=createDefaultTerrainProviderViewModels()] 可在 BaseLayerPicker 中选择的 ProviderViewModel 数组。此值仅在 `baseLayerPicker` 设置为 true 时有效。
 * @property {ImageryLayer|false} [baseLayer=ImageryLayer.fromWorldImagery()] 应用于 globe 的最底层影像图层。如果设置为 <code>false</code>，则不会添加影像提供器。此值仅在 `baseLayerPicker` 设置为 false 时有效。当 `globe` 设置为 false 时不能使用。
 * @property {Ellipsoid} [ellipsoid = Ellipsoid.default] 默认椭球体。
 * @property {TerrainProvider} [terrainProvider=new EllipsoidTerrainProvider()] 要使用的地形提供器。
 * @property {Terrain} [terrain] 处理异步地形提供器的地形对象。仅在 options.terrainProvider 未定义时可以指定。
 * @property {SkyBox|false} [skyBox] 用于渲染星空的天穹。当 <code>undefined</code> 且使用 WGS84 椭球体时，使用默认星空。如果设置为 <code>false</code>，则不会添加天穹、太阳或月亮。
 * @property {SkyAtmosphere|false} [skyAtmosphere] 蓝天和地球边缘的光晕。使用 WGS84 椭球体时启用。设置为 <code>false</code> 可关闭。
 * @property {Element|string} [fullscreenElement=document.body] 按下全屏按钮时进入全屏模式的元素或 id。
 * @property {boolean} [useDefaultRenderLoop=true] 如果为 true，此控件将控制渲染循环，否则为 false。
 * @property {number} [targetFrameRate] 使用默认渲染循环时的目标帧率。
 * @property {boolean} [showRenderLoopErrors=true] 如果为 true，此控件将在发生渲染循环错误时自动向用户显示包含错误的 HTML 面板。
 * @property {boolean} [useBrowserRecommendedResolution=true] 如果为 true，使用浏览器推荐的分辨率并忽略 <code>window.devicePixelRatio</code>。
 * @property {boolean} [automaticallyTrackDataSourceClocks=true] 如果为 true，此控件将自动跟踪新添加的 DataSources 的时钟设置，在 DataSource 的时钟更改时更新。如果要独立配置时钟，请将其设置为 false。
 * @property {ContextOptions} [contextOptions] 传递给 {@link Scene} 的上下文和 WebGL 创建属性。
 * @property {SceneMode} [sceneMode=SceneMode.SCENE3D] 初始场景模式。
 * @property {MapProjection} [mapProjection=new GeographicProjection(options.ellipsoid)] 在 2D 和哥伦布视图模式下使用的地图投影。
 * @property {Globe|false} [globe=new Globe(options.ellipsoid)] 场景中使用的 globe。如果设置为 <code>false</code>，则不会添加 globe，且默认隐藏大气层。
 * @property {boolean} [orderIndependentTranslucency=true] 如果为 true 且配置支持，使用顺序无关的半透明。
 * @property {Element|string} [creditContainer] 包含 {@link CreditDisplay} 的 DOM 元素或 id。如果未指定，则添加到控件本身的底部。
 * @property {Element|string} [creditViewport] 包含 {@link CreditDisplay} 创建的信用弹出窗口的 DOM 元素或 id。如果未指定，它将出现在控件本身上方。
 * @property {DataSourceCollection} [dataSources=new DataSourceCollection()] 控件可视化的数据源集合。如果提供了此参数，则假定该实例由调用者拥有，且在销毁 viewer 时不会被销毁。
 * @property {boolean} [shadows=false] 确定光源是否投射阴影。
 * @property {ShadowMode} [terrainShadows=ShadowMode.RECEIVE_ONLY] 确定地形是否从光源投射或接收阴影。
 * @property {MapMode2D} [mapMode2D=MapMode2D.INFINITE_SCROLL] 确定 2D 地图是否可旋转或是否可在水平方向无限滚动。
 * @property {boolean} [projectionPicker=false] 如果设置为 true，将创建 ProjectionPicker 控件。
 * @property {boolean} [blurActiveElementOnCanvasFocus=true] 如果为 true，单击 viewer 画布时活动元素将失焦。将此设置为 false 适用于单击画布仅用于获取位置或实体数据而不意味着将画布设置为活动元素的情况。
 * @property {boolean} [requestRenderMode=false] 如果为 true，仅在场景变化需要时渲染帧。启用可减少应用程序的 CPU/GPU 使用率并节省移动设备电量，但在此模式下需要使用 {@link Scene#requestRender} 显式渲染新帧。这在 API 其他部分修改场景后通常是必要的。参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}。
 * @property {number} [maximumRenderTimeChange=0.0] 如果 requestRenderMode 为 true，此值定义触发渲染请求的最大模拟时间变化。参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}。
 * @property {number} [depthPlaneEllipsoidOffset=0.0] 调整 DepthPlane 以解决椭球零高程以下的渲染问题。
 * @property {number} [msaaSamples=4] 如果提供，此值控制多采样抗锯齿的速率。典型的多采样率为每像素 2、4，有时为 8 个样本。较高的 MSAA 采样率可能影响性能以换取改进的视觉质量。此值仅适用于支持多采样渲染目标的 WebGL2 上下文。设置为 1 禁用 MSAA。
 */

/**
 * 用于构建应用程序的基础控件。它将所有标准 Cesium 控件组合成一个可重用的包。
 * 该控件始终可以通过使用 mixin 进行扩展，mixin 为各种应用程序添加有用的功能。
 *
 * @alias Viewer
 * @constructor
 *
 * @param {Element|string} container 包含此控件的 DOM 元素或 id。
 * @param {Viewer.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @exception {DeveloperError} 文档中不存在 id 为 "container" 的元素。
 * @exception {DeveloperError} 不使用 BaseLayerPicker 控件时，options.selectedImageryProviderViewModel 不可用，请改为指定 options.baseLayer。
 * @exception {DeveloperError} 不使用 BaseLayerPicker 控件时，options.selectedTerrainProviderViewModel 不可用，请改为指定 options.terrainProvider。
 *
 * @see Animation
 * @see BaseLayerPicker
 * @see CesiumWidget
 * @see FullscreenButton
 * @see HomeButton
 * @see SceneModePicker
 * @see Timeline
 * @see viewerDragDropMixin
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=hello-world|Cesium Sandcastle Hello World Demo}
 *
 * @example
 * // 使用多个自定义选项和 mixin 初始化 viewer 控件。
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     // 在哥伦布视图中启动
 *     sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
 *     // 使用 Cesium World Terrain
 *     terrain: Cesium.Terrain.fromWorldTerrain(),
 *     // 隐藏基础图层选择器
 *     baseLayerPicker: false,
 *     // 使用 OpenStreetMaps
 *     baseLayer: new Cesium.ImageryLayer(new Cesium.OpenStreetMapImageryProvider({
 *       url: "https://tile.openstreetmap.org/"
 *     })),
 *     skyBox: new Cesium.SkyBox({
 *       sources: {
 *         positiveX: "stars/TychoSkymapII.t3_08192x04096_80_px.jpg",
 *         negativeX: "stars/TychoSkymapII.t3_08192x04096_80_mx.jpg",
 *         positiveY: "stars/TychoSkymapII.t3_08192x04096_80_py.jpg",
 *         negativeY: "stars/TychoSkymapII.t3_08192x04096_80_my.jpg",
 *         positiveZ: "stars/TychoSkymapII.t3_08192x04096_80_pz.jpg",
 *         negativeZ: "stars/TychoSkymapII.t3_08192x04096_80_mz.jpg"
 *       }
 *     }),
 *     // 使用 Web Mercator 投影显示哥伦布视图地图
 *     mapProjection: new Cesium.WebMercatorProjection()
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * // 添加基本的拖放功能
 * viewer.extend(Cesium.viewerDragDropMixin);
 *
 * // 处理拖放文件时如果遇到错误显示弹出警告
 * viewer.dropError.addEventListener(function(dropHandler, name, error) {
 *   console.log(error);
 *   window.alert(error);
 * });
 */
function Viewer(container, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (
    options.globe === false &&
    defined(options.baseLayer) &&
    options.baseLayer !== false
  ) {
    throw new DeveloperError("Cannot use baseLayer when globe is disabled.");
  }
  //>>includeEnd('debug');

  const createBaseLayerPicker =
    (!defined(options.globe) || options.globe !== false) &&
    (!defined(options.baseLayerPicker) || options.baseLayerPicker !== false);

  //>>includeStart('debug', pragmas.debug);
  // If not using BaseLayerPicker, selectedImageryProviderViewModel is an invalid option
  if (
    !createBaseLayerPicker &&
    defined(options.selectedImageryProviderViewModel)
  ) {
    throw new DeveloperError(
      "options.selectedImageryProviderViewModel is not available when not using the BaseLayerPicker widget. \
Either specify options.baseLayer instead or set options.baseLayerPicker to true.",
    );
  }

  // If not using BaseLayerPicker, selectedTerrainProviderViewModel is an invalid option
  if (
    !createBaseLayerPicker &&
    defined(options.selectedTerrainProviderViewModel)
  ) {
    throw new DeveloperError(
      "options.selectedTerrainProviderViewModel is not available when not using the BaseLayerPicker widget. \
Either specify options.terrainProvider instead or set options.baseLayerPicker to true.",
    );
  }
  //>>includeEnd('debug');

  const that = this;

  const viewerContainer = document.createElement("div");
  viewerContainer.className = "cesium-viewer";
  container.appendChild(viewerContainer);

  // Cesium widget container
  const cesiumWidgetContainer = document.createElement("div");
  cesiumWidgetContainer.className = "cesium-viewer-cesiumWidgetContainer";
  viewerContainer.appendChild(cesiumWidgetContainer);

  // Bottom container
  const bottomContainer = document.createElement("div");
  bottomContainer.className = "cesium-viewer-bottom";

  viewerContainer.appendChild(bottomContainer);

  const scene3DOnly = options.scene3DOnly ?? false;

  let clock;
  let clockViewModel;
  let destroyClockViewModel = false;
  if (defined(options.clockViewModel)) {
    clockViewModel = options.clockViewModel;
    clock = clockViewModel.clock;
  } else {
    clock = new Clock();
    clockViewModel = new ClockViewModel(clock);
    destroyClockViewModel = true;
  }

  // Cesium widget
  const cesiumWidget = new CesiumWidget(cesiumWidgetContainer, {
    baseLayer:
      (createBaseLayerPicker &&
        defined(options.selectedImageryProviderViewModel)) ||
      defined(options.baseLayer) ||
      defined(options.imageryProvider)
        ? false
        : undefined,
    clock: clock,
    shouldAnimate: options.shouldAnimate,
    skyBox: options.skyBox,
    skyAtmosphere: options.skyAtmosphere,
    sceneMode: options.sceneMode,
    ellipsoid: options.ellipsoid,
    mapProjection: options.mapProjection,
    globe: options.globe,
    orderIndependentTranslucency: options.orderIndependentTranslucency,
    automaticallyTrackDataSourceClocks:
      options.automaticallyTrackDataSourceClocks,
    contextOptions: options.contextOptions,
    useDefaultRenderLoop: options.useDefaultRenderLoop,
    targetFrameRate: options.targetFrameRate,
    showRenderLoopErrors: options.showRenderLoopErrors,
    useBrowserRecommendedResolution: options.useBrowserRecommendedResolution,
    creditContainer: defined(options.creditContainer)
      ? options.creditContainer
      : bottomContainer,
    creditViewport: options.creditViewport,
    dataSources: options.dataSources,
    scene3DOnly: scene3DOnly,
    shadows: options.shadows,
    terrainShadows: options.terrainShadows,
    mapMode2D: options.mapMode2D,
    blurActiveElementOnCanvasFocus: options.blurActiveElementOnCanvasFocus,
    requestRenderMode: options.requestRenderMode,
    maximumRenderTimeChange: options.maximumRenderTimeChange,
    depthPlaneEllipsoidOffset: options.depthPlaneEllipsoidOffset,
    msaaSamples: options.msaaSamples,
  });

  const scene = cesiumWidget.scene;

  const eventHelper = new EventHelper();

  eventHelper.add(clock.onTick, Viewer.prototype._onTick, this);

  // Selection Indicator
  let selectionIndicator;
  if (
    !defined(options.selectionIndicator) ||
    options.selectionIndicator !== false
  ) {
    const selectionIndicatorContainer = document.createElement("div");
    selectionIndicatorContainer.className =
      "cesium-viewer-selectionIndicatorContainer";
    viewerContainer.appendChild(selectionIndicatorContainer);
    selectionIndicator = new SelectionIndicator(
      selectionIndicatorContainer,
      scene,
    );
  }

  // Info Box
  let infoBox;
  if (!defined(options.infoBox) || options.infoBox !== false) {
    const infoBoxContainer = document.createElement("div");
    infoBoxContainer.className = "cesium-viewer-infoBoxContainer";
    viewerContainer.appendChild(infoBoxContainer);
    infoBox = new InfoBox(infoBoxContainer);

    const infoBoxViewModel = infoBox.viewModel;
    eventHelper.add(
      infoBoxViewModel.cameraClicked,
      Viewer.prototype._onInfoBoxCameraClicked,
      this,
    );
    eventHelper.add(
      infoBoxViewModel.closeClicked,
      Viewer.prototype._onInfoBoxClockClicked,
      this,
    );
  }

  // Main Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "cesium-viewer-toolbar";
  viewerContainer.appendChild(toolbar);

  // Geocoder
  let geocoder;
  if (!defined(options.geocoder) || options.geocoder !== false) {
    const geocoderContainer = document.createElement("div");
    geocoderContainer.className = "cesium-viewer-geocoderContainer";
    toolbar.appendChild(geocoderContainer);
    let geocoderService;
    if (typeof options.geocoder === "string") {
      geocoderService = [
        new IonGeocoderService({
          scene,
          geocodeProviderType: options.geocoder,
        }),
      ];
    } else if (
      defined(options.geocoder) &&
      typeof options.geocoder !== "boolean"
    ) {
      geocoderService = Array.isArray(options.geocoder)
        ? options.geocoder
        : [options.geocoder];
    }
    geocoder = new Geocoder({
      container: geocoderContainer,
      geocoderServices: geocoderService,
      scene: scene,
    });
    // Subscribe to search so that we can clear the trackedEntity when it is clicked.
    eventHelper.add(
      geocoder.viewModel.search.beforeExecute,
      Viewer.prototype._clearObjects,
      this,
    );
  }

  // HomeButton
  let homeButton;
  if (!defined(options.homeButton) || options.homeButton !== false) {
    homeButton = new HomeButton(toolbar, scene);
    if (defined(geocoder)) {
      eventHelper.add(homeButton.viewModel.command.afterExecute, function () {
        const viewModel = geocoder.viewModel;
        viewModel.searchText = "";
        if (viewModel.isSearchInProgress) {
          viewModel.search();
        }
      });
    }
    // Subscribe to the home button beforeExecute event so that we can clear the trackedEntity.
    eventHelper.add(
      homeButton.viewModel.command.beforeExecute,
      Viewer.prototype._clearTrackedObject,
      this,
    );
  }

  // SceneModePicker
  // By default, we silently disable the scene mode picker if scene3DOnly is true,
  // but if sceneModePicker is explicitly set to true, throw an error.
  //>>includeStart('debug', pragmas.debug);
  if (options.sceneModePicker === true && scene3DOnly) {
    throw new DeveloperError(
      "options.sceneModePicker is not available when options.scene3DOnly is set to true.",
    );
  }
  //>>includeEnd('debug');

  let sceneModePicker;
  if (
    !scene3DOnly &&
    (!defined(options.sceneModePicker) || options.sceneModePicker !== false)
  ) {
    sceneModePicker = new SceneModePicker(toolbar, scene);
  }

  let projectionPicker;
  if (options.projectionPicker) {
    projectionPicker = new ProjectionPicker(toolbar, scene);
  }

  // BaseLayerPicker
  let baseLayerPicker;
  let baseLayerPickerDropDown;
  if (createBaseLayerPicker) {
    const imageryProviderViewModels =
      options.imageryProviderViewModels ??
      createDefaultImageryProviderViewModels();
    const terrainProviderViewModels =
      options.terrainProviderViewModels ??
      createDefaultTerrainProviderViewModels();

    baseLayerPicker = new BaseLayerPicker(toolbar, {
      globe: scene.globe,
      imageryProviderViewModels: imageryProviderViewModels,
      selectedImageryProviderViewModel:
        options.selectedImageryProviderViewModel,
      terrainProviderViewModels: terrainProviderViewModels,
      selectedTerrainProviderViewModel:
        options.selectedTerrainProviderViewModel,
    });

    //Grab the dropdown for resize code.
    const elements = toolbar.getElementsByClassName(
      "cesium-baseLayerPicker-dropDown",
    );
    baseLayerPickerDropDown = elements[0];
  }

  // These need to be set after the BaseLayerPicker is created in order to take effect
  if (defined(options.baseLayer) && options.baseLayer !== false) {
    if (createBaseLayerPicker) {
      baseLayerPicker.viewModel.selectedImagery = undefined;
    }
    scene.imageryLayers.removeAll();
    scene.imageryLayers.add(options.baseLayer);
  }

  if (defined(options.terrainProvider)) {
    if (createBaseLayerPicker) {
      baseLayerPicker.viewModel.selectedTerrain = undefined;
    }
    scene.terrainProvider = options.terrainProvider;
  }

  if (defined(options.terrain)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(options.terrainProvider)) {
      throw new DeveloperError(
        "Specify either options.terrainProvider or options.terrain.",
      );
    }
    //>>includeEnd('debug');

    if (createBaseLayerPicker) {
      // Required as this is otherwise set by the baseLayerPicker
      scene.globe.depthTestAgainstTerrain = true;
    }

    scene.setTerrain(options.terrain);
  }

  // Navigation Help Button
  let navigationHelpButton;
  if (
    !defined(options.navigationHelpButton) ||
    options.navigationHelpButton !== false
  ) {
    let showNavHelp = true;
    try {
      //window.localStorage is null if disabled in Firefox or undefined in browsers with implementation
      if (defined(window.localStorage)) {
        const hasSeenNavHelp = window.localStorage.getItem(
          "cesium-hasSeenNavHelp",
        );
        if (defined(hasSeenNavHelp) && Boolean(hasSeenNavHelp)) {
          showNavHelp = false;
        } else {
          window.localStorage.setItem("cesium-hasSeenNavHelp", "true");
        }
      }
    } catch (e) {
      //Accessing window.localStorage throws if disabled in Chrome
      //window.localStorage.setItem throws if in Safari private browsing mode or in any browser if we are over quota.
    }
    navigationHelpButton = new NavigationHelpButton({
      container: toolbar,
      instructionsInitiallyVisible:
        options.navigationInstructionsInitiallyVisible ?? showNavHelp,
    });
  }

  // Animation
  let animation;
  if (!defined(options.animation) || options.animation !== false) {
    const animationContainer = document.createElement("div");
    animationContainer.className = "cesium-viewer-animationContainer";
    viewerContainer.appendChild(animationContainer);
    animation = new Animation(
      animationContainer,
      new AnimationViewModel(clockViewModel),
    );
  }

  // Timeline
  let timeline;
  if (!defined(options.timeline) || options.timeline !== false) {
    const timelineContainer = document.createElement("div");
    timelineContainer.className = "cesium-viewer-timelineContainer";
    viewerContainer.appendChild(timelineContainer);
    timeline = new Timeline(timelineContainer, clock);
    timeline.addEventListener("settime", onTimelineScrubfunction, false);
    timeline.zoomTo(clock.startTime, clock.stopTime);
  }

  // Fullscreen
  let fullscreenButton;
  let fullscreenSubscription;
  let fullscreenContainer;
  if (
    !defined(options.fullscreenButton) ||
    options.fullscreenButton !== false
  ) {
    fullscreenContainer = document.createElement("div");
    fullscreenContainer.className = "cesium-viewer-fullscreenContainer";
    viewerContainer.appendChild(fullscreenContainer);
    fullscreenButton = new FullscreenButton(
      fullscreenContainer,
      options.fullscreenElement,
    );

    //Subscribe to fullscreenButton.viewModel.isFullscreenEnabled so
    //that we can hide/show the button as well as size the timeline.
    fullscreenSubscription = subscribeAndEvaluate(
      fullscreenButton.viewModel,
      "isFullscreenEnabled",
      function (isFullscreenEnabled) {
        fullscreenContainer.style.display = isFullscreenEnabled
          ? "block"
          : "none";
        if (defined(timeline)) {
          timeline.container.style.right = `${fullscreenContainer.clientWidth}px`;
          timeline.resize();
        }
      },
    );
  }

  // VR
  let vrButton;
  let vrSubscription;
  let vrModeSubscription;
  if (options.vrButton) {
    const vrContainer = document.createElement("div");
    vrContainer.className = "cesium-viewer-vrContainer";
    viewerContainer.appendChild(vrContainer);
    vrButton = new VRButton(vrContainer, scene, options.fullScreenElement);

    vrSubscription = subscribeAndEvaluate(
      vrButton.viewModel,
      "isVREnabled",
      function (isVREnabled) {
        vrContainer.style.display = isVREnabled ? "block" : "none";
        if (defined(fullscreenButton)) {
          vrContainer.style.right = `${fullscreenContainer.clientWidth}px`;
        }
        if (defined(timeline)) {
          timeline.container.style.right = `${vrContainer.clientWidth}px`;
          timeline.resize();
        }
      },
    );

    vrModeSubscription = subscribeAndEvaluate(
      vrButton.viewModel,
      "isVRMode",
      function (isVRMode) {
        enableVRUI(that, isVRMode);
      },
    );
  }

  //Assign all properties to this instance.  No "this" assignments should
  //take place above this line.
  this._baseLayerPickerDropDown = baseLayerPickerDropDown;
  this._fullscreenSubscription = fullscreenSubscription;
  this._vrSubscription = vrSubscription;
  this._vrModeSubscription = vrModeSubscription;
  this._dataSourceChangedListeners = {};
  this._container = container;
  this._bottomContainer = bottomContainer;
  this._element = viewerContainer;
  this._cesiumWidget = cesiumWidget;
  this._selectionIndicator = selectionIndicator;
  this._infoBox = infoBox;
  this._clockViewModel = clockViewModel;
  this._destroyClockViewModel = destroyClockViewModel;
  this._toolbar = toolbar;
  this._homeButton = homeButton;
  this._sceneModePicker = sceneModePicker;
  this._projectionPicker = projectionPicker;
  this._baseLayerPicker = baseLayerPicker;
  this._navigationHelpButton = navigationHelpButton;
  this._animation = animation;
  this._timeline = timeline;
  this._fullscreenButton = fullscreenButton;
  this._vrButton = vrButton;
  this._geocoder = geocoder;
  this._eventHelper = eventHelper;
  this._lastWidth = 0;
  this._lastHeight = 0;
  this._enableInfoOrSelection = defined(infoBox) || defined(selectionIndicator);
  this._selectedEntity = undefined;
  this._selectedEntityChanged = new Event();

  const dataSourceCollection = this._cesiumWidget.dataSources;
  const dataSourceDisplay = this._cesiumWidget.dataSourceDisplay;

  //Listen to data source events in order to track clock changes.
  eventHelper.add(
    dataSourceCollection.dataSourceAdded,
    Viewer.prototype._onDataSourceAdded,
    this,
  );
  eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    Viewer.prototype._onDataSourceRemoved,
    this,
  );

  // Prior to each render, check if anything needs to be resized.
  eventHelper.add(scene.postUpdate, Viewer.prototype.resize, this);

  // We need to subscribe to the data sources and collections so that we can clear the
  // tracked object when it is removed from the scene.
  // Subscribe to current data sources
  const dataSourceLength = dataSourceCollection.length;
  for (let i = 0; i < dataSourceLength; i++) {
    this._dataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
  }
  this._dataSourceAdded(undefined, dataSourceDisplay.defaultDataSource);

  // Hook up events so that we can subscribe to future sources.
  eventHelper.add(
    dataSourceCollection.dataSourceAdded,
    Viewer.prototype._dataSourceAdded,
    this,
  );
  eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    Viewer.prototype._dataSourceRemoved,
    this,
  );

  // Subscribe to left clicks and zoom to the picked object.
  function pickAndTrackObject(e) {
    const entity = pickEntity(that, e);
    if (defined(entity)) {
      //Only track the entity if it has a valid position at the current time.
      if (
        Property.getValueOrUndefined(entity.position, that.clock.currentTime)
      ) {
        that.trackedEntity = entity;
      } else {
        that.zoomTo(entity);
      }
    } else if (defined(that.trackedEntity)) {
      that.trackedEntity = undefined;
    }
  }

  function pickAndSelectObject(e) {
    that.selectedEntity = pickEntity(that, e);
  }

  cesiumWidget.screenSpaceEventHandler.setInputAction(
    pickAndSelectObject,
    ScreenSpaceEventType.LEFT_CLICK,
  );
  cesiumWidget.screenSpaceEventHandler.setInputAction(
    pickAndTrackObject,
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  // This allows to update the Viewer's _clockViewModel instead of the CesiumWidget's _clock
  // when CesiumWidget is created from the Viewer.
  cesiumWidget._canAnimateUpdateCallback = this._updateCanAnimate(this);
}

Object.defineProperties(Viewer.prototype, {
  /**
   * 获取父容器。
   * @memberof Viewer.prototype
   * @type {Element}
   * @readonly
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 管理要在屏幕和灯箱中显示的信用列表。
   * @memberof Viewer.prototype
   *
   * @type {CreditDisplay}
   */
  creditDisplay: {
    get: function () {
      return this._cesiumWidget.creditDisplay;
    },
  },

  /**
   * 获取窗口底部区域的 DOM 元素，包含
   * {@link CreditDisplay} 和可能的其他内容。
   * @memberof Viewer.prototype
   * @type {Element}
   * @readonly
   */
  bottomContainer: {
    get: function () {
      return this._bottomContainer;
    },
  },

  /**
   * 获取 CesiumWidget。
   * @memberof Viewer.prototype
   * @type {CesiumWidget}
   * @readonly
   */
  cesiumWidget: {
    get: function () {
      return this._cesiumWidget;
    },
  },

  /**
   * 获取选择指示器。
   * @memberof Viewer.prototype
   * @type {SelectionIndicator}
   * @readonly
   */
  selectionIndicator: {
    get: function () {
      return this._selectionIndicator;
    },
  },

  /**
   * 获取信息框。
   * @memberof Viewer.prototype
   * @type {InfoBox}
   * @readonly
   */
  infoBox: {
    get: function () {
      return this._infoBox;
    },
  },

  /**
   * 获取 Geocoder。
   * @memberof Viewer.prototype
   * @type {Geocoder}
   * @readonly
   */
  geocoder: {
    get: function () {
      return this._geocoder;
    },
  },

  /**
   * 获取 HomeButton。
   * @memberof Viewer.prototype
   * @type {HomeButton}
   * @readonly
   */
  homeButton: {
    get: function () {
      return this._homeButton;
    },
  },

  /**
   * 获取 SceneModePicker。
   * @memberof Viewer.prototype
   * @type {SceneModePicker}
   * @readonly
   */
  sceneModePicker: {
    get: function () {
      return this._sceneModePicker;
    },
  },

  /**
   * 获取 ProjectionPicker。
   * @memberof Viewer.prototype
   * @type {ProjectionPicker}
   * @readonly
   */
  projectionPicker: {
    get: function () {
      return this._projectionPicker;
    },
  },

  /**
   * 获取 BaseLayerPicker。
   * @memberof Viewer.prototype
   * @type {BaseLayerPicker}
   * @readonly
   */
  baseLayerPicker: {
    get: function () {
      return this._baseLayerPicker;
    },
  },

  /**
   * 获取 NavigationHelpButton。
   * @memberof Viewer.prototype
   * @type {NavigationHelpButton}
   * @readonly
   */
  navigationHelpButton: {
    get: function () {
      return this._navigationHelpButton;
    },
  },

  /**
   * 获取 Animation 控件。
   * @memberof Viewer.prototype
   * @type {Animation}
   * @readonly
   */
  animation: {
    get: function () {
      return this._animation;
    },
  },

  /**
   * 获取 Timeline 控件。
   * @memberof Viewer.prototype
   * @type {Timeline}
   * @readonly
   */
  timeline: {
    get: function () {
      return this._timeline;
    },
  },

  /**
   * 获取 FullscreenButton。
   * @memberof Viewer.prototype
   * @type {FullscreenButton}
   * @readonly
   */
  fullscreenButton: {
    get: function () {
      return this._fullscreenButton;
    },
  },

  /**
   * 获取 VRButton。
   * @memberof Viewer.prototype
   * @type {VRButton}
   * @readonly
   */
  vrButton: {
    get: function () {
      return this._vrButton;
    },
  },

  /**
   * 获取用于可视化 {@link DataSource} 的显示。
   * @memberof Viewer.prototype
   * @type {DataSourceDisplay}
   * @readonly
   */
  dataSourceDisplay: {
    get: function () {
      return this._cesiumWidget.dataSourceDisplay;
    },
  },

  /**
   * 获取不绑定到特定数据源的实体集合。
   * 这是 [dataSourceDisplay.defaultDataSource.entities]{@link Viewer#dataSourceDisplay} 的快捷方式。
   * @memberof Viewer.prototype
   * @type {EntityCollection}
   * @readonly
   */
  entities: {
    get: function () {
      return this._cesiumWidget.entities;
    },
  },

  /**
   * 获取要可视化的 {@link DataSource} 实例集合。
   * @memberof Viewer.prototype
   * @type {DataSourceCollection}
   * @readonly
   */
  dataSources: {
    get: function () {
      return this._cesiumWidget.dataSources;
    },
  },

  /**
   * 获取画布。
   * @memberof Viewer.prototype
   * @type {HTMLCanvasElement}
   * @readonly
   */
  canvas: {
    get: function () {
      return this._cesiumWidget.canvas;
    },
  },

  /**
   * 获取场景。
   * @memberof Viewer.prototype
   * @type {Scene}
   * @readonly
   */
  scene: {
    get: function () {
      return this._cesiumWidget.scene;
    },
  },

  /**
   * 确定光源是否投射阴影。
   * @memberof Viewer.prototype
   * @type {boolean}
   */
  shadows: {
    get: function () {
      return this.scene.shadowMap.enabled;
    },
    set: function (value) {
      this.scene.shadowMap.enabled = value;
    },
  },

  /**
   * 确定地形是否投射或接收来自光源的阴影。
   * @memberof Viewer.prototype
   * @type {ShadowMode}
   */
  terrainShadows: {
    get: function () {
      return this.scene.globe.shadows;
    },
    set: function (value) {
      this.scene.globe.shadows = value;
    },
  },

  /**
   * 获取场景的阴影映射。
   * @memberof Viewer.prototype
   * @type {ShadowMap}
   * @readonly
   */
  shadowMap: {
    get: function () {
      return this.scene.shadowMap;
    },
  },

  /**
   * 获取将在 globe 上渲染的影像图层集合。
   * @memberof Viewer.prototype
   *
   * @type {ImageryLayerCollection}
   * @readonly
   */
  imageryLayers: {
    get: function () {
      return this.scene.imageryLayers;
    },
  },

  /**
   * 为 globe 提供表面地形的地形提供器。
   * @memberof Viewer.prototype
   *
   * @type {TerrainProvider}
   */
  terrainProvider: {
    get: function () {
      return this.scene.terrainProvider;
    },
    set: function (terrainProvider) {
      this.scene.terrainProvider = terrainProvider;
    },
  },

  /**
   * 获取相机。
   * @memberof Viewer.prototype
   *
   * @type {Camera}
   * @readonly
   */
  camera: {
    get: function () {
      return this.scene.camera;
    },
  },

  /**
   * 获取场景的默认椭球体。
   * @memberof Viewer.prototype
   *
   * @type {Ellipsoid}
   * @default Ellipsoid.default
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this.scene.ellipsoid;
    },
  },

  /**
   * 获取后处理阶段。
   * @memberof Viewer.prototype
   *
   * @type {PostProcessStageCollection}
   * @readonly
   */
  postProcessStages: {
    get: function () {
      return this.scene.postProcessStages;
    },
  },

  /**
   * 获取时钟。
   * @memberof Viewer.prototype
   * @type {Clock}
   * @readonly
   */
  clock: {
    get: function () {
      return this._clockViewModel.clock;
    },
  },

  /**
   * 获取时钟视图模型。
   * @memberof Viewer.prototype
   * @type {ClockViewModel}
   * @readonly
   */
  clockViewModel: {
    get: function () {
      return this._clockViewModel;
    },
  },

  /**
   * 获取屏幕空间事件处理器。
   * @memberof Viewer.prototype
   * @type {ScreenSpaceEventHandler}
   * @readonly
   */
  screenSpaceEventHandler: {
    get: function () {
      return this._cesiumWidget.screenSpaceEventHandler;
    },
  },

  /**
   * 获取或设置当 <code>useDefaultRenderLoop</code> 为 true 时控件的目标帧率。
   * 如果未定义，由浏览器的 requestAnimationFrame 实现确定帧率。如果已定义，此值必须大于 0。
   * 高于底层 requestAnimationFrame 实现的值将无效。
   * @memberof Viewer.prototype
   *
   * @type {number}
   */
  targetFrameRate: {
    get: function () {
      return this._cesiumWidget.targetFrameRate;
    },
    set: function (value) {
      this._cesiumWidget.targetFrameRate = value;
    },
  },

  /**
   * 获取或设置此控件是否应该控制渲染循环。
   * 如果为 true，控件将使用 requestAnimationFrame 执行渲染和控件大小调整，以及驱动模拟时钟。
   * 如果设置为 false，必须在自定义渲染循环中手动调用 <code>resize</code>、<code>render</code> 方法。
   * 如果渲染时发生错误，将触发 {@link Scene} 的 <code>renderError</code> 事件，且此属性将设置为 false。
   * 必须在错误后重新设置为 true 才能继续渲染。
   * @memberof Viewer.prototype
   *
   * @type {boolean}
   */
  useDefaultRenderLoop: {
    get: function () {
      return this._cesiumWidget.useDefaultRenderLoop;
    },
    set: function (value) {
      this._cesiumWidget.useDefaultRenderLoop = value;
    },
  },

  /**
   * 获取或设置渲染分辨率的缩放因子。小于 1.0 的值可以提高性能较弱设备的性能，
   * 而大于 1.0 的值将以更高分辨率渲染然后缩小，从而改善视觉效果。
   * 例如，如果控件布局大小为 640x480，将此值设置为 0.5 将导致场景以 320x240 渲染然后放大，
   * 而设置为 2.0 将导致场景以 1280x960 渲染然后缩小。
   * @memberof Viewer.prototype
   *
   * @type {number}
   * @default 1.0
   */
  resolutionScale: {
    get: function () {
      return this._cesiumWidget.resolutionScale;
    },
    set: function (value) {
      this._cesiumWidget.resolutionScale = value;
    },
  },

  /**
   * 布尔标志，指示是否使用浏览器的推荐分辨率。
   * 如果为 true，则忽略浏览器的设备像素比并使用 1.0，有效地基于 CSS 像素而不是设备像素进行渲染。
   * 这可以在高像素密度的性能较弱设备上改善性能。当为 false 时，将以设备像素渲染。
   * 无论此标志是 true 还是 false，{@link Viewer#resolutionScale} 都将生效。
   * @memberof Viewer.prototype
   *
   * @type {boolean}
   * @default true
   */
  useBrowserRecommendedResolution: {
    get: function () {
      return this._cesiumWidget.useBrowserRecommendedResolution;
    },
    set: function (value) {
      this._cesiumWidget.useBrowserRecommendedResolution = value;
    },
  },

  /**
   * 获取或设置数据源是否可以暂时暂停动画以避免向用户显示不完整的画面。
   * 例如，如果异步图元正在后台处理，时钟在几何体准备好之前不会推进。
   *
   * @memberof Viewer.prototype
   *
   * @type {boolean}
   */
  allowDataSourcesToSuspendAnimation: {
    get: function () {
      return this._cesiumWidget.allowDataSourcesToSuspendAnimation;
    },
    set: function (value) {
      this._cesiumWidget.allowDataSourcesToSuspendAnimation = value;
    },
  },

  /**
   * 获取或设置相机当前跟踪的 Entity 实例。
   * @memberof Viewer.prototype
   * @type {Entity | undefined}
   */
  trackedEntity: {
    get: function () {
      return this._cesiumWidget.trackedEntity;
    },
    set: function (value) {
      this._cesiumWidget.trackedEntity = value;
    },
  },
  /**
   * 获取或设置要显示选择指示的对象实例。
   *
   * 如果用户交互地选择了 Cesium3DTilesFeature 实例，则此属性将包含一个瞬态 Entity 实例，
   * 该实例具有名为 "feature" 的属性，即被选择的实例。
   * @memberof Viewer.prototype
   * @type {Entity | undefined}
   */
  selectedEntity: {
    get: function () {
      return this._selectedEntity;
    },
    set: function (value) {
      if (this._selectedEntity !== value) {
        this._selectedEntity = value;
        const selectionIndicatorViewModel = defined(this._selectionIndicator)
          ? this._selectionIndicator.viewModel
          : undefined;
        if (defined(value)) {
          if (defined(selectionIndicatorViewModel)) {
            selectionIndicatorViewModel.animateAppear();
          }
        } else if (defined(selectionIndicatorViewModel)) {
          // Leave the info text in place here, it is needed during the exit animation.
          selectionIndicatorViewModel.animateDepart();
        }
        this._selectedEntityChanged.raiseEvent(value);
      }
    },
  },
  /**
   * 获取所选实体更改时触发的事件。
   * @memberof Viewer.prototype
   * @type {Event}
   * @readonly
   */
  selectedEntityChanged: {
    get: function () {
      return this._selectedEntityChanged;
    },
  },
  /**
   * 获取跟踪实体更改时触发的事件。
   * @memberof Viewer.prototype
   * @type {Event}
   * @readonly
   */
  trackedEntityChanged: {
    get: function () {
      return this._cesiumWidget.trackedEntityChanged;
    },
  },
  /**
   * 获取或设置与 viewer 时钟跟踪的数据源。
   * @memberof Viewer.prototype
   * @type {DataSource}
   */
  clockTrackedDataSource: {
    get: function () {
      return this._cesiumWidget.clockTrackedDataSource;
    },
    set: function (value) {
      if (this._cesiumWidget.clockTrackedDataSource !== value) {
        this._cesiumWidget.clockTrackedDataSource = value;
        linkTimelineToDataSourceClock(this._timeline, value);
      }
    },
  },
});

/**
 * 使用提供的 mixin 扩展基础 viewer 功能。
 * mixin 可以为 viewer 实例添加额外的属性、函数或其他功能。
 *
 * @param {Viewer.ViewerMixin} mixin 要添加到此实例的 Viewer mixin。
 * @param {object} [options] 要传递给 mixin 函数的选项对象。
 *
 * @see viewerDragDropMixin
 */
Viewer.prototype.extend = function (mixin, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(mixin)) {
    throw new DeveloperError("mixin is required.");
  }
  //>>includeEnd('debug');

  mixin(this, options);
};

/**
 * 调整控件大小以匹配容器大小。
 * 除非 <code>useDefaultRenderLoop</code> 设置为 false，否则此函数会自动调用。
 */
Viewer.prototype.resize = function () {
  const cesiumWidget = this._cesiumWidget;
  const container = this._container;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const animationExists = defined(this._animation);
  const timelineExists = defined(this._timeline);

  cesiumWidget.resize();

  if (width === this._lastWidth && height === this._lastHeight) {
    return;
  }

  const panelMaxHeight = height - 125;
  const baseLayerPickerDropDown = this._baseLayerPickerDropDown;

  if (defined(baseLayerPickerDropDown)) {
    baseLayerPickerDropDown.style.maxHeight = `${panelMaxHeight}px`;
  }

  if (defined(this._geocoder)) {
    const geocoderSuggestions = this._geocoder.searchSuggestionsContainer;
    geocoderSuggestions.style.maxHeight = `${panelMaxHeight}px`;
  }

  if (defined(this._infoBox)) {
    this._infoBox.viewModel.maxHeight = panelMaxHeight;
  }

  const timeline = this._timeline;
  let animationContainer;
  let animationWidth = 0;
  let creditLeft = 5;
  let creditBottom = 3;
  let creditRight = 0;

  if (
    animationExists &&
    window.getComputedStyle(this._animation.container).visibility !== "hidden"
  ) {
    const lastWidth = this._lastWidth;
    animationContainer = this._animation.container;
    if (width > 900) {
      animationWidth = 169;
      if (lastWidth <= 900) {
        animationContainer.style.width = "169px";
        animationContainer.style.height = "112px";
        this._animation.resize();
      }
    } else if (width >= 600) {
      animationWidth = 136;
      if (lastWidth < 600 || lastWidth > 900) {
        animationContainer.style.width = "136px";
        animationContainer.style.height = "90px";
        this._animation.resize();
      }
    } else {
      animationWidth = 106;
      if (lastWidth > 600 || lastWidth === 0) {
        animationContainer.style.width = "106px";
        animationContainer.style.height = "70px";
        this._animation.resize();
      }
    }
    creditLeft = animationWidth + 5;
  }

  if (
    timelineExists &&
    window.getComputedStyle(this._timeline.container).visibility !== "hidden"
  ) {
    const fullscreenButton = this._fullscreenButton;
    const vrButton = this._vrButton;
    const timelineContainer = timeline.container;
    const timelineStyle = timelineContainer.style;

    creditBottom = timelineContainer.clientHeight + 3;
    timelineStyle.left = `${animationWidth}px`;

    let pixels = 0;
    if (defined(fullscreenButton)) {
      pixels += fullscreenButton.container.clientWidth;
    }
    if (defined(vrButton)) {
      pixels += vrButton.container.clientWidth;
    }

    timelineStyle.right = `${pixels}px`;
    timeline.resize();
  }

  if (!timelineExists && defined(this._fullscreenButton)) {
    // don't let long credits (like the default ion token) go behind the fullscreen button
    creditRight = this._fullscreenButton.container.clientWidth;
  }

  this._bottomContainer.style.left = `${creditLeft}px`;
  this._bottomContainer.style.bottom = `${creditBottom}px`;
  this._bottomContainer.style.right = `${creditRight}px`;

  this._lastWidth = width;
  this._lastHeight = height;
};

/**
 * 强制控件重新考虑其布局，包括控件大小和信用显示位置。
 */
Viewer.prototype.forceResize = function () {
  this._lastWidth = 0;
  this.resize();
};

/**
 * 渲染场景。除非 <code>useDefaultRenderLoop</code> 设置为 false，否则会自动调用此函数。
 */
Viewer.prototype.render = function () {
  this._cesiumWidget.render();
};

/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false。
 */
Viewer.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁控件。如果从布局中永久移除控件，应调用此方法。
 */
Viewer.prototype.destroy = function () {
  if (
    defined(this.screenSpaceEventHandler) &&
    !this.screenSpaceEventHandler.isDestroyed()
  ) {
    this.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
    );
    this.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );
  }

  this._container.removeChild(this._element);
  this._element.removeChild(this._toolbar);

  this._eventHelper.removeAll();

  if (defined(this._geocoder)) {
    this._geocoder = this._geocoder.destroy();
  }

  if (defined(this._homeButton)) {
    this._homeButton = this._homeButton.destroy();
  }

  if (defined(this._sceneModePicker)) {
    this._sceneModePicker = this._sceneModePicker.destroy();
  }

  if (defined(this._projectionPicker)) {
    this._projectionPicker = this._projectionPicker.destroy();
  }

  if (defined(this._baseLayerPicker)) {
    this._baseLayerPicker = this._baseLayerPicker.destroy();
  }

  if (defined(this._animation)) {
    this._element.removeChild(this._animation.container);
    this._animation = this._animation.destroy();
  }

  if (defined(this._timeline)) {
    this._timeline.removeEventListener(
      "settime",
      onTimelineScrubfunction,
      false,
    );
    this._element.removeChild(this._timeline.container);
    this._timeline = this._timeline.destroy();
  }

  if (defined(this._fullscreenButton)) {
    this._fullscreenSubscription.dispose();
    this._element.removeChild(this._fullscreenButton.container);
    this._fullscreenButton = this._fullscreenButton.destroy();
  }

  if (defined(this._vrButton)) {
    this._vrSubscription.dispose();
    this._vrModeSubscription.dispose();
    this._element.removeChild(this._vrButton.container);
    this._vrButton = this._vrButton.destroy();
  }

  if (defined(this._infoBox)) {
    this._element.removeChild(this._infoBox.container);
    this._infoBox = this._infoBox.destroy();
  }

  if (defined(this._selectionIndicator)) {
    this._element.removeChild(this._selectionIndicator.container);
    this._selectionIndicator = this._selectionIndicator.destroy();
  }

  if (this._destroyClockViewModel) {
    this._clockViewModel = this._clockViewModel.destroy();
  }
  this._cesiumWidget = this._cesiumWidget.destroy();

  return destroyObject(this);
};

/**
 * @private
 */
Viewer.prototype._dataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.addEventListener(
    Viewer.prototype._onEntityCollectionChanged,
    this,
  );
};

/**
 * @private
 */
Viewer.prototype._dataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.removeEventListener(
    Viewer.prototype._onEntityCollectionChanged,
    this,
  );

  if (defined(this.selectedEntity)) {
    if (
      entityCollection.getById(this.selectedEntity.id) === this.selectedEntity
    ) {
      this.selectedEntity = undefined;
    }
  }
};

/**
 * @private
 */
Viewer.prototype._updateCanAnimate = function (that) {
  return function (isUpdated) {
    that._clockViewModel.canAnimate = isUpdated;
  };
};

/**
 * @private
 */
Viewer.prototype._onTick = function (clock) {
  const time = clock.currentTime;

  let position;
  let enableCamera = false;
  const selectedEntity = this.selectedEntity;
  const showSelection = defined(selectedEntity) && this._enableInfoOrSelection;

  if (
    showSelection &&
    selectedEntity.isShowing &&
    selectedEntity.isAvailable(time)
  ) {
    const state = this._cesiumWidget.dataSourceDisplay.getBoundingSphere(
      selectedEntity,
      true,
      boundingSphereScratch,
    );
    if (state !== BoundingSphereState.FAILED) {
      position = boundingSphereScratch.center;
    } else if (defined(selectedEntity.position)) {
      position = selectedEntity.position.getValue(time, position);
    }
    enableCamera = defined(position);
  }

  const selectionIndicatorViewModel = defined(this._selectionIndicator)
    ? this._selectionIndicator.viewModel
    : undefined;
  if (defined(selectionIndicatorViewModel)) {
    selectionIndicatorViewModel.position = Cartesian3.clone(
      position,
      selectionIndicatorViewModel.position,
    );
    selectionIndicatorViewModel.showSelection = showSelection && enableCamera;
    selectionIndicatorViewModel.update();
  }

  const infoBoxViewModel = defined(this._infoBox)
    ? this._infoBox.viewModel
    : undefined;
  if (defined(infoBoxViewModel)) {
    infoBoxViewModel.showInfo = showSelection;
    infoBoxViewModel.enableCamera = enableCamera;
    infoBoxViewModel.isCameraTracking =
      this.trackedEntity === this.selectedEntity;

    if (showSelection) {
      infoBoxViewModel.titleText = selectedEntity.name ?? selectedEntity.id;
      infoBoxViewModel.description = Property.getValueOrDefault(
        selectedEntity.description,
        time,
        "",
      );
    } else {
      infoBoxViewModel.titleText = "";
      infoBoxViewModel.description = "";
    }
  }
};

/**
 * @private
 */
Viewer.prototype._onEntityCollectionChanged = function (
  collection,
  added,
  removed,
) {
  const length = removed.length;
  for (let i = 0; i < length; i++) {
    const removedObject = removed[i];
    if (this.selectedEntity === removedObject) {
      this.selectedEntity = undefined;
    }
  }
};

/**
 * @private
 */
Viewer.prototype._onInfoBoxCameraClicked = function (infoBoxViewModel) {
  if (
    infoBoxViewModel.isCameraTracking &&
    this.trackedEntity === this.selectedEntity
  ) {
    this.trackedEntity = undefined;
  } else {
    const selectedEntity = this.selectedEntity;
    const position = selectedEntity.position;
    if (defined(position)) {
      this.trackedEntity = this.selectedEntity;
    } else {
      this.zoomTo(this.selectedEntity);
    }
  }
};

/**
 * @private
 */
Viewer.prototype._clearTrackedObject = function () {
  this.trackedEntity = undefined;
};

/**
 * @private
 */
Viewer.prototype._onInfoBoxClockClicked = function (infoBoxViewModel) {
  this.selectedEntity = undefined;
};

/**
 * @private
 */
Viewer.prototype._clearObjects = function () {
  this.trackedEntity = undefined;
  this.selectedEntity = undefined;
};

/**
 * @private
 */
Viewer.prototype._onDataSourceChanged = function (dataSource) {
  if (this.clockTrackedDataSource === dataSource) {
    linkTimelineToDataSourceClock(this.timeline, dataSource);
  }
};

/**
 * @private
 */
Viewer.prototype._onDataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  if (
    this._cesiumWidget._automaticallyTrackDataSourceClocks &&
    dataSource === this.clockTrackedDataSource
  ) {
    // When data sources are added to the CesiumWidget they may be automatically
    // tracked in that class but we also need to update the timeline in this class
    linkTimelineToDataSourceClock(this._timeline, dataSource);
  }
  const id = dataSource.entities.id;
  const removalFunc = this._eventHelper.add(
    dataSource.changedEvent,
    Viewer.prototype._onDataSourceChanged,
    this,
  );
  this._dataSourceChangedListeners[id] = removalFunc;
};

/**
 * @private
 */
Viewer.prototype._onDataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const id = dataSource.entities.id;
  this._dataSourceChangedListeners[id]();
  this._dataSourceChangedListeners[id] = undefined;
};

/**
 * 异步设置相机以查看提供的实体、实体数组或数据源。
 * 如果数据源仍在加载过程中或可视化仍在加载，此方法将等待数据准备好后再执行缩放。
 *
 * <p>偏移量是局部东北天参考帧中的航向/俯仰/范围，以边界球体的中心为中心。
 * 航向和俯仰角在局部东北天参考帧中定义。
 * 航向是从 y 轴开始并向 x 轴增加的角度。俯仰是从 xy 平面的旋转。正俯仰角在平面上方。
 * 负俯仰角在平面下方。范围是到中心的距离。如果范围为零，将计算一个范围以使整个边界球体可见。</p>
 *
 * <p>在 2D 中，必须是自上而下的视图。相机将放置在目标上方俯视。
 * 目标上方的高度为范围。航向将由偏移量确定。如果无法从偏移量确定航向，则航向为北。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive|BufferPrimitiveCollection<BufferPrimitive>>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或影像图层。也可以传递解析为上述类型之一的 promise。
 * @param {HeadingPitchRange} [offset] 局部东北天参考帧中相对于实体中心的偏移。
 * @returns {Promise<boolean>} 解析为 true 表示缩放成功，或 false 表示目标当前未在场景中可视化或缩放被取消的 Promise。
 */
Viewer.prototype.zoomTo = function (target, offset) {
  return this._cesiumWidget.zoomTo(target, offset);
};

/**
 * 飞行相机到提供的实体、实体数组或数据源。
 * 如果数据源仍在加载过程中或可视化仍在加载，此方法将等待数据准备好后再执行飞行。
 *
 * <p>偏移量是局部东北天参考帧中的航向/俯仰/范围，以边界球体的中心为中心。
 * 航向和俯仰角在局部东北天参考帧中定义。
 * 航向是从 y 轴开始并向 x 轴增加的角度。俯仰是从 xy 平面的旋转。正俯仰角在平面上方。
 * 负俯仰角在平面下方。范围是到中心的距离。如果范围为零，将计算一个范围以使整个边界球体可见。</p>
 *
 * <p>在 2D 中，必须是自上而下的视图。相机将放置在目标上方俯视。
 * 目标上方的高度为范围。航向将由偏移量确定。如果无法从偏移量确定航向，则航向为北。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive|BufferPrimitiveCollection<BufferPrimitive>>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或影像图层。也可以传递解析为上述类型之一的 promise。
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.duration=3.0] 飞行持续时间（秒）。
 * @param {number} [options.maximumHeight] 飞行最高点的最大高度。
 * @param {HeadingPitchRange} [options.offset] 局部东北天参考帧中相对于目标的偏移。
 * @returns {Promise<boolean>} 解析为 true 表示飞行成功，或 false 表示目标当前未在场景中可视化或飞行被取消的 Promise。
 */
Viewer.prototype.flyTo = function (target, options) {
  return this._cesiumWidget.flyTo(target, options);
};

/**
 * 为 Viewer 实例添加额外功能的函数。
 * @callback Viewer.ViewerMixin
 * @param {Viewer} Viewer 实例。
 * @param {object} options 要传递给 mixin 函数的选项对象。
 *
 * @see Viewer#extend
 */
export default Viewer;
