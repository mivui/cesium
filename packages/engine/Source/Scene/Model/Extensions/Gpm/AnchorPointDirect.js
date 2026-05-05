import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} AnchorPointDirect.ConstructorOptions
 *
 * AnchorPointDirect 构造函数的初始化选项
 *
 * @property {Cartesian3} position 锚点地理坐标
 * @property {Cartesian3} adjustmentParams 调整值，单位为米
 */

/**
 * 使用直接存储的一个锚点的元数据。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展中
 * `anchorPointDirect` 的定义。
 *
 * @constructor
 * @param {AnchorPointDirect.ConstructorOptions} options 描述初始化选项的对象
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下更改。
 */
function AnchorPointDirect(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.position", options.position);
  Check.typeOf.object("options.adjustmentParams", options.adjustmentParams);
  //>>includeEnd('debug');

  this._position = options.position;
  this._adjustmentParams = options.adjustmentParams;
}

Object.defineProperties(AnchorPointDirect.prototype, {
  /**
   * 锚点地理坐标，单位为米，格式为 X/东向、Y/北向、Z/高度。
   *
   * @memberof AnchorPointDirect.prototype
   * @type {Cartesian3}
   * @readonly
   */
  position: {
    get: function () {
      return this._position;
    },
  },

  /**
   * 每个锚点的 delta-x、delta-y、delta-z 调整值，单位为米。
   *
   * @memberof AnchorPointDirect.prototype
   * @type {Cartesian3}
   * @readonly
   */
  adjustmentParams: {
    get: function () {
      return this._adjustmentParams;
    },
  },
});

export default AnchorPointDirect;
