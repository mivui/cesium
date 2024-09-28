import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import BillboardCollection from "./BillboardCollection.js";
import CircleEmitter from "./CircleEmitter.js";
import Particle from "./Particle.js";

const defaultImageSize = new Cartesian2(1.0, 1.0);

/**
 * ParticleSystem 管理粒子集合的更新和显示。
 *
 * @alias ParticleSystem
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.show=true] 是否显示粒子系统。
 * @param {ParticleSystem.updateCallback} [options.updateCallback] 每帧调用以更新粒子的回调函数。
 * @param {ParticleEmitter} [options.emitter=new CircleEmitter(0.5)] 这个系统的粒子发射器。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将粒子系统从模型坐标转换为世界坐标的 4x4 变换矩阵。
 * @param {Matrix4} [options.emitterModelMatrix=Matrix4.IDENTITY] 在粒子系统局部坐标系内变换粒子系统发射器的 4x4 变换矩阵。
 * @param {number} [options.emissionRate=5] 每秒发射的粒子数。
 * @param {ParticleBurst[]} [options.bursts] 一个 {@link ParticleBurst} 数组，周期性地发射粒子爆发。
 * @param {boolean} [options.loop=true] 粒子系统在完成时是否应该循环其爆发。
 * @param {number} [options.scale=1.0] 设置在粒子的 particleLife 持续时间内应用于粒子图像的比例。
 * @param {number} [options.startScale] 应用于粒子生命周期开始时图像的初始比例。
 * @param {number} [options.endScale] 应用于粒子生命周期结束时图像的最终缩放。
 * @param {Color} [options.color=Color.WHITE] 设置粒子在其 particleLife 持续时间内的颜色。
 * @param {Color} [options.startColor] 粒子在其生命周期开始时的颜色。
 * @param {Color} [options.endColor] 粒子在其生命周期结束时的颜色。
 * @param {object} [options.image] 用于公告牌的 URI、HTMLImageElement 或 HTMLCanvasElement。
 * @param {Cartesian2} [options.imageSize=new Cartesian(1.0, 1.0)] 如果设置，则覆盖缩放粒子图像尺寸（以像素为单位）的 minimumImageSize 和 maximumImageSize 输入。
 * @param {Cartesian2} [options.minimumImageSize] 设置最小边界，宽度乘高度，超过该边界后，以像素为单位随机缩放粒子图像的尺寸。
 * @param {Cartesian2} [options.maximumImageSize] 设置最大边界（宽度乘高度），低于该边界时，可以随机缩放粒子图像的尺寸（以像素为单位）。
 * @param {boolean} [options.sizeInMeters] 设置粒子的大小是以米为单位还是以像素为单位。<code>true</code> 以米为单位调整颗粒大小;否则，大小以像素为单位。
 * @param {number} [options.speed=1.0] 如果设置，则用此值覆盖 minimumSpeed 和 maximumSpeed 输入。
 * @param {number} [options.minimumSpeed] 设置以米/秒为单位的最小限制，超过该限制时，将随机选择粒子的实际速度。
 * @param {number} [options.maximumSpeed] 设置以米/秒为单位的最大边界，低于该边界将随机选择粒子的实际速度。
 * @param {number} [options.lifetime=Number.MAX_VALUE] 粒子系统发射粒子的时间，以秒为单位。
 * @param {number} [options.particleLife=5.0] 如果设置，则使用此值覆盖 minimumParticleLife 和 maximumParticleLife 输入。
 * @param {number} [options.minimumParticleLife] 设置粒子寿命的可能持续时间的最小限制（以秒为单位），超过该限制时，将随机选择粒子的实际寿命。
 * @param {number} [options.maximumParticleLife] 设置粒子寿命的可能持续时间的最大限制（以秒为单位），低于该限制时，将随机选择粒子的实际寿命。
 * @param {number} [options.mass=1.0] 设置粒子的最小和最大质量（以千克为单位）。
 * @param {number} [options.minimumMass] 设置粒子质量的最小界限（以千克为单位）。粒子的实际质量将被选择为高于此值的随机量。
 * @param {number} [options.maximumMass] 设置粒子的最大质量（以千克为单位）。粒子的实际质量将选择为低于此值的随机量。
 * @demo {@link https://cesium.com/learn/cesiumjs-learn/cesiumjs-particle-systems/|粒子系统教程}
 * @demo {@link https://sandcastle.cesium.com/?src=Particle%20System.html&label=Showcases|粒子系统教程演示}
 * @demo {@link https://sandcastle.cesium.com/?src=Particle%20System%20Fireworks.html&label=Showcases|Particle Systems Fireworks 演示}
 */
function ParticleSystem(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 是否显示粒子系统。
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * force 回调数组。回调将传递 {@link Particle} 以及与上次
   * @type {ParticleSystem.updateCallback}
   * @default undefined
   */
  this.updateCallback = options.updateCallback;

  /**
   * 粒子系统是否应该在完成时循环它的爆发。
   * @type {boolean}
   * @default true
   */
  this.loop = defaultValue(options.loop, true);

  /**
   * 用于广告牌的 URI、HTMLImageElement 或 HTMLCanvasElement。
   * @type {object}
   * @default undefined
   */
  this.image = defaultValue(options.image, undefined);

  let emitter = options.emitter;
  if (!defined(emitter)) {
    emitter = new CircleEmitter(0.5);
  }
  this._emitter = emitter;

  this._bursts = options.bursts;

  this._modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  this._emitterModelMatrix = Matrix4.clone(
    defaultValue(options.emitterModelMatrix, Matrix4.IDENTITY),
  );
  this._matrixDirty = true;
  this._combinedMatrix = new Matrix4();

  this._startColor = Color.clone(
    defaultValue(options.color, defaultValue(options.startColor, Color.WHITE)),
  );
  this._endColor = Color.clone(
    defaultValue(options.color, defaultValue(options.endColor, Color.WHITE)),
  );

  this._startScale = defaultValue(
    options.scale,
    defaultValue(options.startScale, 1.0),
  );
  this._endScale = defaultValue(
    options.scale,
    defaultValue(options.endScale, 1.0),
  );

  this._emissionRate = defaultValue(options.emissionRate, 5.0);

  this._minimumSpeed = defaultValue(
    options.speed,
    defaultValue(options.minimumSpeed, 1.0),
  );
  this._maximumSpeed = defaultValue(
    options.speed,
    defaultValue(options.maximumSpeed, 1.0),
  );

  this._minimumParticleLife = defaultValue(
    options.particleLife,
    defaultValue(options.minimumParticleLife, 5.0),
  );
  this._maximumParticleLife = defaultValue(
    options.particleLife,
    defaultValue(options.maximumParticleLife, 5.0),
  );

  this._minimumMass = defaultValue(
    options.mass,
    defaultValue(options.minimumMass, 1.0),
  );
  this._maximumMass = defaultValue(
    options.mass,
    defaultValue(options.maximumMass, 1.0),
  );

  this._minimumImageSize = Cartesian2.clone(
    defaultValue(
      options.imageSize,
      defaultValue(options.minimumImageSize, defaultImageSize),
    ),
  );
  this._maximumImageSize = Cartesian2.clone(
    defaultValue(
      options.imageSize,
      defaultValue(options.maximumImageSize, defaultImageSize),
    ),
  );

  this._sizeInMeters = defaultValue(options.sizeInMeters, false);

  this._lifetime = defaultValue(options.lifetime, Number.MAX_VALUE);

  this._billboardCollection = undefined;
  this._particles = [];

  // An array of available particles that we can reuse instead of allocating new.
  this._particlePool = [];

  this._previousTime = undefined;
  this._currentTime = 0.0;
  this._carryOver = 0.0;

  this._complete = new Event();
  this._isComplete = false;

  this._updateParticlePool = true;
  this._particleEstimate = 0;
}

Object.defineProperties(ParticleSystem.prototype, {
  /**
   * 粒子发射器
   * @memberof ParticleSystem.prototype
   * @type {ParticleEmitter}
   * @default CircleEmitter
   */
  emitter: {
    get: function () {
      return this._emitter;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');
      this._emitter = value;
    },
  },
  /**
   * 一个 {@link ParticleBurst} 数组，在周期性时间发射粒子爆发。
   * @memberof ParticleSystem.prototype
   * @type {ParticleBurst[]}
   * @default undefined
   */
  bursts: {
    get: function () {
      return this._bursts;
    },
    set: function (value) {
      this._bursts = value;
      this._updateParticlePool = true;
    },
  },
  /**
   * 将粒子系统从模型转换为世界坐标的 4x4 变换矩阵。
   * @memberof ParticleSystem.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */
  modelMatrix: {
    get: function () {
      return this._modelMatrix;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');
      this._matrixDirty =
        this._matrixDirty || !Matrix4.equals(this._modelMatrix, value);
      Matrix4.clone(value, this._modelMatrix);
    },
  },
  /**
   * 在粒子系统局部坐标系内变换粒子系统发射器的 4x4 变换矩阵。
   * @memberof ParticleSystem.prototype
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */
  emitterModelMatrix: {
    get: function () {
      return this._emitterModelMatrix;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');
      this._matrixDirty =
        this._matrixDirty || !Matrix4.equals(this._emitterModelMatrix, value);
      Matrix4.clone(value, this._emitterModelMatrix);
    },
  },
  /**
   * 粒子在其生命周期开始时的颜色。
   * @memberof ParticleSystem.prototype
   * @type {Color}
   * @default Color.WHITE
   */
  startColor: {
    get: function () {
      return this._startColor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');
      Color.clone(value, this._startColor);
    },
  },
  /**
   * 粒子在其生命周期结束时的颜色。
   * @memberof ParticleSystem.prototype
   * @type {Color}
   * @default Color.WHITE
   */
  endColor: {
    get: function () {
      return this._endColor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');
      Color.clone(value, this._endColor);
    },
  },
  /**
   * 应用于粒子生命周期开始时图像的初始比例。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  startScale: {
    get: function () {
      return this._startScale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._startScale = value;
    },
  },
  /**
   * 应用于粒子生命周期结束时的图像的最终比例。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  endScale: {
    get: function () {
      return this._endScale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._endScale = value;
    },
  },
  /**
   * 每秒要发射的粒子数。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 5
   */
  emissionRate: {
    get: function () {
      return this._emissionRate;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._emissionRate = value;
      this._updateParticlePool = true;
    },
  },
  /**
   * 设置最小限制（以米/秒为单位），超过该限制时将随机选择粒子的实际速度。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  minimumSpeed: {
    get: function () {
      return this._minimumSpeed;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._minimumSpeed = value;
    },
  },
  /**
   * 设置最大限制（以米/秒为单位），低于该限制时将随机选择粒子的实际速度。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  maximumSpeed: {
    get: function () {
      return this._maximumSpeed;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._maximumSpeed = value;
    },
  },
  /**
   * 设置粒子寿命可能持续时间的最小限制（以秒为单位），超过该限制将随机选择粒子的实际寿命。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 5.0
   */
  minimumParticleLife: {
    get: function () {
      return this._minimumParticleLife;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._minimumParticleLife = value;
    },
  },
  /**
   * 设置粒子寿命可能持续时间的最大限制（以秒为单位），低于该限制时将随机选择粒子的实际寿命。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 5.0
   */
  maximumParticleLife: {
    get: function () {
      return this._maximumParticleLife;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._maximumParticleLife = value;
      this._updateParticlePool = true;
    },
  },
  /**
   * 设置粒子的最小质量（以千克为单位）。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  minimumMass: {
    get: function () {
      return this._minimumMass;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._minimumMass = value;
    },
  },
  /**
   * 设置粒子的最大质量（以千克为单位）。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default 1.0
   */
  maximumMass: {
    get: function () {
      return this._maximumMass;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._maximumMass = value;
    },
  },
  /**
   * 设置最小边界 width x height，超过该边界时，将随机缩放粒子图像的尺寸（以像素为单位）。
   * @memberof ParticleSystem.prototype
   * @type {Cartesian2}
   * @default new Cartesian2(1.0, 1.0)
   */
  minimumImageSize: {
    get: function () {
      return this._minimumImageSize;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      Check.typeOf.number.greaterThanOrEquals("value.x", value.x, 0.0);
      Check.typeOf.number.greaterThanOrEquals("value.y", value.y, 0.0);
      //>>includeEnd('debug');
      this._minimumImageSize = value;
    },
  },
  /**
   * 设置最大边界 width x height，低于该边界时，将随机缩放粒子图像的尺寸（以像素为单位）。
   * @memberof ParticleSystem.prototype
   * @type {Cartesian2}
   * @default new Cartesian2(1.0, 1.0)
   */
  maximumImageSize: {
    get: function () {
      return this._maximumImageSize;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      Check.typeOf.number.greaterThanOrEquals("value.x", value.x, 0.0);
      Check.typeOf.number.greaterThanOrEquals("value.y", value.y, 0.0);
      //>>includeEnd('debug');
      this._maximumImageSize = value;
    },
  },
  /**
   * 获取或设置是否粒子大小以米或像素为单位。以米为单位的颗粒大小<code>为真</code>;否则，大小以像素为单位。
   * @memberof ParticleSystem.prototype
   * @type {boolean}
   * @default false
   */
  sizeInMeters: {
    get: function () {
      return this._sizeInMeters;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');
      this._sizeInMeters = value;
    },
  },
  /**
   * 粒子系统发射粒子的时间（以秒为单位）。
   * @memberof ParticleSystem.prototype
   * @type {number}
   * @default Number.MAX_VALUE
   */
  lifetime: {
    get: function () {
      return this._lifetime;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0.0);
      //>>includeEnd('debug');
      this._lifetime = value;
    },
  },
  /**
   * 当粒子系统达到其生命周期的终点时触发事件。
   * @memberof ParticleSystem.prototype
   * @type {Event}
   */
  complete: {
    get: function () {
      return this._complete;
    },
  },
  /**
   * 如果为<code> true</code>，则粒子系统已达到其生命周期的终点;<否则code>false</否则code> 。
   * @memberof ParticleSystem.prototype
   * @type {boolean}
   */
  isComplete: {
    get: function () {
      return this._isComplete;
    },
  },
});

function updateParticlePool(system) {
  const emissionRate = system._emissionRate;
  const life = system._maximumParticleLife;

  let burstAmount = 0;
  const bursts = system._bursts;
  if (defined(bursts)) {
    const length = bursts.length;
    for (let i = 0; i < length; ++i) {
      burstAmount += bursts[i].maximum;
    }
  }

  const billboardCollection = system._billboardCollection;
  const image = system.image;

  const particleEstimate = Math.ceil(emissionRate * life + burstAmount);
  const particles = system._particles;
  const particlePool = system._particlePool;
  const numToAdd = Math.max(
    particleEstimate - particles.length - particlePool.length,
    0,
  );

  for (let j = 0; j < numToAdd; ++j) {
    const particle = new Particle();
    particle._billboard = billboardCollection.add({
      image: image,
      // Make the newly added billboards invisible when updating the particle pool
      // to prevent the billboards from being displayed when the particles
      // are not created. The billboard will always be set visible in
      // updateBillboard function when its corresponding particle update.
      show: false,
    });
    particlePool.push(particle);
  }

  system._particleEstimate = particleEstimate;
}

function getOrCreateParticle(system) {
  // Try to reuse an existing particle from the pool.
  let particle = system._particlePool.pop();
  if (!defined(particle)) {
    // Create a new one
    particle = new Particle();
  }
  return particle;
}

function addParticleToPool(system, particle) {
  system._particlePool.push(particle);
}

function freeParticlePool(system) {
  const particles = system._particles;
  const particlePool = system._particlePool;
  const billboardCollection = system._billboardCollection;

  const numParticles = particles.length;
  const numInPool = particlePool.length;
  const estimate = system._particleEstimate;

  const start = numInPool - Math.max(estimate - numParticles - numInPool, 0);
  for (let i = start; i < numInPool; ++i) {
    const p = particlePool[i];
    billboardCollection.remove(p._billboard);
  }
  particlePool.length = start;
}

function removeBillboard(particle) {
  if (defined(particle._billboard)) {
    particle._billboard.show = false;
  }
}

function updateBillboard(system, particle) {
  let billboard = particle._billboard;
  if (!defined(billboard)) {
    billboard = particle._billboard = system._billboardCollection.add({
      image: particle.image,
    });
  }
  billboard.width = particle.imageSize.x;
  billboard.height = particle.imageSize.y;
  billboard.position = particle.position;
  billboard.sizeInMeters = system.sizeInMeters;
  billboard.show = true;

  // Update the color
  const r = CesiumMath.lerp(
    particle.startColor.red,
    particle.endColor.red,
    particle.normalizedAge,
  );
  const g = CesiumMath.lerp(
    particle.startColor.green,
    particle.endColor.green,
    particle.normalizedAge,
  );
  const b = CesiumMath.lerp(
    particle.startColor.blue,
    particle.endColor.blue,
    particle.normalizedAge,
  );
  const a = CesiumMath.lerp(
    particle.startColor.alpha,
    particle.endColor.alpha,
    particle.normalizedAge,
  );
  billboard.color = new Color(r, g, b, a);

  // Update the scale
  billboard.scale = CesiumMath.lerp(
    particle.startScale,
    particle.endScale,
    particle.normalizedAge,
  );
}

function addParticle(system, particle) {
  particle.startColor = Color.clone(system._startColor, particle.startColor);
  particle.endColor = Color.clone(system._endColor, particle.endColor);
  particle.startScale = system._startScale;
  particle.endScale = system._endScale;
  particle.image = system.image;
  particle.life = CesiumMath.randomBetween(
    system._minimumParticleLife,
    system._maximumParticleLife,
  );
  particle.mass = CesiumMath.randomBetween(
    system._minimumMass,
    system._maximumMass,
  );
  particle.imageSize.x = CesiumMath.randomBetween(
    system._minimumImageSize.x,
    system._maximumImageSize.x,
  );
  particle.imageSize.y = CesiumMath.randomBetween(
    system._minimumImageSize.y,
    system._maximumImageSize.y,
  );

  // Reset the normalizedAge and age in case the particle was reused.
  particle._normalizedAge = 0.0;
  particle._age = 0.0;

  const speed = CesiumMath.randomBetween(
    system._minimumSpeed,
    system._maximumSpeed,
  );
  Cartesian3.multiplyByScalar(particle.velocity, speed, particle.velocity);

  system._particles.push(particle);
}

function calculateNumberToEmit(system, dt) {
  // This emitter is finished if it exceeds it's lifetime.
  if (system._isComplete) {
    return 0;
  }

  dt = CesiumMath.mod(dt, system._lifetime);

  // Compute the number of particles to emit based on the emissionRate.
  const v = dt * system._emissionRate;
  let numToEmit = Math.floor(v);
  system._carryOver += v - numToEmit;
  if (system._carryOver > 1.0) {
    numToEmit++;
    system._carryOver -= 1.0;
  }

  // Apply any bursts
  if (defined(system.bursts)) {
    const length = system.bursts.length;
    for (let i = 0; i < length; i++) {
      const burst = system.bursts[i];
      const currentTime = system._currentTime;
      if (defined(burst) && !burst._complete && currentTime > burst.time) {
        numToEmit += CesiumMath.randomBetween(burst.minimum, burst.maximum);
        burst._complete = true;
      }
    }
  }

  return numToEmit;
}

const rotatedVelocityScratch = new Cartesian3();

/**
 * @private
 */
ParticleSystem.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  if (!defined(this._billboardCollection)) {
    this._billboardCollection = new BillboardCollection();
  }

  if (this._updateParticlePool) {
    updateParticlePool(this);
    this._updateParticlePool = false;
  }

  // Compute the frame time
  let dt = 0.0;
  if (this._previousTime) {
    dt = JulianDate.secondsDifference(frameState.time, this._previousTime);
  }

  if (dt < 0.0) {
    dt = 0.0;
  }

  const particles = this._particles;
  const emitter = this._emitter;
  const updateCallback = this.updateCallback;

  let i;
  let particle;

  // update particles and remove dead particles
  let length = particles.length;
  for (i = 0; i < length; ++i) {
    particle = particles[i];
    if (!particle.update(dt, updateCallback)) {
      removeBillboard(particle);
      // Add the particle back to the pool so it can be reused.
      addParticleToPool(this, particle);
      particles[i] = particles[length - 1];
      --i;
      --length;
    } else {
      updateBillboard(this, particle);
    }
  }
  particles.length = length;

  const numToEmit = calculateNumberToEmit(this, dt);

  if (numToEmit > 0 && defined(emitter)) {
    // Compute the final model matrix by combining the particle systems model matrix and the emitter matrix.
    if (this._matrixDirty) {
      this._combinedMatrix = Matrix4.multiply(
        this.modelMatrix,
        this.emitterModelMatrix,
        this._combinedMatrix,
      );
      this._matrixDirty = false;
    }

    const combinedMatrix = this._combinedMatrix;

    for (i = 0; i < numToEmit; i++) {
      // Create a new particle.
      particle = getOrCreateParticle(this);

      // Let the emitter initialize the particle.
      this._emitter.emit(particle);

      //For the velocity we need to add it to the original position and then multiply by point.
      Cartesian3.add(
        particle.position,
        particle.velocity,
        rotatedVelocityScratch,
      );
      Matrix4.multiplyByPoint(
        combinedMatrix,
        rotatedVelocityScratch,
        rotatedVelocityScratch,
      );

      // Change the position to be in world coordinates
      particle.position = Matrix4.multiplyByPoint(
        combinedMatrix,
        particle.position,
        particle.position,
      );

      // Orient the velocity in world space as well.
      Cartesian3.subtract(
        rotatedVelocityScratch,
        particle.position,
        particle.velocity,
      );
      Cartesian3.normalize(particle.velocity, particle.velocity);

      // Add the particle to the system.
      addParticle(this, particle);
      updateBillboard(this, particle);
    }
  }

  this._billboardCollection.update(frameState);
  this._previousTime = JulianDate.clone(frameState.time, this._previousTime);
  this._currentTime += dt;

  if (
    this._lifetime !== Number.MAX_VALUE &&
    this._currentTime > this._lifetime
  ) {
    if (this.loop) {
      this._currentTime = CesiumMath.mod(this._currentTime, this._lifetime);
      if (this.bursts) {
        const burstLength = this.bursts.length;
        // Reset any bursts
        for (i = 0; i < burstLength; i++) {
          this.bursts[i]._complete = false;
        }
      }
    } else {
      this._isComplete = true;
      this._complete.raiseEvent(this);
    }
  }

  // free particles in the pool and release billboard GPU memory
  if (frameState.frameNumber % 120 === 0) {
    freeParticlePool(this);
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see ParticleSystem#destroy
 */
ParticleSystem.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see ParticleSystem#isDestroyed
 */
ParticleSystem.prototype.destroy = function () {
  this._billboardCollection =
    this._billboardCollection && this._billboardCollection.destroy();
  return destroyObject(this);
};

/**
 * 用于在每个时间步长修改粒子属性的函数。这可能包括 force 修改、
 * 颜色、尺寸等。
 *
 * @callback ParticleSystem.updateCallback
 *
 * @param {Particle} particle 正在更新的粒子。
 * @param {number} dt 自上次更新以来的时间（以秒为单位）。
 *
 * @example
 * function applyGravity(particle, dt) {
 *    const position = particle.position;
 *    const gravityVector = Cesium.Cartesian3.normalize(position, new Cesium.Cartesian3());
 *    Cesium.Cartesian3.multiplyByScalar(gravityVector, GRAVITATIONAL_CONSTANT * dt, gravityVector);
 *    particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityVector, particle.velocity);
 * }
 */
export default ParticleSystem;
