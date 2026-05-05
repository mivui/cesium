// @ts-check

/**
 * Bing Maps 提供的影像类型。
 *
 * @enum {number}
 *
 * @see BingMapsImageryProvider
 */
const BingMapsStyle = {
   /**
    * 航空影像。
    *
    * @type {string}
    * @constant
    */
  AERIAL: "Aerial",

   /**
    * 带有道路覆盖层的航空影像。
    *
    * @type {string}
    * @constant
    * @deprecated 参见 https://github.com/CesiumGS/cesium/issues/7128。
    * 请改用 `BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND`
    */
  AERIAL_WITH_LABELS: "AerialWithLabels",

   /**
    * 带有道路覆盖层的航空影像。
    *
    * @type {string}
    * @constant
    */
  AERIAL_WITH_LABELS_ON_DEMAND: "AerialWithLabelsOnDemand",

   /**
    * 不带附加影像的道路。
    *
    * @type {string}
    * @constant
    * @deprecated 参见 https://github.com/CesiumGS/cesium/issues/7128。
    * 请改用 `BingMapsStyle.ROAD_ON_DEMAND`
    */
  ROAD: "Road",

   /**
    * 不带附加影像的道路。
    *
    * @type {string}
    * @constant
    */
  ROAD_ON_DEMAND: "RoadOnDemand",

   /**
    * 道路地图的深色版本。
    *
    * @type {string}
    * @constant
    */
  CANVAS_DARK: "CanvasDark",

   /**
    * 道路地图的浅色版本。
    *
    * @type {string}
    * @constant
    */
  CANVAS_LIGHT: "CanvasLight",

   /**
    * 道路地图的灰度版本。
    *
    * @type {string}
    * @constant
    */
  CANVAS_GRAY: "CanvasGray",

   /**
    * 英国地形测量局影像。此影像仅对英国伦敦地区可见。
    *
    * @type {string}
    * @constant
    */
  ORDNANCE_SURVEY: "OrdnanceSurvey",

   /**
    * Collins Bart 影像。
    *
    * @type {string}
    * @constant
    */
  COLLINS_BART: "CollinsBart",
};

Object.freeze(BingMapsStyle);

export default BingMapsStyle;
