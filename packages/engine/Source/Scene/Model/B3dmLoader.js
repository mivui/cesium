import Axis from "../Axis.js";
import B3dmParser from "../B3dmParser.js";
import Cartesian3 from "../../Core/Cartesian3.js";
import Cesium3DTileFeatureTable from "../Cesium3DTileFeatureTable.js";
import Check from "../../Core/Check.js";
import ComponentDatatype from "../../Core/ComponentDatatype.js";
import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import StructuralMetadata from "../StructuralMetadata.js";
import GltfLoader from "../GltfLoader.js";
import Matrix4 from "../../Core/Matrix4.js";
import MetadataClass from "../MetadataClass.js";
import ModelComponents from "../ModelComponents.js";
import ModelUtility from "./ModelUtility.js";
import parseBatchTable from "../parseBatchTable.js";
import PropertyTable from "../PropertyTable.js";
import ResourceLoader from "../ResourceLoader.js";
import VertexAttributeSemantic from "../VertexAttributeSemantic.js";

const B3dmLoaderState = {
  UNLOADED: 0,
  LOADING: 1,
  PROCESSING: 2,
  READY: 3,
  FAILED: 4,
};

const FeatureIdAttribute = ModelComponents.FeatureIdAttribute;

/**
 * 加载批处理的 3D 模型。
 * <p>
 * 实现 {@link ResourceLoader} 接口。
 * </p>
 *
 * @alias B3dmLoader
 * @constructor
 * @augments ResourceLoader
 * @private
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Resource} options.b3dm@link Resource 包含 b3dm.
 * @param {ArrayBuffer} options.arrayBuffer b3dm 内容的数组缓冲区。
 * @param {number} [options.byteOffset] 数组缓冲区中 b3dm 内容开头的字节偏移量。
 * @param {Resource} [options.baseResource] glTF JSON 中路径相对的 {@link Resource}。
 * @param {boolean} [options.releaseGltfJson=false] 如果为 true，则加载 glTF 后将释放 glTF JSON。这对于 3D 瓦片等情况特别有用，其中每个 .gltf 模型都是唯一的，并且缓存 glTF JSON 无效。
 * @param {boolean} [options.asynchronous=true] 确定 WebGL 资源的创建是分散在多个帧还是块上，直到创建所有 WebGL 资源为止。
 * @param {boolean} [options.incrementallyLoadTextures=true] 确定纹理在加载 glTF 后是否可以继续流式传输。
 * @param {Axis} [options.upAxis=Axis.Y] glTF 模型的上轴。
 * @param {Axis} [options.forwardAxis=Axis.X] glTF 模型的正向轴。
 * @param {boolean} [options.loadAttributesAsTypedArray=false] 如果<code>为 true</code>，则将所有属性加载为类型化数组，而不是 GPU 缓冲区。如果属性在 glTF 中交错，则它们将在类型化数组中取消交错。
 * @param {boolean} [options.loadAttributesFor2D=false] 如果<code>为 true</code>，则将位置缓冲区和任何实例化属性缓冲区加载为类型化数组，以便将模型精确投影到 2D。
 * @param {boolean} [options.enablePick=false] 如果<code>为 true</code>，则加载位置缓冲区、任何实例化属性缓冲区和索引缓冲区作为类型化数组，以便在 WebGL1 中启用CPU进行选择。
 * @param {boolean} [options.loadIndicesForWireframe=false] 如果<code>为 true</code>，则将索引缓冲区加载为类型化数组。这对于在 WebGL1 中创建线框索引很有用。
 * @param {boolean} [options.loadPrimitiveOutline=true] 如果<code>为 true</code>，则从 {@link https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展。可以将其设置为 false 以避免在加载时对几何体进行后处理。
 * @param {boolean} [options.loadForClassification=false] 如果为 <code>true</code>，并且模型具有特征 ID，则将特征 ID 和索引作为类型化数组加载。这对于对要素进行批处理以进行分类非常有用。
 * */
function B3dmLoader(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const b3dmResource = options.b3dmResource;
  let baseResource = options.baseResource;
  const arrayBuffer = options.arrayBuffer;
  const byteOffset = defaultValue(options.byteOffset, 0);
  const releaseGltfJson = defaultValue(options.releaseGltfJson, false);
  const asynchronous = defaultValue(options.asynchronous, true);
  const incrementallyLoadTextures = defaultValue(
    options.incrementallyLoadTextures,
    true,
  );
  const upAxis = defaultValue(options.upAxis, Axis.Y);
  const forwardAxis = defaultValue(options.forwardAxis, Axis.X);
  const loadAttributesAsTypedArray = defaultValue(
    options.loadAttributesAsTypedArray,
    false,
  );
  const loadAttributesFor2D = defaultValue(options.loadAttributesFor2D, false);
  const enablePick = defaultValue(options.enablePick, false);
  const loadIndicesForWireframe = defaultValue(
    options.loadIndicesForWireframe,
    false,
  );
  const loadPrimitiveOutline = defaultValue(options.loadPrimitiveOutline, true);
  const loadForClassification = defaultValue(
    options.loadForClassification,
    false,
  );

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.b3dmResource", b3dmResource);
  Check.typeOf.object("options.arrayBuffer", arrayBuffer);
  //>>includeEnd('debug');

  baseResource = defined(baseResource) ? baseResource : b3dmResource.clone();

  this._b3dmResource = b3dmResource;
  this._baseResource = baseResource;
  this._arrayBuffer = arrayBuffer;
  this._byteOffset = byteOffset;
  this._releaseGltfJson = releaseGltfJson;
  this._asynchronous = asynchronous;
  this._incrementallyLoadTextures = incrementallyLoadTextures;
  this._upAxis = upAxis;
  this._forwardAxis = forwardAxis;
  this._loadAttributesAsTypedArray = loadAttributesAsTypedArray;
  this._loadAttributesFor2D = loadAttributesFor2D;
  this._enablePick = enablePick;
  this._loadIndicesForWireframe = loadIndicesForWireframe;
  this._loadPrimitiveOutline = loadPrimitiveOutline;
  this._loadForClassification = loadForClassification;

  this._state = B3dmLoaderState.UNLOADED;

  this._promise = undefined;

  this._gltfLoader = undefined;

  // Loaded results.
  this._batchLength = 0;
  this._propertyTable = undefined;

  // The batch table object contains a json and a binary component access using keys of the same name.
  this._batchTable = undefined;
  this._components = undefined;
  this._transform = Matrix4.IDENTITY;
}

if (defined(Object.create)) {
  B3dmLoader.prototype = Object.create(ResourceLoader.prototype);
  B3dmLoader.prototype.constructor = B3dmLoader;
}

Object.defineProperties(B3dmLoader.prototype, {
  /**
   * 如果加载了纹理，则为 true，当 incrementallyLoadTextures 为 true 时很有用
   *
   * @memberof B3dmLoader.prototype
   *
   * @type {boolean}
   * @readonly
   * @private
   */
  texturesLoaded: {
    get: function () {
      return this._gltfLoader?.texturesLoaded;
    },
  },
  /**
   * 资源的 cache key
   *
   * @memberof B3dmLoader.prototype
   *
   * @type {string}
   * @readonly
   * @private
   */
  cacheKey: {
    get: function () {
      return undefined;
    },
  },

  /**
   *加载的组件。
   *
   * @memberof B3dmLoader.prototype
   *
   * @type {ModelComponents.Components}
   * @readonly
   * @private
   */
  components: {
    get: function () {
      return this._components;
    },
  },
});

/**
 * 加载资源。
 * @returns {Promise<B3dmLoader>} 当资源加载完成时，它解析给 loader 的 Promise。
 * @private
 */
B3dmLoader.prototype.load = function () {
  if (defined(this._promise)) {
    return this._promise;
  }

  const b3dm = B3dmParser.parse(this._arrayBuffer, this._byteOffset);

  let batchLength = b3dm.batchLength;
  const featureTableJson = b3dm.featureTableJson;
  const featureTableBinary = b3dm.featureTableBinary;
  const batchTableJson = b3dm.batchTableJson;
  const batchTableBinary = b3dm.batchTableBinary;

  const featureTable = new Cesium3DTileFeatureTable(
    featureTableJson,
    featureTableBinary,
  );
  batchLength = featureTable.getGlobalProperty("BATCH_LENGTH");
  // Set batch length.
  this._batchLength = batchLength;
  // Set the RTC Center transform, if present.
  const rtcCenter = featureTable.getGlobalProperty(
    "RTC_CENTER",
    ComponentDatatype.FLOAT,
    3,
  );
  if (defined(rtcCenter)) {
    this._transform = Matrix4.fromTranslation(Cartesian3.fromArray(rtcCenter));
  }

  this._batchTable = {
    json: batchTableJson,
    binary: batchTableBinary,
  };

  const gltfLoader = new GltfLoader({
    typedArray: b3dm.gltf,
    upAxis: this._upAxis,
    forwardAxis: this._forwardAxis,
    gltfResource: this._b3dmResource,
    baseResource: this._baseResource,
    releaseGltfJson: this._releaseGltfJson,
    incrementallyLoadTextures: this._incrementallyLoadTextures,
    loadAttributesAsTypedArray: this._loadAttributesAsTypedArray,
    loadAttributesFor2D: this._loadAttributesFor2D,
    enablePick: this._enablePick,
    loadIndicesForWireframe: this._loadIndicesForWireframe,
    loadPrimitiveOutline: this._loadPrimitiveOutline,
    loadForClassification: this._loadForClassification,
    renameBatchIdSemantic: true,
  });

  this._gltfLoader = gltfLoader;
  this._state = B3dmLoaderState.LOADING;

  const that = this;
  this._promise = gltfLoader
    .load()
    .then(function () {
      if (that.isDestroyed()) {
        return;
      }

      that._state = B3dmLoaderState.PROCESSING;
      return that;
    })
    .catch(function (error) {
      if (that.isDestroyed()) {
        return;
      }

      return handleError(that, error);
    });

  return this._promise;
};

function handleError(b3dmLoader, error) {
  b3dmLoader.unload();
  b3dmLoader._state = B3dmLoaderState.FAILED;
  const errorMessage = "Failed to load b3dm";
  error = b3dmLoader.getError(errorMessage, error);
  return Promise.reject(error);
}

B3dmLoader.prototype.process = function (frameState) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("frameState", frameState);
  //>>includeEnd('debug');

  if (this._state === B3dmLoaderState.READY) {
    return true;
  }

  if (this._state !== B3dmLoaderState.PROCESSING) {
    return false;
  }

  const ready = this._gltfLoader.process(frameState);
  if (!ready) {
    return false;
  }

  const components = this._gltfLoader.components;

  // Combine the RTC_CENTER transform from the b3dm and the CESIUM_RTC
  // transform from the glTF. In practice usually only one or the
  // other is supplied. If they don't exist the transforms will
  // be identity matrices.
  components.transform = Matrix4.multiplyTransformation(
    this._transform,
    components.transform,
    components.transform,
  );
  createStructuralMetadata(this, components);
  this._components = components;

  // Now that we have the parsed components, we can release the array buffer
  this._arrayBuffer = undefined;

  this._state = B3dmLoaderState.READY;
  return true;
};

function createStructuralMetadata(loader, components) {
  const batchTable = loader._batchTable;
  const batchLength = loader._batchLength;

  if (batchLength === 0) {
    return;
  }

  let structuralMetadata;
  if (defined(batchTable.json)) {
    // Add the structural metadata from the batch table to the model components.
    structuralMetadata = parseBatchTable({
      count: batchLength,
      batchTable: batchTable.json,
      binaryBody: batchTable.binary,
    });
  } else {
    // If batch table is not defined, create a property table without any properties.
    const emptyPropertyTable = new PropertyTable({
      name: MetadataClass.BATCH_TABLE_CLASS_NAME,
      count: batchLength,
    });
    structuralMetadata = new StructuralMetadata({
      schema: {},
      propertyTables: [emptyPropertyTable],
    });
  }

  // Add the feature ID attribute to the primitives.
  const nodes = components.scene.nodes;
  const length = nodes.length;
  for (let i = 0; i < length; i++) {
    processNode(nodes[i]);
  }
  components.structuralMetadata = structuralMetadata;
}

// Recursive function to add the feature ID attribute to all primitives that have a feature ID vertex attribute.
function processNode(node) {
  const childrenLength = node.children.length;
  for (let i = 0; i < childrenLength; i++) {
    processNode(node.children[i]);
  }

  const primitivesLength = node.primitives.length;
  for (let i = 0; i < primitivesLength; i++) {
    const primitive = node.primitives[i];
    const featureIdVertexAttribute = ModelUtility.getAttributeBySemantic(
      primitive,
      VertexAttributeSemantic.FEATURE_ID,
    );
    if (defined(featureIdVertexAttribute)) {
      featureIdVertexAttribute.setIndex = 0;
      const featureIdAttribute = new FeatureIdAttribute();
      featureIdAttribute.propertyTableId = 0;
      featureIdAttribute.setIndex = 0;
      featureIdAttribute.positionalLabel = "featureId_0";
      primitive.featureIds.push(featureIdAttribute);
    }
  }
}

B3dmLoader.prototype.unload = function () {
  if (defined(this._gltfLoader) && !this._gltfLoader.isDestroyed()) {
    this._gltfLoader.unload();
  }

  this._components = undefined;
  this._arrayBuffer = undefined;
};

export default B3dmLoader;
