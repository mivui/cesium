// @ts-check

/**
 * 描述地图在 2D 模式下将如何运行。
 *
 * @enum {number}
 */
const MapMode2D = {
  /**
   * 2D 地图可以绕 Z 轴旋转。
   *
   * @type {number}
   * @constant
   */
  ROTATE: 0,

  /**
   * 2D 地图可以在水平方向上无限滚动。
   *
   * @type {number}
   * @constant
   */
  INFINITE_SCROLL: 1,
};

Object.freeze(MapMode2D);

export default MapMode2D;
