import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 一个视图模型，它公开切换按钮的属性。
 * @alias ToggleButtonViewModel
 * @constructor
 *
 * @param {Command} command 当按钮被切换时将执行的命令。
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.toggled=false] 一个布尔值，指示是否应该在初始时切换按钮。
 * @param {string} [options.tooltip=''] 包含按钮工具提示的字符串。
 */
function ToggleButtonViewModel(command, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(command)) {
    throw new DeveloperError("command is required.");
  }
  //>>includeEnd('debug');

  this._command = command;

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 获取或设置按钮当前是否处于切换状态。这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.toggled = defaultValue(options.toggled, false);

  /**
   * 获取或设置按钮的工具提示。这个属性是可观察的。
   * @type {string}
   * @default ''
   */
  this.tooltip = defaultValue(options.tooltip, "");

  knockout.track(this, ["toggled", "tooltip"]);
}

Object.defineProperties(ToggleButtonViewModel.prototype, {
  /**
   * 获取按钮被切换时将执行的命令。
   * @memberof ToggleButtonViewModel.prototype
   * @type {Command}
   */
  command: {
    get: function () {
      return this._command;
    },
  },
});
export default ToggleButtonViewModel;
