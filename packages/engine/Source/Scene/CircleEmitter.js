import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import CesiumMath from "../Core/Math.js";

/**
 * 从圆圈发射粒子的 ParticleEmitter。
 * 粒子将位于一个圆内，并具有沿 z 向量的初始速度。
 *
 * @alias CircleEmitter
 * @constructor
 *
 * @param {number} [radius=1.0] 圆的半径，以米为单位。
 */
function CircleEmitter(radius) {
  radius = defaultValue(radius, 1.0);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("radius", radius, 0.0);
  //>>includeEnd('debug');

  this._radius = defaultValue(radius, 1.0);
}

Object.defineProperties(CircleEmitter.prototype, {
  /**
   * 圆的半径（以米为单位）。
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
      Check.typeOf.number.greaterThan("value", value, 0.0);
      //>>includeEnd('debug');
      this._radius = value;
    },
  },
});

/**
 * 通过设置给定 {@link Particle} 的位置和速度来初始化它。
 *
 * @private
 * @param {Particle} particle 要初始化的粒子。
 */
CircleEmitter.prototype.emit = function (particle) {
  const theta = CesiumMath.randomBetween(0.0, CesiumMath.TWO_PI);
  const rad = CesiumMath.randomBetween(0.0, this._radius);

  const x = rad * Math.cos(theta);
  const y = rad * Math.sin(theta);
  const z = 0.0;

  particle.position = Cartesian3.fromElements(x, y, z, particle.position);
  particle.velocity = Cartesian3.clone(Cartesian3.UNIT_Z, particle.velocity);
};
export default CircleEmitter;
