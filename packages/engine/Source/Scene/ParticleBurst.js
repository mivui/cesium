import defaultValue from "../Core/defaultValue.js";

/**
 * 表示在系统生命周期中的给定时间，来自 {@link ParticleSystem} 的 {@link Particle} 的突发。
 *
 * @alias ParticleBurst
 * @constructor
 *
 * @param {object} [options]  对象，具有以下属性:
 * @param {number} [options.time=0.0] 粒子系统生命周期开始后爆发发生的时间（以秒为单位）。
 * @param {number} [options.minimum=0.0] 爆发中发射的最小粒子数。
 * @param {number} [options.maximum=50.0] 爆发中发射的最大粒子数。
 */
function ParticleBurst(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 粒子系统生命周期开始后爆发的时间（以秒为单位）。
   * @type {number}
   * @default 0.0
   */
  this.time = defaultValue(options.time, 0.0);
  /**
   * 发射的最小粒子数。
   * @type {number}
   * @default 0.0
   */
  this.minimum = defaultValue(options.minimum, 0.0);
  /**
   * 发射的最大粒子数。
   * @type {number}
   * @default 50.0
   */
  this.maximum = defaultValue(options.maximum, 50.0);

  this._complete = false;
}

Object.defineProperties(ParticleBurst.prototype, {
  /**
   * 如果突发已完成，则为 <code>true</code>; 否则 <code>false</code>。
   * @memberof ParticleBurst.prototype
   * @type {boolean}
   */
  complete: {
    get: function () {
      return this._complete;
    },
  },
});
export default ParticleBurst;
