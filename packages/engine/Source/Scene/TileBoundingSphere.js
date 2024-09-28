import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import SphereOutlineGeometry from "../Core/SphereOutlineGeometry.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * A tile bounding volume specified as a sphere.
 * @alias TileBoundingSphere
 * @constructor
 *
 * @param {Cartesian3} [center=Cartesian3.ZERO] 边界球的中心。
 * @param {number} [radius=0.0] 边界范围的半径。
 *
 * @private
 */
function TileBoundingSphere(center, radius) {
  if (radius === 0) {
    radius = CesiumMath.EPSILON7;
  }
  this._boundingSphere = new BoundingSphere(center, radius);
}

Object.defineProperties(TileBoundingSphere.prototype, {
  /**
   * The center of the bounding sphere
   *
   * @memberof TileBoundingSphere.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */
  center: {
    get: function () {
      return this._boundingSphere.center;
    },
  },

  /**
   * The radius of the bounding sphere
   *
   * @memberof TileBoundingSphere.prototype
   *
   * @type {number}
   * @readonly
   */
  radius: {
    get: function () {
      return this._boundingSphere.radius;
    },
  },

  /**
   * The underlying bounding volume
   *
   * @memberof TileBoundingSphere.prototype
   *
   * @type {object}
   * @readonly
   */
  boundingVolume: {
    get: function () {
      return this._boundingSphere;
    },
  },
  /**
   * The underlying bounding sphere
   *
   * @memberof TileBoundingSphere.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   */
  boundingSphere: {
    get: function () {
      return this._boundingSphere;
    },
  },
});

/**
 * Computes the distance between this bounding sphere and the camera attached to frameState.
 *
 * @param {FrameState} frameState The frameState to which the camera is attached.
 * @returns {number} The distance between the camera and the bounding sphere in meters. Returns 0 if the camera is inside the bounding volume.
 *
 */
TileBoundingSphere.prototype.distanceToCamera = function (frameState) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("frameState", frameState);
  //>>includeEnd('debug');
  const boundingSphere = this._boundingSphere;
  return Math.max(
    0.0,
    Cartesian3.distance(boundingSphere.center, frameState.camera.positionWC) -
      boundingSphere.radius,
  );
};

/**
 * Determines which side of a plane this sphere is located.
 *
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect}{@link Intersect.INSIDE} 如果整个球体在平面的一侧,
 *                      法线是指向的，{@link Intersect.OUTSIDE}。如果整个球体是
 *                      在对面，和{@link Intersect.INTERSECTING}。与球面相交
 *                      与平面相交。
 */
TileBoundingSphere.prototype.intersectPlane = function (plane) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("plane", plane);
  //>>includeEnd('debug');
  return BoundingSphere.intersectPlane(this._boundingSphere, plane);
};

/**
 * Update the bounding sphere after the tile is transformed.
 *
 * @param {Cartesian3} center 边界球的中心。
 * @param {number} radius 边界范围的半径。
 */
TileBoundingSphere.prototype.update = function (center, radius) {
  Cartesian3.clone(center, this._boundingSphere.center);
  this._boundingSphere.radius = radius;
};

/**
 * Creates a debug primitive that shows the outline of the sphere.
 *
 * @param {Color} color The desired color of the primitive's mesh
 * @return {Primitive}
 */
TileBoundingSphere.prototype.createDebugVolume = function (color) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("color", color);
  //>>includeEnd('debug');
  const geometry = new SphereOutlineGeometry({
    radius: this.radius,
  });
  const modelMatrix = Matrix4.fromTranslation(
    this.center,
    new Matrix4.clone(Matrix4.IDENTITY),
  );
  const instance = new GeometryInstance({
    geometry: geometry,
    id: "outline",
    modelMatrix: modelMatrix,
    attributes: {
      color: ColorGeometryInstanceAttribute.fromColor(color),
    },
  });

  return new Primitive({
    geometryInstances: instance,
    appearance: new PerInstanceColorAppearance({
      translucent: false,
      flat: true,
    }),
    asynchronous: false,
  });
};
export default TileBoundingSphere;
