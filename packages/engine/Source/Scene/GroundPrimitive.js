import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";
import Rectangle from "../Core/Rectangle.js";
import VerticalExaggeration from "../Core/VerticalExaggeration.js";
import ClassificationPrimitive from "./ClassificationPrimitive.js";
import ClassificationType from "./ClassificationType.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import SceneMode from "./SceneMode.js";
import ShadowVolumeAppearance from "./ShadowVolumeAppearance.js";

const GroundPrimitiveUniformMap = {
  u_globeMinimumAltitude: function () {
    return 55000.0;
  },
};

/**
 * 地面基元表示覆盖在 {@link Scene} 中的地形或 3D 瓦片上的几何体。
 * <p>
 * 基元将几何体实例与描述完整着色的 {@link Appearance} 组合在一起，包括
 * {@link Material} 和 {@link RenderState} 的 RenderState} 中。 粗略地说，geometry 实例定义了结构和位置，
 * 和外观定义视觉特征。 解耦的几何图形和外观使我们能够混合
 * 并匹配其中的大多数，并彼此独立地添加新的几何图形或外观。
 * </p>
 * <p>
 * 要使用具有不同 PerInstanceColors 的 GeometryInstances，需要支持 WEBGL_depth_texture 扩展
 * 或除 PerInstanceColorAppearance 之外的材质。
 * </p>
 * <p>
 * Textured GroundPrimitives 是为概念模式设计的，而不是用于精确映射的
 * 纹理到地形 - 对于该用例，请使用 {@link SingleTileImageryProvider}。
 * </p>
 * <p>
 * 为了正确渲染，此功能需要 EXT_frag_depth WebGL 扩展。对于不支持此扩展的硬件，有
 * 将在某些视角下渲染伪影。
 * </p>
 * <p>
 * 有效的几何图形包括 {@link CircleGeometry}、{@link CorridorGeometry}、{@link EllipseGeometry}、{@link PolygonGeometry} 和 {@link RectangleGeometry}。
 * </p>
 *
 * @alias GroundPrimitive
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Array|GeometryInstance} [options.geometryInstances] 要渲染的几何体实例。
 * @param {Appearance} [options.appearance] 用于渲染基元的外观。当 GeometryInstances 具有 color 属性时，默认为平面 PerInstanceColorAppearance。
 * @param {boolean} [options.show=true] 决定是否显示此基元。
 * @param {boolean} [options.vertexCacheOptimize=false] 如果为 <code>true</code>，则几何体顶点将针对顶点着色器前和后着色器缓存进行优化。
 * @param {boolean} [options.interleave=false] 如果<code>为 true</code>，则几何顶点属性是交错的，这可以略微提高渲染性能，但会增加加载时间。
 * @param {boolean} [options.compressVertices=true] 如果为 <code>true</code>，则压缩几何顶点，这将节省内存。
 * @param {boolean} [options.releaseGeometryInstances=true] 如果为 <code>true</code>，则基元不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
 * @param {boolean} [options.allowPicking=true] 如果<code>为 true</code>，则每个几何体实例只能使用 {@link Scene#pick} 进行拾取。 如果<code>为 false</code>，则保存 GPU 内存。
 * @param {boolean} [options.asynchronous=true] 确定原语是异步创建还是阻塞直到准备就绪。如果为 false，则必须先调用 initializeTerrainHeights（）。
 * @param {ClassificationType} [options.classificationType=ClassificationType.BOTH] 确定是否对地形、3D 瓦片或两者进行分类。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示此基本体的命令的边界球体。
 * @param {boolean} [options.debugShowShadowVolume=false] 仅用于调试。确定是否绘制基本体中每个几何体的阴影体积。必须为 <code>true</code>
 * creation （要在释放几何体之前创建的卷） 或 options.releaseGeometryInstance 必须<code>为 false</code>。
 *
 * @example
 * // Example 1: Create primitive with a single instance
 * const rectangleInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(-140.0, 30.0, -100.0, 40.0)
 *   }),
 *   id : 'rectangle',
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
 *   }
 * });
 * scene.primitives.add(new Cesium.GroundPrimitive({
 *   geometryInstances : rectangleInstance
 * }));
 *
 * // Example 2: Batch instances
 * const color = new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5); // Both instances must have the same color.
 * const rectangleInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(-140.0, 30.0, -100.0, 40.0)
 *   }),
 *   id : 'rectangle',
 *   attributes : {
 *     color : color
 *   }
 * });
 * const ellipseInstance = new Cesium.GeometryInstance({
 *     geometry : new Cesium.EllipseGeometry({
 *         center : Cesium.Cartesian3.fromDegrees(-105.0, 40.0),
 *         semiMinorAxis : 300000.0,
 *         semiMajorAxis : 400000.0
 *     }),
 *     id : 'ellipse',
 *     attributes : {
 *         color : color
 *     }
 * });
 * scene.primitives.add(new Cesium.GroundPrimitive({
 *   geometryInstances : [rectangleInstance, ellipseInstance]
 * }));
 *
 * @see Primitive
 * @see ClassificationPrimitive
 * @see GeometryInstance
 * @see Appearance
 */
function GroundPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let appearance = options.appearance;
  const geometryInstances = options.geometryInstances;
  if (!defined(appearance) && defined(geometryInstances)) {
    const geometryInstancesArray = Array.isArray(geometryInstances)
      ? geometryInstances
      : [geometryInstances];
    const geometryInstanceCount = geometryInstancesArray.length;
    for (let i = 0; i < geometryInstanceCount; i++) {
      const attributes = geometryInstancesArray[i].attributes;
      if (defined(attributes) && defined(attributes.color)) {
        appearance = new PerInstanceColorAppearance({
          flat: true,
        });
        break;
      }
    }
  }
  /**
   * 用于对此基元进行着色的 {@link Appearance}。每个几何体
   * 实例以相同的外观进行着色。 一些外观，如
   * {@link PerInstanceColorAppearance} 允许为每个实例指定唯一性
   *性能。
   *
   * @type Appearance
   *
   * @default undefined
   */
  this.appearance = appearance;

  /**
   * 使用此基元渲染的几何体实例。 这可能会
   * 如果 <code>options.releaseGeometryInstances</code> 为 <code>undefined</code>
   * 在构造基元时为 <code>true</code>。
   * <p>
   * 在渲染基元后更改此属性不起作用。
   * </p>
   *
   * @readonly
   * @type {Array|GeometryInstance}
   *
   * @default undefined
   */
  this.geometryInstances = options.geometryInstances;
  /**
   * 确定是否显示基元。 这会影响所有几何体
   * 实例。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.show = defaultValue(options.show, true);
  /**
   * 确定是否对地形、3D 瓦片或两者进行分类。
   *
   * @type {ClassificationType}
   *
   * @default ClassificationType.BOTH
   */
  this.classificationType = defaultValue(
    options.classificationType,
    ClassificationType.BOTH
  );
  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 为基元中的每个绘制命令绘制边界球体。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false
  );

  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 为基本体中的每个几何体绘制阴影体积。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowShadowVolume = defaultValue(
    options.debugShowShadowVolume,
    false
  );

  this._boundingVolumes = [];
  this._boundingVolumes2D = [];

  this._ready = false;
  this._primitive = undefined;

  this._maxHeight = undefined;
  this._minHeight = undefined;

  this._maxTerrainHeight = ApproximateTerrainHeights._defaultMaxTerrainHeight;
  this._minTerrainHeight = ApproximateTerrainHeights._defaultMinTerrainHeight;

  this._boundingSpheresKeys = [];
  this._boundingSpheres = [];

  this._useFragmentCulling = false;
  // Used when inserting in an OrderedPrimitiveCollection
  this._zIndex = undefined;

  const that = this;
  this._classificationPrimitiveOptions = {
    geometryInstances: undefined,
    appearance: undefined,
    vertexCacheOptimize: defaultValue(options.vertexCacheOptimize, false),
    interleave: defaultValue(options.interleave, false),
    releaseGeometryInstances: defaultValue(
      options.releaseGeometryInstances,
      true
    ),
    allowPicking: defaultValue(options.allowPicking, true),
    asynchronous: defaultValue(options.asynchronous, true),
    compressVertices: defaultValue(options.compressVertices, true),
    _createBoundingVolumeFunction: undefined,
    _updateAndQueueCommandsFunction: undefined,
    _pickPrimitive: that,
    _extruded: true,
    _uniformMap: GroundPrimitiveUniformMap,
  };
}

Object.defineProperties(GroundPrimitive.prototype, {
  /**
   * 如果为 <code>true</code>，则几何顶点将针对前顶点着色器缓存和后顶点着色器缓存进行优化。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  vertexCacheOptimize: {
    get: function () {
      return this._classificationPrimitiveOptions.vertexCacheOptimize;
    },
  },

  /**
   * 确定几何体顶点属性是否交错，这可以略微提高渲染性能。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  interleave: {
    get: function () {
      return this._classificationPrimitiveOptions.interleave;
    },
  },

  /**
   * 如果为 <code>true</code>，则基元不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  releaseGeometryInstances: {
    get: function () {
      return this._classificationPrimitiveOptions.releaseGeometryInstances;
    },
  },

  /**
   * 如果<code>为 true</code>，则每个几何体实例只能使用 {@link Scene#pick} 进行拾取。 如果<code>为 false</code>，则保存 GPU 内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  allowPicking: {
    get: function () {
      return this._classificationPrimitiveOptions.allowPicking;
    },
  },

  /**
   * 确定是否将在 Web Worker 上创建和批处理 geometry 实例。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  asynchronous: {
    get: function () {
      return this._classificationPrimitiveOptions.asynchronous;
    },
  },

  /**
   * 如果为 <code>true</code>，则几何顶点将被压缩，这将节省内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  compressVertices: {
    get: function () {
      return this._classificationPrimitiveOptions.compressVertices;
    },
  },

  /**
   * 确定基元是否完整并准备好进行渲染。 如果此属性为
   * true，则基元将在下次 {@link GroundPrimitive#update} 时渲染
   * 被调用。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },
});

/**
 * 确定是否支持 GroundPrimitive 渲染。
 *
 * @function
 * @param {Scene} scene 场景。
 * @returns {boolean} <code>true</code>（如果支持 GroundPrimitives）;否则，返回 <code>false</code>
 */
GroundPrimitive.isSupported = ClassificationPrimitive.isSupported;

function getComputeMaximumHeightFunction(primitive) {
  return function (granularity, ellipsoid) {
    const r = ellipsoid.maximumRadius;
    const delta = r / Math.cos(granularity * 0.5) - r;
    return primitive._maxHeight + delta;
  };
}

function getComputeMinimumHeightFunction(primitive) {
  return function (granularity, ellipsoid) {
    return primitive._minHeight;
  };
}

const scratchBVCartesianHigh = new Cartesian3();
const scratchBVCartesianLow = new Cartesian3();
const scratchBVCartesian = new Cartesian3();
const scratchBVCartographic = new Cartographic();
const scratchBVRectangle = new Rectangle();

function getRectangle(frameState, geometry) {
  const ellipsoid = frameState.mapProjection.ellipsoid;

  if (
    !defined(geometry.attributes) ||
    !defined(geometry.attributes.position3DHigh)
  ) {
    if (defined(geometry.rectangle)) {
      return geometry.rectangle;
    }

    return undefined;
  }

  const highPositions = geometry.attributes.position3DHigh.values;
  const lowPositions = geometry.attributes.position3DLow.values;
  const length = highPositions.length;

  let minLat = Number.POSITIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < length; i += 3) {
    const highPosition = Cartesian3.unpack(
      highPositions,
      i,
      scratchBVCartesianHigh
    );
    const lowPosition = Cartesian3.unpack(
      lowPositions,
      i,
      scratchBVCartesianLow
    );

    const position = Cartesian3.add(
      highPosition,
      lowPosition,
      scratchBVCartesian
    );
    const cartographic = ellipsoid.cartesianToCartographic(
      position,
      scratchBVCartographic
    );

    const latitude = cartographic.latitude;
    const longitude = cartographic.longitude;

    minLat = Math.min(minLat, latitude);
    minLon = Math.min(minLon, longitude);
    maxLat = Math.max(maxLat, latitude);
    maxLon = Math.max(maxLon, longitude);
  }

  const rectangle = scratchBVRectangle;
  rectangle.north = maxLat;
  rectangle.south = minLat;
  rectangle.east = maxLon;
  rectangle.west = minLon;

  return rectangle;
}

function setMinMaxTerrainHeights(primitive, rectangle, ellipsoid) {
  const result = ApproximateTerrainHeights.getMinimumMaximumHeights(
    rectangle,
    ellipsoid
  );

  primitive._minTerrainHeight = result.minimumTerrainHeight;
  primitive._maxTerrainHeight = result.maximumTerrainHeight;
}

function createBoundingVolume(groundPrimitive, frameState, geometry) {
  const ellipsoid = frameState.mapProjection.ellipsoid;
  const rectangle = getRectangle(frameState, geometry);

  const obb = OrientedBoundingBox.fromRectangle(
    rectangle,
    groundPrimitive._minHeight,
    groundPrimitive._maxHeight,
    ellipsoid
  );
  groundPrimitive._boundingVolumes.push(obb);

  if (!frameState.scene3DOnly) {
    const projection = frameState.mapProjection;
    const boundingVolume = BoundingSphere.fromRectangleWithHeights2D(
      rectangle,
      projection,
      groundPrimitive._maxHeight,
      groundPrimitive._minHeight
    );
    Cartesian3.fromElements(
      boundingVolume.center.z,
      boundingVolume.center.x,
      boundingVolume.center.y,
      boundingVolume.center
    );

    groundPrimitive._boundingVolumes2D.push(boundingVolume);
  }
}

function boundingVolumeIndex(commandIndex, length) {
  return Math.floor((commandIndex % length) / 2);
}

function updateAndQueueRenderCommand(
  groundPrimitive,
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
  debugShowBoundingVolume
) {
  // Use derived appearance command for 2D if needed
  const classificationPrimitive = groundPrimitive._primitive;
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    command.shaderProgram === classificationPrimitive._spColor &&
    classificationPrimitive._needs2DShader
  ) {
    command = command.derivedCommands.appearance2D;
  }

  command.owner = groundPrimitive;
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;
  command.debugShowBoundingVolume = debugShowBoundingVolume;

  frameState.commandList.push(command);
}

function updateAndQueuePickCommand(
  groundPrimitive,
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume
) {
  // Use derived pick command for 2D if needed
  const classificationPrimitive = groundPrimitive._primitive;
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    command.shaderProgram === classificationPrimitive._spPick &&
    classificationPrimitive._needs2DShader
  ) {
    command = command.derivedCommands.pick2D;
  }

  command.owner = groundPrimitive;
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;

  frameState.commandList.push(command);
}

function updateAndQueueCommands(
  groundPrimitive,
  frameState,
  colorCommands,
  pickCommands,
  modelMatrix,
  cull,
  debugShowBoundingVolume,
  twoPasses
) {
  let boundingVolumes;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingVolumes = groundPrimitive._boundingVolumes;
  } else {
    boundingVolumes = groundPrimitive._boundingVolumes2D;
  }

  const classificationType = groundPrimitive.classificationType;
  const queueTerrainCommands =
    classificationType !== ClassificationType.CESIUM_3D_TILE;
  const queue3DTilesCommands =
    classificationType !== ClassificationType.TERRAIN;

  const passes = frameState.passes;
  const classificationPrimitive = groundPrimitive._primitive;

  let i;
  let boundingVolume;
  let command;

  if (passes.render) {
    const colorLength = colorCommands.length;

    for (i = 0; i < colorLength; ++i) {
      boundingVolume = boundingVolumes[boundingVolumeIndex(i, colorLength)];
      if (queueTerrainCommands) {
        command = colorCommands[i];
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume
        );
      }
      if (queue3DTilesCommands) {
        command = colorCommands[i].derivedCommands.tileset;
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume
        );
      }
    }

    if (frameState.invertClassification) {
      const ignoreShowCommands = classificationPrimitive._commandsIgnoreShow;
      const ignoreShowCommandsLength = ignoreShowCommands.length;
      for (i = 0; i < ignoreShowCommandsLength; ++i) {
        boundingVolume = boundingVolumes[i];
        command = ignoreShowCommands[i];
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume
        );
      }
    }
  }

  if (passes.pick) {
    const pickLength = pickCommands.length;

    let pickOffsets;
    if (!groundPrimitive._useFragmentCulling) {
      // Must be using pick offsets
      pickOffsets = classificationPrimitive._primitive._pickOffsets;
    }
    for (i = 0; i < pickLength; ++i) {
      boundingVolume = boundingVolumes[boundingVolumeIndex(i, pickLength)];
      if (!groundPrimitive._useFragmentCulling) {
        const pickOffset = pickOffsets[boundingVolumeIndex(i, pickLength)];
        boundingVolume = boundingVolumes[pickOffset.index];
      }
      if (queueTerrainCommands) {
        command = pickCommands[i];
        updateAndQueuePickCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume
        );
      }
      if (queue3DTilesCommands) {
        command = pickCommands[i].derivedCommands.tileset;
        updateAndQueuePickCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume
        );
      }
    }
  }
}

/**
 * 初始化最小和最大地形高度。仅当您正在创建
 * GroundPrimitive 同步。
 *
 * @returns {Promise<void>} 一个 Promise，一旦地形高度被加载，它就会被解析。
 *
 */
GroundPrimitive.initializeTerrainHeights = function () {
  return ApproximateTerrainHeights.initialize();
};

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此函数。 这记录下来只是为了
 * 列出渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} For synchronous GroundPrimitive, you must call GroundPrimitive.initializeTerrainHeights() and wait for the returned promise to resolve.
 * @exception {DeveloperError} All instance geometries must have the same primitiveType.
 * @exception {DeveloperError} Appearance and material have a uniform with the same name.
 */
GroundPrimitive.prototype.update = function (frameState) {
  if (!defined(this._primitive) && !defined(this.geometryInstances)) {
    return;
  }

  if (!ApproximateTerrainHeights.initialized) {
    //>>includeStart('debug', pragmas.debug);
    if (!this.asynchronous) {
      throw new DeveloperError(
        "For synchronous GroundPrimitives, you must call GroundPrimitive.initializeTerrainHeights() and wait for the returned promise to resolve."
      );
    }
    //>>includeEnd('debug');

    GroundPrimitive.initializeTerrainHeights();
    return;
  }

  const that = this;
  const primitiveOptions = this._classificationPrimitiveOptions;

  if (!defined(this._primitive)) {
    const ellipsoid = frameState.mapProjection.ellipsoid;

    let instance;
    let geometry;
    let instanceType;

    const instances = Array.isArray(this.geometryInstances)
      ? this.geometryInstances
      : [this.geometryInstances];
    const length = instances.length;
    const groundInstances = new Array(length);

    let i;
    let rectangle;
    for (i = 0; i < length; ++i) {
      instance = instances[i];
      geometry = instance.geometry;
      const instanceRectangle = getRectangle(frameState, geometry);
      if (!defined(rectangle)) {
        rectangle = Rectangle.clone(instanceRectangle);
      } else if (defined(instanceRectangle)) {
        Rectangle.union(rectangle, instanceRectangle, rectangle);
      }

      const id = instance.id;
      if (defined(id) && defined(instanceRectangle)) {
        const boundingSphere = ApproximateTerrainHeights.getBoundingSphere(
          instanceRectangle,
          ellipsoid
        );
        this._boundingSpheresKeys.push(id);
        this._boundingSpheres.push(boundingSphere);
      }

      instanceType = geometry.constructor;
      if (!defined(instanceType) || !defined(instanceType.createShadowVolume)) {
        //>>includeStart('debug', pragmas.debug);
        throw new DeveloperError(
          "Not all of the geometry instances have GroundPrimitive support."
        );
        //>>includeEnd('debug');
      }
    }

    // Now compute the min/max heights for the primitive
    setMinMaxTerrainHeights(this, rectangle, ellipsoid);
    const exaggeration = frameState.verticalExaggeration;
    const exaggerationRelativeHeight =
      frameState.verticalExaggerationRelativeHeight;
    this._minHeight = VerticalExaggeration.getHeight(
      this._minTerrainHeight,
      exaggeration,
      exaggerationRelativeHeight
    );
    this._maxHeight = VerticalExaggeration.getHeight(
      this._maxTerrainHeight,
      exaggeration,
      exaggerationRelativeHeight
    );

    const useFragmentCulling = GroundPrimitive._supportsMaterials(
      frameState.context
    );
    this._useFragmentCulling = useFragmentCulling;

    if (useFragmentCulling) {
      // Determine whether to add spherical or planar extent attributes for computing texture coordinates.
      // This depends on the size of the GeometryInstances.
      let attributes;
      let usePlanarExtents = true;
      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        rectangle = getRectangle(frameState, geometry);
        if (ShadowVolumeAppearance.shouldUseSphericalCoordinates(rectangle)) {
          usePlanarExtents = false;
          break;
        }
      }

      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        instanceType = geometry.constructor;

        const boundingRectangle = getRectangle(frameState, geometry);
        const textureCoordinateRotationPoints =
          geometry.textureCoordinateRotationPoints;

        if (usePlanarExtents) {
          attributes = ShadowVolumeAppearance.getPlanarTextureCoordinateAttributes(
            boundingRectangle,
            textureCoordinateRotationPoints,
            ellipsoid,
            frameState.mapProjection,
            this._maxHeight
          );
        } else {
          attributes = ShadowVolumeAppearance.getSphericalExtentGeometryInstanceAttributes(
            boundingRectangle,
            textureCoordinateRotationPoints,
            ellipsoid,
            frameState.mapProjection
          );
        }

        const instanceAttributes = instance.attributes;
        for (const attributeKey in instanceAttributes) {
          if (instanceAttributes.hasOwnProperty(attributeKey)) {
            attributes[attributeKey] = instanceAttributes[attributeKey];
          }
        }

        groundInstances[i] = new GeometryInstance({
          geometry: instanceType.createShadowVolume(
            geometry,
            getComputeMinimumHeightFunction(this),
            getComputeMaximumHeightFunction(this)
          ),
          attributes: attributes,
          id: instance.id,
        });
      }
    } else {
      // ClassificationPrimitive will check if the colors are all the same if it detects lack of fragment culling attributes
      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        instanceType = geometry.constructor;
        groundInstances[i] = new GeometryInstance({
          geometry: instanceType.createShadowVolume(
            geometry,
            getComputeMinimumHeightFunction(this),
            getComputeMaximumHeightFunction(this)
          ),
          attributes: instance.attributes,
          id: instance.id,
        });
      }
    }

    primitiveOptions.geometryInstances = groundInstances;
    primitiveOptions.appearance = this.appearance;

    primitiveOptions._createBoundingVolumeFunction = function (
      frameState,
      geometry
    ) {
      createBoundingVolume(that, frameState, geometry);
    };
    primitiveOptions._updateAndQueueCommandsFunction = function (
      primitive,
      frameState,
      colorCommands,
      pickCommands,
      modelMatrix,
      cull,
      debugShowBoundingVolume,
      twoPasses
    ) {
      updateAndQueueCommands(
        that,
        frameState,
        colorCommands,
        pickCommands,
        modelMatrix,
        cull,
        debugShowBoundingVolume,
        twoPasses
      );
    };

    this._primitive = new ClassificationPrimitive(primitiveOptions);
  }

  this._primitive.appearance = this.appearance;
  this._primitive.show = this.show;
  this._primitive.debugShowShadowVolume = this.debugShowShadowVolume;
  this._primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
  this._primitive.update(frameState);

  frameState.afterRender.push(() => {
    if (!this._ready && defined(this._primitive) && this._primitive.ready) {
      this._ready = true;

      if (this.releaseGeometryInstances) {
        this.geometryInstances = undefined;
      }
    }
  });
};

/**
 * @private
 */
GroundPrimitive.prototype.getBoundingSphere = function (id) {
  const index = this._boundingSpheresKeys.indexOf(id);
  if (index !== -1) {
    return this._boundingSpheres[index];
  }

  return undefined;
};

/**
 * 返回 {@link GeometryInstance} 的可修改的每实例属性。
 *
 * @param {*} id {@link GeometryInstance} 的 ID。
 * @returns {object} 属性格式的类型化数组，如果没有 id 的实例，则为 undefined。
 *
 * @exception {DeveloperError} must call update before calling getGeometryInstanceAttributes.
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA);
 * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true);
 */
GroundPrimitive.prototype.getGeometryInstanceAttributes = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(this._primitive)) {
    throw new DeveloperError(
      "must call update before calling getGeometryInstanceAttributes"
    );
  }
  //>>includeEnd('debug');
  return this._primitive.getGeometryInstanceAttributes(id);
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <p>
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see GroundPrimitive#destroy
 */
GroundPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <p>
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * e = e && e.destroy();
 *
 * @see GroundPrimitive#isDestroyed
 */
GroundPrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  return destroyObject(this);
};

/**
 * 暴露以进行测试。
 *
 * @param {Context} context 渲染上下文
 * @returns {boolean} 当前上下文是否支持 GroundPrimitives 上的材质。
 * @private
 */
GroundPrimitive._supportsMaterials = function (context) {
  return context.depthTexture;
};

/**
 * 检查给定的场景是否支持 GroundPrimitives 上的材质。
 * GroundPrimitives 上的材质需要支持 WEBGL_depth_texture 扩展。
 *
 * @param {Scene} scene 当前场景。
 * @returns {boolean} 当前场景是否支持 GroundPrimitives 上的材质。
 */
GroundPrimitive.supportsMaterials = function (scene) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("scene", scene);
  //>>includeEnd('debug');

  return GroundPrimitive._supportsMaterials(scene.frameState.context);
};
export default GroundPrimitive;
