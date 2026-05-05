import Cartesian3 from "../Core/Cartesian3.js";
import Cesium3DTilesetMetadata from "./Cesium3DTilesetMetadata.js";
import Check from "../Core/Check.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import hasExtension from "./hasExtension.js";
import ImplicitSubtree from "./ImplicitSubtree.js";
import ImplicitSubtreeCache from "./ImplicitSubtreeCache.js";
import ImplicitTileCoordinates from "./ImplicitTileCoordinates.js";
import ImplicitTileset from "./ImplicitTileset.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import MetadataSemantic from "./MetadataSemantic.js";
import MetadataType from "./MetadataType.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";
import preprocess3DTileContent from "./preprocess3DTileContent.js";
import Resource from "../Core/Resource.js";
import ResourceCache from "./ResourceCache.js";
import RuntimeError from "../Core/RuntimeError.js";
import VoxelContent from "./VoxelContent.js";
import VoxelMetadataOrder from "./VoxelMetadataOrder.js";
import VoxelShapeType from "./VoxelShapeType.js";
import CesiumMath from "../Core/Math.js";
import Quaternion from "../Core/Quaternion.js";

/**
 * @typedef {object} Cesium3DTilesVoxelProvider.ConstructorOptions
 *
 * Cesium3DTilesVoxelProvider 构造函数的初始化选项
 *
 * @property {string} className 描述体素元数据的瓦片集 schema 中的类。
 * @property {string[]} names 元数据名称。
 * @property {MetadataType[]} types 元数据类型。
 * @property {MetadataComponentType[]} componentTypes 元数据组件类型。
 * @property {VoxelShapeType} shape {@link VoxelShapeType}。
 * @property {Cartesian3} dimensions 瓦片每个维度的体素数量。对于数据集中的所有瓦片都是相同的。
 * @property {Cartesian3} [paddingBefore=Cartesian3.ZERO] 瓦片之前的填充体素数量。这提高了采样瓦片边缘时的渲染质量，但会增加内存使用量。
 * @property {Cartesian3} [paddingAfter=Cartesian3.ZERO] 瓦片之后的填充体素数量。这提高了采样瓦片边缘时的渲染质量，但会增加内存使用量。
 * @property {Matrix4} [globalTransform=Matrix4.IDENTITY] 从局部空间到全局空间的变换。
 * @property {Matrix4} [shapeTransform=Matrix4.IDENTITY] 从形状空间到局部空间的变换。
 * @property {Cartesian3} [minBounds] 最小边界。
 * @property {Cartesian3} [maxBounds] 最大边界。
 * @property {number[][]} [minimumValues] 元数据最小值。
 * @property {number[][]} [maximumValues] 元数据最大值。
 * @property {number} [maximumTileCount] 此提供程序存在的最大瓦片数量。该值用作体素渲染器分配适量 GPU 内存的提示。如果不知道此值，可以设为 undefined。
 */

/**
 * 从 3D Tiles 瓦片集获取体素数据的 {@link VoxelProvider}。
 * <p>
 * 实现 {@link VoxelProvider} 接口。
 * </p>
 * <div class="notice">
 * 此对象通常不直接实例化，请使用 {@link Cesium3DTilesVoxelProvider.fromUrl}。
 * </div>
 *
 * @alias Cesium3DTilesVoxelProvider
 * @constructor
 * @augments VoxelProvider
 *
 * @param {Cesium3DTilesVoxelProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see Cesium3DTilesVoxelProvider.fromUrl
 * @see VoxelProvider
 * @see VoxelPrimitive
 * @see VoxelShapeType
 *
 * @experimental This feature is not final and is subject to change without Cesium's standard deprecation policy.
 */
function Cesium3DTilesVoxelProvider(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  const {
    className,
    names,
    types,
    componentTypes,
    shape,
    dimensions,
    paddingBefore = Cartesian3.ZERO.clone(),
    paddingAfter = Cartesian3.ZERO.clone(),
    globalTransform = Matrix4.IDENTITY.clone(),
    shapeTransform = Matrix4.IDENTITY.clone(),
    minBounds,
    maxBounds,
    minimumValues,
    maximumValues,
    maximumTileCount,
  } = options;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("className", className);
  Check.typeOf.object("names", names);
  Check.typeOf.object("types", types);
  Check.typeOf.object("componentTypes", componentTypes);
  Check.typeOf.string("shape", shape);
  Check.typeOf.object("dimensions", dimensions);
  //>>includeEnd('debug');

  this._shapeTransform = shapeTransform;
  this._globalTransform = globalTransform;
  this._shape = shape;
  this._minBounds = minBounds;
  this._maxBounds = maxBounds;
  this._dimensions = dimensions;
  this._paddingBefore = paddingBefore;
  this._paddingAfter = paddingAfter;
  this._className = className;
  this._names = names;
  this._types = types;
  this._componentTypes = componentTypes;
  this._metadataOrder =
    shape === VoxelShapeType.ELLIPSOID
      ? VoxelMetadataOrder.Z_UP
      : VoxelMetadataOrder.Y_UP;
  this._minimumValues = minimumValues;
  this._maximumValues = maximumValues;
  this._maximumTileCount = maximumTileCount;
  this._availableLevels = undefined;
  this._implicitTileset = undefined;
  this._subtreeCache = new ImplicitSubtreeCache();
}

Object.defineProperties(Cesium3DTilesVoxelProvider.prototype, {
  /**
   * 从局部空间到全局空间的变换。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   */
  globalTransform: {
    get: function () {
      return this._globalTransform;
    },
  },

  /**
   * 从形状空间到局部空间的变换。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   */
  shapeTransform: {
    get: function () {
      return this._shapeTransform;
    },
  },

  /**
   * 获取 {@link VoxelShapeType}
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {VoxelShapeType}
   * @readonly
   */
  shape: {
    get: function () {
      return this._shape;
    },
  },

  /**
   * 获取最小边界。
   * 如果为 undefined，将改用形状的默认最小边界。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  minBounds: {
    get: function () {
      return this._minBounds;
    },
  },

  /**
   * 获取最大边界。
   * 如果为 undefined，将改用形状的默认最大边界。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  maxBounds: {
    get: function () {
      return this._maxBounds;
    },
  },

  /**
   * 获取瓦片每个维度的体素数量。对于数据集中的所有瓦片都是相同的。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Cartesian3}
   * @readonly
   */
  dimensions: {
    get: function () {
      return this._dimensions;
    },
  },

  /**
   * 获取瓦片之前的填充体素数量。这提高了采样瓦片边缘时的渲染质量，但会增加内存使用量。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   */
  paddingBefore: {
    get: function () {
      return this._paddingBefore;
    },
  },

  /**
   * 获取瓦片之后的填充体素数量。这提高了采样瓦片边缘时的渲染质量，但会增加内存使用量。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   * @readonly
   */
  paddingAfter: {
    get: function () {
      return this._paddingAfter;
    },
  },

  /**
   * 此瓦片集的元数据类。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {string}
   * @readonly
   */
  className: {
    get: function () {
      return this._className;
    },
  },

  /**
   * 获取元数据名称。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {string[]}
   * @readonly
   */
  names: {
    get: function () {
      return this._names;
    },
  },

  /**
   * 获取元数据类型。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {MetadataType[]}
   * @readonly
   */
  types: {
    get: function () {
      return this._types;
    },
  },

  /**
   * 获取元数据组件类型。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {MetadataComponentType[]}
   * @readonly
   */
  componentTypes: {
    get: function () {
      return this._componentTypes;
    },
  },

  /**
   * Gets the ordering of the metadata in the buffers.
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {VoxelMetadataOrder}
   * @readonly
   * @private
   */
  metadataOrder: {
    get: function () {
      return this._metadataOrder;
    },
  },

  /**
   * 获取元数据最小值。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */
  minimumValues: {
    get: function () {
      return this._minimumValues;
    },
  },

  /**
   * 获取元数据最大值。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */
  maximumValues: {
    get: function () {
      return this._maximumValues;
    },
  },

  /**
   * 此提供程序存在的最大瓦片数量。
   * 该值用作体素渲染器分配适量 GPU 内存的提示。
   * 如果不知道此值，可以设为 undefined。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumTileCount: {
    get: function () {
      return this._maximumTileCount;
    },
  },

  /**
   * 瓦片集中包含可用瓦片的细节级别数量。
   *
   * @memberof Cesium3DTilesVoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  availableLevels: {
    get: function () {
      return this._availableLevels;
    },
  },
});

/**
 * 创建从 3D Tiles 瓦片集获取体素数据的 {@link Cesium3DTilesVoxelProvider}。
 *
 * @param {Resource|string} url 瓦片集 JSON 文件的 URL
 * @returns {Promise<Cesium3DTilesVoxelProvider>} 创建的提供程序
 *
 * @exception {RuntimeException} 根节点必须包含内容
 * @exception {RuntimeException} 根瓦片内容必须包含 3DTILES_content_voxels 扩展
 * @exception {RuntimeException} 根瓦片必须包含隐式瓦片化
 * @exception {RuntimeException} 瓦片集必须包含元数据 schema
 * @exception {RuntimeException} Cesium3DTilesVoxelProvider 仅支持 box、region 和 3DTILES_bounding_volume_cylinder
 *
 * @example
 * try {
 *   const voxelProvider = await Cesium3DTilesVoxelProvider.fromUrl(
 *     "http://localhost:8002/tilesets/voxel/tileset.json"
 *   );
 *   const voxelPrimitive = new VoxelPrimitive({
 *     provider: voxelProvider,
 *     customShader: customShader,
 *   });
 *   scene.primitives.add(voxelPrimitive);
 * } catch (error) {
 *   console.error(`Error creating voxel primitive: ${error}`);
 * }
 *
 * @see {@link VoxelPrimitive}
 */
Cesium3DTilesVoxelProvider.fromUrl = async function (url) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);
  const tilesetJson = await resource.fetchJson();

  validate(tilesetJson);

  const schemaLoader = getMetadataSchemaLoader(tilesetJson, resource);
  await schemaLoader.load();

  const { root } = tilesetJson;

  const metadataJson = hasExtension(tilesetJson, "3DTILES_metadata")
    ? tilesetJson.extensions["3DTILES_metadata"]
    : tilesetJson;

  const tilesetMetadata = new Cesium3DTilesetMetadata({
    metadataJson: metadataJson,
    schema: schemaLoader.schema,
  });

  const voxel = root.content.extensions["3DTILES_content_voxels"];
  const className = voxel.class;

  const providerOptions = getAttributeInfo(tilesetMetadata, className);
  Object.assign(providerOptions, getShape(root));
  if (defined(root.transform)) {
    providerOptions.globalTransform = Matrix4.unpack(root.transform);
  } else {
    providerOptions.globalTransform = Matrix4.clone(Matrix4.IDENTITY);
  }

  providerOptions.dimensions = Cartesian3.unpack(voxel.dimensions);
  providerOptions.maximumTileCount = getTileCount(tilesetMetadata);

  if (defined(voxel.padding)) {
    providerOptions.paddingBefore = Cartesian3.unpack(voxel.padding.before);
    providerOptions.paddingAfter = Cartesian3.unpack(voxel.padding.after);
  }

  const provider = new Cesium3DTilesVoxelProvider(providerOptions);

  const implicitTileset = new ImplicitTileset(
    resource,
    root,
    schemaLoader.schema,
  );
  provider._implicitTileset = implicitTileset;
  provider._availableLevels = implicitTileset.availableLevels;

  ResourceCache.unload(schemaLoader);

  return provider;
};

function getTileCount(metadata) {
  if (!defined(metadata.tileset)) {
    return undefined;
  }

  return metadata.tileset.getPropertyBySemantic(
    MetadataSemantic.TILESET_TILE_COUNT,
  );
}

function validate(tileset) {
  const root = tileset.root;

  if (!defined(root.content)) {
    throw new RuntimeError("Root must have content");
  }

  if (!hasExtension(root.content, "3DTILES_content_voxels")) {
    throw new RuntimeError(
      "Root tile content must have 3DTILES_content_voxels extension",
    );
  }

  if (
    !hasExtension(root, "3DTILES_implicit_tiling") &&
    !defined(root.implicitTiling)
  ) {
    throw new RuntimeError("Root tile must have implicit tiling");
  }

  if (
    !defined(tileset.schema) &&
    !defined(tileset.schemaUri) &&
    !hasExtension(tileset, "3DTILES_metadata")
  ) {
    throw new RuntimeError("Tileset must have a metadata schema");
  }
}

function getShape(tile) {
  const boundingVolume = tile.boundingVolume;

  if (defined(boundingVolume.box)) {
    return getBoxShape(boundingVolume.box);
  } else if (defined(boundingVolume.region)) {
    return getEllipsoidShape(boundingVolume.region);
  } else if (hasExtension(boundingVolume, "3DTILES_bounding_volume_cylinder")) {
    return getCylinderShape(
      boundingVolume.extensions["3DTILES_bounding_volume_cylinder"],
    );
  }

  throw new RuntimeError(
    "Only box, region and 3DTILES_bounding_volume_cylinder are supported in Cesium3DTilesVoxelProvider",
  );
}

function getEllipsoidShape(region) {
  const west = region[0];
  const south = region[1];
  const east = region[2];
  const north = region[3];
  const minHeight = region[4];
  const maxHeight = region[5];

  const shapeTransform = Matrix4.fromScale(Ellipsoid.WGS84.radii);

  const minBounds = new Cartesian3(west, south, minHeight);
  const maxBounds = new Cartesian3(east, north, maxHeight);

  return {
    shape: VoxelShapeType.ELLIPSOID,
    minBounds: minBounds,
    maxBounds: maxBounds,
    shapeTransform: shapeTransform,
  };
}

const scratchScale = new Cartesian3();
const scratchRotation = new Matrix3();

function getBoxShape(box) {
  const obb = OrientedBoundingBox.unpack(box);
  const scale = Matrix3.getScale(obb.halfAxes, scratchScale);
  const rotation = Matrix3.getRotation(obb.halfAxes, scratchRotation);

  return {
    shape: VoxelShapeType.BOX,
    minBounds: Cartesian3.negate(scale, new Cartesian3()),
    maxBounds: Cartesian3.clone(scale),
    shapeTransform: Matrix4.fromRotationTranslation(rotation, obb.center),
  };
}

function getCylinderShape(cylinder) {
  const {
    minRadius,
    maxRadius,
    height,
    minAngle = -CesiumMath.PI,
    maxAngle = CesiumMath.PI,
    translation = [0, 0, 0],
    rotation = [0, 0, 0, 1],
  } = cylinder;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("minRadius", minRadius);
  Check.typeOf.number("maxRadius", maxRadius);
  Check.typeOf.number("height", height);
  Check.typeOf.number("minAngle", minAngle);
  Check.typeOf.number("maxAngle", maxAngle);
  Check.typeOf.object("translation", translation);
  Check.typeOf.object("rotation", rotation);
  //>>includeEnd('debug');

  const minHeight = -0.5 * height + translation[2];
  const maxHeight = 0.5 * height + translation[2];

  const shapeTransform = Matrix4.fromTranslationQuaternionRotationScale(
    Cartesian3.unpack(translation),
    Quaternion.unpack(rotation),
    Cartesian3.ONE,
  );

  return {
    shape: VoxelShapeType.CYLINDER,
    minBounds: Cartesian3.fromElements(minRadius, minAngle, minHeight),
    maxBounds: Cartesian3.fromElements(maxRadius, maxAngle, maxHeight),
    shapeTransform: shapeTransform,
  };
}

function getMetadataSchemaLoader(tilesetJson, resource) {
  const { schemaUri, schema } = tilesetJson;
  if (!defined(schemaUri)) {
    return ResourceCache.getSchemaLoader({ schema });
  }
  return ResourceCache.getSchemaLoader({
    resource: resource.getDerivedResource({
      url: schemaUri,
    }),
  });
}

function getAttributeInfo(metadata, className) {
  const { schema, statistics } = metadata;
  const classStatistics = statistics?.classes[className];
  const properties = schema.classes[className].properties;

  const propertyInfo = Object.entries(properties).map(([id, property]) => {
    const { type, componentType } = property;
    const min = classStatistics?.properties[id].min;
    const max = classStatistics?.properties[id].max;
    const componentCount = MetadataType.getComponentCount(type);
    const minValue = copyArray(min, componentCount);
    const maxValue = copyArray(max, componentCount);

    return { id, type, componentType, minValue, maxValue };
  });

  const names = propertyInfo.map((info) => info.id);
  const types = propertyInfo.map((info) => info.type);
  const componentTypes = propertyInfo.map((info) => info.componentType);

  const minimumValues = propertyInfo.map((info) => info.minValue);
  const maximumValues = propertyInfo.map((info) => info.maxValue);
  const hasMinimumValues = minimumValues.some(defined);

  return {
    className,
    names,
    types,
    componentTypes,
    minimumValues: hasMinimumValues ? minimumValues : undefined,
    maximumValues: hasMinimumValues ? maximumValues : undefined,
  };
}

function copyArray(values, length) {
  // Copy input values into a new array of a specified length.
  // If the input is not an array, its value will be copied into the first element
  // of the returned array. If the input is an array shorter than the returned
  // array, the extra elements in the returned array will be undefined. If the
  // input is undefined, the return will be undefined.
  if (!defined(values)) {
    return;
  }
  const valuesArray = Array.isArray(values) ? values : [values];
  return Array.from({ length }, (v, i) => valuesArray[i]);
}

/**
 * Get the subtree at a given subtree coordinate
 * @param {VoxelProvider} provider The voxel provider
 * @param {ImplicitTileCoordinates} subtreeCoord The coordinate at which to retrieve the subtree
 * @returns {Promise<ImplicitSubtree>} The subtree at the given coordinate
 * @private
 */
async function getSubtree(provider, subtreeCoord) {
  const implicitTileset = provider._implicitTileset;
  const subtreeCache = provider._subtreeCache;

  // First load the subtree to check if the tile is available.
  // If the subtree has been requested previously it might still be in the cache
  let subtree = subtreeCache.find(subtreeCoord);
  if (defined(subtree)) {
    return subtree;
  }

  const subtreeRelative = implicitTileset.subtreeUriTemplate.getDerivedResource(
    {
      templateValues: subtreeCoord.getTemplateValues(),
    },
  );
  const subtreeResource = implicitTileset.baseResource.getDerivedResource({
    url: subtreeRelative.url,
  });

  const arrayBuffer = await subtreeResource.fetchArrayBuffer();
  // Check one more time if the subtree is in the cache.
  // This could happen if there are two in-flight tile requests from the same
  // subtree and one finishes before the other.
  subtree = subtreeCache.find(subtreeCoord);
  if (defined(subtree)) {
    return subtree;
  }

  const preprocessed = preprocess3DTileContent(arrayBuffer);
  subtree = await ImplicitSubtree.fromSubtreeJson(
    subtreeResource,
    preprocessed.jsonPayload,
    preprocessed.binaryPayload,
    implicitTileset,
    subtreeCoord,
  );
  subtreeCache.addSubtree(subtree);
  return subtree;
}

/**
 * Requests the data for a given tile.
 *
 * @param {object} [options] Object with the following properties:
 * @param {number} [options.tileLevel=0] The tile's level.
 * @param {number} [options.tileX=0] The tile's X coordinate.
 * @param {number} [options.tileY=0] The tile's Y coordinate.
 * @param {number} [options.tileZ=0] The tile's Z coordinate.
 * @privateparam {number} [options.keyframe=0] The requested keyframe.
 * @returns {Promise<VoxelContent>|undefined} A promise resolving to a VoxelContent containing the data for the tile, or undefined if the request could not be scheduled this frame.
 */
Cesium3DTilesVoxelProvider.prototype.requestData = async function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const {
    tileLevel = 0,
    tileX = 0,
    tileY = 0,
    tileZ = 0,
    keyframe = 0,
  } = options;

  if (keyframe !== 0) {
    return Promise.reject(
      `3D Tiles currently doesn't support time-dynamic data.`,
    );
  }

  // 1. Load the subtree that the tile belongs to (possibly from the subtree cache)
  // 2. Load the voxel content if available

  // Can't use a scratch variable here because the object is used inside the promise chain.
  const implicitTileset = this._implicitTileset;
  const tileCoordinates = new ImplicitTileCoordinates({
    subdivisionScheme: implicitTileset.subdivisionScheme,
    subtreeLevels: implicitTileset.subtreeLevels,
    level: tileLevel,
    x: tileX,
    y: tileY,
    z: tileZ,
  });

  // Find the coordinates of the parent subtree containing tileCoordinates
  // If tileCoordinates is a subtree child, use that subtree
  // If tileCoordinates is a subtree root, use its parent subtree
  const isSubtreeRoot =
    tileCoordinates.isSubtreeRoot() && tileCoordinates.level > 0;

  const subtreeCoord = isSubtreeRoot
    ? tileCoordinates.getParentSubtreeCoordinates()
    : tileCoordinates.getSubtreeCoordinates();

  const that = this;

  const subtree = await getSubtree(that, subtreeCoord);
  // NOTE: these two subtree methods are ONLY used by voxels!
  const isAvailable = isSubtreeRoot
    ? subtree.childSubtreeIsAvailableAtCoordinates
    : subtree.tileIsAvailableAtCoordinates;

  const available = isAvailable.call(subtree, tileCoordinates);

  if (!available) {
    return Promise.reject(
      `Tile is not available at level ${tileLevel}, x ${tileX}, y ${tileY}, z ${tileZ}.`,
    );
  }

  const { contentUriTemplates, baseResource } = implicitTileset;
  const gltfRelative = contentUriTemplates[0].getDerivedResource({
    templateValues: tileCoordinates.getTemplateValues(),
  });
  const gltfResource = baseResource.getDerivedResource({
    url: gltfRelative.url,
  });

  return VoxelContent.fromGltf(gltfResource);
};

export default Cesium3DTilesVoxelProvider;
