import DeveloperError from "./DeveloperError.js";

/**
 * 单个瓦片的地形数据。此类型描述一个
 * 接口，不打算直接实例化。
 *
 * @alias TerrainData
 * @constructor
 *
 * @see HeightmapTerrainData
 * @see QuantizedMeshTerrainData
 * @see GoogleEarthEnterpriseTerrainData
 * @see Cesium3DTilesTerrainData
 */
function TerrainData() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainData.prototype, {
  /**
   * 此瓦片的信用声明数组。
   * @memberof TerrainData.prototype
   * @type {Credit[]}
   */
  credits: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 此地形数据中包含的水掩码（如果有）。水掩码是一个矩形
   * Uint8Array或图像，其中值255表示水，值0表示陆地。
   * 也允许0到255之间的值，以便平滑地混合陆地和水。
   * @memberof TerrainData.prototype
   * @type {Uint8Array|HTMLImageElement|HTMLCanvasElement|ImageBitmap|undefined}
   */
  waterMask: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 计算指定经度和纬度的地形高度。
 * @function
 *
 * @param {Rectangle} rectangle 此地形数据覆盖的矩形区域。
 * @param {number} longitude 经度（弧度）。
 * @param {number} latitude 纬度（弧度）。
 * @returns {number} 指定位置的地形高度。如果位置
 *          在矩形之外，此方法将外推高度，对于远在矩形之外的位置，结果可能
 *          非常不准确。
 */
TerrainData.prototype.interpolateHeight =
  DeveloperError.throwInstantiationError;

/**
 * 根据{@link TerrainData#childTileMask}确定给定的子瓦片是否可用。给定的子瓦片坐标假定
 * 为此瓦片的四个子瓦片之一。如果给定非子瓦片坐标，
 * 则返回东南子瓦片的可用性。
 * @function
 *
 * @param {number} thisX 此（父）瓦片的瓦片X坐标。
 * @param {number} thisY 此（父）瓦片的瓦片Y坐标。
 * @param {number} childX 要检查可用性的子瓦片的瓦片X坐标。
 * @param {number} childY 要检查可用性的子瓦片的瓦片Y坐标。
 * @returns {boolean} 如果子瓦片可用则为true；否则为false。
 */
TerrainData.prototype.isChildAvailable = DeveloperError.throwInstantiationError;

/**
 * 从此地形数据创建{@link TerrainMesh}。
 * @function
 *
 * @private
 *
 * @param {object} options 具有以下属性的对象：
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的瓦片方案。
 * @param {number} options.x 要为其创建地形数据的瓦片X坐标。
 * @param {number} options.y 要为其创建地形数据的瓦片Y坐标。
 * @param {number} options.level 要为其创建地形数据的瓦片层级。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 地形被夸大的相对高度。
 * @param {boolean} [options.throttle=true] 如果为true，则表示如果已有太多异步网格创建正在进行，则需要重试此操作。
 * @returns {Promise<TerrainMesh>|undefined} 地形网格的Promise，如果已有太多
 *          异步网格创建正在进行且操作应
 *          稍后重试，则为undefined。
 */
TerrainData.prototype.createMesh = DeveloperError.throwInstantiationError;

/**
 * 对此地形数据进行上采样，以供子瓦片使用。
 * @function
 *
 * @param {TilingScheme} tilingScheme 此地形数据的瓦片方案。
 * @param {number} thisX 此瓦片在瓦片方案中的X坐标。
 * @param {number} thisY 此瓦片在瓦片方案中的Y坐标。
 * @param {number} thisLevel 此瓦片在瓦片方案中的层级。
 * @param {number} descendantX 我们要为其进行上采样的子瓦片在瓦片方案中的X坐标。
 * @param {number} descendantY 我们要为其进行上采样的子瓦片在瓦片方案中的Y坐标。
 * @param {number} descendantLevel 我们要为其进行上采样的子瓦片在瓦片方案中的层级。
 * @returns {Promise<TerrainData>|undefined} 子瓦片的上采样地形数据的Promise，
 *          如果已有太多异步上采样操作正在进行且请求已被
 *          延迟，则为undefined。
 */
TerrainData.prototype.upsample = DeveloperError.throwInstantiationError;

/**
 * 获取一个值，指示此地形数据是否通过对较低分辨率的地形数据进行上采样创建。如果此值为false，
 * 则数据是从其他来源获取的，例如从远程服务器下载。
 * 对于从{@link TerrainData#upsample}调用返回的实例，此方法应返回true。
 * @function
 *
 * @returns {boolean} 如果此实例是通过上采样创建的则为true；否则为false。
 */
TerrainData.prototype.wasCreatedByUpsampling =
  DeveloperError.throwInstantiationError;

/**
 * The maximum number of asynchronous tasks used for terrain processing.
 *
 * @type {number}
 * @private
 */
TerrainData.maximumAsynchronousTasks = 5;

export default TerrainData;
