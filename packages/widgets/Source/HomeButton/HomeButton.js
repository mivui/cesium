import {
  defined,
  destroyObject,
  DeveloperError,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import HomeButtonViewModel from "./HomeButtonViewModel.js";

/**
 * 一个按钮小部件，用于返回当前场景的默认相机视图。
 *
 * @alias HomeButton
 * @constructor
 *
 * @param {Element|string} container 将包含小部件的DOM元素或ID。
 * @param {Scene} scene 要使用的场景实例。
 * @param {number} [duration] 时间，以秒为单位，完成相机的飞行。
 */
function HomeButton(container, scene, duration) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);

  const viewModel = new HomeButtonViewModel(scene, duration);

  viewModel._svgPath =
    "M14,4l-10,8.75h20l-4.25-3.7188v-4.6562h-2.812v2.1875l-2.938-2.5625zm-7.0938,9.906v10.094h14.094v-10.094h-14.094zm2.1876,2.313h3.3122v4.25h-3.3122v-4.25zm5.8442,1.281h3.406v6.438h-3.406v-6.438z";

  const element = document.createElement("button");
  element.type = "button";
  element.className = "cesium-button cesium-toolbar-button cesium-home-button";
  element.setAttribute(
    "data-bind",
    "\
attr: { title: tooltip },\
click: command,\
cesiumSvgPath: { path: _svgPath, width: 28, height: 28 }",
  );

  container.appendChild(element);

  knockout.applyBindings(viewModel, element);

  this._container = container;
  this._viewModel = viewModel;
  this._element = element;
}

Object.defineProperties(HomeButton.prototype, {
  /**
   * 获取父容器。
   * @memberof HomeButton.prototype
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
   * @memberof HomeButton.prototype
   *
   * @type {HomeButtonViewModel}
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
HomeButton.prototype.isDestroyed = function () {
  return false;
};

/**
 *  销毁小部件。如果从布局中永久删除小部件，
 *  则应该调用。
 */
HomeButton.prototype.destroy = function () {
  knockout.cleanNode(this._element);
  this._container.removeChild(this._element);

  return destroyObject(this);
};
export default HomeButton;
