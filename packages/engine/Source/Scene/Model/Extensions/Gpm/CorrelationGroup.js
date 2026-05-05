import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} CorrelationGroup.ConstructorOptions
 *
 * CorrelationGroup 构造函数的初始化选项
 *
 * @property {boolean[]} groupFlags 3 个布尔值数组，指示相关组中是否使用参数 delta-x、delta-y、delta-z
 * @property {Cartesian3} rotationThetas 绕 X、Y、Z 轴的旋转（毫弧度）
 * @property {Spdcf[]} params `Spdcf`（严格正定相关函数）参数数组，分别对应 U、V、W 方向
 */

/**
 * 标识使用相同相关建模的参数及关联相关参数的元数据。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展中
 * `correlationGroup` 的定义。
 *
 * @constructor
 * @param {CorrelationGroup.ConstructorOptions} options 描述初始化选项的对象
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下更改。
 */
function CorrelationGroup(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.groupFlags", options.groupFlags);
  Check.typeOf.object("options.rotationThetas", options.rotationThetas);
  Check.typeOf.object("options.params", options.params);
  //>>includeEnd('debug');

  this._groupFlags = options.groupFlags;
  this._rotationThetas = options.rotationThetas;
  this._params = options.params;
}

Object.defineProperties(CorrelationGroup.prototype, {
  /**
   * 包含 3 个布尔值的数组，指示相关组中是否使用参数 delta-x、delta-y、delta-z
   *
   * @memberof CorrelationGroup.prototype
   * @type {boolean[]}
   * @readonly
   */
  groupFlags: {
    get: function () {
      return this._groupFlags;
    },
  },

  /**
   * 绕 X、Y、Z 轴的旋转（毫弧度）
   *
   * @memberof CorrelationGroup.prototype
   * @type {Cartesian3}
   * @readonly
   */
  rotationThetas: {
    get: function () {
      return this._rotationThetas;
    },
  },

  /**
   * 3 组 SPDCF 参数数组，分别对应 U、V、W 方向
   *
   * @memberof CorrelationGroup.prototype
   * @type {Spdcf[]}
   * @readonly
   */
  params: {
    get: function () {
      return this._params;
    },
  },
});

export default CorrelationGroup;
