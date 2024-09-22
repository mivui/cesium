/**
 * 必应地图提供的图像类型。
 *
 * @enum {number}
 *
 * @see BingMapsImageryProvider
 */
const BingMapsStyle = {
  /**
   * 航拍图像。
   *
   * @type {string}
   * @constant
   */
  AERIAL: "Aerial",

  /**
   * 带有道路叠加层的航拍图像。
   *
   * @type {string}
   * @constant
   * @deprecated 参见 https://github.com/CesiumGS/cesium/issues/7128。
   * 改用 'BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND'
   */
  AERIAL_WITH_LABELS: "AerialWithLabels",

  /**
   * 带有道路叠加层的航拍图像。
   *
   * @type {string}
   * @constant
   */
  AERIAL_WITH_LABELS_ON_DEMAND: "AerialWithLabelsOnDemand",

  /**
   * 没有额外图像的道路。
   *
   * @type {string}
   * @constant
   * @deprecated 参见 https://github.com/CesiumGS/cesium/issues/7128。
   * 改用 'BingMapsStyle.ROAD_ON_DEMAND'
   */
  ROAD: "Road",

  /**
   * 没有额外图像的道路。
   *
   * @type {string}
   * @constant
   */
  ROAD_ON_DEMAND: "RoadOnDemand",

  /**
   * 路线图的黑暗版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_DARK: "CanvasDark",

  /**
   * 路线图的轻量级版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_LIGHT: "CanvasLight",

  /**
   * 路线图的灰度版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_GRAY: "CanvasGray",

  /**
   * 地形测量局图像。此影像仅在英国伦敦地区可见。
   *
   * @type {string}
   * @constant
   */
  ORDNANCE_SURVEY: "OrdnanceSurvey",

  /**
   * 柯林斯·巴特图像。
   *
   * @type {string}
   * @constant
   */
  COLLINS_BART: "CollinsBart",
};
export default Object.freeze(BingMapsStyle);
