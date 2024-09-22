import defined from "../Core/defined.js";

/**
 * 描述影像图层中的栅格化要素，例如点、面、折线等。
 *
 * @alias ImageryLayerFeatureInfo
 * @constructor
 */
function ImageryLayerFeatureInfo() {
  /**
   * 获取或设置要素的名称。
   * @type {string|undefined}
   */
  this.name = undefined;

  /**
   * 获取或设置功能的 HTML 说明。 HTML 不受信任，应该
   * 在向用户显示之前进行消毒。
   * @type {string|undefined}
   */
  this.description = undefined;

  /**
   * 获取或设置特征的位置，如果位置未知，则为 undefined。
   *
   * @type {Cartographic|undefined}
   */
  this.position = undefined;

  /**
   * 获取或设置描述特征的原始数据。 原始数据可以是任何
   * 格式数量，例如 GeoJSON、KML 等。
   * @type {object|undefined}
   */
  this.data = undefined;

  /**
   * 获取或设置image layer of the feature.
   * @type {object|undefined}
   */
  this.imageryLayer = undefined;
}

/**
 *通过选择适当的属性来配置此功能的名称。 该名称将从
 * 以下来源之一，按此顺序排列：1） 名称为 'name' 的属性，2） 名称为 'title' 的属性，
 * 3） 第一个属性包含单词 'name'，4） 第一个属性包含单词 'title'。 如果
 * 无法从任何这些来源获得名称，现有名称将保持不变。
 *
 * @param {object} properties 包含功能属性的对象文本。
 */
ImageryLayerFeatureInfo.prototype.configureNameFromProperties = function (
  properties
) {
  let namePropertyPrecedence = 10;
  let nameProperty;

  for (const key in properties) {
    if (properties.hasOwnProperty(key) && properties[key]) {
      const lowerKey = key.toLowerCase();

      if (namePropertyPrecedence > 1 && lowerKey === "name") {
        namePropertyPrecedence = 1;
        nameProperty = key;
      } else if (namePropertyPrecedence > 2 && lowerKey === "title") {
        namePropertyPrecedence = 2;
        nameProperty = key;
      } else if (namePropertyPrecedence > 3 && /name/i.test(key)) {
        namePropertyPrecedence = 3;
        nameProperty = key;
      } else if (namePropertyPrecedence > 4 && /title/i.test(key)) {
        namePropertyPrecedence = 4;
        nameProperty = key;
      }
    }
  }

  if (defined(nameProperty)) {
    this.name = properties[nameProperty];
  }
};

/**
 * 通过创建属性及其值的 HTML 表格来配置此功能的描述。
 *
 * @param {object} properties 包含功能属性的对象文本。
 */
ImageryLayerFeatureInfo.prototype.configureDescriptionFromProperties = function (
  properties
) {
  function describe(properties) {
    let html = '<table class="cesium-infoBox-defaultTable">';
    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        const value = properties[key];
        if (defined(value)) {
          if (typeof value === "object") {
            html += `<tr><td>${key}</td><td>${describe(value)}</td></tr>`;
          } else {
            html += `<tr><td>${key}</td><td>${value}</td></tr>`;
          }
        }
      }
    }
    html += "</table>";

    return html;
  }

  this.description = describe(properties);
};
export default ImageryLayerFeatureInfo;
