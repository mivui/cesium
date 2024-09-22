import DeveloperError from "../Core/DeveloperError.js";
import VoxelBoxShape from "./VoxelBoxShape.js";
import VoxelCylinderShape from "./VoxelCylinderShape.js";
import VoxelEllipsoidShape from "./VoxelEllipsoidShape.js";

/**
 * 体素形状的枚举。形状控制体素网格映射到 3D 空间的方式。
 *
 * @enum {string}
 *
 * @experimental 此功能不是最终功能，在没有 Cesium 的标准弃用政策的情况下可能会发生变化。
 */
const VoxelShapeType = {
  /**
   * 一个盒子形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  BOX: "BOX",
  /**
   * 椭球体形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  ELLIPSOID: "ELLIPSOID",
  /**
   * 圆柱体形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  CYLINDER: "CYLINDER",
};

/**
 * 获取最小边界。
 * @param {VoxelShapeType} shapeType 体素形状类型。
 * @returns {Cartesian3} 最小边界。
 */
VoxelShapeType.getMinBounds = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape.DefaultMinBounds;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape.DefaultMinBounds;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape.DefaultMinBounds;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

/**
 * 获取最大边界。
 * @param {VoxelShapeType} shapeType 体素形状类型。
 * @returns {Cartesian3} 最大边界。
 */
VoxelShapeType.getMaxBounds = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape.DefaultMaxBounds;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape.DefaultMaxBounds;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape.DefaultMaxBounds;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

/**
 * 将形状类型转换为可用于创建形状的构造函数
 * 对象或获取每个形状的属性，如 DefaultMinBounds 和
 * DefaultMaxBounds 的
 *
 * @param {VoxelShapeType} shapeType 形状类型。
 * @returns {Function} 形状的构造函数。
 *
 * @private
 */
VoxelShapeType.getShapeConstructor = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

export default Object.freeze(VoxelShapeType);
