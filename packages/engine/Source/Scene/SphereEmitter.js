import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import CesiumMath from "../Core/Math.js";

/**
 * 一个 ParticleEmitter，用于在球体内发射粒子。
 * 粒子将在球体内随机定位，并具有从球体中心发出的初始速度。
 *
 * @alias SphereEmitter
 * @constructor
 *
 * @param {number} [radius=1.0] 球体的半径，以米为单位。
 */
function SphereEmitter(radius) {
  radius = defaultValue(radius, 1.0);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("radius", radius, 0.0);
  //>>includeEnd('debug');

  this._radius = defaultValue(radius, 1.0);
}

Object.defineProperties(SphereEmitter.prototype, {
  /**
   * 球体的半径（以米为单位）。
   * @memberof SphereEmitter.prototype
   * @type {number}
   * @default 1.0
   */
  radius: {
    get: function () {
      return this._radius;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThan("value", value, 0.0);
      //>>includeEnd('debug');
      this._radius = value;
    },
  },
});

/**
 * 通过设置给定的 {Particle} 的位置和速度来初始化它。
 *
 * @private
 * @param {Particle} particle 要初始化的粒子
 */
SphereEmitter.prototype.emit = function (particle) {
  const theta = CesiumMath.randomBetween(0.0, CesiumMath.TWO_PI);
  const phi = CesiumMath.randomBetween(0.0, CesiumMath.PI);
  const rad = CesiumMath.randomBetween(0.0, this._radius);

  const x = rad * Math.cos(theta) * Math.sin(phi);
  const y = rad * Math.sin(theta) * Math.sin(phi);
  const z = rad * Math.cos(phi);

  particle.position = Cartesian3.fromElements(x, y, z, particle.position);
  particle.velocity = Cartesian3.normalize(
    particle.position,
    particle.velocity
  );
};
export default SphereEmitter;
