import DeveloperError from "./DeveloperError.js";

/**
 * 椭球体表面上的几何或影像的切片方案。 在细节层次为零时，
 * 最粗糙、最不详细的级别，瓦片的数量是可配置的。
 * 在细节级别 1 中，每个级别 0 磁贴都有四个子级，每个方向两个。
 * 在细节级别 2 中，每个级别 1 磁贴都有四个子项，每个方向两个子项。
 * 对于几何或影像源中存在的多个级别，此操作将持续。
 *
 * @alias TilingScheme
 * @constructor
 *
 * @see WebMercatorTilingScheme
 * @see GeographicTilingScheme
 */
function TilingScheme(options) {
  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "This type should not be instantiated directly.  Instead, use WebMercatorTilingScheme or GeographicTilingScheme.",
  );
  //>>includeEnd('debug');
}

Object.defineProperties(TilingScheme.prototype, {
  /**
   * 获取由切片方案平铺的椭球体。
   * @memberof TilingScheme.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此平铺方案覆盖的矩形（以弧度为单位）。
   * @memberof TilingScheme.prototype
   * @type {Rectangle}
   */
  rectangle: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取切片方案使用的地图投影。
   * @memberof TilingScheme.prototype
   * @type {MapProjection}
   */
  projection: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * Gets the total number of tiles in the X direction at a specified level-of-detail.
 * @function
 *
 * @param {number} level The level-of-detail.
 * @returns {number} The number of tiles in the X direction at the given level.
 */
TilingScheme.prototype.getNumberOfXTilesAtLevel =
  DeveloperError.throwInstantiationError;

/**
 * Gets the total number of tiles in the Y direction at a specified level-of-detail.
 * @function
 *
 * @param {number} level The level-of-detail.
 * @returns {number} The number of tiles in the Y direction at the given level.
 */
TilingScheme.prototype.getNumberOfYTilesAtLevel =
  DeveloperError.throwInstantiationError;

/**
 * Transforms a rectangle specified in geodetic radians to the native coordinate system
 * of this tiling scheme.
 * @function
 *
 * @param {Rectangle} rectangle The rectangle to transform.
 * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
 *          is undefined.
 */
TilingScheme.prototype.rectangleToNativeRectangle =
  DeveloperError.throwInstantiationError;

/**
 * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
 * of the tiling scheme.
 * @function
 *
 * @param {number} x The integer x coordinate of the tile.
 * @param {number} y The integer y coordinate of the tile.
 * @param {number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
TilingScheme.prototype.tileXYToNativeRectangle =
  DeveloperError.throwInstantiationError;

/**
 * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
 * @function
 *
 * @param {number} x The integer x coordinate of the tile.
 * @param {number} y The integer y coordinate of the tile.
 * @param {number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
TilingScheme.prototype.tileXYToRectangle =
  DeveloperError.throwInstantiationError;

/**
 * Calculates the tile x, y coordinates of the tile containing
 * a given cartographic position.
 * @function
 *
 * @param {Cartographic} position The position.
 * @param {number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
 *          if 'result' is undefined.
 */
TilingScheme.prototype.positionToTileXY =
  DeveloperError.throwInstantiationError;
export default TilingScheme;
