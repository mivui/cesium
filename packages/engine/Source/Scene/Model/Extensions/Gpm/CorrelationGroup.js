import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} CorrelationGroup.ConstructorOptions
 *
 * CorrelationGroup 构造函数的初始化选项
 *
 * @property {boolean[]} groupFlags 包含 3 个布尔值的数组，指示 if
 * 相关组中使用的参数 delta-x delta-y delta-z
 * @property {Cartesian3} rotationThetas 以毫弧度为单位的旋转
 * 分别关于 X、Y、Z 轴
 * @property {Spdcf[]} params 'spdcf' 数组（严格正定
 * 相关函数）参数，分别用于 U、V、W 方向
 */

/**
 * 使用相同的关联建模识别参数的元数据，以及
 * 相关的相关参数。
 *
 * 这反映了 `correlationGroup` 的定义
 * {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF extension.
 *
 * @constructor
 * @param {CorrelationGroup.ConstructorOptions} options 描述初始化选项的对象
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
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
   * 3 个布尔值的数组，指示参数是否为 delta-x delta-y delta-z
   * 用于关联组
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
   * 分别绕 X、Y、Z 轴的毫弧度旋转
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
   * 3 组 SPDCF 参数的数组，分别用于 U、V、W 方向
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
