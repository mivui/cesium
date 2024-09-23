import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import CullingVolume from "./CullingVolume.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import Matrix4 from "./Matrix4.js";

/**
 * 视锥体由 6 个平面定义。
 * 每个平面都由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 分量
 * 定义垂直于平面的单位向量，w 分量是
 * 从原点/相机位置开始的平面。
 *
 * @alias OrthographicOffCenterFrustum
 * @constructor
 *
 * @param {object} [options]  对象，具有以下属性:
 * @param {number} [options.left] 左剪切平面距离。
 * @param {number} [options.right] 右剪切平面距离。
 * @param {number} [options.top] 顶部剪切平面距离。
 * @param {number} [options.bottom] 底部剪切平面距离。
 * @param {number} [options.near=1.0] 近裁剪平面距离。
 * @param {number} [options.far=500000000.0] 远裁剪平面距离。
 *
 * @example
 * const maxRadii = ellipsoid.maximumRadius;
 *
 * const frustum = new Cesium.OrthographicOffCenterFrustum();
 * frustum.right = maxRadii * Cesium.Math.PI;
 * frustum.left = -c.frustum.right;
 * frustum.top = c.frustum.right * (canvas.clientHeight / canvas.clientWidth);
 * frustum.bottom = -c.frustum.top;
 * frustum.near = 0.01 * maxRadii;
 * frustum.far = 50.0 * maxRadii;
 */
function OrthographicOffCenterFrustum(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 左剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.left = options.left;
  this._left = undefined;

  /**
   * 正确的剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.right = options.right;
  this._right = undefined;

  /**
   * 顶部剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.top = options.top;
  this._top = undefined;

  /**
   * 底部剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.bottom = options.bottom;
  this._bottom = undefined;

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
   * @default 500000000.0;
   */
  this.far = defaultValue(options.far, 500000000.0);
  this._far = this.far;

  this._cullingVolume = new CullingVolume();
  this._orthographicMatrix = new Matrix4();
}

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.right) ||
    !defined(frustum.left) ||
    !defined(frustum.top) ||
    !defined(frustum.bottom) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError(
      "right, left, top, bottom, near, or far parameters are not set."
    );
  }
  //>>includeEnd('debug');

  if (
    frustum.top !== frustum._top ||
    frustum.bottom !== frustum._bottom ||
    frustum.left !== frustum._left ||
    frustum.right !== frustum._right ||
    frustum.near !== frustum._near ||
    frustum.far !== frustum._far
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (frustum.left > frustum.right) {
      throw new DeveloperError("right must be greater than left.");
    }
    if (frustum.bottom > frustum.top) {
      throw new DeveloperError("top must be greater than bottom.");
    }
    if (frustum.near <= 0 || frustum.near > frustum.far) {
      throw new DeveloperError(
        "near must be greater than zero and less than far."
      );
    }
    //>>includeEnd('debug');

    frustum._left = frustum.left;
    frustum._right = frustum.right;
    frustum._top = frustum.top;
    frustum._bottom = frustum.bottom;
    frustum._near = frustum.near;
    frustum._far = frustum.far;
    frustum._orthographicMatrix = Matrix4.computeOrthographicOffCenter(
      frustum.left,
      frustum.right,
      frustum.bottom,
      frustum.top,
      frustum.near,
      frustum.far,
      frustum._orthographicMatrix
    );
  }
}

Object.defineProperties(OrthographicOffCenterFrustum.prototype, {
  /**
   * 获取从视图视锥体计算的正交投影矩阵。
   * @memberof OrthographicOffCenterFrustum.prototype
   * @type {Matrix4}
   * @readonly
   */
  projectionMatrix: {
    get: function () {
      update(this);
      return this._orthographicMatrix;
    },
  },
});

const getPlanesRight = new Cartesian3();
const getPlanesNearCenter = new Cartesian3();
const getPlanesPoint = new Cartesian3();
const negateScratch = new Cartesian3();

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
OrthographicOffCenterFrustum.prototype.computeCullingVolume = function (
  position,
  direction,
  up
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(position)) {
    throw new DeveloperError("position is required.");
  }
  if (!defined(direction)) {
    throw new DeveloperError("direction is required.");
  }
  if (!defined(up)) {
    throw new DeveloperError("up is required.");
  }
  //>>includeEnd('debug');

  const planes = this._cullingVolume.planes;
  const t = this.top;
  const b = this.bottom;
  const r = this.right;
  const l = this.left;
  const n = this.near;
  const f = this.far;

  const right = Cartesian3.cross(direction, up, getPlanesRight);
  Cartesian3.normalize(right, right);
  const nearCenter = getPlanesNearCenter;
  Cartesian3.multiplyByScalar(direction, n, nearCenter);
  Cartesian3.add(position, nearCenter, nearCenter);

  const point = getPlanesPoint;

  // Left plane
  Cartesian3.multiplyByScalar(right, l, point);
  Cartesian3.add(nearCenter, point, point);

  let plane = planes[0];
  if (!defined(plane)) {
    plane = planes[0] = new Cartesian4();
  }
  plane.x = right.x;
  plane.y = right.y;
  plane.z = right.z;
  plane.w = -Cartesian3.dot(right, point);

  // Right plane
  Cartesian3.multiplyByScalar(right, r, point);
  Cartesian3.add(nearCenter, point, point);

  plane = planes[1];
  if (!defined(plane)) {
    plane = planes[1] = new Cartesian4();
  }
  plane.x = -right.x;
  plane.y = -right.y;
  plane.z = -right.z;
  plane.w = -Cartesian3.dot(Cartesian3.negate(right, negateScratch), point);

  // Bottom plane
  Cartesian3.multiplyByScalar(up, b, point);
  Cartesian3.add(nearCenter, point, point);

  plane = planes[2];
  if (!defined(plane)) {
    plane = planes[2] = new Cartesian4();
  }
  plane.x = up.x;
  plane.y = up.y;
  plane.z = up.z;
  plane.w = -Cartesian3.dot(up, point);

  // Top plane
  Cartesian3.multiplyByScalar(up, t, point);
  Cartesian3.add(nearCenter, point, point);

  plane = planes[3];
  if (!defined(plane)) {
    plane = planes[3] = new Cartesian4();
  }
  plane.x = -up.x;
  plane.y = -up.y;
  plane.z = -up.z;
  plane.w = -Cartesian3.dot(Cartesian3.negate(up, negateScratch), point);

  // Near plane
  plane = planes[4];
  if (!defined(plane)) {
    plane = planes[4] = new Cartesian4();
  }
  plane.x = direction.x;
  plane.y = direction.y;
  plane.z = direction.z;
  plane.w = -Cartesian3.dot(direction, nearCenter);

  // Far plane
  Cartesian3.multiplyByScalar(direction, f, point);
  Cartesian3.add(position, point, point);

  plane = planes[5];
  if (!defined(plane)) {
    plane = planes[5] = new Cartesian4();
  }
  plane.x = -direction.x;
  plane.y = -direction.y;
  plane.z = -direction.z;
  plane.w = -Cartesian3.dot(Cartesian3.negate(direction, negateScratch), point);

  return this._cullingVolume;
};

/**
 * 返回像素的宽度和高度（以米为单位）。
 *
 * @param {number} drawingBufferWidth 绘图缓冲区的宽度。
 * @param {number} drawingBufferHeight 绘图缓冲区的高度。
 * @param {number} distance 到近平面的距离，以米为单位。
 * @param {number} pixelRatio 从像素空间到坐标空间的缩放因子。
 * @param {Cartesian2} result 要在其上存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数 或 {@link Cartesian2} 的新实例，像素的宽度和高度分别位于 x 和 y 属性中。
 *
 * @exception {DeveloperError} drawingBufferWidth must be greater than zero.
 * @exception {DeveloperError} drawingBufferHeight must be greater than zero.
 * @exception {DeveloperError} pixelRatio must be greater than zero.
 *
 * @example
 * // Example 1
 * // Get the width and height of a pixel.
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 0.0, scene.pixelRatio, new Cesium.Cartesian2());
 */
OrthographicOffCenterFrustum.prototype.getPixelDimensions = function (
  drawingBufferWidth,
  drawingBufferHeight,
  distance,
  pixelRatio,
  result
) {
  update(this);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(drawingBufferWidth) || !defined(drawingBufferHeight)) {
    throw new DeveloperError(
      "Both drawingBufferWidth and drawingBufferHeight are required."
    );
  }
  if (drawingBufferWidth <= 0) {
    throw new DeveloperError("drawingBufferWidth must be greater than zero.");
  }
  if (drawingBufferHeight <= 0) {
    throw new DeveloperError("drawingBufferHeight must be greater than zero.");
  }
  if (!defined(distance)) {
    throw new DeveloperError("distance is required.");
  }
  if (!defined(pixelRatio)) {
    throw new DeveloperError("pixelRatio is required.");
  }
  if (pixelRatio <= 0) {
    throw new DeveloperError("pixelRatio must be greater than zero.");
  }
  if (!defined(result)) {
    throw new DeveloperError("A result object is required.");
  }
  //>>includeEnd('debug');

  const frustumWidth = this.right - this.left;
  const frustumHeight = this.top - this.bottom;
  const pixelWidth = (pixelRatio * frustumWidth) / drawingBufferWidth;
  const pixelHeight = (pixelRatio * frustumHeight) / drawingBufferHeight;

  result.x = pixelWidth;
  result.y = pixelHeight;
  return result;
};

/**
 * 返回 OrthographicOffCenterFrustum 实例的副本。
 *
 * @param {OrthographicOffCenterFrustum} [result] 要在其上存储结果的对象。
 * @returns {OrthographicOffCenterFrustum} 修改后的结果参数或者一个新的 OrthographicOffCenterFrustum 实例（如果未提供）。
 */
OrthographicOffCenterFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new OrthographicOffCenterFrustum();
  }

  result.left = this.left;
  result.right = this.right;
  result.top = this.top;
  result.bottom = this.bottom;
  result.near = this.near;
  result.far = this.far;

  // force update of clone to compute matrices
  result._left = undefined;
  result._right = undefined;
  result._top = undefined;
  result._bottom = undefined;
  result._near = undefined;
  result._far = undefined;

  return result;
};

/**
 * 按组件比较提供的 OrthographicOffCenterFrustum 并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {OrthographicOffCenterFrustum} [other] 右边 OrthographicOffCenterFrustum.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
OrthographicOffCenterFrustum.prototype.equals = function (other) {
  return (
    defined(other) &&
    other instanceof OrthographicOffCenterFrustum &&
    this.right === other.right &&
    this.left === other.left &&
    this.top === other.top &&
    this.bottom === other.bottom &&
    this.near === other.near &&
    this.far === other.far
  );
};

/**
 * 按组件比较提供的 OrthographicOffCenterFrustum 并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {OrthographicOffCenterFrustum} other 右边 OrthographicOffCenterFrustum.
 * @param {number} relativeEpsilon 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code> 如果 this 和其他都在提供的 epsilon 内, 否则 <code>false</code>。
 */
OrthographicOffCenterFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon
) {
  return (
    other === this ||
    (defined(other) &&
      other instanceof OrthographicOffCenterFrustum &&
      CesiumMath.equalsEpsilon(
        this.right,
        other.right,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        this.left,
        other.left,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        this.top,
        other.top,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        this.bottom,
        other.bottom,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        this.near,
        other.near,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      CesiumMath.equalsEpsilon(
        this.far,
        other.far,
        relativeEpsilon,
        absoluteEpsilon
      ))
  );
};
export default OrthographicOffCenterFrustum;
