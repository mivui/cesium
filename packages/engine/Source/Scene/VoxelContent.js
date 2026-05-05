import { destroyObject } from "@cesium/engine";
import Check from "../Core/Check.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import DeveloperError from "../Core/DeveloperError.js";
import defined from "../Core/defined.js";
import GltfLoader from "./GltfLoader.js";
import MetadataComponentType from "./MetadataComponentType.js";
import MetadataType from "./MetadataType.js";

/**
 * <div class="notice">
 * 要构造 VoxelContent，请调用 {@link VoxelContent.fromMetadataArray} 或 {@link VoxelContent.fromGltf}。不要直接调用构造函数。
 * </div>
 * 表示用于 {@link Cesium3DTilesVoxelProvider} 的体素内容的对象。
 *
 * @alias VoxelContent
 * @internalConstructor
 *
 * @privateParam {object} options 具有以下属性的对象：
 * @privateParam {ResourceLoader} [options.loader] 用于加载体素内容的加载器。
 * @privateParam {Int8Array[]|Uint8Array[]|Int16Array[]|Uint16Array[]|Int32Array[]|Uint32Array[]|Float32Array[]|Float64Array[]} [options.metadata] 此体素内容的元数据。
 *
 * @exception {DeveloperError} 必须定义 loader 和 metadata 中的一个。
 * @exception {DeveloperError} metadata 必须是 TypedArray 数组。
 *
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
function VoxelContent(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  if (!defined(options.loader)) {
    if (!defined(options.metadata)) {
      throw new DeveloperError("One of loader and metadata must be defined.");
    }
    if (!Array.isArray(options.metadata)) {
      throw new DeveloperError("metadata must be an array of TypedArrays.");
    }
  }
  //>>includeEnd('debug');

  const { loader, metadata } = options;

  this._loader = loader;
  this._metadata = metadata;
  this._resourcesLoaded = false;
  this._ready = false;
}

Object.defineProperties(VoxelContent.prototype, {
  /**
   * Returns true when the content is ready to render; otherwise false
   *
   * @memberof VoxelContent.prototype
   *
   * @type {boolean}
   * @readonly
   * @private
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 此体素内容的元数据。
   * 元数据是一个类型化数组的数组，每个字段一个。
   * 一个字段的数据是按 X、然后 Y、然后 Z 顺序排列的扁平化 3D 数组。
   *
   * @memberof VoxelContent.prototype
   * @type {Int8Array[]|Uint8Array[]|Int16Array[]|Uint16Array[]|Int32Array[]|Uint32Array[]|Float32Array[]|Float64Array[]}
   * @readonly
   */
  metadata: {
    get: function () {
      return this._metadata;
    },
  },
});

/**
 * 从元数据数组构造 VoxelContent。
 *
 * @param {Int8Array[]|Uint8Array[]|Int16Array[]|Uint16Array[]|Int32Array[]|Uint32Array[]|Float32Array[]|Float64Array[]} metadata 用于此体素内容的元数据。
 * @returns {VoxelContent} 包含指定元数据的 VoxelContent。
 */
VoxelContent.fromMetadataArray = function (metadata) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("metadata", metadata);
  if (!Array.isArray(metadata)) {
    throw new DeveloperError("metadata must be an array of TypedArrays.");
  }
  //>>includeEnd('debug');

  return new VoxelContent({ metadata });
};

/**
 * Constructs a VoxelContent from a glTF resource.
 *
 * @param {Resource} resource A Resource pointing to a glTF containing voxel content.
 * @returns {Promise<VoxelContent>} A promise that resolves to the voxel content.
 *
 * @private
 */
VoxelContent.fromGltf = async function (resource) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("resource", resource);
  //>>includeEnd('debug');

  // Construct the glTF loader
  const loader = new GltfLoader({
    gltfResource: resource,
    releaseGltfJson: false,
    loadAttributesAsTypedArray: true,
  });

  try {
    // This loads the gltf JSON and ensures the gltf is valid
    // Further resource loading is handled synchronously in loader.process()
    // via voxelContent.update() as the frameState is needed
    await loader.load();
  } catch (error) {
    loader.destroy();
    throw error;
  }

  return new VoxelContent({ loader });
};

/**
 * Updates the content until all resources are ready for rendering.
 * @param {FrameState} frameState The frame state
 * @private
 */
VoxelContent.prototype.update = function (primitive, frameState) {
  const loader = this._loader;

  if (this._ready) {
    // Nothing to do
    return;
  }

  // Ensures frames continue to render in requestRender mode while resources are processing
  frameState.afterRender.push(() => true);

  if (!defined(loader)) {
    this._ready = true;
    return;
  }

  if (this._resourcesLoaded) {
    const { structuralMetadata, scene } = loader.components;
    const { attributes } = scene.nodes[0].primitives[0];
    this._metadata = processAttributes(
      attributes,
      structuralMetadata,
      primitive,
    );
    this._ready = true;
    return;
  }

  this._resourcesLoaded = loader.process(frameState);
};

/**
 * Processes the attributes from the glTF loader, reordering them into the order expected by the primitive.
 *
 * @param {ModelComponents.Attribute[]} attributes The attributes to process
 * @param {StructuralMetadata} structuralMetadata Information from the glTF EXT_structural_metadata extension
 * @param {VoxelPrimitive} primitive The primitive for which this voxel content will be used.
 * @returns {Int8Array[]|Uint8Array[]|Int16Array[]|Uint16Array[]|Int32Array[]|Uint32Array[]|Float32Array[]|Float64Array[]} An array of typed arrays containing the attribute values
 * @private
 */
function processAttributes(attributes, structuralMetadata, primitive) {
  const { className, names, types, componentTypes } = primitive.provider;
  const propertyAttribute = structuralMetadata.propertyAttributes.find(
    (p) => p.class.id === className,
  );
  const { properties } = propertyAttribute;
  const data = new Array(names.length);

  for (let i = 0; i < attributes.length; i++) {
    // Find the appropriate glTF attribute based on its name.
    const name = properties[names[i]].attribute;
    const attribute = attributes.find((a) => a.name === name);
    if (!defined(attribute)) {
      continue;
    }

    const componentDatatype = MetadataComponentType.toComponentDatatype(
      componentTypes[i],
    );
    const componentCount = MetadataType.getComponentCount(types[i]);
    const totalCount = attribute.count * componentCount;
    data[i] = ComponentDatatype.createArrayBufferView(
      componentDatatype,
      attribute.typedArray.buffer,
      attribute.typedArray.byteOffset + attribute.byteOffset,
      totalCount,
    );
  }

  return data;
}

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
 *
 * @see VoxelContent#destroy
 *
 * @private
 */
VoxelContent.prototype.isDestroyed = function () {
  return false;
};

/**
 * Frees the resources used by this object.
 * @private
 */
VoxelContent.prototype.destroy = function () {
  this._loader = this._loader && this._loader.destroy();
  return destroyObject(this);
};

export default VoxelContent;
