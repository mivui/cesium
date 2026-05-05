import Check from "../../../../Core/Check.js";
import Frozen from "../../../../Core/Frozen.js";
import defined from "../../../../Core/defined.js";
import ResourceCache from "../../../ResourceCache.js";
import ResourceLoader from "../../../ResourceLoader.js";
import ResourceLoaderState from "../../../ResourceLoaderState.js";
import PropertyTexture from "../../../PropertyTexture.js";
import StructuralMetadata from "../../../StructuralMetadata.js";
import MetadataSchema from "../../../MetadataSchema.js";
import PpeTexture from "./PpeTexture.js";
import PpeMetadata from "./PpeMetadata.js";
import MeshPrimitiveGpmLocal from "./MeshPrimitiveGpmLocal.js";

/**
 * Loads glTF NGA_gpm_local from a glTF mesh primitive.
 * <p>
 * Implements the {@link ResourceLoader} interface.
 * </p>
 * This loads the "ppeTextures" of the NGA_gpm_local extension of a mesh primitive
 * and stores them in a `MeshPrimitiveGpmLocal` object.
 *
 * This object will be converted into a `StructuralMetadata` object, which may
 * override any `StructuralMetadata` that was read directly from the glTF.
 *
 * @alias GltfMeshPrimitiveGpmLoader
 * @constructor
 * @augments ResourceLoader
 *
 * @param {object} options Object with the following properties:
 * @param {object} options.gltf The glTF JSON.
 * @param {string} [options.extension] The <code>NGA_gpm_local</code> extension object.
 * @param {Resource} options.gltfResource The {@link Resource} containing the glTF.
 * @param {Resource} options.baseResource The {@link Resource} that paths in the glTF JSON are relative to.
 * @param {SupportedImageFormats} options.supportedImageFormats The supported image formats.
 * @param {FrameState} options.frameState The frame state.
 * @param {string} [options.cacheKey] The cache key of the resource.
 * @param {boolean} [options.asynchronous=true] Determines if WebGL resource creation will be spread out over several frames or block until all WebGL resources are created.
 *
 * @private
 */
function GltfMeshPrimitiveGpmLoader(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const gltf = options.gltf;
  const extension = options.extension;
  const gltfResource = options.gltfResource;
  const baseResource = options.baseResource;
  const supportedImageFormats = options.supportedImageFormats;
  const frameState = options.frameState;
  const cacheKey = options.cacheKey;
  const asynchronous = options.asynchronous ?? true;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.gltf", gltf);
  Check.typeOf.object("options.extension", extension);
  Check.typeOf.object("options.gltfResource", gltfResource);
  Check.typeOf.object("options.baseResource", baseResource);
  Check.typeOf.object("options.supportedImageFormats", supportedImageFormats);
  Check.typeOf.object("options.frameState", frameState);
  //>>includeEnd('debug');

  this._gltfResource = gltfResource;
  this._baseResource = baseResource;
  this._gltf = gltf;
  this._extension = extension;
  this._supportedImageFormats = supportedImageFormats;
  this._frameState = frameState;
  this._cacheKey = cacheKey;
  this._asynchronous = asynchronous;
  this._textureLoaders = [];
  this._textureIds = [];
  this._meshPrimitiveGpmLocal = undefined;
  this._structuralMetadata = undefined;
  this._state = ResourceLoaderState.UNLOADED;
  this._promise = undefined;
}

if (defined(Object.create)) {
  GltfMeshPrimitiveGpmLoader.prototype = Object.create(
    ResourceLoader.prototype,
  );
  GltfMeshPrimitiveGpmLoader.prototype.constructor = GltfMeshPrimitiveGpmLoader;
}

Object.defineProperties(GltfMeshPrimitiveGpmLoader.prototype, {
  /**
   * The cache key of the resource.
   *
   * @memberof GltfMeshPrimitiveGpmLoader.prototype
   *
   * @type {string}
   * @readonly
   * @private
   */
  cacheKey: {
    get: function () {
      return this._cacheKey;
    },
  },

  /**
   * The parsed GPM extension information from the mesh primitive
   *
   * @memberof GltfMeshPrimitiveGpmLoader.prototype
   *
   * @type {MeshPrimitiveGpmLocal}
   * @readonly
   * @private
   */
  meshPrimitiveGpmLocal: {
    get: function () {
      return this._meshPrimitiveGpmLocal;
    },
  },

  /**
   * Returns the result of converting the parsed 'MeshPrimitiveGpmLocal'
   * into a 'StructuralMetadata'.
   *
   * Some details about the translation are intentionally not specified here.
   *
   * @memberof GltfMeshPrimitiveGpmLoader.prototype
   *
   * @type {StructuralMetadata}
   * @readonly
   * @private
   */
  structuralMetadata: {
    get: function () {
      return this._structuralMetadata;
    },
  },
});

GltfMeshPrimitiveGpmLoader.prototype._loadResources = async function () {
  try {
    const texturesPromise = this._loadTextures();
    await texturesPromise;

    if (this.isDestroyed()) {
      return;
    }

    this._gltf = undefined; // No longer need to hold onto the glTF

    this._state = ResourceLoaderState.LOADED;
    return this;
  } catch (error) {
    if (this.isDestroyed()) {
      return;
    }

    this.unload();
    this._state = ResourceLoaderState.FAILED;
    const errorMessage = "Failed to load GPM data";
    throw this.getError(errorMessage, error);
  }
};

/**
 * Loads the resource.
 * @returns {Promise<GltfMeshPrimitiveGpmLoader>} A promise which resolves to the loader when the resource loading is completed.
 * @private
 */
GltfMeshPrimitiveGpmLoader.prototype.load = function () {
  if (defined(this._promise)) {
    return this._promise;
  }

  this._state = ResourceLoaderState.LOADING;
  this._promise = this._loadResources(this);
  return this._promise;
};

function gatherUsedTextureIds(gpmExtension) {
  // Gather the used textures
  const textureIds = {};
  const ppeTextures = gpmExtension.ppeTextures;
  if (defined(ppeTextures)) {
    for (let i = 0; i < ppeTextures.length; i++) {
      const ppeTexture = ppeTextures[i];
      // The texture is a valid textureInfo.
      textureIds[ppeTexture.index] = ppeTexture;
    }
  }
  return textureIds;
}

GltfMeshPrimitiveGpmLoader.prototype._loadTextures = function () {
  let textureIds;
  if (defined(this._extension)) {
    textureIds = gatherUsedTextureIds(this._extension);
  }

  const gltf = this._gltf;
  const gltfResource = this._gltfResource;
  const baseResource = this._baseResource;
  const supportedImageFormats = this._supportedImageFormats;
  const frameState = this._frameState;
  const asynchronous = this._asynchronous;

  // Load the textures
  const texturePromises = [];
  for (const textureId in textureIds) {
    if (textureIds.hasOwnProperty(textureId)) {
      const textureLoader = ResourceCache.getTextureLoader({
        gltf: gltf,
        textureInfo: textureIds[textureId],
        gltfResource: gltfResource,
        baseResource: baseResource,
        supportedImageFormats: supportedImageFormats,
        frameState: frameState,
        asynchronous: asynchronous,
      });
      this._textureLoaders.push(textureLoader);
      this._textureIds.push(textureId);
      texturePromises.push(textureLoader.load());
    }
  }

  return Promise.all(texturePromises);
};

/**
 * A static mapping from PPE texture property identifier keys
 * to `MetadataSchema` instances. This is used to create each
 * schema (with a certain structure) only ONCE in
 * _obtainPpeTexturesMetadataSchema
 *
 * @private
 */
GltfMeshPrimitiveGpmLoader.ppeTexturesMetadataSchemaCache = new Map();

/**
 * 创建将给定 PPE 纹理视为属性纹理属性的元数据类的 JSON 描述。
 *
 * @param {PpeTexture} ppeTexture - PPE 纹理
 * @param {number} index - 纹理在扩展中的索引
 * @returns 类的 JSON 描述
 */
GltfMeshPrimitiveGpmLoader._createPpeTextureClassJson = function (
  ppeTexture,
  index,
) {
  const traits = ppeTexture.traits;
  const ppePropertyName = traits.source;

  // The ppeTexture will have a structure like this:
  //
  //"ppeTextures" : [
  //  {
  //    "traits" : {
  //      "source" : "SIGZ",
  //      "min" : 0.0,
  //      "max" : 16.0
  //    },
  //    "index" : 2,
  //    "noData" : 255,
  //    "offset" : 0.0,
  //    "scale" : 0.06274509803921569,
  //    "texCoord" : 1
  //  },
  //
  // This is translated into a single class property here, that defines
  // the structure of the property texture property.
  //
  // Given that `offset` and `scale` may only be applied to integer
  // property values when they are `normalized`, the values will be
  // declared as `normalized` here.
  // The normalization factor will later have to be cancelled out,
  // with the `scale` being multiplied by 255.
  const offset = ppeTexture.offset ?? 0.0;
  const scale = (ppeTexture.scale ?? 1.0) * 255.0;
  const classJson = {
    name: `PPE texture class ${index}`,
    properties: {
      [ppePropertyName]: {
        name: "PPE",
        type: "SCALAR",
        componentType: "UINT8",
        normalized: true,
        offset: offset,
        scale: scale,
        min: traits.min,
        max: traits.max,
      },
    },
  };
  return classJson;
};

/**
 * 返回给定 `MeshPrimitiveGpmLocal` 实例中 PPE 纹理的 `MetadataSchema`。
 *
 * 此方法将返回一个（静态/全局）缓存的元数据模式，该模式反映给定实例中
 * PPE 纹理的结构，必要时会创建并缓存它。
 *
 * 有关缓存键的详细信息，请参阅 `_collectPpeTexturePropertyIdentifiers`
 *
 * @param {MeshPrimitiveGpmLocal} meshPrimitiveGpmLocal 扩展对象
 * @returns `MetadataSchema`
 */
GltfMeshPrimitiveGpmLoader._obtainPpeTexturesMetadataSchema = function (
  meshPrimitiveGpmLocal,
) {
  const ppeTexturePropertyIdentifiers =
    GltfMeshPrimitiveGpmLoader._collectPpeTexturePropertyIdentifiers(
      meshPrimitiveGpmLocal,
    );
  const key = ppeTexturePropertyIdentifiers.toString();
  let ppeTexturesMetadataSchema =
    GltfMeshPrimitiveGpmLoader.ppeTexturesMetadataSchemaCache.get(key);
  if (defined(ppeTexturesMetadataSchema)) {
    return ppeTexturesMetadataSchema;
  }

  const schemaId = `PPE_TEXTURE_SCHEMA_${GltfMeshPrimitiveGpmLoader.ppeTexturesMetadataSchemaCache.size}`;
  const ppeTexturesMetadataSchemaJson = {
    id: schemaId,
    classes: {},
  };

  const ppeTextures = meshPrimitiveGpmLocal.ppeTextures;
  for (let i = 0; i < ppeTextures.length; i++) {
    const ppeTexture = ppeTextures[i];
    const classId = `ppeTexture_${i}`;
    const classJson = GltfMeshPrimitiveGpmLoader._createPpeTextureClassJson(
      ppeTexture,
      i,
    );
    ppeTexturesMetadataSchemaJson.classes[classId] = classJson;
  }

  ppeTexturesMetadataSchema = MetadataSchema.fromJson(
    ppeTexturesMetadataSchemaJson,
  );
  GltfMeshPrimitiveGpmLoader.ppeTexturesMetadataSchemaCache.set(
    key,
    ppeTexturesMetadataSchema,
  );
  return ppeTexturesMetadataSchema;
};

/**
 * 创建用作 PPE 纹理标识符的字符串数组。
 *
 * 每个 glTF 可以在 `NGA_gpm_local` 扩展中定义多个 `ppeTexture` 对象。
 * 每个纹理对应元数据模式中的一个"属性纹理属性"。
 *
 * 此方法将创建一个数组，其中每个元素都是 GPM PPE 纹理定义部分的
 * （JSON）字符串表示，这些部分用于区分两个 PPE 纹理在
 * `StructuralMetadata` 中的结构。
 *
 * @param {MeshPrimitiveGpmLocal} meshPrimitiveGpmLocal 扩展对象
 * @returns 标识符数组
 */
GltfMeshPrimitiveGpmLoader._collectPpeTexturePropertyIdentifiers = function (
  meshPrimitiveGpmLocal,
) {
  const ppeTexturePropertyIdentifiers = [];
  const ppeTextures = meshPrimitiveGpmLocal.ppeTextures;
  for (let i = 0; i < ppeTextures.length; i++) {
    const ppeTexture = ppeTextures[i];
    // The following will create an identifier that can be used
    // to define two PPE textures as "representing the same
    // property texture property" within a structural metadata
    // schema.
    const classJson = GltfMeshPrimitiveGpmLoader._createPpeTextureClassJson(
      ppeTexture,
      i,
    );
    const ppeTexturePropertyIdentifier = JSON.stringify(classJson);
    ppeTexturePropertyIdentifiers.push(ppeTexturePropertyIdentifier);
  }
  return ppeTexturePropertyIdentifiers;
};

/**
 * 将给定的 `MeshPrimitiveGpmLocal` 对象转换为 `StructuralMetadata` 对象。
 *
 * 这会将给定对象中的 PPE 纹理转换为属性纹理属性。
 * 模式将根据 PPE 纹理的结构创建。
 *
 * @param {MeshPrimitiveGpmLocal} meshPrimitiveGpmLocal 扩展对象
 * @param {object} textures 从纹理 ID 到纹理对象的映射
 * @returns `StructuralMetadata` 对象
 */
GltfMeshPrimitiveGpmLoader._convertToStructuralMetadata = function (
  meshPrimitiveGpmLocal,
  textures,
) {
  const propertyTextures = [];
  const ppeTexturesMetadataSchema =
    GltfMeshPrimitiveGpmLoader._obtainPpeTexturesMetadataSchema(
      meshPrimitiveGpmLocal,
    );
  const ppeTextures = meshPrimitiveGpmLocal.ppeTextures;
  for (let i = 0; i < ppeTextures.length; i++) {
    const ppeTexture = ppeTextures[i];
    const classId = `ppeTexture_${i}`;
    const traits = ppeTexture.traits;
    const ppePropertyName = traits.source;
    const metadataClass = ppeTexturesMetadataSchema.classes[classId];

    const ppeTextureAsPropertyTexture = {
      class: classId,
      properties: {
        [ppePropertyName]: {
          index: ppeTexture.index,
          texCoord: ppeTexture.texCoord,
        },
      },
    };
    propertyTextures.push(
      new PropertyTexture({
        id: i,
        name: ppeTexture.name,
        propertyTexture: ppeTextureAsPropertyTexture,
        class: metadataClass,
        textures: textures,
      }),
    );
  }
  const structuralMetadata = new StructuralMetadata({
    schema: ppeTexturesMetadataSchema,
    propertyTables: [],
    propertyTextures: propertyTextures,
    propertyAttributes: [],
  });
  return structuralMetadata;
};

/**
 * Processes the resource until it becomes ready.
 *
 * @param {FrameState} frameState The frame state.
 * @private
 */
GltfMeshPrimitiveGpmLoader.prototype.process = function (frameState) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("frameState", frameState);
  //>>includeEnd('debug');

  if (this._state === ResourceLoaderState.READY) {
    return true;
  }

  if (this._state !== ResourceLoaderState.LOADED) {
    return false;
  }

  // The standard process of loading textures
  // (from GltfStructuralMetadataLoader)
  const textureLoaders = this._textureLoaders;
  const textureLoadersLength = textureLoaders.length;
  let ready = true;
  for (let i = 0; i < textureLoadersLength; ++i) {
    const textureLoader = textureLoaders[i];
    const textureReady = textureLoader.process(frameState);
    ready = ready && textureReady;
  }

  if (!ready) {
    return false;
  }

  // More of the standard process of loading textures
  // (from GltfStructuralMetadataLoader)
  const textures = {};
  for (let i = 0; i < this._textureIds.length; ++i) {
    const textureId = this._textureIds[i];
    const textureLoader = textureLoaders[i];
    if (!textureLoader.isDestroyed()) {
      textures[textureId] = textureLoader.texture;
    }
  }

  // Convert the JSON representation of the `ppeTextures` that
  // are found in the extensjon JSON into `PpeTexture` objects
  const ppeTextures = [];
  const extension = this._extension;
  if (defined(extension.ppeTextures)) {
    const ppeTexturesJson = extension.ppeTextures;
    for (const ppeTextureJson of ppeTexturesJson) {
      const traitsJson = ppeTextureJson.traits;
      const traits = new PpeMetadata({
        min: traitsJson.min,
        max: traitsJson.max,
        source: traitsJson.source,
      });
      const ppeTexture = new PpeTexture({
        traits: traits,
        noData: ppeTextureJson.noData,
        offset: ppeTextureJson.offset,
        scale: ppeTextureJson.scale,
        index: ppeTextureJson.index,
        texCoord: ppeTextureJson.texCoord,
      });
      ppeTextures.push(ppeTexture);
    }
  }
  const meshPrimitiveGpmLocal = new MeshPrimitiveGpmLocal(ppeTextures);
  this._meshPrimitiveGpmLocal = meshPrimitiveGpmLocal;

  const structuralMetadata =
    GltfMeshPrimitiveGpmLoader._convertToStructuralMetadata(
      meshPrimitiveGpmLocal,
      textures,
    );
  this._structuralMetadata = structuralMetadata;

  this._state = ResourceLoaderState.READY;
  return true;
};

GltfMeshPrimitiveGpmLoader.prototype._unloadTextures = function () {
  const textureLoaders = this._textureLoaders;
  const textureLoadersLength = textureLoaders.length;
  for (let i = 0; i < textureLoadersLength; ++i) {
    ResourceCache.unload(textureLoaders[i]);
  }
  this._textureLoaders.length = 0;
  this._textureIds.length = 0;
};

/**
 * Unloads the resource.
 * @private
 */
GltfMeshPrimitiveGpmLoader.prototype.unload = function () {
  this._unloadTextures();
  this._gltf = undefined;
  this._extension = undefined;
  this._structuralMetadata = undefined;
};

export default GltfMeshPrimitiveGpmLoader;
