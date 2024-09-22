import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import CesiumMath from "../Core/Math.js";

const defaultDimensions = new Cartesian3(1.0, 1.0, 1.0);

/**
 * 一个 ParticleEmitter，用于在盒子内发射粒子。
 * 粒子将随机放置在盒子内，并具有从盒子中心发出的初始速度。
 *
 * @alias BoxEmitter
 * @constructor
 *
 * @param {Cartesian3} dimensions 盒子的宽度、高度和深度尺寸。
 */
function BoxEmitter(dimensions) {
  dimensions = defaultValue(dimensions, defaultDimensions);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("dimensions", dimensions);
  Check.typeOf.number.greaterThanOrEquals("dimensions.x", dimensions.x, 0.0);
  Check.typeOf.number.greaterThanOrEquals("dimensions.y", dimensions.y, 0.0);
  Check.typeOf.number.greaterThanOrEquals("dimensions.z", dimensions.z, 0.0);
  //>>includeEnd('debug');

  this._dimensions = Cartesian3.clone(dimensions);
}

Object.defineProperties(BoxEmitter.prototype, {
  /**
   * 框的宽度、高度和深度尺寸（以米为单位）。
   * @memberof BoxEmitter.prototype
   * @type {Cartesian3}
   * @default new Cartesian3(1.0, 1.0, 1.0)
   */
  dimensions: {
    get: function () {
      return this._dimensions;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      Check.typeOf.number.greaterThanOrEquals("value.x", value.x, 0.0);
      Check.typeOf.number.greaterThanOrEquals("value.y", value.y, 0.0);
      Check.typeOf.number.greaterThanOrEquals("value.z", value.z, 0.0);
      //>>includeEnd('debug');
      Cartesian3.clone(value, this._dimensions);
    },
  },
});

const scratchHalfDim = new Cartesian3();

/**
 * 通过设置给定的 {Particle} 的位置和速度来初始化它。
 *
 * @private
 * @param {Particle} particle 要初始化的粒子。
 */
BoxEmitter.prototype.emit = function (particle) {
  const dim = this._dimensions;
  const halfDim = Cartesian3.multiplyByScalar(dim, 0.5, scratchHalfDim);

  const x = CesiumMath.randomBetween(-halfDim.x, halfDim.x);
  const y = CesiumMath.randomBetween(-halfDim.y, halfDim.y);
  const z = CesiumMath.randomBetween(-halfDim.z, halfDim.z);

  particle.position = Cartesian3.fromElements(x, y, z, particle.position);
  particle.velocity = Cartesian3.normalize(
    particle.position,
    particle.velocity
  );
};
export default BoxEmitter;
