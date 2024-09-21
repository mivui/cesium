import {
  defined,
  destroyObject,
  DeveloperError,
  FeatureDetection,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import BaseLayerPickerViewModel from "./BaseLayerPickerViewModel.js";

/**
 * <span style="display: block; text-align: center;">
 * <img src="Images/BaseLayerPicker.png" width="264" alt="BaseLayerPicker" />
 * <br />BaseLayerPicker with its drop-panel open.
 * </span>
 * <br /><br />
 * BaseLayerPicker是一个单按钮小部件，它显示可用图像和
 * 地形提供者。当选择图像时，将创建并插入相应的图像层
 * 作为图像集合的基础层;移除现有底座。地形选定后，
 * 替换当前的地形提供程序。可用提供商列表中的每个项都包含一个名称，
 * 一个代表性的图标，和一个工具提示显示更多的信息时，悬停。这个列表最初是
 * 为空，必须在使用前配置，示例如下。
 * <br /><br />
 * 默认情况下，BaseLayerPicker使用默认的示例提供程序列表进行演示。
 * 值得注意的是其中一些提供程序，例如 <a href="https://developers.arcgis.com" target="_blank">Esri ArcGIS</a> and <a href="https://docs.stadiamaps.com/ target="_blank">Stadia Maps</a>, 有单独的服务条款并且需要认证才能用于生产。
 *
 * @alias BaseLayerPicker
 * @constructor
 *
 * @param {Element|string} container 此小部件的父HTML容器节点或ID。
 * @param {object} options 对象，具有以下属性:
 * @param {Globe} options.globe  Globe 去使用 
 * @param {ProviderViewModel[]} [options.imageryProviderViewModels=[]] 用于图像的ProviderViewModel实例数组。
 * @param {ProviderViewModel} [options.selectedImageryProviderViewModel] 当前基本图像层的视图模型，如果没有提供，则使用第一个可用的图像层。
 * @param {ProviderViewModel[]} [options.terrainProviderViewModels=[]] 用于地形的ProviderViewModel实例数组。
 * @param {ProviderViewModel} [options.selectedTerrainProviderViewModel] 当前基本地形层的视图模型，如果没有提供，则使用第一个可用的地形层。
 *
 * @exception {DeveloperError} id为"container"的元素在文档中不存在。
 *
 *
 * @example
 * // In HTML head, include a link to the BaseLayerPicker.css stylesheet,
 * // and in the body, include: <div id="baseLayerPickerContainer"
 * //   style="position:absolute;top:24px;right:24px;width:38px;height:38px;"></div>
 *
 * //Create the list of available providers we would like the user to select from.
 * //This example uses 3, OpenStreetMap, The Black Marble, and a single, non-streaming world image.
 * const imageryViewModels = [];
 * imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Open\u00adStreet\u00adMap",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
 *      tooltip: "OpenStreetMap (OSM) is a collaborative project to create a free editable \
 * map of the world.\nhttp://www.openstreetmap.org",
 *      creationFunction: function() {
 *          return new Cesium.OpenStreetMapImageryProvider({
 *              url: "https://tile.openstreetmap.org/"
 *          });
 *      }
 *  }));
 *
 *  imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Earth at Night",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/blackMarble.png"),
 *      tooltip: "The lights of cities and villages trace the outlines of civilization \
 * in this global view of the Earth at night as seen by NASA/NOAA's Suomi NPP satellite.",
 *      creationFunction: function() {
 *          return Cesium.IonImageryProvider.fromAssetId(3812);
 *      }
 *  }));
 *
 *  imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Natural Earth\u00a0II",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/naturalEarthII.png"),
 *      tooltip: "Natural Earth II, darkened for contrast.\nhttp://www.naturalearthdata.com/",
 *      creationFunction: function() {
 *          return Cesium.TileMapServiceImageryProvider.fromUrl(
 *              Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
 *          );
 *      }
 *  }));
 *
 * //Create a CesiumWidget without imagery, if you haven't already done so.
 * const cesiumWidget = new Cesium.CesiumWidget("cesiumContainer", { baseLayer: false });
 *
 * //Finally, create the baseLayerPicker widget using our view models.
 * const layers = cesiumWidget.imageryLayers;
 * const baseLayerPicker = new Cesium.BaseLayerPicker("baseLayerPickerContainer", {
 *     globe: cesiumWidget.scene.globe,
 *     imageryProviderViewModels: imageryViewModels
 * });
 *
 * @see TerrainProvider
 * @see ImageryProvider
 * @see ImageryLayerCollection
 */
function BaseLayerPicker(container, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);

  const viewModel = new BaseLayerPickerViewModel(options);

  const element = document.createElement("button");
  element.type = "button";
  element.className = "cesium-button cesium-toolbar-button";
  element.setAttribute(
    "data-bind",
    "\
attr: { title: buttonTooltip },\
click: toggleDropDown"
  );
  container.appendChild(element);

  const imgElement = document.createElement("img");
  imgElement.setAttribute("draggable", "false");
  imgElement.className = "cesium-baseLayerPicker-selected";
  imgElement.setAttribute(
    "data-bind",
    "\
attr: { src: buttonImageUrl }, visible: !!buttonImageUrl"
  );
  element.appendChild(imgElement);

  const dropPanel = document.createElement("div");
  dropPanel.className = "cesium-baseLayerPicker-dropDown";
  dropPanel.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-dropDown-visible" : dropDownVisible }'
  );
  container.appendChild(dropPanel);

  const imageryTitle = document.createElement("div");
  imageryTitle.className = "cesium-baseLayerPicker-sectionTitle";
  imageryTitle.setAttribute(
    "data-bind",
    "visible: imageryProviderViewModels.length > 0"
  );
  imageryTitle.innerHTML = "Imagery";
  dropPanel.appendChild(imageryTitle);

  const imagerySection = document.createElement("div");
  imagerySection.className = "cesium-baseLayerPicker-section";
  imagerySection.setAttribute("data-bind", "foreach: _imageryProviders");
  dropPanel.appendChild(imagerySection);

  const imageryCategories = document.createElement("div");
  imageryCategories.className = "cesium-baseLayerPicker-category";
  imagerySection.appendChild(imageryCategories);

  const categoryTitle = document.createElement("div");
  categoryTitle.className = "cesium-baseLayerPicker-categoryTitle";
  categoryTitle.setAttribute("data-bind", "text: name");
  imageryCategories.appendChild(categoryTitle);

  const imageryChoices = document.createElement("div");
  imageryChoices.className = "cesium-baseLayerPicker-choices";
  imageryChoices.setAttribute("data-bind", "foreach: providers");
  imageryCategories.appendChild(imageryChoices);

  const imageryProvider = document.createElement("div");
  imageryProvider.className = "cesium-baseLayerPicker-item";
  imageryProvider.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-selectedItem" : $data === $parents[1].selectedImagery },\
attr: { title: tooltip },\
visible: creationCommand.canExecute,\
click: function($data) { $parents[1].selectedImagery = $data; }'
  );
  imageryChoices.appendChild(imageryProvider);

  const providerIcon = document.createElement("img");
  providerIcon.className = "cesium-baseLayerPicker-itemIcon";
  providerIcon.setAttribute("data-bind", "attr: { src: iconUrl }");
  providerIcon.setAttribute("draggable", "false");
  imageryProvider.appendChild(providerIcon);

  const providerLabel = document.createElement("div");
  providerLabel.className = "cesium-baseLayerPicker-itemLabel";
  providerLabel.setAttribute("data-bind", "text: name");
  imageryProvider.appendChild(providerLabel);

  const terrainTitle = document.createElement("div");
  terrainTitle.className = "cesium-baseLayerPicker-sectionTitle";
  terrainTitle.setAttribute(
    "data-bind",
    "visible: terrainProviderViewModels.length > 0"
  );
  terrainTitle.innerHTML = "Terrain";
  dropPanel.appendChild(terrainTitle);

  const terrainSection = document.createElement("div");
  terrainSection.className = "cesium-baseLayerPicker-section";
  terrainSection.setAttribute("data-bind", "foreach: _terrainProviders");
  dropPanel.appendChild(terrainSection);

  const terrainCategories = document.createElement("div");
  terrainCategories.className = "cesium-baseLayerPicker-category";
  terrainSection.appendChild(terrainCategories);

  const terrainCategoryTitle = document.createElement("div");
  terrainCategoryTitle.className = "cesium-baseLayerPicker-categoryTitle";
  terrainCategoryTitle.setAttribute("data-bind", "text: name");
  terrainCategories.appendChild(terrainCategoryTitle);

  const terrainChoices = document.createElement("div");
  terrainChoices.className = "cesium-baseLayerPicker-choices";
  terrainChoices.setAttribute("data-bind", "foreach: providers");
  terrainCategories.appendChild(terrainChoices);

  const terrainProvider = document.createElement("div");
  terrainProvider.className = "cesium-baseLayerPicker-item";
  terrainProvider.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-selectedItem" : $data === $parents[1].selectedTerrain },\
attr: { title: tooltip },\
visible: creationCommand.canExecute,\
click: function($data) { $parents[1].selectedTerrain = $data; }'
  );
  terrainChoices.appendChild(terrainProvider);

  const terrainProviderIcon = document.createElement("img");
  terrainProviderIcon.className = "cesium-baseLayerPicker-itemIcon";
  terrainProviderIcon.setAttribute("data-bind", "attr: { src: iconUrl }");
  terrainProviderIcon.setAttribute("draggable", "false");
  terrainProvider.appendChild(terrainProviderIcon);

  const terrainProviderLabel = document.createElement("div");
  terrainProviderLabel.className = "cesium-baseLayerPicker-itemLabel";
  terrainProviderLabel.setAttribute("data-bind", "text: name");
  terrainProvider.appendChild(terrainProviderLabel);

  knockout.applyBindings(viewModel, element);
  knockout.applyBindings(viewModel, dropPanel);

  this._viewModel = viewModel;
  this._container = container;
  this._element = element;
  this._dropPanel = dropPanel;

  this._closeDropDown = function (e) {
    if (!(element.contains(e.target) || dropPanel.contains(e.target))) {
      viewModel.dropDownVisible = false;
    }
  };

  if (FeatureDetection.supportsPointerEvents()) {
    document.addEventListener("pointerdown", this._closeDropDown, true);
  } else {
    document.addEventListener("mousedown", this._closeDropDown, true);
    document.addEventListener("touchstart", this._closeDropDown, true);
  }
}

Object.defineProperties(BaseLayerPicker.prototype, {
  /**
   * 获取父容器。
   * @memberof BaseLayerPicker.prototype
   *
   * @type {Element}
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取视图模型。
   * @memberof BaseLayerPicker.prototype
   *
   * @type {BaseLayerPickerViewModel}
   */
  viewModel: {
    get: function () {
      return this._viewModel;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
BaseLayerPicker.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。应该叫它永久的吗
 * 从布局中删除小部件。
 */
BaseLayerPicker.prototype.destroy = function () {
  if (FeatureDetection.supportsPointerEvents()) {
    document.removeEventListener("pointerdown", this._closeDropDown, true);
  } else {
    document.removeEventListener("mousedown", this._closeDropDown, true);
    document.removeEventListener("touchstart", this._closeDropDown, true);
  }

  knockout.cleanNode(this._element);
  knockout.cleanNode(this._dropPanel);
  this._container.removeChild(this._element);
  this._container.removeChild(this._dropPanel);
  return destroyObject(this);
};
export default BaseLayerPicker;
