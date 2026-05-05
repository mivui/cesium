import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import FrustumGeometry from "../Core/FrustumGeometry.js";
import FrustumOutlineGeometry from "../Core/FrustumOutlineGeometry.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import Matrix3 from "../Core/Matrix3.js";
import OrthographicFrustum from "../Core/OrthographicFrustum.js";
import OrthographicOffCenterFrustum from "../Core/OrthographicOffCenterFrustum.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import PerspectiveOffCenterFrustum from "../Core/PerspectiveOffCenterFrustum.js";
import Quaternion from "../Core/Quaternion.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 绘制相机视锥体的轮廓线。
 *
 * @alias DebugCameraPrimitive
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Camera} options.camera 相机。
 * @param {number[]} [options.frustumSplits] 相机视锥体近远平面的距离。这将覆盖相机的视锥体近远值。
 * @param {Color} [options.color=Color.CYAN] 调试轮廓线的颜色。
 * @param {boolean} [options.updateOnChange=true] 当底层相机变化时图元是否更新。
 * @param {boolean} [options.show=true] 确定是否显示此图元。
 * @param {object} [options.id] 当使用 {@link Scene#pick} 拾取实例时返回的用户定义对象。
 *
 * @example
 * primitives.add(new Cesium.DebugCameraPrimitive({
 *   camera : camera,
 *   color : Cesium.Color.YELLOW
 * }));
 */
function DebugCameraPrimitive(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.camera)) {
    throw new DeveloperError("options.camera is required.");
  }
  //>>includeEnd('debug');

  this._camera = options.camera;
  this._frustumSplits = options.frustumSplits;
  this._color = options.color ?? Color.CYAN;
  this._updateOnChange = options.updateOnChange ?? true;

  /**
   * 确定是否显示此图元。
   *
   * @type {boolean}
   * @default true
   */
  this.show = options.show ?? true;

  /**
   * 拾取图元时返回的用户定义值。
   *
   * @type {*}
   * @default undefined
   *
   * @see Scene#pick
   */
  this.id = options.id;
  this._id = undefined;

  this._outlinePrimitives = [];
  this._planesPrimitives = [];
}

const scratchRight = new Cartesian3();
const scratchRotation = new Matrix3();
const scratchOrientation = new Quaternion();
const scratchPerspective = new PerspectiveFrustum();
const scratchPerspectiveOffCenter = new PerspectiveOffCenterFrustum();
const scratchOrthographic = new OrthographicFrustum();
const scratchOrthographicOffCenter = new OrthographicOffCenterFrustum();

const scratchColor = new Color();
const scratchSplits = [1.0, 100000.0];

/**
 * @private
 */
DebugCameraPrimitive.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const planesPrimitives = this._planesPrimitives;
  const outlinePrimitives = this._outlinePrimitives;
  let i;
  let length;

  if (this._updateOnChange) {
    // Recreate the primitive every frame
    length = planesPrimitives.length;
    for (i = 0; i < length; ++i) {
      outlinePrimitives[i] =
        outlinePrimitives[i] && outlinePrimitives[i].destroy();
      planesPrimitives[i] =
        planesPrimitives[i] && planesPrimitives[i].destroy();
    }
    planesPrimitives.length = 0;
    outlinePrimitives.length = 0;
  }

  if (planesPrimitives.length === 0) {
    const camera = this._camera;
    const cameraFrustum = camera.frustum;
    let frustum;
    if (cameraFrustum instanceof PerspectiveFrustum) {
      frustum = scratchPerspective;
    } else if (cameraFrustum instanceof PerspectiveOffCenterFrustum) {
      frustum = scratchPerspectiveOffCenter;
    } else if (cameraFrustum instanceof OrthographicFrustum) {
      frustum = scratchOrthographic;
    } else {
      frustum = scratchOrthographicOffCenter;
    }
    frustum = cameraFrustum.clone(frustum);

    let numFrustums;
    let frustumSplits = this._frustumSplits;
    if (!defined(frustumSplits) || frustumSplits.length <= 1) {
      // Use near and far planes if no splits created
      frustumSplits = scratchSplits;
      frustumSplits[0] = this._camera.frustum.near;
      frustumSplits[1] = this._camera.frustum.far;
      numFrustums = 1;
    } else {
      numFrustums = frustumSplits.length - 1;
    }

    const position = camera.positionWC;
    const direction = camera.directionWC;
    const up = camera.upWC;
    let right = camera.rightWC;
    right = Cartesian3.negate(right, scratchRight);

    const rotation = scratchRotation;
    Matrix3.setColumn(rotation, 0, right, rotation);
    Matrix3.setColumn(rotation, 1, up, rotation);
    Matrix3.setColumn(rotation, 2, direction, rotation);

    const orientation = Quaternion.fromRotationMatrix(
      rotation,
      scratchOrientation,
    );

    planesPrimitives.length = outlinePrimitives.length = numFrustums;

    for (i = 0; i < numFrustums; ++i) {
      frustum.near = frustumSplits[i];
      frustum.far = frustumSplits[i + 1];

      planesPrimitives[i] = new Primitive({
        geometryInstances: new GeometryInstance({
          geometry: new FrustumGeometry({
            origin: position,
            orientation: orientation,
            frustum: frustum,
            _drawNearPlane: i === 0,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(
              Color.fromAlpha(this._color, 0.1, scratchColor),
            ),
          },
          id: this.id,
          pickPrimitive: this,
        }),
        appearance: new PerInstanceColorAppearance({
          translucent: true,
          flat: true,
        }),
        asynchronous: false,
      });

      outlinePrimitives[i] = new Primitive({
        geometryInstances: new GeometryInstance({
          geometry: new FrustumOutlineGeometry({
            origin: position,
            orientation: orientation,
            frustum: frustum,
            _drawNearPlane: i === 0,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(this._color),
          },
          id: this.id,
          pickPrimitive: this,
        }),
        appearance: new PerInstanceColorAppearance({
          translucent: false,
          flat: true,
        }),
        asynchronous: false,
      });
    }
  }

  length = planesPrimitives.length;
  for (i = 0; i < length; ++i) {
    outlinePrimitives[i].update(frameState);
    planesPrimitives[i].update(frameState);
  }
};

/**
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see DebugCameraPrimitive#destroy
 */
DebugCameraPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象可以确定性地释放 WebGL 资源，
 * 而不是依赖垃圾回收器来销毁此对象。
 * <p>
 * 对象一旦销毁，就不应再使用；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。因此，
 * 如示例所示，将返回值（<code>undefined</code>）赋值给该对象。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * p = p && p.destroy();
 *
 * @see DebugCameraPrimitive#isDestroyed
 */
DebugCameraPrimitive.prototype.destroy = function () {
  const length = this._planesPrimitives.length;
  for (let i = 0; i < length; ++i) {
    this._outlinePrimitives[i] =
      this._outlinePrimitives[i] && this._outlinePrimitives[i].destroy();
    this._planesPrimitives[i] =
      this._planesPrimitives[i] && this._planesPrimitives[i].destroy();
  }
  return destroyObject(this);
};
export default DebugCameraPrimitive;
