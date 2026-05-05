import DeveloperError from "../Core/DeveloperError.js";
import VoxelBoxShape from "./VoxelBoxShape.js";
import VoxelCylinderShape from "./VoxelCylinderShape.js";
import VoxelEllipsoidShape from "./VoxelEllipsoidShape.js";

/**
 * 体素形状的枚举。形状控制体素网格如何映射到 3D 空间。
 *
 * @enum {string}
 *
 * @experimental 此功能尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
const VoxelShapeType = {
  /**
   * A box shape.
   *
   * @type {string}
   * @constant
   * @private
   */
  BOX: "BOX",
  /**
   * An ellipsoid shape.
   *
   * @type {string}
   * @constant
   * @private
   */
  ELLIPSOID: "ELLIPSOID",
  /**
   * A cylinder shape.
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
 * Converts a shape type to a constructor that can be used to create a shape
 * object or get per-shape properties like DefaultMinBounds and
 * DefaultMaxBounds.
 *
 * @param {VoxelShapeType} shapeType The shape type.
 * @returns {Function} The shape's constructor.
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

Object.freeze(VoxelShapeType);

export default VoxelShapeType;
