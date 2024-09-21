import {
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  EventHelper,
  SceneMode,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * 视图模型 {@link SceneModePicker}.
 * @alias SceneModePickerViewModel
 * @constructor
 *
 * @param {Scene} scene 场景变形
 * @param {number} [duration=2.0] 场景变形动画的持续时间，以秒为单位
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

  this._duration = defaultValue(duration, 2.0);

  /**
   * 获取或设置当前 SceneMode.  这个属性是可观察的。
   * @type {SceneMode}
   */
  this.sceneMode = scene.mode;

  /**
   * 获取或设置按钮下拉是否当前可见  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.dropDownVisible = false;

  /**
   * 获取或设置2D 工具提示。 这个属性是可观察的。
   * @type {string}
   * @default '2D'
   */
  this.tooltip2D = "2D";

  /**
   * 获取或设置3D工具提示。  这个属性是可观察的。
   * @type {string}
   * @default '3D'
   */
  this.tooltip3D = "3D";

  /**
   * 获取或设置哥伦布视图工具提示。  这个属性是可观察的。
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
   * 获取当前活动的工具提示。 这个属性是可观察的。
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
   * 得到场景
   * @memberof SceneModePickerViewModel.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取或设置场景模式转换动画的持续时间，以秒为单位。
   * 值为零会导致场景立即改变模式。
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
   * 获取要切换的命令下拉框。
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
   * 获取要转换为2D的命令。
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
   * 获取变形为3D的命令。
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
   * 获取转换为Columbus视图的命令。
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
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
SceneModePickerViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * Destroys 视图模型。
 */
SceneModePickerViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default SceneModePickerViewModel;
