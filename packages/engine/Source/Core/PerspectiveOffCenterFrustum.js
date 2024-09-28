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
 * @alias PerspectiveOffCenterFrustum
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
 * const frustum = new Cesium.PerspectiveOffCenterFrustum({
 *     left : -1.0,
 *     right : 1.0,
 *     top : 1.0,
 *     bottom : -1.0,
 *     near : 1.0,
 *     far : 100.0
 * });
 *
 * @see PerspectiveFrustum
 */
function PerspectiveOffCenterFrustum(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 定义左剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.left = options.left;
  this._left = undefined;

  /**
   * 定义正确的剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.right = options.right;
  this._right = undefined;

  /**
   * 定义顶部剪切平面。
   * @type {number|undefined}
   * @default undefined
   */
  this.top = options.top;
  this._top = undefined;

  /**
   * 定义底部剪切平面。
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
   * @default 500000000.0
   */
  this.far = defaultValue(options.far, 500000000.0);
  this._far = this.far;

  this._cullingVolume = new CullingVolume();
  this._perspectiveMatrix = new Matrix4();
  this._infinitePerspective = new Matrix4();
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

  const { top, bottom, right, left, near, far } = frustum;

  const changed =
    top !== frustum._top ||
    bottom !== frustum._bottom ||
    left !== frustum._left ||
    right !== frustum._right ||
    near !== frustum._near ||
    far !== frustum._far;
  if (!changed) {
    return;
  }

  //>>includeStart('debug', pragmas.debug);
  if (frustum.near <= 0 || frustum.near > frustum.far) {
    throw new DeveloperError(
      "near must be greater than zero and less than far."
    );
  }
  //>>includeEnd('debug');

  frustum._left = left;
  frustum._right = right;
  frustum._top = top;
  frustum._bottom = bottom;
  frustum._near = near;
  frustum._far = far;
  frustum._perspectiveMatrix = Matrix4.computePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    far,
    frustum._perspectiveMatrix
  );
  frustum._infinitePerspective = Matrix4.computeInfinitePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    frustum._infinitePerspective
  );
}

Object.defineProperties(PerspectiveOffCenterFrustum.prototype, {
  /**
   * 获取从视图视锥体计算的透视投影矩阵。
   * 如果任何 frustum 参数发生更改，将重新计算投影矩阵。
   *
   * @memberof PerspectiveOffCenterFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#infiniteProjectionMatrix
   */
  projectionMatrix: {
    get: function () {
      update(this);
      return this._perspectiveMatrix;
    },
  },

  /**
   * 获取从具有无限远平面的视图视锥体计算的透视投影矩阵。
   * @memberof PerspectiveOffCenterFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#projectionMatrix
   */
  infiniteProjectionMatrix: {
    get: function () {
      update(this);
      return this._infinitePerspective;
    },
  },
});

const getPlanesRight = new Cartesian3();
const getPlanesNearCenter = new Cartesian3();
const getPlanesFarCenter = new Cartesian3();
const getPlanesNormal = new Cartesian3();
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
PerspectiveOffCenterFrustum.prototype.computeCullingVolume = function (
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

  const nearCenter = getPlanesNearCenter;
  Cartesian3.multiplyByScalar(direction, n, nearCenter);
  Cartesian3.add(position, nearCenter, nearCenter);

  const farCenter = getPlanesFarCenter;
  Cartesian3.multiplyByScalar(direction, f, farCenter);
  Cartesian3.add(position, farCenter, farCenter);

  const normal = getPlanesNormal;

  //Left plane computation
  Cartesian3.multiplyByScalar(right, l, normal);
  Cartesian3.add(nearCenter, normal, normal);
  Cartesian3.subtract(normal, position, normal);
  Cartesian3.normalize(normal, normal);
  Cartesian3.cross(normal, up, normal);
  Cartesian3.normalize(normal, normal);

  let plane = planes[0];
  if (!defined(plane)) {
    plane = planes[0] = new Cartesian4();
  }
  plane.x = normal.x;
  plane.y = normal.y;
  plane.z = normal.z;
  plane.w = -Cartesian3.dot(normal, position);

  //Right plane computation
  Cartesian3.multiplyByScalar(right, r, normal);
  Cartesian3.add(nearCenter, normal, normal);
  Cartesian3.subtract(normal, position, normal);
  Cartesian3.cross(up, normal, normal);
  Cartesian3.normalize(normal, normal);

  plane = planes[1];
  if (!defined(plane)) {
    plane = planes[1] = new Cartesian4();
  }
  plane.x = normal.x;
  plane.y = normal.y;
  plane.z = normal.z;
  plane.w = -Cartesian3.dot(normal, position);

  //Bottom plane computation
  Cartesian3.multiplyByScalar(up, b, normal);
  Cartesian3.add(nearCenter, normal, normal);
  Cartesian3.subtract(normal, position, normal);
  Cartesian3.cross(right, normal, normal);
  Cartesian3.normalize(normal, normal);

  plane = planes[2];
  if (!defined(plane)) {
    plane = planes[2] = new Cartesian4();
  }
  plane.x = normal.x;
  plane.y = normal.y;
  plane.z = normal.z;
  plane.w = -Cartesian3.dot(normal, position);

  //Top plane computation
  Cartesian3.multiplyByScalar(up, t, normal);
  Cartesian3.add(nearCenter, normal, normal);
  Cartesian3.subtract(normal, position, normal);
  Cartesian3.cross(normal, right, normal);
  Cartesian3.normalize(normal, normal);

  plane = planes[3];
  if (!defined(plane)) {
    plane = planes[3] = new Cartesian4();
  }
  plane.x = normal.x;
  plane.y = normal.y;
  plane.z = normal.z;
  plane.w = -Cartesian3.dot(normal, position);

  //Near plane computation
  plane = planes[4];
  if (!defined(plane)) {
    plane = planes[4] = new Cartesian4();
  }
  plane.x = direction.x;
  plane.y = direction.y;
  plane.z = direction.z;
  plane.w = -Cartesian3.dot(direction, nearCenter);

  //Far plane computation
  Cartesian3.negate(direction, normal);

  plane = planes[5];
  if (!defined(plane)) {
    plane = planes[5] = new Cartesian4();
  }
  plane.x = normal.x;
  plane.y = normal.y;
  plane.z = normal.z;
  plane.w = -Cartesian3.dot(normal, farCenter);

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
PerspectiveOffCenterFrustum.prototype.getPixelDimensions = function (
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
    throw new DeveloperError("pixelRatio is required");
  }
  if (pixelRatio <= 0) {
    throw new DeveloperError("pixelRatio must be greater than zero.");
  }
  if (!defined(result)) {
    throw new DeveloperError("A result object is required.");
  }
  //>>includeEnd('debug');

  const inverseNear = 1.0 / this.near;
  let tanTheta = this.top * inverseNear;
  const pixelHeight =
    (2.0 * pixelRatio * distance * tanTheta) / drawingBufferHeight;
  tanTheta = this.right * inverseNear;
  const pixelWidth =
    (2.0 * pixelRatio * distance * tanTheta) / drawingBufferWidth;

  result.x = pixelWidth;
  result.y = pixelHeight;
  return result;
};

/**
 * 返回 PerspectiveOffCenterFrustum 实例的副本。
 *
 * @param {PerspectiveOffCenterFrustum} [result] 要在其上存储结果的对象。
 * @returns {PerspectiveOffCenterFrustum} 修改后的结果参数或新的 PerspectiveFrustum 实例（如果未提供）。
 */
PerspectiveOffCenterFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new PerspectiveOffCenterFrustum();
  }

  result.right = this.right;
  result.left = this.left;
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
 * 按组件比较提供的 PerspectiveOffCenterFrustum，并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {PerspectiveOffCenterFrustum} [other] 右边 PerspectiveOffCenterFrustum.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
PerspectiveOffCenterFrustum.prototype.equals = function (other) {
  return (
    defined(other) &&
    other instanceof PerspectiveOffCenterFrustum &&
    this.right === other.right &&
    this.left === other.left &&
    this.top === other.top &&
    this.bottom === other.bottom &&
    this.near === other.near &&
    this.far === other.far
  );
};

/**
 * 按组件比较提供的 PerspectiveOffCenterFrustum，并返回
 * <code>true</code> 如果它们通过了绝对或相对耐受性测试，
 * 否则 <code>false</code>。
 *
 * @param {PerspectiveOffCenterFrustum} other 右边 PerspectiveOffCenterFrustum.
 * @param {number} relativeEpsilon 用于相等性检验的相对容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于相等性检验的绝对公差。
 * @returns {boolean} <code>true</code> 如果 this 和其他都在提供的 epsilon 内, 否则 <code>false</code>。
 */
PerspectiveOffCenterFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon
) {
  return (
    other === this ||
    (defined(other) &&
      other instanceof PerspectiveOffCenterFrustum &&
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
export default PerspectiveOffCenterFrustum;
