import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import OrthographicOffCenterFrustum from "./OrthographicOffCenterFrustum.js";

/**
 * 视锥体由 6 个平面定义。
 * 每个平面由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 分量
 * 定义平面的单位法向量，w 分量是
 * 平面到原点/相机位置的距离。
 *
 * @alias OrthographicFrustum
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.width] 视锥体的宽度，以米为单位。
 * @param {number} [options.aspectRatio] 视锥体的宽高比。
 * @param {number} [options.near=1.0] 近平面的距离。
 * @param {number} [options.far=500000000.0] 远平面的距离。
 *
 * @example
 * const maxRadii = ellipsoid.maximumRadius;
 *
 * const frustum = new Cesium.OrthographicFrustum();
 * frustum.near = 0.01 * maxRadii;
 * frustum.far = 50.0 * maxRadii;
 */
function OrthographicFrustum(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._offCenterFrustum = new OrthographicOffCenterFrustum();

  /**
   * 视锥体的水平宽度，以米为单位。
   * @type {number|undefined}
   * @default undefined
   */
  this.width = options.width;
  this._width = undefined;

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
   * @default 500000000.0;
   */
  this.far = options.far ?? 500000000.0;
  this._far = this.far;
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
OrthographicFrustum.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {OrthographicFrustum} value 要打包的值。
 * @param {number[]} array 要打包到的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组索引。
 *
 * @returns {number[]} 被打包到的数组
 */
OrthographicFrustum.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  array[startingIndex++] = value.width;
  array[startingIndex++] = value.aspectRatio;
  array[startingIndex++] = value.near;
  array[startingIndex] = value.far;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包的数组。
 * @param {number} [startingIndex=0] 要解包的元素的起始索引。
 * @param {OrthographicFrustum} [result] 用于存储结果的对象。
 * @returns {OrthographicFrustum} 修改后的 result 参数，如果未提供，则为新的 OrthographicFrustum 实例。
 */
OrthographicFrustum.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  if (!defined(result)) {
    result = new OrthographicFrustum();
  }

  result.width = array[startingIndex++];
  result.aspectRatio = array[startingIndex++];
  result.near = array[startingIndex++];
  result.far = array[startingIndex];

  return result;
};

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.width) ||
    !defined(frustum.aspectRatio) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError(
      "width, aspectRatio, near, or far parameters are not set.",
    );
  }
  //>>includeEnd('debug');

  const f = frustum._offCenterFrustum;

  if (
    frustum.width !== frustum._width ||
    frustum.aspectRatio !== frustum._aspectRatio ||
    frustum.near !== frustum._near ||
    frustum.far !== frustum._far
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (frustum.aspectRatio < 0) {
      throw new DeveloperError("aspectRatio must be positive.");
    }
    if (frustum.near < 0 || frustum.near > frustum.far) {
      throw new DeveloperError(
        "near must be greater than zero and less than far.",
      );
    }
    //>>includeEnd('debug');

    frustum._aspectRatio = frustum.aspectRatio;
    frustum._width = frustum.width;
    frustum._near = frustum.near;
    frustum._far = frustum.far;

    const ratio = 1.0 / frustum.aspectRatio;
    f.right = frustum.width * 0.5;
    f.left = -f.right;
    f.top = ratio * f.right;
    f.bottom = -f.top;
    f.near = frustum.near;
    f.far = frustum.far;
  }
}

Object.defineProperties(OrthographicFrustum.prototype, {
  /**
   * 获取根据视锥体计算的正交投影矩阵。
   * @memberof OrthographicFrustum.prototype
   * @type {Matrix4}
   * @readonly
   */
  projectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.projectionMatrix;
    },
  },
  /**
   * 获取根据视锥体计算的正交投影矩阵。
   * @memberof OrthographicFrustum.prototype
   * @type {OrthographicOffCenterFrustum}
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
OrthographicFrustum.prototype.computeCullingVolume = function (
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
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 0.0, scene.pixelRatio, new Cesium.Cartesian2());
 */
OrthographicFrustum.prototype.getPixelDimensions = function (
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
 * 返回 OrthographicFrustum 实例的副本。
 *
 * @param {OrthographicFrustum} [result] 用于存储结果的对象。
 * @returns {OrthographicFrustum} 修改后的 result 参数，如果未提供，则为新的 OrthographicFrustum 实例。
 */
OrthographicFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new OrthographicFrustum();
  }

  result.aspectRatio = this.aspectRatio;
  result.width = this.width;
  result.near = this.near;
  result.far = this.far;

  // force update of clone to compute matrices
  result._aspectRatio = undefined;
  result._width = undefined;
  result._near = undefined;
  result._far = undefined;

  this._offCenterFrustum.clone(result._offCenterFrustum);

  return result;
};

/**
 * 逐分量比较提供的 OrthographicFrustum，
 * 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {OrthographicFrustum} [other] 右侧的 OrthographicFrustum。
 * @returns {boolean} 如果它们相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
OrthographicFrustum.prototype.equals = function (other) {
  if (!defined(other) || !(other instanceof OrthographicFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    this.width === other.width &&
    this.aspectRatio === other.aspectRatio &&
    this._offCenterFrustum.equals(other._offCenterFrustum)
  );
};

/**
 * 逐分量比较提供的 OrthographicFrustum，
 * 如果通过绝对或相对容差测试则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {OrthographicFrustum} other 右侧的 OrthographicFrustum。
 * @param {number} relativeEpsilon 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性测试的绝对 epsilon 容差。
 * @returns {boolean} 如果此对象和另一个对象在提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>。
 */
OrthographicFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon,
) {
  if (!defined(other) || !(other instanceof OrthographicFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    CesiumMath.equalsEpsilon(
      this.width,
      other.width,
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
export default OrthographicFrustum;
