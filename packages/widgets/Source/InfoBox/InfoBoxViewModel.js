import { defined, Event } from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";

const cameraEnabledPath =
  "M 13.84375 7.03125 C 11.412798 7.03125 9.46875 8.975298 9.46875 11.40625 L 9.46875 11.59375 L 2.53125 7.21875 L 2.53125 24.0625 L 9.46875 19.6875 C 9.4853444 22.104033 11.423165 24.0625 13.84375 24.0625 L 25.875 24.0625 C 28.305952 24.0625 30.28125 22.087202 30.28125 19.65625 L 30.28125 11.40625 C 30.28125 8.975298 28.305952 7.03125 25.875 7.03125 L 13.84375 7.03125 z";
const cameraDisabledPath =
  "M 27.34375 1.65625 L 5.28125 27.9375 L 8.09375 30.3125 L 30.15625 4.03125 L 27.34375 1.65625 z M 13.84375 7.03125 C 11.412798 7.03125 9.46875 8.975298 9.46875 11.40625 L 9.46875 11.59375 L 2.53125 7.21875 L 2.53125 24.0625 L 9.46875 19.6875 C 9.4724893 20.232036 9.5676108 20.7379 9.75 21.21875 L 21.65625 7.03125 L 13.84375 7.03125 z M 28.21875 7.71875 L 14.53125 24.0625 L 25.875 24.0625 C 28.305952 24.0625 30.28125 22.087202 30.28125 19.65625 L 30.28125 11.40625 C 30.28125 9.8371439 29.456025 8.4902779 28.21875 7.71875 z";

/**
 * 视图模型 {@link InfoBox}.
 * @alias InfoBoxViewModel
 * @constructor
 */
function InfoBoxViewModel() {
  this._cameraClicked = new Event();
  this._closeClicked = new Event();

  /**
   * 获取或设置信息框的最大高度，以像素为单位.  这个属性是可观察的。
   * @type {number}
   */
  this.maxHeight = 500;

  /**
   * 获取或设置是否启用摄像机跟踪图标。
   * @type {boolean}
   */
  this.enableCamera = false;

  /**
   * 获取或设置所选对象的当前摄像机跟踪状态。
   * @type {boolean}
   */
  this.isCameraTracking = false;

  /**
   * 获取或设置信息框的可见性。
   * @type {boolean}
   */
  this.showInfo = false;

  /**
   * 获取或设置title 信息框中的文本。
   * @type {string}
   */
  this.titleText = "";

  /**
   * 获取或设置description信息框的HTML格式。
   * @type {string}
   */
  this.description = "";

  knockout.track(this, [
    "showInfo",
    "titleText",
    "description",
    "maxHeight",
    "enableCamera",
    "isCameraTracking",
  ]);

  this._loadingIndicatorHtml =
    '<div class="cesium-infoBox-loadingContainer"><span class="cesium-infoBox-loading"></span></div>';

  /**
   * Gets the SVG path of the camera icon, which can change to be "crossed out" or not.
   * @type {string}
   */
  this.cameraIconPath = undefined;
  knockout.defineProperty(this, "cameraIconPath", {
    get: function () {
      return !this.enableCamera || this.isCameraTracking
        ? cameraDisabledPath
        : cameraEnabledPath;
    },
  });

  knockout.defineProperty(this, "_bodyless", {
    get: function () {
      return !defined(this.description) || this.description.length === 0;
    },
  });
}

/**
 * 以CSS-ready格式获取信息框内各节的最大高度(减去偏移量)。
 * @param {number} offset 以像素为单位的偏移量。
 * @returns {string}
 */
InfoBoxViewModel.prototype.maxHeightOffset = function (offset) {
  return `${this.maxHeight - offset}px`;
};

Object.defineProperties(InfoBoxViewModel.prototype, {
  /**
   * 获取当用户单击相机图标时触发的 {@link Event}。
   * @memberof InfoBoxViewModel.prototype
   * @type {Event}
   */
  cameraClicked: {
    get: function () {
      return this._cameraClicked;
    },
  },
  /**
   * 获取在用户关闭信息框时触发的 {@link Event}。
   * @memberof InfoBoxViewModel.prototype
   * @type {Event}
   */
  closeClicked: {
    get: function () {
      return this._closeClicked;
    },
  },
});
export default InfoBoxViewModel;
