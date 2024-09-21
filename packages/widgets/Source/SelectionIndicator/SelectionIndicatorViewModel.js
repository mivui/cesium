import {
  Cartesian2,
  defaultValue,
  defined,
  DeveloperError,
  EasingFunction,
  SceneTransforms,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";

const screenSpacePos = new Cartesian2();
const offScreen = "-1000px";

/**
 * 视图模型 {@link SelectionIndicator}.
 * @alias SelectionIndicatorViewModel
 * @constructor
 *
 * @param {Scene} scene 要使用的场景实例。用于屏幕空间坐标转换。
 * @param {Element} selectionIndicatorElement 包含构成选择指示符的所有元素的元素。
 * @param {Element} container 包含小部件的DOM元素。
 */
function SelectionIndicatorViewModel(
  scene,
  selectionIndicatorElement,
  container
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }

  if (!defined(selectionIndicatorElement)) {
    throw new DeveloperError("selectionIndicatorElement is required.");
  }

  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug')

  this._scene = scene;
  this._screenPositionX = offScreen;
  this._screenPositionY = offScreen;
  this._tweens = scene.tweens;
  this._container = defaultValue(container, document.body);
  this._selectionIndicatorElement = selectionIndicatorElement;
  this._scale = 1;

  /**
   * 获取或设置要显示选择指示符的对象的世界位置。
   * @type {Cartesian3}
   */
  this.position = undefined;

  /**
   * 获取或设置选择指标的可见性。
   * @type {boolean}
   */
  this.showSelection = false;

  knockout.track(this, [
    "position",
    "_screenPositionX",
    "_screenPositionY",
    "_scale",
    "showSelection",
  ]);

  /**
   * 获取位置指示器的可见性。这可能是假的，即使
   * 对象，当所选对象没有位置时。
   * @type {boolean}
   */
  this.isVisible = undefined;
  knockout.defineProperty(this, "isVisible", {
    get: function () {
      return this.showSelection && defined(this.position);
    },
  });

  knockout.defineProperty(this, "_transform", {
    get: function () {
      return `scale(${this._scale})`;
    },
  });

  /**
   * 获取或设置将对象的世界位置转换为屏幕空间位置的函数。
   *
   * @member
   * @type {SelectionIndicatorViewModel.ComputeScreenSpacePosition}
   * @default SceneTransforms.worldToWindowCoordinates
   *
   * @example
   * selectionIndicatorViewModel.computeScreenSpacePosition = function(position, result) {
   *     return Cesium.SceneTransforms.worldToWindowCoordinates(scene, position, result);
   * };
   */
  this.computeScreenSpacePosition = function (position, result) {
    return SceneTransforms.worldToWindowCoordinates(scene, position, result);
  };
}

/**
 * 更新选择指示器的视图，以匹配视图模型的位置和内容属性。
 * 这个函数应该作为渲染循环的一部分来调用。
 */
SelectionIndicatorViewModel.prototype.update = function () {
  if (this.showSelection && defined(this.position)) {
    const screenPosition = this.computeScreenSpacePosition(
      this.position,
      screenSpacePos
    );
    if (!defined(screenPosition)) {
      this._screenPositionX = offScreen;
      this._screenPositionY = offScreen;
    } else {
      const container = this._container;
      const containerWidth = container.parentNode.clientWidth;
      const containerHeight = container.parentNode.clientHeight;
      const indicatorSize = this._selectionIndicatorElement.clientWidth;
      const halfSize = indicatorSize * 0.5;

      screenPosition.x =
        Math.min(
          Math.max(screenPosition.x, -indicatorSize),
          containerWidth + indicatorSize
        ) - halfSize;
      screenPosition.y =
        Math.min(
          Math.max(screenPosition.y, -indicatorSize),
          containerHeight + indicatorSize
        ) - halfSize;

      this._screenPositionX = `${Math.floor(screenPosition.x + 0.25)}px`;
      this._screenPositionY = `${Math.floor(screenPosition.y + 0.25)}px`;
    }
  }
};

/**
 * 使指示符动画化以吸引对所选内容的注意。
 */
SelectionIndicatorViewModel.prototype.animateAppear = function () {
  this._tweens.addProperty({
    object: this,
    property: "_scale",
    startValue: 2,
    stopValue: 1,
    duration: 0.8,
    easingFunction: EasingFunction.EXPONENTIAL_OUT,
  });
};

/**
 * 使指示器动画化以释放所选内容。
 */
SelectionIndicatorViewModel.prototype.animateDepart = function () {
  this._tweens.addProperty({
    object: this,
    property: "_scale",
    startValue: this._scale,
    stopValue: 1.5,
    duration: 0.8,
    easingFunction: EasingFunction.EXPONENTIAL_OUT,
  });
};

Object.defineProperties(SelectionIndicatorViewModel.prototype, {
  /**
   * 获取包含选择指示符的HTML元素。
   * @memberof SelectionIndicatorViewModel.prototype
   *
   * @type {Element}
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取包含选择指示符的HTML元素。
   * @memberof SelectionIndicatorViewModel.prototype
   *
   * @type {Element}
   */
  selectionIndicatorElement: {
    get: function () {
      return this._selectionIndicatorElement;
    },
  },

  /**
   * 正在使用得到场景。
   * @memberof SelectionIndicatorViewModel.prototype
   *
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },
});

/**
 * 将对象的世界位置转换为屏幕空间位置的函数。
 * @callback SelectionIndicatorViewModel.ComputeScreenSpacePosition
 * @param {Cartesian3} position WGS84(世界)坐标中的位置。
 * @param {Cartesian2} result 一个对象，用于返回转换为窗口坐标的输入位置。
 * @returns {Cartesian2} 修改后的结果参数。
 */
export default SelectionIndicatorViewModel;
