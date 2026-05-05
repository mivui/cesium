import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} PpeMetadata.ConstructorOptions
 *
 * PpeMetadata 构造函数的初始化选项
 *
 * @property {PpeSource} source 误差数据的来源
 * @property {number|undefined} [min] 属性允许的最小值。
 * @property {number|undefined} [max] 属性允许的最大值。
 */

/**
 * 与存储的 PPE（逐点误差）数据相关的元数据。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展中
 * `ppeMetadata` 的定义。
 *
 * @constructor
 * @param {PpeMetadata.ConstructorOptions} options 描述初始化选项的对象
 *
 * @private
 */
function PpeMetadata(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.source", options.source);
  //>>includeEnd('debug');

  this._min = options.min;
  this._max = options.max;
  this._source = options.source;
}

Object.defineProperties(PpeMetadata.prototype, {
  /**
   * 属性允许的最小值。这是应用基于 offset 和 scale 属性的转换后
   * 所有值中的最小值。
   *
   * @memberof PpeMetadata.prototype
   * @type {number|undefined}
   * @readonly
   */
  min: {
    get: function () {
      return this._min;
    },
  },

  /**
   * 属性允许的最大值。这是应用基于 offset 和 scale 属性的转换后
   * 所有值中的最大值。
   *
   * @memberof PpeMetadata.prototype
   * @type {number|undefined}
   * @readonly
   */
  max: {
    get: function () {
      return this._max;
    },
  },

  /**
   * 可能的误差来源内容
   *
   * @memberof PpeMetadata.prototype
   * @type {PpeSource}
   * @readonly
   */
  source: {
    get: function () {
      return this._source;
    },
  },
});

export default PpeMetadata;
