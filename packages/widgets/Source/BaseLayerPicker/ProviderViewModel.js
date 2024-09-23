import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * 一个视图模型，表示 {@link BaseLayerPicker} 中的每个项。
 *
 * @alias ProviderViewModel
 * @constructor
 *
 * @param {object} options 包含所有参数的对象。
 * @param {string} options.name 层的名称。
 * @param {string} options.tooltip 将鼠标悬停在项目上时显示的工具提示。
 * @param {string} options.iconUrl 表示图层的图标。
 * @param {string} [options.category] 图层的类别。
 * @param {ProviderViewModel.CreationFunction|Command} options.creationFunction 函数或命令
 * 创建一个或多个提供程序，选择此项时，这些提供程序将添加到 globe 中。
 *
 * @see BaseLayerPicker
 * @see ImageryProvider
 * @see TerrainProvider
 */
function ProviderViewModel(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.name)) {
    throw new DeveloperError("options.name is required.");
  }
  if (!defined(options.tooltip)) {
    throw new DeveloperError("options.tooltip is required.");
  }
  if (!defined(options.iconUrl)) {
    throw new DeveloperError("options.iconUrl is required.");
  }
  if (typeof options.creationFunction !== "function") {
    throw new DeveloperError("options.creationFunction is required.");
  }
  //>>includeEnd('debug');

  let creationCommand = options.creationFunction;
  if (!defined(creationCommand.canExecute)) {
    creationCommand = createCommand(creationCommand);
  }

  this._creationCommand = creationCommand;

  /**
   * 获取显示名称。  这个属性是可观察的。
   * @type {string}
   */
  this.name = options.name;

  /**
   * 获取工具提示。  这个属性是可观察的。
   * @type {string}
   */
  this.tooltip = options.tooltip;

  /**
   * 获取图标。  这个属性是可观察的。
   * @type {string}
   */
  this.iconUrl = options.iconUrl;

  this._category = defaultValue(options.category, "");

  knockout.track(this, ["name", "tooltip", "iconUrl"]);
}

Object.defineProperties(ProviderViewModel.prototype, {
  /**
   * 获取创建一个或多个提供程序的 Command，这些提供程序将被添加到
   * 选择此项时的地球仪。
   * @memberof ProviderViewModel.prototype
   * @memberof ProviderViewModel.prototype
   * @type {Command}
   * @readonly
   */
  creationCommand: {
    get: function () {
      return this._creationCommand;
    },
  },

  /**
   * 获取类别
   * @type {string}
   * @memberof ProviderViewModel.prototype
   * @readonly
   */
  category: {
    get: function () {
      return this._category;
    },
  },
});

/**
 * 创建一个或多个提供程序的函数。
 * @callback ProviderViewModel.CreationFunction
 * @returns {ImageryProvider|TerrainProvider|ImageryProvider[]|TerrainProvider[]|Promise<TerrainProvider>|Promise<ImageryProvider>|Promise<TerrainProvider[]>|Promise<ImageryProvider[]>}
 *          要添加的 ImageryProvider 或 TerrainProvider，或提供程序数组
 * 到全球。
 */
export default ProviderViewModel;
