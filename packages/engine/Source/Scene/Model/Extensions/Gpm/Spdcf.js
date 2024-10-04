import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} Spdcf.ConstructorOptions
 *
 * Spdcf 构造函数的初始化选项
 *
 * @property {number} A 因子 A，在 (0, 1]
 * @property {number} alpha alpha 值，在 [0, 1)
 * @property {number} beta beta 值（在 [0, 10]
 * @property {number} T tau 值，以 (0, +inf)
 */

/**
 * 严格正定相关函数的变量。
 *
 * 这反映了 `spdcf` 的定义
 * {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展。
 * 此类型的实例作为参数存储在
 * 'CorrelationGroup'。
 *
 * Parameters (A, alpha, beta, T) describe the correlation decrease
 * between points as a function of delta time:
 * ```
 * spdcf(delta_t) = A_t * (alpha_t + ((1 - alpha_t)(1 + beta_t)) / (beta_t + e^(delta_t/T_t)))
 * ```
 *
 * @constructor
 * @param {Spdcf.ConstructorOptions} options 描述初始化选项的对象
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
function Spdcf(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("options.A", options.A, 0.0);
  Check.typeOf.number.lessThanOrEquals("options.A", options.A, 1.0);
  Check.typeOf.number.greaterThanOrEquals("options.alpha", options.alpha, 0.0);
  Check.typeOf.number.lessThan("options.alpha", options.alpha, 1.0);
  Check.typeOf.number.greaterThanOrEquals("options.beta", options.beta, 0.0);
  Check.typeOf.number.lessThanOrEquals("options.beta", options.beta, 10.0);
  Check.typeOf.number.greaterThan("options.T", options.T, 0.0);
  //>>includeEnd('debug');

  this._A = options.A;
  this._alpha = options.alpha;
  this._beta = options.beta;
  this._T = options.T;
}

Object.defineProperties(Spdcf.prototype, {
  /**
   * 区间 (0, 1]
   *
   * @memberof Spdcf.prototype
   * @type {number}
   * @readonly
   */
  A: {
    get: function () {
      return this._A;
    },
  },

  /**
   * 区间 [0, 1)
   *
   * @memberof Spdcf.prototype
   * @type {number}
   * @readonly
   */
  alpha: {
    get: function () {
      return this._alpha;
    },
  },

  /**
   * 区间 [0, 10]
   *
   * @memberof Spdcf.prototype
   * @type {number}
   * @readonly
   */
  beta: {
    get: function () {
      return this._beta;
    },
  },

  /**
   * 区间 (0, +inf)
   *
   * @memberof Spdcf.prototype
   * @type {number}
   * @readonly
   */
  T: {
    get: function () {
      return this._T;
    },
  },
});

export default Spdcf;
