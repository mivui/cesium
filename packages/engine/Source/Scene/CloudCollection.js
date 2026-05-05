import BlendingState from "./BlendingState.js";
import Buffer from "../Renderer/Buffer.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ComputeCommand from "../Renderer/ComputeCommand.js";
import CloudType from "./CloudType.js";
import CloudCollectionFS from "../Shaders/CloudCollectionFS.js";
import CloudCollectionVS from "../Shaders/CloudCollectionVS.js";
import CloudNoiseFS from "../Shaders/CloudNoiseFS.js";
import CloudNoiseVS from "../Shaders/CloudNoiseVS.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import CumulusCloud from "./CumulusCloud.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import EncodedCartesian3 from "../Core/EncodedCartesian3.js";
import IndexDatatype from "../Core/IndexDatatype.js";
import Pass from "../Renderer/Pass.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import PixelFormat from "../Core/PixelFormat.js";
import RenderState from "../Renderer/RenderState.js";
import Sampler from "../Renderer/Sampler.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import VertexArray from "../Renderer/VertexArray.js";
import VertexArrayFacade from "../Renderer/VertexArrayFacade.js";
import WebGLConstants from "../Core/WebGLConstants.js";

let attributeLocations;
const scratchTextureDimensions = new Cartesian3();

const attributeLocationsBatched = {
  positionHighAndScaleX: 0,
  positionLowAndScaleY: 1,
  packedAttribute0: 2, // show, brightness, direction
  packedAttribute1: 3, // cloudSize, slice
  color: 4,
};

const attributeLocationsInstanced = {
  direction: 0,
  positionHighAndScaleX: 1,
  positionLowAndScaleY: 2,
  packedAttribute0: 3, // show, brightness
  packedAttribute1: 4, // cloudSize, slice
  color: 5,
};

const SHOW_INDEX = CumulusCloud.SHOW_INDEX;
const POSITION_INDEX = CumulusCloud.POSITION_INDEX;
const SCALE_INDEX = CumulusCloud.SCALE_INDEX;
const MAXIMUM_SIZE_INDEX = CumulusCloud.MAXIMUM_SIZE_INDEX;
const SLICE_INDEX = CumulusCloud.SLICE_INDEX;
const BRIGHTNESS_INDEX = CumulusCloud.BRIGHTNESS_INDEX;
const NUMBER_OF_PROPERTIES = CumulusCloud.NUMBER_OF_PROPERTIES;
const COLOR_INDEX = CumulusCloud.COLOR_INDEX;

/**
 * 3D 场景中可渲染的云集合。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/CumulusCloud.png' width='400' height='300' /><br />
 * 示例积云
 * </div>
 * <br /><br />
 * 使用 {@link CloudCollection#add} 和 {@link CloudCollection#remove} 向集合添加和移除云。
 * @alias CloudCollection
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.show=true] 是否显示云。
 * @param {number} [options.noiseDetail=16.0] 噪声纹理中期望的 Detail 量。
 * @param {number} [options.noiseOffset=Cartesian3.ZERO] 噪声纹理中数据的期望平移。
 * @param {boolean} [options.debugBillboards=false] 仅用于调试。确定是否使用不透明颜色渲染广告牌。
 * @param {boolean} [options.debugEllipsoids=false] 仅用于调试。确定是否将云渲染为不透明椭球体。
 * @see CloudCollection#add
 * @see CloudCollection#remove
 * @see CumulusCloud
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=clouds|Cesium Sandcastle 云演示}
 * @demo {@link https://sandcastle.cesium.com/index.html?id=cloud-parameters|Cesium Sandcastle 云参数演示}
 *
 * @example
 * // 创建具有两个积云的云集合
 * const clouds = scene.primitives.add(new Cesium.CloudCollection());
 * clouds.add({
 *   position : new Cesium.Cartesian3(1.0, 2.0, 3.0),
 *   maximumSize: new Cesium.Cartesian3(20.0, 12.0, 8.0)
 * });
 * clouds.add({
 *   position : new Cesium.Cartesian3(4.0, 5.0, 6.0),
 *   maximumSize: new Cesium.Cartesian3(15.0, 9.0, 9.0),
 *   slice: 0.5
 * });
 *
 */
function CloudCollection(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._clouds = [];
  this._cloudsToUpdate = [];
  this._cloudsToUpdateIndex = 0;
  this._cloudsRemoved = false;
  this._createVertexArray = false;

  this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);

  this._noiseTexture = undefined;
  this._textureSliceWidth = 128;
  this._noiseTextureRows = 4;

  /**
   * <p>
   * 控制在预计算噪声纹理中捕获的 Detail 量，
   * 用于渲染积云。为了使纹理可平铺，
   * 这必须是 2 的幂。为了获得最佳结果，将其设置为
   * <code>8.0</code> 到 <code>32.0</code>（含）之间的 2 的幂。
   * </p>
   *
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'>
   *   <code>clouds.noiseDetail = 8.0;</code><br/>
   *   <img src='Images/CloudCollection.noiseDetail8.png' width='250' height='158' />
   * </td>
   * <td align='center'>
   *   <code>clouds.noiseDetail = 32.0;</code><br/>
   *   <img src='Images/CloudCollection.noiseDetail32.png' width='250' height='158' />
   * </td>
   * </tr></table>
   * </div>
   *
   * @type {number}
   *
   * @default 16.0
   */
  this.noiseDetail = options.noiseDetail ?? 16.0;

  /**
   * <p>
   * 对噪声纹理坐标应用平移以生成不同的数据。
   * 如果默认噪声不能生成美观的云，可以修改此项。
   * </p>
   *
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'>
   *   <code>default</code><br/>
   *   <img src='Images/CloudCollection.noiseOffsetdefault.png' width='250' height='158' />
   * </td>
   * <td align='center'>
   *   <code>clouds.noiseOffset = new Cesium.Cartesian3(10, 20, 10);</code><br/>
   *   <img src='Images/CloudCollection.noiseOffsetx10y20z10.png' width='250' height='158' />
   * </td>
   * </tr></table>
   * </div>
   * @type {Cartesian3}
   *
   * @default Cartesian3.ZERO
   */
  this.noiseOffset = Cartesian3.clone(options.noiseOffset ?? Cartesian3.ZERO);

  this._loading = false;
  this._ready = false;

  const that = this;
  this._uniforms = {
    u_noiseTexture: function () {
      return that._noiseTexture;
    },
    u_noiseTextureDimensions: getNoiseTextureDimensions(that),
    u_noiseDetail: function () {
      return that.noiseDetail;
    },
  };

  this._vaNoise = undefined;
  this._spNoise = undefined;

  this._spCreated = false;
  this._sp = undefined;
  this._rs = undefined;

  /**
   * 确定此集合中的广告牌是否将显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = options.show ?? true;

  this._colorCommands = [];

  /**
   * 此属性仅用于调试；不用于生产环境且未进行优化。
   * <p>
   * 使用一种不透明颜色渲染广告牌以进行调试。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugBillboards = options.debugBillboards ?? false;
  this._compiledDebugBillboards = false;

  /**
   * 此属性仅用于调试；不用于生产环境且未进行优化。
   * <p>
   * 将云绘制为不透明的单色椭球体以进行调试。
   * 如果 <code>debugBillboards</code> 也为 true，则椭球体将绘制在广告牌之上。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugEllipsoids = options.debugEllipsoids ?? false;
  this._compiledDebugEllipsoids = false;
}

// Wraps useful texture metrics into a single vec3 for less overhead.
function getNoiseTextureDimensions(collection) {
  return function () {
    scratchTextureDimensions.x = collection._textureSliceWidth;
    scratchTextureDimensions.y = collection._noiseTextureRows;
    scratchTextureDimensions.z = 1.0 / collection._noiseTextureRows;
    return scratchTextureDimensions;
  };
}

Object.defineProperties(CloudCollection.prototype, {
  /**
   * 返回此集合中云的数量。
   * @memberof CloudCollection.prototype
   * @type {number}
   */
  length: {
    get: function () {
      removeClouds(this);
      return this._clouds.length;
    },
  },
});

function destroyClouds(clouds) {
  const length = clouds.length;
  for (let i = 0; i < length; ++i) {
    if (clouds[i]) {
      clouds[i]._destroy();
    }
  }
}

/**
 * 创建具有指定初始属性的云并将其添加到集合中。
 * 返回添加的云，以便稍后可以修改或从集合中移除。
 *
 * @param {object}[options] 描述云属性的模板，如示例 1 所示。
 * @returns {CumulusCloud} 添加到集合的云。
 *
 * @performance 调用 <code>add</code> 预期为常数时间。但是，集合的顶点缓冲区
 * 会被重写——这是一个 <code>O(n)</code> 操作，也会产生 CPU 到 GPU 的开销。为了
 * 获得最佳性能，在调用 <code>update</code> 之前添加尽可能多的云。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * // 示例 1：添加积云，指定所有默认值。
 * const c = clouds.add({
 *   show : true,
 *   position : Cesium.Cartesian3.ZERO,
 *   scale : new Cesium.Cartesian2(20.0, 12.0),
 *   maximumSize: new Cesium.Cartesian3(20.0, 12.0, 12.0),
 *   slice: -1.0,
 *   cloudType : CloudType.CUMULUS
 * });
 *
 * @example
 * // 示例 2：仅指定云的笛卡尔位置。
 * const c = clouds.add({
 *   position : Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
 * });
 *
 * @see CloudCollection#remove
 * @see CloudCollection#removeAll
 */
CloudCollection.prototype.add = function (options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const cloudType = options.cloudType ?? CloudType.CUMULUS;
  //>>includeStart('debug', pragmas.debug);
  if (!CloudType.validate(cloudType)) {
    throw new DeveloperError("invalid cloud type");
  }
  //>>includeEnd('debug');

  let cloud;
  if (cloudType === CloudType.CUMULUS) {
    cloud = new CumulusCloud(options, this);
    cloud._index = this._clouds.length;
    this._clouds.push(cloud);
    this._createVertexArray = true;
  }

  return cloud;
};

/**
 * 从集合中移除云。
 *
 * @param {CumulusCloud} cloud 要移除的云。
 * @returns {boolean} 如果云被移除则返回 <code>true</code>；如果在集合中未找到云则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * const c = clouds.add(...);
 * clouds.remove(c);  // 返回 true
 *
 * @see CloudCollection#add
 * @see CloudCollection#removeAll
 * @see CumulusCloud#show
 */
CloudCollection.prototype.remove = function (cloud) {
  if (this.contains(cloud)) {
    this._clouds[cloud._index] = undefined; // Removed later in removeClouds()
    this._cloudsRemoved = true;
    this._createVertexArray = true;
    cloud._destroy();
    return true;
  }

  return false;
};

/**
 * 从集合中移除所有云。
 *
 * @performance <code>O(n)</code>。从集合中移除所有云
 * 然后添加新云比完全创建新集合更高效。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * clouds.add(...);
 * clouds.add(...);
 * clouds.removeAll();
 *
 * @see CloudCollection#add
 * @see CloudCollection#remove
 */
CloudCollection.prototype.removeAll = function () {
  destroyClouds(this._clouds);
  this._clouds = [];
  this._cloudsToUpdate = [];
  this._cloudsToUpdateIndex = 0;
  this._cloudsRemoved = false;

  this._createVertexArray = true;
};

function removeClouds(cloudCollection) {
  if (cloudCollection._cloudsRemoved) {
    cloudCollection._cloudsRemoved = false;

    const newClouds = [];
    const clouds = cloudCollection._clouds;
    const length = clouds.length;
    for (let i = 0, j = 0; i < length; ++i) {
      const cloud = clouds[i];
      if (defined(cloud)) {
        clouds._index = j++;
        newClouds.push(cloud);
      }
    }

    cloudCollection._clouds = newClouds;
  }
}

CloudCollection.prototype._updateCloud = function (cloud, propertyChanged) {
  if (!cloud._dirty) {
    this._cloudsToUpdate[this._cloudsToUpdateIndex++] = cloud;
  }

  ++this._propertiesChanged[propertyChanged];
};

/**
 * 检查此集合是否包含给定的云。
 *
 * @param {CumulusCloud} [cloud] 要检查的云。
 * @returns {boolean} 如果此集合包含云则返回 true，否则返回 false。
 *
 * @see CloudCollection#get
 */
CloudCollection.prototype.contains = function (cloud) {
  return defined(cloud) && cloud._cloudCollection === this;
};

/**
 * 返回集合中指定索引处的云。索引从零开始
 * 随着添加云而增加。移除云会将其后的所有云左移，
 * 更改它们的索引。此函数通常与
 * {@link CloudCollection#length} 一起使用以遍历集合中的所有云。
 *
 * @param {number} index 云的从零开始的索引。
 * @returns {CumulusCloud} 指定索引处的云。
 *
 * @performance 预期为常数时间。如果从集合中移除了云且
 * 未调用 {@link CloudCollection#update}，则执行隐式的 <code>O(n)</code>
 * 操作。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * // 切换集合中每个云的显示属性
 * const len = clouds.length;
 * for (let i = 0; i < len; ++i) {
 *   const c = clouds.get(i);
 *   c.show = !c.show;
 * }
 *
 * @see CloudCollection#length
 */
CloudCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  removeClouds(this);
  return this._clouds[index];
};

const texturePositions = new Float32Array([
  -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
]);

const textureIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

function createTextureVA(context) {
  const positionBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: texturePositions,
    usage: BufferUsage.STATIC_DRAW,
  });
  const indexBuffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: textureIndices,
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT,
  });

  const attributes = [
    {
      index: 0,
      vertexBuffer: positionBuffer,
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
    },
  ];

  return new VertexArray({
    context: context,
    attributes: attributes,
    indexBuffer: indexBuffer,
  });
}

let getIndexBuffer;

function getIndexBufferBatched(context) {
  const sixteenK = 16 * 1024;

  let indexBuffer = context.cache.cloudCollection_indexBufferBatched;
  if (defined(indexBuffer)) {
    return indexBuffer;
  }

  // Subtract 6 because the last index is reserved for primitive restart.
  // https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.18
  const length = sixteenK * 6 - 6;
  const indices = new Uint16Array(length);
  for (let i = 0, j = 0; i < length; i += 6, j += 4) {
    indices[i] = j;
    indices[i + 1] = j + 1;
    indices[i + 2] = j + 2;

    indices[i + 3] = j;
    indices[i + 4] = j + 2;
    indices[i + 5] = j + 3;
  }

  indexBuffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: indices,
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT,
  });
  indexBuffer.vertexArrayDestroyable = false;
  context.cache.cloudCollection_indexBufferBatched = indexBuffer;
  return indexBuffer;
}

function getIndexBufferInstanced(context) {
  let indexBuffer = context.cache.cloudCollection_indexBufferInstanced;
  if (defined(indexBuffer)) {
    return indexBuffer;
  }

  indexBuffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: new Uint16Array([0, 1, 2, 0, 2, 3]),
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT,
  });

  indexBuffer.vertexArrayDestroyable = false;
  context.cache.cloudCollection_indexBufferInstanced = indexBuffer;
  return indexBuffer;
}

function getVertexBufferInstanced(context) {
  let vertexBuffer = context.cache.cloudCollection_vertexBufferInstanced;
  if (defined(vertexBuffer)) {
    return vertexBuffer;
  }

  vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
    usage: BufferUsage.STATIC_DRAW,
  });

  vertexBuffer.vertexArrayDestroyable = false;
  context.cache.cloudCollection_vertexBufferInstanced = vertexBuffer;
  return vertexBuffer;
}

function createVAF(context, numberOfClouds, instanced) {
  const attributes = [
    {
      index: attributeLocations.positionHighAndScaleX,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: BufferUsage.STATIC_DRAW,
    },
    {
      index: attributeLocations.positionLowAndScaleY,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: BufferUsage.STATIC_DRAW,
    },
    {
      index: attributeLocations.packedAttribute0,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: BufferUsage.STATIC_DRAW,
    },
    {
      index: attributeLocations.packedAttribute1,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: BufferUsage.STATIC_DRAW,
    },
    {
      index: attributeLocations.color,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
      normalize: true,
      usage: BufferUsage.STATIC_DRAW,
    },
  ];

  if (instanced) {
    attributes.push({
      index: attributeLocations.direction,
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
      vertexBuffer: getVertexBufferInstanced(context),
    });
  }

  const sizeInVertices = instanced ? numberOfClouds : 4 * numberOfClouds;
  return new VertexArrayFacade(context, attributes, sizeInVertices, instanced);
}

const writePositionScratch = new EncodedCartesian3();

function writePositionAndScale(cloudCollection, frameState, vafWriters, cloud) {
  let i;
  const positionHighWriter =
    vafWriters[attributeLocations.positionHighAndScaleX];
  const positionLowWriter = vafWriters[attributeLocations.positionLowAndScaleY];
  const position = cloud.position;

  EncodedCartesian3.fromCartesian(position, writePositionScratch);
  const scale = cloud.scale;

  const high = writePositionScratch.high;
  const low = writePositionScratch.low;

  if (cloudCollection._instanced) {
    i = cloud._index;
    positionHighWriter(i, high.x, high.y, high.z, scale.x);
    positionLowWriter(i, low.x, low.y, low.z, scale.y);
  } else {
    i = cloud._index * 4;
    positionHighWriter(i + 0, high.x, high.y, high.z, scale.x);
    positionHighWriter(i + 1, high.x, high.y, high.z, scale.x);
    positionHighWriter(i + 2, high.x, high.y, high.z, scale.x);
    positionHighWriter(i + 3, high.x, high.y, high.z, scale.x);

    positionLowWriter(i + 0, low.x, low.y, low.z, scale.y);
    positionLowWriter(i + 1, low.x, low.y, low.z, scale.y);
    positionLowWriter(i + 2, low.x, low.y, low.z, scale.y);
    positionLowWriter(i + 3, low.x, low.y, low.z, scale.y);
  }
}

function writePackedAttribute0(cloudCollection, frameState, vafWriters, cloud) {
  let i;
  const writer = vafWriters[attributeLocations.packedAttribute0];
  const show = cloud.show;
  const brightness = cloud.brightness;

  if (cloudCollection._instanced) {
    i = cloud._index;
    writer(i, show, brightness, 0.0, 0.0);
  } else {
    i = cloud._index * 4;
    writer(i + 0, show, brightness, 0.0, 0.0);
    writer(i + 1, show, brightness, 1.0, 0.0);
    writer(i + 2, show, brightness, 1.0, 1.0);
    writer(i + 3, show, brightness, 0.0, 1.0);
  }
}

function writePackedAttribute1(cloudCollection, frameState, vafWriters, cloud) {
  let i;
  const writer = vafWriters[attributeLocations.packedAttribute1];
  const maximumSize = cloud.maximumSize;
  const slice = cloud.slice;

  if (cloudCollection._instanced) {
    i = cloud._index;
    writer(i, maximumSize.x, maximumSize.y, maximumSize.z, slice);
  } else {
    i = cloud._index * 4;
    writer(i + 0, maximumSize.x, maximumSize.y, maximumSize.z, slice);
    writer(i + 1, maximumSize.x, maximumSize.y, maximumSize.z, slice);
    writer(i + 2, maximumSize.x, maximumSize.y, maximumSize.z, slice);
    writer(i + 3, maximumSize.x, maximumSize.y, maximumSize.z, slice);
  }
}

function writeColor(cloudCollection, frameState, vafWriters, cloud) {
  let i;
  const writer = vafWriters[attributeLocations.color];
  const color = cloud.color;
  const red = Color.floatToByte(color.red);
  const green = Color.floatToByte(color.green);
  const blue = Color.floatToByte(color.blue);
  const alpha = Color.floatToByte(color.alpha);

  if (cloudCollection._instanced) {
    i = cloud._index;
    writer(i, red, green, blue, alpha);
  } else {
    i = cloud._index * 4;
    writer(i + 0, red, green, blue, alpha);
    writer(i + 1, red, green, blue, alpha);
    writer(i + 2, red, green, blue, alpha);
    writer(i + 3, red, green, blue, alpha);
  }
}
function writeCloud(cloudCollection, frameState, vafWriters, cloud) {
  writePositionAndScale(cloudCollection, frameState, vafWriters, cloud);
  writePackedAttribute0(cloudCollection, frameState, vafWriters, cloud);
  writePackedAttribute1(cloudCollection, frameState, vafWriters, cloud);
  writeColor(cloudCollection, frameState, vafWriters, cloud);
}

function createNoiseTexture(cloudCollection, frameState, vsSource, fsSource) {
  const that = cloudCollection;

  const textureSliceWidth = that._textureSliceWidth;
  const noiseTextureRows = that._noiseTextureRows;
  //>>includeStart('debug', pragmas.debug);
  if (
    textureSliceWidth / noiseTextureRows < 1 ||
    textureSliceWidth % noiseTextureRows !== 0
  ) {
    throw new DeveloperError(
      "noiseTextureRows must evenly divide textureSliceWidth",
    );
  }
  //>>includeEnd('debug');

  const context = frameState.context;
  that._vaNoise = createTextureVA(context);
  that._spNoise = ShaderProgram.fromCache({
    context: context,
    vertexShaderSource: vsSource,
    fragmentShaderSource: fsSource,
    attributeLocations: {
      position: 0,
    },
  });

  const noiseDetail = that.noiseDetail;
  const noiseOffset = that.noiseOffset;

  that._noiseTexture = new Texture({
    context: context,
    width: (textureSliceWidth * textureSliceWidth) / noiseTextureRows,
    height: textureSliceWidth * noiseTextureRows,
    pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
    pixelFormat: PixelFormat.RGBA,
    sampler: new Sampler({
      wrapS: TextureWrap.REPEAT,
      wrapT: TextureWrap.REPEAT,
      minificationFilter: TextureMinificationFilter.NEAREST,
      magnificationFilter: TextureMagnificationFilter.NEAREST,
    }),
  });

  const textureCommand = new ComputeCommand({
    vertexArray: that._vaNoise,
    shaderProgram: that._spNoise,
    outputTexture: that._noiseTexture,
    uniformMap: {
      u_noiseTextureDimensions: getNoiseTextureDimensions(that),
      u_noiseDetail: function () {
        return noiseDetail;
      },
      u_noiseOffset: function () {
        return noiseOffset;
      },
    },
    persists: false,
    owner: cloudCollection,
    postExecute: function (texture) {
      that._ready = true;
      that._loading = false;
    },
  });

  frameState.commandList.push(textureCommand);
  that._loading = true;
}

function createVertexArray(cloudCollection, frameState) {
  const that = cloudCollection;
  const context = frameState.context;
  that._createVertexArray = false;
  that._vaf = that._vaf && that._vaf.destroy();

  const clouds = cloudCollection._clouds;
  const cloudsLength = clouds.length;
  if (cloudsLength > 0) {
    that._vaf = createVAF(context, cloudsLength, that._instanced);
    const vafWriters = that._vaf.writers;

    let i;
    // Rewrite entire buffer if clouds were added or removed.
    for (i = 0; i < cloudsLength; ++i) {
      const cloud = clouds[i];
      writeCloud(cloudCollection, frameState, vafWriters, cloud);
    }

    // Different cloud collections share the same index buffer.
    that._vaf.commit(getIndexBuffer(context));
  }
}

const scratchWriterArray = [];

function updateClouds(cloudCollection, frameState) {
  const context = frameState.context;
  const that = cloudCollection;
  const clouds = that._clouds;
  const cloudsLength = clouds.length;
  const cloudsToUpdate = that._cloudsToUpdate;
  const cloudsToUpdateLength = that._cloudsToUpdateIndex;

  const properties = that._propertiesChanged;

  const writers = scratchWriterArray;
  writers.length = 0;

  if (properties[POSITION_INDEX] || properties[SCALE_INDEX]) {
    writers.push(writePositionAndScale);
  }

  if (properties[SHOW_INDEX] || properties[BRIGHTNESS_INDEX]) {
    writers.push(writePackedAttribute0);
  }

  if (properties[MAXIMUM_SIZE_INDEX] || properties[SLICE_INDEX]) {
    writers.push(writePackedAttribute1);
  }

  if (properties[COLOR_INDEX]) {
    writers.push(writeColor);
  }

  const numWriters = writers.length;
  const vafWriters = that._vaf.writers;

  let i, c, w;
  if (cloudsToUpdateLength / cloudsLength > 0.1) {
    // Like BillboardCollection, if more than 10% of clouds change,
    // rewrite the entire buffer.

    for (i = 0; i < cloudsToUpdateLength; ++i) {
      c = cloudsToUpdate[i];
      c._dirty = false;

      for (w = 0; w < numWriters; ++w) {
        writers[w](cloudCollection, frameState, vafWriters, c);
      }
    }

    that._vaf.commit(getIndexBuffer(context));
  } else {
    for (i = 0; i < cloudsToUpdateLength; ++i) {
      c = cloudsToUpdate[i];
      c._dirty = false;

      for (w = 0; w < numWriters; ++w) {
        writers[w](cloudCollection, frameState, vafWriters, c);
      }

      if (that._instanced) {
        that._vaf.subCommit(c._index, 1);
      } else {
        that._vaf.subCommit(c._index * 4, 4);
      }
    }
    that._vaf.endSubCommits();
  }

  that._cloudsToUpdateIndex = 0;
}

function createShaderProgram(cloudCollection, frameState, vsSource, fsSource) {
  const context = frameState.context;
  const that = cloudCollection;
  const vs = new ShaderSource({
    defines: [],
    sources: [vsSource],
  });

  if (that._instanced) {
    vs.defines.push("INSTANCED");
  }

  const fs = new ShaderSource({
    defines: [],
    sources: [fsSource],
  });

  if (that.debugBillboards) {
    fs.defines.push("DEBUG_BILLBOARDS");
  }

  if (that.debugEllipsoids) {
    fs.defines.push("DEBUG_ELLIPSOIDS");
  }

  that._sp = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: that._sp,
    vertexShaderSource: vs,
    fragmentShaderSource: fs,
    attributeLocations: attributeLocations,
  });

  that._rs = RenderState.fromCache({
    depthTest: {
      enabled: true,
      func: WebGLConstants.LESS,
    },
    depthMask: false,
    blending: BlendingState.ALPHA_BLEND,
  });

  that._spCreated = true;
  that._compiledDebugBillboards = that.debugBillboards;
  that._compiledDebugEllipsoids = that.debugEllipsoids;
}

function createDrawCommands(cloudCollection, frameState) {
  const that = cloudCollection;
  const pass = frameState.passes;
  const uniforms = that._uniforms;
  const commandList = frameState.commandList;
  if (pass.render) {
    const colorList = that._colorCommands;

    const va = that._vaf.va;
    const vaLength = va.length;
    colorList.length = vaLength;
    for (let i = 0; i < vaLength; i++) {
      let command = colorList[i];
      if (!defined(command)) {
        command = colorList[i] = new DrawCommand();
      }
      command.pass = Pass.TRANSLUCENT;
      command.owner = cloudCollection;
      command.uniformMap = uniforms;
      command.count = va[i].indicesCount;
      command.vertexArray = va[i].va;
      command.shaderProgram = that._sp;
      command.renderState = that._rs;
      if (that._instanced) {
        command.count = 6;
        command.instanceCount = that._clouds.length;
      }

      commandList.push(command);
    }
  }
}

/**
 * @private
 */
CloudCollection.prototype.update = function (frameState) {
  removeClouds(this);
  if (!this.show) {
    return;
  }

  const debugging = this.debugBillboards || this.debugEllipsoids;
  this._ready = debugging ? true : defined(this._noiseTexture);

  if (!this._ready && !this._loading && !debugging) {
    createNoiseTexture(this, frameState, CloudNoiseVS, CloudNoiseFS);
  }

  this._instanced = frameState.context.instancedArrays;
  attributeLocations = this._instanced
    ? attributeLocationsInstanced
    : attributeLocationsBatched;
  getIndexBuffer = this._instanced
    ? getIndexBufferInstanced
    : getIndexBufferBatched;

  const clouds = this._clouds;
  const cloudsLength = clouds.length;
  const cloudsToUpdate = this._cloudsToUpdate;
  const cloudsToUpdateLength = this._cloudsToUpdateIndex;

  if (this._createVertexArray) {
    createVertexArray(this, frameState);
  } else if (cloudsToUpdateLength > 0) {
    // Clouds were modified, but none were added or removed.
    updateClouds(this, frameState);
  }

  // If the number of total clouds ever shrinks considerably,
  // truncate cloudsToUpdate so that we free memory that
  // we are no longer using.
  if (cloudsToUpdateLength > cloudsLength * 1.5) {
    cloudsToUpdate.length = cloudsLength;
  }

  if (
    !defined(this._vaf) ||
    !defined(this._vaf.va) ||
    !this._ready & !debugging
  ) {
    return;
  }

  if (
    !this._spCreated ||
    this.debugBillboards !== this._compiledDebugBillboards ||
    this.debugEllipsoids !== this._compiledDebugEllipsoids
  ) {
    createShaderProgram(this, frameState, CloudCollectionVS, CloudCollectionFS);
  }

  createDrawCommands(this, frameState);
};

/**
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see CloudCollection#destroy
 */
CloudCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁此对象。
 * <br /><br />
 * 对象销毁后不应再使用；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。因此，
 * 如示例所示，将返回值（<code>undefined</code>）赋给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * clouds = clouds && clouds.destroy();
 *
 * @see CloudCollection#isDestroyed
 */
CloudCollection.prototype.destroy = function () {
  this._noiseTexture = this._noiseTexture && this._noiseTexture.destroy();
  this._sp = this._sp && this._sp.destroy();
  this._vaf = this._vaf && this._vaf.destroy();

  destroyClouds(this._clouds);

  return destroyObject(this);
};

export default CloudCollection;
