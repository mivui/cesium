import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * 视图模型 {@link NavigationHelpButton}.
 * @alias NavigationHelpButtonViewModel
 * @constructor
 */
function NavigationHelpButtonViewModel() {
  /**
   * 获取或设置当前是否显示指令。 这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.showInstructions = false;

  const that = this;
  this._command = createCommand(function () {
    that.showInstructions = !that.showInstructions;
  });
  this._showClick = createCommand(function () {
    that._touch = false;
  });
  this._showTouch = createCommand(function () {
    that._touch = true;
  });

  this._touch = false;

  /**
   * 获取或设置tooltip.  这个属性是可观察的。
   *
   * @type {string}
   */
  this.tooltip = "Navigation Instructions";

  knockout.track(this, ["tooltip", "showInstructions", "_touch"]);
}

Object.defineProperties(NavigationHelpButtonViewModel.prototype, {
  /**
   * 获取单击按钮时执行的命令。
   * @memberof NavigationHelpButtonViewModel.prototype
   *
   * @type {Command}
   */
  command: {
    get: function () {
      return this._command;
    },
  },

  /**
   * 获取应显示鼠标指令时执行的命令。
   * @memberof NavigationHelpButtonViewModel.prototype
   *
   * @type {Command}
   */
  showClick: {
    get: function () {
      return this._showClick;
    },
  },

  /**
   * 获取在应该显示触摸指令时执行的Command。
   * @memberof NavigationHelpButtonViewModel.prototype
   *
   * @type {Command}
   */
  showTouch: {
    get: function () {
      return this._showTouch;
    },
  },
});
export default NavigationHelpButtonViewModel;
