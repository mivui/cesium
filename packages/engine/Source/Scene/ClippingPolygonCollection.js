import Cartesian2 from "../Core/Cartesian2.js";
import CesiumMath from "../Core/Math.js";
import Check from "../Core/Check.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Intersect from "../Core/Intersect.js";
import PixelFormat from "../Core/PixelFormat.js";
import Rectangle from "../Core/Rectangle.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import RuntimeError from "../Core/RuntimeError.js";
import Sampler from "../Renderer/Sampler.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import ClippingPolygon from "./ClippingPolygon.js";
import ComputeCommand from "../Renderer/ComputeCommand.js";
import PolygonSignedDistanceFS from "../Shaders/PolygonSignedDistanceFS.js";
import Pass from "../Renderer/Pass.js";

/**
 * 指定一组裁剪多边形。裁剪多边形选择性地禁用渲染，
 * 在 {@link ClippingPolygon} 对象列表的内部或外部区域对单个 glTF 模型、3D Tileset 或地球体禁用渲染。
 *
 * 裁剪多边形仅在 WebGL 2 上下文中受支持。
 *
 * @alias ClippingPolygonCollection
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {ClippingPolygon[]} [options.polygons=[]] {@link ClippingPolygon} 对象数组，用于选择性地禁用每个多边形内部的渲染。
 * @param {boolean} [options.enabled=true] 确定裁剪多边形是否处于活动状态。
 * @param {boolean} [options.inverse=false] 如果为 true，当区域位于集合中所有多边形外部时将被裁剪。否则，仅当区域位于任何多边形内部时才会被裁剪。
 * @param {number} [options.quality=1.0] 控制用于裁剪的有符号距离纹理分辨率的标量。大于 1.0 的值提高质量，小于 1.0 的值降低质量。必须大于 0.0。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * const polygon = new Cesium.ClippingPolygon({
 *     positions: positions
 * });
 *
 * const polygons = new Cesium.ClippingPolygonCollection({
 *    polygons: [ polygon ]
 * });
 */
function ClippingPolygonCollection(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._polygons = [];
  this._totalPositions = 0;

  this.debugShowDistanceTexture = options.debugShowDistanceTexture ?? false;

  /**
   * 如果为 true，裁剪将启用。
   *
   * @type {boolean}
   * @default true
   */
  this.enabled = options.enabled ?? true;

  /**
   * 如果为 true，当区域位于集合中所有多边形外部时将被裁剪。
   * 否则，仅当区域位于任何多边形内部时才会被裁剪。
   *
   * @type {boolean}
   * @default false
   */
  this.inverse = options.inverse ?? false;

  /**
   * 控制用于裁剪的有符号距离纹理分辨率的标量。
   * 大于 1.0 的值提高质量，小于 1.0 的值降低质量。必须大于 0.0。
   *
   * @type {number}
   * @default 1.0
   */
  this.quality = options.quality ?? 1.0;

  /**
   * 当向集合添加新裁剪多边形时触发的事件。事件处理程序
   * 将接收新多边形及其添加的索引。
   * @type {Event}
   * @default Event()
   */
  this.polygonAdded = new Event();

  /**
   * 当从集合中移除裁剪多边形时触发的事件。事件处理程序
   * 将接收被移除的多边形及其被移除的索引。
   * @type {Event}
   * @default Event()
   */
  this.polygonRemoved = new Event();

  // If this ClippingPolygonCollection has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference the tileset's ClippingPolygonCollection.
  this._owner = undefined;

  this._float32View = undefined;
  this._extentsFloat32View = undefined;
  this._extentsCount = 0;

  this._polygonsTexture = undefined;
  this._extentsTexture = undefined;
  this._signedDistanceTexture = undefined;

  this._signedDistanceComputeCommand = undefined;

  // Add each ClippingPolygon object.
  const polygons = options.polygons;
  if (defined(polygons)) {
    const polygonsLength = polygons.length;
    for (let i = 0; i < polygonsLength; ++i) {
      this._polygons.push(polygons[i]);
    }
  }
}

Object.defineProperties(ClippingPolygonCollection.prototype, {
  /**
   * 返回此集合中多边形的数量。这通常与
   * {@link ClippingPolygonCollection#get} 一起使用以遍历集合中的所有多边形。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._polygons.length;
    },
  },

  /**
   * Returns the total number of positions in all polygons in the collection.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  totalPositions: {
    get: function () {
      return this._totalPositions;
    },
  },

  /**
   * Returns a texture containing the packed computed spherical extents for each polygon
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  extentsTexture: {
    get: function () {
      return this._extentsTexture;
    },
  },

  /**
   * Returns the number of packed extents, which can be fewer than the number of polygons.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  extentsCount: {
    get: function () {
      return this._extentsCount;
    },
  },

  /**
   * Returns the number of pixels needed in the texture containing the packed computed spherical extents for each polygon.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  pixelsNeededForExtents: {
    get: function () {
      return this.length; // With an RGBA texture, each pixel contains min/max latitude and longitude.
    },
  },

  /**
   * Returns the number of pixels needed in the texture containing the packed polygon positions.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  pixelsNeededForPolygonPositions: {
    get: function () {
      // In an RG FLOAT texture, each polygon position is 2 floats packed to a RG.
      // Each polygon has a 1-pixel header + 2 pixels for individual extents + the list of positions
      return this.totalPositions + 3 * this.length;
    },
  },

  /**
   * Returns a texture containing the computed signed distance of each polygon.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  clippingTexture: {
    get: function () {
      return this._signedDistanceTexture;
    },
  },

  /**
   * A reference to the ClippingPolygonCollection's owner, if any.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @readonly
   * @private
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },

  /**
   * Returns a number encapsulating the state for this ClippingPolygonCollection.
   *
   * Clipping mode is encoded in the sign of the number, which is just the total position count.
   * If this value changes, then shader regeneration is necessary.
   *
   * @memberof ClippingPolygonCollection.prototype
   * @returns {number} A Number that describes the ClippingPolygonCollection's state.
   * @readonly
   * @private
   */
  clippingPolygonsState: {
    get: function () {
      return this.inverse ? -this.extentsCount : this.extentsCount;
    },
  },
});

/**
 * 将指定的 {@link ClippingPolygon} 添加到集合中，用于选择性地禁用
 * 每个多边形内部的渲染。使用 {@link ClippingPolygonCollection#unionClippingRegions} 修改
 * 多个多边形的裁剪行为。
 *
 * @param {ClippingPolygon} polygon 要添加到集合的 ClippingPolygon。
 * @returns {ClippingPolygon} 添加的 ClippingPolygon。
 *
 * @example
 * const polygons = new Cesium.ClippingPolygonCollection();
 *
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * polygons.add(new Cesium.ClippingPolygon({
 *     positions: positions
 * }));
 *
 *
 *
 * @see ClippingPolygonCollection#remove
 * @see ClippingPolygonCollection#removeAll
 */
ClippingPolygonCollection.prototype.add = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  const newPlaneIndex = this._polygons.length;
  this._polygons.push(polygon);
  this.polygonAdded.raiseEvent(polygon, newPlaneIndex);
  return polygon;
};

/**
 * 返回集合中指定索引处的裁剪多边形。索引从零开始
 * 随着添加多边形而增加。移除多边形会将其后的所有多边形左移，
 * 更改它们的索引。此函数通常与
 * {@link ClippingPolygonCollection#length} 一起使用以遍历集合中的所有多边形。
 *
 * @param {number} index 多边形的从零开始的索引。
 * @returns {ClippingPolygon} 指定索引处的 ClippingPolygon。
 *
 * @see ClippingPolygonCollection#length
 */
ClippingPolygonCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  return this._polygons[index];
};

/**
 * 检查此集合是否包含与给定 ClippingPolygon 相等的裁剪多边形。
 *
 * @param {ClippingPolygon} polygon 要检查的 ClippingPolygon。
 * @returns {boolean} 如果此集合包含 ClippingPolygon 则返回 true，否则返回 false。
 *
 * @see ClippingPolygonCollection#get
 */
ClippingPolygonCollection.prototype.contains = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  return this._polygons.some((p) => ClippingPolygon.equals(p, polygon));
};

/**
 * 从集合中移除给定 ClippingPolygon 的第一次出现。
 *
 * @param {ClippingPolygon} polygon
 * @returns {boolean} 如果多边形被移除则返回 <code>true</code>；如果在集合中未找到多边形则返回 <code>false</code>。
 *
 * @see ClippingPolygonCollection#add
 * @see ClippingPolygonCollection#contains
 * @see ClippingPolygonCollection#removeAll
 */
ClippingPolygonCollection.prototype.remove = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  const polygons = this._polygons;
  const index = polygons.findIndex((p) => ClippingPolygon.equals(p, polygon));

  if (index === -1) {
    return false;
  }

  polygons.splice(index, 1);

  this.polygonRemoved.raiseEvent(polygon, index);
  return true;
};

/**
 * Computes padded extents for a polygon's bounding rectangle, clamped to valid spherical ranges.
 *
 * @param {Rectangle} extents The original spherical extents to pad.
 * @param {number} padding A multiplier applied to the extents' width and height to determine the padding amount.
 * @param {Rectangle} [result] An optional rectangle to store the result in.
 * @returns {Rectangle} The padded and clamped rectangle.
 *
 * @private
 */
function computePaddedExtents(extents, padding, result) {
  const height = Math.max(extents.height * padding, 0);
  const width = Math.max(extents.width * padding, 0);
  const paddedExtents = Rectangle.clone(extents, result);

  // Pad
  paddedExtents.south -= height;
  paddedExtents.west -= width;
  paddedExtents.north += height;
  paddedExtents.east += width;

  // Clamp
  paddedExtents.south = Math.max(paddedExtents.south, -Math.PI);
  paddedExtents.west = Math.max(paddedExtents.west, -Math.PI);
  paddedExtents.north = Math.min(paddedExtents.north, Math.PI);
  paddedExtents.east = Math.min(paddedExtents.east, Math.PI);

  return paddedExtents;
}

/**
 * @typedef {object} ExtentsResult
 * @property {Rectangle[]} extentsList The list of merged padded extents, one per group.
 * @property {Map<number, number>} extentsIndexByPolygon A map from polygon index to the index of its group in extentsList.
 * @private
 */

/**
 * Groups nearby ClippingPolygons based on their spherical extents. Overlapping extents will be merged
 * into a single encompassing extent. Each Extent will later map into one region in the SignedDistanceTexture (atlas).
 *
 * Definitions:
 * n = number of polygons
 * g = number of resulting extents (merged) (g <= n)
 * absorb = merge two extents into one
 * restart = redo intersection check with previous groups
 *
 * Algorithm:
 * For each polygon we scan existing groups for a first overlap (O(g)),
 * then on each subsequent overlap we absorb the group and restart the
 * inner scan. Each group can be absorbed at most once per polygon, and
 * each restart reduces the group count by one, so the absorb-loop does
 * at most O(g) restarts per polygon. Overall: O(n * g) where g ≤ n,
 * giving O(n²) worst case when all polygons overlap transitively, but
 * typically much better when groups are few and disjoint.
 *
 * Note: Restarts are required because the new merged bounding box might
 * be larger than the two individual that were merged and introduce new
 * collisions. Example:
 *
 *   Before merging A and B:
 *
 *        ┌─────────┐
 *        │    A     │
 *        │         ┌┼────────┐
 *        └─────────┘│   B    │
 *        ┌────┐     │        │
 *        │ C  │     └────────┘
 *        └────┘
 *
 *     A overlaps B  ✓
 *     A overlaps C  ✗
 *     B overlaps C  ✗
 *
 *   After merging A ∪ B into one extent:
 *
 *        ┌───────────────────┐
 *        │                   │
 *        │    A ∪ B          │
 *        ├────┐              │
 *        │ C  │              │
 *        └────┘──────────────┘
 *
 *     (A ∪ B) overlaps C  ✓  ← new collision!
 *
 * @param {ClippingPolygon[]} polygons The array of clipping polygons to compute extents for.
 * @param {Rectangle[]} polygonExtentsCache An array of pre-computed spherical extents for each polygon, indexed by polygon index.
 * @returns {ExtentsResult} The merged extents and a mapping from polygon indices to their extent group indices.
 *
 * @private
 */
function getExtents(polygons, polygonExtentsCache) {
  // Pad extents to avoid floating point error when fragment culling at edges.
  const PADDING = 2.5;

  // Each group: { extent: padded Rectangle, polygonIndices: number[] }
  const groups = [];

  const length = polygons.length;
  for (let polygonIndex = 0; polygonIndex < length; ++polygonIndex) {
    const paddedExtent = computePaddedExtents(
      polygonExtentsCache[polygonIndex],
      PADDING,
    );

    // Pass 1: Find the first overlapping group
    let targetIdx = -1;
    for (let g = 0; g < groups.length; ++g) {
      if (
        defined(Rectangle.simpleIntersection(groups[g].extent, paddedExtent))
      ) {
        targetIdx = g;
        break;
      }
    }

    if (targetIdx === -1) {
      // No overlap — start a new group
      groups.push({ extent: paddedExtent, polygonIndices: [polygonIndex] });
    } else {
      // Overlap - Merge the polygon into the target group
      const target = groups[targetIdx];
      target.polygonIndices.push(polygonIndex);
      Rectangle.union(target.extent, paddedExtent, target.extent);

      // Pass 2: Absorb all other groups that overlap the (growing) target
      // extent. After each absorption the target grows, so restart the scan
      // to catch groups that now transitively overlap.
      for (let g = 0; g < groups.length; ++g) {
        if (g === targetIdx) {
          continue;
        }
        if (
          defined(Rectangle.simpleIntersection(groups[g].extent, target.extent))
        ) {
          target.polygonIndices.push(...groups[g].polygonIndices);
          Rectangle.union(target.extent, groups[g].extent, target.extent);
          groups.splice(g, 1);
          if (g < targetIdx) {
            targetIdx--;
          }
          g = -1; // restart (loop increment brings it to 0)
        }
      }
    }
  }

  const extentsList = groups.map((g) => g.extent);
  const extentsIndexByPolygon = new Map();
  groups.forEach((g, extentIndex) =>
    g.polygonIndices.forEach((p) => extentsIndexByPolygon.set(p, extentIndex)),
  );

  return { extentsList, extentsIndexByPolygon };
}

/**
 * 从集合中移除所有多边形。
 *
 * @see ClippingPolygonCollection#add
 * @see ClippingPolygonCollection#remove
 */
ClippingPolygonCollection.prototype.removeAll = function () {
  // Dereference this ClippingPolygonCollection from all ClippingPolygons
  const polygons = this._polygons;
  const polygonsCount = polygons.length;
  for (let i = 0; i < polygonsCount; ++i) {
    const polygon = polygons[i];
    this.polygonRemoved.raiseEvent(polygon, i);
  }
  this._polygons = [];
};

function packPolygonsAsFloats(clippingPolygonCollection) {
  const polygonsFloat32View = clippingPolygonCollection._float32View;
  const extentsFloat32View = clippingPolygonCollection._extentsFloat32View;
  const polygons = clippingPolygonCollection._polygons;

  /**
   * Pre-calculate all polygon spherical extents as it an expensive operation
   * @type {ReadonlyArray<Rectangle>}
   * */
  const polygonExtentsCache = polygons.map((polygon) =>
    polygon.computeSphericalExtents(),
  );

  const { extentsList, extentsIndexByPolygon } = getExtents(
    polygons,
    polygonExtentsCache,
  );

  // Polygons are packed sequentially (ordered by extentsIndex) into polygonsFloat32View as follows:
  // For each polygon:
  //   [0] vertexCount - the number of vertices in the polygon
  //   [1] extentsIndex - index into the extents texture for this polygon's bounding rectangle
  //   [2] south - southern boundary of the individual polygon extent (radians)
  //   [3] west - western boundary of the individual polygon extent (radians)
  //   [4] latitudeRange - (north - south) for the individual polygon extent
  //   [5] longitudeRange - (east - west) for the individual polygon extent
  //   [6..6+2*vertexCount-1] pairs of (latitude, longitude) for each vertex,
  //       computed as fastApproximateAtan2 values to match the shader

  // Sort polygon indices by extentsIndex so polygons sharing the same extent are packed together
  // Can enable optimizations in the shader
  const sortedPolygonIndices = Array.from(polygons.keys()).sort(
    (a, b) => extentsIndexByPolygon.get(a) - extentsIndexByPolygon.get(b),
  );

  let floatIndex = 0;
  for (const polygonIndex of sortedPolygonIndices) {
    const polygon = polygons[polygonIndex];
    // Pack the length of the polygon into the polygon texture array buffer
    const length = polygon.length;
    polygonsFloat32View[floatIndex++] = length;
    polygonsFloat32View[floatIndex++] = extentsIndexByPolygon.get(polygonIndex);

    // Pack the individual polygon extent
    const polygonExtent = polygonExtentsCache[polygonIndex];
    polygonsFloat32View[floatIndex++] = polygonExtent.south;
    polygonsFloat32View[floatIndex++] = polygonExtent.west;
    polygonsFloat32View[floatIndex++] =
      polygonExtent.north - polygonExtent.south;
    polygonsFloat32View[floatIndex++] = polygonExtent.east - polygonExtent.west;

    // Pack the polygon positions into the polygon texture array buffer
    for (let i = 0; i < length; ++i) {
      const spherePoint = polygon.positions[i];

      // Project into plane with vertical for latitude
      const magXY = Math.hypot(spherePoint.x, spherePoint.y);

      // Use fastApproximateAtan2 for alignment with shader
      const latitudeApproximation = CesiumMath.fastApproximateAtan2(
        magXY,
        spherePoint.z,
      );
      const longitudeApproximation = CesiumMath.fastApproximateAtan2(
        spherePoint.x,
        spherePoint.y,
      );

      polygonsFloat32View[floatIndex++] = latitudeApproximation;
      polygonsFloat32View[floatIndex++] = longitudeApproximation;
    }
  }

  // Extents are packed sequentially into extentsFloat32View as follows:
  // For each extent (maps to one RGBA pixel in the extents texture):
  //   [0] south - the southern boundary of the bounding rectangle (radians)
  //   [1] west - the western boundary of the bounding rectangle (radians)
  //   [2] latitudeRangeInverse - 1.0 / (north - south)
  //   [3] longitudeRangeInverse - 1.0 / (east - west)
  let extentsFloatIndex = 0;
  for (const extents of extentsList) {
    const longitudeRangeInverse = 1.0 / (extents.east - extents.west);
    const latitudeRangeInverse = 1.0 / (extents.north - extents.south);

    extentsFloat32View[extentsFloatIndex++] = extents.south;
    extentsFloat32View[extentsFloatIndex++] = extents.west;
    extentsFloat32View[extentsFloatIndex++] = latitudeRangeInverse;
    extentsFloat32View[extentsFloatIndex++] = longitudeRangeInverse;
  }

  clippingPolygonCollection._extentsCount = extentsList.length;
}

const textureResolutionScratch = new Cartesian2();
/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * build the resources for clipping polygons.
 * <p>
 * Do not call this function directly.
 * </p>
 * @private
 * @throws {RuntimeError} ClippingPolygonCollections are only supported for WebGL 2
 */
ClippingPolygonCollection.prototype.update = function (frameState) {
  const context = frameState.context;

  if (!ClippingPolygonCollection.isSupported(frameState)) {
    throw new RuntimeError(
      "ClippingPolygonCollections are only supported for WebGL 2.",
    );
  }

  if (this.debugShowDistanceTexture && defined(this._signedDistanceTexture)) {
    if (!defined(this.debugCommand)) {
      this.debugCommand = createDebugCommand(
        this._signedDistanceTexture,
        frameState.context,
      );
    }
    frameState.commandList.push(this.debugCommand);
  }

  // It'd be expensive to validate any individual position has changed. Instead verify if the list of polygon positions has had elements added or removed, which should be good enough for most cases.
  const totalPositions = this._polygons.reduce(
    (totalPositions, polygon) => totalPositions + polygon.length,
    0,
  );

  if (totalPositions === this.totalPositions) {
    return;
  }

  this._totalPositions = totalPositions;

  // If there are no clipping polygons, there's nothing to update.
  if (this.length === 0) {
    return;
  }

  if (defined(this._signedDistanceComputeCommand)) {
    this._signedDistanceComputeCommand.canceled = true;
    this._signedDistanceComputeCommand = undefined;
  }

  let polygonsTexture = this._polygonsTexture;
  let extentsTexture = this._extentsTexture;
  let signedDistanceTexture = this._signedDistanceTexture;
  if (defined(polygonsTexture)) {
    const currentPixelCount = polygonsTexture.width * polygonsTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < this.pixelsNeededForPolygonPositions ||
      this.pixelsNeededForPolygonPositions < 0.25 * currentPixelCount
    ) {
      polygonsTexture.destroy();
      polygonsTexture = undefined;
      this._polygonsTexture = undefined;
    }
  }

  if (!defined(polygonsTexture)) {
    const requiredResolution = ClippingPolygonCollection.getTextureResolution(
      polygonsTexture,
      this.pixelsNeededForPolygonPositions,
      textureResolutionScratch,
    );

    polygonsTexture = new Texture({
      context: context,
      width: requiredResolution.x,
      height: requiredResolution.y,
      pixelFormat: PixelFormat.RG,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: Sampler.NEAREST,
      flipY: false,
    });
    this._float32View = new Float32Array(
      requiredResolution.x * requiredResolution.y * 2,
    );
    this._polygonsTexture = polygonsTexture;
  }

  if (defined(extentsTexture)) {
    const currentPixelCount = extentsTexture.width * extentsTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < this.pixelsNeededForExtents ||
      this.pixelsNeededForExtents < 0.25 * currentPixelCount
    ) {
      extentsTexture.destroy();
      extentsTexture = undefined;
      this._extentsTexture = undefined;
    }
  }

  if (!defined(extentsTexture)) {
    const requiredResolution = ClippingPolygonCollection.getTextureResolution(
      extentsTexture,
      this.pixelsNeededForExtents,
      textureResolutionScratch,
    );

    extentsTexture = new Texture({
      context: context,
      width: requiredResolution.x,
      height: requiredResolution.y,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: Sampler.NEAREST,
      flipY: false,
    });
    this._extentsFloat32View = new Float32Array(
      requiredResolution.x * requiredResolution.y * 4,
    );

    this._extentsTexture = extentsTexture;
  }

  packPolygonsAsFloats(this);

  extentsTexture.copyFrom({
    source: {
      width: extentsTexture.width,
      height: extentsTexture.height,
      arrayBufferView: this._extentsFloat32View,
    },
  });

  polygonsTexture.copyFrom({
    source: {
      width: polygonsTexture.width,
      height: polygonsTexture.height,
      arrayBufferView: this._float32View,
    },
  });

  if (!defined(signedDistanceTexture)) {
    const textureDimensions =
      ClippingPolygonCollection.getClippingDistanceTextureResolution(
        this,
        textureResolutionScratch,
      );
    signedDistanceTexture = new Texture({
      context: context,
      width: textureDimensions.x,
      height: textureDimensions.y,
      pixelFormat: context.webgl2 ? PixelFormat.RED : PixelFormat.LUMINANCE,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: new Sampler({
        wrapS: TextureWrap.CLAMP_TO_EDGE,
        wrapT: TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: TextureMinificationFilter.LINEAR,
        magnificationFilter: TextureMagnificationFilter.LINEAR,
      }),
      flipY: false,
    });

    this._signedDistanceTexture = signedDistanceTexture;
  }

  this._signedDistanceComputeCommand = createSignedDistanceTextureCommand(this);
};

function createDebugCommand(texture, context) {
  const fs =
    "uniform highp sampler2D billboard_texture; \n" +
    "in vec2 v_textureCoordinates; \n" +
    "float getSignedDistance(vec2 uv, highp sampler2D clippingDistance) { \n" +
    "    float signedDistance = texture(clippingDistance, uv).r; \n" +
    "    return (signedDistance - 0.5) * 2.0; \n" +
    "} \n" +
    "void main() \n" +
    "{ \n" +
    "    float dist = texture(billboard_texture, v_textureCoordinates).r; \n" +
    "    if (dist > 0.5)  { \n" +
    "     out_FragColor = vec4(dist, 0.0, 0.0, 1.0); \n" + // outside
    "    } else {\n" +
    "     out_FragColor = vec4(0.0, dist, 0.0, 1.0); \n" + // inside
    "    } \n" +
    "} \n";

  const drawCommand = context.createViewportQuadCommand(fs, {
    uniformMap: {
      billboard_texture: function () {
        return texture;
      },
    },
  });
  drawCommand.pass = Pass.OVERLAY;
  return drawCommand;
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * build the resources for clipping polygons.
 * <p>
 * Do not call this function directly.
 * </p>
 * @private
 * @param {FrameState} frameState
 */
ClippingPolygonCollection.prototype.queueCommands = function (frameState) {
  if (defined(this._signedDistanceComputeCommand)) {
    frameState.commandList.push(this._signedDistanceComputeCommand);
  }
};

function createSignedDistanceTextureCommand(collection) {
  const polygonTexture = collection._polygonsTexture;
  const extentsTexture = collection._extentsTexture;

  return new ComputeCommand({
    fragmentShaderSource: PolygonSignedDistanceFS,
    outputTexture: collection._signedDistanceTexture,
    uniformMap: {
      u_polygonsLength: function () {
        return collection.length;
      },
      u_extentsLength: function () {
        return collection.extentsCount;
      },
      u_extentsTexture: function () {
        return extentsTexture;
      },
      u_polygonTexture: function () {
        return polygonTexture;
      },
    },
    persists: false,
    owner: collection,
    postExecute: () => {
      collection._signedDistanceComputeCommand = undefined;
    },
  });
}

const scratchRectangleTile = new Rectangle();
const scratchRectangleIntersection = new Rectangle();
const scratchRectanglePolygon = new Rectangle();
/**
 * Determines the type intersection with the polygons of this ClippingPolygonCollection instance and the specified {@link TileBoundingVolume}.
 * @ignore
 *
 * @param {object} tileBoundingVolume The volume to determine the intersection with the polygons.
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the bounding volumes are defined.
 * @returns {Intersect} The intersection type: {@link Intersect.OUTSIDE} if the entire volume is not clipped, {@link Intersect.INSIDE}
 *                      if the entire volume should be clipped, and {@link Intersect.INTERSECTING} if the volume intersects the polygons and will partially clipped.
 */
ClippingPolygonCollection.prototype.computeIntersectionWithBoundingVolume =
  function (tileBoundingVolume, ellipsoid) {
    const polygons = this._polygons;
    const length = polygons.length;

    let intersection = Intersect.OUTSIDE;
    if (this.inverse) {
      intersection = Intersect.INSIDE;
    }

    let tileBoundingRectangle = tileBoundingVolume.rectangle;
    if (
      !defined(tileBoundingRectangle) &&
      defined(tileBoundingVolume.boundingVolume?.computeCorners)
    ) {
      const points = tileBoundingVolume.boundingVolume.computeCorners();
      tileBoundingRectangle = Rectangle.fromCartesianArray(
        points,
        ellipsoid,
        scratchRectangleTile,
      );
    }

    if (!defined(tileBoundingRectangle)) {
      tileBoundingRectangle = Rectangle.fromBoundingSphere(
        tileBoundingVolume.boundingSphere,
        ellipsoid,
        scratchRectangleTile,
      );
    }

    for (let i = 0; i < length; ++i) {
      const polygon = polygons[i];

      const polygonBoundingRectangle = polygon.computeRectangle(
        scratchRectanglePolygon,
      );

      const result = Rectangle.simpleIntersection(
        tileBoundingRectangle,
        polygonBoundingRectangle,
        scratchRectangleIntersection,
      );

      if (defined(result)) {
        return Intersect.INTERSECTING;
      }
    }

    return intersection;
  };

/**
 * Sets the owner for the input ClippingPolygonCollection if there wasn't another owner.
 * Destroys the owner's previous ClippingPolygonCollection if setting is successful.
 *
 * @param {ClippingPolygonCollection} [clippingPolygonsCollection] A ClippingPolygonCollection (or undefined) being attached to an object
 * @param {object} owner An Object that should receive the new ClippingPolygonCollection
 * @param {string} key The Key for the Object to reference the ClippingPolygonCollection
 * @ignore
 */
ClippingPolygonCollection.setOwner = function (
  clippingPolygonsCollection,
  owner,
  key,
) {
  // Don't destroy the ClippingPolygonCollection if it is already owned by newOwner
  if (clippingPolygonsCollection === owner[key]) {
    return;
  }
  // Destroy the existing ClippingPolygonCollection, if any
  owner[key] = owner[key] && owner[key].destroy();
  if (defined(clippingPolygonsCollection)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(clippingPolygonsCollection._owner)) {
      throw new DeveloperError(
        "ClippingPolygonCollection should only be assigned to one object",
      );
    }
    //>>includeEnd('debug');
    clippingPolygonsCollection._owner = owner;
    owner[key] = clippingPolygonsCollection;
  }
};

/**
 * 检查上下文是否允许裁剪多边形（需要浮点纹理）。
 *
 * @param {Scene|object} scene 将包含被裁剪对象和裁剪纹理的场景。
 * @returns {boolean} 如果上下文支持裁剪多边形则返回 <code>true</code>。
 */
ClippingPolygonCollection.isSupported = function (scene) {
  return scene?.context.webgl2;
};

/**
 * Function for getting packed texture resolution.
 * If the ClippingPolygonCollection hasn't been updated, returns the resolution that will be
 * allocated based on the provided needed pixels.
 *
 * @param {Texture} texture The texture to be packed.
 * @param {number} pixelsNeeded The number of pixels needed based on the current polygon count.
 * @param {Cartesian2} result A Cartesian2 for the result.
 * @returns {Cartesian2} The required resolution.
 * @private
 */
ClippingPolygonCollection.getTextureResolution = function (
  texture,
  pixelsNeeded,
  result,
) {
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  const maxSize = ContextLimits.maximumTextureSize;
  result.x = Math.min(pixelsNeeded, maxSize);
  result.y = Math.ceil(pixelsNeeded / result.x);

  // Allocate twice as much space as needed to avoid frequent texture reallocation.
  result.y *= 2;

  return result;
};

/**
 * Function for getting the clipping collection's signed distance texture resolution.
 * If the ClippingPolygonCollection hasn't been updated, returns the resolution that will be
 * allocated based on the current settings
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection The clipping polygon collection
 * @param {Cartesian2} result A Cartesian2 for the result.
 * @returns {Cartesian2} The required resolution.
 * @private
 */
ClippingPolygonCollection.getClippingDistanceTextureResolution = function (
  clippingPolygonCollection,
  result,
) {
  const texture = clippingPolygonCollection.signedDistanceTexture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  const quality = clippingPolygonCollection.quality;
  const baseSize = Math.max(128, Math.ceil(4096 * quality));
  result.x = Math.min(ContextLimits.maximumTextureSize, baseSize);
  result.y = Math.min(ContextLimits.maximumTextureSize, baseSize);

  return result;
};

/**
 * Function for getting the clipping collection's extents texture resolution.
 * If the ClippingPolygonCollection hasn't been updated, returns the resolution that will be
 * allocated based on the current polygon count.
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection The clipping polygon collection
 * @param {Cartesian2} result A Cartesian2 for the result.
 * @returns {Cartesian2} The required resolution.
 * @private
 */
ClippingPolygonCollection.getClippingExtentsTextureResolution = function (
  clippingPolygonCollection,
  result,
) {
  const texture = clippingPolygonCollection.extentsTexture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  return ClippingPolygonCollection.getTextureResolution(
    texture,
    clippingPolygonCollection.pixelsNeededForExtents,
    result,
  );
};

/**
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see ClippingPolygonCollection#destroy
 */
ClippingPolygonCollection.prototype.isDestroyed = function () {
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
 * clippingPolygons = clippingPolygons && clippingPolygons.destroy();
 *
 * @see ClippingPolygonCollection#isDestroyed
 */
ClippingPolygonCollection.prototype.destroy = function () {
  if (defined(this._signedDistanceComputeCommand)) {
    this._signedDistanceComputeCommand.canceled = true;
  }

  this._polygonsTexture =
    this._polygonsTexture && this._polygonsTexture.destroy();
  this._extentsTexture = this._extentsTexture && this._extentsTexture.destroy();
  this._signedDistanceTexture =
    this._signedDistanceTexture && this._signedDistanceTexture.destroy();
  return destroyObject(this);
};

export default ClippingPolygonCollection;
