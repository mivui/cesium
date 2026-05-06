import {
  defined,
  destroyObject,
  DeveloperError,
  EventHelper,
  SceneMode,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * {@link SceneModePicker} 的视图模型。
 * @alias SceneModePickerViewModel
 * @constructor
 *
 * @param {Scene} scene 要进行变形的 Scene
 * @param {number} [duration=2.0] 场景变形动画的持续时间（秒）
 */
function SceneModePickerViewModel(scene, duration) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = scene;

  const that = this;

  const morphStart = function (transitioner, oldMode, newMode, isMorphing) {
    that.sceneMode = newMode;
    that.dropDownVisible = false;
  };

  this._eventHelper = new EventHelper();
  this._eventHelper.add(scene.morphStart, morphStart);

  this._duration = duration ?? 2.0;

  /**
   * 获取或设置当前的 SceneMode。此属性是可观察的。
   * @type {SceneMode}
   */
  this.sceneMode = scene.mode;

  /**
   * 获取或设置按钮下拉菜单当前是否可见。此属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.dropDownVisible = false;

  /**
   * 获取或设置 2D 提示。此属性是可观察的。
   * @type {string}
   * @default '2D'
   */
  this.tooltip2D = "2D";

  /**
   * 获取或设置 3D 提示。此属性是可观察的。
   * @type {string}
   * @default '3D'
   */
  this.tooltip3D = "3D";

  /**
   * 获取或设置 Columbus View 提示。此属性是可观察的。
   * @type {string}
   * @default 'Columbus View'
   */
  this.tooltipColumbusView = "Columbus View";

  knockout.track(this, [
    "sceneMode",
    "dropDownVisible",
    "tooltip2D",
    "tooltip3D",
    "tooltipColumbusView",
  ]);

  /**
   * 获取当前激活的提示。此属性是可观察的。
   * @type {string}
   */
  this.selectedTooltip = undefined;
  knockout.defineProperty(this, "selectedTooltip", function () {
    const mode = that.sceneMode;
    if (mode === SceneMode.SCENE2D) {
      return that.tooltip2D;
    }
    if (mode === SceneMode.SCENE3D) {
      return that.tooltip3D;
    }
    return that.tooltipColumbusView;
  });

  this._toggleDropDown = createCommand(function () {
    that.dropDownVisible = !that.dropDownVisible;
  });

  this._morphTo2D = createCommand(function () {
    scene.morphTo2D(that._duration);
  });

  this._morphTo3D = createCommand(function () {
    scene.morphTo3D(that._duration);
  });

  this._morphToColumbusView = createCommand(function () {
    scene.morphToColumbusView(that._duration);
  });

  //Used by knockout
  this._sceneMode = SceneMode;
}

Object.defineProperties(SceneModePickerViewModel.prototype, {
  /**
   * 获取场景
   * @memberof SceneModePickerViewModel.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取或设置场景模式转换动画的持续时间（秒）。
   * 值为零会导致场景立即切换模式。
   * @memberof SceneModePickerViewModel.prototype
   * @type {number}
   */
  duration: {
    get: function () {
      return this._duration;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (value < 0.0) {
        throw new DeveloperError("duration value must be positive.");
      }
      //>>includeEnd('debug');

      this._duration = value;
    },
  },

  /**
   * 获取用于切换下拉框的命令。
   * @memberof SceneModePickerViewModel.prototype
   *
   * @type {Command}
   */
  toggleDropDown: {
    get: function () {
      return this._toggleDropDown;
    },
  },

  /**
   * 获取变形到 2D 的命令。
   * @memberof SceneModePickerViewModel.prototype
   *
   * @type {Command}
   */
  morphTo2D: {
    get: function () {
      return this._morphTo2D;
    },
  },

  /**
   * 获取变形到 3D 的命令。
   * @memberof SceneModePickerViewModel.prototype
   *
   * @type {Command}
   */
  morphTo3D: {
    get: function () {
      return this._morphTo3D;
    },
  },

  /**
   * 获取变形到 Columbus View 的命令。
   * @memberof SceneModePickerViewModel.prototype
   *
   * @type {Command}
   */
  morphToColumbusView: {
    get: function () {
      return this._morphToColumbusView;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁则为 true，否则为 false。
 */
SceneModePickerViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁视图模型。
 */
SceneModePickerViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default SceneModePickerViewModel;
