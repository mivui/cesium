import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import PerspectiveOffCenterFrustum from "./PerspectiveOffCenterFrustum.js";

/**
 * 视锥体由 6 个平面定义。
 * 每个平面由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 分量
 * 定义平面的单位法向量，w 分量是
 * 平面到原点/相机位置的距离。
 *
 * @alias PerspectiveFrustum
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.fov] 视野角度（FOV），以弧度为单位。
 * @param {number} [options.aspectRatio] 视锥体宽度与高度的宽高比。
 * @param {number} [options.near=1.0] 近平面的距离。
 * @param {number} [options.far=500000000.0] 远平面的距离。
 * @param {number} [options.xOffset=0.0] x 方向的偏移量。
 * @param {number} [options.yOffset=0.0] y 方向的偏移量。
 *
 * @example
 * const frustum = new Cesium.PerspectiveFrustum({
 *     fov : Cesium.Math.PI_OVER_THREE,
 *     aspectRatio : canvas.clientWidth / canvas.clientHeight
 *     near : 1.0,
 *     far : 1000.0
 * });
 *
 * @see PerspectiveOffCenterFrustum
 */
function PerspectiveFrustum(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._offCenterFrustum = new PerspectiveOffCenterFrustum();

  /**
   * 视野角度（FOV），以弧度为单位。如果宽度大于高度，此角度将用作水平 FOV，否则将用作垂直 FOV。
   * @type {number|undefined}
   * @default undefined
   */
  this.fov = options.fov;
  this._fov = undefined;
  this._fovy = undefined;

  this._sseDenominator = undefined;

  /**
   * 视锥体宽度与高度的宽高比。
   * @type {number|undefined}
   * @default undefined
   */
  this.aspectRatio = options.aspectRatio;
  this._aspectRatio = undefined;

  /**
   * 近平面的距离。
   * @type {number}
   * @default 1.0
   */
  this.near = options.near ?? 1.0;
  this._near = this.near;

  /**
   * 远平面的距离。
   * @type {number}
   * @default 500000000.0
   */
  this.far = options.far ?? 500000000.0;
  this._far = this.far;

  /**
   * 在 x 方向上偏移视锥体。
   * @type {number}
   * @default 0.0
   */
  this.xOffset = options.xOffset ?? 0.0;
  this._xOffset = this.xOffset;

  /**
   * 在 y 方向上偏移视锥体。
   * @type {number}
   * @default 0.0
   */
  this.yOffset = options.yOffset ?? 0.0;
  this._yOffset = this.yOffset;
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
PerspectiveFrustum.packedLength = 6;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {PerspectiveFrustum} value 要打包的值。
 * @param {number[]} array 要打包到的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组索引。
 *
 * @returns {number[]} 被打包到的数组
 */
PerspectiveFrustum.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  array[startingIndex++] = value.fov;
  array[startingIndex++] = value.aspectRatio;
  array[startingIndex++] = value.near;
  array[startingIndex++] = value.far;
  array[startingIndex++] = value.xOffset;
  array[startingIndex] = value.yOffset;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包的数组。
 * @param {number} [startingIndex=0] 要解包的元素的起始索引。
 * @param {PerspectiveFrustum} [result] 用于存储结果的对象。
 * @returns {PerspectiveFrustum} 修改后的 result 参数，如果未提供，则为新的 PerspectiveFrustum 实例。
 */
PerspectiveFrustum.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  if (!defined(result)) {
    result = new PerspectiveFrustum();
  }

  result.fov = array[startingIndex++];
  result.aspectRatio = array[startingIndex++];
  result.near = array[startingIndex++];
  result.far = array[startingIndex++];
  result.xOffset = array[startingIndex++];
  result.yOffset = array[startingIndex];

  return result;
};

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.fov) ||
    !defined(frustum.aspectRatio) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError(
      "fov, aspectRatio, near, or far parameters are not set.",
    );
  }
  //>>includeEnd('debug');

  const changed =
    frustum.fov !== frustum._fov ||
    frustum.aspectRatio !== frustum._aspectRatio ||
    frustum.near !== frustum._near ||
    frustum.far !== frustum._far ||
    frustum.xOffset !== frustum._xOffset ||
    frustum.yOffset !== frustum._yOffset;

  if (!changed) {
    return;
  }

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("fov", frustum.fov, 0.0);
  Check.typeOf.number.lessThan("fov", frustum.fov, Math.PI);

  Check.typeOf.number.greaterThanOrEquals(
    "aspectRatio",
    frustum.aspectRatio,
    0.0,
  );

  Check.typeOf.number.greaterThanOrEquals("near", frustum.near, 0.0);
  if (frustum.near > frustum.far) {
    throw new DeveloperError("near must be less than far.");
  }
  //>>includeEnd('debug');

  frustum._aspectRatio = frustum.aspectRatio;
  frustum._fov = frustum.fov;
  frustum._fovy =
    frustum.aspectRatio <= 1
      ? frustum.fov
      : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
  frustum._near = frustum.near;
  frustum._far = frustum.far;
  frustum._sseDenominator = 2.0 * Math.tan(0.5 * frustum._fovy);
  frustum._xOffset = frustum.xOffset;
  frustum._yOffset = frustum.yOffset;

  const f = frustum._offCenterFrustum;

  f.top = frustum.near * Math.tan(0.5 * frustum._fovy);
  f.bottom = -f.top;
  f.right = frustum.aspectRatio * f.top;
  f.left = -f.right;
  f.near = frustum.near;
  f.far = frustum.far;

  f.right += frustum.xOffset;
  f.left += frustum.xOffset;
  f.top += frustum.yOffset;
  f.bottom += frustum.yOffset;
}

Object.defineProperties(PerspectiveFrustum.prototype, {
  /**
   * 获取根据视锥体计算的透视投影矩阵。
   * 如有必要，投影矩阵将被重新计算。
   *
   * @memberof PerspectiveFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#projectionMatrix.
   * @see PerspectiveFrustum#infiniteProjectionMatrix
   */
  projectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.projectionMatrix;
    },
  },

  /**
   * 具有无限远平面的视锥体计算的透视投影矩阵。
   * @memberof PerspectiveFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveFrustum#projectionMatrix
   */
  infiniteProjectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.infiniteProjectionMatrix;
    },
  },

  /**
   * 获取垂直视野角度，以弧度为单位。
   * @memberof PerspectiveFrustum.prototype
   * @type {number|undefined}
   * @readonly
   * @default undefined
   */
  fovy: {
    get: function () {
      update(this);
      return this._fovy;
    },
  },

  /**
   * @readonly
   * @private
   */
  sseDenominator: {
    get: function () {
      update(this);
      return this._sseDenominator;
    },
  },

  /**
   * 获取底层的 {@link PerspectiveOffCenterFrustum}。
   * @memberof PerspectiveFrustum.prototype
   * @type {PerspectiveOffCenterFrustum}
   * @readonly
   * @private
   */
  offCenterFrustum: {
    get: function () {
      update(this);
      return this._offCenterFrustum;
    },
  },
});

/**
 * 为此视锥体创建裁剪体。
 *
 * @param {Cartesian3} position 眼睛位置。
 * @param {Cartesian3} direction 视图方向。
 * @param {Cartesian3} up 向上方向。
 * @returns {CullingVolume} 给定位置和方向上的裁剪体。
 *
 * @example
 * // 检查边界体是否与视锥体相交。
 * const cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
 * const intersect = cullingVolume.computeVisibility(boundingVolume);
 */
PerspectiveFrustum.prototype.computeCullingVolume = function (
  position,
  direction,
  up,
) {
  update(this);
  return this._offCenterFrustum.computeCullingVolume(position, direction, up);
};

/**
 * 返回像素的宽度和高度（以米为单位）。
 *
 * @param {number} drawingBufferWidth 绘图缓冲区的宽度。
 * @param {number} drawingBufferHeight 绘图缓冲区的高度。
 * @param {number} distance 到近平面的距离，以米为单位。
 * @param {number} pixelRatio 从像素空间到坐标空间的缩放比例。
 * @param {Cartesian2} result 用于存储结果的对象。
 * @returns {Cartesian2} 修改后的 result 参数，或者一个新的 {@link Cartesian2} 实例，其 x 和 y 属性分别为像素的宽度和高度。
 *
 * @exception {DeveloperError} drawingBufferWidth 必须大于零。
 * @exception {DeveloperError} drawingBufferHeight 必须大于零。
 * @exception {DeveloperError} pixelRatio 必须大于零。
 *
 * @example
 * // 示例 1
 * // 获取像素的宽度和高度。
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 1.0, scene.pixelRatio, new Cesium.Cartesian2());
 *
 * @example
 * // 示例 2
 * // 如果将近平面设置为 'distance'，获取像素的宽度和高度。
 * // 例如，获取广告牌上图像的像素大小。
 * const position = camera.position;
 * const direction = camera.direction;
 * const toCenter = Cesium.Cartesian3.subtract(primitive.boundingVolume.center, position, new Cesium.Cartesian3());      // 从相机到图元的向量
 * const toCenterProj = Cesium.Cartesian3.multiplyByScalar(direction, Cesium.Cartesian3.dot(direction, toCenter), new Cesium.Cartesian3()); // 将向量投影到相机方向向量上
 * const distance = Cesium.Cartesian3.magnitude(toCenterProj);
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, scene.pixelRatio, new Cesium.Cartesian2());
 */
PerspectiveFrustum.prototype.getPixelDimensions = function (
  drawingBufferWidth,
  drawingBufferHeight,
  distance,
  pixelRatio,
  result,
) {
  update(this);
  return this._offCenterFrustum.getPixelDimensions(
    drawingBufferWidth,
    drawingBufferHeight,
    distance,
    pixelRatio,
    result,
  );
};

/**
 * 返回 PerspectiveFrustum 实例的副本。
 *
 * @param {PerspectiveFrustum} [result] 用于存储结果的对象。
 * @returns {PerspectiveFrustum} 修改后的 result 参数，如果未提供，则为新的 PerspectiveFrustum 实例。
 */
PerspectiveFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new PerspectiveFrustum();
  }

  result.aspectRatio = this.aspectRatio;
  result.fov = this.fov;
  result.near = this.near;
  result.far = this.far;

  // force update of clone to compute matrices
  result._aspectRatio = undefined;
  result._fov = undefined;
  result._near = undefined;
  result._far = undefined;

  this._offCenterFrustum.clone(result._offCenterFrustum);

  return result;
};

/**
 * 逐分量比较提供的 PerspectiveFrustum，
 * 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {PerspectiveFrustum} [other] 右侧的 PerspectiveFrustum。
 * @returns {boolean} 如果它们相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PerspectiveFrustum.prototype.equals = function (other) {
  if (!defined(other) || !(other instanceof PerspectiveFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    this.fov === other.fov &&
    this.aspectRatio === other.aspectRatio &&
    this._offCenterFrustum.equals(other._offCenterFrustum)
  );
};

/**
 * 逐分量比较提供的 PerspectiveFrustum，
 * 如果通过绝对或相对容差测试则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {PerspectiveFrustum} other 右侧的 PerspectiveFrustum。
 * @param {number} relativeEpsilon 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对 epsilon 容差。
 * @returns {boolean} 如果此对象和另一个对象在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PerspectiveFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon,
) {
  if (!defined(other) || !(other instanceof PerspectiveFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    CesiumMath.equalsEpsilon(
      this.fov,
      other.fov,
      relativeEpsilon,
      absoluteEpsilon,
    ) &&
    CesiumMath.equalsEpsilon(
      this.aspectRatio,
      other.aspectRatio,
      relativeEpsilon,
      absoluteEpsilon,
    ) &&
    this._offCenterFrustum.equalsEpsilon(
      other._offCenterFrustum,
      relativeEpsilon,
      absoluteEpsilon,
    )
  );
};
export default PerspectiveFrustum;
