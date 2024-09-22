import DeveloperError from "./DeveloperError.js";

/**
 * 单个图块的地形数据。 此类型描述
 * 接口，并且不打算直接实例化。
 *
 * @alias TerrainData
 * @constructor
 *
 * @see HeightmapTerrainData
 * @see QuantizedMeshTerrainData
 * @see GoogleEarthEnterpriseTerrainData
 */
function TerrainData() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainData.prototype, {
  /**
   * 此磁贴的制作人员名单数组。
   * @memberof TerrainData.prototype
   * @type {Credit[]}
   */
  credits: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 此地形数据中包含的水面罩（如果有）。 水面罩是矩形的
   * Uint8Array 或图像，其中值 255 表示水，值 0 表示陆地。
   * 允许介于 0 和 255 之间的值，以便在陆地和水之间平滑混合。
   * @memberof TerrainData.prototype
   * @type {Uint8Array|HTMLImageElement|HTMLCanvasElement}
   */
  waterMask: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 计算指定经纬度处的地形高度。
 * @function
 *
 * @param {Rectangle} rectangle 此地形数据覆盖的矩形。
 * @param {number} longitude 以弧度为单位的经度。
 * @param {number} latitude 以弧度为单位的纬度。
 * @returns {number} 指定位置的地形高度。 如果位置
 * 在矩形之外，这个方法会推断高度，很可能会很疯狂
 * 对于远在矩形之外的位置不正确。
 */
TerrainData.prototype.interpolateHeight =
  DeveloperError.throwInstantiationError;

/**
 * 根据
 * {@link TerrainData#childTileMask} 的 SurfaceData 中。 假定给定的子图块坐标
 * 成为此牌的四个子牌之一。 如果非子图块坐标为
 * 给定，则返回 southeast child tile 的可用性。
 * @function
 *
 * @param {number} thisX 此（父）瓦片的瓦片 X 坐标。
 * @param {number} thisY 此（父）瓦片的瓦片 Y 坐标。
 * @param {number} childX 用于检查可用性的子磁贴的磁贴 X 坐标。
 * @param {number} childY 要检查可用性的子磁贴的磁贴 Y 坐标。
 * @returns {boolean} 如果子磁贴可用，则为 True;否则为 false。
 */
TerrainData.prototype.isChildAvailable = DeveloperError.throwInstantiationError;

/**
 * 从此地形数据创建 {@link TerrainMesh}。
 * @function
 *
 * @private
 *
 * @param {object} options 对象，具有以下属性:
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的平铺方案。
 * @param {number} options.x x坐标 瓦片，为其创建地形数据。
 * @param {number} options.y y坐标 瓦片，为其创建 terrain 数据。
 * @param {number} options.level 要为其创建 terrain 数据的瓦片的级别。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例尺。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 地形被夸大的相对高度。
 * @param {boolean} [options.throttle=true] 如果为 true，则表示如果正在进行的异步网格创建太多，则需要重试此操作。
 * @returns {Promise<TerrainMesh>|undefined} 地形网格的 Promise，如果太多，则为 undefined
 * 异步网格创建已在进行中，操作应
 * 稍后重试。
 */
TerrainData.prototype.createMesh = DeveloperError.throwInstantiationError;

/**
 * 对此地形数据进行上采样，以供后代瓦片使用。
 * @function
 *
 * @param {TilingScheme} tilingScheme 此地形数据的平铺方案。
 * @param {number} thisX 平铺方案中此瓦片的 X 坐标。
 * @param {number} thisY 此瓦片在切片方案中的 Y 坐标。
 * @param {number} thisLevel 此瓦片在平铺方案中的级别。
 * @param {number} descendantX 我们正在上采样的后代瓦片的平铺方案中的 X 坐标。
 * @param {number} descendantY 我们正在进行上采样的后代瓦片的平铺方案中的 Y 坐标。
 * @param {number} descendantLevel 我们正在上采样的后代瓦片的平铺方案中的级别。
 * @returns {Promise<TerrainData>|undefined} 后代瓦片的上采样地形数据的承诺，
 * 或 undefined 如果正在进行的异步 Upsample 操作过多，并且请求已被
 * 递延。
 */
TerrainData.prototype.upsample = DeveloperError.throwInstantiationError;

/**
 * 获取一个值，该值指示此地形数据是否是通过对较低分辨率的上采样创建的
 * 地形数据。 如果此值为 false，则数据是从其他来源获取的，例如
 * 从远程服务器下载。 对于实例，此方法应返回 true
 * 从调用 {@link TerrainData#upsample} 返回。
 * @function
 *
 * @returns {boolean} 如果此实例是通过上采样创建的，则为 True;否则为 false。
 */
TerrainData.prototype.wasCreatedByUpsampling =
  DeveloperError.throwInstantiationError;

/**
 * 用于地形处理的异步任务的最大数量。
 *
 * @type {number}
 * @private
 */
TerrainData.maximumAsynchronousTasks = 5;

export default TerrainData;
