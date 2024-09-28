import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import deprecationWarning from "../Core/deprecationWarning.js";
import destroyObject from "../Core/destroyObject.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Event from "../Core/Event.js";
import ImageBasedLighting from "./ImageBasedLighting.js";
import Interval from "../Core/Interval.js";
import IntersectionTests from "../Core/IntersectionTests.js";
import IonResource from "../Core/IonResource.js";
import JulianDate from "../Core/JulianDate.js";
import ManagedArray from "../Core/ManagedArray.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import Transforms from "../Core/Transforms.js";
import ClearCommand from "../Renderer/ClearCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import Axis from "./Axis.js";
import Cesium3DTile from "./Cesium3DTile.js";
import Cesium3DTileColorBlendMode from "./Cesium3DTileColorBlendMode.js";
import Cesium3DTileContentState from "./Cesium3DTileContentState.js";
import Cesium3DTilesetMetadata from "./Cesium3DTilesetMetadata.js";
import Cesium3DTileOptimizations from "./Cesium3DTileOptimizations.js";
import Cesium3DTilePass from "./Cesium3DTilePass.js";
import Cesium3DTileRefine from "./Cesium3DTileRefine.js";
import Cesium3DTilesetCache from "./Cesium3DTilesetCache.js";
import Cesium3DTilesetHeatmap from "./Cesium3DTilesetHeatmap.js";
import Cesium3DTilesetStatistics from "./Cesium3DTilesetStatistics.js";
import Cesium3DTileStyleEngine from "./Cesium3DTileStyleEngine.js";
import ClippingPlaneCollection from "./ClippingPlaneCollection.js";
import ClippingPolygonCollection from "./ClippingPolygonCollection.js";
import hasExtension from "./hasExtension.js";
import ImplicitTileset from "./ImplicitTileset.js";
import ImplicitTileCoordinates from "./ImplicitTileCoordinates.js";
import LabelCollection from "./LabelCollection.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import PointCloudEyeDomeLighting from "./PointCloudEyeDomeLighting.js";
import PointCloudShading from "./PointCloudShading.js";
import ResourceCache from "./ResourceCache.js";
import SceneMode from "./SceneMode.js";
import ShadowMode from "./ShadowMode.js";
import SplitDirection from "./SplitDirection.js";
import StencilConstants from "./StencilConstants.js";
import TileBoundingRegion from "./TileBoundingRegion.js";
import TileBoundingSphere from "./TileBoundingSphere.js";
import TileOrientedBoundingBox from "./TileOrientedBoundingBox.js";
import Cesium3DTilesetMostDetailedTraversal from "./Cesium3DTilesetMostDetailedTraversal.js";
import Cesium3DTilesetBaseTraversal from "./Cesium3DTilesetBaseTraversal.js";
import Cesium3DTilesetSkipTraversal from "./Cesium3DTilesetSkipTraversal.js";
import Ray from "../Core/Ray.js";

/**
 * @typedef {Object} Cesium3DTileset.ConstructorOptions
 *
 * Cesium3DTileset 构造函数的初始化选项
 *
 * @property {boolean} [show=true] 确定是否显示图块集。
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 一个 4x4 变换矩阵，用于变换瓦片集的根瓦片。
 * @property {Axis} [modelUpAxis=Axis.Y] 在加载瓦片内容的模型时，哪个轴被认为是向上的。
 * @property {Axis} [modelForwardAxis=Axis.X] 在加载瓦片内容的模型时，哪个轴被视为向前。
 * @property {ShadowMode} [shadows=ShadowMode.ENABLED] 确定图块集是投射还是接收来自光源的阴影。
 * @property {number} [maximumScreenSpaceError=16] 用于驱动细节层次细化的最大屏幕空间误差。
 * @property {number} [cacheBytes=536870912] 如果缓存包含当前视图不需要的切片，则切片缓存将被修剪到的大小（以字节为单位）。
 * @property {number} [maximumCacheOverflowBytes=536870912] 如果当前视图需要超过 {@link Cesium3DTileset#cacheBytes}，则允许缓存空间的最大额外内存（以字节为单位）。
 * @property {boolean} [cullWithChildrenBounds=true] 优化选项。是否使用其子边界体积的并集来剔除平铺。
 * @property {boolean} [cullRequestsWhileMoving=true] 优化选项。不要请求由于摄像机移动而返回时可能未使用的图块。此优化仅适用于固定图块集。
 * @property {number} [cullRequestsWhileMovingMultiplier=60.0] 优化选项。移动时剔除请求中使用的乘数。较大的剔除较为激进，较小的剔除较不激进。
 * @property {boolean} [preloadWhenHidden=false] 当 <code>tileset.show</code> 为 <code>false</code> 时预加载瓦片。加载瓦片，就好像瓦片集可见一样，但不渲染它们。
 * @property {boolean} [preloadFlightDestinations=true] 优化选项。当摄像机正在飞行时，在摄像机的飞行目的地预加载切片。
 * @property {boolean} [preferLeaves=false] 优化选项。喜欢先加载叶子。
 * @property {boolean} [dynamicScreenSpaceError=true] 优化选项。对于街道级别的地平线视图，请使用远离摄像机的较低分辨率图块。这减少了加载的数据量并缩短了图块集加载时间，但远处的视觉质量会略有下降。
 * @property {number} [dynamicScreenSpaceErrorDensity=2.0e-4] 与 {@link Fog#density} 类似，此选项控制应用 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化的摄像机距离。较大的值将导致靠近摄像机的图块受到影响。
 * @property {number} [dynamicScreenSpaceErrorFactor=24.0] 一个参数，用于控制地平线上图格的 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化强度。较大的值会导致加载较低分辨率的图块，从而提高运行时性能，但会降低视觉质量。
 * @property {number} [dynamicScreenSpaceErrorHeightFalloff=0.25] 图块集高度的比率，它决定了“街道级别”摄像机视图的位置。当摄像机低于此高度时，{@link Cesium3DTileset#dynamicScreenSpaceError} 优化将产生最大效果，并且它将在此值以上滚降。
 * @property {number} [progressiveResolutionHeightFraction=0.3] 优化选项。如果介于 （0.0， 0.5） 之间，则 <code>progressiveResolutionHeightFraction*screenHeight</code> 的降低屏幕分辨率误差等于或高于或更高的磁贴将首先优先处理。这有助于在继续加载全分辨率图块的同时快速关闭图块层。
 * @property {boolean} [foveatedScreenSpaceError=true] 优化选项。通过暂时提高屏幕边缘图块的屏幕空间误差，优先在屏幕中心加载图块。一旦加载了由 {@link Cesium3DTileset#foveatedConeSize} 确定的屏幕中心的所有图块，屏幕空间错误就会恢复正常。
 * @property {number} [foveatedConeSize=0.1] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制确定延迟哪些图块的圆锥体大小。此圆锥体内的切片将立即加载。圆锥体外的图块可能会根据它们在圆锥体外的距离及其屏幕空间误差而延迟。这由 {@link Cesium3DTileset#foveatedInterpolationCallback} 和 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 控制。将此设置为 0.0 意味着圆锥体将是摄像机位置及其视图方向形成的线。将此设置为 1.0 意味着圆锥体包含摄像机的整个视野，从而禁用该效果。
 * @property {number} [foveatedMinimumScreenSpaceErrorRelaxation=0.0] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制凹圆锥体外磁贴的起始屏幕空间误差松弛。根据提供的 {@link@link Cesium3DTileset#foveatedInterpolationCallback}，将从图块集值开始引发屏幕空间错误，最高为 { Cesium3DTileset#maximumScreenSpaceError}。
 * @property {Cesium3DTileset.foveatedInterpolationCallback} [foveatedInterpolationCallback=Math.lerp] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制在注视点圆锥体之外的图块的屏幕空间误差增加多少，在 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 和 {@link Cesium3DTileset#maximumScreenSpaceError} 之间插值
 * @property {number} [foveatedTimeDelay=0.2] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制在摄像机停止移动后，延迟图块开始加载之前等待多长时间（以秒为单位）。此时间延迟可防止在摄像机移动时请求屏幕边缘周围的图块。将此设置为 0.0 将立即请求任何给定视图中的所有图块。
 * @property {boolean} [skipLevelOfDetail=false] 优化选项。确定在遍历期间是否应应用细节级别跳过。
 * @property {number} [baseScreenSpaceError=1024] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，在跳过细节级别之前必须达到的屏幕空间错误。
 * @property {number} [skipScreenSpaceErrorFactor=16] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，定义要跳过的最小屏幕空间误差的乘数。与 <code>skipLevels</code> 结合使用，以确定要加载的图块。
 * @property {number} [skipLevels=1] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，一个常量，用于定义加载瓦片时要跳过的最小级别数。当它为 0 时，不会跳过任何级别。与 <code>skipScreenSpaceErrorFactor</code> 结合使用，以确定要加载的图块。
 * @property {boolean} [immediatelyLoadDesiredLevelOfDetail=false] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，将仅下载满足最大屏幕空间错误的磁贴。跳过因素将被忽略，仅加载所需的切片。
 * @property {boolean} [loadSiblings=false] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，确定在遍历期间是否始终下载可见瓦片的同级。
 * @property {ClippingPlaneCollection} [clippingPlanes] 用于选择性地禁用图块集渲染的 {@link ClippingPlaneCollection}。
 * @property {ClippingPolygonCollection} [clippingPolygons] 用于选择性地禁用渲染图块集的 {@link ClippingPolygonCollection}。
 * @property {ClassificationType} [classificationType] 确定地形和/或 3D 瓦片是否由此瓦片集进行分类。请参阅 {@link Cesium3DTileset#classificationType} 了解有关限制和限制的详细信息。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 决定地球大小和形状的椭球体。
 * @property {object} [pointCloudShading] 用于构建 {@link PointCloudShading} 对象的选项，以根据几何误差和照明控制点衰减。
 * @property {Cartesian3} [lightColor] 对模型进行着色时的光色。<code>如果未定义</code>，则使用场景的 light 颜色。
 * @property {ImageBasedLighting} [imageBasedLighting] 用于管理此图块集的基于图像的光照的属性。
 * @property {boolean} [backFaceCulling=true] 是否剔除背面的几何体。如果为 true，则背面剔除由 glTF 材质的 doubleSided 属性确定;如果为 false，则禁用背面剔除。
 * @property {boolean} [enableShowOutline=true] 是否为使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。可以将其设置为 false，以避免在加载时对几何体进行额外处理。如果为 false，则忽略 showOutlines 和 outlineColor 选项。
 * @property {boolean} [showOutline=true] 是否显示使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。如果为 true，则显示轮廓。如果为 false，则不显示轮廓。
 * @property {Color} [outlineColor=Color.BLACK] 渲染轮廓时要使用的颜色。
 * @property {boolean} [vectorClassificationOnly=false] 表示只应使用瓦片集的矢量瓦片进行分类。
 * @property {boolean} [vectorKeepDecodedPositions=false] 矢量瓦片是否应在内存中保留解码的位置。这与 {@link Cesium3DTileFeature.getPolylinePositions} 一起使用。
 * @property {string|number} [featureIdLabel=“featureId_0”] 用于选取和样式的特征 ID 集的标签。对于 EXT_mesh_features，这是特征 ID 的 label 属性，如果未指定，则为 “featureId_N”（其中 N 是 featureIds 数组中的索引）。EXT_feature_metadata没有标注字段，因此此类要素 ID 集始终标记为“featureId_N”，其中 N 是所有要素 ID 列表中的索引，其中要素 ID 属性列在要素 ID 纹理之前。如果 featureIdLabel 是整数 N，则会自动转换为字符串 featureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @property {string|number} [instanceFeatureIdLabel=“instanceFeatureId_0”] 用于选取和样式的实例特征 ID 集的标签。如果 instanceFeatureIdLabel 设置为整数 N，则会自动转换为字符串 instanceFeatureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @property {boolean} [showCreditsOnScreen=false] 是否在屏幕上显示此图块集的制作人员名单。
 * @property {SplitDirection} [splitDirection=SplitDirection.NONE] 应用于此图块集的 {@link SplitDirection} 分割。
 * @property {boolean} [enableCollision=false] 如果<code>为 true</code>，则为摄像机或 CPU 拾取启用碰撞。虽然这是<code>真的</code>，但如果 {@link ScreenSpaceCameraController#enableCollisionDetection} 为 true，则相机将无法低于图块集表面。
 * @property {boolean} [projectTo2D=false] 是否将瓦片集精确投影为 2D。如果为 true，则图块集将精确投影到 2D，但会使用更多内存来执行此操作。如果为 false，则图块集将使用较少的内存，并且仍将以 2D / CV 模式渲染，但其投影位置可能不准确。创建图块集后，无法设置此项。
 * @property {boolean} [enablePick=false] 在使用 WebGL 1 时，是否允许使用 <code>pick</code> 进行碰撞和 CPU 拾取。如果使用 WebGL 2 或更高版本，则此选项将被忽略。如果使用 WebGL 1 并且这是真的，<code>则 pick</code> 操作将正常工作，但它会使用更多内存来执行此操作。如果使用 WebGL 1 运行并且为 false，则模型将使用更少的内存，但 <code>pick</code> 将始终返回 <code>undefined</code>。加载图块集后无法设置此项。
 * @property {string} [debugHeatmapTilePropertyName] 要作为热图着色的图块变量。所有渲染的瓦片都将相对于彼此的指定变量值进行着色。
 * @property {boolean} [debugFreezeFrame=false] 仅用于调试。确定是否只应使用上一帧中的平铺进行渲染。
 * @property {boolean} [debugColorizeTiles=false] 仅用于调试。如果为 true，则为每个平铺分配随机颜色。
 * @property {boolean} [enableDebugWireframe=false] 仅用于调试。要使 debugWireframe 在 WebGL1 中工作，必须如此。创建图块集后，无法设置此项。
 * @property {boolean} [debugWireframe=false] 仅用于调试。如果为 true，则将每个图块的内容渲染为线框。
 * @property {boolean} [debugShowBoundingVolume=false] 仅用于调试。如果为 true，则渲染每个图块的边界体积。
 * @property {boolean} [debugShowContentBoundingVolume=false] 仅用于调试。如果为 true，则渲染每个图块内容的边界体积。
 * @property {boolean} [debugShowViewerRequestVolume=false] 仅用于调试。如果为 true，则呈现每个图块的查看器请求量。
 * @property {boolean} [debugShowGeometricError=false] 仅用于调试。如果为 true，则绘制标签以指示每个图块的几何误差。
 * @property {boolean} [debugShowRenderingStatistics=false] 仅用于调试。如果为 true，则绘制标签以指示每个图块的命令、点、三角形和功能的数量。
 * @property {boolean} [debugShowMemoryUsage=false] 仅用于调试。如果为 true，则绘制标签以指示每个图块使用的纹理和几何内存（以 MB 为单位）。
 * @property {boolean} [debugShowUrl=false] 仅用于调试。如果为 true，则绘制标签以指示每个图块的 URL。
 */

/**
 * 一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles tileset}，
 * 用于流式传输大量异构 3D 地理空间数据集。
 *
 * <div class="notice">
 * 此对象通常不会直接实例化，请使用 {@link Cesium3DTileset.fromUrl}.
 * </div>
 *
 * @alias Cesium3DTileset
 * @constructor
 *
 * @param {Cesium3DTileset.ConstructorOptions} options An 描述初始化选项的对象
 *
 * @exception {DeveloperError} The tileset must be 3D Tiles version 0.0 or 1.0.
 *
 * @example
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json"
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Turn on camera collisions with the tileset.
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json",
 *      { enableCollision: true }
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Common setting for the skipLevelOfDetail optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      skipLevelOfDetail: true,
 *      baseScreenSpaceError: 1024,
 *      skipScreenSpaceErrorFactor: 16,
 *      skipLevels: 1,
 *      immediatelyLoadDesiredLevelOfDetail: false,
 *      loadSiblings: false,
 *      cullWithChildrenBounds: true
 * });
 * scene.primitives.add(tileset);
 *
 * @example
 * // Common settings for the dynamicScreenSpaceError optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      dynamicScreenSpaceError: true,
 *      dynamicScreenSpaceErrorDensity: 2.0e-4,
 *      dynamicScreenSpaceErrorFactor: 24.0,
 *      dynamicScreenSpaceErrorHeightFalloff: 0.25
 * });
 * scene.primitives.add(tileset);
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles specification}
 */
function Cesium3DTileset(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._url = undefined;
  this._basePath = undefined;
  this._root = undefined;
  this._resource = undefined;
  this._asset = undefined; // Metadata for the entire tileset
  this._properties = undefined; // Metadata for per-model/point/etc properties
  this._geometricError = undefined; // Geometric error when the tree is not rendered at all
  this._scaledGeometricError = undefined; // Geometric error scaled by root tile scale
  this._extensionsUsed = undefined;
  this._extensions = undefined;
  this._modelUpAxis = undefined;
  this._modelForwardAxis = undefined;
  this._cache = new Cesium3DTilesetCache();
  this._processingQueue = [];
  this._selectedTiles = [];
  this._emptyTiles = [];
  this._requestedTiles = [];
  this._selectedTilesToStyle = [];
  this._loadTimestamp = undefined;
  this._timeSinceLoad = 0.0;
  this._updatedVisibilityFrame = 0;
  this._updatedModelMatrixFrame = 0;
  this._modelMatrixChanged = false;
  this._previousModelMatrix = undefined;
  this._extras = undefined;
  this._credits = undefined;

  this._showCreditsOnScreen = defaultValue(options.showCreditsOnScreen, false);

  this._cullWithChildrenBounds = defaultValue(
    options.cullWithChildrenBounds,
    true,
  );
  this._allTilesAdditive = true;

  this._hasMixedContent = false;

  this._stencilClearCommand = undefined;
  this._backfaceCommands = new ManagedArray();

  this._maximumScreenSpaceError = defaultValue(
    options.maximumScreenSpaceError,
    16,
  );
  this._memoryAdjustedScreenSpaceError = this._maximumScreenSpaceError;

  this._cacheBytes = defaultValue(options.cacheBytes, 512 * 1024 * 1024);
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("cacheBytes", this._cacheBytes, 0);
  //>>includeEnd('debug');

  const maximumCacheOverflowBytes = defaultValue(
    options.maximumCacheOverflowBytes,
    512 * 1024 * 1024,
  );
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals(
    "maximumCacheOverflowBytes",
    maximumCacheOverflowBytes,
    0,
  );
  //>>includeEnd('debug');
  this._maximumCacheOverflowBytes = maximumCacheOverflowBytes;

  this._styleEngine = new Cesium3DTileStyleEngine();
  this._styleApplied = false;

  this._modelMatrix = defined(options.modelMatrix)
    ? Matrix4.clone(options.modelMatrix)
    : Matrix4.clone(Matrix4.IDENTITY);

  this._addHeightCallbacks = [];

  this._statistics = new Cesium3DTilesetStatistics();
  this._statisticsLast = new Cesium3DTilesetStatistics();
  this._statisticsPerPass = new Array(Cesium3DTilePass.NUMBER_OF_PASSES);

  for (let i = 0; i < Cesium3DTilePass.NUMBER_OF_PASSES; ++i) {
    this._statisticsPerPass[i] = new Cesium3DTilesetStatistics();
  }

  this._requestedTilesInFlight = [];

  this._maximumPriority = {
    foveatedFactor: -Number.MAX_VALUE,
    depth: -Number.MAX_VALUE,
    distance: -Number.MAX_VALUE,
    reverseScreenSpaceError: -Number.MAX_VALUE,
  };
  this._minimumPriority = {
    foveatedFactor: Number.MAX_VALUE,
    depth: Number.MAX_VALUE,
    distance: Number.MAX_VALUE,
    reverseScreenSpaceError: Number.MAX_VALUE,
  };
  this._heatmap = new Cesium3DTilesetHeatmap(
    options.debugHeatmapTilePropertyName,
  );

  /**
   * 优化选项。不要请求由于摄像机移动而返回时可能未使用的图块。此优化仅适用于固定图块集。
   *
   * @type {boolean}
   * @default true
   */
  this.cullRequestsWhileMoving = defaultValue(
    options.cullRequestsWhileMoving,
    true,
  );
  this._cullRequestsWhileMoving = false;

  /**
   * 优化选项。移动时剔除请求中使用的乘数。较大的剔除较为激进，较小的剔除较不激进。
   *
   * @type {number}
   * @default 60.0
   */
  this.cullRequestsWhileMovingMultiplier = defaultValue(
    options.cullRequestsWhileMovingMultiplier,
    60.0,
  );

  /**
   * 优化选项。如果介于 （0.0， 0.5） 之间，则 <code>progressiveResolutionHeightFraction*screenHeight</code> 的降低屏幕分辨率误差等于或高于或更高的磁贴将首先优先处理。这有助于在继续加载全分辨率图块的同时快速关闭图块层。
   *
   * @type {number}
   * @default 0.3
   */
  this.progressiveResolutionHeightFraction = CesiumMath.clamp(
    defaultValue(options.progressiveResolutionHeightFraction, 0.3),
    0.0,
    0.5,
  );

  /**
   * 优化选项。喜欢先加载叶子。
   *
   * @type {boolean}
   * @default false
   */
  this.preferLeaves = defaultValue(options.preferLeaves, false);

  this._tilesLoaded = false;
  this._initialTilesLoaded = false;

  this._tileDebugLabels = undefined;

  this._classificationType = options.classificationType;

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);

  this._initialClippingPlanesOriginMatrix = Matrix4.IDENTITY; // Computed from the tileset JSON.
  this._clippingPlanesOriginMatrix = undefined; // Combines the above with any run-time transforms.
  this._clippingPlanesOriginMatrixDirty = true;

  this._vectorClassificationOnly = defaultValue(
    options.vectorClassificationOnly,
    false,
  );

  this._vectorKeepDecodedPositions = defaultValue(
    options.vectorKeepDecodedPositions,
    false,
  );

  /**
   * 当 <code>tileset.show</code> 为 <code>false</code> 时预加载瓦片。加载瓦片，就好像瓦片集可见一样，但不渲染它们。
   *
   * @type {boolean}
   * @default false
   */
  this.preloadWhenHidden = defaultValue(options.preloadWhenHidden, false);

  /**
   * 优化选项。当摄像机正在飞行时，在摄像机的飞行目的地获取切片。
   *
   * @type {boolean}
   * @default true
   */
  this.preloadFlightDestinations = defaultValue(
    options.preloadFlightDestinations,
    true,
  );
  this._pass = undefined; // Cesium3DTilePass

  /**
   * 优化选项。对于街道级别的地平线视图，请使用远离摄像机的较低分辨率图块。这减少了
   * 加载的数据量并缩短了图块集加载时间，但远处的视觉质量略有下降。
   * <p>
   * 当相机靠近图块集的地平面并查看
   *地平线。此外，对于紧密拟合的边界体积（如框和区域），结果更加准确。
   *
   * @type {boolean}
   * @default true
   */
  this.dynamicScreenSpaceError = defaultValue(
    options.dynamicScreenSpaceError,
    true,
  );

  /**
   * 优化选项。通过暂时提高
   * 屏幕边缘图块的屏幕空间错误。屏幕空间错误在全部
   * 加载由 {@link Cesium3DTileset#foveatedConeSize} 确定的屏幕中央的图块。
   *
   * @type {boolean}
   * @default true
   */
  this.foveatedScreenSpaceError = defaultValue(
    options.foveatedScreenSpaceError,
    true,
  );
  this._foveatedConeSize = defaultValue(options.foveatedConeSize, 0.1);
  this._foveatedMinimumScreenSpaceErrorRelaxation = defaultValue(
    options.foveatedMinimumScreenSpaceErrorRelaxation,
    0.0,
  );

  /**
   * 获取或设置回调以控制在注视点圆锥体之外的图块的屏幕空间误差的提高程度，
   * 在 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 和 {@link Cesium3DTileset#maximumScreenSpaceError} 之间插值。
   *
   * @type {Cesium3DTileset.foveatedInterpolationCallback}
   */
  this.foveatedInterpolationCallback = defaultValue(
    options.foveatedInterpolationCallback,
    CesiumMath.lerp,
  );

  /**
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时用于控制
   * 在相机停止移动后，延迟图块开始加载之前要等待多长时间（以秒为单位）。
   * 此时间延迟可防止在摄像机移动时请求屏幕边缘的磁贴。
   * 将此设置为 0.0 将立即请求任何给定视图中的所有图块。
   *
   * @type {number}
   * @default 0.2
   */
  this.foveatedTimeDelay = defaultValue(options.foveatedTimeDelay, 0.2);

  /**
   * 与 {@link Fog#density} 类似，此选项控制 {@link Cesium3DTileset#dynamicScreenSpaceError} 的摄像机距离
   * 优化适用。较大的值将导致靠近摄像机的图块受到影响。此值必须为
   * 非负数。
   * <p>
   * 此优化的工作原理是消除像钟形曲线一样的相机距离的平铺屏幕空间误差 （SSE）。
   * 这具有选择远离摄像机的低分辨率图块的效果。在相机附近，不进行调整
   * 䍬。对于较远的图块，SSE 最多可降低 {@link Cesium3DTileset#dynamicScreenSpaceErrorFactor}
   *（以误差像素为单位）。
   * </p>
   * <p>
   * 增加密度会使钟形曲线变窄，因此更靠近摄像机的平铺会受到影响。这是类比的
   * 将雾移近摄像机。
   * </p>
   * <p>
   * 当密度为 0 时，优化对瓦片集没有影响。
   * </p>
   *
   * @type {number}
   * @default 2.0e-4
   */
  this.dynamicScreenSpaceErrorDensity = defaultValue(
    options.dynamicScreenSpaceErrorDensity,
    2.0e-4,
  );

  /**
   * 一个参数，用于控制 {@link Cesium3DTileset#dynamicScreenSpaceError} 的优化强度
   * 地平线上的瓷砖。较大的值会导致加载较低分辨率的图块，从而略微提高运行时性能
   * 降低视觉质量。该值必须为非负数。
   * <p>
   * 更具体地说，此参数表示磁贴的屏幕空间误差 （SSE） 的最大调整值（以像素为单位）
   * 远离相机。有关如何操作的更多详细信息，请参阅 {@link Cesium3DTileset#dynamicScreenSpaceErrorDensity}
   * 此优化有效。
   * </p>
   * <p>
   * 当 SSE 因子设置为 0 时，优化将对图块集没有影响。
   * </p>
   *
   * @type {number}
   * @default 24.0
   */
  this.dynamicScreenSpaceErrorFactor = defaultValue(
    options.dynamicScreenSpaceErrorFactor,
    24.0,
  );

  /**
   * 确定 {@link Cesium3DTileset#dynamicScreenSpaceError} 的“街道级别”的图块集高度比率
   *优化。当摄像头低于此高度时，动态屏幕空间误差优化将具有最大值
   * 效果，并且它将在此值以上滚降。有效值介于 0.0 和 1.0 之间。
   * <p>
   *
   * @type {number}
   * @default 0.25
   */
  this.dynamicScreenSpaceErrorHeightFalloff = defaultValue(
    options.dynamicScreenSpaceErrorHeightFalloff,
    0.25,
  );

  // Updated based on the camera position and direction
  this._dynamicScreenSpaceErrorComputedDensity = 0.0;

  /**
   * 确定图块集是投射还是接收来自光源的阴影。
   * <p>
   * 启用阴影会影响性能。投射阴影的图块集必须渲染两次，一次从摄像机渲染，另一次从光源的角度渲染。
   * </p>
   * <p>
   * 仅当 {@link Viewer#shadows} 为 <code>true</code> 时，才会渲染阴影。
   * </p>
   *
   * @type {ShadowMode}
   * @default ShadowMode.ENABLED
   */
  this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);

  /**
   * 确定是否显示图块集。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 定义从 Cesium API 或声明式样式设置的每个特征颜色如何与
   * 原始特征，例如 glTF 材质或瓦片中的每点颜色。
   *
   * @type {Cesium3DTileColorBlendMode}
   * @default Cesium3DTileColorBlendMode.HIGHLIGHT
   */
  this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

  /**
   * 定义当 {@link Cesium3DTileset#colorBlendMode} 为 <code>MIX</code> 时，用于在源颜色和特征颜色之间线性插值的值。
   * 值为 0.0 时，将生成源颜色，而值为 1.0 时，将生成特征颜色，介于两者之间的任何值
   * 导致源颜色和特征颜色的混合。
   *
   * @type {number}
   * @default 0.5
   */
  this.colorBlendAmount = 0.5;

  this._pointCloudShading = new PointCloudShading(options.pointCloudShading);
  this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();

  /**
   * 触发事件以指示加载新图块的进度。 当新瓦片
   * 是请求的，当请求的磁贴完成下载，并且下载的磁贴已
   * 已处理并准备好渲染。
   * <p>
   * 待处理磁贴请求的数量、<code>numberOfPendingRequests</code> 和磁贴数量
   * <code>processing，numberOfTilesProcessing</code> 将传递给事件侦听器。
   * </p>
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {
   *     if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
   *         console.log('Stopped loading');
   *         return;
   *     }
   *
   *     console.log(`Loading: requests: ${numberOfPendingRequests}, processing: ${numberOfTilesProcessing}`);
   * });
   */
  this.loadProgress = new Event();

  /**
   * 触发事件以指示加载此帧中符合屏幕空间错误的所有图块。图块集
   * 已完全加载此视图。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.allTilesLoaded.addEventListener(function() {
   *     console.log('All tiles are loaded');
   * });
   *
   * @see Cesium3DTileset#tilesLoaded
   */
  this.allTilesLoaded = new Event();

  /**
   * 触发事件以指示加载此帧中符合屏幕空间错误的所有图块。此活动
   * 在加载初始视图中的所有图块时触发一次。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.initialTilesLoaded.addEventListener(function() {
   *     console.log('Initial tiles are loaded');
   * });
   *
   * @see Cesium3DTileset#allTilesLoaded
   */
  this.initialTilesLoaded = new Event();

  /**
   * 触发事件以指示磁贴的内容已加载。
   * <p>
   * 加载的 {@link Cesium3DTile} 将传递给事件侦听器。
   * </p>
   * <p>
   * 此事件在图块集遍历期间触发，同时渲染帧
   * 以便对图块的更新在同一帧中生效。 请勿创建或修改
   * 事件侦听器期间的 Cesium 实体或基元。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileLoad.addEventListener(function(tile) {
   *     console.log('A tile was loaded.');
   * });
   */
  this.tileLoad = new Event();

  /**
   * 触发事件以指示磁贴的内容已卸载。
   * <p>
   * 将卸载的 {@link Cesium3DTile} 传递给事件侦听器。
   * </p>
   * <p>
   * 此事件在帧被卸载之前立即触发
   * rendered 的 Alpha S Interface，以便事件侦听器可以访问瓦片的内容。 不创建
   * 或在事件侦听器期间修改 Cesium 实体或基元。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileUnload.addEventListener(function(tile) {
   *     console.log('A tile was unloaded from the cache.');
   * });
   *
   * @see Cesium3DTileset#cacheBytes
   * @see Cesium3DTileset#trimLoadedTiles
   */
  this.tileUnload = new Event();

  /**
   * 触发事件以指示磁贴的内容无法加载。
   * <p>
   * 如果没有事件侦听器，错误消息将记录到控制台。
   * </p>
   * <p>
   * 传递给侦听器的 error 对象包含两个属性：
   * <ul>
   * <li><code>URL</code>：失败磁贴的 URL。</li>
   * <li><code>message</code>：错误消息。</li>
   * </ul>
   * <p>
   * 如果存在多个内容，则每个内部内容都会引发一次此事件，并出现错误。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileFailed.addEventListener(function(error) {
   *     console.log(`An error occurred loading tile: ${error.url}`);
   *     console.log(`Error: ${error.message}`);
   * });
   */
  this.tileFailed = new Event();

  /**
   * 此事件对帧中的每个可见图块触发一次。 这可以手动用于
   * 设置图块集的样式。
   * <p>
   * 可见的 {@link Cesium3DTile} 被传递给事件侦听器。
   * </p>
   * <p>
   * 此事件在图块集遍历期间触发，同时渲染帧
   * 以便对图块的更新在同一帧中生效。 请勿创建或修改
   * 事件侦听器期间的 Cesium 实体或基元。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileVisible.addEventListener(function(tile) {
   *     if (tile.content instanceof Cesium.Model3DTileContent) {
   *         console.log('A 3D model tile is visible.');
   *     }
   * });
   *
   * @example
   * // Apply a red style and then manually set random colors for every other feature when the tile becomes visible.
   * tileset.style = new Cesium.Cesium3DTileStyle({
   *     color : 'color("red")'
   * });
   * tileset.tileVisible.addEventListener(function(tile) {
   *     const content = tile.content;
   *     const featuresLength = content.featuresLength;
   *     for (let i = 0; i < featuresLength; i+=2) {
   *         content.getFeature(i).color = Cesium.Color.fromRandom();
   *     }
   * });
   */
  this.tileVisible = new Event();

  /**
   * 优化选项。确定在遍历期间是否应应用细节级别跳过。
   * <p>
   * 替换优化遍历的常见策略是将树的所有级别存储在内存中，并且需要
   * 在父项可以优化之前加载所有子项。通过此优化，可以跳过树的级别
   * 完全，子项可以与父项一起呈现。在以下情况下，瓦片集需要的内存要少得多
   * 使用此优化。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.skipLevelOfDetail = defaultValue(options.skipLevelOfDetail, false);

  this._disableSkipLevelOfDetail = false;

  /**
   * 在跳过细节级别之前必须达到的屏幕空间错误。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 1024
   */
  this.baseScreenSpaceError = defaultValue(options.baseScreenSpaceError, 1024);

  /**
   * 定义要跳过的最小屏幕空间误差的乘数。
   * 例如，如果磁贴的屏幕空间误差为 100，则不会加载任何磁贴，除非它们
   * 是叶子或有屏幕空间错误 <code><= 100 / skipScreenSpaceErrorFactor</code>。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 16
   */
  this.skipScreenSpaceErrorFactor = defaultValue(
    options.skipScreenSpaceErrorFactor,
    16,
  );

  /**
   * 常量定义加载图块时要跳过的最小级别数。当它为 0 时，不会跳过任何级别。
   * 例如，如果图块的级别为 1，则不会加载任何图块，除非它们位于大于 2 的级别。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 1
   */
  this.skipLevels = defaultValue(options.skipLevels, 1);

  /**
   * 如果为 true，则只会下载满足最大屏幕空间误差的磁贴。
   * 跳过因素将被忽略，仅加载所需的图块。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.immediatelyLoadDesiredLevelOfDetail = defaultValue(
    options.immediatelyLoadDesiredLevelOfDetail,
    false,
  );

  /**
   * 确定在遍历期间是否始终下载可见切片的同级。
   * 这对于确保观看者向左/向右转动时磁贴已经可用可能很有用。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.loadSiblings = defaultValue(options.loadSiblings, false);

  this._clippingPlanes = undefined;
  if (defined(options.clippingPlanes)) {
    ClippingPlaneCollection.setOwner(
      options.clippingPlanes,
      this,
      "_clippingPlanes",
    );
  }

  this._clippingPolygons = undefined;
  if (defined(options.clippingPolygons)) {
    ClippingPolygonCollection.setOwner(
      options.clippingPolygons,
      this,
      "_clippingPolygons",
    );
  }

  if (defined(options.imageBasedLighting)) {
    this._imageBasedLighting = options.imageBasedLighting;
    this._shouldDestroyImageBasedLighting = false;
  } else {
    this._imageBasedLighting = new ImageBasedLighting();
    this._shouldDestroyImageBasedLighting = true;
  }

  /**
   * 为模型着色时的光色。<code>如果未定义</code>，则使用场景的 light 颜色。
   * <p>
   * 例如，通过设置
   * <code>tileset.imageBasedLighting.imageBasedLightingFactor = 新笛卡尔2（0.0， 0.0）</code>
   * 会使图块集更暗。在这里，增加光源的强度将使图块集更亮。
   * </p>
   *
   * @type {Cartesian3}
   * @default undefined
   */
  this.lightColor = options.lightColor;

  /**
   * 是否剔除背面的几何体。如果为 true，则确定背面剔除
   * 通过 glTF 材质的 doubleSided 属性;如果为 false，则禁用背面剔除。
   *
   * @type {boolean}
   * @default true
   */
  this.backFaceCulling = defaultValue(options.backFaceCulling, true);

  this._enableShowOutline = defaultValue(options.enableShowOutline, true);

  /**
   * 是否显示使用
   * {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。
   * 如果为 true，则显示轮廓。如果为 false，则不显示轮廓。
   *
   * @type {boolean}
   * @default true
   */
  this.showOutline = defaultValue(options.showOutline, true);

  /**
   * 渲染轮廓时使用的颜色。
   *
   * @type {Color}
   * @default Color.BLACK
   */
  this.outlineColor = defaultValue(options.outlineColor, Color.BLACK);

  /**
   * 要应用于此图块集的 {@link SplitDirection}。
   *
   * @type {SplitDirection}
   * @default {@link SplitDirection.NONE}
   */
  this.splitDirection = defaultValue(
    options.splitDirection,
    SplitDirection.NONE,
  );

  /**
   * 如果<code>为 true</code>，则允许摄像机碰撞或拾取的碰撞。虽然这是<code>真的</code>，但如果 {@link ScreenSpaceCameraController#enableCollisionDetection} 为 true，则相机将被阻止进入或低于图块集表面。如果图块集包含具有大量顶点的图块，则这可能会对性能产生影响。
   *
   * @type {boolean}
   * @default false
   */
  this.enableCollision = defaultValue(options.enableCollision, false);
  this._projectTo2D = defaultValue(options.projectTo2D, false);
  this._enablePick = defaultValue(options.enablePick, false);

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 确定是否只应使用上一帧中的平铺进行渲染。 这
   * 有效地将 tileset “冻结”到前一帧，以便可以缩放
   * 出来，看看渲染了什么。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugFreezeFrame = defaultValue(options.debugFreezeFrame, false);

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则为每个平铺分配随机颜色。 这对于可视化
   * 哪些特征属于哪些瓦片，尤其是使用加法细化 WHERE 特征
   * 来自父切片的要素可以与来自子切片的要素交错。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugColorizeTiles = defaultValue(options.debugColorizeTiles, false);

  this._enableDebugWireframe = defaultValue(
    options.enableDebugWireframe,
    false,
  );

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则将每个瓦片的内容呈现为线框。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugWireframe = defaultValue(options.debugWireframe, false);

  // Warning for improper setup of debug wireframe
  if (this.debugWireframe === true && this._enableDebugWireframe === false) {
    oneTimeWarning(
      "tileset-debug-wireframe-ignored",
      "enableDebugWireframe must be set to true in the Cesium3DTileset constructor, otherwise debugWireframe will be ignored.",
    );
  }

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则渲染每个可见瓦片的边界体积。 边界体积为
   * 如果磁贴具有内容边界卷或为空，则为白色;否则，它将变为红色。 不符合
   * 屏幕空间错误，并且仍在优化其后代是黄色的。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则渲染每个可见图块内容的边界体积。边界体积为
   * 如果磁贴具有内容边界体积，则为蓝色;否则为红色。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowContentBoundingVolume = defaultValue(
    options.debugShowContentBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则呈现每个图块的查看器请求量。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowViewerRequestVolume = defaultValue(
    options.debugShowViewerRequestVolume,
    false,
  );

  /**
   * @private
   * @type {LabelCollection|undefined}
   */
  this._tileDebugLabels = undefined;
  this.debugPickedTileLabelOnly = false;
  this.debugPickedTile = undefined;
  this.debugPickPosition = undefined;

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则绘制标签以指示每个图块的几何误差。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowGeometricError = defaultValue(
    options.debugShowGeometricError,
    false,
  );

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则绘制标签以指示每个图块的命令、点、三角形和功能的数量。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowRenderingStatistics = defaultValue(
    options.debugShowRenderingStatistics,
    false,
  );

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则绘制标签以指示每个瓦片的几何图形和纹理内存使用情况。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowMemoryUsage = defaultValue(options.debugShowMemoryUsage, false);

  /**
   * 此属性仅用于调试;它未针对生产使用进行优化。
   * <p>
   * 如果为 true，则绘制标签以指示每个图块的 URL。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowUrl = defaultValue(options.debugShowUrl, false);

  /**
   * 用于在流式时检查矢量线的函数。
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
   *
   * @type {Function}
   */
  this.examineVectorLinesFunction = undefined;

  // this is the underlying Cesium3DTileMetadata object, whether it came from
  // the 3DTILES_metadata extension or a 3D Tiles 1.1 tileset JSON. Getters
  // like tileset.metadata and tileset.schema will delegate to this object.
  this._metadataExtension = undefined;

  this._customShader = options.customShader;

  let featureIdLabel = defaultValue(options.featureIdLabel, "featureId_0");
  if (typeof featureIdLabel === "number") {
    featureIdLabel = `featureId_${featureIdLabel}`;
  }
  this._featureIdLabel = featureIdLabel;

  let instanceFeatureIdLabel = defaultValue(
    options.instanceFeatureIdLabel,
    "instanceFeatureId_0",
  );
  if (typeof instanceFeatureIdLabel === "number") {
    instanceFeatureIdLabel = `instanceFeatureId_${instanceFeatureIdLabel}`;
  }
  this._instanceFeatureIdLabel = instanceFeatureIdLabel;
}

Object.defineProperties(Cesium3DTileset.prototype, {
  /**
   * 注意：这个 getter 的存在是为了让 'Picking.js' 可以区分
   * PrimitiveCollection 和 Cesium3DTileset 对象，无需膨胀
   * 通过 'instanceof Cesium3DTileset' 的模块大小
   * @private
   */
  isCesium3DTileset: {
    get: function () {
      return true;
    },
  },

  /**
   * 获取图块集的 asset object 属性，其中包含有关图块集的元数据。
   * <p>
   * 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#reference-asset|asset schema reference}
   * 在 3D Tiles 规范中了解完整的属性集。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   */
  asset: {
    get: function () {
      return this._asset;
    },
  },

  /**
   * 获取图块集的 extensions 对象属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },

  /**
   * 用于选择性地禁用图块集渲染的 {@link ClippingPlaneCollection}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._clippingPlanes;
    },
    set: function (value) {
      ClippingPlaneCollection.setOwner(value, this, "_clippingPlanes");
    },
  },

  /**
   * 用于选择性地禁用图块集渲染的 {@link ClippingPolygonCollection}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClippingPolygonCollection}
   */
  clippingPolygons: {
    get: function () {
      return this._clippingPolygons;
    },
    set: function (value) {
      ClippingPolygonCollection.setOwner(value, this, "_clippingPolygons");
    },
  },

  /**
   * 获取图块集的 properties 字典对象，其中包含有关每个特征属性的元数据。
   * <p>
   * 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#reference-properties|properties 架构参考}
   * 在 3D Tiles 规范中了解完整的属性集。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   *
   * @example
   * console.log(`Maximum building height: ${tileset.properties.height.maximum}`);
   * console.log(`Minimum building height: ${tileset.properties.height.minimum}`);
   *
   * @see Cesium3DTileFeature#getProperty
   * @see Cesium3DTileFeature#setProperty
   */
  properties: {
    get: function () {
      return this._properties;
    },
  },

  /**
   * 如果<code>为 true</code>，则加载满足此帧的屏幕空间错误的所有图块。图块集为
   * 完全加载此视图。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   *
   * @see Cesium3DTileset#allTilesLoaded
   */
  tilesLoaded: {
    get: function () {
      return this._tilesLoaded;
    },
  },

  /**
   * 用于获取瓦片集 JSON 文件的资源
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },

  /**
   * 瓦片集 JSON 文件中非绝对路径的相对基本路径。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @readonly
   * @deprecated
   */
  basePath: {
    get: function () {
      deprecationWarning(
        "Cesium3DTileset.basePath",
        "Cesium3DTileset.basePath has been deprecated. All tiles are relative to the url of the tileset JSON file that contains them. Use the url property instead.",
      );
      return this._basePath;
    },
  },

  /**
   * 样式，使用
   * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D 瓦片样式语言}，
   * 应用于图块集中的每个功能。
   * <p>
   * 分配 <code>undefined</code> 以删除样式，这将恢复视觉效果
   * 未应用样式时，图块集的外观为默认值。
   * </p>
   * <p>
   * 样式应用于 {@link Cesium3DTileset#tileVisible} 之前的瓦片
   * 事件，因此 <code>tileVisible</code> 中的代码可以手动设置特征的
   * 属性（例如 color 和 show）。什么时候
   * 为新样式分配任何手动设置的属性都将被覆盖。
   * </p>
   * <p>
   * 使用始终为 “true” 的条件为所有不是 “true” 的对象指定 Color
   * 被原有疾病覆盖。否则，默认颜色 Cesium.Color.White
   * 将被使用。同样，使用始终为 “true” 条件来指定 show 属性
   * 对于未被预先存在的条件覆盖的所有对象。否则，
   * 将使用默认的显示值 true。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Cesium3DTileStyle|undefined}
   *
   * @default undefined
   *
   * @example
   * tileset.style = new Cesium.Cesium3DTileStyle({
   *    color : {
   *        conditions : [
   *            ['${Height} >= 100', 'color("purple", 0.5)'],
   *            ['${Height} >= 50', 'color("red")'],
   *            ['true', 'color("blue")']
   *        ]
   *    },
   *    show : '${Height} > 0',
   *    meta : {
   *        description : '"Building id ${id} has height ${Height}."'
   *    }
   * });
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
   */
  style: {
    get: function () {
      return this._styleEngine.style;
    },
    set: function (value) {
      this._styleEngine.style = value;
    },
  },

  /**
   * 应用于图块集中所有图块的自定义着色器。仅用于
   * 使用 {@link Model} 的内容。将自定义着色器与
   * {@link Cesium3DTileStyle} 可能会导致未定义的行为。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {CustomShader|undefined}
   *
   * @default undefined
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
   */
  customShader: {
    get: function () {
      return this._customShader;
    },
    set: function (value) {
      this._customShader = value;
    },
  },

  /**
   * 瓦片集是否在同一视图中渲染不同级别的细节。
   * 仅当 {@link Cesium3DTileset.isSkippingLevelOfDetail} 为 true 时才相关。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @private
   */
  hasMixedContent: {
    get: function () {
      return this._hasMixedContent;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');

      this._hasMixedContent = value;
    },
  },

  /**
   * 此图块集是否实际上跳过了细节级别。
   * 如果所有图块都使用加法细化，则用户选项可能已被禁用，
   * 或者，如果某些磁贴具有渲染不支持跳过的内容类型
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @private
   * @readonly
   */
  isSkippingLevelOfDetail: {
    get: function () {
      return (
        this.skipLevelOfDetail &&
        !defined(this._classificationType) &&
        !this._disableSkipLevelOfDetail &&
        !this._allTilesAdditive
      );
    },
  },

  /**
   * 图块集的架构、组、图块集元数据和其他详细信息，来自
   * 3DTILES_metadata扩展或 3D Tiles 1.1 图块集 JSON。这个 getter 是
   * 供其他类内部使用。
   *
   * @memberof Cesium3DTileset.prototype
   * @type {Cesium3DTilesetMetadata}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  metadataExtension: {
    get: function () {
      return this._metadataExtension;
    },
  },

  /**
   * 附加到整个图块集的元数据属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {TilesetMetadata}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  metadata: {
    get: function () {
      if (defined(this._metadataExtension)) {
        return this._metadataExtension.tileset;
      }

      return undefined;
    },
  },

  /**
   * 此图块集中使用的元数据架构。的简写
   * <code>tileset.metadataExtension.schema</code>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {MetadataSchema}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  schema: {
    get: function () {
      if (defined(this._metadataExtension)) {
        return this._metadataExtension.schema;
      }

      return undefined;
    },
  },

  /**
   * 用于驱动细节层次优化的最大屏幕空间误差。 此值有助于确定何时显示
   * 优化到其后代，因此在平衡性能与视觉质量方面发挥着重要作用。
   * <p>
   * 瓦片的屏幕空间误差大致相当于如果
   * 半径等于瓦片的<b>几何误差</b>，则在瓦片的位置渲染。如果此值超过
   * <code>maximumScreenSpaceError</code> 磁贴细化为其后代。
   * </p>
   * <p>
   * 根据图块集，可能需要调整 <code>maximumScreenSpaceError</code> 以实现适当的平衡。
   * 值越高，性能越好，但视觉质量越低。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 16
   *
   * @exception {DeveloperError} <code>maximumScreenSpaceError</code> must be greater than or equal to zero.
   */
  maximumScreenSpaceError: {
    get: function () {
      return this._maximumScreenSpaceError;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals(
        "maximumScreenSpaceError",
        value,
        0,
      );
      //>>includeEnd('debug');

      this._maximumScreenSpaceError = value;
      this._memoryAdjustedScreenSpaceError = value;
    },
  },

  /**
   * 用于缓存切片的 GPU 内存量（以字节为单位）。此内存使用量的估计公式为
   * 加载的图块的几何图形、纹理和批处理表纹理。对于点云，此值还
   * 包括每个点的元数据。
   * <p>
   * 未在视图中的图块将被卸载以强制执行此操作。
   * </p>
   * <p>
   * 如果减小此值导致卸载图块，则会在下一帧卸载图块。
   * </p>
   * <p>
   * 如果需要大小大于 <code>cacheBytes</code> 的切片才能满足
   * 所需屏幕空间误差，由 {@link Cesium3DTileset#maximumScreenSpaceError} 确定，
   * 对于当前视图，则加载的瓦片的内存使用量将超过
   * <code>cacheBytes</code> 最多增加 <code>maximumCacheOverflowBytes</code>。
   * 例如，如果 <code>cacheBytes</code> 为 500000，但为 600000 字节
   * 的瓦片需要满足屏幕空间错误，则 600000 字节的瓦片
   * 可能会加载（如果 <code>maximumCacheOverflowBytes</code> 至少为 100000）。
   * 当这些图块离开视野时，它们将被卸载。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 536870912
   *
   * @exception {DeveloperError} <code>cacheBytes</code> must be typeof 'number' and greater than or equal to 0
   * @see Cesium3DTileset#totalMemoryUsageInBytes
   */
  cacheBytes: {
    get: function () {
      return this._cacheBytes;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0);
      //>>includeEnd('debug');

      this._cacheBytes = value;
    },
  },

  /**
   * 将用于缓存切片的最大额外 GPU 内存量（以字节为单位）。
   * <p>
   * 如果切片大小大于 <code>cacheBytes</code> 加上 <code>maximumCacheOverflowBytes</code>
   * 需要满足所需的屏幕空间误差，由
   * {@link Cesium3DTileset#maximumScreenSpaceError} 表示当前视图，则
   * {@link Cesium3DTileset#memoryAdjustedScreenSpaceError} 将被调整
   * 直到平铺所需的满足调整后的屏幕空间误差 使用较少
   * 大于 <code>cacheBytes</code> 加上 <code>maximumCacheOverflowBytes</code>。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 536870912
   *
   * @exception {DeveloperError} <code>maximumCacheOverflowBytes</code> must be typeof 'number' and greater than or equal to 0
   * @see Cesium3DTileset#totalMemoryUsageInBytes
   */
  maximumCacheOverflowBytes: {
    get: function () {
      return this._maximumCacheOverflowBytes;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0);
      //>>includeEnd('debug');

      this._maximumCacheOverflowBytes = value;
    },
  },

  /**
   * 如果加载 @{link Cesium3DTileset#maximumScreenSpaceError} 所需的细节级别
   * 导致内存使用量超过 @{link Cesium3DTileset#cacheBytes}
   * 加上 @{link Cesium3DTileset#maximumCacheOverflowBytes}，详细程度优化
   * 将改用这个（更大）调整的屏幕空间误差来实现
   * 在可用内存内实现最佳视觉质量
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   *
   * @private
   */
  memoryAdjustedScreenSpaceError: {
    get: function () {
      return this._memoryAdjustedScreenSpaceError;
    },
  },

  /**
   * 用于根据几何误差和 Eye Dome 照明控制点大小的选项。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {PointCloudShading}
   */
  pointCloudShading: {
    get: function () {
      return this._pointCloudShading;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("pointCloudShading", value);
      //>>includeEnd('debug');
      this._pointCloudShading = value;
    },
  },

  /**
   * 根磁贴。
   *
   * @memberOf Cesium3DTileset.prototype
   *
   * @type {Cesium3DTile}
   * @readonly
   */
  root: {
    get: function () {
      return this._root;
    },
  },

  /**
   * 图块集的边界球体。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   *
   * @example
   * const tileset = await Cesium.Cesium3DTileset.fromUrl("http://localhost:8002/tilesets/Seattle/tileset.json");
   *
   * viewer.scene.primitives.add(tileset);
   *
   * // Set the camera to view the newly added tileset
   * viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
   */
  boundingSphere: {
    get: function () {
      this._root.updateTransform(this._modelMatrix);
      return this._root.boundingSphere;
    },
  },

  /**
   * 一个 4x4 转换矩阵，用于转换整个图块集。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   *
   * @example
   * // Adjust a tileset's height from the globe's surface.
   * const heightOffset = 20.0;
   * const boundingSphere = tileset.boundingSphere;
   * const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
   * const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
   * const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
   * const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
   * tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
   */
  modelMatrix: {
    get: function () {
      return this._modelMatrix;
    },
    set: function (value) {
      this._modelMatrix = Matrix4.clone(value, this._modelMatrix);
    },
  },

  /**
   * 返回自加载和首次更新图块集以来的时间（以毫秒为单位）。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   */
  timeSinceLoad: {
    get: function () {
      return this._timeSinceLoad;
    },
  },

  /**
   * 图块集使用的 GPU 内存总量（以字节为单位）。该值的估算公式为
   * 加载的图块的几何图形、纹理、批处理表纹理和二进制元数据。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see Cesium3DTileset#cacheBytes
   */
  totalMemoryUsageInBytes: {
    get: function () {
      const statistics = this._statistics;
      return (
        statistics.texturesByteLength +
        statistics.geometryByteLength +
        statistics.batchTableByteLength
      );
    },
  },

  /**
   * @private
   */
  clippingPlanesOriginMatrix: {
    get: function () {
      if (!defined(this._clippingPlanesOriginMatrix)) {
        return Matrix4.IDENTITY;
      }

      if (this._clippingPlanesOriginMatrixDirty) {
        Matrix4.multiply(
          this.root.computedTransform,
          this._initialClippingPlanesOriginMatrix,
          this._clippingPlanesOriginMatrix,
        );
        this._clippingPlanesOriginMatrixDirty = false;
      }

      return this._clippingPlanesOriginMatrix;
    },
  },

  /**
   * @private
   */
  styleEngine: {
    get: function () {
      return this._styleEngine;
    },
  },

  /**
   * @private
   */
  statistics: {
    get: function () {
      return this._statistics;
    },
  },

  /**
   * 确定地形、3D 瓦片还是按此瓦片集对两者进行分类。
   * <p>
   * 此选项仅适用于包含批处理 3D 模型的瓦片集，
   * glTF 内容、几何数据或矢量数据。即使未定义，vector
   * 和几何数据必须呈现为分类，并将默认为
   * 在地形和其他 3D 瓦片集上渲染。
   * </p>
   * <p>
   * 当为批处理 3D 模型和 glTF 瓦片集启用时，有一些
   * glTF 的要求/限制：
   * <ul>
   * <li>glTF 不能包含变形目标、皮肤或动画。</li>
   * <li>glTF 不能包含 <code>EXT_mesh_gpu_instancing</code> 扩展。</li>
   * <li>只有带有 TRIANGLES 的网格才能用于对其他资产进行分类。</li>
   * <li>网格必须防水。</li>
   * <li>需要 <code>POSITION</code> 语义。</li>
   * <li>如果 <code>_BATCHID</code>秒和索引缓冲区都存在，则具有相同批处理 ID 的所有索引必须占据索引缓冲区的连续部分。</li>
   * <li>如果存在没有索引缓冲区的 <code>_BATCHID</code>个，则具有相同批处理 ID 的所有位置必须占据位置缓冲区的连续部分。</li>
   * </ul>
   * </p>
   * <p>
   * 此外，点或实例化 3D 不支持分类
   *模型。
   * </p>
   * <p>
   * 接受分类的 3D 瓦片或地形必须是不透明的。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClassificationType}
   * @default undefined
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   * @readonly
   */
  classificationType: {
    get: function () {
      return this._classificationType;
    },
  },

  /**
   * 获取描述地球形状的椭球体。
   *
   * @memberof Cesium3DTileset.prototype
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
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制确定延迟哪些图块的圆锥体大小。
   * 此圆锥体内的图块会立即加载。圆锥体外的图块可能会根据它们在圆锥体外的距离以及 {@link Cesium3DTileset#foveatedInterpolationCallback} 和 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 进行延迟。
   * 将此设置为 0.0 意味着圆锥体将是摄像机位置及其视图方向形成的线。将此设置为 1.0 意味着圆锥体包含摄像机的整个视野，实质上会禁用该效果。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 0.3
   */
  foveatedConeSize: {
    get: function () {
      return this._foveatedConeSize;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("foveatedConeSize", value, 0.0);
      Check.typeOf.number.lessThanOrEquals("foveatedConeSize", value, 1.0);
      //>>includeEnd('debug');

      this._foveatedConeSize = value;
    },
  },

  /**
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制凹圆锥体外磁贴的起始屏幕空间误差松弛。
   * 根据提供的 {@link Cesium3DTileset#foveatedInterpolationCallback}，从此值开始，将引发屏幕空间错误，直到 {@link Cesium3DTileset#maximumScreenSpaceError}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 0.0
   */
  foveatedMinimumScreenSpaceErrorRelaxation: {
    get: function () {
      return this._foveatedMinimumScreenSpaceErrorRelaxation;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals(
        "foveatedMinimumScreenSpaceErrorRelaxation",
        value,
        0.0,
      );
      Check.typeOf.number.lessThanOrEquals(
        "foveatedMinimumScreenSpaceErrorRelaxation",
        value,
        this.maximumScreenSpaceError,
      );
      //>>includeEnd('debug');

      this._foveatedMinimumScreenSpaceErrorRelaxation = value;
    },
  },

  /**
   * 返回图块集 JSON 顶层的 <code>extras</code> 属性，其中包含特定于应用程序的元数据。
   * 如果 <code>extras</code> 不存在，则返回 <code>undefined</code>。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {*}
   * @readonly
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
   */
  extras: {
    get: function () {
      return this._extras;
    },
  },

  /**
   * 用于管理此图块集上基于图像的光照的属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ImageBasedLighting}
   */
  imageBasedLighting: {
    get: function () {
      return this._imageBasedLighting;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("imageBasedLighting", this._imageBasedLighting);
      //>>includeEnd('debug');
      if (value !== this._imageBasedLighting) {
        if (
          this._shouldDestroyImageBasedLighting &&
          !this._imageBasedLighting.isDestroyed()
        ) {
          this._imageBasedLighting.destroy();
        }
        this._imageBasedLighting = value;
        this._shouldDestroyImageBasedLighting = false;
      }
    },
  },

  /**
   * 指示只应使用瓦片集的矢量瓦片进行分类。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   *
   * @type {boolean}
   * @default false
   */
  vectorClassificationOnly: {
    get: function () {
      return this._vectorClassificationOnly;
    },
  },

  /**
   * 矢量瓦片是否应在内存中保留解码的位置。
   * 此用于 {@link Cesium3DTileFeature.getPolylinePositions}.
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   *
   * @type {boolean}
   * @default false
   */
  vectorKeepDecodedPositions: {
    get: function () {
      return this._vectorKeepDecodedPositions;
    },
  },

  /**
   * 确定是否在屏幕上显示图块集的积分
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @default false
   */
  showCreditsOnScreen: {
    get: function () {
      return this._showCreditsOnScreen;
    },
    set: function (value) {
      this._showCreditsOnScreen = value;
      createCredits(this);
    },
  },

  /**
   * 用于拾取和样式设置的特征 ID 的标签。
   * <p>
   * 对于EXT_mesh_features，这是要素 ID 的 label 属性，或者
   * “featureId_N”（其中 N 是 featureIds 数组中的索引），否则
   *指定。EXT_feature_metadata没有 label 字段，因此
   * 要素 ID 集始终标记为“featureId_N”，其中 N 是
   * 所有特征 ID 的列表，其中特征 ID 属性列在前面
   * 特征 ID 纹理。
   * </p>
   * <p>
   * 如果 featureIdLabel 设置为整数 N，则将其转换为
   * 字符串 “featureId_N” 自动。如果每个基元和
   * 存在每个实例的功能 ID，实例功能 ID 采用
   *优先权。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  featureIdLabel: {
    get: function () {
      return this._featureIdLabel;
    },
    set: function (value) {
      // indices get converted into featureId_N
      if (typeof value === "number") {
        value = `featureId_${value}`;
      }

      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.string("value", value);
      //>>includeEnd('debug');

      this._featureIdLabel = value;
    },
  },

  /**
   * 用于选取和设置样式的实例特征 ID 集的标签。
   * <p>
   * 如果 instanceFeatureIdLabel 设置为整数 N，则将其转换为
   * 字符串 “instanceFeatureId_N” 自动。
   * 如果每个基元和每个实例的特征 ID 都存在，则
   * 实例功能 ID 优先。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  instanceFeatureIdLabel: {
    get: function () {
      return this._instanceFeatureIdLabel;
    },
    set: function (value) {
      // indices get converted into instanceFeatureId_N
      if (typeof value === "number") {
        value = `instanceFeatureId_${value}`;
      }

      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.string("value", value);
      //>>includeEnd('debug');

      this._instanceFeatureIdLabel = value;
    },
  },
});

/**
 * 创建一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles 图块集}，
 * 用于从 Cesium 离子资产 ID 流式传输大量异构 3D 地理空间数据集。
 *
 * @param {number} assetId 铯离子资产 ID。
 * @param {Cesium3DTileset.ConstructorOptions} [options] 一个描述初始化选项的对象
 * @returns {Promise<Cesium3DTileset>}
 *
 * @exception {RuntimeError} When the tileset asset version is not 0.0, 1.0, or 1.1,
 * or when the tileset contains a required extension that is not supported.
 *
 * @see Cesium3DTileset#fromUrl
 *
 * @example
 * // Load a Cesium3DTileset with a Cesium ion asset ID of 124624234
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(124624234);
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 */
Cesium3DTileset.fromIonAssetId = async function (assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("assetId", assetId);
  //>>includeEnd('debug');

  const resource = await IonResource.fromAssetId(assetId);
  return Cesium3DTileset.fromUrl(resource, options);
};

/**
 * 创建一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles 图块集}，
 * 用于流式传输大量异构 3D 地理空间数据集。
 *
 * @param {Resource|string} url 图块集 JSON 文件的 URL。
 * @param {Cesium3DTileset.ConstructorOptions} [options] 一个描述初始化选项的对象
 * @returns {Promise<Cesium3DTileset>}
 *
 * @exception {RuntimeError} When the tileset asset version is not 0.0, 1.0, or 1.1,
 * or when the tileset contains a required extension that is not supported.
 *
 * @see Cesium3DTileset#fromIonAssetId
 *
 * @example
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json"
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Common setting for the skipLevelOfDetail optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      skipLevelOfDetail: true,
 *      baseScreenSpaceError: 1024,
 *      skipScreenSpaceErrorFactor: 16,
 *      skipLevels: 1,
 *      immediatelyLoadDesiredLevelOfDetail: false,
 *      loadSiblings: false,
 *      cullWithChildrenBounds: true
 * });
 * scene.primitives.add(tileset);
 *
 * @example
 * // Common settings for the dynamicScreenSpaceError optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      dynamicScreenSpaceError: true,
 *      dynamicScreenSpaceErrorDensity: 2.0e-4,
 *      dynamicScreenSpaceErrorFactor: 24.0,
 *      dynamicScreenSpaceErrorHeightFalloff: 0.25
 * });
 * scene.primitives.add(tileset);
 */
Cesium3DTileset.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(url);
  let basePath;
  if (resource.extension === "json") {
    basePath = resource.getBaseUri(true);
  } else if (resource.isDataUri) {
    basePath = "";
  }

  const tilesetJson = await Cesium3DTileset.loadJson(resource);
  const metadataExtension = await processMetadataExtension(
    resource,
    tilesetJson,
  );

  const tileset = new Cesium3DTileset(options);
  tileset._resource = resource;
  tileset._url = resource.url;
  tileset._basePath = basePath;
  tileset._metadataExtension = metadataExtension;
  // Set these before loading the tileset since _geometricError
  // and _scaledGeometricError get accessed during tile creation
  tileset._geometricError = tilesetJson.geometricError;
  tileset._scaledGeometricError = tilesetJson.geometricError;

  const asset = tilesetJson.asset;
  tileset._asset = asset;
  tileset._extras = tilesetJson.extras;

  createCredits(tileset);

  // Handle legacy gltfUpAxis option
  const gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis)
    ? Axis.fromName(tilesetJson.asset.gltfUpAxis)
    : Axis.Y;
  const modelUpAxis = defaultValue(options.modelUpAxis, gltfUpAxis);
  const modelForwardAxis = defaultValue(options.modelForwardAxis, Axis.X);

  tileset._properties = tilesetJson.properties;
  tileset._extensionsUsed = tilesetJson.extensionsUsed;
  tileset._extensions = tilesetJson.extensions;
  tileset._modelUpAxis = modelUpAxis;
  tileset._modelForwardAxis = modelForwardAxis;

  tileset._root = tileset.loadTileset(resource, tilesetJson);

  // Save the original, untransformed bounding volume position so we can apply
  // the tile transform and model matrix at run time
  const boundingVolume = tileset._root.createBoundingVolume(
    tilesetJson.root.boundingVolume,
    Matrix4.IDENTITY,
  );
  const clippingPlanesOrigin = boundingVolume.boundingSphere.center;
  // If this origin is above the surface of the earth
  // we want to apply an ENU orientation as our best guess of orientation.
  // Otherwise, we assume it gets its position/orientation completely from the
  // root tile transform and the tileset's model matrix
  const originCartographic =
    tileset._ellipsoid.cartesianToCartographic(clippingPlanesOrigin);
  if (
    defined(originCartographic) &&
    originCartographic.height >
      ApproximateTerrainHeights._defaultMinTerrainHeight
  ) {
    tileset._initialClippingPlanesOriginMatrix =
      Transforms.eastNorthUpToFixedFrame(clippingPlanesOrigin);
  }
  tileset._clippingPlanesOriginMatrix = Matrix4.clone(
    tileset._initialClippingPlanesOriginMatrix,
  );

  return tileset;
};

/**
 * 提供一个钩子来覆盖用于请求图块集 json 的方法
 * 从远程服务器获取瓦片集时很有用
 * @param {Resource|string} tilesetUrl 需要获取的 json 文件的 url
 * @returns {Promise<object>} 使用获取的 json 数据进行 resolve 的 promise
 */
Cesium3DTileset.loadJson = function (tilesetUrl) {
  const resource = Resource.createIfNeeded(tilesetUrl);
  return resource.fetchJson();
};

/**
 * 将图块集的 {@link Cesium3DTileset#style} 标记为 dirty，这将强制所有
 * 功能重新评估样式，在下一帧中每个都是可见的。
 */
Cesium3DTileset.prototype.makeStyleDirty = function () {
  this._styleEngine.makeDirty();
};

/**
 * 加载主图块集 JSON 文件或从图块引用的图块集 JSON 文件。
 *
 * @exception {RuntimeError} 当图块集资源版本不是 0.0、1.0 或 1.1 时，
 * 或当图块集包含不受支持的必需扩展时。
 *
 * @private
 */
Cesium3DTileset.prototype.loadTileset = function (
  resource,
  tilesetJson,
  parentTile,
) {
  const asset = tilesetJson.asset;
  if (!defined(asset)) {
    throw new RuntimeError("Tileset must have an asset property.");
  }
  if (
    asset.version !== "0.0" &&
    asset.version !== "1.0" &&
    asset.version !== "1.1"
  ) {
    throw new RuntimeError(
      "The tileset must be 3D Tiles version 0.0, 1.0, or 1.1",
    );
  }

  if (defined(tilesetJson.extensionsRequired)) {
    Cesium3DTileset.checkSupportedExtensions(tilesetJson.extensionsRequired);
  }

  const statistics = this._statistics;

  const tilesetVersion = asset.tilesetVersion;
  if (defined(tilesetVersion)) {
    // Append the tileset version to the resource
    this._basePath += `?v=${tilesetVersion}`;
    resource = resource.clone();
    resource.setQueryParameters({ v: tilesetVersion });
  }

  // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
  // Get the basePath relative to the external tileset.
  const rootTile = makeTile(this, resource, tilesetJson.root, parentTile);

  // If there is a parentTile, add the root of the currently loading tileset
  // to parentTile's children, and update its _depth.
  if (defined(parentTile)) {
    parentTile.children.push(rootTile);
    rootTile._depth = parentTile._depth + 1;
  }

  const stack = [];
  stack.push(rootTile);

  while (stack.length > 0) {
    const tile = stack.pop();
    ++statistics.numberOfTilesTotal;
    this._allTilesAdditive =
      this._allTilesAdditive && tile.refine === Cesium3DTileRefine.ADD;
    const children = tile._header.children;
    if (defined(children)) {
      for (let i = 0; i < children.length; ++i) {
        const childHeader = children[i];
        const childTile = makeTile(this, resource, childHeader, tile);
        tile.children.push(childTile);
        childTile._depth = tile._depth + 1;
        stack.push(childTile);
      }
    }

    if (this._cullWithChildrenBounds) {
      Cesium3DTileOptimizations.checkChildrenWithinParent(tile);
    }
  }

  return rootTile;
};

/**
 * 为特定图块制作 {@link Cesium3DTile}。如果磁贴的标题具有隐式
 * 平铺 （3D Tiles 1.1） 或使用 <code>3DTILES_implicit_tiling</code> 扩展，
 * 它会创建一个占位符图块，而不是用于隐式图块集的延迟计算。
 *
 * @param {Cesium3DTileset} 瓦片集
 * @param {Resource} baseResource 瓦片集的基础资源
 * @param {object} tileHeader 瓦片的 JSON 标头
 * @param {Cesium3DTile} [parentTile] 新瓦片的父瓦片
 * @returns {Cesium3DTile} 新创建的瓦片
 *
 * @private
 */
function makeTile(tileset, baseResource, tileHeader, parentTile) {
  const hasImplicitTiling =
    defined(tileHeader.implicitTiling) ||
    hasExtension(tileHeader, "3DTILES_implicit_tiling");

  if (!hasImplicitTiling) {
    return new Cesium3DTile(tileset, baseResource, tileHeader, parentTile);
  }

  const metadataSchema = tileset.schema;

  const implicitTileset = new ImplicitTileset(
    baseResource,
    tileHeader,
    metadataSchema,
  );
  const rootCoordinates = new ImplicitTileCoordinates({
    subdivisionScheme: implicitTileset.subdivisionScheme,
    subtreeLevels: implicitTileset.subtreeLevels,
    level: 0,
    x: 0,
    y: 0,
    // The constructor will only use this for octrees.
    z: 0,
  });

  // Create a placeholder Cesium3DTile that has an ImplicitTileset
  // object and whose content will resolve to an Implicit3DTileContent
  const contentUri = implicitTileset.subtreeUriTemplate.getDerivedResource({
    templateValues: rootCoordinates.getTemplateValues(),
  }).url;

  const deepCopy = true;
  const tileJson = clone(tileHeader, deepCopy);
  // Replace contents with the subtree
  tileJson.contents = [
    {
      uri: contentUri,
    },
  ];

  delete tileJson.content;

  // The placeholder tile does not have any extensions. If there are any
  // extensions beyond 3DTILES_implicit_tiling, Implicit3DTileContent will
  // copy them to the transcoded tiles.
  delete tileJson.extensions;

  const tile = new Cesium3DTile(tileset, baseResource, tileJson, parentTile);
  tile.implicitTileset = implicitTileset;
  tile.implicitCoordinates = rootCoordinates;
  return tile;
}

/**
 * 如果存在图块集元数据，则初始化 {@link Cesium3DTilesetMetadata}
 *实例。这是异步的，因为元数据架构可能是外部的。
 *
 * @param {Cesium3DTileset} 瓦片集
 * @param {object} tilesetJson 瓦片集 JSON
 * @return {Promise<Cesium3DTilesetMetadata>} 加载的 Cesium3DTilesetMetadata
 * @private
 */
async function processMetadataExtension(resource, tilesetJson) {
  const metadataJson = hasExtension(tilesetJson, "3DTILES_metadata")
    ? tilesetJson.extensions["3DTILES_metadata"]
    : tilesetJson;

  let schemaLoader;
  if (defined(metadataJson.schemaUri)) {
    resource = resource.getDerivedResource({
      url: metadataJson.schemaUri,
    });
    schemaLoader = ResourceCache.getSchemaLoader({
      resource: resource,
    });
  } else if (defined(metadataJson.schema)) {
    schemaLoader = ResourceCache.getSchemaLoader({
      schema: metadataJson.schema,
    });
  } else {
    return;
  }

  await schemaLoader.load();

  const metadataExtension = new Cesium3DTilesetMetadata({
    schema: schemaLoader.schema,
    metadataJson: metadataJson,
  });

  ResourceCache.unload(schemaLoader);

  return metadataExtension;
}

const scratchPositionNormal = new Cartesian3();
const scratchCartographic = new Cartographic();
const scratchMatrix = new Matrix4();
const scratchCenter = new Cartesian3();
const scratchPosition = new Cartesian3();
const scratchDirection = new Cartesian3();
const scratchHalfHeight = new Cartesian3();

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function updateDynamicScreenSpaceError(tileset, frameState) {
  let up;
  let direction;
  let height;
  let minimumHeight;
  let maximumHeight;

  const camera = frameState.camera;
  const root = tileset._root;
  const tileBoundingVolume = root.contentBoundingVolume;

  if (tileBoundingVolume instanceof TileBoundingRegion) {
    up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
    direction = camera.directionWC;
    height = camera.positionCartographic.height;
    minimumHeight = tileBoundingVolume.minimumHeight;
    maximumHeight = tileBoundingVolume.maximumHeight;
  } else {
    // Transform camera position and direction into the local coordinate system of the tileset
    const transformLocal = Matrix4.inverseTransformation(
      root.computedTransform,
      scratchMatrix,
    );
    const ellipsoid = frameState.mapProjection.ellipsoid;
    const boundingVolume = tileBoundingVolume.boundingVolume;
    const centerLocal = Matrix4.multiplyByPoint(
      transformLocal,
      boundingVolume.center,
      scratchCenter,
    );
    if (Cartesian3.magnitude(centerLocal) > ellipsoid.minimumRadius) {
      // The tileset is defined in WGS84. Approximate the minimum and maximum height.
      const centerCartographic = Cartographic.fromCartesian(
        centerLocal,
        ellipsoid,
        scratchCartographic,
      );
      up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
      direction = camera.directionWC;
      height = camera.positionCartographic.height;
      minimumHeight = 0.0;
      maximumHeight = centerCartographic.height * 2.0;
    } else {
      // The tileset is defined in local coordinates (z-up)
      const positionLocal = Matrix4.multiplyByPoint(
        transformLocal,
        camera.positionWC,
        scratchPosition,
      );
      up = Cartesian3.UNIT_Z;
      direction = Matrix4.multiplyByPointAsVector(
        transformLocal,
        camera.directionWC,
        scratchDirection,
      );
      direction = Cartesian3.normalize(direction, direction);
      height = positionLocal.z;
      if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
        // Assuming z-up, the last column is the local z direction and
        // represents the height of the bounding box.
        const halfHeightVector = Matrix3.getColumn(
          boundingVolume.halfAxes,
          2,
          scratchHalfHeight,
        );
        const halfHeight = Cartesian3.magnitude(halfHeightVector);
        minimumHeight = centerLocal.z - halfHeight;
        maximumHeight = centerLocal.z + halfHeight;
      } else if (tileBoundingVolume instanceof TileBoundingSphere) {
        const radius = boundingVolume.radius;
        minimumHeight = centerLocal.z - radius;
        maximumHeight = centerLocal.z + radius;
      }
    }
  }

  // The range where the density starts to lessen. Start at the quarter height of the tileset.
  const heightFalloff = tileset.dynamicScreenSpaceErrorHeightFalloff;
  const heightClose =
    minimumHeight + (maximumHeight - minimumHeight) * heightFalloff;
  const heightFar = maximumHeight;

  const t = CesiumMath.clamp(
    (height - heightClose) / (heightFar - heightClose),
    0.0,
    1.0,
  );

  // Increase density as the camera tilts towards the horizon
  let horizonFactor = 1.0 - Math.abs(Cartesian3.dot(direction, up));

  // Weaken the horizon factor as the camera height increases, implying the camera is further away from the tileset.
  // The goal is to increase density for the "street view", not when viewing the tileset from a distance.
  horizonFactor = horizonFactor * (1.0 - t);

  tileset._dynamicScreenSpaceErrorComputedDensity =
    tileset.dynamicScreenSpaceErrorDensity * horizonFactor;
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function requestContent(tileset, tile) {
  if (tile.hasEmptyContent) {
    return;
  }

  const { statistics } = tileset;
  const contentExpired = tile.contentExpired;

  const promise = tile.requestContent();
  if (!defined(promise)) {
    return;
  }

  promise
    .then((content) => {
      if (!defined(content) || tile.isDestroyed() || tileset.isDestroyed()) {
        return;
      }

      tileset._processingQueue.push(tile);
      ++statistics.numberOfTilesProcessing;
    })
    .catch((error) => {
      handleTileFailure(error, tileset, tile);
    });

  if (contentExpired) {
    if (tile.hasTilesetContent || tile.hasImplicitContent) {
      destroySubtree(tileset, tile);
    } else {
      statistics.decrementLoadCounts(tile.content);
      --statistics.numberOfTilesWithContentReady;
    }
  }

  tileset._requestedTilesInFlight.push(tile);
}

function sortTilesByPriority(a, b) {
  return a._priority - b._priority;
}

/**
 * Perform any pass invariant tasks here. Called after the render pass.
 * @private
 * @param {FrameState} frameState
 */
Cesium3DTileset.prototype.postPassesUpdate = function (frameState) {
  if (!defined(this._root)) {
    return;
  }

  cancelOutOfViewRequests(this, frameState);
  raiseLoadProgressEvent(this, frameState);
  this._cache.unloadTiles(this, unloadTile);

  // If the style wasn't able to be applied this frame (for example,
  // the tileset was hidden), keep it dirty so the engine can try
  // to apply the style next frame.
  if (this._styleApplied) {
    this._styleEngine.resetDirty();
  }
  this._styleApplied = false;
};

/**
 * 在此处执行任何传递不变任务。在执行任何传递之前调用。
 * @private
 * @param {FrameState} frameState
 */
Cesium3DTileset.prototype.prePassesUpdate = function (frameState) {
  if (!defined(this._root)) {
    return;
  }

  processTiles(this, frameState);

  // Update clipping planes
  const clippingPlanes = this._clippingPlanes;
  this._clippingPlanesOriginMatrixDirty = true;
  if (defined(clippingPlanes) && clippingPlanes.enabled) {
    clippingPlanes.update(frameState);
  }

  // Update clipping polygons
  const clippingPolygons = this._clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    clippingPolygons.update(frameState);
  }

  if (!defined(this._loadTimestamp)) {
    this._loadTimestamp = JulianDate.clone(frameState.time);
  }
  this._timeSinceLoad = Math.max(
    JulianDate.secondsDifference(frameState.time, this._loadTimestamp) * 1000,
    0.0,
  );

  if (this.dynamicScreenSpaceError) {
    updateDynamicScreenSpaceError(this, frameState);
  }

  if (frameState.newFrame) {
    this._cache.reset();
  }
};

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function cancelOutOfViewRequests(tileset, frameState) {
  const requestedTilesInFlight = tileset._requestedTilesInFlight;
  let removeCount = 0;
  for (let i = 0; i < requestedTilesInFlight.length; ++i) {
    const tile = requestedTilesInFlight[i];

    // NOTE: This is framerate dependant so make sure the threshold check is small
    const outOfView = frameState.frameNumber - tile._touchedFrame >= 1;
    if (tile._contentState !== Cesium3DTileContentState.LOADING) {
      // No longer fetching from host, don't need to track it anymore. Gets marked as LOADING in Cesium3DTile::requestContent().
      ++removeCount;
      continue;
    } else if (outOfView) {
      // RequestScheduler will take care of cancelling it
      tile.cancelRequests();
      ++removeCount;
      continue;
    }

    if (removeCount > 0) {
      requestedTilesInFlight[i - removeCount] = tile;
    }
  }

  requestedTilesInFlight.length -= removeCount;
}

/**
 * 在提出任何请求之前，按优先级对请求进行排序。
 * 这样可以降低请求在发出后被取消的可能性。
 * @private
 * @param {Cesium3DTileset} tileset
 */
function requestTiles(tileset) {
  const requestedTiles = tileset._requestedTiles;
  requestedTiles.sort(sortTilesByPriority);
  for (let i = 0; i < requestedTiles.length; ++i) {
    requestContent(tileset, requestedTiles[i]);
  }
}

/**
 * @private
 * @param {Error} error
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function handleTileFailure(error, tileset, tile) {
  if (tileset.isDestroyed()) {
    return;
  }

  let url;
  if (!tile.isDestroyed()) {
    url = tile._contentResource.url;
  }

  const message = defined(error.message) ? error.message : error.toString();
  if (tileset.tileFailed.numberOfListeners > 0) {
    tileset.tileFailed.raiseEvent({
      url: url,
      message: message,
    });
  } else {
    console.log(`A 3D tile failed to load: ${url}`);
    console.log(`Error: ${message}`);
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 */
function filterProcessingQueue(tileset) {
  const tiles = tileset._processingQueue;

  let removeCount = 0;
  for (let i = 0; i < tiles.length; ++i) {
    const tile = tiles[i];
    if (
      tile.isDestroyed() ||
      tile._contentState !== Cesium3DTileContentState.PROCESSING
    ) {
      ++removeCount;
      continue;
    }
    if (removeCount > 0) {
      tiles[i - removeCount] = tile;
    }
  }
  tiles.length -= removeCount;
}

const scratchUpdateHeightCartographic = new Cartographic();
const scratchUpdateHeightCartographic2 = new Cartographic();
const scratchUpdateHeightCartesian = new Cartesian3();
function processUpdateHeight(tileset, tile, frameState) {
  if (!tileset.enableCollision || !tileset.show) {
    return;
  }

  const heightCallbackData = tileset._addHeightCallbacks;
  const boundingSphere = tile.boundingSphere;

  for (const callbackData of heightCallbackData) {
    // No need to update if the tile was already visible last frame
    if (callbackData.invoked || tile._wasSelectedLastFrame) {
      continue;
    }

    const ellipsoid = callbackData.ellipsoid;
    const positionCartographic = Cartographic.clone(
      callbackData.positionCartographic,
      scratchUpdateHeightCartographic,
    );
    const centerCartographic = Cartographic.fromCartesian(
      boundingSphere.center,
      ellipsoid,
      scratchUpdateHeightCartographic2,
    );

    // This can be undefined when the bounding sphere is at the origin
    if (defined(centerCartographic)) {
      positionCartographic.height = centerCartographic.height;
    }

    const position = Cartographic.toCartesian(
      positionCartographic,
      ellipsoid,
      scratchUpdateHeightCartesian,
    );
    if (
      Cartesian3.distance(position, boundingSphere.center) <=
      boundingSphere.radius
    ) {
      frameState.afterRender.push(() => {
        // Callback can be removed before it actually invoked at the end of the frame
        if (defined(callbackData.callback)) {
          callbackData.callback(positionCartographic);
        }
        callbackData.invoked = false;
      });
    }
  }
}

/**
 * 处理处于 PROCESSING 状态的磁贴，以便它们最终移动到 READY 状态。
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function processTiles(tileset, frameState) {
  filterProcessingQueue(tileset);
  const tiles = tileset._processingQueue;

  const { cacheBytes, maximumCacheOverflowBytes, statistics } = tileset;
  const cacheByteLimit = cacheBytes + maximumCacheOverflowBytes;

  let memoryExceeded = false;
  for (let i = 0; i < tiles.length; ++i) {
    if (tileset.totalMemoryUsageInBytes > cacheByteLimit) {
      memoryExceeded = true;
      break;
    }

    const tile = tiles[i];
    try {
      tile.process(tileset, frameState);

      if (tile.contentReady) {
        --statistics.numberOfTilesProcessing;
        tileset.tileLoad.raiseEvent(tile);
      }
    } catch (error) {
      --statistics.numberOfTilesProcessing;
      handleTileFailure(error, tileset, tile);
    }
  }

  if (tileset.totalMemoryUsageInBytes < cacheBytes) {
    decreaseScreenSpaceError(tileset);
  } else if (memoryExceeded && tiles.length > 0) {
    increaseScreenSpaceError(tileset);
  }
}

function increaseScreenSpaceError(tileset) {
  //>>includeStart('debug', pragmas.debug);
  oneTimeWarning(
    "increase-screenSpaceError",
    `The tiles needed to meet maximumScreenSpaceError would use more memory than allocated for this tileset.
    The tileset will be rendered with a larger screen space error (see memoryAdjustedScreenSpaceError).
    Consider using larger values for cacheBytes and maximumCacheOverflowBytes.`,
  );
  //>>includeEnd('debug');

  tileset._memoryAdjustedScreenSpaceError *= 1.02;
  const tiles = tileset._processingQueue;
  for (let i = 0; i < tiles.length; ++i) {
    tiles[i].updatePriority();
  }
  tiles.sort(sortTilesByPriority);
}

function decreaseScreenSpaceError(tileset) {
  tileset._memoryAdjustedScreenSpaceError = Math.max(
    tileset.memoryAdjustedScreenSpaceError / 1.02,
    tileset.maximumScreenSpaceError,
  );
}

const scratchCartesian = new Cartesian3();

const stringOptions = {
  maximumFractionDigits: 3,
};

/**
 * @private
 * @param {number} memorySizeInBytes
 * @returns {string}
 */
function formatMemoryString(memorySizeInBytes) {
  const memoryInMegabytes = memorySizeInBytes / 1048576;
  if (memoryInMegabytes < 1.0) {
    return memoryInMegabytes.toLocaleString(undefined, stringOptions);
  }
  return Math.round(memoryInMegabytes).toLocaleString();
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @returns {Cartesian3}
 */
function computeTileLabelPosition(tile) {
  const { halfAxes, radius, center } = tile.boundingVolume.boundingVolume;

  let position = Cartesian3.clone(center, scratchCartesian);
  if (defined(halfAxes)) {
    position.x += 0.75 * (halfAxes[0] + halfAxes[3] + halfAxes[6]);
    position.y += 0.75 * (halfAxes[1] + halfAxes[4] + halfAxes[7]);
    position.z += 0.75 * (halfAxes[2] + halfAxes[5] + halfAxes[8]);
  } else if (defined(radius)) {
    let normal = Cartesian3.normalize(center, scratchCartesian);
    normal = Cartesian3.multiplyByScalar(
      normal,
      0.75 * radius,
      scratchCartesian,
    );
    position = Cartesian3.add(normal, center, scratchCartesian);
  }
  return position;
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 * @param {Cartesian3} position
 * @returns {Label}
 */
function addTileDebugLabel(tile, tileset, position) {
  let labelString = "";
  let attributes = 0;

  if (tileset.debugShowGeometricError) {
    labelString += `\nGeometric error: ${tile.geometricError}`;
    attributes++;
  }

  if (tileset.debugShowRenderingStatistics) {
    labelString += `\nCommands: ${tile.commandsLength}`;
    attributes++;

    // Don't display number of points or triangles if 0.
    const numberOfPoints = tile.content.pointsLength;
    if (numberOfPoints > 0) {
      labelString += `\nPoints: ${tile.content.pointsLength}`;
      attributes++;
    }

    const numberOfTriangles = tile.content.trianglesLength;
    if (numberOfTriangles > 0) {
      labelString += `\nTriangles: ${tile.content.trianglesLength}`;
      attributes++;
    }

    labelString += `\nFeatures: ${tile.content.featuresLength}`;
    attributes++;
  }

  if (tileset.debugShowMemoryUsage) {
    labelString += `\nTexture Memory: ${formatMemoryString(
      tile.content.texturesByteLength,
    )}`;
    labelString += `\nGeometry Memory: ${formatMemoryString(
      tile.content.geometryByteLength,
    )}`;
    attributes += 2;
  }

  if (tileset.debugShowUrl) {
    if (tile.hasMultipleContents) {
      labelString += "\nUrls:";
      const urls = tile.content.innerContentUrls;
      for (let i = 0; i < urls.length; i++) {
        labelString += `\n- ${urls[i]}`;
      }
      attributes += urls.length;
    } else {
      labelString += `\nUrl: ${tile._contentHeader.uri}`;
      attributes++;
    }
  }

  const newLabel = {
    text: labelString.substring(1),
    position: position,
    font: `${19 - attributes}px sans-serif`,
    showBackground: true,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  };

  return tileset._tileDebugLabels.add(newLabel);
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function updateTileDebugLabels(tileset, frameState) {
  const selectedTiles = tileset._selectedTiles;
  const selectedLength = selectedTiles.length;
  const emptyTiles = tileset._emptyTiles;
  const emptyLength = emptyTiles.length;
  tileset._tileDebugLabels.removeAll();

  if (tileset.debugPickedTileLabelOnly) {
    if (defined(tileset.debugPickedTile)) {
      const position = defined(tileset.debugPickPosition)
        ? tileset.debugPickPosition
        : computeTileLabelPosition(tileset.debugPickedTile);
      const label = addTileDebugLabel(
        tileset.debugPickedTile,
        tileset,
        position,
      );
      label.pixelOffset = new Cartesian2(15, -15); // Offset to avoid picking the label.
    }
  } else {
    for (let i = 0; i < selectedLength; ++i) {
      const tile = selectedTiles[i];
      addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
    }
    for (let i = 0; i < emptyLength; ++i) {
      const tile = emptyTiles[i];
      if (tile.hasTilesetContent || tile.hasImplicitContent) {
        addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
      }
    }
  }
  tileset._tileDebugLabels.update(frameState);
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {object} passOptions
 */
function updateTiles(tileset, frameState, passOptions) {
  tileset._styleEngine.applyStyle(tileset);
  tileset._styleApplied = true;

  const { commandList, context } = frameState;
  const numberOfInitialCommands = commandList.length;
  const selectedTiles = tileset._selectedTiles;

  const bivariateVisibilityTest =
    tileset.isSkippingLevelOfDetail &&
    tileset._hasMixedContent &&
    context.stencilBuffer &&
    selectedTiles.length > 0;

  tileset._backfaceCommands.length = 0;

  if (bivariateVisibilityTest) {
    if (!defined(tileset._stencilClearCommand)) {
      tileset._stencilClearCommand = new ClearCommand({
        stencil: 0,
        pass: Pass.CESIUM_3D_TILE,
        renderState: RenderState.fromCache({
          stencilMask: StencilConstants.SKIP_LOD_MASK,
        }),
      });
    }
    commandList.push(tileset._stencilClearCommand);
  }

  const { statistics, tileVisible } = tileset;
  const isRender = passOptions.isRender;
  const lengthBeforeUpdate = commandList.length;

  for (let i = 0; i < selectedTiles.length; ++i) {
    const tile = selectedTiles[i];
    // Raise the tileVisible event before update in case the tileVisible event
    // handler makes changes that update needs to apply to WebGL resources
    if (isRender) {
      tileVisible.raiseEvent(tile);
    }
    processUpdateHeight(tileset, tile, frameState);
    tile.update(tileset, frameState, passOptions);
    statistics.incrementSelectionCounts(tile.content);
    ++statistics.selected;
  }
  const emptyTiles = tileset._emptyTiles;
  for (let i = 0; i < emptyTiles.length; ++i) {
    const tile = emptyTiles[i];
    tile.update(tileset, frameState, passOptions);
  }

  let addedCommandsLength = commandList.length - lengthBeforeUpdate;

  tileset._backfaceCommands.trim();

  if (bivariateVisibilityTest) {
    /*
     * Consider 'effective leaf' tiles as selected tiles that have no selected descendants. They may have children,
     * but they are currently our effective leaves because they do not have selected descendants. These tiles
     * are those where with tile._finalResolution === true.
     * Let 'unresolved' tiles be those with tile._finalResolution === false.
     *
     * 1. Render just the backfaces of unresolved tiles in order to lay down z
     * 2. Render all frontfaces wherever tile._selectionDepth > stencilBuffer.
     *    Replace stencilBuffer with tile._selectionDepth, when passing the z test.
     *    Because children are always drawn before ancestors {@link Cesium3DTilesetTraversal#traverseAndSelect},
     *    this effectively draws children first and does not draw ancestors if a descendant has already
     *    been drawn at that pixel.
     *    Step 1 prevents child tiles from appearing on top when they are truly behind ancestor content.
     *    If they are behind the backfaces of the ancestor, then they will not be drawn.
     *
     * NOTE: Step 2 sometimes causes visual artifacts when backfacing child content has some faces that
     * partially face the camera and are inside of the ancestor content. Because they are inside, they will
     * not be culled by the depth writes in Step 1, and because they partially face the camera, the stencil tests
     * will draw them on top of the ancestor content.
     *
     * NOTE: Because we always render backfaces of unresolved tiles, if the camera is looking at the backfaces
     * of an object, they will always be drawn while loading, even if backface culling is enabled.
     */

    const backfaceCommands = tileset._backfaceCommands.values;
    const backfaceCommandsLength = backfaceCommands.length;

    commandList.length += backfaceCommandsLength;

    // copy commands to the back of the commandList
    for (let i = addedCommandsLength - 1; i >= 0; --i) {
      commandList[lengthBeforeUpdate + backfaceCommandsLength + i] =
        commandList[lengthBeforeUpdate + i];
    }

    // move backface commands to the front of the commandList
    for (let i = 0; i < backfaceCommandsLength; ++i) {
      commandList[lengthBeforeUpdate + i] = backfaceCommands[i];
    }
  }

  // Number of commands added by each update above
  addedCommandsLength = commandList.length - numberOfInitialCommands;
  statistics.numberOfCommands = addedCommandsLength;

  if (!isRender) {
    return;
  }

  // Only run EDL if simple attenuation is on
  if (
    tileset.pointCloudShading.attenuation &&
    tileset.pointCloudShading.eyeDomeLighting &&
    addedCommandsLength > 0
  ) {
    tileset._pointCloudEyeDomeLighting.update(
      frameState,
      numberOfInitialCommands,
      tileset.pointCloudShading,
      tileset.boundingSphere,
    );
  }

  if (
    tileset.debugShowGeometricError ||
    tileset.debugShowRenderingStatistics ||
    tileset.debugShowMemoryUsage ||
    tileset.debugShowUrl
  ) {
    if (!defined(tileset._tileDebugLabels)) {
      tileset._tileDebugLabels = new LabelCollection();
    }
    updateTileDebugLabels(tileset, frameState);
  } else {
    tileset._tileDebugLabels =
      tileset._tileDebugLabels && tileset._tileDebugLabels.destroy();
  }
}

const scratchStack = [];

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function destroySubtree(tileset, tile) {
  const root = tile;
  const stack = scratchStack;
  stack.push(tile);
  while (stack.length > 0) {
    tile = stack.pop();
    const children = tile.children;
    for (let i = 0; i < children.length; ++i) {
      stack.push(children[i]);
    }
    if (tile !== root) {
      destroyTile(tileset, tile);
      --tileset._statistics.numberOfTilesTotal;
    }
  }
  root.children = [];
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function unloadTile(tileset, tile) {
  tileset.tileUnload.raiseEvent(tile);
  tileset._statistics.decrementLoadCounts(tile.content);
  --tileset._statistics.numberOfTilesWithContentReady;
  tile.unloadContent();
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function destroyTile(tileset, tile) {
  tileset._cache.unloadTile(tileset, tile, unloadTile);
  tile.destroy();
}

/**
 * 卸载上一帧未选择的所有瓦片。 这可用于
 * 显式管理切片缓存并减少下面加载的切片总数
 * {@link Cesium3DTileset#cacheBytes}.
 * <p>
 * 图块卸载发生在下一帧，以保留所有 WebGL 删除调用
 * 在渲染循环中。
 * </p>
 */
Cesium3DTileset.prototype.trimLoadedTiles = function () {
  this._cache.trim();
};

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function raiseLoadProgressEvent(tileset, frameState) {
  const statistics = tileset._statistics;
  const statisticsLast = tileset._statisticsLast;

  const numberOfPendingRequests = statistics.numberOfPendingRequests;
  const numberOfTilesProcessing = statistics.numberOfTilesProcessing;
  const lastNumberOfPendingRequest = statisticsLast.numberOfPendingRequests;
  const lastNumberOfTilesProcessing = statisticsLast.numberOfTilesProcessing;

  Cesium3DTilesetStatistics.clone(statistics, statisticsLast);

  const progressChanged =
    numberOfPendingRequests !== lastNumberOfPendingRequest ||
    numberOfTilesProcessing !== lastNumberOfTilesProcessing;

  if (progressChanged) {
    frameState.afterRender.push(function () {
      tileset.loadProgress.raiseEvent(
        numberOfPendingRequests,
        numberOfTilesProcessing,
      );

      return true;
    });
  }

  tileset._tilesLoaded =
    statistics.numberOfPendingRequests === 0 &&
    statistics.numberOfTilesProcessing === 0 &&
    statistics.numberOfAttemptedRequests === 0;

  // Events are raised (added to the afterRender queue) here since promises
  // may resolve outside of the update loop that then raise events, e.g.,
  // model's readyEvent
  if (progressChanged && tileset._tilesLoaded) {
    frameState.afterRender.push(function () {
      tileset.allTilesLoaded.raiseEvent();
      return true;
    });
    if (!tileset._initialTilesLoaded) {
      tileset._initialTilesLoaded = true;
      frameState.afterRender.push(function () {
        tileset.initialTilesLoaded.raiseEvent();
        return true;
      });
    }
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 */
function resetMinimumMaximum(tileset) {
  tileset._heatmap.resetMinimumMaximum();
  tileset._minimumPriority.depth = Number.MAX_VALUE;
  tileset._maximumPriority.depth = -Number.MAX_VALUE;
  tileset._minimumPriority.foveatedFactor = Number.MAX_VALUE;
  tileset._maximumPriority.foveatedFactor = -Number.MAX_VALUE;
  tileset._minimumPriority.distance = Number.MAX_VALUE;
  tileset._maximumPriority.distance = -Number.MAX_VALUE;
  tileset._minimumPriority.reverseScreenSpaceError = Number.MAX_VALUE;
  tileset._maximumPriority.reverseScreenSpaceError = -Number.MAX_VALUE;
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function detectModelMatrixChanged(tileset, frameState) {
  if (
    frameState.frameNumber === tileset._updatedModelMatrixFrame &&
    defined(tileset._previousModelMatrix)
  ) {
    return;
  }

  tileset._updatedModelMatrixFrame = frameState.frameNumber;
  tileset._modelMatrixChanged = !Matrix4.equals(
    tileset.modelMatrix,
    tileset._previousModelMatrix,
  );
  if (tileset._modelMatrixChanged) {
    tileset._previousModelMatrix = Matrix4.clone(
      tileset.modelMatrix,
      tileset._previousModelMatrix,
    );
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {Cesium3DTilesetStatistics} passStatistics
 * @param {object} passOptions
 * @returns {boolean}
 */
function update(tileset, frameState, passStatistics, passOptions) {
  if (frameState.mode === SceneMode.MORPHING) {
    return false;
  }

  if (!defined(tileset._root)) {
    return false;
  }

  const statistics = tileset._statistics;
  statistics.clear();

  // Resets the visibility check for each pass
  ++tileset._updatedVisibilityFrame;

  // Update any tracked min max values
  resetMinimumMaximum(tileset);

  detectModelMatrixChanged(tileset, frameState);
  tileset._cullRequestsWhileMoving =
    tileset.cullRequestsWhileMoving && !tileset._modelMatrixChanged;

  const ready = tileset
    .getTraversal(passOptions)
    .selectTiles(tileset, frameState);

  if (passOptions.requestTiles) {
    requestTiles(tileset);
  }

  updateTiles(tileset, frameState, passOptions);

  // Update pass statistics
  Cesium3DTilesetStatistics.clone(statistics, passStatistics);

  if (passOptions.isRender) {
    const credits = tileset._credits;
    if (defined(credits) && statistics.selected !== 0) {
      for (let i = 0; i < credits.length; ++i) {
        const credit = credits[i];
        frameState.creditDisplay.addCreditToNextFrame(credit);
      }
    }
  }

  return ready;
}

function createCredits(tileset) {
  let credits = tileset._credits;
  if (!defined(credits)) {
    credits = [];
  }
  credits.length = 0;

  if (defined(tileset.resource.credits)) {
    tileset.resource.credits.forEach((credit) => {
      credits.push(Credit.clone(credit));
    });
  }

  const assetExtras = tileset.asset.extras;
  if (
    defined(assetExtras) &&
    defined(assetExtras.cesium) &&
    defined(assetExtras.cesium.credits)
  ) {
    const extraCredits = assetExtras.cesium.credits;
    for (let i = 0; i < extraCredits.length; ++i) {
      const credit = extraCredits[i];
      credits.push(new Credit(credit.html));
    }
  }

  credits.forEach(
    (credit) =>
      (credit.showOnScreen =
        credit.showOnScreen || tileset._showCreditsOnScreen),
  );

  tileset._credits = credits;
}

/**
 * @private
 * @param {object} passOptions
 * @returns {Cesium3DTilesetTraversal}
 */
Cesium3DTileset.prototype.getTraversal = function (passOptions) {
  const { pass } = passOptions;
  if (
    pass === Cesium3DTilePass.MOST_DETAILED_PRELOAD ||
    pass === Cesium3DTilePass.MOST_DETAILED_PICK
  ) {
    return Cesium3DTilesetMostDetailedTraversal;
  }
  return this.isSkippingLevelOfDetail
    ? Cesium3DTilesetSkipTraversal
    : Cesium3DTilesetBaseTraversal;
};

/**
 * @private
 * @param {FrameState} frameState
 */
Cesium3DTileset.prototype.update = function (frameState) {
  this.updateForPass(frameState, frameState.tilesetPassState);
};

/**
 * @private
 * @param {FrameState} frameState
 * @param {object} tilesetPassState
 */
Cesium3DTileset.prototype.updateForPass = function (
  frameState,
  tilesetPassState,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("frameState", frameState);
  Check.typeOf.object("tilesetPassState", tilesetPassState);
  //>>includeEnd('debug');

  const pass = tilesetPassState.pass;
  if (
    (pass === Cesium3DTilePass.PRELOAD &&
      (!this.preloadWhenHidden || this.show)) ||
    (pass === Cesium3DTilePass.PRELOAD_FLIGHT &&
      (!this.preloadFlightDestinations ||
        (!this.show && !this.preloadWhenHidden))) ||
    (pass === Cesium3DTilePass.REQUEST_RENDER_MODE_DEFER_CHECK &&
      ((!this._cullRequestsWhileMoving && this.foveatedTimeDelay <= 0) ||
        !this.show))
  ) {
    return;
  }

  const originalCommandList = frameState.commandList;
  const originalCamera = frameState.camera;
  const originalCullingVolume = frameState.cullingVolume;

  tilesetPassState.ready = false;

  const passOptions = Cesium3DTilePass.getPassOptions(pass);
  const ignoreCommands = passOptions.ignoreCommands;

  const commandList = defaultValue(
    tilesetPassState.commandList,
    originalCommandList,
  );
  const commandStart = commandList.length;

  frameState.commandList = commandList;
  frameState.camera = defaultValue(tilesetPassState.camera, originalCamera);
  frameState.cullingVolume = defaultValue(
    tilesetPassState.cullingVolume,
    originalCullingVolume,
  );

  // Update clipping polygons
  const clippingPolygons = this._clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    clippingPolygons.queueCommands(frameState);
  }

  const passStatistics = this._statisticsPerPass[pass];

  if (this.show || ignoreCommands) {
    this._pass = pass;
    tilesetPassState.ready = update(
      this,
      frameState,
      passStatistics,
      passOptions,
    );
  }

  if (ignoreCommands) {
    commandList.length = commandStart;
  }

  frameState.commandList = originalCommandList;
  frameState.camera = originalCamera;
  frameState.cullingVolume = originalCullingVolume;
};

/**
 * 如果图块集 JSON 文件在 extensionsUsed 中列出扩展名，<code>则为 true</code>;否则为 <code>false</code>。
 * @param {string} extensionName 要检查的扩展名。
 *
 * @returns {boolean} <code>true</code>，如果图块集 JSON 文件在 extensionsUsed 中列出扩展名;否则为 <code>false</code>。
 */
Cesium3DTileset.prototype.hasExtension = function (extensionName) {
  if (!defined(this._extensionsUsed)) {
    return false;
  }

  return this._extensionsUsed.indexOf(extensionName) > -1;
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see Cesium3DTileset#destroy
 */
Cesium3DTileset.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * tileset = tileset && tileset.destroy();
 *
 * @see Cesium3DTileset#isDestroyed
 */
Cesium3DTileset.prototype.destroy = function () {
  this._tileDebugLabels =
    this._tileDebugLabels && this._tileDebugLabels.destroy();
  this._clippingPlanes = this._clippingPlanes && this._clippingPlanes.destroy();
  this._clippingPolygons =
    this._clippingPolygons && this._clippingPolygons.destroy();

  // Traverse the tree and destroy all tiles
  if (defined(this._root)) {
    const stack = scratchStack;
    stack.push(this._root);

    while (stack.length > 0) {
      const tile = stack.pop();
      tile.destroy();

      const children = tile.children;
      for (let i = 0; i < children.length; ++i) {
        stack.push(children[i]);
      }
    }
  }
  this._root = undefined;

  if (
    this._shouldDestroyImageBasedLighting &&
    !this._imageBasedLighting.isDestroyed()
  ) {
    this._imageBasedLighting.destroy();
  }
  this._imageBasedLighting = undefined;

  return destroyObject(this);
};

Cesium3DTileset.supportedExtensions = {
  "3DTILES_metadata": true,
  "3DTILES_implicit_tiling": true,
  "3DTILES_content_gltf": true,
  "3DTILES_multiple_contents": true,
  "3DTILES_bounding_volume_S2": true,
  "3DTILES_batch_table_hierarchy": true,
  "3DTILES_draco_point_compression": true,
  MAXAR_content_geojson: true,
};

/**
 * 检查 Cesium3DTileset 是否支持给定的扩展。如果
 * Cesium3DTileset 不支持该扩展，它会引发 RuntimeError。
 *
 * @param {object} extensionsRequired 我们要检查的扩展
 *
 * @private
 */
Cesium3DTileset.checkSupportedExtensions = function (extensionsRequired) {
  for (let i = 0; i < extensionsRequired.length; i++) {
    if (!Cesium3DTileset.supportedExtensions[extensionsRequired[i]]) {
      throw new RuntimeError(
        `Unsupported 3D Tiles Extension: ${extensionsRequired[i]}`,
      );
    }
  }
};

const scratchGetHeightRay = new Ray();
const scratchIntersection = new Cartesian3();
const scratchGetHeightCartographic = new Cartographic();

/**
 * 获取给定制图处加载表面的高度。此函数将仅考虑已加载图块的网格，而不一定考虑图块集可用的最详细图块。对点云进行采样时，此函数将始终返回 undefined。
 *
 * @param {Cartographic} cartographic 要为其查找高度的制图。
 * @param {Scene} scene 正在进行可视化的场景。
 * @returns {number|undefined} 制图的高度，如果找不到，则为 undefined。
 *
 * @example
 * const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(124624234);
 * scene.primitives.add(tileset);
 *
 * const height = tileset.getHeight(scene.camera.positionCartographic, scene);
 */
Cesium3DTileset.prototype.getHeight = function (cartographic, scene) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartographic", cartographic);
  Check.typeOf.object("scene", scene);
  //>>includeEnd('debug');

  let ellipsoid = scene.ellipsoid;
  if (!defined(ellipsoid)) {
    ellipsoid = Ellipsoid.WGS84;
  }

  const ray = scratchGetHeightRay;
  const position = ellipsoid.cartographicToCartesian(
    cartographic,
    ray.direction,
  );
  Cartesian3.normalize(ray.direction, ray.direction);

  ray.direction = Cartesian3.normalize(position, ray.direction);
  ray.direction = Cartesian3.negate(position, ray.direction);
  ray.origin = Cartesian3.multiplyByScalar(
    ray.direction,
    -2 * ellipsoid.maximumRadius,
    ray.origin,
  );

  const intersection = this.pick(ray, scene.frameState, scratchIntersection);
  if (!defined(intersection)) {
    return;
  }

  return ellipsoid.cartesianToCartographic(
    intersection,
    scratchGetHeightCartographic,
  )?.height;
};

/**
 * 在渲染包含给定制图的新瓦片时调用回调。唯一的参数
 * 是切片上的制图位置。
 *
 * @private
 *
 * @param {Scene} scene 正在进行可视化的场景。
 * @param {Cartographic} cartographic 制图位置。
 * @param {Function} callback 加载新瓦片时要调用的函数。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 要使用的椭球体。
 * @returns {Function} 从四叉树中删除此回调的函数。
 */
Cesium3DTileset.prototype.updateHeight = function (
  cartographic,
  callback,
  ellipsoid,
) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  const object = {
    positionCartographic: cartographic,
    ellipsoid: ellipsoid,
    callback: callback,
    invoked: false,
  };

  const removeCallback = () => {
    const addedCallbacks = this._addHeightCallbacks;
    const length = addedCallbacks.length;
    for (let i = 0; i < length; ++i) {
      if (addedCallbacks[i] === object) {
        addedCallbacks.splice(i, 1);
        break;
      }
    }

    if (object.callback) {
      object.callback = undefined;
    }
  };

  this._addHeightCallbacks.push(object);
  return removeCallback;
};

const scratchSphereIntersection = new Interval();
const scratchPickIntersection = new Cartesian3();

/**
 * 查找光线与渲染的图块集表面之间的交集。射线必须为 given in world coordinates.
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {FrameState} frameState 帧状态。
 * @param {Cartesian3|undefined} [result] 交集或 <code>undefined</code>，如果没有 found.
 * @returns {Cartesian3|undefined} 交集或 <code>undefined</code>（如果未找到）。
 *
 * @private
 */
Cesium3DTileset.prototype.pick = function (ray, frameState, result) {
  if (!frameState.context.webgl2 && !this._enablePick) {
    return;
  }

  const selectedTiles = this._selectedTiles;
  const selectedLength = selectedTiles.length;
  const candidates = [];

  for (let i = 0; i < selectedLength; ++i) {
    const tile = selectedTiles[i];
    const boundsIntersection = IntersectionTests.raySphere(
      ray,
      tile.contentBoundingVolume.boundingSphere,
      scratchSphereIntersection,
    );
    if (!defined(boundsIntersection) || !defined(tile.content)) {
      continue;
    }

    candidates.push(tile);
  }

  const length = candidates.length;
  candidates.sort((a, b) => {
    const aDist = BoundingSphere.distanceSquaredTo(
      a.contentBoundingVolume.boundingSphere,
      ray.origin,
    );
    const bDist = BoundingSphere.distanceSquaredTo(
      b.contentBoundingVolume.boundingSphere,
      ray.origin,
    );

    return aDist - bDist;
  });

  let intersection;
  for (let i = 0; i < length; ++i) {
    const tile = candidates[i];
    const candidate = tile.content.pick(
      ray,
      frameState,
      scratchPickIntersection,
    );

    if (defined(candidate)) {
      intersection = Cartesian3.clone(candidate, result);
      return intersection;
    }
  }
};

/**
 * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时用作回调，以控制在注视点圆锥体之外的图块的屏幕空间误差的提高程度，
 * 在 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 和 {@link Cesium3DTileset#maximumScreenSpaceError} 之间插值。
 *
 * @callback Cesium3DTileset.foveatedInterpolationCallback
 * @default Math.lerp
 *
 * @param {number} p 要插值的起始值。
 * @param {number} q 要插值的结束值。
 * @param {number} time 插值时间一般在 <code>[0.0， 1.0]</code> 范围内。
 * @returns {number} 内插值。
 */
export default Cesium3DTileset;
