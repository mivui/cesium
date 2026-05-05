// @ts-check

/**
 * 瓦片的细化方法。
 * <p>
 * 参见 3D Tiles 规范中的 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#refinement|Refinement}。
 * </p>
 *
 * @enum {number}
 *
 * @private
 */
const Cesium3DTileRefine = {
  /**
   * 渲染此瓦片，并且如果未达到屏幕空间误差要求，则同时细化到其子瓦片。
   *
   * @type {number}
   * @constant
   */
  ADD: 0,

  /**
   * 渲染此瓦片，或者如果未达到屏幕空间误差要求，则细化到其后代瓦片代替。
   *
   * @type {number}
   * @constant
   */
  REPLACE: 1,
};

Object.freeze(Cesium3DTileRefine);

export default Cesium3DTileRefine;
