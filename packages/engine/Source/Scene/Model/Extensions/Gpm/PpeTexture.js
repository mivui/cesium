import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} PpeTexture.ConstructorOptions
 *
 * PpeTexture 构造函数的初始化选项
 *
 * @property {PpeMetadata} traits 指示此纹理中存储哪些数据的特征
 * @property {number} index glTF 纹理数组中纹理的索引
 * @property {number|undefined} [texCoord] TEXCOORD 属性的可选集合索引
 * @property {number|undefined} [noData] 表示缺失数据的值
 * @property {number|undefined} [offset] 应用于属性值的偏移量。
 * @property {number|undefined} [scale] 应用于属性值的缩放因子。
 */

/**
 * `NGA_gpm_local` 中的 PPE（逐点误差）纹理。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展中
 * `ppeTexture` 的定义。
 *
 * 这是一个有效的 glTF `TextureInfo` 对象（包含必需的 `index`
 * 和可选的 `texCoord`），带有描述存储在纹理中的元数据结构的附加属性。
 *
 * @constructor
 * @param {PpeTexture.ConstructorOptions} options 描述初始化选项的对象
 *
 * @private
 */
function PpeTexture(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.traits", options.traits);
  Check.typeOf.number.greaterThanOrEquals("options.index", options.index, 0);
  //>>includeEnd('debug');

  this._traits = options.traits;
  this._noData = options.noData;
  this._offset = options.offset;
  this._scale = options.scale;
  this._index = options.index;
  this._texCoord = options.texCoord;
}

Object.defineProperties(PpeTexture.prototype, {
  /**
   * 此处包含的数据适用于此节点和相应的纹理。
   *
   * @memberof PpeTexture.prototype
   * @type {PpeMetadata}
   * @readonly
   */
  traits: {
    get: function () {
      return this._traits;
    },
  },

  /**
   * 表示缺失数据的值（也称为哨兵值），出现在任何位置。
   *
   * @memberof PpeTexture.prototype
   * @type {number|undefined}
   * @readonly
   */
  noData: {
    get: function () {
      return this._noData;
    },
  },

  /**
   * 应用于属性值的偏移量。
   *
   * @memberof PpeTexture.prototype
   * @type {number|undefined}
   * @readonly
   */
  offset: {
    get: function () {
      return this._offset;
    },
  },

  /**
   * 应用于属性值的缩放因子。
   *
   * @memberof PpeTexture.prototype
   * @type {number|undefined}
   * @readonly
   */
  scale: {
    get: function () {
      return this._scale;
    },
  },

  /**
   * 纹理的索引
   *
   * @memberof PpeTexture.prototype
   * @type {number}
   * @readonly
   */
  index: {
    get: function () {
      return this._index;
    },
  },

  /**
   * 用于纹理坐标映射的纹理 TEXCOORD 属性的集合索引。
   *
   * @memberof PpeTexture.prototype
   * @type {number|undefined}
   * @readonly
   */
  texCoord: {
    get: function () {
      return this._texCoord;
    },
  },
});

export default PpeTexture;
