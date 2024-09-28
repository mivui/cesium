import Cartesian2 from "../Core/Cartesian2.js";
import CesiumMath from "../Core/Math.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
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

/**
 * 指定一组剪切多边形。剪切多边形有选择地禁用区域中的渲染
 * 单个 glTF 模型、3D 瓦片集或地球的指定 {@link ClippingPolygon} 对象列表的内部或外部。
 *
 * 仅在 WebGL 2 上下文中支持剪切多边形。
 *
 * @alias ClippingPolygonCollection
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {ClippingPolygon[]} [options.polygons=[]] 一个 {@link ClippingPolygon} 对象数组，用于选择性地禁用每个多边形内部的渲染。
 * @param {boolean} [options.enabled=true] 确定裁剪多边形是否处于活动状态。
 * @param {boolean} [options.inverse=false] 如果为 true，则如果区域位于集合中的每个多边形之外，则该区域将被裁剪。否则，仅当区域位于任何多边形的内部时，才会对其进行裁剪。
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._polygons = [];
  this._totalPositions = 0;

  /**
   * 如果为 true，则将启用剪辑。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {boolean}
   * @default true
   */
  this.enabled = defaultValue(options.enabled, true);

  /**
   * 如果为 true，则如果区域位于
   *收集。否则，仅当区域
   * 在任何多边形内。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {boolean}
   * @default false
   */
  this.inverse = defaultValue(options.inverse, false);

  /**
   * 将新的剪切多边形添加到集合时触发的事件。 事件处理程序
   * 的 Bean Bean Bean 的 Bean Bean S Bean 的 Polygon 和添加该 Polygon 的索引。
   * @type {Event}
   * @default Event()
   */
  this.polygonAdded = new Event();

  /**
   * 从集合中删除新的剪切多边形时触发的事件。 事件处理程序
   * 将传递新多边形和从中删除该多边形的索引。
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
   * 返回此集合中的多边形数。 这通常与
   * {@link ClippingPolygonCollection#get} 迭代所有多边形
   * 在集合中。
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
   * 返回集合中所有多边形中位置的总数。
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
   * 返回一个纹理，其中包含每个多边形的打包计算球形范围
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
   * 返回打包的扩展数据块数，该数目可以小于多边形数。
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
   * 返回包含每个多边形的压缩计算球形范围的纹理中所需的像素数。
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
   * 返回包含紧缩多边形位置的纹理中所需的像素数。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  pixelsNeededForPolygonPositions: {
    get: function () {
      // In an RG FLOAT texture, each polygon position is 2 floats packed to a RG.
      // Each polygon is the number of positions of that polygon, followed by the list of positions
      return this.totalPositions + this.length;
    },
  },

  /**
   *返回包含每个多边形的计算有向距离的纹理。
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
   * 对 ClippingPolygonCollection 的所有者的引用（如果有）。
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
   * 返回一个数字，该数字封装了此 ClippingPolygonCollection 的状态。
   *
   * 削波模式以数字的符号编码，这只是总位置计数。
   * 如果此值更改，则需要着色器重新生成。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @returns {number} 描述 ClippingPolygonCollection 状态的 Number。
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
 * 将指定的 {@link ClippingPolygon} 添加到集合中，以用于选择性地禁用渲染
 * 在每个多边形的内部。使用 {@link ClippingPolygonCollection#unionClippingRegions} 修改
 * 如何修改多个多边形的裁剪行为。
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
 * 返回集合中指定索引处的剪切多边形。 索引从 0 开始
 * 并随着多边形的添加而增加。 移除 Polygon Faces 之后的所有多边形
 * 它向左移动，更改其索引。 此功能通常用于
 * {@link ClippingPolygonCollection#length} 迭代所有多边形
 * 在集合中。
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
 * 检查此集合是否包含等于给定 ClippingPolygon 的 ClippingPolygon。
 *
 * @param {ClippingPolygon} polygon 要检查的 ClippingPolygon。
 * @returns {boolean} 如果此集合包含 ClippingPolygon，则 true， 否则 false 。
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
 * 从集合中删除给定 ClippingPolygon 的第一个匹配项。
 *
 * @param {ClippingPolygon} polygon
 * @returns {boolean} <code>如果</code>删除了多边形，则为 true;<code>如果在</code>集合中找不到多边形，则为 false。
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

const scratchRectangle = new Rectangle();

// Map the polygons to a list of extents-- Overlapping extents will be merged
// into a single encompassing extent
function getExtents(polygons) {
  const extentsList = [];
  const polygonIndicesList = [];

  const length = polygons.length;
  for (let polygonIndex = 0; polygonIndex < length; ++polygonIndex) {
    const polygon = polygons[polygonIndex];
    const extents = polygon.computeSphericalExtents();

    let height = Math.max(extents.height * 2.5, 0.001);
    let width = Math.max(extents.width * 2.5, 0.001);

    // Pad extents to avoid floating point error when fragment culling at edges.
    let paddedExtents = Rectangle.clone(extents);
    paddedExtents.south -= height;
    paddedExtents.west -= width;
    paddedExtents.north += height;
    paddedExtents.east += width;

    paddedExtents.south = Math.max(paddedExtents.south, -Math.PI);
    paddedExtents.west = Math.max(paddedExtents.west, -Math.PI);
    paddedExtents.north = Math.min(paddedExtents.north, Math.PI);
    paddedExtents.east = Math.min(paddedExtents.east, Math.PI);

    const polygonIndices = [polygonIndex];
    for (let i = 0; i < extentsList.length; ++i) {
      const e = extentsList[i];
      if (
        defined(e) &&
        defined(Rectangle.simpleIntersection(e, paddedExtents)) &&
        !Rectangle.equals(e, paddedExtents)
      ) {
        const intersectingPolygons = polygonIndicesList[i];
        polygonIndices.push(...intersectingPolygons);
        intersectingPolygons.reduce(
          (extents, p) =>
            Rectangle.union(
              polygons[p].computeSphericalExtents(scratchRectangle),
              extents,
              extents,
            ),
          extents,
        );

        extentsList[i] = undefined;
        polygonIndicesList[i] = undefined;

        height = Math.max(extents.height * 2.5, 0.001);
        width = Math.max(extents.width * 2.5, 0.001);

        paddedExtents = Rectangle.clone(extents, paddedExtents);
        paddedExtents.south -= height;
        paddedExtents.west -= width;
        paddedExtents.north += height;
        paddedExtents.east += width;

        paddedExtents.south = Math.max(paddedExtents.south, -Math.PI);
        paddedExtents.west = Math.max(paddedExtents.west, -Math.PI);
        paddedExtents.north = Math.min(paddedExtents.north, Math.PI);
        paddedExtents.east = Math.min(paddedExtents.east, Math.PI);

        // Reiterate through the extents list until there are no more intersections
        i = -1;
      }
    }

    extentsList.push(paddedExtents);
    polygonIndicesList.push(polygonIndices);
  }

  const extentsIndexByPolygon = new Map();
  polygonIndicesList
    .filter(defined)
    .forEach((polygonIndices, e) =>
      polygonIndices.forEach((p) => extentsIndexByPolygon.set(p, e)),
    );

  return {
    extentsList: extentsList.filter(defined),
    extentsIndexByPolygon: extentsIndexByPolygon,
  };
}

/**
 * 从集合中删除所有多边形。
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

  const { extentsList, extentsIndexByPolygon } = getExtents(polygons);

  let floatIndex = 0;
  for (const [polygonIndex, polygon] of polygons.entries()) {
    // Pack the length of the polygon into the polygon texture array buffer
    const length = polygon.length;
    polygonsFloat32View[floatIndex++] = length;
    polygonsFloat32View[floatIndex++] = extentsIndexByPolygon.get(polygonIndex);

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

  // Pack extents
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
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 构建用于剪切多边形的资源。
 * <p>
 * 请勿直接调用此函数。
 * </p>
 * @private
 * @throws {RuntimeError} ClippingPolygonCollections 仅支持 WebGL 2
 */
ClippingPolygonCollection.prototype.update = function (frameState) {
  const context = frameState.context;

  if (!ClippingPolygonCollection.isSupported(frameState)) {
    throw new RuntimeError(
      "ClippingPolygonCollections are only supported for WebGL 2.",
    );
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

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 构建用于剪切多边形的资源。
 * <p>
 * 请勿直接调用此函数。
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
/**
 * 确定与此 ClippingPolygonCollection 实例的多边形和指定的 {@link TileBoundingVolume} 的交集类型。
 * @private
 *
 * @param {object} tileBoundingVolume 用于确定与多边形交集的体积。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 定义边界体积的椭球体。
 * @returns {Intersect} 交点类型：{@link Intersect.OUTSIDE} 如果未剪切整个体积，则为 {@link Intersect.INSIDE}
 * 如果应剪切整个体积，则为 {@link Intersect.INTERSECTING} 如果体积与多边形相交并将部分剪切。
 */
ClippingPolygonCollection.prototype.computeIntersectionWithBoundingVolume =
  function (tileBoundingVolume, ellipsoid) {
    const polygons = this._polygons;
    const length = polygons.length;

    let intersection = Intersect.OUTSIDE;
    if (this.inverse) {
      intersection = Intersect.INSIDE;
    }

    for (let i = 0; i < length; ++i) {
      const polygon = polygons[i];

      const polygonBoundingRectangle = polygon.computeRectangle();
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

      const result = Rectangle.simpleIntersection(
        tileBoundingRectangle,
        polygonBoundingRectangle,
        scratchRectangleIntersection,
      );

      if (defined(result)) {
        intersection = Intersect.INTERSECTING;
      }
    }

    return intersection;
  };

/**
 * 如果没有其他所有者，则设置输入 ClippingPolygonCollection 的所有者。
 * 如果设置成功，则销毁所有者之前的 ClippingPolygonCollection。
 *
 * @param {ClippingPolygonCollection} [clippingPolygonsCollection] 附加到对象的 ClippingPolygonCollection（或未定义）
 * @param {object} owner 应接收新 ClippingPolygonCollection 的对象
 * @param {string} key 对象引用 ClippingPolygonCollection 的 Key
 * @private
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
 * 用于检查上下文是否允许剪切多边形的函数，这需要浮点纹理。
 *
 * @param {Scene|object} scene 将包含剪切对象和剪切纹理的场景。
 * @returns {boolean} <code>true</code>，如果上下文支持剪切多边形。
 */
ClippingPolygonCollection.isSupported = function (scene) {
  return scene?.context.webgl2;
};

/**
 * 用于获取打包纹理分辨率的功能。
 * 如果 ClippingPolygonCollection 尚未更新，则返回将
 * 根据提供的所需像素分配。
 *
 * @param {Texture} texture 要打包的纹理。
 * @param {number} pixelsNeeded 根据当前多边形数量所需的像素数。
 * @param {Cartesian2} result Cartesian2 为结果。
 * @returns {Cartesian2} 所需的分辨率。
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
 * 用于获取裁剪集合的有向距离纹理分辨率的函数。
 * 如果 ClippingPolygonCollection 尚未更新，则返回将
 * 根据当前设置分配
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection 裁剪多边形集合
 * @param {Cartesian2} result Cartesian2 为结果。
 * @returns {Cartesian2} 所需的分辨率。
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

  result.x = Math.min(ContextLimits.maximumTextureSize, 4096);
  result.y = Math.min(ContextLimits.maximumTextureSize, 4096);

  return result;
};

/**
 * 用于获取剪辑集合的范围纹理分辨率的函数。
 * 如果 ClippingPolygonCollection 尚未更新，则返回将
 * 根据当前多边形计数分配。
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection 裁剪多边形集合
 * @param {Cartesian2} result Cartesian2 为结果。
 * @returns {Cartesian2} 所需的分辨率。
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
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code> isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，<code>则为 true</code>;否则为 <code>false</code>。
 *
 * @see ClippingPolygonCollection#destroy
 */
ClippingPolygonCollection.prototype.isDestroyed = function () {
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
