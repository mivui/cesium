import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryInstanceAttribute from "../Core/GeometryInstanceAttribute.js";
import GroundPolylineGeometry from "../Core/GroundPolylineGeometry.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import PolylineShadowVolumeFS from "../Shaders/PolylineShadowVolumeFS.js";
import PolylineShadowVolumeMorphFS from "../Shaders/PolylineShadowVolumeMorphFS.js";
import PolylineShadowVolumeMorphVS from "../Shaders/PolylineShadowVolumeMorphVS.js";
import PolylineShadowVolumeVS from "../Shaders/PolylineShadowVolumeVS.js";
import BlendingState from "./BlendingState.js";
import ClassificationType from "./ClassificationType.js";
import CullFace from "./CullFace.js";
import PolylineColorAppearance from "./PolylineColorAppearance.js";
import PolylineMaterialAppearance from "./PolylineMaterialAppearance.js";
import Primitive from "./Primitive.js";
import SceneMode from "./SceneMode.js";
import StencilConstants from "./StencilConstants.js";
import StencilFunction from "./StencilFunction.js";
import StencilOperation from "./StencilOperation.js";

/**
 * GroundPolylinePrimitive 表示覆盖在 {@link Scene} 中的 terrain 或 3D 瓦片上的多段线。
 * <p>
 * 仅用于包含 {@link GroundPolylineGeometry} 的 GeometryInstances。
 * </p>
 *
 * @alias GroundPolylinePrimitive
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Array|GeometryInstance} [options.geometryInstances] 包含 GroundPolylineGeometry 的 GeometryInstance
 * @param {Appearance} [options.appearance] 用于渲染多段线的 Appearance。默认为 {@link PolylineMaterialAppearance} 上的白色 {@link Material}。
 * @param {boolean} [options.show=true] 决定是否显示此基元。
 * @param {boolean} [options.interleave=false] 如果<code>为 true</code>，则几何顶点属性是交错的，这可以略微提高渲染性能，但会增加加载时间。
 * @param {boolean} [options.releaseGeometryInstances=true] 如果为 <code>true</code>，则基元不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
 * @param {boolean} [options.allowPicking=true] 如果<code>为 true</code>，则每个几何体实例只能使用 {@link Scene#pick} 进行拾取。 如果<code>为 false</code>，则保存 GPU 内存。
 * @param {boolean} [options.asynchronous=true] 确定原语是异步创建还是阻塞直到准备就绪。如果为 false，则必须先调用 initializeTerrainHeights()。
 * @param {ClassificationType} [options.classificationType=ClassificationType.BOTH] 确定是否对地形、3D 瓦片或两者进行分类。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示此基本体的命令的边界球体。
 * @param {boolean} [options.debugShowShadowVolume=false] 仅用于调试。确定是否绘制基本体中每个几何体的阴影体积。必须在创建时为 <code>true</code> 才能生效。
 *
 * @example
 * // 1. Draw a polyline on terrain with a basic color material
 *
 * const instance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.GroundPolylineGeometry({
 *      positions : Cesium.Cartesian3.fromDegreesArray([
 *          -112.1340164450331, 36.05494287836128,
 *          -112.08821010582645, 36.097804071380715
 *      ]),
 *      width : 4.0
 *   }),
 *   id : 'object returned when this instance is picked and to get/set per-instance attributes'
 * });
 *
 * scene.groundPrimitives.add(new Cesium.GroundPolylinePrimitive({
 *   geometryInstances : instance,
 *   appearance : new Cesium.PolylineMaterialAppearance()
 * }));
 *
 * // 2. Draw a looped polyline on terrain with per-instance color and a distance display condition.
 * // Distance display conditions for polylines on terrain are based on an approximate terrain height
 * // instead of true terrain height.
 *
 * const instance2 = new Cesium.GeometryInstance({
 *   geometry : new Cesium.GroundPolylineGeometry({
 *      positions : Cesium.Cartesian3.fromDegreesArray([
 *          -112.1340164450331, 36.05494287836128,
 *          -112.08821010582645, 36.097804071380715,
 *          -112.13296079730024, 36.168769146801104
 *      ]),
 *      loop : true,
 *      width : 4.0
 *   }),
 *   attributes : {
 *      color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString('green').withAlpha(0.7)),
 *      distanceDisplayCondition : new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(1000, 30000)
 *   },
 *   id : 'object returned when this instance is picked and to get/set per-instance attributes'
 * });
 *
 * scene.groundPrimitives.add(new Cesium.GroundPolylinePrimitive({
 *   geometryInstances : instance2,
 *   appearance : new Cesium.PolylineColorAppearance()
 * }));
 */
function GroundPolylinePrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 使用此基元渲染的几何体实例。这可能会
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
  this._hasPerInstanceColors = true;

  let appearance = options.appearance;
  if (!defined(appearance)) {
    appearance = new PolylineMaterialAppearance();
  }
  /**
   * 用于对此基元进行着色的 {@link Appearance}。每个几何体
   * 实例以相同的外观进行着色。 一些外观，如
   * {@link PolylineColorAppearance} 允许为每个实例指定唯一的
   *性能。
   *
   * @type Appearance
   *
   * @default undefined
   */
  this.appearance = appearance;

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

  // Shadow volume is shown by removing a discard in the shader, so this isn't toggleable.
  this._debugShowShadowVolume = defaultValue(
    options.debugShowShadowVolume,
    false
  );

  this._primitiveOptions = {
    geometryInstances: undefined,
    appearance: undefined,
    vertexCacheOptimize: false,
    interleave: defaultValue(options.interleave, false),
    releaseGeometryInstances: defaultValue(
      options.releaseGeometryInstances,
      true
    ),
    allowPicking: defaultValue(options.allowPicking, true),
    asynchronous: defaultValue(options.asynchronous, true),
    compressVertices: false,
    _createShaderProgramFunction: undefined,
    _createCommandsFunction: undefined,
    _updateAndQueueCommandsFunction: undefined,
  };

  // Used when inserting in an OrderedPrimitiveCollection
  this._zIndex = undefined;

  this._ready = false;
  this._primitive = undefined;

  this._sp = undefined;
  this._sp2D = undefined;
  this._spMorph = undefined;

  this._renderState = getRenderState(false);
  this._renderState3DTiles = getRenderState(true);

  this._renderStateMorph = RenderState.fromCache({
    cull: {
      enabled: true,
      face: CullFace.FRONT, // Geometry is "inverted," so cull front when materials on volume instead of on terrain (morph)
    },
    depthTest: {
      enabled: true,
    },
    blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
    depthMask: false,
  });
}

Object.defineProperties(GroundPolylinePrimitive.prototype, {
  /**
   * 确定几何体顶点属性是否交错，这可以略微提高渲染性能。
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  interleave: {
    get: function () {
      return this._primitiveOptions.interleave;
    },
  },

  /**
   * 如果为 <code>true</code>，则基元不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  releaseGeometryInstances: {
    get: function () {
      return this._primitiveOptions.releaseGeometryInstances;
    },
  },

  /**
   * 如果<code>为 true</code>，则每个几何体实例只能使用 {@link Scene#pick} 进行拾取。 如果<code>为 false</code>，则保存 GPU 内存。
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  allowPicking: {
    get: function () {
      return this._primitiveOptions.allowPicking;
    },
  },

  /**
   * 确定是否将在 Web Worker 上创建和批处理 geometry 实例。
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  asynchronous: {
    get: function () {
      return this._primitiveOptions.asynchronous;
    },
  },

  /**
   * 确定基元是否完整并准备好进行渲染。 如果此属性为
   * true，则基元将在下次 {@link GroundPolylinePrimitive#update} 时渲染
   * 被调用。
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 如果为 true，则为基元中的每个几何体绘制阴影体积。
   * </p>
   *
   * @memberof GroundPolylinePrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  debugShowShadowVolume: {
    get: function () {
      return this._debugShowShadowVolume;
    },
  },
});

/**
 * 初始化最小和最大地形高度。仅当您正在创建
 * GroundPolylinePrimitive 同步。
 *
 * @returns {Promise<void>} 一个 Promise，一旦地形高度被加载，它就会被解析。
 */
GroundPolylinePrimitive.initializeTerrainHeights = function () {
  return ApproximateTerrainHeights.initialize();
};

function createShaderProgram(groundPolylinePrimitive, frameState, appearance) {
  const context = frameState.context;
  const primitive = groundPolylinePrimitive._primitive;
  const attributeLocations = primitive._attributeLocations;

  let vs = primitive._batchTable.getVertexShaderCallback()(
    PolylineShadowVolumeVS
  );
  vs = Primitive._appendShowToShader(primitive, vs);
  vs = Primitive._appendDistanceDisplayConditionToShader(primitive, vs);
  vs = Primitive._modifyShaderPosition(
    groundPolylinePrimitive,
    vs,
    frameState.scene3DOnly
  );

  let vsMorph = primitive._batchTable.getVertexShaderCallback()(
    PolylineShadowVolumeMorphVS
  );
  vsMorph = Primitive._appendShowToShader(primitive, vsMorph);
  vsMorph = Primitive._appendDistanceDisplayConditionToShader(
    primitive,
    vsMorph
  );
  vsMorph = Primitive._modifyShaderPosition(
    groundPolylinePrimitive,
    vsMorph,
    frameState.scene3DOnly
  );

  // Access pick color from fragment shader.
  // Helps with varying budget.
  let fs = primitive._batchTable.getVertexShaderCallback()(
    PolylineShadowVolumeFS
  );

  const vsDefines = [
    `GLOBE_MINIMUM_ALTITUDE ${frameState.mapProjection.ellipsoid.minimumRadius.toFixed(
      1
    )}`,
  ];
  let colorDefine = "";
  let materialShaderSource = "";
  if (defined(appearance.material)) {
    materialShaderSource = defined(appearance.material)
      ? appearance.material.shaderSource
      : "";

    // Check for use of v_width and v_polylineAngle in material shader
    // to determine whether these varyings should be active in the vertex shader.
    if (materialShaderSource.search(/in\s+float\s+v_polylineAngle;/g) !== -1) {
      vsDefines.push("ANGLE_VARYING");
    }
    if (materialShaderSource.search(/in\s+float\s+v_width;/g) !== -1) {
      vsDefines.push("WIDTH_VARYING");
    }
  } else {
    colorDefine = "PER_INSTANCE_COLOR";
  }

  vsDefines.push(colorDefine);
  const fsDefines = groundPolylinePrimitive.debugShowShadowVolume
    ? ["DEBUG_SHOW_VOLUME", colorDefine]
    : [colorDefine];

  const vsColor3D = new ShaderSource({
    defines: vsDefines,
    sources: [vs],
  });
  const fsColor3D = new ShaderSource({
    defines: fsDefines,
    sources: [materialShaderSource, fs],
  });
  groundPolylinePrimitive._sp = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: primitive._sp,
    vertexShaderSource: vsColor3D,
    fragmentShaderSource: fsColor3D,
    attributeLocations: attributeLocations,
  });

  // Derive 2D/CV
  let colorProgram2D = context.shaderCache.getDerivedShaderProgram(
    groundPolylinePrimitive._sp,
    "2dColor"
  );
  if (!defined(colorProgram2D)) {
    const vsColor2D = new ShaderSource({
      defines: vsDefines.concat(["COLUMBUS_VIEW_2D"]),
      sources: [vs],
    });
    colorProgram2D = context.shaderCache.createDerivedShaderProgram(
      groundPolylinePrimitive._sp,
      "2dColor",
      {
        context: context,
        shaderProgram: groundPolylinePrimitive._sp2D,
        vertexShaderSource: vsColor2D,
        fragmentShaderSource: fsColor3D,
        attributeLocations: attributeLocations,
      }
    );
  }
  groundPolylinePrimitive._sp2D = colorProgram2D;

  // Derive Morph
  let colorProgramMorph = context.shaderCache.getDerivedShaderProgram(
    groundPolylinePrimitive._sp,
    "MorphColor"
  );
  if (!defined(colorProgramMorph)) {
    const vsColorMorph = new ShaderSource({
      defines: vsDefines.concat([
        `MAX_TERRAIN_HEIGHT ${ApproximateTerrainHeights._defaultMaxTerrainHeight.toFixed(
          1
        )}`,
      ]),
      sources: [vsMorph],
    });

    fs = primitive._batchTable.getVertexShaderCallback()(
      PolylineShadowVolumeMorphFS
    );
    const fsColorMorph = new ShaderSource({
      defines: fsDefines,
      sources: [materialShaderSource, fs],
    });
    colorProgramMorph = context.shaderCache.createDerivedShaderProgram(
      groundPolylinePrimitive._sp,
      "MorphColor",
      {
        context: context,
        shaderProgram: groundPolylinePrimitive._spMorph,
        vertexShaderSource: vsColorMorph,
        fragmentShaderSource: fsColorMorph,
        attributeLocations: attributeLocations,
      }
    );
  }
  groundPolylinePrimitive._spMorph = colorProgramMorph;
}

function getRenderState(mask3DTiles) {
  return RenderState.fromCache({
    cull: {
      enabled: true, // prevent double-draw. Geometry is "inverted" (reversed winding order) so we're drawing backfaces.
    },
    blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
    depthMask: false,
    stencilTest: {
      enabled: mask3DTiles,
      frontFunction: StencilFunction.EQUAL,
      frontOperation: {
        fail: StencilOperation.KEEP,
        zFail: StencilOperation.KEEP,
        zPass: StencilOperation.KEEP,
      },
      backFunction: StencilFunction.EQUAL,
      backOperation: {
        fail: StencilOperation.KEEP,
        zFail: StencilOperation.KEEP,
        zPass: StencilOperation.KEEP,
      },
      reference: StencilConstants.CESIUM_3D_TILE_MASK,
      mask: StencilConstants.CESIUM_3D_TILE_MASK,
    },
  });
}

function createCommands(
  groundPolylinePrimitive,
  appearance,
  material,
  translucent,
  colorCommands,
  pickCommands
) {
  const primitive = groundPolylinePrimitive._primitive;
  const length = primitive._va.length;
  colorCommands.length = length;
  pickCommands.length = length;

  const isPolylineColorAppearance =
    appearance instanceof PolylineColorAppearance;

  const materialUniforms = isPolylineColorAppearance ? {} : material._uniforms;
  const uniformMap = primitive._batchTable.getUniformMapCallback()(
    materialUniforms
  );

  for (let i = 0; i < length; i++) {
    const vertexArray = primitive._va[i];

    let command = colorCommands[i];
    if (!defined(command)) {
      command = colorCommands[i] = new DrawCommand({
        owner: groundPolylinePrimitive,
        primitiveType: primitive._primitiveType,
      });
    }

    command.vertexArray = vertexArray;
    command.renderState = groundPolylinePrimitive._renderState;
    command.shaderProgram = groundPolylinePrimitive._sp;
    command.uniformMap = uniformMap;
    command.pass = Pass.TERRAIN_CLASSIFICATION;
    command.pickId = "czm_batchTable_pickColor(v_endPlaneNormalEcAndBatchId.w)";

    const derivedTilesetCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.tileset
    );
    derivedTilesetCommand.renderState =
      groundPolylinePrimitive._renderState3DTiles;
    derivedTilesetCommand.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION;
    command.derivedCommands.tileset = derivedTilesetCommand;

    // derive for 2D
    const derived2DCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.color2D
    );
    derived2DCommand.shaderProgram = groundPolylinePrimitive._sp2D;
    command.derivedCommands.color2D = derived2DCommand;

    const derived2DTilesetCommand = DrawCommand.shallowClone(
      derivedTilesetCommand,
      derivedTilesetCommand.derivedCommands.color2D
    );
    derived2DTilesetCommand.shaderProgram = groundPolylinePrimitive._sp2D;
    derivedTilesetCommand.derivedCommands.color2D = derived2DTilesetCommand;

    // derive for Morph
    const derivedMorphCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.colorMorph
    );
    derivedMorphCommand.renderState = groundPolylinePrimitive._renderStateMorph;
    derivedMorphCommand.shaderProgram = groundPolylinePrimitive._spMorph;
    derivedMorphCommand.pickId = "czm_batchTable_pickColor(v_batchId)";
    command.derivedCommands.colorMorph = derivedMorphCommand;
  }
}

function updateAndQueueCommand(
  groundPolylinePrimitive,
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
  debugShowBoundingVolume
) {
  // Use derived appearance command for morph and 2D
  if (frameState.mode === SceneMode.MORPHING) {
    command = command.derivedCommands.colorMorph;
  } else if (frameState.mode !== SceneMode.SCENE3D) {
    command = command.derivedCommands.color2D;
  }
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;
  command.debugShowBoundingVolume = debugShowBoundingVolume;

  frameState.commandList.push(command);
}

function updateAndQueueCommands(
  groundPolylinePrimitive,
  frameState,
  colorCommands,
  pickCommands,
  modelMatrix,
  cull,
  debugShowBoundingVolume
) {
  const primitive = groundPolylinePrimitive._primitive;

  Primitive._updateBoundingVolumes(primitive, frameState, modelMatrix); // Expected to be identity - GroundPrimitives don't support other model matrices

  let boundingSpheres;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingSpheres = primitive._boundingSphereWC;
  } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
    boundingSpheres = primitive._boundingSphereCV;
  } else if (
    frameState.mode === SceneMode.SCENE2D &&
    defined(primitive._boundingSphere2D)
  ) {
    boundingSpheres = primitive._boundingSphere2D;
  } else if (defined(primitive._boundingSphereMorph)) {
    boundingSpheres = primitive._boundingSphereMorph;
  }

  const morphing = frameState.mode === SceneMode.MORPHING;
  const classificationType = groundPolylinePrimitive.classificationType;
  const queueTerrainCommands =
    classificationType !== ClassificationType.CESIUM_3D_TILE;
  const queue3DTilesCommands =
    classificationType !== ClassificationType.TERRAIN && !morphing;

  let command;
  const passes = frameState.passes;
  if (passes.render || (passes.pick && primitive.allowPicking)) {
    const colorLength = colorCommands.length;
    for (let j = 0; j < colorLength; ++j) {
      const boundingVolume = boundingSpheres[j];
      if (queueTerrainCommands) {
        command = colorCommands[j];
        updateAndQueueCommand(
          groundPolylinePrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume
        );
      }
      if (queue3DTilesCommands) {
        command = colorCommands[j].derivedCommands.tileset;
        updateAndQueueCommand(
          groundPolylinePrimitive,
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
}

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此函数。 这记录下来只是为了
 * 列出渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} 对于同步 GroundPolylinePrimitives，您必须调用 GroundPolylinePrimitives.initializeTerrainHeights() 并等待返回的 Promise 解析。
 * @exception {DeveloperError} 所有 GeometryInstances 都必须具有颜色属性，才能将 PolylineColorAppearance 与 GroundPolylinePrimitive 一起使用。
 */
GroundPolylinePrimitive.prototype.update = function (frameState) {
  if (!defined(this._primitive) && !defined(this.geometryInstances)) {
    return;
  }

  if (!ApproximateTerrainHeights.initialized) {
    //>>includeStart('debug', pragmas.debug);
    if (!this.asynchronous) {
      throw new DeveloperError(
        "For synchronous GroundPolylinePrimitives, you must call GroundPolylinePrimitives.initializeTerrainHeights() and wait for the returned promise to resolve."
      );
    }
    //>>includeEnd('debug');

    GroundPolylinePrimitive.initializeTerrainHeights();
    return;
  }

  let i;

  const that = this;
  const primitiveOptions = this._primitiveOptions;
  if (!defined(this._primitive)) {
    const geometryInstances = Array.isArray(this.geometryInstances)
      ? this.geometryInstances
      : [this.geometryInstances];
    const geometryInstancesLength = geometryInstances.length;
    const groundInstances = new Array(geometryInstancesLength);

    let attributes;

    // Check if each instance has a color attribute.
    for (i = 0; i < geometryInstancesLength; ++i) {
      attributes = geometryInstances[i].attributes;
      if (!defined(attributes) || !defined(attributes.color)) {
        this._hasPerInstanceColors = false;
        break;
      }
    }

    for (i = 0; i < geometryInstancesLength; ++i) {
      const geometryInstance = geometryInstances[i];
      attributes = {};
      const instanceAttributes = geometryInstance.attributes;
      for (const attributeKey in instanceAttributes) {
        if (instanceAttributes.hasOwnProperty(attributeKey)) {
          attributes[attributeKey] = instanceAttributes[attributeKey];
        }
      }

      // Automatically create line width attribute if not already given
      if (!defined(attributes.width)) {
        attributes.width = new GeometryInstanceAttribute({
          componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
          componentsPerAttribute: 1.0,
          value: [geometryInstance.geometry.width],
        });
      }

      // Update each geometry for framestate.scene3DOnly = true and projection
      geometryInstance.geometry._scene3DOnly = frameState.scene3DOnly;
      GroundPolylineGeometry.setProjectionAndEllipsoid(
        geometryInstance.geometry,
        frameState.mapProjection
      );

      groundInstances[i] = new GeometryInstance({
        geometry: geometryInstance.geometry,
        attributes: attributes,
        id: geometryInstance.id,
        pickPrimitive: that,
      });
    }

    primitiveOptions.geometryInstances = groundInstances;
    primitiveOptions.appearance = this.appearance;

    primitiveOptions._createShaderProgramFunction = function (
      primitive,
      frameState,
      appearance
    ) {
      createShaderProgram(that, frameState, appearance);
    };
    primitiveOptions._createCommandsFunction = function (
      primitive,
      appearance,
      material,
      translucent,
      twoPasses,
      colorCommands,
      pickCommands
    ) {
      createCommands(
        that,
        appearance,
        material,
        translucent,
        colorCommands,
        pickCommands
      );
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
        debugShowBoundingVolume
      );
    };

    this._primitive = new Primitive(primitiveOptions);
  }

  if (
    this.appearance instanceof PolylineColorAppearance &&
    !this._hasPerInstanceColors
  ) {
    throw new DeveloperError(
      "All GeometryInstances must have color attributes to use PolylineColorAppearance with GroundPolylinePrimitive."
    );
  }

  this._primitive.appearance = this.appearance;
  this._primitive.show = this.show;
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
 * 返回 {@link GeometryInstance} 的可修改的每实例属性。
 *
 * @param {*} id {@link GeometryInstance} 的 ID。
 * @returns {object} 属性格式的类型化数组，如果没有 id 的实例，则为 undefined。
 *
 * @exception {DeveloperError} 必须在调用 getGeometryInstanceAttributes 之前调用 update。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA);
 * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true);
 */
GroundPolylinePrimitive.prototype.getGeometryInstanceAttributes = function (
  id
) {
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
 * 检查给定的 Scene 是否支持 GroundPolylinePrimitives。
 * GroundPolylinePrimitives 需要支持 WEBGL_depth_texture 扩展。
 *
 * @param {Scene} scene 当前场景。
 * @returns {boolean} 当前场景是否支持 GroundPolylinePrimitives。
 */
GroundPolylinePrimitive.isSupported = function (scene) {
  return scene.frameState.context.depthTexture;
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
 * @see GroundPolylinePrimitive#destroy
 */
GroundPolylinePrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <p>
 * 一旦对象被销毁，就不应该使用它;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * e = e && e.destroy();
 *
 * @see GroundPolylinePrimitive#isDestroyed
 */
GroundPolylinePrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  this._sp = this._sp && this._sp.destroy();

  // Derived programs, destroyed above if they existed.
  this._sp2D = undefined;
  this._spMorph = undefined;

  return destroyObject(this);
};
export default GroundPolylinePrimitive;
