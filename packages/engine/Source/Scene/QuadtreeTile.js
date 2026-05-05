// @ts-check

import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Rectangle from "../Core/Rectangle.js";
import Cartographic from "../Core/Cartographic.js";
import QuadtreeTileLoadState from "./QuadtreeTileLoadState.js";
import TileSelectionResult from "./TileSelectionResult.js";

/** @import TilingScheme from "../Core/TilingScheme.js"; */

/**
 * A simple Least Recently Used (LRU) cache implementation.
 *
 * @private
 */
class LRUCache {
  /** @param {number} maxSize */
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * @param {unknown} key
   * @returns {unknown}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move accessed item to the end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * @param {unknown} key
   * @param {unknown} value
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove the least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * @type {number}
   * @readonly
   */
  get size() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}

// Maximum cache entries per tile
const MAX_CACHE_ENTRIES = 1000;

/**
 * A single tile in a {@link QuadtreePrimitive}.
 *
 * @private
 */
class QuadtreeTile {
  /**
   * @param {object} options
   * @param {number} options.level 四叉树中瓦片的层级。
   * @param {number} options.x 四叉树中瓦片的 X 坐标。0 表示最西边的瓦片。
   * @param {number} options.y 四叉树中瓦片的 Y 坐标。0 表示最北边的瓦片。
   * @param {TilingScheme} options.tilingScheme 此瓦片所属的切片方案。
   * @param {QuadtreeTile} [options.parent] 此瓦片的父瓦片，如果是根瓦片则为 undefined。
   */
  constructor(options) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(options)) {
      throw new DeveloperError("options is required.");
    }
    if (!defined(options.x)) {
      throw new DeveloperError("options.x is required.");
    } else if (!defined(options.y)) {
      throw new DeveloperError("options.y is required.");
    } else if (options.x < 0 || options.y < 0) {
      throw new DeveloperError(
        "options.x and options.y must be greater than or equal to zero.",
      );
    }
    if (!defined(options.level)) {
      throw new DeveloperError(
        "options.level is required and must be greater than or equal to zero.",
      );
    }
    if (!defined(options.tilingScheme)) {
      throw new DeveloperError("options.tilingScheme is required.");
    }
    //>>includeEnd('debug');

    this._tilingScheme = options.tilingScheme;
    this._x = options.x;
    this._y = options.y;
    this._level = options.level;
    this._parent = options.parent;

    /** @type {Rectangle} */
    this._rectangle = this._tilingScheme.tileXYToRectangle(
      this._x,
      this._y,
      this._level,
    );

    this._southwestChild = undefined;
    this._southeastChild = undefined;
    this._northwestChild = undefined;
    this._northeastChild = undefined;

    // TileReplacementQueue gets/sets these private properties.
    this.replacementPrevious = undefined;
    this.replacementNext = undefined;

    // The distance from the camera to this tile, updated when the tile is selected
    // for rendering.  We can get rid of this if we have a better way to sort by
    // distance - for example, by using the natural ordering of a quadtree.
    // QuadtreePrimitive gets/sets this private property.
    this._distance = 0.0;
    this._loadPriority = 0.0;

    this._customData = new Set();
    this._customDataIterator = undefined;
    /** @type {unknown[]} */
    this._addedCustomData = [];
    /** @type {unknown[]} */
    this._removedCustomData = [];
    this._lastSelectionResult = TileSelectionResult.NONE;
    this._lastSelectionResultFrame = undefined;
    this._loadedCallbacks = {};

    // Cache for storing computed position values per tile to avoid redundant calculations
    this._positionCache = new LRUCache(MAX_CACHE_ENTRIES);

    /**
     * 获取或设置瓦片在瓦片加载管线中的当前状态。
     * @type {QuadtreeTileLoadState}
     * @default {@link QuadtreeTileLoadState.START}
     */
    this.state = QuadtreeTileLoadState.START;

    /**
     * 获取或设置一个值，指示瓦片当前是否可渲染。
     * @type {boolean}
     * @default false
     */
    this.renderable = false;

    /**
     * 获取或设置一个值，指示此瓦片是否完全由其父瓦片上采样而来。如果父瓦片的所有四个子瓦片都是从父瓦片上采样的，
     * 我们将渲染父瓦片而不是子瓦片，即使 LOD 表明子瓦片会更优。
     * @type {boolean}
     * @default false
     */
    this.upsampledFromParent = false;

    /**
     * 获取或设置与此瓦片关联的附加数据。具体内容取决于 {@link QuadtreeTileProvider}。
     * @type {object}
     * @default undefined
     */
    this.data = undefined;
  }

  /**
   * 为零级细节（最粗糙、最不详细的级别）创建矩形瓦片集。
   *
   * @param {TilingScheme} tilingScheme 要为其创建瓦片的切片方案。
   * @returns {QuadtreeTile[]} 包含零级细节瓦片的数组，从西北角的瓦片开始，
   * 后跟其东边的瓦片（如果有）。
   */
  static createLevelZeroTiles(tilingScheme) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(tilingScheme)) {
      throw new DeveloperError("tilingScheme is required.");
    }
    //>>includeEnd('debug');

    const numberOfLevelZeroTilesX = tilingScheme.getNumberOfXTilesAtLevel(0);
    const numberOfLevelZeroTilesY = tilingScheme.getNumberOfYTilesAtLevel(0);

    const result = new Array(numberOfLevelZeroTilesX * numberOfLevelZeroTilesY);

    let index = 0;
    for (let y = 0; y < numberOfLevelZeroTilesY; ++y) {
      for (let x = 0; x < numberOfLevelZeroTilesX; ++x) {
        result[index++] = new QuadtreeTile({
          tilingScheme: tilingScheme,
          x: x,
          y: y,
          level: 0,
        });
      }
    }

    return result;
  }

  /**
   * 为给定的地图投影位置生成唯一的缓存键。
   *
   * @param {Cartographic} cartographic 地图投影坐标。
   * @param {number} maximumScreenSpaceError 允许的最大屏幕空间误差（以像素为单位）。
   *        较高的最大误差将渲染更少的瓦片并提高性能，而较低的值将提高视觉质量。
   * @returns {string} 表示空间哈希键的字符串。
   */
  _getCacheKey(cartographic, maximumScreenSpaceError) {
    return createSpatialHashKey(
      cartographic.longitude,
      cartographic.latitude,
      this._rectangle,
      maximumScreenSpaceError,
    );
  }

  /**
   * 检索指定地图投影位置的缓存位置。
   *
   * @param {Cartographic} cartographic - 地图投影坐标。
   * @param {number} maximumScreenSpaceError 允许的最大屏幕空间误差（以像素为单位）。
   *        较高的最大误差将渲染更少的瓦片并提高性能，而较低的值将提高视觉质量。
   * @returns {object|undefined} 缓存的位置数据，如果未找到则返回 undefined。
   */
  getPositionCacheEntry(cartographic, maximumScreenSpaceError) {
    const result = this._positionCache.get(
      this._getCacheKey(cartographic, maximumScreenSpaceError),
    );
    return /** @type {object|undefined} */ (result);
  }

  /**
   * 为此瓦片设置缓存位置。
   *
   * @param {Cartographic} cartographic - 地图投影坐标。
   * @param {number} maximumScreenSpaceError 允许的最大屏幕空间误差（以像素为单位）。
   *        较高的最大误差将渲染更少的瓦片并提高性能，而较低的值将提高视觉质量。
   * @param {object} value - 要缓存的对象。
   */
  setPositionCacheEntry(cartographic, maximumScreenSpaceError, value) {
    this._positionCache.set(
      this._getCacheKey(cartographic, maximumScreenSpaceError),
      value,
    );
  }

  /**
   * 清除此瓦片的位置缓存。
   * 此函数移除之前存储的所有缓存位置，以优化高度计算。
   *
   */
  clearPositionCache() {
    if (this._positionCache.size > 0) {
      this._positionCache.clear();
    }
  }

  updateCustomData() {
    const added = this._addedCustomData;
    const removed = this._removedCustomData;
    if (added.length === 0 && removed.length === 0) {
      return;
    }

    const customData = this.customData;
    for (let i = 0; i < added.length; ++i) {
      const data = /** @type {*} */ (added[i]);
      customData.add(data);

      const child = childTileAtPosition(this, data.positionCartographic);
      child._addedCustomData.push(data);
    }
    this._addedCustomData.length = 0;

    for (let i = 0; i < removed.length; ++i) {
      const data = /** @type {*} */ (removed[i]);
      if (customData.has(data)) {
        customData.delete(data);
      }

      const child = childTileAtPosition(this, data.positionCartographic);
      child._removedCustomData.push(data);
    }
    this._removedCustomData.length = 0;
  }

  /**
   * 获取用于对表面进行切片的切片方案。
   * @type {TilingScheme}
   */
  get tilingScheme() {
    return this._tilingScheme;
  }

  /**
   * 获取瓦片的 X 坐标。
   * @type {number}
   */
  get x() {
    return this._x;
  }

  /**
   * 获取瓦片的 Y 坐标。
   * @type {number}
   */
  get y() {
    return this._y;
  }

  /**
   * 获取细节层级，零表示最粗糙、最不详细的级别。
   * @type {number}
   */
  get level() {
    return this._level;
  }

  /**
   * 获取此瓦片的父瓦片。
   * @type {QuadtreeTile}
   */
  get parent() {
    return this._parent;
  }

  /**
   * 获取瓦片的地图投影矩形范围，包含以弧度为单位的北、南、东和西属性。
   * @type {Rectangle}
   */
  get rectangle() {
    return this._rectangle;
  }

  /**
   * 位于瓦片树下一级的瓦片数组。
   * @type {QuadtreeTile[]}
   */
  get children() {
    return [
      this.northwestChild,
      this.northeastChild,
      this.southwestChild,
      this.southeastChild,
    ];
  }

  /**
   * 获取西南子瓦片。
   * @type {QuadtreeTile}
   */
  get southwestChild() {
    if (!defined(this._southwestChild)) {
      this._southwestChild = new QuadtreeTile({
        tilingScheme: this.tilingScheme,
        x: this.x * 2,
        y: this.y * 2 + 1,
        level: this.level + 1,
        parent: this,
      });
    }
    return this._southwestChild;
  }

  /**
   * 获取东南子瓦片。
   * @type {QuadtreeTile}
   */
  get southeastChild() {
    if (!defined(this._southeastChild)) {
      this._southeastChild = new QuadtreeTile({
        tilingScheme: this.tilingScheme,
        x: this.x * 2 + 1,
        y: this.y * 2 + 1,
        level: this.level + 1,
        parent: this,
      });
    }
    return this._southeastChild;
  }

  /**
   * 获取西北子瓦片。
   * @type {QuadtreeTile}
   */
  get northwestChild() {
    if (!defined(this._northwestChild)) {
      this._northwestChild = new QuadtreeTile({
        tilingScheme: this.tilingScheme,
        x: this.x * 2,
        y: this.y * 2,
        level: this.level + 1,
        parent: this,
      });
    }
    return this._northwestChild;
  }

  /**
   * 获取东北子瓦片。
   * @type {QuadtreeTile}
   */
  get northeastChild() {
    if (!defined(this._northeastChild)) {
      this._northeastChild = new QuadtreeTile({
        tilingScheme: this.tilingScheme,
        x: this.x * 2 + 1,
        y: this.y * 2,
        level: this.level + 1,
        parent: this,
      });
    }
    return this._northeastChild;
  }

  /**
   * 与此瓦片关联的对象集合。
   * @type {Set<*>}
   */
  get customData() {
    return this._customData;
  }

  /**
   * 获取一个值，指示此瓦片是否需要进一步加载。
   * 如果 {@link QuadtreeTile#state} 为 <code>START</code> 或 <code>LOADING</code>，
   * 此属性将返回 true。
   * @type {boolean}
   */
  get needsLoading() {
    return this.state < QuadtreeTileLoadState.DONE;
  }

  /**
   * 获取一个值，指示此瓦片是否允许卸载。
   * 通常，当瓦片上正在进行异步操作（例如数据请求）时，不允许卸载。
   * 无论此属性的值如何，瓦片在需要渲染时都不会被卸载。
   * 如果定义了 {@link QuadtreeTile#data} 且具有 <code>eligibleForUnloading</code> 属性，
   * 则返回该属性的值。否则，此属性返回 true。
   * @type {boolean}
   */
  get eligibleForUnloading() {
    let result = true;

    if (defined(this.data)) {
      result = /** @type {*} */ (this.data).eligibleForUnloading;
      if (!defined(result)) {
        result = true;
      }
    }

    return result;
  }

  /**
   * @param {QuadtreeTile[]} levelZeroTiles
   * @param {number} x
   * @param {number} y
   * @returns {QuadtreeTile}
   */
  findLevelZeroTile(levelZeroTiles, x, y) {
    const xTiles = this.tilingScheme.getNumberOfXTilesAtLevel(0);
    if (x < 0) {
      x += xTiles;
    } else if (x >= xTiles) {
      x -= xTiles;
    }

    if (y < 0 || y >= this.tilingScheme.getNumberOfYTilesAtLevel(0)) {
      return undefined;
    }

    return levelZeroTiles.filter(function (tile) {
      return tile.x === x && tile.y === y;
    })[0];
  }

  /**
   * @param {QuadtreeTile[]} levelZeroTiles
   * @returns {QuadtreeTile|undefined}
   */
  findTileToWest(levelZeroTiles) {
    const parent = this.parent;
    if (parent === undefined) {
      return this.findLevelZeroTile(levelZeroTiles, this.x - 1, this.y);
    }

    if (parent.southeastChild === this) {
      return parent.southwestChild;
    } else if (parent.northeastChild === this) {
      return parent.northwestChild;
    }

    const westOfParent = parent.findTileToWest(levelZeroTiles);
    if (westOfParent === undefined) {
      return undefined;
    } else if (parent.southwestChild === this) {
      return westOfParent.southeastChild;
    }
    return westOfParent.northeastChild;
  }

  /**
   * @param {QuadtreeTile[]} levelZeroTiles
   * @returns {QuadtreeTile|undefined}
   */
  findTileToEast(levelZeroTiles) {
    const parent = this.parent;
    if (parent === undefined) {
      return this.findLevelZeroTile(levelZeroTiles, this.x + 1, this.y);
    }

    if (parent.southwestChild === this) {
      return parent.southeastChild;
    } else if (parent.northwestChild === this) {
      return parent.northeastChild;
    }

    const eastOfParent = parent.findTileToEast(levelZeroTiles);
    if (eastOfParent === undefined) {
      return undefined;
    } else if (parent.southeastChild === this) {
      return eastOfParent.southwestChild;
    }
    return eastOfParent.northwestChild;
  }

  /**
   * @param {QuadtreeTile[]} levelZeroTiles
   * @returns {QuadtreeTile|undefined}
   */
  findTileToSouth(levelZeroTiles) {
    const parent = this.parent;
    if (parent === undefined) {
      return this.findLevelZeroTile(levelZeroTiles, this.x, this.y + 1);
    }

    if (parent.northwestChild === this) {
      return parent.southwestChild;
    } else if (parent.northeastChild === this) {
      return parent.southeastChild;
    }

    const southOfParent = parent.findTileToSouth(levelZeroTiles);
    if (southOfParent === undefined) {
      return undefined;
    } else if (parent.southwestChild === this) {
      return southOfParent.northwestChild;
    }
    return southOfParent.northeastChild;
  }

  /**
   * @param {QuadtreeTile[]} levelZeroTiles
   * @returns {QuadtreeTile|undefined}
   */
  findTileToNorth(levelZeroTiles) {
    const parent = this.parent;
    if (parent === undefined) {
      return this.findLevelZeroTile(levelZeroTiles, this.x, this.y - 1);
    }

    if (parent.southwestChild === this) {
      return parent.northwestChild;
    } else if (parent.southeastChild === this) {
      return parent.northeastChild;
    }

    const northOfParent = parent.findTileToNorth(levelZeroTiles);
    if (northOfParent === undefined) {
      return undefined;
    } else if (parent.northwestChild === this) {
      return northOfParent.southwestChild;
    }
    return northOfParent.southeastChild;
  }

  /**
   * 释放与此瓦片关联的资源，并将其返回到 <code>START</code>
   * {@link QuadtreeTileLoadState}。如果定义了 {@link QuadtreeTile#data} 属性且具有
   * <code>freeResources</code> 方法，则将调用该方法。
   *
   */
  freeResources() {
    // Clears cached heights when the tile is freed
    this.clearPositionCache();
    this.state = QuadtreeTileLoadState.START;
    this.renderable = false;
    this.upsampledFromParent = false;

    const data = /** @type {*} */ (this.data);
    if (defined(data) && defined(data.freeResources)) {
      data.freeResources();
    }

    freeTile(this._southwestChild);
    this._southwestChild = undefined;
    freeTile(this._southeastChild);
    this._southeastChild = undefined;
    freeTile(this._northwestChild);
    this._northwestChild = undefined;
    freeTile(this._northeastChild);
    this._northeastChild = undefined;
  }
}

/**
 * 为给定的经度、纬度和瓦片层级创建空间哈希键。
 * 精度会根据瓦片层级和范围进行调整，以在较高层级实现更精细的精度。
 *
 * 此函数通过首先确定当前最大屏幕空间误差（MAX_ERROR_PX）下给定瓦片的精度，
 * 然后将经度和纬度舍入到该精度以保持一致性来计算空间哈希键。
 *
 * 计算层级精度的步骤如下：
 *
 * 1. 计算给定层级的分辨率（每像素米数）：
 *      level_resolution_m = (2 * PI * RADIUS) / (2^level * TILE_SIZE)
 *
 * 2. 计算目标精度（米）：
 *      level_precision_m = level_resolution_m * MAX_ERROR_PX
 *
 * 3. 计算目标精度（弧度）：
 *      level_precision_rad = level_precision_m / BODY_RADIUS
 *
 * 简化为：
 *      level_precision_rad = (2 * PI * MAX_ERROR_PX) / (2^level * TILE_SIZE)
 * 也可写为：
 *      level_precision_rad = (PI * MAX_ERROR_PX) / (2^(level-1) * TILE_SIZE)
 *
 * 计算出的 level_precision_rad 随后用于舍入输入的经度和纬度，
 * 确保落在同一空间格网内的位置产生相同的哈希键。
 *
 * 下面的常量是一次性计算得出的，因为对于给定配置它们是固定的。
 *
 * @param {number} longitude - 以弧度为单位的经度。
 * @param {number} latitude - 以弧度为单位的纬度。
 * @param {Rectangle} rectangle - 四叉树瓦片范围。
 * @returns {string} 表示空间哈希键的字符串。
 */
const TILE_SIZE = 256;

/**
 * @param {number} longitude
 * @param {number} latitude
 * @param {Rectangle} rectangle
 * @param {number} maximumScreenSpaceError
 * @returns {string}
 * @ignore
 */
function createSpatialHashKey(
  longitude,
  latitude,
  rectangle,
  maximumScreenSpaceError,
) {
  // Adjust precision based on quadtree level - higher levels get finer precision
  const maxError = (rectangle.width / TILE_SIZE) * maximumScreenSpaceError;
  // Round to the grid precision
  const lonGrid = Math.floor(longitude / maxError) * maxError;
  const latGrid = Math.floor(latitude / maxError) * maxError;
  return `${lonGrid.toFixed(10)},${latGrid.toFixed(10)}`;
}

const splitPointScratch = new Cartographic();

/**
 * Determines which child tile that contains the specified position. Assumes the position is within
 * the bounds of the parent tile.
 * @private
 * @param {QuadtreeTile} tile - The parent tile.
 * @param {Cartographic} positionCartographic - The cartographic position.
 * @returns {QuadtreeTile} The child tile that contains the position.
 */
function childTileAtPosition(tile, positionCartographic) {
  // Can't assume that a given tiling scheme divides a parent into four tiles at its rectangle's center.
  // But we can safely take any child tile's rectangle and take its center-facing corner as the parent's split point.
  const nwChildRectangle = tile.northwestChild.rectangle;
  const tileSplitPoint = Rectangle.southeast(
    nwChildRectangle,
    splitPointScratch,
  );

  const x = positionCartographic.longitude >= tileSplitPoint.longitude ? 1 : 0;
  const y = positionCartographic.latitude < tileSplitPoint.latitude ? 1 : 0;

  switch (y * 2 + x) {
    case 0:
      return tile.northwestChild;
    case 1:
      return tile.northeastChild;
    case 2:
      return tile.southwestChild;
    default:
      return tile.southeastChild;
  }
}

/**
 * @param {QuadtreeTile} tile
 * @ignore
 */
function freeTile(tile) {
  if (defined(tile)) {
    tile.freeResources();
  }
}

export default QuadtreeTile;
