import defined from "../../../../Core/defined.js";
import Check from "../../../../Core/Check.js";
import RuntimeError from "../../../../Core/RuntimeError.js";
import StorageType from "./StorageType.js";

/**
 * @typedef {object} GltfGpmLocal.ConstructorOptions
 *
 * GltfGpmLocal 构造函数的初始化选项
 *
 * @property {string} storageType 存储类型。
 * 这必须是 'StorageType' 常量之一，即 'Direct' 或 'Indirect'。
 * @property {AnchorPointIndirect[]|undefined} [anchorPointsIndirect] 间接锚点。
 * 当且仅当存储类型为 'Indirect' 时，必须存在此项。
 * @property {CorrelationGroup[]|undefined} [intraTileCorrelationGroups] 图块内相关组。
 * 当且仅当存储类型为 'Indirect' 时，必须存在此项。
 * @property {AnchorPointDirect[]|undefined} [anchorPointsDirect] 直接锚点。
 * 当且仅当存储类型为 'Direct' 时，必须存在此项。
 * @property {Matrix3|undefined} [covarianceDirect] 锚点参数的协方差。
 * 当且仅当存储类型为 'Direct' 时，必须存在此项。
 */

/**
 * 存储了 Ground-Space Indirect 实现的 GPM 元数据
 * 本地（即瓦片和/或叶节点）。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local}
 * glTF 扩展。加载包含此扩展的模型时，
 * 则可以通过调用
 * ```
 * const gltfGpmLocal = model.getExtension("NGA_gpm_local");
 * ```
 *
 * 存储类型决定了是否存在可选属性：
 * <ul>
 *  <li>
 *   当存储类型为 'StorageType.Indirect' 时，则
 *   'anchorPointsIndirect' 和 'intraTileCorrelationGroups'
 *   存在。
 *  </li>
 *  <li>
 *   当存储类型为 'StorageType.Direct' 时，则
 *   存在 'anchorPointsDirect' 和 'covarianceDirect'。
 *  </li>
 * </ul>
 *
 * @constructor
 * @param {GltfGpmLocal.ConstructorOptions} options 描述初始化选项的对象
 *
 * @experimental 此功能不是最终的，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
function GltfGpmLocal(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.storageType", options.storageType);
  //>>includeEnd('debug');

  this._storageType = options.storageType;
  this._anchorPointsIndirect = options.anchorPointsIndirect;
  this._anchorPointsDirect = options.anchorPointsDirect;
  this._intraTileCorrelationGroups = options.intraTileCorrelationGroups;
  this._covarianceDirect = options.covarianceDirect;

  //>>includeStart('debug', pragmas.debug);
  if (this.storageType === StorageType.Indirect) {
    if (!defined(this.anchorPointsIndirect)) {
      throw new RuntimeError(
        "The anchorPointsIndirect are required for 'Indirect' storage",
      );
    }
    if (!defined(this.intraTileCorrelationGroups)) {
      throw new RuntimeError(
        "The intraTileCorrelationGroups are required for 'Indirect' storage",
      );
    }
    if (defined(this.anchorPointsDirect)) {
      throw new RuntimeError(
        "The anchorPointsDirect must be omitted for 'Indirect' storage",
      );
    }
    if (defined(this.covarianceDirect)) {
      throw new RuntimeError(
        "The covarianceDirect must be omitted for 'Indirect' storage",
      );
    }
  } else {
    // Direct storage
    if (!defined(this.anchorPointsDirect)) {
      throw new RuntimeError(
        "The anchorPointsDirect are required for 'Direct' storage",
      );
    }
    if (!defined(this.covarianceDirect)) {
      throw new RuntimeError(
        "The covarianceDirect is required for 'Direct' storage",
      );
    }
    if (defined(this.anchorPointsIndirect)) {
      throw new RuntimeError(
        "The anchorPointsIndirect must be omitted for 'Direct' storage",
      );
    }
    if (defined(this.intraTileCorrelationGroups)) {
      throw new RuntimeError(
        "The intraTileCorrelationGroups must be omitted for 'Direct' storage",
      );
    }
  }
  //>>includeEnd('debug');
}

Object.defineProperties(GltfGpmLocal.prototype, {
  /**
   * 指定协方差存储是间接存储还是直接存储。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {StorageType}
   * @readonly
   */
  storageType: {
    get: function () {
      return this._storageType;
    },
  },

  /**
   * 存储的间接锚点数组
   *
   * @memberof GltfGpmLocal.prototype
   * @type {AnchorPointIndirect[]|undefined}
   * @readonly
   */
  anchorPointsIndirect: {
    get: function () {
      return this._anchorPointsIndirect;
    },
  },

  /**
   * 存储的直接锚点数组
   *
   * @memberof GltfGpmLocal.prototype
   * @type {AnchorPointDirect[]|undefined}
   * @readonly
   */
  anchorPointsDirect: {
    get: function () {
      return this._anchorPointsDirect;
    },
  },

  /**
   * 使用相同的关联建模标识参数的元数据，以及
   * 关联的相关参数
   *
   * @memberof GltfGpmLocal.prototype
   * @type {CorrelationGroup[]|undefined}
   * @readonly
   */
  intraTileCorrelationGroups: {
    get: function () {
      return this._intraTileCorrelationGroups;
    },
  },

  /**
   * 锚点参数的完全协方差
   *
   * @memberof GltfGpmLocal.prototype
   * @type {Matrix3|undefined}
   * @readonly
   */
  covarianceDirect: {
    get: function () {
      return this._covarianceDirect;
    },
  },
});

export default GltfGpmLocal;
