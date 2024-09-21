import {
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  Fullscreen,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * 视图模型 {@link FullscreenButton}.
 * @alias FullscreenButtonViewModel
 * @constructor
 *
 * @param {Element|string} [fullscreenElement=document.body] 要置于全屏模式的元素或id。.
 * @param {Element|string} [container] 将包含小部件的DOM元素或ID。
 */
function FullscreenButtonViewModel(fullscreenElement, container) {
  if (!defined(container)) {
    container = document.body;
  }

  container = getElement(container);

  const that = this;

  const tmpIsFullscreen = knockout.observable(Fullscreen.fullscreen);
  const tmpIsEnabled = knockout.observable(Fullscreen.enabled);
  const ownerDocument = container.ownerDocument;

  /**
   * 获取是否 fullscreen是活跃的.  这个属性是可观察的。
   *
   * @type {boolean}
   */
  this.isFullscreen = undefined;
  knockout.defineProperty(this, "isFullscreen", {
    get: function () {
      return tmpIsFullscreen();
    },
  });

  /**
   * 获取或设置是否 fullscreen 应该启用功能.  这个属性是可观察的。
   *
   * @type {boolean}
   * @see Fullscreen.enabled
   */
  this.isFullscreenEnabled = undefined;
  knockout.defineProperty(this, "isFullscreenEnabled", {
    get: function () {
      return tmpIsEnabled();
    },
    set: function (value) {
      tmpIsEnabled(value && Fullscreen.enabled);
    },
  });

  /**
   * 获取工具提示。这个属性是可观察的。
   *
   * @type {string}
   */
  this.tooltip = undefined;
  knockout.defineProperty(this, "tooltip", function () {
    if (!this.isFullscreenEnabled) {
      return "Full screen unavailable";
    }
    return tmpIsFullscreen() ? "Exit full screen" : "Full screen";
  });

  this._command = createCommand(function () {
    if (Fullscreen.fullscreen) {
      Fullscreen.exitFullscreen();
    } else {
      Fullscreen.requestFullscreen(that._fullscreenElement);
    }
  }, knockout.getObservable(this, "isFullscreenEnabled"));

  this._fullscreenElement = defaultValue(
    getElement(fullscreenElement),
    ownerDocument.body
  );

  this._callback = function () {
    tmpIsFullscreen(Fullscreen.fullscreen);
  };
  ownerDocument.addEventListener(Fullscreen.changeEventName, this._callback);
}

Object.defineProperties(FullscreenButtonViewModel.prototype, {
  /**
   * 获取或设置HTML元素时，将其置于全屏模式
   * 按下相应的按钮。
   * @memberof FullscreenButtonViewModel.prototype
   *
   * @type {Element}
   */
  fullscreenElement: {
    //TODO:@exception {DeveloperError} value must be a valid HTML Element.
    get: function () {
      return this._fullscreenElement;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!(value instanceof Element)) {
        throw new DeveloperError("value must be a valid Element.");
      }
      //>>includeEnd('debug');

      this._fullscreenElement = value;
    },
  },

  /**
   * 获取要切换的命令 fullscreen mode.
   * @memberof FullscreenButtonViewModel.prototype
   *
   * @type {Command}
   */
  command: {
    get: function () {
      return this._command;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
FullscreenButtonViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁视图模型。应该被称为
 * 当不再需要视图模型时，适当地清理视图模型。
 */
FullscreenButtonViewModel.prototype.destroy = function () {
  document.removeEventListener(Fullscreen.changeEventName, this._callback);
  destroyObject(this);
};
export default FullscreenButtonViewModel;
