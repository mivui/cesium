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
 * @param {Scene} scene The Scene to morph
 * @param {number} [duration=2.0] The duration of scene morph animations, in seconds
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
   * 获取或设置current SceneMode.  这个属性是可观察的。
   * @type {SceneMode}
   */
  this.sceneMode = scene.mode;

  /**
   * Gets or sets whether the button drop-down is currently visible.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.dropDownVisible = false;

  /**
   * 获取或设置2D tooltip.  这个属性是可观察的。
   * @type {string}
   * @default '2D'
   */
  this.tooltip2D = "2D";

  /**
   * 获取或设置3D tooltip.  这个属性是可观察的。
   * @type {string}
   * @default '3D'
   */
  this.tooltip3D = "3D";

  /**
   * 获取或设置Columbus View tooltip.  这个属性是可观察的。
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
   * Gets the currently active tooltip.  这个属性是可观察的。
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
   * 获取或设置the duration of scene mode transition animations in seconds.
   * A value of zero causes the scene to instantly change modes.
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
   * 获取要切换的命令 the drop down box.
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
   * Gets the command to morph to 2D.
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
   * Gets the command to morph to 3D.
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
   * Gets the command to morph to Columbus View.
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
 * Destroys the view model.
 */
SceneModePickerViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();

  destroyObject(this);
};
export default SceneModePickerViewModel;
