import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import CesiumMath from "../Core/Math.js";

/**
 * 在圆盘内发射粒子的 ParticleEmitter。
 * 粒子将位于圆盘的中心，并具有朝向圆盘外部的初始速度。
 *
 * @alias CircleEmitter
 * @constructor
 *
 * @param {number} [radius=1.0] 圆盘的半径。
 */
function CircleEmitter(radius) {
  this._radius = radius ?? 1.0;
}

Object.defineProperties(CircleEmitter.prototype, {
  /**
   * 圆盘的半径。
   * @memberof CircleEmitter.prototype
   * @type {number}
   * @default 1.0
   */
  radius: {
    get: function () {
      return this._radius;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');
      this._radius = value;
    },
  },
});

/**
 * Initializes the given {Particle} by setting it's position and velocity.
 *
 * @private
 * @param {Particle} particle The particle to initialize
 */
CircleEmitter.prototype.emit = function (particle) {
  const theta = CesiumMath.randomBetween(0.0, CesiumMath.TWO_PI);
  const rad = CesiumMath.randomBetween(0.0, this._radius);

  const x = rad * Math.cos(theta);
  const y = rad * Math.sin(theta);

  particle.position = Cartesian3.fromElements(x, y, 0.0, particle.position);
  particle.velocity = Cartesian3.fromElements(x, y, 0.0, particle.velocity);
  Cartesian3.normalize(particle.velocity, particle.velocity);
};
export default CircleEmitter;
