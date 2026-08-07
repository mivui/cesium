import AttributeCompression from "../Core/AttributeCompression.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
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
 * 指定一组裁剪平面。裁剪平面选择性地禁用渲染，在
 * {@link ClippingPlane} 对象列表外部区域对单个 gltf 模型、3D Tileset 或地球体禁用渲染。
 * <p>
 * 通常，裁剪平面的坐标相对于它们所附加的对象，因此距离设为 0 的平面将裁剪
 * 穿过对象的中心。
 * </p>
 * <p>
 * 对于 3D Tiles，使用根 tile 的变换来定位裁剪平面。如果未定义变换，则使用根 tile 的 {@link Cesium3DTile#boundingSphere}。
 * </p>
 *
 * @alias ClippingPlaneCollection
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {ClippingPlane[]} [options.planes=[]] {@link ClippingPlane} 对象数组，用于选择性地禁用每个平面外部的渲染。
 * @param {boolean} [options.enabled=true] 确定裁剪平面是否处于活动状态。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 4x4 变换矩阵，指定相对于裁剪平面原始坐标系的附加变换。
 * @param {boolean} [options.unionClippingRegions=false] 如果为 true，当区域位于集合中任何平面外部时将被裁剪。否则，仅当区域位于所有平面外部时才会被裁剪。
 * @param {Color} [options.edgeColor=Color.WHITE] 用于高亮显示对象被裁剪边缘的颜色。
 * @param {number} [options.edgeWidth=0.0] 应用于对象裁剪边缘的高亮宽度（以像素为单位）。
 *
 * @demo {@link https://sandcastle.cesium.com/?id=3d-tiles-clipping-planes|裁剪 3D Tiles 和 glTF 模型。}
 * @demo {@link https://sandcastle.cesium.com/?id=terrain-clipping-planes|裁剪地球。}
 *
 * @example
 * // 此裁剪平面的距离为正，这意味着其法线
 * // 朝向原点。这将裁剪平面后面的所有内容，
 * // 即 y 坐标 < -5 的任何内容。
 * const clippingPlanes = new Cesium.ClippingPlaneCollection({
 *     planes : [
 *         new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 5.0)
 *     ],
 * });
 * // 创建实体并将 ClippingPlaneCollection 附加到模型。
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
  options = options ?? Frozen.EMPTY_OBJECT;

  this._planes = [];

  // Do partial texture updates if just one plane is dirty.
  // If many planes are dirty, refresh the entire texture.
  this._dirtyIndex = -1;
  this._multipleDirtyPlanes = false;

  this._enabled = options.enabled ?? true;

  /**
   * 4x4 变换矩阵，指定相对于裁剪平面
   * 原始坐标系的附加变换。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */
  this.modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);

  /**
   * 用于高亮显示对象被裁剪边缘的颜色。
   *
   * @type {Color}
   * @default Color.WHITE
   */
  this.edgeColor = Color.clone(options.edgeColor ?? Color.WHITE);

  /**
   * 应用于对象裁剪边缘的高亮宽度（以像素为单位）。
   *
   * @type {number}
   * @default 0.0
   */
  this.edgeWidth = options.edgeWidth ?? 0.0;

  /**
   * 当向集合添加新裁剪平面时触发的事件。事件处理程序
   * 将接收新平面及其添加的索引。
   * @type {Event}
   * @readonly
   */
  this.planeAdded = new Event();

  /**
   * 当从集合中移除裁剪平面时触发的事件。事件处理程序
   * 将接收被移除的平面及其被移除的索引。
   * @type {Event}
   * @readonly
   */
  this.planeRemoved = new Event();

  // If this ClippingPlaneCollection has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference the tileset's ClippingPlaneCollection.
  this._owner = undefined;

  const unionClippingRegions = options.unionClippingRegions ?? false;
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
   * 返回此集合中平面的数量。这通常与
   * {@link ClippingPlaneCollection#get} 一起使用以遍历集合中的所有平面。
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
   * 如果为 true，当区域位于集合中任何平面外部时将被裁剪。
   * 否则，仅当区域位于所有平面外部时才会被裁剪。
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
   * 如果为 true，裁剪将启用。
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
   * Returns a texture containing packed, untransformed clipping planes.
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
   * A reference to the ClippingPlaneCollection's owner, if any.
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
   * Returns a Number encapsulating the state for this ClippingPlaneCollection.
   *
   * Clipping mode is encoded in the sign of the number, which is just the plane count.
   * If this value changes, then shader regeneration is necessary.
   *
   * @memberof ClippingPlaneCollection.prototype
   * @returns {number} A Number that describes the ClippingPlaneCollection's state.
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
 * 将指定的 {@link ClippingPlane} 添加到集合中，用于选择性地禁用
 * 每个平面外部的渲染。使用 {@link ClippingPlaneCollection#unionClippingRegions} 修改
 * 多个平面的裁剪行为。
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
 * 返回集合中指定索引处的平面。索引从零开始，
 * 随着添加平面而增加。移除平面会将其后的所有平面左移，
 * 更改它们的索引。此函数通常与
 * {@link ClippingPlaneCollection#length} 一起使用以遍历集合中的所有平面。
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
 * 检查此集合是否包含与给定 ClippingPlane 相等的裁剪平面。
 *
 * @param {ClippingPlane} [clippingPlane] 要检查的 ClippingPlane。
 * @returns {boolean} 如果此集合包含 ClippingPlane 则返回 true，否则返回 false。
 *
 * @see ClippingPlaneCollection#get
 */
ClippingPlaneCollection.prototype.contains = function (clippingPlane) {
  return indexOf(this._planes, clippingPlane) !== -1;
};

/**
 * 从集合中移除给定 ClippingPlane 的第一次出现。
 *
 * @param {ClippingPlane} clippingPlane
 * @returns {boolean} 如果平面被移除则返回 <code>true</code>；如果在集合中未找到平面则返回 <code>false</code>。
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
 * 从集合中移除所有平面。
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
      oct32EncodeScratch,
    );
    uint8View[byteIndex] = oct32Normal.x;
    uint8View[byteIndex + 1] = oct32Normal.y;
    uint8View[byteIndex + 2] = oct32Normal.z;
    uint8View[byteIndex + 3] = oct32Normal.w;

    const encodedDistance = Cartesian4.packFloat(
      plane.distance,
      distanceEncodeScratch,
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
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，
 * 构建裁剪平面的资源。
 * <p>
 * 不要直接调用此函数。
 * </p>
 */
ClippingPlaneCollection.prototype.update = function (frameState) {
  let clippingPlanesTexture = this._clippingPlanesTexture;
  const context = frameState.context;
  const useFloatTexture = ClippingPlaneCollection.useFloatTexture(context);

  // Compute texture requirements for current planes
  // In RGBA FLOAT, A plane is 4 floats packed to a RGBA.
  // In RGBA UNSIGNED_BYTE, A plane is a float in [0, 1) packed to RGBA and an Oct32 quantized normal,
  // so 8 bytes or 2 pixels in RGBA.
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
      textureResolutionScratch,
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
        requiredResolution.x * requiredResolution.y * 4,
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
        requiredResolution.x * requiredResolution.y * 4,
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
    let offsetX;
    let offsetY;
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
        dirtyIndex * 2 - offsetY * clippingPlanesTexture.width,
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
 * Determines the type intersection with the planes of this ClippingPlaneCollection instance and the specified {@link TileBoundingVolume}.
 * @ignore
 *
 * @param {object} tileBoundingVolume The volume to determine the intersection with the planes.
 * @param {Matrix4} [transform] An optional, additional matrix to transform the plane to world coordinates.
 * @returns {Intersect} {@link Intersect.INSIDE} if the entire volume is on the side of the planes
 *                      the normal is pointing and should be entirely rendered, {@link Intersect.OUTSIDE}
 *                      if the entire volume is on the opposite side and should be clipped, and
 *                      {@link Intersect.INTERSECTING} if the volume intersects the planes.
 */
ClippingPlaneCollection.prototype.computeIntersectionWithBoundingVolume =
  function (tileBoundingVolume, transform) {
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
 * Sets the owner for the input ClippingPlaneCollection if there wasn't another owner.
 * Destroys the owner's previous ClippingPlaneCollection if setting is successful.
 *
 * @param {ClippingPlaneCollection} [clippingPlaneCollection] A ClippingPlaneCollection (or undefined) being attached to an object
 * @param {object} owner An Object that should receive the new ClippingPlaneCollection
 * @param {string} key The Key for the Object to reference the ClippingPlaneCollection
 * @ignore
 */
ClippingPlaneCollection.setOwner = function (
  clippingPlaneCollection,
  owner,
  key,
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
        "ClippingPlaneCollection should only be assigned to one object",
      );
    }
    //>>includeEnd('debug');
    clippingPlaneCollection._owner = owner;
    owner[key] = clippingPlaneCollection;
  }
};

/**
 * Function for checking if the context will allow clipping planes with floating point textures.
 *
 * @param {Context} context The Context that will contain clipped objects and clipping textures.
 * @returns {boolean} <code>true</code> if floating point textures can be used for clipping planes.
 * @private
 */
ClippingPlaneCollection.useFloatTexture = function (context) {
  return context.floatingPointTexture;
};

/**
 * Function for getting the clipping plane collection's texture resolution.
 * If the ClippingPlaneCollection hasn't been updated, returns the resolution that will be
 * allocated based on the current plane count.
 *
 * @param {ClippingPlaneCollection} clippingPlaneCollection The clipping plane collection
 * @param {Context} context The rendering context
 * @param {Cartesian2} result A Cartesian2 for the result.
 * @returns {Cartesian2} The required resolution.
 * @private
 */
ClippingPlaneCollection.getTextureResolution = function (
  clippingPlaneCollection,
  context,
  result,
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
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see ClippingPlaneCollection#destroy
 */
ClippingPlaneCollection.prototype.isDestroyed = function () {
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
