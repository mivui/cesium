import AttributeCompression from "../Core/AttributeCompression.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Intersect from "../Core/Intersect.js";
import Matrix4 from "../Core/Matrix4.js";
import PixelFormat from "../Core/PixelFormat.js";
import Plane from "../Core/Plane.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import Sampler from "../Renderer/Sampler.js";
import Texture from "../Renderer/Texture.js";
import ClippingPlane from "./ClippingPlane.js";

/**
 * 指定一组剪切平面。剪切平面选择性地禁用
 * 超出单个 gltf 模型、3D 瓦片集或地球的指定 {@link ClippingPlane} 对象列表。
 * <p>
 * 通常，裁剪平面的坐标是相对于它们所附加到的对象而言的，因此距离设置为 0 的平面将进行裁剪
 * 通过对象的中心。
 * </p>
 * <p>
 * 对于 3D 瓦片，根瓦片的变换用于定位剪切平面。如果未定义变换，则改用根图块的 {@link Cesium3DTile#boundingSphere}。
 * </p>
 *
 * @alias ClippingPlaneCollection
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {ClippingPlane[]} [options.planes=[]] 一个 {@link ClippingPlane} 对象的数组，用于选择性地禁用每个平面外部的渲染。
 * @param {boolean} [options.enabled=true] 确定剪切平面是否处于活动状态。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 4x4 变换矩阵，指定相对于剪切平面原始坐标系的附加变换。
 * @param {boolean} [options.unionClippingRegions=false] 如果为 true，则如果某个区域位于集合中任何平面的外部，则该区域将被剪切。否则，只有当一个区域位于每个平面的外部时，它才会被剪切。
 * @param {Color} [options.edgeColor=Color.WHITE] 用于高亮显示对象剪切沿的边缘的颜色。
 * @param {number} [options.edgeWidth=0.0] 应用于剪切对象所沿的边缘的高光的宽度（以像素为单位）。
 *
 * @demo {@link https://sandcastle.cesium.com/?src=3D%20Tiles%20Clipping%20Planes.html|Clipping 3D Tiles and glTF models.}
 * @demo {@link https://sandcastle.cesium.com/?src=Terrain%20Clipping%20Planes.html|Clipping the Globe.}
 *
 * @example
 * // This clipping plane's distance is positive, which means its normal
 * // is facing the origin. This will clip everything that is behind
 * // the plane, which is anything with y coordinate < -5.
 * const clippingPlanes = new Cesium.ClippingPlaneCollection({
 *     planes : [
 *         new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 5.0)
 *     ],
 * });
 * // Create an entity and attach the ClippingPlaneCollection to the model.
 * const entity = viewer.entities.add({
 *     position : Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 10000),
 *     model : {
 *         uri : 'model.gltf',
 *         minimumPixelSize : 128,
 *         maximumScale : 20000,
 *         clippingPlanes : clippingPlanes
 *     }
 * });
 * viewer.zoomTo(entity);
 */
function ClippingPlaneCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._planes = [];

  // Do partial texture updates if just one plane is dirty.
  // If many planes are dirty, refresh the entire texture.
  this._dirtyIndex = -1;
  this._multipleDirtyPlanes = false;

  this._enabled = defaultValue(options.enabled, true);

  /**
   * 指定相对于剪切平面的其他转换的 4x4 转换矩阵
   * 原始坐标系。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY)
  );

  /**
   * 用于高亮显示剪切对象时所沿的边缘的颜色。
   *
   * @type {Color}
   * @default Color.WHITE
   */
  this.edgeColor = Color.clone(defaultValue(options.edgeColor, Color.WHITE));

  /**
   * 应用于剪切对象所沿的边缘的高光的宽度（以像素为单位）。
   *
   * @type {number}
   * @default 0.0
   */
  this.edgeWidth = defaultValue(options.edgeWidth, 0.0);

  /**
   * 将新的剪切平面添加到集合时触发的事件。 事件处理程序
   * 将传递新平面和添加它的索引。
   * @type {Event}
   * @default Event()
   */
  this.planeAdded = new Event();

  /**
   * 从集合中删除新的剪切平面时触发的事件。 事件处理程序
   * 将传递新平面和从中删除它的索引。
   * @type {Event}
   * @default Event()
   */
  this.planeRemoved = new Event();

  // If this ClippingPlaneCollection has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference the tileset's ClippingPlaneCollection.
  this._owner = undefined;

  const unionClippingRegions = defaultValue(
    options.unionClippingRegions,
    false
  );
  this._unionClippingRegions = unionClippingRegions;
  this._testIntersection = unionClippingRegions
    ? unionIntersectFunction
    : defaultIntersectFunction;

  this._uint8View = undefined;
  this._float32View = undefined;

  this._clippingPlanesTexture = undefined;

  // Add each ClippingPlane object.
  const planes = options.planes;
  if (defined(planes)) {
    const planesLength = planes.length;
    for (let i = 0; i < planesLength; ++i) {
      this.add(planes[i]);
    }
  }
}

function unionIntersectFunction(value) {
  return value === Intersect.OUTSIDE;
}

function defaultIntersectFunction(value) {
  return value === Intersect.INSIDE;
}

Object.defineProperties(ClippingPlaneCollection.prototype, {
  /**
   * 返回此集合中的平面数。 这通常与
   * {@link ClippingPlaneCollection#get} 遍历所有平面
   * 在集合中。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._planes.length;
    },
  },

  /**
   * 如果为 true，则如果区域位于
   *收集。否则，只有当区域位于
   * 在每个平面之外。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {boolean}
   * @default false
   */
  unionClippingRegions: {
    get: function () {
      return this._unionClippingRegions;
    },
    set: function (value) {
      if (this._unionClippingRegions === value) {
        return;
      }
      this._unionClippingRegions = value;
      this._testIntersection = value
        ? unionIntersectFunction
        : defaultIntersectFunction;
    },
  },

  /**
   * 如果为 true，则将启用剪辑。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {boolean}
   * @default true
   */
  enabled: {
    get: function () {
      return this._enabled;
    },
    set: function (value) {
      if (this._enabled === value) {
        return;
      }
      this._enabled = value;
    },
  },

  /**
   * 返回包含打包的、未变换的剪切平面的纹理。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  texture: {
    get: function () {
      return this._clippingPlanesTexture;
    },
  },

  /**
   * 对 ClippingPlaneCollection 的所有者的引用（如果有）。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @readonly
   * @private
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },

  /**
   * 返回一个 Number，用于封装此 ClippingPlaneCollection 的状态。
   *
   * 削波模式以数字的符号编码，这只是平面数。
   * 如果此值更改，则需要着色器重新生成。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @returns {number} 描述 ClippingPlaneCollection 状态的 Number。
   * @readonly
   * @private
   */
  clippingPlanesState: {
    get: function () {
      return this._unionClippingRegions
        ? this._planes.length
        : -this._planes.length;
    },
  },
});

function setIndexDirty(collection, index) {
  // If there's already a different _dirtyIndex set, more than one plane has changed since update.
  // Entire texture must be reloaded
  collection._multipleDirtyPlanes =
    collection._multipleDirtyPlanes ||
    (collection._dirtyIndex !== -1 && collection._dirtyIndex !== index);
  collection._dirtyIndex = index;
}

/**
 * 将指定的 {@link ClippingPlane} 添加到集合中，以用于选择性地禁用渲染
 * 在每个平面的外侧。使用 {@link ClippingPlaneCollection#unionClippingRegions} 修改
 * 如何修改多个基准面的裁剪行为。
 *
 * @param {ClippingPlane} plane 要添加到集合的 ClippingPlane。
 *
 * @see ClippingPlaneCollection#unionClippingRegions
 * @see ClippingPlaneCollection#remove
 * @see ClippingPlaneCollection#removeAll
 */
ClippingPlaneCollection.prototype.add = function (plane) {
  const newPlaneIndex = this._planes.length;

  const that = this;
  plane.onChangeCallback = function (index) {
    setIndexDirty(that, index);
  };
  plane.index = newPlaneIndex;

  setIndexDirty(this, newPlaneIndex);
  this._planes.push(plane);
  this.planeAdded.raiseEvent(plane, newPlaneIndex);
};

/**
 * 返回集合中指定索引处的平面。 索引从 0 开始
 * 并随着平面的添加而增加。 移除基准面时，所有基准面都会移动
 * 它向左移动，更改其索引。 此功能通常用于
 * {@link ClippingPlaneCollection#length} 迭代所有平面
 * 在集合中。
 *
 * @param {number} index 平面的从零开始的索引。
 * @returns {ClippingPlane} 指定索引处的 ClippingPlane。
 *
 * @see ClippingPlaneCollection#length
 */
ClippingPlaneCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  return this._planes[index];
};

function indexOf(planes, plane) {
  const length = planes.length;
  for (let i = 0; i < length; ++i) {
    if (Plane.equals(planes[i], plane)) {
      return i;
    }
  }

  return -1;
}

/**
 * 检查此集合是否包含等于给定 ClippingPlane 的 ClippingPlane。
 *
 * @param {ClippingPlane} [clippingPlane] 要检查的 ClippingPlane。
 * @returns {boolean}  如果此集合包含 ClippingPlane，则 true， 否则为 false。
 *
 * @see ClippingPlaneCollection#get
 */
ClippingPlaneCollection.prototype.contains = function (clippingPlane) {
  return indexOf(this._planes, clippingPlane) !== -1;
};

/**
 * 从集合中删除给定 ClippingPlane 的第一个匹配项。
 *
 * @param {ClippingPlane} clippingPlane
 * @returns {boolean} 如果飞机被移除，<code>则为 true</code>;如果在集合中找不到该平面，<code>则为 false</code>。
 *
 * @see ClippingPlaneCollection#add
 * @see ClippingPlaneCollection#contains
 * @see ClippingPlaneCollection#removeAll
 */
ClippingPlaneCollection.prototype.remove = function (clippingPlane) {
  const planes = this._planes;
  const index = indexOf(planes, clippingPlane);

  if (index === -1) {
    return false;
  }

  // Unlink this ClippingPlaneCollection from the ClippingPlane
  if (clippingPlane instanceof ClippingPlane) {
    clippingPlane.onChangeCallback = undefined;
    clippingPlane.index = -1;
  }

  // Shift and update indices
  const length = planes.length - 1;
  for (let i = index; i < length; ++i) {
    const planeToKeep = planes[i + 1];
    planes[i] = planeToKeep;
    if (planeToKeep instanceof ClippingPlane) {
      planeToKeep.index = i;
    }
  }

  // Indicate planes texture is dirty
  this._multipleDirtyPlanes = true;
  planes.length = length;

  this.planeRemoved.raiseEvent(clippingPlane, index);

  return true;
};

/**
 * 从集合中删除所有平面。
 *
 * @see ClippingPlaneCollection#add
 * @see ClippingPlaneCollection#remove
 */
ClippingPlaneCollection.prototype.removeAll = function () {
  // Dereference this ClippingPlaneCollection from all ClippingPlanes
  const planes = this._planes;
  const planesCount = planes.length;
  for (let i = 0; i < planesCount; ++i) {
    const plane = planes[i];
    if (plane instanceof ClippingPlane) {
      plane.onChangeCallback = undefined;
      plane.index = -1;
    }
    this.planeRemoved.raiseEvent(plane, i);
  }
  this._multipleDirtyPlanes = true;
  this._planes = [];
};

const distanceEncodeScratch = new Cartesian4();
const oct32EncodeScratch = new Cartesian4();
function packPlanesAsUint8(clippingPlaneCollection, startIndex, endIndex) {
  const uint8View = clippingPlaneCollection._uint8View;
  const planes = clippingPlaneCollection._planes;
  let byteIndex = 0;
  for (let i = startIndex; i < endIndex; ++i) {
    const plane = planes[i];

    const oct32Normal = AttributeCompression.octEncodeToCartesian4(
      plane.normal,
      oct32EncodeScratch
    );
    uint8View[byteIndex] = oct32Normal.x;
    uint8View[byteIndex + 1] = oct32Normal.y;
    uint8View[byteIndex + 2] = oct32Normal.z;
    uint8View[byteIndex + 3] = oct32Normal.w;

    const encodedDistance = Cartesian4.packFloat(
      plane.distance,
      distanceEncodeScratch
    );
    uint8View[byteIndex + 4] = encodedDistance.x;
    uint8View[byteIndex + 5] = encodedDistance.y;
    uint8View[byteIndex + 6] = encodedDistance.z;
    uint8View[byteIndex + 7] = encodedDistance.w;

    byteIndex += 8;
  }
}

// Pack starting at the beginning of the buffer to allow partial update
function packPlanesAsFloats(clippingPlaneCollection, startIndex, endIndex) {
  const float32View = clippingPlaneCollection._float32View;
  const planes = clippingPlaneCollection._planes;

  let floatIndex = 0;
  for (let i = startIndex; i < endIndex; ++i) {
    const plane = planes[i];
    const normal = plane.normal;

    float32View[floatIndex] = normal.x;
    float32View[floatIndex + 1] = normal.y;
    float32View[floatIndex + 2] = normal.z;
    float32View[floatIndex + 3] = plane.distance;

    floatIndex += 4; // each plane is 4 floats
  }
}

function computeTextureResolution(pixelsNeeded, result) {
  const maxSize = ContextLimits.maximumTextureSize;
  result.x = Math.min(pixelsNeeded, maxSize);
  result.y = Math.ceil(pixelsNeeded / result.x);
  return result;
}

const textureResolutionScratch = new Cartesian2();
/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 构建用于剪切平面的资源。
 * <p>
 * 请勿直接调用此函数。
 * </p>
 */
ClippingPlaneCollection.prototype.update = function (frameState) {
  let clippingPlanesTexture = this._clippingPlanesTexture;
  const context = frameState.context;
  const useFloatTexture = ClippingPlaneCollection.useFloatTexture(context);

  // Compute texture requirements for current planes
  // In RGBA FLOAT, A plane is 4 floats packed to a RGBA.
  // In RGBA UNSIGNED_BYTE, A plane is a float in [0, 1) packed to RGBA and an Oct32 quantized normal,
  // so 8 bits or 2 pixels in RGBA.
  const pixelsNeeded = useFloatTexture ? this.length : this.length * 2;

  if (defined(clippingPlanesTexture)) {
    const currentPixelCount =
      clippingPlanesTexture.width * clippingPlanesTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < pixelsNeeded ||
      pixelsNeeded < 0.25 * currentPixelCount
    ) {
      clippingPlanesTexture.destroy();
      clippingPlanesTexture = undefined;
      this._clippingPlanesTexture = undefined;
    }
  }

  // If there are no clipping planes, there's nothing to update.
  if (this.length === 0) {
    return;
  }

  if (!defined(clippingPlanesTexture)) {
    const requiredResolution = computeTextureResolution(
      pixelsNeeded,
      textureResolutionScratch
    );
    // Allocate twice as much space as needed to avoid frequent texture reallocation.
    // Allocate in the Y direction, since texture may be as wide as context texture support.
    requiredResolution.y *= 2;

    if (useFloatTexture) {
      clippingPlanesTexture = new Texture({
        context: context,
        width: requiredResolution.x,
        height: requiredResolution.y,
        pixelFormat: PixelFormat.RGBA,
        pixelDatatype: PixelDatatype.FLOAT,
        sampler: Sampler.NEAREST,
        flipY: false,
      });
      this._float32View = new Float32Array(
        requiredResolution.x * requiredResolution.y * 4
      );
    } else {
      clippingPlanesTexture = new Texture({
        context: context,
        width: requiredResolution.x,
        height: requiredResolution.y,
        pixelFormat: PixelFormat.RGBA,
        pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
        sampler: Sampler.NEAREST,
        flipY: false,
      });
      this._uint8View = new Uint8Array(
        requiredResolution.x * requiredResolution.y * 4
      );
    }

    this._clippingPlanesTexture = clippingPlanesTexture;
    this._multipleDirtyPlanes = true;
  }

  const dirtyIndex = this._dirtyIndex;
  if (!this._multipleDirtyPlanes && dirtyIndex === -1) {
    return;
  }
  if (!this._multipleDirtyPlanes) {
    // partial updates possible
    let offsetX = 0;
    let offsetY = 0;
    if (useFloatTexture) {
      offsetY = Math.floor(dirtyIndex / clippingPlanesTexture.width);
      offsetX = Math.floor(dirtyIndex - offsetY * clippingPlanesTexture.width);

      packPlanesAsFloats(this, dirtyIndex, dirtyIndex + 1);
      clippingPlanesTexture.copyFrom({
        source: {
          width: 1,
          height: 1,
          arrayBufferView: this._float32View,
        },
        xOffset: offsetX,
        yOffset: offsetY,
      });
    } else {
      offsetY = Math.floor((dirtyIndex * 2) / clippingPlanesTexture.width);
      offsetX = Math.floor(
        dirtyIndex * 2 - offsetY * clippingPlanesTexture.width
      );
      packPlanesAsUint8(this, dirtyIndex, dirtyIndex + 1);
      clippingPlanesTexture.copyFrom({
        source: {
          width: 2,
          height: 1,
          arrayBufferView: this._uint8View,
        },
        xOffset: offsetX,
        yOffset: offsetY,
      });
    }
  } else if (useFloatTexture) {
    packPlanesAsFloats(this, 0, this._planes.length);
    clippingPlanesTexture.copyFrom({
      source: {
        width: clippingPlanesTexture.width,
        height: clippingPlanesTexture.height,
        arrayBufferView: this._float32View,
      },
    });
  } else {
    packPlanesAsUint8(this, 0, this._planes.length);
    clippingPlanesTexture.copyFrom({
      source: {
        width: clippingPlanesTexture.width,
        height: clippingPlanesTexture.height,
        arrayBufferView: this._uint8View,
      },
    });
  }

  this._multipleDirtyPlanes = false;
  this._dirtyIndex = -1;
};

const scratchMatrix = new Matrix4();
const scratchPlane = new Plane(Cartesian3.UNIT_X, 0.0);
/**
 * 确定与此 ClippingPlaneCollection 实例的平面和指定的 {@link TileBoundingVolume} 的交集类型。
 * @private
 *
 * @param {object} tileBoundingVolume 用于确定与平面相交的体积。
 * @param {Matrix4} [transform] 一个可选的附加矩阵，用于将平面转换为世界坐标。
 * @returns {Intersect} {@link Intersect.INSIDE} 如果整个体积位于平面的一侧
 * 法线指向，应完全渲染，{@link Intersect.OUTSIDE}
 * 如果整个体积位于另一侧并且应该被削波，并且
 * {@link Intersect.INTERSECTING} 如果体积与平面相交。
 */
ClippingPlaneCollection.prototype.computeIntersectionWithBoundingVolume = function (
  tileBoundingVolume,
  transform
) {
  const planes = this._planes;
  const length = planes.length;

  let modelMatrix = this.modelMatrix;
  if (defined(transform)) {
    modelMatrix = Matrix4.multiply(transform, modelMatrix, scratchMatrix);
  }

  // If the collection is not set to union the clipping regions, the volume must be outside of all planes to be
  // considered completely clipped. If the collection is set to union the clipping regions, if the volume can be
  // outside any the planes, it is considered completely clipped.
  // Lastly, if not completely clipped, if any plane is intersecting, more calculations must be performed.
  let intersection = Intersect.INSIDE;
  if (!this.unionClippingRegions && length > 0) {
    intersection = Intersect.OUTSIDE;
  }

  for (let i = 0; i < length; ++i) {
    const plane = planes[i];

    Plane.transform(plane, modelMatrix, scratchPlane); // ClippingPlane can be used for Plane math

    const value = tileBoundingVolume.intersectPlane(scratchPlane);
    if (value === Intersect.INTERSECTING) {
      intersection = value;
    } else if (this._testIntersection(value)) {
      return value;
    }
  }

  return intersection;
};

/**
 * 如果没有其他所有者，则设置输入 ClippingPlaneCollection 的所有者。
 * 如果设置成功，则销毁所有者之前的 ClippingPlaneCollection。
 *
 * @param {ClippingPlaneCollection} [clippingPlaneCollection] 附加到对象的 ClippingPlaneCollection（或未定义）
 * @param {object} owner 应接收新 ClippingPlaneCollection 的对象
 * @param {string} key 对象引用 ClippingPlaneCollection 的 Key
 * @private
 */
ClippingPlaneCollection.setOwner = function (
  clippingPlaneCollection,
  owner,
  key
) {
  // Don't destroy the ClippingPlaneCollection if it is already owned by newOwner
  if (clippingPlaneCollection === owner[key]) {
    return;
  }
  // Destroy the existing ClippingPlaneCollection, if any
  owner[key] = owner[key] && owner[key].destroy();
  if (defined(clippingPlaneCollection)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(clippingPlaneCollection._owner)) {
      throw new DeveloperError(
        "ClippingPlaneCollection should only be assigned to one object"
      );
    }
    //>>includeEnd('debug');
    clippingPlaneCollection._owner = owner;
    owner[key] = clippingPlaneCollection;
  }
};

/**
 * 用于检查上下文是否允许使用浮点纹理的剪切平面的函数。
 *
 * @param {Context} context 将包含剪切对象和剪切纹理的 Context。
 * @returns {boolean} <code>true</code>，如果浮点纹理可用于剪切平面。
 * @private
 */
ClippingPlaneCollection.useFloatTexture = function (context) {
  return context.floatingPointTexture;
};

/**
 * 用于获取剪切平面集合的纹理分辨率的函数。
 * 如果 ClippingPlaneCollection 尚未更新，则返回
 * 根据当前平面计数分配。
 *
 * @param {ClippingPlaneCollection} clippingPlaneCollection 剪切平面集合
 * @param {context} context 渲染上下文
 * @param {Cartesian2} result  Cartesian2 为结果。
 * @returns {Cartesian2} 所需的分辨率。
 * @private
 */
ClippingPlaneCollection.getTextureResolution = function (
  clippingPlaneCollection,
  context,
  result
) {
  const texture = clippingPlaneCollection.texture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  const pixelsNeeded = ClippingPlaneCollection.useFloatTexture(context)
    ? clippingPlaneCollection.length
    : clippingPlaneCollection.length * 2;
  const requiredResolution = computeTextureResolution(pixelsNeeded, result);

  // Allocate twice as much space as needed to avoid frequent texture reallocation.
  requiredResolution.y *= 2;
  return requiredResolution;
};

/**
* 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 <code>* isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see ClippingPlaneCollection#destroy
 */
ClippingPlaneCollection.prototype.isDestroyed = function () {
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
 * clippingPlanes = clippingPlanes && clippingPlanes.destroy();
 *
 * @see ClippingPlaneCollection#isDestroyed
 */
ClippingPlaneCollection.prototype.destroy = function () {
  this._clippingPlanesTexture =
    this._clippingPlanesTexture && this._clippingPlanesTexture.destroy();
  return destroyObject(this);
};
export default ClippingPlaneCollection;
