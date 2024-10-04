import BoundingSphere from "../../Core/BoundingSphere.js";
import Cartesian3 from "../../Core/Cartesian3.js";
import Cartographic from "../../Core/Cartographic.js";
import Check from "../../Core/Check.js";
import Credit from "../../Core/Credit.js";
import Color from "../../Core/Color.js";
import defined from "../../Core/defined.js";
import defaultValue from "../../Core/defaultValue.js";
import DeveloperError from "../../Core/DeveloperError.js";
import destroyObject from "../../Core/destroyObject.js";
import DistanceDisplayCondition from "../../Core/DistanceDisplayCondition.js";
import Ellipsoid from "../../Core/Ellipsoid.js";
import Event from "../../Core/Event.js";
import Matrix3 from "../../Core/Matrix3.js";
import Matrix4 from "../../Core/Matrix4.js";
import Resource from "../../Core/Resource.js";
import RuntimeError from "../../Core/RuntimeError.js";
import Pass from "../../Renderer/Pass.js";
import ClippingPlaneCollection from "../ClippingPlaneCollection.js";
import ClippingPolygonCollection from "../ClippingPolygonCollection.js";
import ColorBlendMode from "../ColorBlendMode.js";
import GltfLoader from "../GltfLoader.js";
import HeightReference, {
  isHeightReferenceRelative,
} from "../HeightReference.js";
import ImageBasedLighting from "../ImageBasedLighting.js";
import PointCloudShading from "../PointCloudShading.js";
import SceneMode from "../SceneMode.js";
import SceneTransforms from "../SceneTransforms.js";
import ShadowMode from "../ShadowMode.js";
import SplitDirection from "../SplitDirection.js";
import B3dmLoader from "./B3dmLoader.js";
import GeoJsonLoader from "./GeoJsonLoader.js";
import I3dmLoader from "./I3dmLoader.js";
import ModelAnimationCollection from "./ModelAnimationCollection.js";
import ModelFeatureTable from "./ModelFeatureTable.js";
import ModelSceneGraph from "./ModelSceneGraph.js";
import ModelStatistics from "./ModelStatistics.js";
import ModelType from "./ModelType.js";
import ModelUtility from "./ModelUtility.js";
import oneTimeWarning from "../../Core/oneTimeWarning.js";
import PntsLoader from "./PntsLoader.js";
import StyleCommandsNeeded from "./StyleCommandsNeeded.js";
import pickModel from "./pickModel.js";

/**
 * <div class="notice">
 * 要构造 Model，请调用 {@link Model.fromGltfAsync}. 不要直接调用构造函数。
 * </div>
 * 基于 glTF 的 3D 模型，glTF 是 WebGL、OpenGL ES 和 OpenGL 的运行时资产格式。
 * <p>
 * Cesium 通过以下扩展支持 glTF ：
 * <ul>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/AGI_articulations/README.md|AGI_articulations}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Vendor/CESIUM_RTC/README.md|CESIUM_RTC}
 *  </li>
 *  <li>
 *  {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_instance_features|EXT_instance_features}
 *  </li>
 *  <li>
 *  {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features|EXT_mesh_features}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing|EXT_mesh_gpu_instancing}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_meshopt_compression|EXT_meshopt_compression}
 *  </li>
 *  <li>
 *  {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp|EXT_texture_webp}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md|KHR_draco_mesh_compression}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_techniques_webgl/README.md|KHR_techniques_webgl}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/main/extensions/1.0/Khronos/KHR_materials_common/README.md|KHR_materials_common}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness|KHR_materials_pbrSpecularGlossiness}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit/README.md|KHR_materials_unlit}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_mesh_quantization|KHR_mesh_quantization}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_basisu|KHR_texture_basisu}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform/README.md|KHR_texture_transform}
 *  </li>
 *  <li>
 *  {@link https://github.com/KhronosGroup/glTF/blob/main/extensions/1.0/Vendor/WEB3D_quantized_attributes/README.md|WEB3D_quantized_attributes}
 *  </li>
 *  <li>
 *  {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local (experimental)}
 *  </li>
 * </ul>
 * </p>
 * <p>
 * 注意：对于使用 KHR_texture_basisu 扩展的压缩纹理的模型，我们建议在两个维度上都具有 2 次纹理的幂
 * 以获得最大的兼容性。这是因为某些采样器需要 2 个纹理 （{@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL|在 WebGL 中使用纹理}）
 * 和 KHR_texture_basisu 需要 4 个维度的倍数 （{@link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_basisu/README.md#additional-requirements|KHR_texture_basisu其他要求}）。
 * </p>
 *
 * @alias Model
 * @internalConstructor
 *
 * @privateParam {ResourceLoader} options.loader The loader used to load resources for this model.
 * @privateParam {ModelType} options.type Type of this model, to distinguish individual glTF files from 3D Tiles internally.
 * @privateParam {object} options 对象，具有以下属性:
 * @privateParam {Resource} options.resource 3D 模型的资源。
 * @privateParam {boolean} [options.show=true] 是否渲染模型。
 * @privateParam {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将模型从模型转换为世界坐标的 4x4 变换矩阵。
 * @privateParam {number} [options.scale=1.0] 应用于此模型的统一比例。
 * @privateParam {boolean} [options.enableVerticalExaggeration=true] 如果<code>为 true</code>，则当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型将沿椭球法线放大。
 * @privateParam {number} [options.minimumPixelSize=0.0] 不考虑缩放的模型的近似最小像素大小。
 * @privateParam {number} [options.maximumScale] 模型的最大缩放大小。minimumPixelSize 的上限。
 * @privateParam {object} [options.id] 使用 {@link Scene#pick} 选取模型时要返回的用户定义对象。
 * @privateParam {boolean} [options.allowPicking=true] 如果<code>为 true</code>，则每个基元都可以使用 {@link Scene#pick} 进行选取。
 * @privateParam {boolean} [options.clampAnimations=true] 确定模型的动画是否应在未指定关键帧的帧上保持姿势。
 * @privateParam {ShadowMode} [options.shadows=ShadowMode.ENABLED] 确定模型是投射还是接收来自光源的阴影。
 * @privateParam {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。为模型中的每个绘制命令绘制边界球体。
 * @privateParam {boolean} [options.enableDebugWireframe=false] 仅用于调试。必须将其设置为 true，才能使 debugWireframe 在 WebGL1 中工作。在模型加载后无法设置此项。
 * @privateParam {boolean} [options.debugWireframe=false] 仅用于调试。在线框中绘制模型。仅当 enableDebugWireframe 设置为 true 时，才适用于 WebGL1。
 * @privateParam {boolean} [options.cull=true] 是否使用视锥体/水平面剔除来剔除模型。如果模型是 3D 瓦片图块集的一部分，则此属性将始终为 false，因为使用的是 3D 瓦片剔除系统。
 * @privateParam {boolean} [options.opaquePass=Pass.OPAQUE] 在 {@link DrawCommand} 中用于模型的不透明部分的通道。
 * @privateParam {CustomShader} [options.customShader] 自定义着色器。这会将用户定义的 GLSL 代码添加到顶点和片段着色器中。使用带有 {@link Cesium3DTileStyle} 的自定义着色器可能会导致未定义的行为。
 * @privateParam {Cesium3DTileContent} [options.content] 此模型所属的瓦片内容。如果 model 未作为图块集的一部分加载，则此属性将未定义。
 * @privateParam {HeightReference} [options.heightReference=HeightReference.NONE] 确定如何相对于地形绘制模型。
 * @privateParam {Scene} [options.scene] 对于使用 height 引用属性的模型，必须传入。
 * @privateParam {DistanceDisplayCondition} [options.distanceDisplayCondition] 指定此模型将在距相机多远处显示的条件。
 * @privateParam {Color} [options.color] 与模型的渲染颜色混合的颜色。
 * @privateParam {ColorBlendMode} [options.colorBlendMode=ColorBlendMode.HIGHLIGHT] 定义颜色如何与模型混合。
 * @privateParam {number} [options.colorBlendAmount=0.5] 当 <code>colorBlendMode</code> 为 <code>MIX</code> 时，用于确定颜色强度的值。值为 0.0 时，将产生模型的渲染颜色，而值为 1.0 时，将产生纯色，介于两者之间的任何值都会导致两者混合。
 * @privateParam {Color} [options.silhouetteColor=Color.RED] 剪影颜色。如果启用了轮廓的模型超过 256 个，则重叠模型很可能会产生轻微的伪影。
 * @privateParam {number} [options.silhouetteSize=0.0] 轮廓的大小（以像素为单位）。
 * @privateParam {boolean} [options.enableShowOutline=true] 是否为使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。可以将其设置为 false，以避免在加载时对几何体进行额外处理。如果为 false，则忽略 showOutlines 和 outlineColor 选项。
 * @privateParam {boolean} [options.showOutline=true] 是否显示使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。如果为 true，则显示轮廓。如果为 false，则不显示轮廓。
 * @privateParam {Color} [options.outlineColor=Color.BLACK] 渲染轮廓时使用的颜色。
 * @privateParam {ClippingPlaneCollection} [options.clippingPlanes] 用于选择性地禁用模型渲染的 {@link ClippingPlaneCollection}。
 * @privateParam {ClippingPolygonCollection} [options.clippingPolygons] 用于选择性地禁用模型渲染的 {@link ClippingPolygonCollection}。
 * @privateParam {Cartesian3} [options.lightColor] 对模型进行着色时的光色。<code>如果未定义</code>，则使用场景的 light 颜色。
 * @privateParam {ImageBasedLighting} [options.imageBasedLighting] 用于管理此模型上基于图像的照明的属性。
 * @privateParam {boolean} [options.backFaceCulling=true] 是否剔除背面的几何体。如果为 true，则背面剔除由材质的 doubleSided 属性确定;如果为 false，则禁用背面剔除。如果模型的颜色是半透明的，则不会剔除背面。
 * @privateParam {Credit|string} [options.credit] 数据源的积分，显示在画布上。
 * @privateParam {boolean} [options.showCreditsOnScreen=false] 是否在屏幕上显示此模型的演职员表。
 * @privateParam {SplitDirection} [options.splitDirection=SplitDirection.NONE] 要应用于此模型的 {@link SplitDirection} 拆分。
 * @privateParam {boolean} [options.projectTo2D=false] 是否在 2D 中准确投影模型的位置。如果这是真的，模型将精确投影到 2D，但它会使用更多的内存来执行此操作。如果为 false，则模型将使用更少的内存，并且仍将以 2D/CV 模式渲染，但其位置可能不准确。这将禁用 minimumPixelSize 并防止将来对模型矩阵进行修改。在模型加载后也无法设置此项。
 * @privateParam {boolean} [options.enablePick=false] 当不使用 WebGL 2 或更高版本时，是否允许使用 <code>pick</code> 进行 CPU 选择。如果使用 WebGL 2 或更高版本，则此选项将被忽略。如果使用 WebGL 1 并且这是真的，<code>则 pick</code> 操作将正常工作，但它会使用更多内存来执行此操作。如果使用 WebGL 1 运行并且为 false，则模型将使用更少的内存，但 <code>pick</code> 将始终返回 <code>undefined</code>。在模型加载后无法设置此项。
 * @privateParam {string|number} [options.featureIdLabel=“featureId_0”] 用于选取和样式的特征 ID 集的标签。对于 EXT_mesh_features，这是特征 ID 的 label 属性，如果未指定，则为 “featureId_N”（其中 N 是 featureIds 数组中的索引）。EXT_feature_metadata没有标注字段，因此此类要素 ID 集始终标记为“featureId_N”，其中 N 是所有要素 ID 列表中的索引，其中要素 ID 属性列在要素 ID 纹理之前。如果 featureIdLabel 是整数 N，则会自动转换为字符串 featureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @privateParam {string|number} [options.instanceFeatureIdLabel=“instanceFeatureId_0”] 用于选取和样式的实例特征 ID 集的标签。如果 instanceFeatureIdLabel 设置为整数 N，则会自动转换为字符串 instanceFeatureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @privateParam {object} [options.pointCloudShading] 用于构建 {@link PointCloudShading} 对象的选项，以根据几何误差和照明控制点衰减。
 * @privateParam {ClassificationType} [options.classificationType] 确定此模型是否对地形、3D 瓦片或两者进行分类。在模型加载后无法设置此项。
 *
 *
 * @see Model.fromGltfAsync
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=3D%20Models.html|Cesium Sandcastle Models Demo}
 */
function Model(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.loader", options.loader);
  Check.typeOf.object("options.resource", options.resource);
  //>>includeEnd('debug');

  /**
   * 用于加载此模型的资源的加载器。
   *
   * @type {ResourceLoader}
   * @private
   */
  this._loader = options.loader;
  this._resource = options.resource;

  /**
   * 此模型的类型，用于区分单个 glTF 文件和 3D 瓦片
   *内部。
   *
   * @type {ModelType}
   * @readonly
   *
   * @private
   */
  this.type = defaultValue(options.type, ModelType.GLTF);

  /**
   * 将模型从模型转换为世界坐标的 4x4 转换矩阵。
   * 当这是单位矩阵时，模型以世界坐标（即地球的笛卡尔 WGS84 坐标）绘制。
   * 可以通过提供不同的转换矩阵来使用本地参考帧，就像返回的矩阵一样
   * 由 {@link Transforms.eastNorthUpToFixedFrame} 提供。
   *
   * @type {Matrix4}

   * @default {@link Matrix4.IDENTITY}
   *
   * @example
   * const origin = Cesium.Cartesian3.fromDegrees(-95.0, 40.0, 200000.0);
   * m.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  this._modelMatrix = Matrix4.clone(this.modelMatrix);
  this._scale = defaultValue(options.scale, 1.0);

  this._minimumPixelSize = defaultValue(options.minimumPixelSize, 0.0);

  this._maximumScale = options.maximumScale;

  /**
   * 被 maximum scale 参数限制后的 scale 值。
   * 用于调整边界球体，无需重复计算。
   *
   * @type {number}
   * @private
   */
  this._clampedScale = defined(this._maximumScale)
    ? Math.min(this._scale, this._maximumScale)
    : this._scale;

  this._computedScale = this._clampedScale;

  /**
   * ModelSceneGraph 是否应调用 updateModelMatrix。
   * 如果模型矩阵、比例、最小像素大小或最大比例中的任何一个是脏的，则为 true。
   *
   * @type {number}
   * @private
   */
  this._updateModelMatrix = false;

  /**
   * 如果已定义，则此矩阵用于转换其他属性，例如
   * 裁剪平面和基于图像的照明，而不是 modelMatrix。这是
   * 这样，当模型是 TileSet 的一部分时，这些属性就会被转换
   * 相对于公共引用（例如根）。
   *
   * @type {Matrix4}
   * @private
   */
  this.referenceMatrix = undefined;
  this._iblReferenceFrameMatrix = Matrix3.clone(Matrix3.IDENTITY); // Derived from reference matrix and the current view matrix

  this._resourcesLoaded = false;
  this._drawCommandsBuilt = false;

  this._ready = false;
  this._customShader = options.customShader;
  this._content = options.content;

  this._texturesLoaded = false;
  this._defaultTexture = undefined;

  this._activeAnimations = new ModelAnimationCollection(this);
  this._clampAnimations = defaultValue(options.clampAnimations, true);

  // This flag is true when the Cesium API, not a glTF animation, changes
  // the transform of a node in the model.
  this._userAnimationDirty = false;

  this._id = options.id;
  this._idDirty = false;

  this._color = Color.clone(options.color);
  this._colorBlendMode = defaultValue(
    options.colorBlendMode,
    ColorBlendMode.HIGHLIGHT,
  );
  this._colorBlendAmount = defaultValue(options.colorBlendAmount, 0.5);

  const silhouetteColor = defaultValue(options.silhouetteColor, Color.RED);
  this._silhouetteColor = Color.clone(silhouetteColor);
  this._silhouetteSize = defaultValue(options.silhouetteSize, 0.0);
  this._silhouetteDirty = false;

  // If silhouettes are used for the model, this will be set to the number
  // of the stencil buffer used for rendering the silhouette. This is set
  // by ModelSilhouettePipelineStage, not by Model itself.
  this._silhouetteId = undefined;

  this._cull = defaultValue(options.cull, true);
  this._opaquePass = defaultValue(options.opaquePass, Pass.OPAQUE);
  this._allowPicking = defaultValue(options.allowPicking, true);
  this._show = defaultValue(options.show, true);

  this._style = undefined;
  this._styleDirty = false;
  this._styleCommandsNeeded = undefined;

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

  this._featureTables = [];
  this._featureTableId = undefined;
  this._featureTableIdDirty = true;

  // Keeps track of resources that need to be destroyed when the draw commands are reset.
  this._pipelineResources = [];

  // Keeps track of resources that need to be destroyed when the Model is destroyed.
  this._modelResources = [];

  // Keeps track of the pick IDs for this model. These are stored and destroyed in the
  // pipeline resources array; the purpose of this array is to separate them from other
  // resources and update their ID objects when necessary.
  this._pickIds = [];

  // The model's bounding sphere and its initial radius are computed
  // in ModelSceneGraph.
  this._boundingSphere = new BoundingSphere();
  this._initialRadius = undefined;

  this._heightReference = defaultValue(
    options.heightReference,
    HeightReference.NONE,
  );
  this._heightDirty = this._heightReference !== HeightReference.NONE;
  this._removeUpdateHeightCallback = undefined;

  this._enableVerticalExaggeration = defaultValue(
    options.enableVerticalExaggeration,
    true,
  );
  this._hasVerticalExaggeration = false;

  this._clampedModelMatrix = undefined; // For use with height reference

  const scene = options.scene;
  if (defined(scene) && defined(scene.terrainProviderChanged)) {
    this._terrainProviderChangedCallback =
      scene.terrainProviderChanged.addEventListener(() => {
        this._heightDirty = true;
      });
  }
  this._scene = scene;

  this._distanceDisplayCondition = options.distanceDisplayCondition;

  const pointCloudShading = new PointCloudShading(options.pointCloudShading);
  this._pointCloudShading = pointCloudShading;
  this._attenuation = pointCloudShading.attenuation;
  this._pointCloudBackFaceCulling = pointCloudShading.backFaceCulling;

  // If the given clipping planes don't have an owner, make this model its owner.
  // Otherwise, the clipping planes are passed down from a tileset.
  const clippingPlanes = options.clippingPlanes;
  if (defined(clippingPlanes) && clippingPlanes.owner === undefined) {
    ClippingPlaneCollection.setOwner(clippingPlanes, this, "_clippingPlanes");
  } else {
    this._clippingPlanes = clippingPlanes;
  }
  this._clippingPlanesState = 0; // If this value changes, the shaders need to be regenerated.
  this._clippingPlanesMatrix = Matrix4.clone(Matrix4.IDENTITY); // Derived from reference matrix and the current view matrix

  // If the given clipping polygons don't have an owner, make this model its owner.
  // Otherwise, the clipping polygons are passed down from a tileset.
  const clippingPolygons = options.clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.owner === undefined) {
    ClippingPolygonCollection.setOwner(
      clippingPolygons,
      this,
      "_clippingPolygons",
    );
  } else {
    this._clippingPolygons = clippingPolygons;
  }
  this._clippingPolygonsState = 0; // If this value changes, the shaders need to be regenerated.

  this._lightColor = Cartesian3.clone(options.lightColor);

  this._imageBasedLighting = defined(options.imageBasedLighting)
    ? options.imageBasedLighting
    : new ImageBasedLighting();
  this._shouldDestroyImageBasedLighting = !defined(options.imageBasedLighting);

  this._backFaceCulling = defaultValue(options.backFaceCulling, true);
  this._backFaceCullingDirty = false;

  this._shadows = defaultValue(options.shadows, ShadowMode.ENABLED);
  this._shadowsDirty = false;

  this._debugShowBoundingVolumeDirty = false;
  this._debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false,
  );

  this._enableDebugWireframe = defaultValue(
    options.enableDebugWireframe,
    false,
  );
  this._enableShowOutline = defaultValue(options.enableShowOutline, true);
  this._debugWireframe = defaultValue(options.debugWireframe, false);

  // Warning for improper setup of debug wireframe
  if (
    this._debugWireframe === true &&
    this._enableDebugWireframe === false &&
    this.type === ModelType.GLTF
  ) {
    oneTimeWarning(
      "model-debug-wireframe-ignored",
      "enableDebugWireframe must be set to true in Model.fromGltf, otherwise debugWireframe will be ignored.",
    );
  }

  // Credit specified by the user.
  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }

  this._credits = [];
  this._credit = credit;

  // Credits to be added from the Resource (if it is an IonResource)
  this._resourceCredits = [];

  // Credits parsed from the glTF by GltfLoader.
  this._gltfCredits = [];

  this._showCreditsOnScreen = defaultValue(options.showCreditsOnScreen, false);
  this._showCreditsOnScreenDirty = true;

  this._splitDirection = defaultValue(
    options.splitDirection,
    SplitDirection.NONE,
  );

  this._enableShowOutline = defaultValue(options.enableShowOutline, true);

  /**
   * 是否显示使用
   * {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。
   * 如果为 true，则显示轮廓。如果为 false，则不显示轮廓。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.showOutline = defaultValue(options.showOutline, true);

  /**
   * 渲染轮廓时使用的颜色。
   *
   * @type {Color}
   *
   * @default Color.BLACK
   */
  this.outlineColor = defaultValue(options.outlineColor, Color.BLACK);

  this._classificationType = options.classificationType;

  this._statistics = new ModelStatistics();

  this._sceneMode = undefined;
  this._projectTo2D = defaultValue(options.projectTo2D, false);
  this._enablePick = defaultValue(options.enablePick, false);

  this._fogRenderable = undefined;

  this._skipLevelOfDetail = false;
  this._ignoreCommands = defaultValue(options.ignoreCommands, false);

  this._errorEvent = new Event();
  this._readyEvent = new Event();
  this._texturesReadyEvent = new Event();

  this._sceneGraph = undefined;
  this._nodesByName = {}; // Stores the nodes by their names in the glTF.

  /**
   * 用于拾取包裹模型的基元。
   *
   * @private
   */
  this.pickObject = options.pickObject;
}

function handleError(model, error) {
  if (model._errorEvent.numberOfListeners > 0) {
    model._errorEvent.raiseEvent(error);
    return;
  }

  console.log(error);
}

function createModelFeatureTables(model, structuralMetadata) {
  const featureTables = model._featureTables;

  const propertyTables = structuralMetadata.propertyTables;
  const length = propertyTables.length;
  for (let i = 0; i < length; i++) {
    const propertyTable = propertyTables[i];
    const modelFeatureTable = new ModelFeatureTable({
      model: model,
      propertyTable: propertyTable,
    });

    featureTables.push(modelFeatureTable);
  }

  return featureTables;
}

function selectFeatureTableId(components, model) {
  const featureIdLabel = model._featureIdLabel;
  const instanceFeatureIdLabel = model._instanceFeatureIdLabel;

  let i, j;
  let featureIdAttribute;

  let node;
  // Scan the nodes till we find one with instances, get the feature table ID
  // if the feature ID attribute of the user-selected index is present.
  for (i = 0; i < components.nodes.length; i++) {
    node = components.nodes[i];
    if (defined(node.instances)) {
      featureIdAttribute = ModelUtility.getFeatureIdsByLabel(
        node.instances.featureIds,
        instanceFeatureIdLabel,
      );
      if (
        defined(featureIdAttribute) &&
        defined(featureIdAttribute.propertyTableId)
      ) {
        return featureIdAttribute.propertyTableId;
      }
    }
  }

  // Scan the primitives till we find one with textures or attributes, get the feature table ID
  // if the feature ID attribute/texture of the user-selected index is present.
  for (i = 0; i < components.nodes.length; i++) {
    node = components.nodes[i];
    for (j = 0; j < node.primitives.length; j++) {
      const primitive = node.primitives[j];
      const featureIds = ModelUtility.getFeatureIdsByLabel(
        primitive.featureIds,
        featureIdLabel,
      );

      if (defined(featureIds)) {
        return featureIds.propertyTableId;
      }
    }
  }

  // If there's only one feature table, then select it by default. This is
  // to ensure backwards compatibility with the older handling of b3dm models.
  if (model._featureTables.length === 1) {
    return 0;
  }
}

/**
 * 返回 Alpha 状态是否在 invisible、
 * 半透明或不透明。
 *
 *  @private
 */
function isColorAlphaDirty(currentColor, previousColor) {
  if (!defined(currentColor) && !defined(previousColor)) {
    return false;
  }

  if (defined(currentColor) !== defined(previousColor)) {
    return true;
  }

  const currentAlpha = currentColor.alpha;
  const previousAlpha = previousColor.alpha;
  return (
    Math.floor(currentAlpha) !== Math.floor(previousAlpha) ||
    Math.ceil(currentAlpha) !== Math.ceil(previousAlpha)
  );
}

Object.defineProperties(Model.prototype, {
  /**
   * 如果<code>为 true</code>，则此模型已准备好渲染，即外部二进制文件 image、
   * 下载了着色器文件并创建了 WebGL 资源。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 获取模型遇到异步渲染错误时引发的事件。 通过订阅
   * 时，您将收到错误通知，并可能从中恢复。 事件侦听器
   * 的实例将传递 {@link ModelError} 的实例。
   * @memberof Model.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在模型加载并准备好渲染时引发的事件，即当外部资源
   * 已下载，并且 WebGL 资源已创建。事件侦听器
   * 的实例将传递 {@link Model} 的实例。
   *
   * <p>
   * 如果 {@link Model.incrementallyLoadTextures} 为 true，则在所有纹理加载并准备好渲染之前，将引发此事件。订阅 {@link Model.texturesReadyEvent} 以在纹理准备就绪时收到通知。
   * </p>
   *
   * @memberof Model.prototype
   * @type {Event}
   * @readonly
   */
  readyEvent: {
    get: function () {
      return this._readyEvent;
    },
  },

  /**
   * 如果纹理与其他 glTF 资源分开加载，则返回 true。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   * @readonly
   * @private
   */
  incrementallyLoadTextures: {
    get: function () {
      return defaultValue(this._loader.incrementallyLoadTextures, false);
    },
  },

  /**
   * 获取一个事件，如果 {@link Model.incrementallyLoadTextures} 为 true，则在加载模型纹理并准备好进行渲染时（即当外部资源
   * 已下载，并且 WebGL 资源已创建。事件侦听器
   * 的实例将传递 {@link Model} 的实例。
   *
   * @memberof Model.prototype
   * @type {Event}
   * @readonly
   */
  texturesReadyEvent: {
    get: function () {
      return this._texturesReadyEvent;
    },
  },

  /**
   * @private
   */
  loader: {
    get: function () {
      return this._loader;
    },
  },

  /**
   * 获取此模型的估计内存使用统计信息。
   *
   * @memberof Model.prototype
   *
   * @type {ModelStatistics}
   * @readonly
   *
   * @private
   */
  statistics: {
    get: function () {
      return this._statistics;
    },
  },

  /**
   * 当前播放的 glTF 动画。
   *
   * @memberof Model.prototype
   *
   * @type {ModelAnimationCollection}
   * @readonly
   */
  activeAnimations: {
    get: function () {
      return this._activeAnimations;
    },
  },

  /**
   * 确定模型的动画是否应在未指定关键帧的帧上保持姿势。
   *
   * @memberof Model.prototype
   * @type {boolean}
   *
   * @default true
   */
  clampAnimations: {
    get: function () {
      return this._clampAnimations;
    },
    set: function (value) {
      this._clampAnimations = value;
    },
  },

  /**
   * 是否使用视锥体/水平面剔除来剔除模型。如果模型是 3D Tiles 图块集的一部分，则此属性
   * 将始终为 false，因为使用的是 3D 瓦片剔除系统。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */
  cull: {
    get: function () {
      return this._cull;
    },
  },

  /**
   * 在 {@link DrawCommand} 中用于模型的不透明部分的通道。
   *
   * @memberof Model.prototype
   *
   * @type {Pass}
   * @readonly
   *
   * @private
   */
  opaquePass: {
    get: function () {
      return this._opaquePass;
    },
  },

  /**
   * 用于控制点云衰减的点云着色设置
   * 和照明。对于 3D 瓦片，这是从
   * {@link Cesium3DTileset}.
   *
   * @memberof Model.prototype
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
      if (value !== this._pointCloudShading) {
        this.resetDrawCommands();
      }
      this._pointCloudShading = value;
    },
  },

  /**
   * 模型的自定义着色器（如果存在）。将自定义着色器与 {@link Cesium3DTileStyle} 一起使用
   * 可能会导致未定义的行为。
   *
   * @memberof Model.prototype
   *
   * @type {CustomShader}
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  customShader: {
    get: function () {
      return this._customShader;
    },
    set: function (value) {
      if (value !== this._customShader) {
        this.resetDrawCommands();
      }
      this._customShader = value;
    },
  },

  /**
   * 此模型的场景图。
   *
   * @memberof Model.prototype
   *
   * @type {ModelSceneGraph}
   * @private
   */
  sceneGraph: {
    get: function () {
      return this._sceneGraph;
    },
  },

  /**
   * 此模型所属的瓦片内容（如果它作为 {@link Cesium3DTileset} 的一部分加载）。
   *
   * @memberof Model.prototype
   *
   * @type {Cesium3DTileContent}
   * @readonly
   *
   * @private
   */
  content: {
    get: function () {
      return this._content;
    },
  },

  /**
   * 模型的高度参考，它决定了模型的绘制方式
   * 相对于地形。
   *
   * @memberof Model.prototype
   *
   * @type {HeightReference}
   * @default {HeightReference.NONE}
   *
   */
  heightReference: {
    get: function () {
      return this._heightReference;
    },
    set: function (value) {
      if (value !== this._heightReference) {
        this._heightDirty = true;
      }
      this._heightReference = value;
    },
  },

  /**
   * 获取或设置distance 显示条件，指定在什么距离处
   * 从相机将显示此模型。
   *
   * @memberof Model.prototype
   *
   * @type {DistanceDisplayCondition}
   *
   * @default undefined
   *
   */
  distanceDisplayCondition: {
    get: function () {
      return this._distanceDisplayCondition;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError("far must be greater than near");
      }
      //>>includeEnd('debug');
      this._distanceDisplayCondition = DistanceDisplayCondition.clone(
        value,
        this._distanceDisplayCondition,
      );
    },
  },

  /**
   * 来自 EXT_structural_metadata 扩展的结构元数据
   *
   * @memberof Model.prototype
   *
   * @type {StructuralMetadata}
   * @readonly
   *
   * @private
   */
  structuralMetadata: {
    get: function () {
      return this._sceneGraph.components.structuralMetadata;
    },
  },

  /**
   * 用于此模型中的选取和样式的特征表的 ID。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   *
   * @private
   */
  featureTableId: {
    get: function () {
      return this._featureTableId;
    },
    set: function (value) {
      this._featureTableId = value;
    },
  },

  /**
   * 此型号的特性表。
   *
   * @memberof Model.prototype
   *
   * @type {Array}
   * @readonly
   *
   * @private
   */
  featureTables: {
    get: function () {
      return this._featureTables;
    },
    set: function (value) {
      this._featureTables = value;
    },
  },

  /**
   * 选取模型时返回的用户定义对象。
   *
   * @memberof Model.prototype
   *
   * @type {object}
   *
   * @default undefined
   *
   * @see Scene#pick
   */
  id: {
    get: function () {
      return this._id;
    },
    set: function (value) {
      if (value !== this._id) {
        this._idDirty = true;
      }

      this._id = value;
    },
  },

  /**
   * 如果<code>为 true</code>，则每个基元都可以使用 {@link Scene#pick} 进行拾取。 如果<code>为 false</code>，则保存 GPU 内存。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */
  allowPicking: {
    get: function () {
      return this._allowPicking;
    },
  },

  /**
   * 要应用于模型中特征的样式。如果还应用了 {@link CustomShader}，则无法应用。
   *
   * @memberof Model.prototype
   *
   * @type {Cesium3DTileStyle}
   */
  style: {
    get: function () {
      return this._style;
    },
    set: function (value) {
      this._style = value;
      this._styleDirty = true;
    },
  },

  /**
   * 要与模型的渲染颜色混合的颜色。
   *
   * @memberof Model.prototype
   *
   * @type {Color}
   *
   * @default undefined
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      if (isColorAlphaDirty(value, this._color)) {
        this.resetDrawCommands();
      }
      this._color = Color.clone(value, this._color);
    },
  },

  /**
   * 定义颜色如何与模型混合。
   *
   * @memberof Model.prototype
   *
   * @type {Cesium3DTileColorBlendMode|ColorBlendMode}
   *
   * @default ColorBlendMode.HIGHLIGHT
   */
  colorBlendMode: {
    get: function () {
      return this._colorBlendMode;
    },
    set: function (value) {
      this._colorBlendMode = value;
    },
  },

  /**
   * 用于确定 <code>colorBlendMode</code> 为 <code>MIX</code> 时颜色强度的值。值为 0.0 时，将产生模型的渲染颜色，而值为 1.0 时，将产生纯色，介于两者之间的任何值都会导致两者混合。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   *
   * @default 0.5
   */
  colorBlendAmount: {
    get: function () {
      return this._colorBlendAmount;
    },
    set: function (value) {
      this._colorBlendAmount = value;
    },
  },

  /**
   * 轮廓颜色。
   *
   * @memberof Model.prototype
   *
   * @type {Color}
   *
   * @default Color.RED
   */
  silhouetteColor: {
    get: function () {
      return this._silhouetteColor;
    },
    set: function (value) {
      if (!Color.equals(value, this._silhouetteColor)) {
        const alphaDirty = isColorAlphaDirty(value, this._silhouetteColor);
        this._silhouetteDirty = this._silhouetteDirty || alphaDirty;
      }

      this._silhouetteColor = Color.clone(value, this._silhouetteColor);
    },
  },

  /**
   * 轮廓的大小（以像素为单位）。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   *
   * @default 0.0
   */
  silhouetteSize: {
    get: function () {
      return this._silhouetteSize;
    },
    set: function (value) {
      if (value !== this._silhouetteSize) {
        const currentSize = this._silhouetteSize;
        const sizeDirty =
          (value > 0.0 && currentSize === 0.0) ||
          (value === 0.0 && currentSize > 0.0);
        this._silhouetteDirty = this._silhouetteDirty || sizeDirty;

        // Back-face culling needs to be updated in case the silhouette size
        // is greater than zero.
        this._backFaceCullingDirty = this._backFaceCullingDirty || sizeDirty;
      }

      this._silhouetteSize = value;
    },
  },

  /**
   * 获取模型在世界空间中的边界球体。这并未考虑到
   * glTF 动画、皮肤或变形目标。它也没有考虑
   * {@link Model#minimumPixelSize}.
   *
   * @memberof Model.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   */
  boundingSphere: {
    get: function () {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new DeveloperError(
          "The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.",
        );
      }
      //>>includeEnd('debug');

      const modelMatrix = defined(this._clampedModelMatrix)
        ? this._clampedModelMatrix
        : this.modelMatrix;
      updateBoundingSphere(this, modelMatrix);

      return this._boundingSphere;
    },
  },

  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 为模型中的每个绘制命令绘制边界球体。
   * </p>
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   *
   * @default false
   */
  debugShowBoundingVolume: {
    get: function () {
      return this._debugShowBoundingVolume;
    },
    set: function (value) {
      if (this._debugShowBoundingVolume !== value) {
        this._debugShowBoundingVolumeDirty = true;
      }
      this._debugShowBoundingVolume = value;
    },
  },

  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 以线框形式绘制模型。
   * </p>
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   *
   * @default false
   */
  debugWireframe: {
    get: function () {
      return this._debugWireframe;
    },
    set: function (value) {
      if (this._debugWireframe !== value) {
        this.resetDrawCommands();
      }
      this._debugWireframe = value;

      // Warning for improper setup of debug wireframe
      if (
        this._debugWireframe === true &&
        this._enableDebugWireframe === false &&
        this.type === ModelType.GLTF
      ) {
        oneTimeWarning(
          "model-debug-wireframe-ignored",
          "enableDebugWireframe must be set to true in Model.fromGltfAsync, otherwise debugWireframe will be ignored.",
        );
      }
    },
  },

  /**
   * 是否渲染模型。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      this._show = value;
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
   * @memberof Model.prototype
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

      if (value !== this._featureIdLabel) {
        this._featureTableIdDirty = true;
      }

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
   * @memberof Model.prototype
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

      if (value !== this._instanceFeatureIdLabel) {
        this._featureTableIdDirty = true;
      }

      this._instanceFeatureIdLabel = value;
    },
  },

  /**
   * 用于选择性地禁用模型渲染的 {@link ClippingPlaneCollection}。
   *
   * @memberof Model.prototype
   *
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._clippingPlanes;
    },
    set: function (value) {
      if (value !== this._clippingPlanes) {
        // Handle destroying old clipping planes, new clipping planes ownership
        ClippingPlaneCollection.setOwner(value, this, "_clippingPlanes");
        this.resetDrawCommands();
      }
    },
  },

  /**
   * 用于选择性地禁用模型渲染的 {@link ClippingPolygonCollection}。
   *
   * @memberof Model.prototype
   *
   * @type {ClippingPolygonCollection}
   */
  clippingPolygons: {
    get: function () {
      return this._clippingPolygons;
    },
    set: function (value) {
      if (value !== this._clippingPolygons) {
        // Handle destroying old clipping polygons, new clipping polygons ownership
        ClippingPolygonCollection.setOwner(value, this, "_clippingPolygons");
        this.resetDrawCommands();
      }
    },
  },

  /**
   * 如果<code>为 true</code>，则当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型将沿椭球法线放大。
   *
   * @memberof Model.prototype
   * @type {boolean}
   * @default true
   *
   * @example
   * // Exaggerate terrain by a factor of 2, but prevent model exaggeration
   * scene.verticalExaggeration = 2.0;
   * model.enableVerticalExaggeration = false;
   */
  enableVerticalExaggeration: {
    get: function () {
      return this._enableVerticalExaggeration;
    },
    set: function (value) {
      if (value !== this._enableVerticalExaggeration) {
        this.resetDrawCommands();
      }
      this._enableVerticalExaggeration = value;
    },
  },

  /**
   * 如果<code>为 true</code>，则模型沿椭球法线垂直放大。
   *
   * @memberof Model.prototype
   * @type {boolean}
   * @default true
   * @readonly
   * @private
   */
  hasVerticalExaggeration: {
    get: function () {
      return this._hasVerticalExaggeration;
    },
  },

  /**
   * 对模型进行着色时的浅色。<code>如果未定义</code>，则使用场景的 light 颜色。
   * <p>
   * 通过设置
   * <code>model.imageBasedLighting.imageBasedLightingFactor = 新笛卡尔2（0.0， 0.0）</code>
   * 将使模型更暗。在这里，增加光源的强度将使模型更亮。
   * </p>
   * @memberof Model.prototype
   *
   * @type {Cartesian3}
   *
   * @default undefined
   */
  lightColor: {
    get: function () {
      return this._lightColor;
    },
    set: function (value) {
      if (defined(value) !== defined(this._lightColor)) {
        this.resetDrawCommands();
      }

      this._lightColor = Cartesian3.clone(value, this._lightColor);
    },
  },

  /**
   * 此模型上用于管理基于图像的照明的属性。
   *
   * @memberof Model.prototype
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
        this.resetDrawCommands();
      }
    },
  },

  /**
   * 是否剔除背面的几何体。如果为 true，则背面剔除为
   * 由材质的 doubleSided 属性确定;当 false 时，背面
   * 剔除已禁用。如果 {@link Model#color}
   * 是半透明的或 {@link Model#silhouetteSize} 大于 0.0。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  backFaceCulling: {
    get: function () {
      return this._backFaceCulling;
    },
    set: function (value) {
      if (value !== this._backFaceCulling) {
        this._backFaceCullingDirty = true;
      }

      this._backFaceCulling = value;
    },
  },

  /**
   * 在 {@link Model#modelMatrix} 之前应用于此模型的统一比例。
   * 大于 <code>1.0</code> 的值会增加模型的大小;值
   * 少于 <code>1.0</code> 减少。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   *
   * @default 1.0
   */
  scale: {
    get: function () {
      return this._scale;
    },
    set: function (value) {
      if (value !== this._scale) {
        this._updateModelMatrix = true;
      }
      this._scale = value;
    },
  },

  /**
   * 模型受模型比例影响后的真实比例，
   * 最小像素大小和最大缩放参数。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   * @readonly
   *
   * @private
   */
  computedScale: {
    get: function () {
      return this._computedScale;
    },
  },

  /**
   * 无论缩放如何，模型的近似最小像素大小。
   * 这可用于确保模型在查看者
   * 缩小。 当 <code>0.0</code> 时，不强制使用最小大小。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   *
   * @default 0.0
   */
  minimumPixelSize: {
    get: function () {
      return this._minimumPixelSize;
    },
    set: function (value) {
      if (value !== this._minimumPixelSize) {
        this._updateModelMatrix = true;
      }
      this._minimumPixelSize = value;
    },
  },

  /**
   * 模型的最大缩放大小。这可以用来给出
   * {@link Model#minimumPixelSize} 的上限，确保模型
   * 从来都不是一个不合理的比例。
   *
   * @memberof Model.prototype
   *
   * @type {number}
   */
  maximumScale: {
    get: function () {
      return this._maximumScale;
    },
    set: function (value) {
      if (value !== this._maximumScale) {
        this._updateModelMatrix = true;
      }
      this._maximumScale = value;
    },
  },

  /**
   * 确定模型是投射还是接收来自光源的阴影。

   * @memberof Model.prototype
   *
   * @type {ShadowMode}
   *
   * @default ShadowMode.ENABLED
   */
  shadows: {
    get: function () {
      return this._shadows;
    },
    set: function (value) {
      if (value !== this._shadows) {
        this._shadowsDirty = true;
      }

      this._shadows = value;
    },
  },

  /**
   * 获取将为模型显示的积分。
   *
   * @memberof Model.prototype
   *
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取或设置是否显示模型的积分
   * 在屏幕上。
   *
   * @memberof Model.prototype
   *
   * @type {boolean}
   *
   * @default false
   */
  showCreditsOnScreen: {
    get: function () {
      return this._showCreditsOnScreen;
    },
    set: function (value) {
      if (this._showCreditsOnScreen !== value) {
        this._showCreditsOnScreenDirty = true;
      }

      this._showCreditsOnScreen = value;
    },
  },

  /**
   * 要应用于此模型的 {@link SplitDirection}。
   *
   * @memberof Model.prototype
   *
   * @type {SplitDirection}
   *
   * @default {@link SplitDirection.NONE}
   */
  splitDirection: {
    get: function () {
      return this._splitDirection;
    },
    set: function (value) {
      if (this._splitDirection !== value) {
        this.resetDrawCommands();
      }
      this._splitDirection = value;
    },
  },

  /**
   * 获取模型的分类类型。这决定了 terrain、
   * 3D 瓦片或两者将按此模型分类。
   * <p>
   * 此外，还有一些要求/限制：
   * <ul>
   * <li>glTF 不能包含变形目标、皮肤或动画。</li>
   * <li>glTF 不能包含 <code>EXT_mesh_gpu_instancing</code> 扩展。</li>
   * <li>只有带有 TRIANGLES 的网格才能用于对其他资产进行分类。</li>
   * <li>网格必须防水。</li>
   * <li>POSITION 属性是必需的。</li>
   * <li>如果要素 ID 和索引缓冲区都存在，则具有相同要素 ID 的所有索引必须占据索引缓冲区的连续部分。</li>
   * <li>如果存在要素 ID 而没有索引缓冲区，则具有相同要素 ID 的所有位置必须占据位置缓冲区的连续部分。</li>
   * </ul>
   * </p>
   * <p>
   * 接受分类的 3D 瓦片或地形必须是不透明的。
   * </p>
   *
   * @memberof Model.prototype
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
   * 对选取 ID 的引用。这仅在内部使用，例如
   * {@link PostProcessStage} 中的每个特征后处理。
   *
   * @memberof Model.prototype
   *
   * @type {PickId[]}
   * @readonly
   *
   * @private
   */
  pickIds: {
    get: function () {
      return this._pickIds;
    },
  },

  /**
   * 当前应用于的样式的 {@link StyleCommandsNeeded}
   * 模型中的特征。它由 {@link ModelDrawCommand} 在内部使用
   * 确定要在更新中提交哪些命令时。
   *
   * @memberof Model.prototype
   *
   * @type {StyleCommandsNeeded}
   * @readonly
   *
   * @private
   */
  styleCommandsNeeded: {
    get: function () {
      return this._styleCommandsNeeded;
    },
  },
});

/**
 * 返回 glTF 中具有给定<code>名称</code>的节点。这用于
 * 修改用户定义的动画的节点变换。
 *
 * @param {string} name glTF 中节点的名称。
 * @returns {ModelNode} 节点，如果不存在具有<code>该名称</code>的节点，则<code>为 undefined</code>。
 *
 * @exception {DeveloperError} 模型未加载。 使用 Model.readyEvent 或等待 Model.ready 为 true。
 *
 * @example
 * // Apply non-uniform scale to node "Hand"
 * const node = model.getNode("Hand");
 * node.matrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(5.0, 1.0, 1.0), node.matrix);
 */
Model.prototype.getNode = function (name) {
  //>>includeStart('debug', pragmas.debug);
  if (!this._ready) {
    throw new DeveloperError(
      "The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.",
    );
  }
  Check.typeOf.string("name", name);
  //>>includeEnd('debug');

  return this._nodesByName[name];
};

/**
 * 设置清晰度阶段的当前值。 设置一个或
 * 多个 stage 值，调用 Model.applyArticulations() 以
 * 导致重新计算节点矩阵。
 *
 * @param {string} articulationStageKey 关节的名称、空格和舞台的名称。
 * @param {number} value 此发音阶段的数值。
 *
 * @exception {DeveloperError} The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.
 *
 * @see Model#applyArticulations
 *
 * @example
 * // Sets the value of the stage named "MoveX" belonging to the articulation named "SampleArticulation"
 * model.setArticulationStage("SampleArticulation MoveX", 50.0);
 */
Model.prototype.setArticulationStage = function (articulationStageKey, value) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  if (!this._ready) {
    throw new DeveloperError(
      "The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.",
    );
  }
  //>>includeEnd('debug');

  this._sceneGraph.setArticulationStage(articulationStageKey, value);
};

/**
 * 将任何修改后的接球阶段应用于每个节点的矩阵，该节点
 * 参加任何发音。请注意，这将覆盖任何节点
 * 参与节点上的转换。
 *
 * @exception {DeveloperError} The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.
 */
Model.prototype.applyArticulations = function () {
  //>>includeStart('debug', pragmas.debug);
  if (!this._ready) {
    throw new DeveloperError(
      "The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.",
    );
  }
  //>>includeEnd('debug');

  this._sceneGraph.applyArticulations();
};

/**
 * 返回为给定扩展创建的对象。
 *
 * given name 可以是 glTF 扩展的名称，例如 '“EXT_example_extension”'。
 * 如果指定的扩展名存在于底层 glTF 资产的根目录中，
 * 并且指定扩展的 LODER 已处理扩展数据，则
 * 这将返回扩展的模型表示形式。
 *
 * @param {string} extensionName 扩展的名称
 * @returns {object|undefined} 对象或 'undefined'
 * @exception {DeveloperError} 模型未加载。使用 Model.readyEvent 或等待 Model.ready 为 true。
 *
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
Model.prototype.getExtension = function (extensionName) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("extensionName", extensionName);
  if (!this._ready) {
    throw new DeveloperError(
      "The model is not loaded. Use Model.readyEvent or wait for Model.ready to be true.",
    );
  }
  //>>includeEnd('debug');
  const components = this._loader.components;
  return components.extensions[extensionName];
};

/**
 * 将模型的 {@link Model#style} 标记为 dirty，这将强制执行所有特征
 * 在下一帧中重新评估样式，模型可见。
 */
Model.prototype.makeStyleDirty = function () {
  this._styleDirty = true;
};

/**
 * 重置此模型的绘制命令。
 *
 * @private
 */
Model.prototype.resetDrawCommands = function () {
  this._drawCommandsBuilt = false;
};

const scratchIBLReferenceFrameMatrix4 = new Matrix4();
const scratchIBLReferenceFrameMatrix3 = new Matrix3();
const scratchClippingPlanesMatrix = new Matrix4();

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此函数。 这记录下来只是为了
 * 列出渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {RuntimeError} Failed to load external reference.
 */
Model.prototype.update = function (frameState) {
  let finishedProcessing = false;
  try {
    // Keep processing the model every frame until the main resources
    // (buffer views) and textures (which may be loaded asynchronously)
    // are processed.
    finishedProcessing = processLoader(this, frameState);
  } catch (error) {
    if (
      !this._loader.incrementallyLoadTextures &&
      error.name === "TextureError"
    ) {
      handleError(this, error);
    } else {
      const runtimeError = ModelUtility.getError(
        "model",
        this._resource,
        error,
      );
      handleError(this, runtimeError);
    }
  }

  // A custom shader may have to load texture uniforms.
  updateCustomShader(this, frameState);

  // The image-based lighting may have to load texture uniforms
  // for specular maps.
  updateImageBasedLighting(this, frameState);

  if (!this._resourcesLoaded && finishedProcessing) {
    this._resourcesLoaded = true;

    const components = this._loader.components;
    if (!defined(components)) {
      if (this._loader.isUnloaded()) {
        return;
      }

      const error = ModelUtility.getError(
        "model",
        this._resource,
        new RuntimeError("Failed to load model."),
      );
      handleError(error);
      this._rejectLoad = this._rejectLoad && this._rejectLoad(error);
    }

    const structuralMetadata = components.structuralMetadata;
    if (
      defined(structuralMetadata) &&
      structuralMetadata.propertyTableCount > 0
    ) {
      createModelFeatureTables(this, structuralMetadata);
    }

    const sceneGraph = new ModelSceneGraph({
      model: this,
      modelComponents: components,
    });

    this._sceneGraph = sceneGraph;
    this._gltfCredits = sceneGraph.components.asset.credits;
  }

  // Short-circuit if the model resources aren't ready or the scene
  // is currently morphing.
  if (!this._resourcesLoaded || frameState.mode === SceneMode.MORPHING) {
    return;
  }

  updateFeatureTableId(this);
  updateStyle(this);
  updateFeatureTables(this, frameState);
  updatePointCloudShading(this);
  updateSilhouette(this, frameState);
  updateSkipLevelOfDetail(this, frameState);
  updateClippingPlanes(this, frameState);
  updateClippingPolygons(this, frameState);
  updateSceneMode(this, frameState);
  updateFog(this, frameState);
  updateVerticalExaggeration(this, frameState);

  this._defaultTexture = frameState.context.defaultTexture;

  buildDrawCommands(this, frameState);
  updateModelMatrix(this, frameState);

  // Many features (e.g. image-based lighting, clipping planes) depend on the model
  // matrix being updated for the current height reference, so update it first.
  updateClamping(this);

  updateBoundingSphereAndScale(this, frameState);
  updateReferenceMatrices(this, frameState);

  // This check occurs after the bounding sphere has been updated so that
  // zooming to the bounding sphere can account for any modifications
  // from the clamp-to-ground setting.
  if (!this._ready) {
    // Set the model as ready after the first frame render since the user might set up events subscribed to
    // the post render event, and the model may not be ready for those past the first frame.
    frameState.afterRender.push(() => {
      this._ready = true;
      this._readyEvent.raiseEvent(this);
    });

    // Don't render until the next frame after the ready event has been raised.
    return;
  }

  if (
    this._loader.incrementallyLoadTextures &&
    !this._texturesLoaded &&
    this._loader.texturesLoaded
  ) {
    // Re-run the pipeline so texture memory statistics are re-computed
    this.resetDrawCommands();

    this._texturesLoaded = true;
    this._texturesReadyEvent.raiseEvent(this);
  }

  updatePickIds(this);

  // Update the scene graph and draw commands for any changes in model's properties
  // (e.g. model matrix, back-face culling)
  updateSceneGraph(this, frameState);
  updateShowCreditsOnScreen(this);
  submitDrawCommands(this, frameState);
};

function processLoader(model, frameState) {
  if (
    !model._resourcesLoaded ||
    (model._loader.incrementallyLoadTextures && !model._texturesLoaded)
  ) {
    // Ensures frames continue to render in requestRender mode while resources are processing
    frameState.afterRender.push(() => true);
    return model._loader.process(frameState);
  }

  return true;
}

function updateCustomShader(model, frameState) {
  if (defined(model._customShader)) {
    model._customShader.update(frameState);
  }
}

function updateImageBasedLighting(model, frameState) {
  model._imageBasedLighting.update(frameState);
  if (model._imageBasedLighting.shouldRegenerateShaders) {
    model.resetDrawCommands();
  }
}

function updateFeatureTableId(model) {
  if (!model._featureTableIdDirty) {
    return;
  }
  model._featureTableIdDirty = false;

  const components = model._sceneGraph.components;
  const structuralMetadata = components.structuralMetadata;

  if (
    defined(structuralMetadata) &&
    structuralMetadata.propertyTableCount > 0
  ) {
    model.featureTableId = selectFeatureTableId(components, model);

    // Mark the style dirty to re-apply it and reflect the new feature ID table.
    model._styleDirty = true;

    // Trigger a rebuild of the draw commands.
    model.resetDrawCommands();
  }
}

function updateStyle(model) {
  if (model._styleDirty) {
    model.applyStyle(model._style);
    model._styleDirty = false;
  }
}

function updateFeatureTables(model, frameState) {
  const featureTables = model._featureTables;
  const length = featureTables.length;

  let styleCommandsNeededDirty = false;
  for (let i = 0; i < length; i++) {
    featureTables[i].update(frameState);
    // Check if the types of style commands needed have changed and trigger a reset of the draw commands
    // to ensure that translucent and opaque features are handled in the correct passes.
    if (featureTables[i].styleCommandsNeededDirty) {
      styleCommandsNeededDirty = true;
    }
  }

  if (styleCommandsNeededDirty) {
    updateStyleCommandsNeeded(model);
  }
}

function updateStyleCommandsNeeded(model) {
  const featureTable = model.featureTables[model.featureTableId];
  model._styleCommandsNeeded = StyleCommandsNeeded.getStyleCommandsNeeded(
    featureTable.featuresLength,
    featureTable.batchTexture.translucentFeaturesLength,
  );
}

function updatePointCloudShading(model) {
  const pointCloudShading = model.pointCloudShading;

  // Check if the shader needs to be updated for point cloud attenuation
  // settings.
  if (pointCloudShading.attenuation !== model._attenuation) {
    model.resetDrawCommands();
    model._attenuation = pointCloudShading.attenuation;
  }

  if (pointCloudShading.backFaceCulling !== model._pointCloudBackFaceCulling) {
    model.resetDrawCommands();
    model._pointCloudBackFaceCulling = pointCloudShading.backFaceCulling;
  }
}

function updateSilhouette(model, frameState) {
  if (model._silhouetteDirty) {
    // Only rebuild draw commands if silhouettes are supported in the first place.
    if (supportsSilhouettes(frameState)) {
      model.resetDrawCommands();
    }

    model._silhouetteDirty = false;
  }
}

function updateSkipLevelOfDetail(model, frameState) {
  const skipLevelOfDetail = model.hasSkipLevelOfDetail(frameState);
  if (skipLevelOfDetail !== model._skipLevelOfDetail) {
    model.resetDrawCommands();
    model._skipLevelOfDetail = skipLevelOfDetail;
  }
}

function updateClippingPlanes(model, frameState) {
  // Update the clipping planes collection / state for this model to detect any changes.
  let currentClippingPlanesState = 0;
  if (model.isClippingEnabled()) {
    if (model._clippingPlanes.owner === model) {
      model._clippingPlanes.update(frameState);
    }
    currentClippingPlanesState = model._clippingPlanes.clippingPlanesState;
  }

  if (currentClippingPlanesState !== model._clippingPlanesState) {
    model.resetDrawCommands();
    model._clippingPlanesState = currentClippingPlanesState;
  }
}

function updateClippingPolygons(model, frameState) {
  // Update the clipping polygon collection / state for this model to detect any changes.
  let currentClippingPolygonsState = 0;
  if (model.isClippingPolygonsEnabled()) {
    if (model._clippingPolygons.owner === model) {
      model._clippingPolygons.update(frameState);
      model._clippingPolygons.queueCommands(frameState);
    }
    currentClippingPolygonsState =
      model._clippingPolygons.clippingPolygonsState;
  }

  if (currentClippingPolygonsState !== model._clippingPolygonsState) {
    model.resetDrawCommands();
    model._clippingPolygonsState = currentClippingPolygonsState;
  }
}

function updateSceneMode(model, frameState) {
  if (frameState.mode !== model._sceneMode) {
    if (model._projectTo2D) {
      model.resetDrawCommands();
    } else {
      model._updateModelMatrix = true;
    }
    model._sceneMode = frameState.mode;
  }
}

function updateFog(model, frameState) {
  const fogRenderable = frameState.fog.enabled && frameState.fog.renderable;
  if (fogRenderable !== model._fogRenderable) {
    model.resetDrawCommands();
    model._fogRenderable = fogRenderable;
  }
}

function updateVerticalExaggeration(model, frameState) {
  if (model.enableVerticalExaggeration) {
    const verticalExaggerationNeeded = frameState.verticalExaggeration !== 1.0;
    if (model.hasVerticalExaggeration !== verticalExaggerationNeeded) {
      model.resetDrawCommands();
      model._hasVerticalExaggeration = verticalExaggerationNeeded;
    }
  } else if (model.hasVerticalExaggeration) {
    model.resetDrawCommands(); //if verticalExaggeration was on, reset.
    model._hasVerticalExaggeration = false;
  }
}

function buildDrawCommands(model, frameState) {
  if (!model._drawCommandsBuilt) {
    model.destroyPipelineResources();
    model._sceneGraph.buildDrawCommands(frameState);
    model._drawCommandsBuilt = true;
  }
}

function updateModelMatrix(model, frameState) {
  // This is done without a dirty flag so that the model matrix can be updated in-place
  // without needing to use a setter.
  if (!Matrix4.equals(model.modelMatrix, model._modelMatrix)) {
    //>>includeStart('debug', pragmas.debug);
    if (frameState.mode !== SceneMode.SCENE3D && model._projectTo2D) {
      throw new DeveloperError(
        "Model.modelMatrix cannot be changed in 2D or Columbus View if projectTo2D is true.",
      );
    }
    //>>includeEnd('debug');
    model._updateModelMatrix = true;
    model._modelMatrix = Matrix4.clone(model.modelMatrix, model._modelMatrix);
  }
}

const scratchPosition = new Cartesian3();
const scratchCartographic = new Cartographic();

function updateClamping(model) {
  if (
    !model._updateModelMatrix &&
    !model._heightDirty &&
    model._minimumPixelSize === 0.0
  ) {
    return;
  }

  if (defined(model._removeUpdateHeightCallback)) {
    model._removeUpdateHeightCallback();
    model._removeUpdateHeightCallback = undefined;
  }

  const scene = model._scene;
  if (!defined(scene) || model.heightReference === HeightReference.NONE) {
    //>>includeStart('debug', pragmas.debug);
    if (model.heightReference !== HeightReference.NONE) {
      throw new DeveloperError(
        "Height reference is not supported without a scene.",
      );
    }
    //>>includeEnd('debug');
    model._clampedModelMatrix = undefined;
    return;
  }

  const ellipsoid = defaultValue(scene.ellipsoid, Ellipsoid.default);

  // Compute cartographic position so we don't recompute every update
  const modelMatrix = model.modelMatrix;
  scratchPosition.x = modelMatrix[12];
  scratchPosition.y = modelMatrix[13];
  scratchPosition.z = modelMatrix[14];
  const cartoPosition = ellipsoid.cartesianToCartographic(scratchPosition);

  if (!defined(model._clampedModelMatrix)) {
    model._clampedModelMatrix = Matrix4.clone(modelMatrix, new Matrix4());
  }

  // Install callback to handle updating of terrain tiles
  model._removeUpdateHeightCallback = scene.updateHeight(
    cartoPosition,
    getUpdateHeightCallback(model, ellipsoid, cartoPosition),
    model.heightReference,
  );

  // Set the correct height now
  const height = scene.getHeight(cartoPosition, model.heightReference);
  if (defined(height)) {
    // Get callback with cartoPosition being the non-clamped position
    const callback = getUpdateHeightCallback(model, ellipsoid, cartoPosition);

    // Compute the clamped cartesian and call updateHeight callback
    Cartographic.clone(cartoPosition, scratchCartographic);
    scratchCartographic.height = height;
    callback(scratchCartographic);
  }

  model._heightDirty = false;
  model._updateModelMatrix = true;
}

function updateBoundingSphereAndScale(model, frameState) {
  if (!model._updateModelMatrix && model._minimumPixelSize === 0.0) {
    return;
  }

  const modelMatrix = defined(model._clampedModelMatrix)
    ? model._clampedModelMatrix
    : model.modelMatrix;

  updateBoundingSphere(model, modelMatrix);
  updateComputedScale(model, modelMatrix, frameState);
}

function updateBoundingSphere(model, modelMatrix) {
  model._clampedScale = defined(model._maximumScale)
    ? Math.min(model._scale, model._maximumScale)
    : model._scale;

  model._boundingSphere.center = Cartesian3.multiplyByScalar(
    model._sceneGraph.boundingSphere.center,
    model._clampedScale,
    model._boundingSphere.center,
  );
  model._boundingSphere.radius = model._initialRadius * model._clampedScale;

  model._boundingSphere = BoundingSphere.transform(
    model._boundingSphere,
    modelMatrix,
    model._boundingSphere,
  );
}

function updateComputedScale(model, modelMatrix, frameState) {
  let scale = model.scale;

  if (model.minimumPixelSize !== 0.0 && !model._projectTo2D) {
    // Compute size of bounding sphere in pixels
    const context = frameState.context;
    const maxPixelSize = Math.max(
      context.drawingBufferWidth,
      context.drawingBufferHeight,
    );

    Matrix4.getTranslation(modelMatrix, scratchPosition);

    if (model._sceneMode !== SceneMode.SCENE3D) {
      SceneTransforms.computeActualEllipsoidPosition(
        frameState,
        scratchPosition,
        scratchPosition,
      );
    }

    const radius = model._boundingSphere.radius;
    const metersPerPixel = scaleInPixels(scratchPosition, radius, frameState);

    // metersPerPixel is always > 0.0
    const pixelsPerMeter = 1.0 / metersPerPixel;
    const diameterInPixels = Math.min(
      pixelsPerMeter * (2.0 * radius),
      maxPixelSize,
    );

    // Maintain model's minimum pixel size
    if (diameterInPixels < model.minimumPixelSize) {
      scale =
        (model.minimumPixelSize * metersPerPixel) /
        (2.0 * model._initialRadius);
    }
  }

  model._computedScale = defined(model.maximumScale)
    ? Math.min(model.maximumScale, scale)
    : scale;
}

function updatePickIds(model) {
  if (!model._idDirty) {
    return;
  }
  model._idDirty = false;

  const id = model._id;
  const pickIds = model._pickIds;
  const length = pickIds.length;
  for (let i = 0; i < length; ++i) {
    pickIds[i].object.id = id;
  }
}

// Matrix3 is a row-major constructor.
// The same constructor in GLSL will produce the transpose of this.
const yUpToZUp = new Matrix3(1, 0, 0, 0, 0, 1, 0, -1, 0);

function updateReferenceMatrices(model, frameState) {
  const modelMatrix = defined(model._clampedModelMatrix)
    ? model._clampedModelMatrix
    : model.modelMatrix;
  const referenceMatrix = defaultValue(model.referenceMatrix, modelMatrix);
  const context = frameState.context;

  const ibl = model._imageBasedLighting;
  if (ibl.useSphericalHarmonicCoefficients || ibl.useSpecularEnvironmentMaps) {
    let iblReferenceFrameMatrix3 = scratchIBLReferenceFrameMatrix3;
    let iblReferenceFrameMatrix4 = scratchIBLReferenceFrameMatrix4;

    iblReferenceFrameMatrix4 = Matrix4.multiply(
      context.uniformState.view3D,
      referenceMatrix,
      iblReferenceFrameMatrix4,
    );
    iblReferenceFrameMatrix3 = Matrix4.getRotation(
      iblReferenceFrameMatrix4,
      iblReferenceFrameMatrix3,
    );
    iblReferenceFrameMatrix3 = Matrix3.transpose(
      iblReferenceFrameMatrix3,
      iblReferenceFrameMatrix3,
    );
    model._iblReferenceFrameMatrix = Matrix3.multiply(
      yUpToZUp,
      iblReferenceFrameMatrix3,
      model._iblReferenceFrameMatrix,
    );
  }

  if (model.isClippingEnabled()) {
    let clippingPlanesMatrix = scratchClippingPlanesMatrix;
    clippingPlanesMatrix = Matrix4.multiply(
      context.uniformState.view3D,
      referenceMatrix,
      clippingPlanesMatrix,
    );
    clippingPlanesMatrix = Matrix4.multiply(
      clippingPlanesMatrix,
      model._clippingPlanes.modelMatrix,
      clippingPlanesMatrix,
    );
    model._clippingPlanesMatrix = Matrix4.inverseTranspose(
      clippingPlanesMatrix,
      model._clippingPlanesMatrix,
    );
  }
}

function updateSceneGraph(model, frameState) {
  const sceneGraph = model._sceneGraph;
  if (model._updateModelMatrix || model._minimumPixelSize !== 0.0) {
    const modelMatrix = defined(model._clampedModelMatrix)
      ? model._clampedModelMatrix
      : model.modelMatrix;
    sceneGraph.updateModelMatrix(modelMatrix, frameState);
    model._updateModelMatrix = false;
  }

  if (model._backFaceCullingDirty) {
    sceneGraph.updateBackFaceCulling(model._backFaceCulling);
    model._backFaceCullingDirty = false;
  }

  if (model._shadowsDirty) {
    sceneGraph.updateShadows(model._shadows);
    model._shadowsDirty = false;
  }

  if (model._debugShowBoundingVolumeDirty) {
    sceneGraph.updateShowBoundingVolume(model._debugShowBoundingVolume);
    model._debugShowBoundingVolumeDirty = false;
  }

  let updateForAnimations = false;
  // Animations are disabled for classification models.
  if (!defined(model.classificationType)) {
    updateForAnimations =
      model._userAnimationDirty || model._activeAnimations.update(frameState);
  }
  sceneGraph.update(frameState, updateForAnimations);
  model._userAnimationDirty = false;
}

function updateShowCreditsOnScreen(model) {
  if (!model._showCreditsOnScreenDirty) {
    return;
  }
  model._showCreditsOnScreenDirty = false;
  model._credits.length = 0;

  const showOnScreen = model._showCreditsOnScreen;
  if (defined(model._credit)) {
    const credit = Credit.clone(model._credit);
    credit.showOnScreen = credit.showOnScreen || showOnScreen;
    model._credits.push(credit);
  }

  const resourceCredits = model._resourceCredits;
  const resourceCreditsLength = resourceCredits.length;
  for (let i = 0; i < resourceCreditsLength; i++) {
    const credit = Credit.clone(resourceCredits[i]);
    credit.showOnScreen = credit.showOnScreen || showOnScreen;
    model._credits.push(credit);
  }

  const gltfCredits = model._gltfCredits;
  const gltfCreditsLength = gltfCredits.length;
  for (let i = 0; i < gltfCreditsLength; i++) {
    const credit = Credit.clone(gltfCredits[i]);
    credit.showOnScreen = credit.showOnScreen || showOnScreen;
    model._credits.push(credit);
  }
}

function submitDrawCommands(model, frameState) {
  // Check that show is true after draw commands are built;
  // we want the user to be able to instantly see the model
  // when show is set to true.

  const displayConditionPassed = passesDistanceDisplayCondition(
    model,
    frameState,
  );

  const invisible = model.isInvisible();
  const silhouette = model.hasSilhouette(frameState);

  // If the model is invisible but has a silhouette, it still
  // needs to draw in order to write to the stencil buffer and
  // render the silhouette.
  const showModel =
    model._show &&
    model._computedScale !== 0 &&
    displayConditionPassed &&
    (!invisible || silhouette);

  const passes = frameState.passes;
  const submitCommandsForPass =
    passes.render || (passes.pick && model.allowPicking);

  if (showModel && !model._ignoreCommands && submitCommandsForPass) {
    addCreditsToCreditDisplay(model, frameState);
    model._sceneGraph.pushDrawCommands(frameState);
  }
}

const scratchBoundingSphere = new BoundingSphere();

function scaleInPixels(positionWC, radius, frameState) {
  scratchBoundingSphere.center = positionWC;
  scratchBoundingSphere.radius = radius;
  return frameState.camera.getPixelSize(
    scratchBoundingSphere,
    frameState.context.drawingBufferWidth,
    frameState.context.drawingBufferHeight,
  );
}

const scratchUpdateHeightCartesian = new Cartesian3();
function getUpdateHeightCallback(model, ellipsoid, originalPostition) {
  return function (clampedPosition) {
    if (isHeightReferenceRelative(model.heightReference)) {
      clampedPosition.height += originalPostition.height;
    }

    ellipsoid.cartographicToCartesian(
      clampedPosition,
      scratchUpdateHeightCartesian,
    );

    const clampedModelMatrix = model._clampedModelMatrix;

    // Modify clamped model matrix to use new height
    Matrix4.clone(model.modelMatrix, clampedModelMatrix);
    clampedModelMatrix[12] = scratchUpdateHeightCartesian.x;
    clampedModelMatrix[13] = scratchUpdateHeightCartesian.y;
    clampedModelMatrix[14] = scratchUpdateHeightCartesian.z;

    model._heightDirty = true;
  };
}

const scratchDisplayConditionCartesian = new Cartesian3();

function passesDistanceDisplayCondition(model, frameState) {
  const condition = model.distanceDisplayCondition;
  if (!defined(condition)) {
    return true;
  }

  const nearSquared = condition.near * condition.near;
  const farSquared = condition.far * condition.far;
  let distanceSquared;

  if (frameState.mode === SceneMode.SCENE2D) {
    const frustum2DWidth =
      frameState.camera.frustum.right - frameState.camera.frustum.left;
    const distance = frustum2DWidth * 0.5;
    distanceSquared = distance * distance;
  } else {
    // Distance to center of primitive's reference frame
    const position = Matrix4.getTranslation(
      model.modelMatrix,
      scratchDisplayConditionCartesian,
    );

    // This will project the position if the scene is in Columbus View,
    // but leave the position as-is in 3D mode.
    SceneTransforms.computeActualEllipsoidPosition(
      frameState,
      position,
      position,
    );

    distanceSquared = Cartesian3.distanceSquared(
      position,
      frameState.camera.positionWC,
    );
  }

  return distanceSquared >= nearSquared && distanceSquared <= farSquared;
}

function addCreditsToCreditDisplay(model, frameState) {
  const creditDisplay = frameState.creditDisplay;
  const credits = model._credits;
  const creditsLength = credits.length;
  for (let c = 0; c < creditsLength; c++) {
    creditDisplay.addCreditToNextFrame(credits[c]);
  }
}

/**
 * 获取是否模型根据其指定的模型颜色是半透明的。
 * 如果模型颜色的 alpha 等于零，则认为它是不可见的。
 * 不透明。
 *
 * @returns {boolean} 如果模型是半透明的，则为<code> true</code>，否则为<code> false</code>。
 * @private
 */
Model.prototype.isTranslucent = function () {
  const color = this.color;
  return defined(color) && color.alpha > 0.0 && color.alpha < 1.0;
};

/**
 * 获取是否模型不可见，即如果模型颜色的 alpha
 * 等于零。
 *
 * @returns {boolean} 如果模型不可见，则为<code> true</code>，否则为<code> false</code>。
 * @private
 */
Model.prototype.isInvisible = function () {
  const color = this.color;
  return defined(color) && color.alpha === 0.0;
};

function supportsSilhouettes(frameState) {
  return frameState.context.stencilBuffer;
}

/**
 * 获取是否模型有一个剪影。这解释了
 * 支持剪影（即上下文支持模板缓冲区）。
 * <p>
 * 如果模型对另一个模型进行分类，则其轮廓将被禁用。
 * </p>
 *
 * @param {FrameState} The frame 状态。
 * @returns {boolean} 如果模型具有轮廓，则为<code> true</code>，否则为 <code> false</code>。
 * @private
 */
Model.prototype.hasSilhouette = function (frameState) {
  return (
    supportsSilhouettes(frameState) &&
    this._silhouetteSize > 0.0 &&
    this._silhouetteColor.alpha > 0.0 &&
    !defined(this._classificationType)
  );
};

/**
 * 获取模型是否是使用
 * skipLevelOfDetail 优化。这说明了 skipLevelOfDetail
 * （即上下文支持模板缓冲区） 。
 *
 * @param {FrameState} frameState 帧状态。
 * @returns {boolean} 如果模型是使用 skipLevelOfDetail 优化的 tileset 的一部分，则为<code> true</code>，否则为<code> false</code>。
 * @private
 */
Model.prototype.hasSkipLevelOfDetail = function (frameState) {
  if (!ModelType.is3DTiles(this.type)) {
    return false;
  }

  const supportsSkipLevelOfDetail = frameState.context.stencilBuffer;
  const tileset = this._content.tileset;
  return supportsSkipLevelOfDetail && tileset.isSkippingLevelOfDetail;
};

/**
 * 获取是否为此模型启用了剪切平面。
 *
 * @returns {boolean} 如果为此模型启用了剪切平面，则为 <code>true</code>，则为 <code>false</code>。
 * @private
 */
Model.prototype.isClippingEnabled = function () {
  const clippingPlanes = this._clippingPlanes;
  return (
    defined(clippingPlanes) &&
    clippingPlanes.enabled &&
    clippingPlanes.length !== 0
  );
};

/**
 * 查找光线与渲染的模型表面之间的交点。射线必须以世界坐标给出。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {FrameState} frameState 帧状态。
 * @param {number} [verticalExaggeration=1.0] 用于夸大位置相对于椭球体的高度的标量。如果值为 1.0，则不会产生任何影响。
 * @param {number} [relativeHeight=0.0] 椭球体上方的高度，相对于该高度，位置被夸大。如果值为 0.0，则位置将相对于椭球体表面进行放大。
 * @param {Cartesian3|undefined} [result] 交集或 <code>undefined</code>，如果未找到。
 * @returns {Cartesian3|undefined} 交集或 <code>undefined</code>（如果未找到）。
 *
 * @private
 */
Model.prototype.pick = function (
  ray,
  frameState,
  verticalExaggeration,
  relativeHeight,
  result,
) {
  return pickModel(
    this,
    ray,
    frameState,
    verticalExaggeration,
    relativeHeight,
    result,
  );
};

/**
 * 获取是否为此模型启用了剪切多边形。
 *
 * @returns {boolean} 如果为此模型启用了剪切多边形，则为 <code>true</code>，则为 <code>false</code>。
 * @private
 */
Model.prototype.isClippingPolygonsEnabled = function () {
  const clippingPolygons = this._clippingPolygons;
  return (
    defined(clippingPolygons) &&
    clippingPolygons.enabled &&
    clippingPolygons.length !== 0
  );
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>* isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁 则为 <code>true</code>，则为 <code>false</code>。
 *
 * @see Model#destroy
 */
Model.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code> isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * model = model && model.destroy();
 *
 * @see Model#isDestroyed
 */
Model.prototype.destroy = function () {
  const loader = this._loader;
  if (defined(loader)) {
    loader.destroy();
  }

  const featureTables = this._featureTables;
  if (defined(featureTables)) {
    const length = featureTables.length;
    for (let i = 0; i < length; i++) {
      featureTables[i].destroy();
    }
  }

  this.destroyPipelineResources();
  this.destroyModelResources();

  // Remove callbacks for height reference behavior.
  if (defined(this._removeUpdateHeightCallback)) {
    this._removeUpdateHeightCallback();
    this._removeUpdateHeightCallback = undefined;
  }

  if (defined(this._terrainProviderChangedCallback)) {
    this._terrainProviderChangedCallback();
    this._terrainProviderChangedCallback = undefined;
  }

  // Only destroy the ClippingPlaneCollection if this is the owner.
  const clippingPlaneCollection = this._clippingPlanes;
  if (
    defined(clippingPlaneCollection) &&
    !clippingPlaneCollection.isDestroyed() &&
    clippingPlaneCollection.owner === this
  ) {
    clippingPlaneCollection.destroy();
  }
  this._clippingPlanes = undefined;

  // Only destroy the ClippingPolygonCollection if this is the owner.
  const clippingPolygonCollection = this._clippingPolygons;
  if (
    defined(clippingPolygonCollection) &&
    !clippingPolygonCollection.isDestroyed() &&
    clippingPolygonCollection.owner === this
  ) {
    clippingPolygonCollection.destroy();
  }
  this._clippingPolygons = undefined;

  // Only destroy the ImageBasedLighting if this is the owner.
  if (
    this._shouldDestroyImageBasedLighting &&
    !this._imageBasedLighting.isDestroyed()
  ) {
    this._imageBasedLighting.destroy();
  }
  this._imageBasedLighting = undefined;

  destroyObject(this);
};

/**
 * 销毁 pipeline 阶段生成的资源
 * 在重新构建 draw 命令时必须销毁。
 * @private
 */
Model.prototype.destroyPipelineResources = function () {
  const resources = this._pipelineResources;
  for (let i = 0; i < resources.length; i++) {
    resources[i].destroy();
  }
  this._pipelineResources.length = 0;
  this._pickIds.length = 0;
};

/**
 * 销毁 pipeline 阶段生成的资源
 * 在模型的生命周期内存在。
 * @private
 */
Model.prototype.destroyModelResources = function () {
  const resources = this._modelResources;
  for (let i = 0; i < resources.length; i++) {
    resources[i].destroy();
  }
  this._modelResources.length = 0;
};

/**
 * <p>
 * 从 glTF 资产异步创建模型。此函数返回一个 promise，该 promise 在模型准备好渲染时进行解析，即当外部二进制文件 image 和
 * 并下载着色器文件并创建 WebGL 资源。
 * </p>
 * <p>
 * 模型可以是扩展名为 .gltf 的传统 glTF 资产，也可以是扩展名为 .glb 的二进制 glTF。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {string|Resource} options.url .gltf 或 .glb 文件的 URL。
 * @param {string|Resource} [options.basePath=''] glTF JSON 中路径相对于的基本路径。
 * @param {boolean} [options.show=true] 是否渲染模型。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将模型从模型转换为世界坐标的 4x4 变换矩阵。
 * @param {number} [options.scale=1.0] 应用于此模型的统一比例。
 * @param {boolean} [options.enableVerticalExaggeration=true] 如果<code>为 true</code>，则当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型将沿椭球法线放大。
 * @param {number} [options.minimumPixelSize=0.0] 无论缩放如何，模型的近似最小像素大小。
 * @param {number} [options.maximumScale] 模型的最大缩放大小。minimumPixelSize 的上限。
 * @param {object} [options.id] 使用 {@link Scene#pick} 选取模型时要返回的用户定义对象。
 * @param {boolean} [options.allowPicking=true] 如果为 <code>true</code>，则每个基元都可以使用 {@link Scene#pick} 进行拾取。
 * @param {boolean} [options.incrementallyLoadTextures=true] 确定纹理在模型加载后是否可以继续流入。
 * @param {boolean} [options.asynchronous=true] 确定模型 WebGL 资源的创建是否将分散在多个帧或块上，直到加载所有 glTF 文件后完成。
 * @param {boolean} [options.clampAnimations=true] 确定模型的动画是否应在未指定关键帧的帧上保持姿势。
 * @param {ShadowMode} [options.shadows=ShadowMode.ENABLED] 确定模型是投射还是接收来自光源的阴影。
 * @param {boolean} [options.releaseGltfJson=false] 如果为 true，则加载 glTF 后将释放 glTF JSON。这对于 3D 瓦片等情况特别有用，其中每个 .gltf 模型都是唯一的，并且缓存 glTF JSON 无效。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。为模型中的每个绘制命令绘制边界球体。
 * @param {boolean} [options.enableDebugWireframe=false] 仅用于调试。必须将其设置为 true，才能使 debugWireframe 在 WebGL1 中工作。在模型加载后无法设置此项。
 * @param {boolean} [options.debugWireframe=false] 仅用于调试。在线框中绘制模型。仅当 enableDebugWireframe 设置为 true 时，才适用于 WebGL1。
 * @param {boolean} [options.cull=true] 是否使用视锥体/水平面剔除来剔除模型。如果模型是 3D 瓦片图块集的一部分，则此属性将始终为 false，因为使用的是 3D 瓦片剔除系统。
 * @param {boolean} [options.opaquePass=Pass.OPAQUE] 在 {@link DrawCommand} 中用于模型的不透明部分的通道。
 * @param {Axis} [options.upAxis=Axis.Y] glTF 模型的上轴。
 * @param {Axis} [options.forwardAxis=Axis.Z] glTF 模型的正向轴。
 * @param {CustomShader} [options.customShader] 自定义着色器。这会将用户定义的 GLSL 代码添加到顶点和片段着色器中。使用带有 {@link Cesium3DTileStyle} 的自定义着色器可能会导致未定义的行为。
 * @param {Cesium3DTileContent} [options.content] 此模型所属的瓦片内容。如果 model 未作为图块集的一部分加载，则此属性将未定义。
 * @param {HeightReference} [options.heightReference=HeightReference.NONE] 确定如何相对于地形绘制模型。
 * @param {Scene} [options.scene] 对于使用 height 引用属性的模型，必须传入。
 * @param {DistanceDisplayCondition} [options.distanceDisplayCondition] 指定在距摄像机多远处显示此模型的条件。
 * @param {Color} [options.color] 与模型的渲染颜色混合的颜色。
 * @param {ColorBlendMode} [options.colorBlendMode=ColorBlendMode.HIGHLIGHT] 定义颜色如何与模型混合。
 * @param {number} [options.colorBlendAmount=0.5] 当 <code>colorBlendMode</code> 为 <code>MIX</code> 时，用于确定颜色强度的值。值为 0.0 时，将产生模型的渲染颜色，而值为 1.0 时，将产生纯色，介于两者之间的任何值都会导致两者混合。
 * @param {Color} [options.silhouetteColor=Color.RED] 剪影颜色。如果启用了轮廓的模型超过 256 个，则重叠模型很可能会产生轻微的伪影。
 * @param {number} [options.silhouetteSize=0.0] 剪影的大小（以像素为单位）。
 * @param {boolean} [options.enableShowOutline=true] 是否为使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。可以将其设置为 false 以避免在加载时对几何体进行后处理。如果为 false，则忽略 showOutlines 和 outlineColor 选项。
 * @param {boolean} [options.showOutline=true] 是否显示使用 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。如果为 true，则显示轮廓。如果为 false，则不显示轮廓。
 * @param {Color} [options.outlineColor=Color.BLACK] 渲染轮廓时使用的颜色。
 * @param {ClippingPlaneCollection} [options.clippingPlanes] 用于选择性地禁用模型渲染的 {@link ClippingPlaneCollection}。
 * @param {ClippingPolygonCollection} [options.clippingPolygons] 用于选择性地禁用模型渲染的 {@link ClippingPolygonCollection}。
 * @param {Cartesian3} [options.lightColor] 对模型进行着色时的浅色。<code>如果未定义</code>，则使用场景的 light 颜色。
 * @param {ImageBasedLighting} [options.imageBasedLighting] 用于管理此模型上基于图像的照明的属性。
 * @param {boolean} [options.backFaceCulling=true] 是否剔除背面的几何体。如果为 true，则背面剔除由材质的 doubleSided 属性确定;如果为 false，则禁用背面剔除。如果模型的颜色是半透明的，则不会剔除背面。
 * @param {Credit|string} [options.credit] 数据源的积分，显示在画布上。
 * @param {boolean} [options.showCreditsOnScreen=false] 是否在屏幕上显示该模型的制作人员名单。
 * @param {SplitDirection} [options.splitDirection=SplitDirection.NONE] 要应用于此模型的 {@link SplitDirection} 拆分。
 * @param {boolean} [options.projectTo2D=false] 是否在 2D 中准确投影模型的位置。如果这是真的，模型将精确投影到 2D，但它会使用更多的内存来执行此操作。如果为 false，则模型将使用更少的内存，并且仍将以 2D/CV 模式渲染，但其位置可能不准确。这将禁用 minimumPixelSize 并防止将来对模型矩阵进行修改。在模型加载后也无法设置此项。
 * @param {boolean} [options.enablePick=false] 当不使用 WebGL 2 或更高版本时，是否允许使用 CPU 选择和<code>选择</code>。如果使用 WebGL 2 或更高版本，则此选项将被忽略。如果使用 WebGL 1 并且这是真的，<code>则 pick</code> 操作将正常工作，但它会使用更多内存来执行此操作。如果使用 WebGL 1 运行并且为 false，则模型将使用更少的内存，但 <code>pick</code> 将始终返回 <code>undefined</code>。在模型加载后无法设置此项。
 * @param {string|number} [options.featureIdLabel=“featureId_0”] 用于选取和样式的特征 ID 集的标签。对于 EXT_mesh_features，这是特征 ID 的 label 属性，如果未指定，则为 “featureId_N”（其中 N 是 featureIds 数组中的索引）。EXT_feature_metadata没有标注字段，因此此类要素 ID 集始终标记为“featureId_N”，其中 N 是所有要素 ID 列表中的索引，其中要素 ID 属性列在要素 ID 纹理之前。如果 featureIdLabel 是整数 N，则会自动转换为字符串 featureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @param {string|number} [options.instanceFeatureIdLabel=“instanceFeatureId_0”] 用于选取和样式的实例特征 ID 集的标签。如果 instanceFeatureIdLabel 设置为整数 N，则会自动转换为字符串 instanceFeatureId_N。如果每个基元和每个实例的特征 ID 都存在，则实例特征 ID 优先。
 * @param {object} [options.pointCloudShading] 用于构建 {@link PointCloudShading} 对象以控制点衰减和照明的选项。
 * @param {ClassificationType} [options.classificationType] 确定此模型是否对地形、3D 瓦片或两者进行分类。在模型加载后无法设置此项。
 * @param {Model.GltfCallback} [options.gltfCallback] 加载后与加载的 gltf 对象一起调用的函数。
 *
 * @returns {Promise<Model>} 当创建的模型准备好渲染时，解析为创建的模型。
 *
 * @exception {RuntimeError} The model failed to load.
 * @exception {RuntimeError} Unsupported glTF version.
 * @exception {RuntimeError} Unsupported glTF Extension
 *
 * @example
 * // Load a model and add it to the scene
 * try {
 *  const model = await Cesium.Model.fromGltfAsync({
 *    url: "../../SampleData/models/CesiumMan/Cesium_Man.glb"
 *  });
 *  viewer.scene.primitives.add(model);
 * } catch (error) {
 *  console.log(`Failed to load model. ${error}`);
 * }
 *
 * @example
 * // Position a model with modelMatrix and display it with a minimum size of 128 pixels
 * const position = Cesium.Cartesian3.fromDegrees(
 *   -123.0744619,
 *   44.0503706,
 *   5000.0
 * );
 * const headingPositionRoll = new Cesium.HeadingPitchRoll();
 * const fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator(
 *   "north",
 *   "west"
 * );
 * try {
 *  const model = await Cesium.Model.fromGltfAsync({
 *    url: "../../SampleData/models/CesiumAir/Cesium_Air.glb",
 *    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
 *      position,
 *      headingPositionRoll,
 *      Cesium.Ellipsoid.WGS84,
 *      fixedFrameTransform
 *    ),
 *    minimumPixelSize: 128,
 *  });
 *  viewer.scene.primitives.add(model);
 * } catch (error) {
 *  console.log(`Failed to load model. ${error}`);
 * }
 *
 * @example
 * // Load a model and play the last animation at half speed
 * let animations;
 * try {
 *  const model = await Cesium.Model.fromGltfAsync({
 *    url: "../../SampleData/models/CesiumMan/Cesium_Man.glb",
 *    gltfCallback: gltf => {
 *      animations = gltf.animations
 *    }
 *  });
 *  viewer.scene.primitives.add(model);
 *  model.readyEvent.addEventListener(() => {
 *    model.activeAnimations.add({
 *      index: animations.length - 1,
 *      loop: Cesium.ModelAnimationLoop.REPEAT,
 *      multiplier: 0.5,
 *    });
 *  });
 * } catch (error) {
 *  console.log(`Failed to load model. ${error}`);
 * }
 */
Model.fromGltfAsync = async function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.url) && !defined(options.gltf)) {
    throw new DeveloperError("options.url is required.");
  }
  //>>includeEnd('debug');

  // options.gltf is used internally for 3D Tiles. It can be a Resource, a URL
  // to a glTF/glb file, a binary glTF buffer, or a JSON object containing the
  // glTF contents.
  const gltf = defaultValue(options.url, options.gltf);

  const loaderOptions = {
    releaseGltfJson: options.releaseGltfJson,
    asynchronous: options.asynchronous,
    incrementallyLoadTextures: options.incrementallyLoadTextures,
    upAxis: options.upAxis,
    forwardAxis: options.forwardAxis,
    loadAttributesFor2D: options.projectTo2D,
    enablePick: options.enablePick,
    loadIndicesForWireframe: options.enableDebugWireframe,
    loadPrimitiveOutline: options.enableShowOutline,
    loadForClassification: defined(options.classificationType),
  };

  const basePath = defaultValue(options.basePath, "");
  const baseResource = Resource.createIfNeeded(basePath);

  if (defined(gltf.asset)) {
    loaderOptions.gltfJson = gltf;
    loaderOptions.baseResource = baseResource;
    loaderOptions.gltfResource = baseResource;
  } else if (gltf instanceof Uint8Array) {
    loaderOptions.typedArray = gltf;
    loaderOptions.baseResource = baseResource;
    loaderOptions.gltfResource = baseResource;
  } else {
    loaderOptions.gltfResource = Resource.createIfNeeded(gltf);
  }

  const loader = new GltfLoader(loaderOptions);

  const is3DTiles = defined(options.content);
  const type = is3DTiles ? ModelType.TILE_GLTF : ModelType.GLTF;

  const resource = loaderOptions.gltfResource;

  const modelOptions = makeModelOptions(loader, type, options);
  modelOptions.resource = resource;

  try {
    // This load the gltf JSON and ensures the gltf is valid
    // Further resource loading is handled synchronously in loader.process(), and requires
    // hooking into model's update() as the frameState is needed
    await loader.load();
  } catch (error) {
    loader.destroy();
    throw ModelUtility.getError("model", resource, error);
  }

  const gltfCallback = options.gltfCallback;
  if (defined(gltfCallback)) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.func("options.gltfCallback", gltfCallback);
    //>>includeEnd('debug');

    gltfCallback(loader.gltfJson);
  }

  const model = new Model(modelOptions);

  const resourceCredits = model._resource.credits;
  if (defined(resourceCredits)) {
    const length = resourceCredits.length;
    for (let i = 0; i < length; i++) {
      model._resourceCredits.push(Credit.clone(resourceCredits[i]));
    }
  }

  return model;
};

/*
 * @private
 */
Model.fromB3dm = async function (options) {
  const loaderOptions = {
    b3dmResource: options.resource,
    arrayBuffer: options.arrayBuffer,
    byteOffset: options.byteOffset,
    releaseGltfJson: options.releaseGltfJson,
    asynchronous: options.asynchronous,
    incrementallyLoadTextures: options.incrementallyLoadTextures,
    upAxis: options.upAxis,
    forwardAxis: options.forwardAxis,
    loadAttributesFor2D: options.projectTo2D,
    enablePick: options.enablePick,
    loadIndicesForWireframe: options.enableDebugWireframe,
    loadPrimitiveOutline: options.enableShowOutline,
    loadForClassification: defined(options.classificationType),
  };

  const loader = new B3dmLoader(loaderOptions);

  try {
    await loader.load();

    const modelOptions = makeModelOptions(loader, ModelType.TILE_B3DM, options);
    const model = new Model(modelOptions);
    return model;
  } catch (error) {
    loader.destroy();
    throw error;
  }
};

/**
 * @private
 */
Model.fromPnts = async function (options) {
  const loaderOptions = {
    arrayBuffer: options.arrayBuffer,
    byteOffset: options.byteOffset,
    loadAttributesFor2D: options.projectTo2D,
  };
  const loader = new PntsLoader(loaderOptions);

  try {
    await loader.load();
    const modelOptions = makeModelOptions(loader, ModelType.TILE_PNTS, options);
    const model = new Model(modelOptions);
    return model;
  } catch (error) {
    loader.destroy();
    throw error;
  }
};

/*
 * @private
 */
Model.fromI3dm = async function (options) {
  const loaderOptions = {
    i3dmResource: options.resource,
    arrayBuffer: options.arrayBuffer,
    byteOffset: options.byteOffset,
    releaseGltfJson: options.releaseGltfJson,
    asynchronous: options.asynchronous,
    incrementallyLoadTextures: options.incrementallyLoadTextures,
    upAxis: options.upAxis,
    forwardAxis: options.forwardAxis,
    loadAttributesFor2D: options.projectTo2D,
    enablePick: options.enablePick,
    loadIndicesForWireframe: options.enableDebugWireframe,
    loadPrimitiveOutline: options.enableShowOutline,
  };
  const loader = new I3dmLoader(loaderOptions);

  try {
    await loader.load();

    const modelOptions = makeModelOptions(loader, ModelType.TILE_I3DM, options);
    const model = new Model(modelOptions);
    return model;
  } catch (error) {
    loader.destroy();
    throw error;
  }
};

/*
 * @private
 */
Model.fromGeoJson = async function (options) {
  const loaderOptions = {
    geoJson: options.geoJson,
  };
  const loader = new GeoJsonLoader(loaderOptions);
  const modelOptions = makeModelOptions(
    loader,
    ModelType.TILE_GEOJSON,
    options,
  );
  const model = new Model(modelOptions);
  return model;
};

const scratchColor = new Color();

/**
 * @private
 */
Model.prototype.applyColorAndShow = function (style) {
  const previousColor = Color.clone(this._color, scratchColor);
  const hasColorStyle = defined(style) && defined(style.color);
  const hasShowStyle = defined(style) && defined(style.show);

  this._color = hasColorStyle
    ? style.color.evaluateColor(undefined, this._color)
    : Color.clone(Color.WHITE, this._color);
  this._show = hasShowStyle ? style.show.evaluate(undefined) : true;

  if (isColorAlphaDirty(previousColor, this._color)) {
    this.resetDrawCommands();
  }
};

/**
 * @private
 */
Model.prototype.applyStyle = function (style) {
  const isPnts = this.type === ModelType.TILE_PNTS;

  const hasFeatureTable =
    defined(this.featureTableId) &&
    this.featureTables[this.featureTableId].featuresLength > 0;

  const propertyAttributes = defined(this.structuralMetadata)
    ? this.structuralMetadata.propertyAttributes
    : undefined;
  const hasPropertyAttributes =
    defined(propertyAttributes) && defined(propertyAttributes[0]);

  // Point clouds will be styled on the GPU unless they contain a batch table.
  // That is, CPU styling will not be applied if:
  // - points have no metadata at all, or
  // - points have metadata stored as a property attribute
  if (isPnts && (!hasFeatureTable || hasPropertyAttributes)) {
    // Commands are rebuilt for point cloud styling since the new style may
    // contain different shader functions.
    this.resetDrawCommands();
    return;
  }

  // The style is only set by the ModelFeatureTable. If there are no features,
  // the color and show from the style are directly applied.
  if (hasFeatureTable) {
    const featureTable = this.featureTables[this.featureTableId];
    featureTable.applyStyle(style);
    updateStyleCommandsNeeded(this, style);
  } else {
    this.applyColorAndShow(style);
    this._styleCommandsNeeded = undefined;
  }
};

function makeModelOptions(loader, modelType, options) {
  return {
    loader: loader,
    type: modelType,
    resource: options.resource,
    show: options.show,
    modelMatrix: options.modelMatrix,
    scale: options.scale,
    enableVerticalExaggeration: options.enableVerticalExaggeration,
    minimumPixelSize: options.minimumPixelSize,
    maximumScale: options.maximumScale,
    id: options.id,
    allowPicking: options.allowPicking,
    clampAnimations: options.clampAnimations,
    shadows: options.shadows,
    debugShowBoundingVolume: options.debugShowBoundingVolume,
    enableDebugWireframe: options.enableDebugWireframe,
    debugWireframe: options.debugWireframe,
    cull: options.cull,
    opaquePass: options.opaquePass,
    customShader: options.customShader,
    content: options.content,
    heightReference: options.heightReference,
    scene: options.scene,
    distanceDisplayCondition: options.distanceDisplayCondition,
    color: options.color,
    colorBlendAmount: options.colorBlendAmount,
    colorBlendMode: options.colorBlendMode,
    silhouetteColor: options.silhouetteColor,
    silhouetteSize: options.silhouetteSize,
    enableShowOutline: options.enableShowOutline,
    showOutline: options.showOutline,
    outlineColor: options.outlineColor,
    clippingPlanes: options.clippingPlanes,
    clippingPolygons: options.clippingPolygons,
    lightColor: options.lightColor,
    imageBasedLighting: options.imageBasedLighting,
    backFaceCulling: options.backFaceCulling,
    credit: options.credit,
    showCreditsOnScreen: options.showCreditsOnScreen,
    splitDirection: options.splitDirection,
    projectTo2D: options.projectTo2D,
    enablePick: options.enablePick,
    featureIdLabel: options.featureIdLabel,
    instanceFeatureIdLabel: options.instanceFeatureIdLabel,
    pointCloudShading: options.pointCloudShading,
    classificationType: options.classificationType,
    pickObject: options.pickObject,
  };
}

/**
 * 加载后使用加载的 gltf 对象调用的函数的接口。
 * @callback Model.GltfCallback
 *
 * @param {object} gltf gltf 对象
 */

export default Model;
