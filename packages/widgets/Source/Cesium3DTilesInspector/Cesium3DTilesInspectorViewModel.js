import {
  Check,
  Color,
  defined,
  destroyObject,
  Cesium3DTileColorBlendMode,
  Cesium3DTileFeature,
  Cesium3DTilePass,
  Cesium3DTileset,
  Cesium3DTileStyle,
  PerformanceDisplay,
  ResourceCache,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";

function getPickTileset(viewModel) {
  return function (e) {
    const pick = viewModel._scene.pick(e.position);
    if (defined(pick) && pick.primitive instanceof Cesium3DTileset) {
      viewModel.tileset = pick.primitive;
    }
    viewModel.pickActive = false;
  };
}

function selectTilesetOnHover(viewModel, value) {
  if (value) {
    viewModel._eventHandler.setInputAction(function (e) {
      const pick = viewModel._scene.pick(e.endPosition);
      if (defined(pick) && pick.primitive instanceof Cesium3DTileset) {
        viewModel.tileset = pick.primitive;
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);
  } else {
    viewModel._eventHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);

    // Restore hover-over selection to its current value
    // eslint-disable-next-line no-self-assign
    viewModel.picking = viewModel.picking;
  }
}

const stringOptions = {
  maximumFractionDigits: 3,
};

function formatMemoryString(memorySizeInBytes) {
  const memoryInMegabytes = memorySizeInBytes / 1048576;
  if (memoryInMegabytes < 1.0) {
    return memoryInMegabytes.toLocaleString(undefined, stringOptions);
  }
  return Math.round(memoryInMegabytes).toLocaleString();
}

function getStatistics(tileset, isPick) {
  if (!defined(tileset)) {
    return "";
  }

  const statistics = isPick
    ? tileset._statisticsPerPass[Cesium3DTilePass.PICK]
    : tileset._statisticsPerPass[Cesium3DTilePass.RENDER];

  // Since the pick pass uses a smaller frustum around the pixel of interest,
  // the statistics will be different than the normal render pass.
  let s = '<ul class="cesium-cesiumInspector-statistics">';
  s +=
    // --- Rendering statistics
    `<li><strong>Visited: </strong>${statistics.visited.toLocaleString()}</li>` +
    // Number of commands returned is likely to be higher than the number of tiles selected
    // because of tiles that create multiple commands.
    `<li><strong>Selected: </strong>${statistics.selected.toLocaleString()}</li>` +
    // Number of commands executed is likely to be higher because of commands overlapping
    // multiple frustums.
    `<li><strong>Commands: </strong>${statistics.numberOfCommands.toLocaleString()}</li>`;
  s += "</ul>";
  if (!isPick) {
    s += '<ul class="cesium-cesiumInspector-statistics">';
    s +=
      // --- Cache/loading statistics
      `<li><strong>Requests: </strong>${statistics.numberOfPendingRequests.toLocaleString()}</li>` +
      `<li><strong>Attempted: </strong>${statistics.numberOfAttemptedRequests.toLocaleString()}</li>` +
      `<li><strong>Processing: </strong>${statistics.numberOfTilesProcessing.toLocaleString()}</li>` +
      `<li><strong>Content Ready: </strong>${statistics.numberOfTilesWithContentReady.toLocaleString()}</li>` +
      // Total number of tiles includes tiles without content, so "Ready" may never reach
      // "Total."  Total also will increase when a tile with a tileset JSON content is loaded.
      `<li><strong>Total: </strong>${statistics.numberOfTilesTotal.toLocaleString()}</li>`;
    s += "</ul>";
    s += '<ul class="cesium-cesiumInspector-statistics">';
    s +=
      // --- Features statistics
      `<li><strong>Features Selected: </strong>${statistics.numberOfFeaturesSelected.toLocaleString()}</li>` +
      `<li><strong>Features Loaded: </strong>${statistics.numberOfFeaturesLoaded.toLocaleString()}</li>` +
      `<li><strong>Points Selected: </strong>${statistics.numberOfPointsSelected.toLocaleString()}</li>` +
      `<li><strong>Points Loaded: </strong>${statistics.numberOfPointsLoaded.toLocaleString()}</li>` +
      `<li><strong>Triangles Selected: </strong>${statistics.numberOfTrianglesSelected.toLocaleString()}</li>`;
    s += "</ul>";
    s += '<ul class="cesium-cesiumInspector-statistics">';
    s +=
      // --- Styling statistics
      `<li><strong>Tiles styled: </strong>${statistics.numberOfTilesStyled.toLocaleString()}</li>` +
      `<li><strong>Features styled: </strong>${statistics.numberOfFeaturesStyled.toLocaleString()}</li>`;
    s += "</ul>";
    s += '<ul class="cesium-cesiumInspector-statistics">';
    s +=
      // --- Optimization statistics
      `<li><strong>Children Union Culled: </strong>${statistics.numberOfTilesCulledWithChildrenUnion.toLocaleString()}</li>`;
    s += "</ul>";
    s += '<ul class="cesium-cesiumInspector-statistics">';
    s +=
      // --- Memory statistics
      `<li><strong>Geometry Memory (MB): </strong>${formatMemoryString(
        statistics.geometryByteLength,
      )}</li>` +
      `<li><strong>Texture Memory (MB): </strong>${formatMemoryString(
        statistics.texturesByteLength,
      )}</li>` +
      `<li><strong>Batch Table Memory (MB): </strong>${formatMemoryString(
        statistics.batchTableByteLength,
      )}</li>`;
    s += "</ul>";
  }
  return s;
}

function getResourceCacheStatistics() {
  const statistics = ResourceCache.statistics;

  return `
  <ul class="cesium-cesiumInspector-statistics">
    <li><strong>Geometry Memory (MB): </strong>${formatMemoryString(
      statistics.geometryByteLength,
    )}</li>
    <li><strong>Texture Memory (MB): </strong>${formatMemoryString(
      statistics.texturesByteLength,
    )}</li>
  </ul>
  `;
}

const colorBlendModes = [
  {
    text: "Highlight",
    value: Cesium3DTileColorBlendMode.HIGHLIGHT,
  },
  {
    text: "Replace",
    value: Cesium3DTileColorBlendMode.REPLACE,
  },
  {
    text: "Mix",
    value: Cesium3DTileColorBlendMode.MIX,
  },
];

const highlightColor = new Color(1.0, 1.0, 0.0, 0.4);
const scratchColor = new Color();
const oldColor = new Color();

/**
 * 视图模型 {@link Cesium3DTilesInspector}.
 * @alias Cesium3DTilesInspectorViewModel
 * @constructor
 *
 * @param {Scene} scene 要使用的场景实例。
 * @param {HTMLElement} performanceContainer 用于显示性能的容器
 */
function Cesium3DTilesInspectorViewModel(scene, performanceContainer) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("scene", scene);
  Check.typeOf.object("performanceContainer", performanceContainer);
  //>>includeEnd('debug');

  const that = this;
  const canvas = scene.canvas;
  this._eventHandler = new ScreenSpaceEventHandler(canvas);
  this._scene = scene;
  this._performanceContainer = performanceContainer;
  this._canvas = canvas;

  this._performanceDisplay = new PerformanceDisplay({
    container: performanceContainer,
  });

  this._statisticsText = "";
  this._pickStatisticsText = "";
  this._resourceCacheStatisticsText = "";
  this._editorError = "";

  /**
   *  获取或设置启用性能显示的标志。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.performance = false;

  /**
   *  获取或设置条件为显示统计信息.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default true
   */
  this.showStatistics = true;

  /**
   *  获取或设置条件为显示拾取统计信息.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default true
   */
  this.showPickStatistics = true;

  /**
   *  获取或设置条件为显示资源缓存统计信息. 这个属性是
   * 可观测的.
   *
   * @type {boolean}
   * @default false
   */
  this.showResourceCacheStatistics = false;

  /**
   *  获取或设置条件为 显示inspector.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default true
   */
  this.inspectorVisible = true;

  /**
   *  获取或设置条件为 显示tileset部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.tilesetVisible = false;

  /**
   *  获取或设置条件为 显示display部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.displayVisible = false;

  /**
   *  获取或设置条件为 显示update部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.updateVisible = false;

  /**
   *  获取或设置条件为 显示logging部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.loggingVisible = false;

  /**
   *  获取或设置条件为 显示style部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.styleVisible = false;

  /**
   *  获取或设置条件为 显示tile info部分。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.tileDebugLabelsVisible = false;

  /**
   *  获取或设置条件为 显示optimization info部分。 这个属性是可观察的。
   *
   * @type {boolean}
   * @default false;
   */
  this.optimizationVisible = false;

  /**
   * 获取或设置JSON for the tileset style.  这个属性是可观察的。
   *
   * @type {string}
   * @default '{}'
   */
  this.styleString = "{}";

  /**
   *  获取或设置tileset enableDebugWireframe属性的JSON。 这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.hasEnabledWireframe = false;

  this._tileset = undefined;
  this._feature = undefined;
  this._tile = undefined;

  knockout.track(this, [
    "performance",
    "inspectorVisible",
    "_statisticsText",
    "_pickStatisticsText",
    "_resourceCacheStatisticsText",
    "_editorError",
    "showPickStatistics",
    "showStatistics",
    "showResourceCacheStatistics",
    "tilesetVisible",
    "displayVisible",
    "updateVisible",
    "loggingVisible",
    "styleVisible",
    "optimizationVisible",
    "tileDebugLabelsVisible",
    "styleString",
    "_feature",
    "_tile",
    "_tileset",
    "hasEnabledWireframe",
  ]);

  this._properties = knockout.observable({});
  /**
   * 获取名称 tileset的属性.  这个属性是可观察的。
   * @type {string[]}
   * @readonly
   */
  this.properties = [];
  knockout.defineProperty(this, "properties", function () {
    const names = [];
    const properties = that._properties();
    for (const prop in properties) {
      if (properties.hasOwnProperty(prop)) {
        names.push(prop);
      }
    }
    return names;
  });

  const dynamicScreenSpaceError = knockout.observable();
  knockout.defineProperty(this, "dynamicScreenSpaceError", {
    get: function () {
      return dynamicScreenSpaceError();
    },
    set: function (value) {
      dynamicScreenSpaceError(value);
      if (defined(that._tileset)) {
        that._tileset.dynamicScreenSpaceError = value;
      }
    },
  });
  /**
   *  获取或设置条件为 启用动态屏幕空间错误.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.dynamicScreenSpaceError = false;

  const colorBlendMode = knockout.observable();
  knockout.defineProperty(this, "colorBlendMode", {
    get: function () {
      return colorBlendMode();
    },
    set: function (value) {
      colorBlendMode(value);
      if (defined(that._tileset)) {
        that._tileset.colorBlendMode = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置颜色混合模式。  这个属性是可观察的。
   *
   * @type {Cesium3DTileColorBlendMode}
   * @default Cesium3DTileColorBlendMode.HIGHLIGHT
   */
  this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

  const showOnlyPickedTileDebugLabel = knockout.observable();
  const picking = knockout.observable();
  knockout.defineProperty(this, "picking", {
    get: function () {
      return picking();
    },
    set: function (value) {
      picking(value);
      if (value) {
        that._eventHandler.setInputAction(function (e) {
          const picked = scene.pick(e.endPosition);
          if (picked instanceof Cesium3DTileFeature) {
            // Picked a feature
            that.feature = picked;
            that.tile = picked.content.tile;
          } else if (defined(picked) && defined(picked.content)) {
            // Picked a tile
            that.feature = undefined;
            that.tile = picked.content.tile;
          } else {
            // Picked nothing
            that.feature = undefined;
            that.tile = undefined;
          }
          if (!defined(that._tileset)) {
            return;
          }
          if (
            showOnlyPickedTileDebugLabel &&
            defined(picked) &&
            defined(picked.content)
          ) {
            let position;
            if (scene.pickPositionSupported) {
              position = scene.pickPosition(e.endPosition);
              if (defined(position)) {
                that._tileset.debugPickPosition = position;
              }
            }
            that._tileset.debugPickedTile = picked.content.tile;
          } else {
            that._tileset.debugPickedTile = undefined;
          }
          that._scene.requestRender();
        }, ScreenSpaceEventType.MOUSE_MOVE);
      } else {
        that.feature = undefined;
        that.tile = undefined;
        that._eventHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
      }
    },
  });
  /**
   *  获取或设置条件为 启用 picking.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default true
   */
  this.picking = true;

  const colorize = knockout.observable();
  knockout.defineProperty(this, "colorize", {
    get: function () {
      return colorize();
    },
    set: function (value) {
      colorize(value);
      if (defined(that._tileset)) {
        that._tileset.debugColorizeTiles = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为 colorize tiles.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.colorize = false;

  const wireframe = knockout.observable();
  knockout.defineProperty(this, "wireframe", {
    get: function () {
      return wireframe();
    },
    set: function (value) {
      wireframe(value);
      if (defined(that._tileset)) {
        that._tileset.debugWireframe = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为用线框绘制.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.wireframe = false;

  const showBoundingVolumes = knockout.observable();
  knockout.defineProperty(this, "showBoundingVolumes", {
    get: function () {
      return showBoundingVolumes();
    },
    set: function (value) {
      showBoundingVolumes(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowBoundingVolume = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为显示跳跃量.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showBoundingVolumes = false;

  const showContentBoundingVolumes = knockout.observable();
  knockout.defineProperty(this, "showContentBoundingVolumes", {
    get: function () {
      return showContentBoundingVolumes();
    },
    set: function (value) {
      showContentBoundingVolumes(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowContentBoundingVolume = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为显示volumes内容.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showContentBoundingVolumes = false;

  const showRequestVolumes = knockout.observable();
  knockout.defineProperty(this, "showRequestVolumes", {
    get: function () {
      return showRequestVolumes();
    },
    set: function (value) {
      showRequestVolumes(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowViewerRequestVolume = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为 显示 request volumes.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showRequestVolumes = false;

  const freezeFrame = knockout.observable();
  knockout.defineProperty(this, "freezeFrame", {
    get: function () {
      return freezeFrame();
    },
    set: function (value) {
      freezeFrame(value);
      if (defined(that._tileset)) {
        that._tileset.debugFreezeFrame = value;
        that._scene.debugShowFrustumPlanes = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为暂停更新.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.freezeFrame = false;

  knockout.defineProperty(this, "showOnlyPickedTileDebugLabel", {
    get: function () {
      return showOnlyPickedTileDebugLabel();
    },
    set: function (value) {
      showOnlyPickedTileDebugLabel(value);
      if (defined(that._tileset)) {
        that._tileset.debugPickedTileLabelOnly = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为只显示当前选中的tile的调试标签.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showOnlyPickedTileDebugLabel = false;

  const showGeometricError = knockout.observable();
  knockout.defineProperty(this, "showGeometricError", {
    get: function () {
      return showGeometricError();
    },
    set: function (value) {
      showGeometricError(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowGeometricError = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为显示tile几何误差.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showGeometricError = false;

  const showRenderingStatistics = knockout.observable();
  knockout.defineProperty(this, "showRenderingStatistics", {
    get: function () {
      return showRenderingStatistics();
    },
    set: function (value) {
      showRenderingStatistics(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowRenderingStatistics = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *显示每个tile所使用的命令、点、三角形和特征的数量。  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showRenderingStatistics = false;

  const showMemoryUsage = knockout.observable();
  knockout.defineProperty(this, "showMemoryUsage", {
    get: function () {
      return showMemoryUsage();
    },
    set: function (value) {
      showMemoryUsage(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowMemoryUsage = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   * 显示每个tile所使用的内存.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showMemoryUsage = false;

  const showUrl = knockout.observable();
  knockout.defineProperty(this, "showUrl", {
    get: function () {
      return showUrl();
    },
    set: function (value) {
      showUrl(value);
      if (defined(that._tileset)) {
        that._tileset.debugShowUrl = value;
        that._scene.requestRender();
      }
    },
  });
  /**
   *  获取或设置条件为显示tile url.  这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.showUrl = false;

  const maximumScreenSpaceError = knockout.observable();
  knockout.defineProperty(this, "maximumScreenSpaceError", {
    get: function () {
      return maximumScreenSpaceError();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        maximumScreenSpaceError(value);
        if (defined(that._tileset)) {
          that._tileset.maximumScreenSpaceError = value;
        }
      }
    },
  });
  /**
   *  获取或设置最大屏幕空间错误。  这个属性是可观察的。
   *
   * @type {number}
   * @default 16
   */
  this.maximumScreenSpaceError = 16;

  const dynamicScreenSpaceErrorDensity = knockout.observable();
  knockout.defineProperty(this, "dynamicScreenSpaceErrorDensity", {
    get: function () {
      return dynamicScreenSpaceErrorDensity();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        dynamicScreenSpaceErrorDensity(value);
        if (defined(that._tileset)) {
          that._tileset.dynamicScreenSpaceErrorDensity = value;
        }
      }
    },
  });
  /**
   *  获取或设置动态屏幕空间错误密度。  这个属性是可观察的。
   *
   * @type {number}
   * @default 2.0e-4
   */
  this.dynamicScreenSpaceErrorDensity = 2.0e-4;

  /**
   *  获取或设置动态屏幕空间错误密度滑块值。
   * 这允许滑块是指数型的，因为值往往更接近于0而不是1。
   * 这个属性是可观察的。
   *
   * @type {number}
   * @default 2.0e-4
   */
  this.dynamicScreenSpaceErrorDensitySliderValue = undefined;
  knockout.defineProperty(this, "dynamicScreenSpaceErrorDensitySliderValue", {
    get: function () {
      return Math.pow(dynamicScreenSpaceErrorDensity(), 1 / 6);
    },
    set: function (value) {
      const scaledValue = Math.pow(value, 6);
      dynamicScreenSpaceErrorDensity(scaledValue);
      if (defined(that._tileset)) {
        that._tileset.dynamicScreenSpaceErrorDensity = scaledValue;
      }
    },
  });

  const dynamicScreenSpaceErrorFactor = knockout.observable();
  knockout.defineProperty(this, "dynamicScreenSpaceErrorFactor", {
    get: function () {
      return dynamicScreenSpaceErrorFactor();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        dynamicScreenSpaceErrorFactor(value);
        if (defined(that._tileset)) {
          that._tileset.dynamicScreenSpaceErrorFactor = value;
        }
      }
    },
  });
  /**
   *  获取或设置动态屏幕空间错误因子。  这个属性是可观察的。
   *
   * @type {number}
   * @default 24.0
   */
  this.dynamicScreenSpaceErrorFactor = 24.0;

  const pickTileset = getPickTileset(this);
  const pickActive = knockout.observable();
  knockout.defineProperty(this, "pickActive", {
    get: function () {
      return pickActive();
    },
    set: function (value) {
      pickActive(value);
      if (value) {
        that._eventHandler.setInputAction(
          pickTileset,
          ScreenSpaceEventType.LEFT_CLICK,
        );
      } else {
        that._eventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      }
    },
  });

  const pointCloudShading = knockout.observable();
  knockout.defineProperty(this, "pointCloudShading", {
    get: function () {
      return pointCloudShading();
    },
    set: function (value) {
      pointCloudShading(value);
      if (defined(that._tileset)) {
        that._tileset.pointCloudShading.attenuation = value;
      }
    },
  });
  /**
   *  获取或设置条件为启用点云阴影。 这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.pointCloudShading = false;

  const geometricErrorScale = knockout.observable();
  knockout.defineProperty(this, "geometricErrorScale", {
    get: function () {
      return geometricErrorScale();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        geometricErrorScale(value);
        if (defined(that._tileset)) {
          that._tileset.pointCloudShading.geometricErrorScale = value;
        }
      }
    },
  });
  /**
   * 获取或设置几何误差标度.  这个属性是可观察的。
   *
   * @type {number}
   * @default 1.0
   */
  this.geometricErrorScale = 1.0;

  const maximumAttenuation = knockout.observable();
  knockout.defineProperty(this, "maximumAttenuation", {
    get: function () {
      return maximumAttenuation();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        maximumAttenuation(value);
        if (defined(that._tileset)) {
          that._tileset.pointCloudShading.maximumAttenuation =
            value === 0 ? undefined : value;
        }
      }
    },
  });
  /**
   * 获取或设置最大的衰减。 这个属性是可观察的。
   *
   * @type {number}
   * @default 0
   */
  this.maximumAttenuation = 0;

  const baseResolution = knockout.observable();
  knockout.defineProperty(this, "baseResolution", {
    get: function () {
      return baseResolution();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        baseResolution(value);
        if (defined(that._tileset)) {
          that._tileset.pointCloudShading.baseResolution =
            value === 0 ? undefined : value;
        }
      }
    },
  });
  /**
   * 获取或设置基本解决。 这个属性是可观察的。
   *
   * @type {number}
   * @default 0
   */
  this.baseResolution = 0;

  const eyeDomeLighting = knockout.observable();
  knockout.defineProperty(this, "eyeDomeLighting", {
    get: function () {
      return eyeDomeLighting();
    },
    set: function (value) {
      eyeDomeLighting(value);
      if (defined(that._tileset)) {
        that._tileset.pointCloudShading.eyeDomeLighting = value;
      }
    },
  });
  /**
   *  获取或设置条件为启用眼穹照明。 这个属性是可观察的。
   *
   * @type {boolean}
   * @default false
   */
  this.eyeDomeLighting = false;

  const eyeDomeLightingStrength = knockout.observable();
  knockout.defineProperty(this, "eyeDomeLightingStrength", {
    get: function () {
      return eyeDomeLightingStrength();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        eyeDomeLightingStrength(value);
        if (defined(that._tileset)) {
          that._tileset.pointCloudShading.eyeDomeLightingStrength = value;
        }
      }
    },
  });
  /**
   * 获取或设置眼穹照明强度。  这个属性是可观察的。
   *
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingStrength = 1.0;

  const eyeDomeLightingRadius = knockout.observable();
  knockout.defineProperty(this, "eyeDomeLightingRadius", {
    get: function () {
      return eyeDomeLightingRadius();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        eyeDomeLightingRadius(value);
        if (defined(that._tileset)) {
          that._tileset.pointCloudShading.eyeDomeLightingRadius = value;
        }
      }
    },
  });
  /**
   * 获取或设置眼穹顶照明半径。  这个属性是可观察的。
   *
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingRadius = 1.0;

  /**
   * 获取或设置选择状态
   *
   * @type {boolean}
   * @default false
   */
  this.pickActive = false;

  const skipLevelOfDetail = knockout.observable();
  knockout.defineProperty(this, "skipLevelOfDetail", {
    get: function () {
      return skipLevelOfDetail();
    },
    set: function (value) {
      skipLevelOfDetail(value);
      if (defined(that._tileset)) {
        that._tileset.skipLevelOfDetail = value;
      }
    },
  });
  /**
   *  获取或设置条件为确定在遍历期间是否应用细节跳过级别。
   * 这个属性是可观察的。
   * @type {boolean}
   * @default true
   */
  this.skipLevelOfDetail = true;

  const skipScreenSpaceErrorFactor = knockout.observable();
  knockout.defineProperty(this, "skipScreenSpaceErrorFactor", {
    get: function () {
      return skipScreenSpaceErrorFactor();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        skipScreenSpaceErrorFactor(value);
        if (defined(that._tileset)) {
          that._tileset.skipScreenSpaceErrorFactor = value;
        }
      }
    },
  });
  /**
   * 获取或设置定义要跳过的最小屏幕空间错误的乘数。 这个属性是可观察的。
   * @type {number}
   * @default 16
   */
  this.skipScreenSpaceErrorFactor = 16;

  const baseScreenSpaceError = knockout.observable();
  knockout.defineProperty(this, "baseScreenSpaceError", {
    get: function () {
      return baseScreenSpaceError();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        baseScreenSpaceError(value);
        if (defined(that._tileset)) {
          that._tileset.baseScreenSpaceError = value;
        }
      }
    },
  });
  /**
   * 获取或设置在跳过细节级别之前必须达到的屏幕空间错误。 这个属性是可观察的。
   * @type {number}
   * @default 1024
   */
  this.baseScreenSpaceError = 1024;

  const skipLevels = knockout.observable();
  knockout.defineProperty(this, "skipLevels", {
    get: function () {
      return skipLevels();
    },
    set: function (value) {
      value = Number(value);
      if (!isNaN(value)) {
        skipLevels(value);
        if (defined(that._tileset)) {
          that._tileset.skipLevels = value;
        }
      }
    },
  });
  /**
   * 获取或设置常量定义加载tiles时要跳过的最小关卡数。 这个属性是可观察的。
   * @type {number}
   * @default 1
   */
  this.skipLevels = 1;

  const immediatelyLoadDesiredLevelOfDetail = knockout.observable();
  knockout.defineProperty(this, "immediatelyLoadDesiredLevelOfDetail", {
    get: function () {
      return immediatelyLoadDesiredLevelOfDetail();
    },
    set: function (value) {
      immediatelyLoadDesiredLevelOfDetail(value);
      if (defined(that._tileset)) {
        that._tileset.immediatelyLoadDesiredLevelOfDetail = value;
      }
    },
  });
  /**
   * 获取或设置，当条件为true时，只下载满足最大屏幕空间错误的磁贴。
   * 这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.immediatelyLoadDesiredLevelOfDetail = false;

  const loadSiblings = knockout.observable();
  knockout.defineProperty(this, "loadSiblings", {
    get: function () {
      return loadSiblings();
    },
    set: function (value) {
      loadSiblings(value);
      if (defined(that._tileset)) {
        that._tileset.loadSiblings = value;
      }
    },
  });
  /**
   * 获取或设置条件选择，用于确定在遍历期间是否总是下载可见磁贴的同级。
   * 这个属性是可观察的
   * @type {boolean}
   * @default false
   */
  this.loadSiblings = false;

  this._style = undefined;
  this._shouldStyle = false;
  this._definedProperties = [
    "properties",
    "dynamicScreenSpaceError",
    "colorBlendMode",
    "picking",
    "colorize",
    "wireframe",
    "showBoundingVolumes",
    "showContentBoundingVolumes",
    "showRequestVolumes",
    "freezeFrame",
    "maximumScreenSpaceError",
    "dynamicScreenSpaceErrorDensity",
    "baseScreenSpaceError",
    "skipScreenSpaceErrorFactor",
    "skipLevelOfDetail",
    "skipLevels",
    "immediatelyLoadDesiredLevelOfDetail",
    "loadSiblings",
    "dynamicScreenSpaceErrorDensitySliderValue",
    "dynamicScreenSpaceErrorFactor",
    "pickActive",
    "showOnlyPickedTileDebugLabel",
    "showGeometricError",
    "showRenderingStatistics",
    "showMemoryUsage",
    "showUrl",
    "pointCloudShading",
    "geometricErrorScale",
    "maximumAttenuation",
    "baseResolution",
    "eyeDomeLighting",
    "eyeDomeLightingStrength",
    "eyeDomeLightingRadius",
  ];
  this._removePostRenderEvent = scene.postRender.addEventListener(function () {
    that._update();
  });

  if (!defined(this._tileset)) {
    selectTilesetOnHover(this, true);
  }
}

Object.defineProperties(Cesium3DTilesInspectorViewModel.prototype, {
  /**
   * 得到场景
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {Scene}
   * @readonly
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },
  /**
   * 获取性能容器。
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {HTMLElement}
   * @readonly
   */
  performanceContainer: {
    get: function () {
      return this._performanceContainer;
    },
  },

  /**
   * 获取统计信息文本。 这个属性是可观察的。
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {string}
   * @readonly
   */
  statisticsText: {
    get: function () {
      return this._statisticsText;
    },
  },
  /**
   * 获取拾取统计信息文本。  这个属性是可观察的。
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {string}
   * @readonly
   */
  pickStatisticsText: {
    get: function () {
      return this._pickStatisticsText;
    },
  },

  /**
   * 获取资源缓存统计信息文本。 这个属性是可观察的。
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {string}
   * @readonly
   */
  resourceCacheStatisticsText: {
    get: function () {
      return this._resourceCacheStatisticsText;
    },
  },

  /**
   * 获取可用的混合模式
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {Object[]}
   * @readonly
   */
  colorBlendModes: {
    get: function () {
      return colorBlendModes;
    },
  },

  /**
   * 获取编辑器错误消息
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {string}
   * @readonly
   */
  editorError: {
    get: function () {
      return this._editorError;
    },
  },

  /**
   * 获取或设置tileset的视图模型
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {Cesium3DTileset}
   */
  tileset: {
    get: function () {
      return this._tileset;
    },
    set: function (tileset) {
      this._tileset = tileset;
      this._style = undefined;
      this.styleString = "{}";
      this.feature = undefined;
      this.tile = undefined;

      if (defined(tileset)) {
        this._properties(tileset.properties);

        // update tileset with existing settings
        const settings = [
          "colorize",
          "wireframe",
          "showBoundingVolumes",
          "showContentBoundingVolumes",
          "showRequestVolumes",
          "freezeFrame",
          "showOnlyPickedTileDebugLabel",
          "showGeometricError",
          "showRenderingStatistics",
          "showMemoryUsage",
          "showUrl",
        ];
        const length = settings.length;
        for (let i = 0; i < length; ++i) {
          const setting = settings[i];
          //eslint-disable-next-line no-self-assign
          this[setting] = this[setting];
        }

        // update view model with existing tileset settings
        this.maximumScreenSpaceError = tileset.maximumScreenSpaceError;
        this.dynamicScreenSpaceError = tileset.dynamicScreenSpaceError;
        this.dynamicScreenSpaceErrorDensity =
          tileset.dynamicScreenSpaceErrorDensity;
        this.dynamicScreenSpaceErrorFactor =
          tileset.dynamicScreenSpaceErrorFactor;
        this.colorBlendMode = tileset.colorBlendMode;
        this.skipLevelOfDetail = tileset.skipLevelOfDetail;
        this.skipScreenSpaceErrorFactor = tileset.skipScreenSpaceErrorFactor;
        this.baseScreenSpaceError = tileset.baseScreenSpaceError;
        this.skipLevels = tileset.skipLevels;
        this.immediatelyLoadDesiredLevelOfDetail =
          tileset.immediatelyLoadDesiredLevelOfDetail;
        this.loadSiblings = tileset.loadSiblings;
        this.hasEnabledWireframe = tileset._enableDebugWireframe;

        const pointCloudShading = tileset.pointCloudShading;
        this.pointCloudShading = pointCloudShading.attenuation;
        this.geometricErrorScale = pointCloudShading.geometricErrorScale;
        this.maximumAttenuation = pointCloudShading.maximumAttenuation
          ? pointCloudShading.maximumAttenuation
          : 0.0;
        this.baseResolution = pointCloudShading.baseResolution
          ? pointCloudShading.baseResolution
          : 0.0;
        this.eyeDomeLighting = pointCloudShading.eyeDomeLighting;
        this.eyeDomeLightingStrength =
          pointCloudShading.eyeDomeLightingStrength;
        this.eyeDomeLightingRadius = pointCloudShading.eyeDomeLightingRadius;

        this._scene.requestRender();
      } else {
        this._properties({});
      }

      this._statisticsText = getStatistics(tileset, false);
      this._pickStatisticsText = getStatistics(tileset, true);
      this._resourceCacheStatisticsText = getResourceCacheStatistics();
      selectTilesetOnHover(this, false);
    },
  },

  /**
   * 获取视图模型的当前特性。
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {Cesium3DTileFeature}
   */
  feature: {
    get: function () {
      return this._feature;
    },
    set: function (feature) {
      if (this._feature === feature) {
        return;
      }
      const currentFeature = this._feature;
      if (defined(currentFeature) && !currentFeature.content.isDestroyed()) {
        // Restore original color to feature that is no longer selected
        if (!this.colorize && defined(this._style)) {
          currentFeature.color = defined(this._style.color)
            ? this._style.color.evaluateColor(currentFeature, scratchColor)
            : Color.WHITE;
        } else {
          currentFeature.color = oldColor;
        }
        this._scene.requestRender();
      }
      if (defined(feature)) {
        // Highlight new feature
        Color.clone(feature.color, oldColor);
        feature.color = highlightColor;
        this._scene.requestRender();
      }
      this._feature = feature;
    },
  },

  /**
   * 获取视图模型的当前平铺
   * @memberof Cesium3DTilesInspectorViewModel.prototype
   * @type {Cesium3DTile}
   */
  tile: {
    get: function () {
      return this._tile;
    },
    set: function (tile) {
      if (this._tile === tile) {
        return;
      }
      const currentTile = this._tile;

      if (
        defined(currentTile) &&
        !currentTile.isDestroyed() &&
        !hasFeatures(currentTile.content)
      ) {
        // Restore original color to tile that is no longer selected
        currentTile.color = oldColor;
        this._scene.requestRender();
      }

      if (defined(tile) && !hasFeatures(tile.content)) {
        // Highlight new tile
        Color.clone(tile.color, oldColor);
        tile.color = highlightColor;
        this._scene.requestRender();
      }
      this._tile = tile;
    },
  },
});

function hasFeatures(content) {
  if (!defined(content)) {
    return false;
  }

  if (content.featuresLength > 0) {
    return true;
  }
  const innerContents = content.innerContents;
  if (defined(innerContents)) {
    const length = innerContents.length;
    for (let i = 0; i < length; ++i) {
      if (!hasFeatures(innerContents[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * 切换拾取图块设置模式
 */
Cesium3DTilesInspectorViewModel.prototype.togglePickTileset = function () {
  this.pickActive = !this.pickActive;
};

/**
 * 切换检查器的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleInspector = function () {
  this.inspectorVisible = !this.inspectorVisible;
};

/**
 * 切换磁贴集部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleTileset = function () {
  this.tilesetVisible = !this.tilesetVisible;
};

/**
 * 切换显示部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleDisplay = function () {
  this.displayVisible = !this.displayVisible;
};

/**
 * 切换更新部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleUpdate = function () {
  this.updateVisible = !this.updateVisible;
};

/**
 * 切换日志记录部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleLogging = function () {
  this.loggingVisible = !this.loggingVisible;
};

/**
 * 切换样式部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleStyle = function () {
  this.styleVisible = !this.styleVisible;
};

/**
 * 切换tile Debug Info部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleTileDebugLabels = function () {
  this.tileDebugLabelsVisible = !this.tileDebugLabelsVisible;
};

/**
 * 切换优化部分的可见性
 */
Cesium3DTilesInspectorViewModel.prototype.toggleOptimization = function () {
  this.optimizationVisible = !this.optimizationVisible;
};

/**
 *  修剪tile缓存
 */
Cesium3DTilesInspectorViewModel.prototype.trimTilesCache = function () {
  if (defined(this._tileset)) {
    this._tileset.trimLoadedTiles();
  }
};

/**
 * 在样式编辑器中编译样式。
 */
Cesium3DTilesInspectorViewModel.prototype.compileStyle = function () {
  const tileset = this._tileset;
  if (!defined(tileset) || this.styleString === JSON.stringify(tileset.style)) {
    return;
  }
  this._editorError = "";
  try {
    if (this.styleString.length === 0) {
      this.styleString = "{}";
    }
    this._style = new Cesium3DTileStyle(JSON.parse(this.styleString));
    this._shouldStyle = true;
    this._scene.requestRender();
  } catch (err) {
    this._editorError = err.toString();
  }

  // set feature again so pick coloring is set
  this.feature = this._feature;
  this.tile = this._tile;
};

/**
 * 处理样式编辑器上的按键事件。
 */
Cesium3DTilesInspectorViewModel.prototype.styleEditorKeyPress = function (
  sender,
  event,
) {
  if (event.keyCode === 9) {
    //tab
    event.preventDefault();
    const textArea = event.target;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    let newEnd = end;
    const selected = textArea.value.slice(start, end);
    const lines = selected.split("\n");
    const length = lines.length;
    let i;
    if (!event.shiftKey) {
      for (i = 0; i < length; ++i) {
        lines[i] = `  ${lines[i]}`;
        newEnd += 2;
      }
    } else {
      for (i = 0; i < length; ++i) {
        if (lines[i][0] === " ") {
          if (lines[i][1] === " ") {
            lines[i] = lines[i].substr(2);
            newEnd -= 2;
          } else {
            lines[i] = lines[i].substr(1);
            newEnd -= 1;
          }
        }
      }
    }
    const newText = lines.join("\n");
    textArea.value =
      textArea.value.slice(0, start) + newText + textArea.value.slice(end);
    textArea.selectionStart = start !== end ? start : newEnd;
    textArea.selectionEnd = newEnd;
  } else if (event.ctrlKey && (event.keyCode === 10 || event.keyCode === 13)) {
    //ctrl + enter
    this.compileStyle();
  }
  return true;
};

/**
 * 更新视图模型的值
 * @private
 */
Cesium3DTilesInspectorViewModel.prototype._update = function () {
  const tileset = this._tileset;

  if (this.performance) {
    this._performanceDisplay.update();
  }

  if (defined(tileset)) {
    if (tileset.isDestroyed()) {
      this.tile = undefined;
      this.feature = undefined;
      this.tileset = undefined;
      return;
    }

    const style = tileset.style;
    if (this._style !== tileset.style) {
      if (this._shouldStyle) {
        tileset.style = this._style;
        this._shouldStyle = false;
      } else {
        this._style = style;
        this.styleString = JSON.stringify(style.style, null, "  ");
      }
    }
  }
  if (this.showStatistics) {
    this._statisticsText = getStatistics(tileset, false);
    this._pickStatisticsText = getStatistics(tileset, true);
    this._resourceCacheStatisticsText = getResourceCacheStatistics();
  }
};

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
Cesium3DTilesInspectorViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 *  销毁小部件。如果从布局中永久删除小部件，
 *  则应该调用。
 */
Cesium3DTilesInspectorViewModel.prototype.destroy = function () {
  this._eventHandler.destroy();
  this._removePostRenderEvent();

  const that = this;
  this._definedProperties.forEach(function (property) {
    knockout.getObservable(that, property).dispose();
  });

  return destroyObject(this);
};

/**
 * 生成统计数据的HTML字符串
 *
 * @function
 * @param {Cesium3DTileset} tileset  tileset
 * @param {boolean} isPick 这是否在获取选秀传球的统计数据
 * @returns {string} 格式化的统计信息
 */
Cesium3DTilesInspectorViewModel.getStatistics = getStatistics;
export default Cesium3DTilesInspectorViewModel;
