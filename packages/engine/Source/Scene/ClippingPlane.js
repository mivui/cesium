import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";

/**
 * 以 Hessian 法线形式表示的平面，用于与 {@link ClippingPlaneCollection} 配合使用。
 * 与 {@link Plane} 中的数学函数兼容。
 *
 * @alias ClippingPlane
 * @constructor
 *
 * @param {Cartesian3} normal 平面的法线（已归一化）。
 * @param {number} distance 从原点到平面的最短距离。<code>distance</code> 的符号决定
 * 原点位于平面的哪一侧。如果 <code>distance</code> 为正，原点位于法线方向的半空间；
 * 如果为负，原点位于法线相反方向的半空间；如果为零，平面穿过原点。
 */
function ClippingPlane(normal, distance) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("normal", normal);
  Check.typeOf.number("distance", distance);
  //>>includeEnd('debug');

  this._distance = distance;
  this._normal = new UpdateChangedCartesian3(normal, this);
  this.onChangeCallback = undefined;
  this.index = -1; // to be set by ClippingPlaneCollection
}

Object.defineProperties(ClippingPlane.prototype, {
  /**
   * 从原点到平面的最短距离。<code>distance</code> 的符号决定
   * 原点位于平面的哪一侧。如果 <code>distance</code> 为正，原点位于法线方向的半空间；
   * 如果为负，原点位于法线相反方向的半空间；如果为零，平面穿过原点。
   *
   * @type {number}
   * @memberof ClippingPlane.prototype
   */
  distance: {
    get: function () {
      return this._distance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');
      if (defined(this.onChangeCallback) && value !== this._distance) {
        this.onChangeCallback(this.index);
      }
      this._distance = value;
    },
  },
  /**
   * 平面的法线。
   *
   * @type {Cartesian3}
   * @memberof ClippingPlane.prototype
   */
  normal: {
    get: function () {
      return this._normal;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');
      if (
        defined(this.onChangeCallback) &&
        !Cartesian3.equals(this._normal._cartesian3, value)
      ) {
        this.onChangeCallback(this.index);
      }
      // Set without firing callback again
      Cartesian3.clone(value, this._normal._cartesian3);
    },
  },
});

/**
 * 从 Plane 对象创建 ClippingPlane。
 *
 * @param {Plane} plane 包含要复制参数的平面
 * @param {ClippingPlane} [result] 用于存储结果的对象
 * @returns {ClippingPlane} 从平面参数生成的 ClippingPlane。
 */
ClippingPlane.fromPlane = function (plane, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new ClippingPlane(plane.normal, plane.distance);
  } else {
    result.normal = plane.normal;
    result.distance = plane.distance;
  }
  return result;
};

/**
 * 克隆 ClippingPlane 而不设置其所有权。
 * @param {ClippingPlane} clippingPlane 要克隆的 ClippingPlane
 * @param {ClippingPlane} [result] 用于存储克隆参数的对象。
 * @returns {ClippingPlane} 输入 ClippingPlane 的克隆
 */
ClippingPlane.clone = function (clippingPlane, result) {
  if (!defined(result)) {
    return new ClippingPlane(clippingPlane.normal, clippingPlane.distance);
  }
  result.normal = clippingPlane.normal;
  result.distance = clippingPlane.distance;
  return result;
};

/**
 * Wrapper on Cartesian3 that allows detection of Plane changes from "members of members," for example:
 *
 * const clippingPlane = new ClippingPlane(...);
 * clippingPlane.normal.z = -1.0;
 *
 * @private
 */
function UpdateChangedCartesian3(normal, clippingPlane) {
  this._clippingPlane = clippingPlane;
  this._cartesian3 = Cartesian3.clone(normal);
}

Object.defineProperties(UpdateChangedCartesian3.prototype, {
  x: {
    get: function () {
      return this._cartesian3.x;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');
      if (
        defined(this._clippingPlane.onChangeCallback) &&
        value !== this._cartesian3.x
      ) {
        this._clippingPlane.onChangeCallback(this._clippingPlane.index);
      }
      this._cartesian3.x = value;
    },
  },
  y: {
    get: function () {
      return this._cartesian3.y;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');
      if (
        defined(this._clippingPlane.onChangeCallback) &&
        value !== this._cartesian3.y
      ) {
        this._clippingPlane.onChangeCallback(this._clippingPlane.index);
      }
      this._cartesian3.y = value;
    },
  },
  z: {
    get: function () {
      return this._cartesian3.z;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');
      if (
        defined(this._clippingPlane.onChangeCallback) &&
        value !== this._cartesian3.z
      ) {
        this._clippingPlane.onChangeCallback(this._clippingPlane.index);
      }
      this._cartesian3.z = value;
    },
  },
});
export default ClippingPlane;
