import {
  BoundingSphere,
  BoundingSphereState,
  Cartesian3,
  Cartographic,
  CesiumWidget,
  Cesium3DTileFeature,
  Cesium3DTileset,
  Clock,
  computeFlyToLocationForRectangle,
  ConstantPositionProperty,
  DataSourceCollection,
  DataSourceDisplay,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  Entity,
  EntityView,
  Event,
  EventHelper,
  getElement,
  HeadingPitchRange,
  ImageryLayer,
  JulianDate,
  Math as CesiumMath,
  Matrix4,
  Property,
  SceneMode,
  ScreenSpaceEventType,
  TimeDynamicPointCloud,
  VoxelPrimitive,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
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
    const id = defaultValue(picked.id, picked.primitive.id);
    if (id instanceof Entity) {
      return id;
    }

    if (picked instanceof Cesium3DTileFeature) {
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

function trackDataSourceClock(timeline, clock, dataSource) {
  if (defined(dataSource)) {
    const dataSourceClock = dataSource.clock;
    if (defined(dataSourceClock)) {
      dataSourceClock.getValue(clock);
      if (defined(timeline)) {
        const startTime = dataSourceClock.startTime;
        let stopTime = dataSourceClock.stopTime;
        // When the start and stop times are equal, set the timeline to the shortest interval
        // starting at the start time. This prevents an invalid timeline configuration.
        if (JulianDate.equals(startTime, stopTime)) {
          stopTime = JulianDate.addSeconds(
            startTime,
            CesiumMath.EPSILON2,
            scratchStopTime
          );
        }
        timeline.updateFromClock();
        timeline.zoomTo(startTime, stopTime);
      }
    }
  }
}

const cartesian3Scratch = new Cartesian3();

function pickImageryLayerFeature(viewer, windowPosition) {
  const scene = viewer.scene;
  const pickRay = scene.camera.getPickRay(windowPosition);
  const imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(
    pickRay,
    scene
  );
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
          cartesian3Scratch
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
    }
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
 * 查看器构造函数的初始化选项
 *
 * @property {boolean} [animation=true] 如果设置为false，则不会创建Animation小部件。
 * @property {boolean} [baseLayerPicker=true] 如果设置为false，则不会创建BaseLayerPicker小部件。
 * @property {boolean} [fullscreenButton=true] 如果设置为false，则不会创建FullscreenButton小部件。
 * @property {boolean} [vrButton=false] 如果设置为true，将创建VRButton小部件。
 * @property {boolean|GeocoderService[]} [geocoder=true] 如果设置为false，则不会创建Geocoder小部件。
 * @property {boolean} [homeButton=true] 如果设置为false，则不会创建HomeButton小部件。
 * @property {boolean} [infoBox=true] 如果设置为false，则不会创建InfoBox小部件。
 * @property {boolean} [sceneModePicker=true] 如果设置为false，则不会创建SceneModePicker小部件。
 * @property {boolean} [selectionIndicator=true] 如果设置为false，则不会创建SelectionIndicator小部件。
 * @property {boolean} [timeline=true] 如果设置为false，则不会创建Timeline小部件。
 * @property {boolean} [navigationHelpButton=true] 如果设置为false，则不会创建导航帮助按钮。
 * @property {boolean} [navigationInstructionsInitiallyVisible=true] 如果导航指令最初应该是可见的，则为True;如果在用户明确单击按钮之前不应该显示，则为false。
 * @property {boolean} [scene3DOnly=false] 当<code>true</code>时,每个几何实例只会在3D中呈现,以保存GPU内存。
 * @property {boolean} [shouldAnimate=false] <code>true</code>如果时钟在默认情况下应该尝试提前模拟时间，<code>false</code>否则。此选项优先于设置 {@link Viewer#clockViewModel}.
 * @property {ClockViewModel} [clockViewModel=new ClockViewModel(clock)] 用于控制当前时间的时钟视图模型。
 * @property {ProviderViewModel} [selectedImageryProviderViewModel] 如果不提供第一个可用底层,则使用的是当前的基本图像层。如果“baseLayerPicker”设置为true,这个值仅有效。
 * @property {ProviderViewModel[]} [imageryProviderViewModels=createDefaultImageryProviderViewModels()] 可以从BaseLayerPicker中选择的ProviderViewModels数组。此值仅在' baseLayerPicker '设置为true时有效。
 * @property {ProviderViewModel} [selectedTerrainProviderViewModel] 视图模型当前的基本地形层，如果没有提供，则使用第一个可用的基础层。此值仅在' baseLayerPicker '设置为true时有效。
 * @property {ProviderViewModel[]} [terrainProviderViewModels=createDefaultTerrainProviderViewModels()] 可以从BaseLayerPicker中选择的ProviderViewModels数组。此值仅在' baseLayerPicker '设置为true时有效。
 * @property {ImageryLayer|false} [baseLayer=ImageryLayer.fromWorldImagery()] 最下面的图像层应用于地球仪。如果设置为<code>false</code>，则不会添加任何图像提供程序。此值仅在' baseLayerPicker '设置为false时有效。
 * @property {Ellipsoid} [ellipsoid = Ellipsoid.default] 默认 ellipsoid.
 * @property {TerrainProvider} [terrainProvider=new EllipsoidTerrainProvider()] 要使用的地形提供程序
 * @property {Terrain} [terrain] 一个处理异步地形提供程序的地形对象。只能指定if选项。terrainProvider未定义。
 * @property {SkyBox|false} [skyBox] 用来渲染星星的天空盒。当<code>undefined</code>和WGS84椭球使用时，使用默认的星号。如果设置为<code>false</code>，则不会添加天空盒、太阳或月亮。
 * @property {SkyAtmosphere|false} [skyAtmosphere] 蔚蓝的天空，还有环绕着地球边缘的光芒。使用WGS84椭球时启用。设置为<code>false</code>关闭。
 * @property {Element|string} [fullscreenElement=document.body] 要置于全屏模式的元素或id。 当按下全屏按钮时。
 * @property {boolean} [useDefaultRenderLoop=true] 如果这个小部件应该控制渲染循环，则为True，否则为false。
 * @property {number} [targetFrameRate] 使用默认渲染循环时的目标帧率。
 * @property {boolean} [showRenderLoopErrors=true] 如果为true，则在出现呈现循环错误时，此小部件将自动向用户显示一个包含错误的HTML面板。
 * @property {boolean} [useBrowserRecommendedResolution=true] 如果为true，则以浏览器推荐的分辨率呈现，并忽略<code>window.devicePixelRatio</code>。
 * @property {boolean} [automaticallyTrackDataSourceClocks=true] 如果为true，这个小部件将自动跟踪新添加的数据源的时钟设置，并在数据源的时钟更改时进行更新。如果要配置时钟独立，请将此设置为false
 * @property {ContextOptions} [contextOptions] Context和WebGL创建属性传递给 {@link Scene}.
 * @property {SceneMode} [sceneMode=SceneMode.SCENE3D] 初始场景模式。
 * @property {MapProjection} [mapProjection=new GeographicProjection(options.ellipsoid)] 在2D和哥伦布视图模式中使用的地图投影。
 * @property {Globe|false} [globe=new Globe(options.ellipsoid)] 在场景中使用的地球仪。如果设置为<code>false</code>，则默认情况下不会添加地球仪，并且天空气氛将被隐藏。
 * @property {boolean} [orderIndependentTranslucency=true] 如果为true并且配置支持它，则使用顺序无关的半透明。
 * @property {Element|string} [creditContainer] 包含 {@link CreditDisplay} 的DOM元素或ID。如果没有指定，积分将被添加到小部件本身的底部。
 * @property {Element|string} [creditViewport] 包含 {@link CreditDisplay} 创建的信用弹出框的DOM元素或ID。如果没有指定，它将显示在小部件本身的上方。
 * @property {DataSourceCollection} [dataSources=new DataSourceCollection()] 由小部件可视化的数据源集合。如果提供此参数，则
 *                               该实例被假定为调用者所有，并且在查看器被销毁时不会被销毁。
 * @property {boolean} [shadows=false] 确定阴影是否由光源投射。
 * @property {ShadowMode} [terrainShadows=ShadowMode.RECEIVE_ONLY] 确定地形是否投射或接收来自光源的阴影。
 * @property {MapMode2D} [mapMode2D=MapMode2D.INFINITE_SCROLL] 确定2D地图是可旋转还是可以在水平方向上无限滚动。
 * @property {boolean} [projectionPicker=false] 如果设置为true，将创建ProjectionPicker小部件。
 * @property {boolean} [blurActiveElementOnCanvasFocus=true] 如果为true，则当查看者的画布被点击时，活动元素将变得模糊。当单击画布只是为了检索位置或实体数据，而实际上并不打算将画布设置为活动元素时，将此设置为false很有用。
 * @property {boolean} [requestRenderMode=false] 如果为true，渲染帧将只在需要时发生，这取决于场景中的变化。启用可以减少应用程序的CPU/GPU使用，并在移动设备上使用更少的电池，但需要使用  {@link Scene#requestRender} 在此模式下显式渲染新帧。在许多情况下，在API的其他部分更改场景后，这将是必要的。看到 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}.
 * @property {number} [maximumRenderTimeChange=0.0] 如果requestRenderMode为true，则此值定义了在请求渲染之前允许的模拟时间的最大变化。看到 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}.
 * @property {number} [depthPlaneEllipsoidOffset=0.0] 调整DepthPlane以处理椭球体零标高以下的渲染伪影。
 * @property {number} [msaaSamples=4] 如果提供，该值控制多样本抗混叠的速率。典型的多采样率是每像素2、4，有时是8个采样。更高的MSAA采样率可能会影响性能，以换取更好的视觉质量。这个值只适用于支持多样本渲染目标的WebGL2上下文。设置为1表示关闭MSAA。
 */

/**
 * 用于构建应用程序的基本小部件。它将所有标准cesium组件组合到一个可重用的包中。
 * 小部件总是可以通过使用mixins来扩展，它可以添加对各种应用程序有用的功能。
 *
 * @alias Viewer
 * @constructor
 *
 * @param {Element|string} container 将包含小部件的DOM元素或ID。
 * @param {Viewer.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @exception {DeveloperError} id为"container"的元素在文档中不存在。
 * @exception {DeveloperError} options.selectedImageryProviderViewModel 在不使用BaseLayerPicker小部件时不可用，请指定选项。baseLayer相反.
 * @exception {DeveloperError} options.selectedTerrainProviderViewModel 在不使用BaseLayerPicker小部件时不可用，请指定选项。terrainProvider相反.
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
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Hello%20World.html|Cesium Sandcastle Hello World Demo}
 *
 * @example
 * // Initialize the viewer widget with several custom options and mixins.
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     // Start in Columbus Viewer
 *     sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
 *     // Use Cesium World Terrain
 *     terrain: Cesium.Terrain.fromWorldTerrain(),
 *     // Hide the base layer picker
 *     baseLayerPicker: false,
 *     // Use OpenStreetMaps
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
 *     // Show Columbus View map with Web Mercator projection
 *     mapProjection: new Cesium.WebMercatorProjection()
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * // Add basic drag and drop functionality
 * viewer.extend(Cesium.viewerDragDropMixin);
 *
 * // Show a pop-up alert if we encounter an error when processing a dropped file
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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
Either specify options.baseLayer instead or set options.baseLayerPicker to true."
    );
  }

  // If not using BaseLayerPicker, selectedTerrainProviderViewModel is an invalid option
  if (
    !createBaseLayerPicker &&
    defined(options.selectedTerrainProviderViewModel)
  ) {
    throw new DeveloperError(
      "options.selectedTerrainProviderViewModel is not available when not using the BaseLayerPicker widget. \
Either specify options.terrainProvider instead or set options.baseLayerPicker to true."
    );
  }
  //>>includeEnd('debug')

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

  const scene3DOnly = defaultValue(options.scene3DOnly, false);

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

  if (defined(options.shouldAnimate)) {
    clock.shouldAnimate = options.shouldAnimate;
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
    skyBox: options.skyBox,
    skyAtmosphere: options.skyAtmosphere,
    sceneMode: options.sceneMode,
    ellipsoid: options.ellipsoid,
    mapProjection: options.mapProjection,
    globe: options.globe,
    orderIndependentTranslucency: options.orderIndependentTranslucency,
    contextOptions: options.contextOptions,
    useDefaultRenderLoop: options.useDefaultRenderLoop,
    targetFrameRate: options.targetFrameRate,
    showRenderLoopErrors: options.showRenderLoopErrors,
    useBrowserRecommendedResolution: options.useBrowserRecommendedResolution,
    creditContainer: defined(options.creditContainer)
      ? options.creditContainer
      : bottomContainer,
    creditViewport: options.creditViewport,
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

  let dataSourceCollection = options.dataSources;
  let destroyDataSourceCollection = false;
  if (!defined(dataSourceCollection)) {
    dataSourceCollection = new DataSourceCollection();
    destroyDataSourceCollection = true;
  }

  const scene = cesiumWidget.scene;

  const dataSourceDisplay = new DataSourceDisplay({
    scene: scene,
    dataSourceCollection: dataSourceCollection,
  });

  const eventHelper = new EventHelper();

  eventHelper.add(clock.onTick, Viewer.prototype._onTick, this);
  eventHelper.add(scene.morphStart, Viewer.prototype._clearTrackedObject, this);

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
      scene
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
      this
    );
    eventHelper.add(
      infoBoxViewModel.closeClicked,
      Viewer.prototype._onInfoBoxClockClicked,
      this
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
    if (defined(options.geocoder) && typeof options.geocoder !== "boolean") {
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
      this
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
      this
    );
  }

  // SceneModePicker
  // By default, we silently disable the scene mode picker if scene3DOnly is true,
  // but if sceneModePicker is explicitly set to true, throw an error.
  //>>includeStart('debug', pragmas.debug);
  if (options.sceneModePicker === true && scene3DOnly) {
    throw new DeveloperError(
      "options.sceneModePicker is not available when options.scene3DOnly is set to true."
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
    const imageryProviderViewModels = defaultValue(
      options.imageryProviderViewModels,
      createDefaultImageryProviderViewModels()
    );
    const terrainProviderViewModels = defaultValue(
      options.terrainProviderViewModels,
      createDefaultTerrainProviderViewModels()
    );

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
      "cesium-baseLayerPicker-dropDown"
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
        "Specify either options.terrainProvider or options.terrain."
      );
    }
    //>>includeEnd('debug')

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
          "cesium-hasSeenNavHelp"
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
      instructionsInitiallyVisible: defaultValue(
        options.navigationInstructionsInitiallyVisible,
        showNavHelp
      ),
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
      new AnimationViewModel(clockViewModel)
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
      options.fullscreenElement
    );

    //Subscribe to fullscreenButton.viewModel.isFullscreenEnabled so
    //that we can hide/显示button as well as size the timeline.
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
      }
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
      }
    );

    vrModeSubscription = subscribeAndEvaluate(
      vrButton.viewModel,
      "isVRMode",
      function (isVRMode) {
        enableVRUI(that, isVRMode);
      }
    );
  }

  //Assign all properties to this instance.  No "this" assignments should
  //take place above this line.
  this._baseLayerPickerDropDown = baseLayerPickerDropDown;
  this._fullscreenSubscription = fullscreenSubscription;
  this._vrSubscription = vrSubscription;
  this._vrModeSubscription = vrModeSubscription;
  this._dataSourceChangedListeners = {};
  this._automaticallyTrackDataSourceClocks = defaultValue(
    options.automaticallyTrackDataSourceClocks,
    true
  );
  this._container = container;
  this._bottomContainer = bottomContainer;
  this._element = viewerContainer;
  this._cesiumWidget = cesiumWidget;
  this._selectionIndicator = selectionIndicator;
  this._infoBox = infoBox;
  this._dataSourceCollection = dataSourceCollection;
  this._destroyDataSourceCollection = destroyDataSourceCollection;
  this._dataSourceDisplay = dataSourceDisplay;
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
  this._allowDataSourcesToSuspendAnimation = true;
  this._entityView = undefined;
  this._enableInfoOrSelection = defined(infoBox) || defined(selectionIndicator);
  this._clockTrackedDataSource = undefined;
  this._trackedEntity = undefined;
  this._needTrackedEntityUpdate = false;
  this._selectedEntity = undefined;
  this._zoomIsFlight = false;
  this._zoomTarget = undefined;
  this._zoomPromise = undefined;
  this._zoomOptions = undefined;
  this._selectedEntityChanged = new Event();
  this._trackedEntityChanged = new Event();

  knockout.track(this, [
    "_trackedEntity",
    "_selectedEntity",
    "_clockTrackedDataSource",
  ]);

  //Listen to data source events in order to track clock changes.
  eventHelper.add(
    dataSourceCollection.dataSourceAdded,
    Viewer.prototype._onDataSourceAdded,
    this
  );
  eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    Viewer.prototype._onDataSourceRemoved,
    this
  );

  // Prior to each render, check if anything needs to be resized.
  eventHelper.add(scene.postUpdate, Viewer.prototype.resize, this);
  eventHelper.add(scene.postRender, Viewer.prototype._postRender, this);

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
    this
  );
  eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    Viewer.prototype._dataSourceRemoved,
    this
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
    ScreenSpaceEventType.LEFT_CLICK
  );
  cesiumWidget.screenSpaceEventHandler.setInputAction(
    pickAndTrackObject,
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
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
   * 管理要在屏幕和灯箱中显示的积分列表。
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
   * 控件所在窗口底部区域的DOM元素
   * {@link CreditDisplay} 还有其他潜在的问题。
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
   * 获取CesiumWidget。
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
   * 获取选择指示符。
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
   * 获取 info box.
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
   * 获取 Geocoder.
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
   * 获取 HomeButton.
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
   * 得到场景ModePicker.
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
   * 获取 ProjectionPicker.
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
   * 获取 BaseLayerPicker.
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
   * 获取 NavigationHelpButton.
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
   * 获取 Animation widget.
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
   * 获取 Timeline widget.
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
   * 获取 FullscreenButton.
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
   * 获取 VRButton.
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
   * 获取用于 {@link DataSource} 可视化的显示。
   * @memberof Viewer.prototype
   * @type {DataSourceDisplay}
   * @readonly
   */
  dataSourceDisplay: {
    get: function () {
      return this._dataSourceDisplay;
    },
  },

  /**
   * 获取没有绑定到特定数据源的实体集合。
   * 这是一个捷径 [dataSourceDisplay.defaultDataSource.entities]{@link Viewer#dataSourceDisplay}.
   * @memberof Viewer.prototype
   * @type {EntityCollection}
   * @readonly
   */
  entities: {
    get: function () {
      return this._dataSourceDisplay.defaultDataSource.entities;
    },
  },

  /**
   * 获取 要可视化的 {@link DataSource} 实例集。
   * @memberof Viewer.prototype
   * @type {DataSourceCollection}
   * @readonly
   */
  dataSources: {
    get: function () {
      return this._dataSourceCollection;
    },
  },

  /**
   * 获取 canvas.
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
   * 得到场景.
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
   * 确定阴影是否由光源投射。
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
   * 确定地形投射或光源的阴影。
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
   * 获取场景的阴影贴图
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
   * 获取 将在地球仪上渲染的图像层集合。
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
   * 地形提供程序，为地球仪提供表面几何形状。
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
   * 获取 camera.
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
   * 获取场景的默认椭球。
   * @memberof Viewer.prototype
   *
   * @type {Ellipsoid}
   * @default Ellipsoid.default
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._scene.ellipsoid;
    },
  },

  /**
   * 获取 post-process stages.
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
   * 获取 clock.
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
   * 获取 screen space event handler.
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
   * 获取或设置当<code>useDefaultRenderLoop</code>时小部件的目标帧率
   * 为true。如果未定义，则浏览器的requestAnimationFrame实现
   * 决定帧速率。如果已定义，则此值必须大于0。一个更高的值
   * 底层的requestAnimationFrame实现将没有效果。
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
   * 获取或设置是否这个小部件应该控制渲染循环。
   * 如果为true，小部件将使用requestAnimationFrame
   * 执行渲染和调整小部件的大小，以及驱动
   * 模拟时钟。如果设置为false，则必须手动调用
   *  <code>resize</code>， <code>render</code>方法
   * 作为自定义渲染循环的一部分。如果渲染过程中出现错误，{@link Scene}
   *  <code>renderError</code>事件将被引发
   * 将被设置为false。必须将其设置为true才能继续渲染
   * 后的错误。
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
   * 获取或设置渲染分辨率的缩放因子。值小于1.0可以改善
   * 性能在较弱的设备上，而值大于1.0将以更高的渲染
   * 分辨率，然后按比例缩小，从而提高视觉保真度。
   * 例如，如果小部件的尺寸为640x480，则将此值设置为0.5
   * 将导致场景以320x240渲染，然后在设置时缩放
   * 它到2.0将导致场景渲染为1280x960，然后缩小。
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
   * 布尔标志，表示是否使用浏览器推荐的分辨率。
   * 如果为true，浏览器的设备像素比将被忽略，而使用1.0。
   * 有效地渲染基于CSS像素而不是设备像素。这可以改善
   * 性能较弱的设备，具有高像素密度。当为false时，渲染
   * 的单位是设备像素。{@link Viewer#resolutionScale} 仍然会生效
   * 这个标志是真还是假。
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
   * 获取或设置是否数据源可以暂时暂停
   * 动画，以避免显示一个不完整的图片给用户。
   * 例如，如果异步原语正在处理
   * 背景，时钟将不会前进，直到几何就绪。
   *
   * @memberof Viewer.prototype
   *
   * @type {boolean}
   */
  allowDataSourcesToSuspendAnimation: {
    get: function () {
      return this._allowDataSourcesToSuspendAnimation;
    },
    set: function (value) {
      this._allowDataSourcesToSuspendAnimation = value;
    },
  },

  /**
   * 获取或设置当前被摄像机跟踪的实体实例。
   * @memberof Viewer.prototype
   * @type {Entity | undefined}
   */
  trackedEntity: {
    get: function () {
      return this._trackedEntity;
    },
    set: function (value) {
      if (this._trackedEntity !== value) {
        this._trackedEntity = value;

        //Cancel any pending zoom
        cancelZoom(this);

        const scene = this.scene;
        const sceneMode = scene.mode;

        //Stop tracking
        if (!defined(value) || !defined(value.position)) {
          this._needTrackedEntityUpdate = false;
          if (
            sceneMode === SceneMode.COLUMBUS_VIEW ||
            sceneMode === SceneMode.SCENE2D
          ) {
            scene.screenSpaceCameraController.enableTranslate = true;
          }

          if (
            sceneMode === SceneMode.COLUMBUS_VIEW ||
            sceneMode === SceneMode.SCENE3D
          ) {
            scene.screenSpaceCameraController.enableTilt = true;
          }

          this._entityView = undefined;
          this.camera.lookAtTransform(Matrix4.IDENTITY);
        } else {
          //We can't start tracking immediately, so we set a flag and start tracking
          //when the bounding sphere is ready (most likely next frame).
          this._needTrackedEntityUpdate = true;
        }

        this._trackedEntityChanged.raiseEvent(value);
        this.scene.requestRender();
      }
    },
  },
  /**
   * 获取或设置对象实例，为其显示选择指示符。
   *
   * 如果用户交互选择一个cesium3dtiesfeature实例，那么这个属性
   * 将包含一个瞬态实体实例，其属性名为“feature”
   * 被选中的实例。
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
   * 所选实体更改时引发的获取事件。
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
   * 当跟踪的实体发生变化时引发的获取事件。
   * @memberof Viewer.prototype
   * @type {Event}
   * @readonly
   */
  trackedEntityChanged: {
    get: function () {
      return this._trackedEntityChanged;
    },
  },
  /**
   * 获取或设置数据源与观众的时钟跟踪。
   * @memberof Viewer.prototype
   * @type {DataSource}
   */
  clockTrackedDataSource: {
    get: function () {
      return this._clockTrackedDataSource;
    },
    set: function (value) {
      if (this._clockTrackedDataSource !== value) {
        this._clockTrackedDataSource = value;
        trackDataSourceClock(this._timeline, this.clock, value);
      }
    },
  },
});

/**
 * 使用提供的mixin扩展基本查看器功能。
 * mixin可以添加额外的属性、函数或其他行为
 * 到所提供的查看器实例。
 *
 * @param {Viewer.ViewerMixin} mixin 要添加到此实例的Viewer mixin。
 * @param {object} [options] 要传递给mixin函数的options对象。
 *
 * @see viewerDragDropMixin
 */
Viewer.prototype.extend = function (mixin, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(mixin)) {
    throw new DeveloperError("mixin is required.");
  }
  //>>includeEnd('debug')

  mixin(this, options);
};

/**
 * 调整小部件的大小以匹配容器的大小。
 * 此函数在需要时自动调用，除非
 * <code>useDefaultRenderLoop</code>设置为false。
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
 * 这迫使小部件重新考虑其布局，包括
 * 小部件大小和信用位置。
 */
Viewer.prototype.forceResize = function () {
  this._lastWidth = 0;
  this.resize();
};

/**
 * 渲染场景。这个函数是自动调用的
 * 除非<code>useDefaultRenderLoop</code>设置为false;
 */
Viewer.prototype.render = function () {
  this._cesiumWidget.render();
};

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
Viewer.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。应该叫它永久的吗
 * 从布局中删除小部件。
 */
Viewer.prototype.destroy = function () {
  let i;
  if (
    defined(this.screenSpaceEventHandler) &&
    !this.screenSpaceEventHandler.isDestroyed()
  ) {
    this.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK
    );
    this.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  }

  // Unsubscribe from data sources
  const dataSources = this.dataSources;
  const dataSourceLength = dataSources.length;
  for (i = 0; i < dataSourceLength; i++) {
    this._dataSourceRemoved(dataSources, dataSources.get(i));
  }
  this._dataSourceRemoved(undefined, this._dataSourceDisplay.defaultDataSource);

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
      false
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
  this._dataSourceDisplay = this._dataSourceDisplay.destroy();
  this._cesiumWidget = this._cesiumWidget.destroy();

  if (this._destroyDataSourceCollection) {
    this._dataSourceCollection = this._dataSourceCollection.destroy();
  }

  return destroyObject(this);
};

/**
 * @private
 */
Viewer.prototype._dataSourceAdded = function (
  dataSourceCollection,
  dataSource
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.addEventListener(
    Viewer.prototype._onEntityCollectionChanged,
    this
  );
};

/**
 * @private
 */
Viewer.prototype._dataSourceRemoved = function (
  dataSourceCollection,
  dataSource
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.removeEventListener(
    Viewer.prototype._onEntityCollectionChanged,
    this
  );

  if (defined(this.trackedEntity)) {
    if (
      entityCollection.getById(this.trackedEntity.id) === this.trackedEntity
    ) {
      this.trackedEntity = undefined;
    }
  }

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
Viewer.prototype._onTick = function (clock) {
  const time = clock.currentTime;

  const isUpdated = this._dataSourceDisplay.update(time);
  if (this._allowDataSourcesToSuspendAnimation) {
    this._clockViewModel.canAnimate = isUpdated;
  }

  const entityView = this._entityView;
  if (defined(entityView)) {
    const trackedEntity = this._trackedEntity;
    const trackedState = this._dataSourceDisplay.getBoundingSphere(
      trackedEntity,
      false,
      boundingSphereScratch
    );
    if (trackedState === BoundingSphereState.DONE) {
      entityView.update(time, boundingSphereScratch);
    }
  }

  let position;
  let enableCamera = false;
  const selectedEntity = this.selectedEntity;
  const showSelection = defined(selectedEntity) && this._enableInfoOrSelection;

  if (
    showSelection &&
    selectedEntity.isShowing &&
    selectedEntity.isAvailable(time)
  ) {
    const state = this._dataSourceDisplay.getBoundingSphere(
      selectedEntity,
      true,
      boundingSphereScratch
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
      selectionIndicatorViewModel.position
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
      infoBoxViewModel.titleText = defaultValue(
        selectedEntity.name,
        selectedEntity.id
      );
      infoBoxViewModel.description = Property.getValueOrDefault(
        selectedEntity.description,
        time,
        ""
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
  removed
) {
  const length = removed.length;
  for (let i = 0; i < length; i++) {
    const removedObject = removed[i];
    if (this.trackedEntity === removedObject) {
      this.trackedEntity = undefined;
    }
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
    trackDataSourceClock(this.timeline, this.clock, dataSource);
  }
};

/**
 * @private
 */
Viewer.prototype._onDataSourceAdded = function (
  dataSourceCollection,
  dataSource
) {
  if (this._automaticallyTrackDataSourceClocks) {
    this.clockTrackedDataSource = dataSource;
  }
  const id = dataSource.entities.id;
  const removalFunc = this._eventHelper.add(
    dataSource.changedEvent,
    Viewer.prototype._onDataSourceChanged,
    this
  );
  this._dataSourceChangedListeners[id] = removalFunc;
};

/**
 * @private
 */
Viewer.prototype._onDataSourceRemoved = function (
  dataSourceCollection,
  dataSource
) {
  const resetClock = this.clockTrackedDataSource === dataSource;
  const id = dataSource.entities.id;
  this._dataSourceChangedListeners[id]();
  this._dataSourceChangedListeners[id] = undefined;
  if (resetClock) {
    const numDataSources = dataSourceCollection.length;
    if (this._automaticallyTrackDataSourceClocks && numDataSources > 0) {
      this.clockTrackedDataSource = dataSourceCollection.get(
        numDataSources - 1
      );
    } else {
      this.clockTrackedDataSource = undefined;
    }
  }
};

/**
 * 异步设置相机查看提供的实体、实体或数据源。
 * 如果数据源仍在加载过程中或可视化仍在加载中，
 * 这个方法在执行缩放之前等待数据准备好。
 *
 * <p>偏移量是在以边界球中心为中心的本地东-北-上参考系中的头部/俯仰/范围。
 * 航向和俯仰角在当地的东-北-上参考系中定义。
 * 航向是从y轴到x轴增加的角度。螺距是x平面的旋转。积极的推销
 * 个角在平面的上方。负俯仰角在平面以下。距离是到中心的距离。如果范围是
 * 0，计算一个范围，使整个边界球可见。</p>
 *
 * <p>在2D中，必须有一个自上而下的视图。摄像机将放置在目标上方向下看。高于地面的高度
 * 目标将是范围。标题将根据偏移量确定。如果标题不能
 * 由偏移量决定，标题将向北。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或图像层。您还可以传递一个承诺，该承诺解析为前面提到的类型之一。
 * @param {HeadingPitchRange} [offset]  在本地east-north-up参考系中与实体中心的偏移量。
 * @returns {Promise<boolean>} 一个Promise，如果缩放成功，则解析为true;如果当前场景中没有显示目标或缩放被取消，则解析为false。
 */
Viewer.prototype.zoomTo = function (target, offset) {
  const options = {
    offset: offset,
  };
  return zoomToOrFly(this, target, options, false);
};

/**
 * 将相机飞到提供的实体、实体或数据源。
 * 如果数据源仍在加载过程中或可视化仍在加载中，
 * 这个方法在执行飞行之前等待数据准备好。
 *
 * <p>偏移量是在以边界球中心为中心的本地东-北-上参考系中的头部/俯仰/范围。
 * 航向和俯仰角在当地的东-北-上参考系中定义。
 * 航向是从y轴到x轴增加的角度。螺距是x平面的旋转。积极的推销
 * 个角在平面的上方。负俯仰角在平面以下。距离是到中心的距离。如果范围是
 * 0，计算一个范围，使整个边界球可见。</p>
 *
 * <p>在2D中，必须有一个自上而下的视图。摄像机将放置在目标上方向下看。高于地面的高度
 * 目标将是范围。标题将根据偏移量确定。如果标题不能
 * 由偏移量决定，标题将向北。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或图像层。您还可以传递一个承诺，该承诺解析为前面提到的类型之一。
 * @param {object} [options] 对象，具有以下属性:
 * @param {number} [options.duration=3.0] 飞行时间以秒为单位。
 * @param {number} [options.maximumHeight] 飞行高峰时的最大高度。
 * @param {HeadingPitchRange} [options.offset] 在以目标为中心的本地east-north-up参考系中与目标的偏移量。
 * @returns {Promise<boolean>} 一个Promise，如果飞行成功，则解析为true;如果当前场景中没有显示目标或航班被取消，则解析为false。 //TODO: Cleanup entity mentions
 */
Viewer.prototype.flyTo = function (target, options) {
  return zoomToOrFly(this, target, options, true);
};

function zoomToOrFly(that, zoomTarget, options, isFlight) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(zoomTarget)) {
    throw new DeveloperError("zoomTarget is required.");
  }
  //>>includeEnd('debug');

  cancelZoom(that);

  //We can't actually perform the zoom until all visualization is ready and
  //bounding spheres have been computed.  Therefore we create and return
  //a deferred which will be resolved as part of the post-render step in the
  //frame that actually performs the zoom.
  const zoomPromise = new Promise((resolve) => {
    that._completeZoom = function (value) {
      resolve(value);
    };
  });
  that._zoomPromise = zoomPromise;
  that._zoomIsFlight = isFlight;
  that._zoomOptions = options;

  Promise.resolve(zoomTarget).then(function (zoomTarget) {
    //Only perform the zoom if it wasn't cancelled before the promise resolved.
    if (that._zoomPromise !== zoomPromise) {
      return;
    }

    //If the zoom target is a rectangular imagery in an ImageLayer
    if (zoomTarget instanceof ImageryLayer) {
      let rectanglePromise;

      if (defined(zoomTarget.imageryProvider)) {
        rectanglePromise = Promise.resolve(zoomTarget.getImageryRectangle());
      } else {
        rectanglePromise = new Promise((resolve) => {
          const removeListener = zoomTarget.readyEvent.addEventListener(() => {
            removeListener();
            resolve(zoomTarget.getImageryRectangle());
          });
        });
      }
      rectanglePromise
        .then(function (rectangle) {
          return computeFlyToLocationForRectangle(rectangle, that.scene);
        })
        .then(function (position) {
          //Only perform the zoom if it wasn't cancelled before the promise was resolved
          if (that._zoomPromise === zoomPromise) {
            that._zoomTarget = position;
          }
        });
      return;
    }

    if (
      zoomTarget instanceof Cesium3DTileset ||
      zoomTarget instanceof TimeDynamicPointCloud ||
      zoomTarget instanceof VoxelPrimitive
    ) {
      that._zoomTarget = zoomTarget;
      return;
    }

    //If the zoom target is a data source, and it's in the middle of loading, wait for it to finish loading.
    if (zoomTarget.isLoading && defined(zoomTarget.loadingEvent)) {
      const removeEvent = zoomTarget.loadingEvent.addEventListener(function () {
        removeEvent();

        //Only perform the zoom if it wasn't cancelled before the data source finished.
        if (that._zoomPromise === zoomPromise) {
          that._zoomTarget = zoomTarget.entities.values.slice(0);
        }
      });
      return;
    }

    //Zoom target is already an array, just copy it and return.
    if (Array.isArray(zoomTarget)) {
      that._zoomTarget = zoomTarget.slice(0);
      return;
    }

    //If zoomTarget is an EntityCollection, this will retrieve the array
    zoomTarget = defaultValue(zoomTarget.values, zoomTarget);

    //If zoomTarget is a DataSource, this will retrieve the array.
    if (defined(zoomTarget.entities)) {
      zoomTarget = zoomTarget.entities.values;
    }

    //Zoom target is already an array, just copy it and return.
    if (Array.isArray(zoomTarget)) {
      that._zoomTarget = zoomTarget.slice(0);
    } else {
      //Single entity
      that._zoomTarget = [zoomTarget];
    }
  });

  that.scene.requestRender();
  return zoomPromise;
}

function clearZoom(viewer) {
  viewer._zoomPromise = undefined;
  viewer._zoomTarget = undefined;
  viewer._zoomOptions = undefined;
}

function cancelZoom(viewer) {
  const zoomPromise = viewer._zoomPromise;
  if (defined(zoomPromise)) {
    clearZoom(viewer);
    viewer._completeZoom(false);
  }
}

/**
 * @private
 */
Viewer.prototype._postRender = function () {
  updateZoomTarget(this);
  updateTrackedEntity(this);
};

function updateZoomTarget(viewer) {
  const target = viewer._zoomTarget;
  if (!defined(target) || viewer.scene.mode === SceneMode.MORPHING) {
    return;
  }

  const scene = viewer.scene;
  const camera = scene.camera;
  const zoomOptions = defaultValue(viewer._zoomOptions, {});
  let options;
  function zoomToBoundingSphere(boundingSphere) {
    // If offset was originally undefined then give it base value instead of empty object
    if (!defined(zoomOptions.offset)) {
      zoomOptions.offset = new HeadingPitchRange(
        0.0,
        -0.5,
        boundingSphere.radius
      );
    }

    options = {
      offset: zoomOptions.offset,
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        viewer._completeZoom(true);
      },
      cancel: function () {
        viewer._completeZoom(false);
      },
    };

    if (viewer._zoomIsFlight) {
      camera.flyToBoundingSphere(target.boundingSphere, options);
    } else {
      camera.viewBoundingSphere(boundingSphere, zoomOptions.offset);
      camera.lookAtTransform(Matrix4.IDENTITY);

      // Finish the promise
      viewer._completeZoom(true);
    }

    clearZoom(viewer);
  }

  if (target instanceof TimeDynamicPointCloud) {
    if (defined(target.boundingSphere)) {
      zoomToBoundingSphere(target.boundingSphere);
      return;
    }

    // Otherwise, the first "frame" needs to have been rendered
    const removeEventListener = target.frameChanged.addEventListener(function (
      timeDynamicPointCloud
    ) {
      zoomToBoundingSphere(timeDynamicPointCloud.boundingSphere);
      removeEventListener();
    });
    return;
  }

  if (target instanceof Cesium3DTileset || target instanceof VoxelPrimitive) {
    zoomToBoundingSphere(target.boundingSphere);
    return;
  }

  // If zoomTarget was an ImageryLayer
  if (target instanceof Cartographic) {
    options = {
      destination: scene.ellipsoid.cartographicToCartesian(target),
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        viewer._completeZoom(true);
      },
      cancel: function () {
        viewer._completeZoom(false);
      },
    };

    if (viewer._zoomIsFlight) {
      camera.flyTo(options);
    } else {
      camera.setView(options);
      viewer._completeZoom(true);
    }
    clearZoom(viewer);
    return;
  }

  const entities = target;

  const boundingSpheres = [];
  for (let i = 0, len = entities.length; i < len; i++) {
    const state = viewer._dataSourceDisplay.getBoundingSphere(
      entities[i],
      false,
      boundingSphereScratch
    );

    if (state === BoundingSphereState.PENDING) {
      return;
    } else if (state !== BoundingSphereState.FAILED) {
      boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
    }
  }

  if (boundingSpheres.length === 0) {
    cancelZoom(viewer);
    return;
  }

  // Stop tracking the current entity.
  viewer.trackedEntity = undefined;

  const boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);

  if (!viewer._zoomIsFlight) {
    camera.viewBoundingSphere(boundingSphere, zoomOptions.offset);
    camera.lookAtTransform(Matrix4.IDENTITY);
    clearZoom(viewer);
    viewer._completeZoom(true);
  } else {
    clearZoom(viewer);
    camera.flyToBoundingSphere(boundingSphere, {
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        viewer._completeZoom(true);
      },
      cancel: function () {
        viewer._completeZoom(false);
      },
      offset: zoomOptions.offset,
    });
  }
}

function updateTrackedEntity(viewer) {
  if (!viewer._needTrackedEntityUpdate) {
    return;
  }

  const trackedEntity = viewer._trackedEntity;
  const currentTime = viewer.clock.currentTime;

  //Verify we have a current position at this time. This is only triggered if a position
  //has become undefined after trackedEntity is set but before the boundingSphere has been
  //computed. In this case, we will track the entity once it comes back into existence.
  const currentPosition = Property.getValueOrUndefined(
    trackedEntity.position,
    currentTime
  );

  if (!defined(currentPosition)) {
    return;
  }

  const scene = viewer.scene;

  const state = viewer._dataSourceDisplay.getBoundingSphere(
    trackedEntity,
    false,
    boundingSphereScratch
  );
  if (state === BoundingSphereState.PENDING) {
    return;
  }

  const sceneMode = scene.mode;
  if (
    sceneMode === SceneMode.COLUMBUS_VIEW ||
    sceneMode === SceneMode.SCENE2D
  ) {
    scene.screenSpaceCameraController.enableTranslate = false;
  }

  if (
    sceneMode === SceneMode.COLUMBUS_VIEW ||
    sceneMode === SceneMode.SCENE3D
  ) {
    scene.screenSpaceCameraController.enableTilt = false;
  }

  const bs =
    state !== BoundingSphereState.FAILED ? boundingSphereScratch : undefined;
  viewer._entityView = new EntityView(trackedEntity, scene, scene.ellipsoid);
  viewer._entityView.update(currentTime, bs);
  viewer._needTrackedEntityUpdate = false;
}

/**
 * 为查看器实例增加附加功能的函数。
 * @callback Viewer.ViewerMixin
 * @param {Viewer} viewer 查看器实例。
 * @param {object} options 要传递给mixin函数的Options对象。
 *
 * @see Viewer#extend
 */
export default Viewer;
