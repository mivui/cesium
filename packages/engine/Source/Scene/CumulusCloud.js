import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import JulianDate from "../Core/JulianDate.js";

/**
 * 使用体积粒子系统渲染模拟的云团。这些云团可以使用
 * {@link CloudCollection#add} 添加到场景中。
 *
 * @alias CumulusCloud
 * @constructor
 *
 * @example
 * const cloud = new Cesium.CumulusCloud({
 *     position : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883, 1000.0),
 *     scale : 5000.0
 * });
 * cloudCollection.add(cloud);
 */
function CumulusCloud() {
  this._position = Cartesian3.clone(Cartesian3.ZERO);
  this._scale = 1.0;
  this._color = undefined;
  this._emissiveIntensity = 1.0;
  this._brightness = 1.0;
  this._show = true;
}

Object.defineProperties(CumulusCloud.prototype, {
  /**
   * 获取或设置云在世界坐标中的位置。
   * @memberof CumulusCloud.prototype
   * @type {Cartesian3}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      this._position = Cartesian3.clone(value, this._position);
    },
  },

  /**
   * 获取或设置云的缩放比例。
   * @memberof CumulusCloud.prototype
   * @type {number}
   */
  scale: {
    get: function () {
      return this._scale;
    },
    set: function (value) {
      this._scale = value;
    },
  },

  /**
   * 获取或设置云的颜色。
   * @memberof CumulusCloud.prototype
   * @type {Color}
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      this._color = value;
    },
  },

  /**
   * 获取或设置云的自发光强度。
   * @memberof CumulusCloud.prototype
   * @type {number}
   */
  emissiveIntensity: {
    get: function () {
      return this._emissiveIntensity;
    },
    set: function (value) {
      this._emissiveIntensity = value;
    },
  },

  /**
   * 获取或设置云的亮度。
   * @memberof CumulusCloud.prototype
   * @type {number}
   */
  brightness: {
    get: function () {
      return this._brightness;
    },
    set: function (value) {
      this._brightness = value;
    },
  },

  /**
   * 获取或设置此云是否显示。
   * @memberof CumulusCloud.prototype
   * @type {boolean}
   * @default true
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      this._show = value;
    },
  },
});

CumulusCloud.prototype.isDestroyed = function () {
  return false;
};

CumulusCloud.prototype.destroy = function () {
  return destroyObject(this);
};

export default CumulusCloud;
