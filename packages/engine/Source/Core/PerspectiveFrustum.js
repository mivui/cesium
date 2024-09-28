import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import PerspectiveOffCenterFrustum from "./PerspectiveOffCenterFrustum.js";

/**
 * 视锥体由 6 个平面定义。
 * 每个平面都由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 分量
 * 定义垂直于平面的单位向量，w 分量是
 * 从原点/相机位置开始的平面。
 *
 * @alias PerspectiveFrustum
 * @constructor
 *
 * @param {object} [options]  对象，具有以下属性:
 * @param {number} [options.fov] 视野角 （FOV），以弧度为单位。
 * @param {number} [options.aspectRatio] 视锥体的宽度与高度的纵横比。
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._offCenterFrustum = new PerspectiveOffCenterFrustum();

  /**
   * 视场角度 （FOV），以弧度为单位。 将使用这个角度
   * 如果宽度大于高度，则作为水平 FOV，否则
   * 这将是垂直 FOV。
   * @type {number|undefined}
   * @default undefined
   */
  this.fov = options.fov;
  this._fov = undefined;
  this._fovy = undefined;

  this._sseDenominator = undefined;

  /**
   * 视锥体的宽度与高度的纵横比。
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
  this.near = defaultValue(options.near, 1.0);
  this._near = this.near;

  /**
   * 远平面的距离。
   * @type {number}
   * @default 500000000.0
   */
  this.far = defaultValue(options.far, 500000000.0);
  this._far = this.far;

  /**
   * 在 x 方向上偏移视锥体。
   * @type {number}
   * @default 0.0
   */
  this.xOffset = defaultValue(options.xOffset, 0.0);
  this._xOffset = this.xOffset;

  /**
   * 在 y 方向上偏移视锥体。
   * @type {number}
   * @default 0.0
   */
  this.yOffset = defaultValue(options.yOffset, 0.0);
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
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
PerspectiveFrustum.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

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
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {PerspectiveFrustum} [result] 要在其中存储结果的对象。
 * @returns {PerspectiveFrustum} 修改后的结果参数 或新的 PerspectiveFrustum 实例（如果未提供）。
 */
PerspectiveFrustum.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

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
      "fov, aspectRatio, near, or far parameters are not set."
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
    0.0
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
   * 获取从视图视锥体计算的透视投影矩阵。
   * 如有必要，将重新计算投影矩阵。
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
   * 从具有无限远平面的视图视锥体计算的透视投影矩阵。
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
   * 获取垂直视野的角度，以弧度为单位。
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
   * 获取从视图视锥体计算的正交投影矩阵。
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
 * 为此视锥体创建剔除体积。
 *
 * @param {Cartesian3} position 眼睛位置。
 * @param {Cartesian3} direction 视图方向。
 * @param {Cartesian3} up 向上方向。
 * @returns {CullingVolume} 给定位置和方向的剔除体积。
 *
 * @example
 * // Check if a bounding volume intersects the frustum.
 * const cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
 * const intersect = cullingVolume.computeVisibility(boundingVolume);
 */
PerspectiveFrustum.prototype.computeCullingVolume = function (
  position,
  direction,
  up
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
 * @param {number} pixelRatio 从像素空间到坐标空间的缩放因子。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数或 {@link Cartesian2} 的新实例，像素的宽度和高度分别位于 x 和 y 属性中。
 *
 * @exception {DeveloperError} drawingBufferWidth must be greater than zero.
 * @exception {DeveloperError} drawingBufferHeight must be greater than zero.
 * @exception {DeveloperError} pixelRatio must be greater than zero.
 *
 * @example
 * // Example 1
 * // Get the width and height of a pixel.
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 1.0, scene.pixelRatio, new Cesium.Cartesian2());
 *
 * @example
 * // Example 2
 * // Get the width and height of a pixel if the near plane was set to 'distance'.
 * // For example, get the size of a pixel of an image on a billboard.
 * const position = camera.position;
 * const direction = camera.direction;
 * const toCenter = Cesium.Cartesian3.subtract(primitive.boundingVolume.center, position, new Cesium.Cartesian3());      // vector from camera to a primitive
 * const toCenterProj = Cesium.Cartesian3.multiplyByScalar(direction, Cesium.Cartesian3.dot(direction, toCenter), new Cesium.Cartesian3()); // project vector onto camera direction vector
 * const distance = Cesium.Cartesian3.magnitude(toCenterProj);
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, scene.pixelRatio, new Cesium.Cartesian2());
 */
PerspectiveFrustum.prototype.getPixelDimensions = function (
  drawingBufferWidth,
  drawingBufferHeight,
  distance,
  pixelRatio,
  result
) {
  update(this);
  return this._offCenterFrustum.getPixelDimensions(
    drawingBufferWidth,
    drawingBufferHeight,
    distance,
    pixelRatio,
    result
  );
};

/**
 * 返回 PerspectiveFrustum 实例的副本。
 *
 * @param {PerspectiveFrustum} [result] 要在其上存储结果的对象。
 * @returns {PerspectiveFrustum} 修改后的结果参数或新的 PerspectiveFrustum 实例（如果未提供）。
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
 * 对提供的 PerspectiveFrustum 组件进行比较，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {PerspectiveFrustum} [other] 右边 PerspectiveFrustum.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
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
 * 对提供的 PerspectiveFrustum 组件进行比较，并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {PerspectiveFrustum} other 右边 PerspectiveFrustum.
 * @param {number} relativeEpsilon 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code> 如果 this 和其他都在提供的 epsilon 内, 否则 <code>false</code>。
 */
PerspectiveFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon
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
      absoluteEpsilon
    ) &&
    CesiumMath.equalsEpsilon(
      this.aspectRatio,
      other.aspectRatio,
      relativeEpsilon,
      absoluteEpsilon
    ) &&
    this._offCenterFrustum.equalsEpsilon(
      other._offCenterFrustum,
      relativeEpsilon,
      absoluteEpsilon
    )
  );
};
export default PerspectiveFrustum;
