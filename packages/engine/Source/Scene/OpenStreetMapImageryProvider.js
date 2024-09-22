import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const defaultCredit = new Credit(
  "MapQuest, Open Street Map and contributors, CC-BY-SA"
);

/**
 * @typedef {object} OpenStreetMapImageryProvider.ConstructorOptions
 *
 * OpenStreetMapImageryProvider 构造函数的初始化选项
 *
 * @property {string} [url='https：//tile.openstreetmap.org'] OpenStreetMap 服务器 url。
 * @property {string} [fileExtension='png'] 服务器上图片的文件扩展名。
 * @property {boolean} [retinaTiles=false] 如果为 true，则为 Retina 显示屏请求 2 倍分辨率的平铺。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形。
 * @property {number} [minimumLevel=0] 图像提供商支持的最低细节层次。
 * @property {number} [maximumLevel] 图像提供商支持的最大细节层次，如果没有限制，则为 undefined。
 * @property {Ellipsoid} [ellipsoid] 椭球体。 如果未指定，则使用 WGS84 椭球体。
 * @property {Credit|string} [credit='MapQuest， Open Street Map and contributors， CC-BY-SA'] 数据源的制作者名单，显示在画布上。
 */

/**
 * 提供由 OpenStreetMap 托管的平铺图像的图像提供商
 * 或其他 Slippy 磁贴提供商。 默认 URL 连接到 OpenStreetMap 的志愿者运营
 * 服务器，因此您必须符合其
 * {@link http://wiki.openstreetmap.org/wiki/Tile_usage_policy|Tile Usage Policy}.
 *
 * @alias OpenStreetMapImageryProvider
 * @constructor
 * @extends UrlTemplateImageryProvider
 *
 * @param {OpenStreetMapImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 * @exception {DeveloperError} rectangle 和 minimumLevel 指示 minimum 级别有四个以上的图块。不支持在最低级别具有四个以上切片的影像提供者。
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 * @example
 * const osm = new Cesium.OpenStreetMapImageryProvider({
 *     url : 'https://tile.openstreetmap.org/'
 * });
 *
 * @see {@link http://wiki.openstreetmap.org/wiki/Main_Page|OpenStreetMap Wiki}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
function OpenStreetMapImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(
    defaultValue(options.url, "https://tile.openstreetmap.org/")
  );
  resource.appendForwardSlash();
  resource.url += `{z}/{x}/{y}${
    options.retinaTiles ? "@2x" : ""
  }.${defaultValue(options.fileExtension, "png")}`;

  const tilingScheme = new WebMercatorTilingScheme({
    ellipsoid: options.ellipsoid,
  });

  const tileWidth = 256;
  const tileHeight = 256;

  const minimumLevel = defaultValue(options.minimumLevel, 0);
  const maximumLevel = options.maximumLevel;

  const rectangle = defaultValue(options.rectangle, tilingScheme.rectangle);

  // Check the number of tiles at the minimum level.  If it's more than four,
  // throw an exception, because starting at the higher minimum
  // level will cause too many tiles to be downloaded and rendered.
  const swTile = tilingScheme.positionToTileXY(
    Rectangle.southwest(rectangle),
    minimumLevel
  );
  const neTile = tilingScheme.positionToTileXY(
    Rectangle.northeast(rectangle),
    minimumLevel
  );
  const tileCount =
    (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
  //>>includeStart('debug', pragmas.debug);
  if (tileCount > 4) {
    throw new DeveloperError(
      `The rectangle and minimumLevel indicate that there are ${tileCount} tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.`
    );
  }
  //>>includeEnd('debug');

  let credit = defaultValue(options.credit, defaultCredit);
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }

  UrlTemplateImageryProvider.call(this, {
    url: resource,
    credit: credit,
    tilingScheme: tilingScheme,
    tileWidth: tileWidth,
    tileHeight: tileHeight,
    minimumLevel: minimumLevel,
    maximumLevel: maximumLevel,
    rectangle: rectangle,
  });
}

if (defined(Object.create)) {
  OpenStreetMapImageryProvider.prototype = Object.create(
    UrlTemplateImageryProvider.prototype
  );
  OpenStreetMapImageryProvider.prototype.constructor = OpenStreetMapImageryProvider;
}

export default OpenStreetMapImageryProvider;
