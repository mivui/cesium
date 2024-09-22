import DeveloperError from "../Core/DeveloperError.js";

/**
 * 隐式图块集的细分方案。
 *
 * @enum {string}
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
const ImplicitSubdivisionScheme = {
  /**
   * 四叉树将父瓦片划分为四个子瓦片，在中点处分割
   边界框的 x 和 y 尺寸 *
   * @type {string}
   * @constant
   * @private
   */
  QUADTREE: "QUADTREE",
  /**
   * 八叉树将父图块划分为 8 个子图块，在中点处分割
   * 边界框的 x、y 和 z 维度。
   * @type {string}
   * @constant
   * @private
   */
  OCTREE: "OCTREE",
};

/**
 * 获取给定细分方案的分支因子
 * @param {ImplicitSubdivisionScheme} subdivisionScheme 细分方案
 * @returns {number} 分支因子，4 表示 QUADTREE，8 表示 OCTREE
 * @private
 */
ImplicitSubdivisionScheme.getBranchingFactor = function (subdivisionScheme) {
  switch (subdivisionScheme) {
    case ImplicitSubdivisionScheme.OCTREE:
      return 8;
    case ImplicitSubdivisionScheme.QUADTREE:
      return 4;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("subdivisionScheme is not a valid value.");
    //>>includeEnd('debug');
  }
};

export default Object.freeze(ImplicitSubdivisionScheme);
